import React, { useEffect, useMemo, useState } from 'react';
import './staff.css';
import API_BASE_URL from '../../../config';

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedBattery, setSelectedBattery] = useState(null); // 👈 popup info

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (!API_BASE_URL) throw new Error('Missing API_BASE_URL');

        const token = localStorage.getItem('authToken') || '';
        const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/viewBatterySlotStatus`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!mounted) return;
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);

        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Unexpected payload');

        const normalized = data.map((x, i) => {
          const firstDefined = (...vals) => vals.find(v => v !== undefined && v !== null);
          return {
            slotId: firstDefined(x.Slot_ID, x.slot_ID, x.slotId, i + 1),
            code: firstDefined(x.Slot_Code, x.slot_Code, x.slotCode, `S${i + 1}`),
            state: String(firstDefined(x.State, x.state, '')).trim(),
            condition: String(firstDefined(x.Condition, x.condition, '')).trim(),
            door: String(firstDefined(x.Door_State, x.door_State, x.doorState, '')).trim(),
            batteryId: firstDefined(x.Battery_ID, x.battery_ID, x.batteryId, null),
            soh: firstDefined(x.BatterySoH, x.batterySoH, x.batterySoH, x.soh, null),
            serial: firstDefined(x.BatterySerial, x.batterySerial, x.batterySerial, x.serial, null),
            stationId: firstDefined(x.Station_ID, x.station_ID, x.stationId, null),
            chargingStationId: firstDefined(x.ChargingStation_ID, x.chargingStation_ID, x.chargingStationId, null),
            chargingStationName: firstDefined(x.ChargingStationName, x.chargingStationName, 'Station'),
            lastUpdate: firstDefined(x.Last_Update, x.last_Update, x.lastUpdate, null),
          };
        });

        setSlots(normalized);
      } catch (e) {
        setErr(e.message || 'Failed to load slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ---- Helper: tên trạm gốc ----
  const toBaseStationName = (name) => {
    if (!name) return 'Station';
    const m = String(name).match(/^(.*?)(?:\s*-\s*CS#\d+)?$/i);
    return (m?.[1] || name).trim();
  };

  // ---- Helper: màu theo trạng thái ----
  const colorClass = (s) => {
    const state = (s.state || '').toLowerCase();
    const cond  = (s.condition || '').toLowerCase();
    if (cond === 'damage' || cond === 'damaged') return 'damage';
    if (cond === 'weak' || cond === 'charging')  return 'weak';
    if (state === 'reserved' || state === 'reserve') return 'reserved';
    if (state === 'occupied' && cond === 'good')  return 'good';
    return 'empty';
  };

  // ---- Xác định loại pin từ ID trụ sạc ----
  const getChemFromChargingStationId = (id) => {
    if (!id) return 'unknown';
    if (id === 11) return 'lfp';
    if (id === 12) return 'li';
    if (id % 2 === 1) return 'li';
    if (id % 2 === 0) return 'lfp';
    return 'unknown';
  };

  // ---- Gom theo Station_ID ----
  const groupedByStation = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      const stationKey = String(s.stationId ?? 'unknown');
      const baseName = toBaseStationName(s.chargingStationName);
      if (!map.has(stationKey)) {
        map.set(stationKey, { name: baseName, li: [], lfp: [], rest: [] });
      }
      const g = map.get(stationKey);
      const chem = getChemFromChargingStationId(s.chargingStationId);
      if (chem === 'li') g.li.push(s);
      else if (chem === 'lfp') g.lfp.push(s);
      else g.rest.push(s);
    }

    for (const g of map.values()) {
      g.li.sort((a,b) => (a.slotId??0)-(b.slotId??0));
      g.lfp.sort((a,b) => (a.slotId??0)-(b.slotId??0));
      g.rest.sort((a,b) => (a.slotId??0)-(b.slotId??0));
    }
    return map;
  }, [slots]);

  // 🔍 Khi click vào 1 slot → gọi API lấy thông tin pin
const handleViewBatteryInfo = async (slotId) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }

    console.log(`[DEBUG] SlotID = ${slotId}, token = ${token.substring(0, 15)}...`);

    const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/getBatteryInfo?slotId=${slotId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'Authorization': `Bearer ${token}` // ✅ chuẩn cho JwtAuthFilter
      },
      credentials: 'include'
    });

    console.log('[DEBUG] Status:', res.status);

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.warn('[DEBUG] Response error:', data);
      alert(data.message || 'Không thể lấy thông tin pin.');
      return;
    }

    console.log('[DEBUG] Battery info data:', data);
    setSelectedBattery(data);

  } catch (err) {
    console.error('[DEBUG] Fetch error:', err);
    alert('Lỗi khi lấy thông tin pin.');
  }
};
  // 🔲 UI của từng slot
  const SlotCard = ({ s }) => (
    <div
      className={`visual-slot ${colorClass(s)}`}
      onClick={() => handleViewBatteryInfo(s.slotId)} // 👈 click để xem chi tiết
      title={`#${s.slotId} ${s.code}\nClick để xem thông tin pin`}
    >
      <div className="visual-slot-index">{s.code}</div>
      <div className="visual-slot-status">
        {(s.state || '-')} • {(s.condition || '-')}
      </div>
    </div>
  );

  return (
    <main style={{ padding: 0, margin: 0, width: '100%' }}>
      <div className="staff-container">
        <h1>Station Slot Management</h1>

        {loading && <div className="info-banner">Loading slots…</div>}
        {err && !loading && (
          <div className="error-banner">
            <div>Không tải được dữ liệu slot.</div>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{err}</pre>
          </div>
        )}

        <div className="legend">
          <span className="legend-item"><i className="legend-box good" /> Good</span>
          <span className="legend-item"><i className="legend-box reserved" /> Reserved</span>
          <span className="legend-item"><i className="legend-box weak" /> Weak</span>
          <span className="legend-item"><i className="legend-box damage" /> Damage</span>
          <span className="legend-item"><i className="legend-box empty" /> Empty</span>
        </div>

        {!loading && !err && [...groupedByStation.entries()].map(([stationKey, g]) => (
          <section key={stationKey} className="station-section">
            <div className="station-title">
              <strong>Station:</strong> {g.name}
            </div>
            <div className="visual-slots-container">
              <div className="visual-half">
                <div className="visual-half-title">Lithium-ion</div>
                <div className="visual-grid">
                  {g.li.length ? g.li.map(s => <SlotCard key={`li-${s.slotId}`} s={s} />) : <div style={{opacity:.6}}>No data</div>}
                </div>
              </div>
              <div className="visual-half">
                <div className="visual-half-title">LFP</div>
                <div className="visual-grid">
                  {g.lfp.length ? g.lfp.map(s => <SlotCard key={`lfp-${s.slotId}`} s={s} />) : <div style={{opacity:.6}}>No data</div>}
                </div>
              </div>
            </div>
            {g.rest.length > 0 && (
              <>
                <div className="visual-half-title" style={{marginTop:16}}>Unknown Type</div>
                <div className="visual-grid">
                  {g.rest.map(s => <SlotCard key={`u-${s.slotId}`} s={s} />)}
                </div>
              </>
            )}
          </section>
        ))}

        <div className="staff-action-bar">
          <button className="staff-action-btn">Check-in</button>
          <button className="staff-action-btn">Create booking</button>
          <button className="staff-action-btn">View booking</button>
        </div>
      </div>

      {/* 💡 Modal hiển thị thông tin pin */}
      {selectedBattery && (
        <div className="battery-modal-backdrop" onClick={() => setSelectedBattery(null)}>
          <div className="battery-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Battery Information</h2>
            <p><b>Slot:</b> {selectedBattery.slotCode}</p>
            <p><b>Station:</b> {selectedBattery.stationName}</p>
            <p><b>Serial Number:</b> {selectedBattery.serialNumber}</p>
            <p><b>Resistance:</b> {selectedBattery.resistance} Ω</p>
            <p><b>State of Health (SoH):</b> {selectedBattery.soH}%</p>
            <p><b>Condition:</b> {selectedBattery.condition}</p>
            <p><b>Last Update:</b> {selectedBattery.lastUpdate}</p>
            <button onClick={() => setSelectedBattery(null)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
