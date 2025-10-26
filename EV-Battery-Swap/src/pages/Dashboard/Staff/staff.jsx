// src/pages/Dashboard/Staff/staff.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import './staff.css';
import API_BASE_URL from '../../../config';
import DispatchPanel from './Dispatch/DispatchPanel';

const tabs = [
  { label: 'Tồn kho pin', value: 'inventory' },
  { label: 'Check In', value: 'checkin' },
  { label: 'Tạo Booking', value: 'create' },
];

/* ========= MessageBox ========= */
function MessageBox({ open, title, children, onClose, tone = 'info' }) {
  if (!open) return null;
  const ICON = { success: '✅', error: '⚠️', info: 'ℹ️' }[tone] || 'ℹ️';
  return (
    <div className="msgbox-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className={`msgbox ${tone}`} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <div className="msgbox-header">
          <span className="msgbox-icon" aria-hidden>{ICON}</span>
          <h3 className="msgbox-title">{title}</h3>
        </div>
        <div className="msgbox-body">{children}</div>
        <div className="msgbox-actions">
          <button className="detail-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

/* ====== Mockup trụ ====== */
function PinStationMockup({ batteries }) {
  const [selected, setSelected] = useState(null);
  const totalSlots = 30;
  const filled = (batteries || []).slice(0, totalSlots);
  const emptySlots = totalSlots - filled.length;
  const allSlots = [
    ...filled,
    ...Array.from({ length: Math.max(0, emptySlots) }, (_, i) => ({
      id: `EMPTY${i + 1}`,
      type: 'Chưa có pin',
      status: 'Trống',
      state: 'Empty',
      condition: '-',
      soh: 0,
      location: '-',
      lastCharge: '-',
      empty: true,
      code: '-',
    })),
  ];

  return (
    <div className="station-mockup-minimal">
      <div className="station-mockup-minimal-inner">
        <div className="station-mockup-minimal-screen"></div>
        <div className="station-mockup-minimal-grid">
          {allSlots.map((b, i) => {
            const st = String(b.state || '').toLowerCase();
            const cd = String(b.condition || '').toLowerCase();
            const color =
              b.empty ? '#e5e7eb' :
              cd === 'damage' || cd === 'damaged' ? '#000000' :
              cd === 'weak' || st === 'charging' ? '#ef4444' :
              st === 'reserved' || st === 'reversed' ? '#fbbf24' :
              (st === 'occupied' && cd === 'good') ? '#22c55e' :
              '#d1d5db';
            return (
              <div
                key={b.id}
                className={
                  'station-mockup-minimal-battery' +
                  (selected === i ? ' selected' : '') +
                  (b.empty ? ' empty' : '')
                }
                onClick={() => setSelected(i)}
                title={b.id}
                style={{ cursor: 'pointer' }}
              >
                <span
                  className="station-mockup-minimal-dot"
                  style={{
                    background: color,
                    border: `2.5px solid ${color}`,
                    boxShadow:
                      b.empty || color === '#000000'
                        ? 'none'
                        : `0 0 14px 3px ${color}55`,
                    opacity: b.empty ? 0.6 : 1,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {selected !== null && (
        <div className="station-popup">
          {allSlots[selected].empty ? (
            <>
              <strong>{allSlots[selected].id}</strong> - <em>Ô trống</em><br />
              <span>Hiện tại chưa có pin trong ô này.</span><br />
              <span>Vị trí: <b>{allSlots[selected].location || '-'}</b></span><br />
            </>
          ) : (
            <>
              <strong>{allSlots[selected].id}</strong> - {allSlots[selected].type}<br />
              <span>Trạng thái: <b>{allSlots[selected].status}</b></span><br />
              <span>Sức khỏe: <b>{allSlots[selected].soh}%</b></span><br />
              <span>Vị trí: <b>{allSlots[selected].location}</b></span><br />
              <span>Mã slot: <b>{allSlots[selected].code || '-'}</b></span><br />
              <span>Sạc lần cuối: <b>{allSlots[selected].lastCharge}</b></span><br />
            </>
          )}
          <button className="station-popup-close" onClick={() => setSelected(null)}>Đóng</button>
        </div>
      )}
    </div>
  );
}

/* ====== TRANG CHÍNH ====== */
export default function StaffDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('inventory');

  // Query param tab (để hiển thị Dispatch)
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab'); // 'dispatch' | null
  const role = (user?.role || '').toLowerCase();
  const isManager = role === 'manager';

  // Nếu truy cập /dashboard/staff?tab=dispatch → chỉ manager được dùng
  if (tab === 'dispatch') {
    if (!isManager) return <Navigate to="/dashboard/staff" replace />;
    return <DispatchPanel user={user} />; // Trang Điều phối pin cho manager
  }

  // ====== State API dashboard staff ======
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [slots, setSlots] = useState([]);

  // Tạo Booking
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsErr, setStationsErr] = useState(null);

  const [email, setEmail] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Modal trụ
  const [showStationModal, setShowStationModal] = useState(false);
  const [showStationModalLFP, setShowStationModalLFP] = useState(false);

  // Popup
  const [checkinPopup, setCheckinPopup] = useState(null);
  const [createPopup, setCreatePopup] = useState(null);

  // ====== Fetch slots ======
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
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
            soh: firstDefined(x.BatterySoH, x.batterySoH, x.batterySoH, x.soh, 0),
            serial: firstDefined(x.BatterySerial, x.batterySerial, x.batterySerial, x.serial, null),
            stationId: firstDefined(x.Station_ID, x.station_ID, x.stationId, null),
            chargingStationId: firstDefined(x.ChargingStation_ID, x.chargingStation_ID, x.chargingStationId, null),
            chargingSlotType: firstDefined(x.ChargingSlotType, x.chargingSlotType, x.slot_Type, ''),
            chargingStationName: firstDefined(x.ChargingStationName, x.chargingStationName, 'Station'),
            lastUpdate: firstDefined(x.Last_Update, x.last_Update, x.lastUpdate, ''),
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

    // Fetch stations
    (async () => {
      try {
        setStationsLoading(true);
        setStationsErr(null);
        const token = localStorage.getItem('authToken') || '';
        const res = await fetch(`${API_BASE_URL}/webAPI/api/getstations`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': '1',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const ct = res.headers.get('content-type') || '';
        let payload = {};
        if (ct.includes('application/json')) payload = await res.json().catch(() => ({}));
        else {
          const t = await res.text();
          payload = { status: 'error', message: t };
        }

        if (!res.ok) throw new Error(payload.message || `HTTP ${res.status}`);
        if (payload.status !== 'success') throw new Error(payload.message || 'Không lấy được danh sách trạm');

        const list = Array.isArray(payload.data) ? payload.data : [];
        setStations(list);

        if (list.length && !selectedStation) {
          const firstName =
            list[0].Name ?? list[0].station_Name ?? list[0].Station_Name ?? list[0].name ?? '';
          setSelectedStation(firstName || '');
        }
      } catch (e) {
        setStationsErr(e.message || 'Không tải được danh sách trạm');
        setStations([]);
      } finally {
        setStationsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []); // eslint-disable-line

  // ====== Helpers & KPI ======
  const getChemFromChargingStationId = (id) => {
    if (!id) return 'unknown';
    if (id === 11) return 'lfp';
    if (id === 12) return 'li';
    if (id % 2 === 1) return 'li';
    if (id % 2 === 0) return 'lfp';
    return 'unknown';
  };

  const toUiBattery = (s) => ({
    id: s.serial || s.code || `S${s.slotId}`,
    type: s.chargingSlotType || '—',
    status: s.state || '-',
    state: s.state || '-',
    condition: s.condition || '-',
    soh: Number(s.soh || 0),
    location: s.chargingStationName || s.code || '-',
    lastCharge: s.lastUpdate || '-',
    code: s.code || '-',
    action: 'Chi tiết',
  });

  const lithiumFromApi = useMemo(
    () =>
      slots
        .filter((s) => {
          const txt = String(s.chargingSlotType || '').toLowerCase();
          if (txt.includes('lithium')) return true;
          if (txt.includes('li-ion') || txt.includes('li ion')) return true;
          return getChemFromChargingStationId(s.chargingStationId) === 'li';
        })
        .map(toUiBattery),
    [slots]
  );

  const lfpFromApi = useMemo(
    () =>
      slots
        .filter((s) => {
          const txt = String(s.chargingSlotType || '').toLowerCase();
          if (txt.includes('lfp')) return true;
          return getChemFromChargingStationId(s.chargingStationId) === 'lfp';
        })
        .map(toUiBattery),
    [slots]
  );

  const summary = useMemo(() => {
    let full = 0, charging = 0, maintenance = 0, reserved = 0;
    for (const s of slots) {
      const st = String(s.state || '').trim().toLowerCase();
      const cd = String(s.condition || '').trim().toLowerCase();
      const isReserved    = (st === 'reserved' || st === 'reversed');
      const isFull        = (st === 'occupied' && cd === 'good');
      const isCharging    = (st === 'charging' || cd === 'weak' || cd === 'charging');
      const isMaintenance = (cd === 'damage' || cd === 'damaged');
      if (isReserved) reserved++;
      else if (isMaintenance) maintenance++;
      else if (isCharging) charging++;
      else if (isFull) full++;
    }
    return { full, charging, maintenance, reserved };
  }, [slots]);

  const kpis = [
    { icon: '🟢', label: 'Pin đầy',   value: summary.full,        sub: 'Sẵn sàng sử dụng' },
    { icon: '🔌', label: 'Đang sạc',  value: summary.charging,    sub: 'Đang nạp điện / Weak' },
    { icon: '⚠️', label: 'Bảo dưỡng', value: summary.maintenance, sub: 'Damaged' },
    { icon: '🟡', label: 'Đặt trước', value: summary.reserved,    sub: 'Reserved/Reversed' },
  ];

  // ====== Check-in ======
  const [bookingId, setBookingId] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    const id = bookingId.trim();
    if (!id) return;

    try {
      setCheckingIn(true);
      const token = localStorage.getItem('authToken') || '';
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'ngrok-skip-browser-warning': '1',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const body = new URLSearchParams({ bookingId: id });

      const res = await fetch(`${API_BASE_URL}/webAPI/api/checkin`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body,
      });

      let data = {};
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) data = await res.json().catch(() => ({}));
      else {
        const text = await res.text();
        data = { error: text || `HTTP ${res.status}` };
      }

      if (!res.ok || data.error) {
        setCheckinPopup({ title: 'Check In thất bại', body: data.error || `HTTP ${res.status}` });
        return;
      }

      if (data.paymentUrl) {
        setCheckinPopup({
          title: 'Cần thanh toán trước khi đổi pin',
          body: (
            <>
              <div>Mã thanh toán: <b>{data.txnRef || '—'}</b></div>
              <div>Số tiền: <b>{Number(data.fee || 0).toLocaleString('vi-VN')} đ</b></div>
              <div style={{ marginTop: 8 }}>
                <a href={data.paymentUrl} target="_blank" rel="noreferrer" className="detail-btn">Mở VNPay</a>
              </div>
            </>
          ),
        });
        return;
      }

      setCheckinPopup({ title: 'Check In thành công', body: data.message || 'Đã xác nhận check-in.' });
    } catch (err) {
      setCheckinPopup({ title: 'Lỗi kết nối', body: String(err?.message || err) });
    } finally {
      setCheckingIn(false);
    }
  };

  // ====== Tạo Booking ======
  const fetchVehiclesByEmail = async () => {
    const mail = email.trim();
    if (!mail) return;
    try {
      setLoadingVehicles(true);
      const token = localStorage.getItem('authToken') || '';
      const qs = new URLSearchParams({ email: mail, station: selectedStation || '' }).toString();
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/staffBooking?${qs}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      const vs = Array.isArray(data.vehicles) ? data.vehicles : [];
      setVehicles(vs);
      setSelectedVehicle(vs.length > 0 ? String(vs[0].vehicleId) : '');
      setCreatePopup({
        title: 'Đã tải danh sách xe',
        body: vs.length ? `Tìm thấy ${vs.length} xe. Hãy chọn 1 xe để tạo booking.` : 'Không có xe nào cho email này.',
      });
    } catch (e) {
      setVehicles([]);
      setSelectedVehicle('');
      setCreatePopup({ title: 'Lỗi', body: e.message || 'Không tải được xe' });
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleCreateBooking = async () => {
    const mail = email.trim();
    if (!mail || !selectedStation || !selectedVehicle) {
      setCreatePopup({
        title: 'Thiếu thông tin',
        body: 'Vui lòng nhập Email, chọn Trạm và chọn Xe trước khi tạo booking.',
      });
      return;
    }
    try {
      setCreatingBooking(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/staffBooking`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json;charset=UTF-8',
          'ngrok-skip-browser-warning': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: mail,
          stationName: selectedStation,
          vehicleId: Number(selectedVehicle)
        }),
      });

      let data = {};
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) data = await res.json().catch(() => ({}));
      else {
        const t = await res.text();
        data = { error: t || `HTTP ${res.status}` };
      }

      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      setCreatePopup({
        title: 'Tạo booking thành công',
        body: (
          <div>
            <div>Booking ID: <b>{data.bookingId}</b></div>
            <div>Trạng thái: <b>{data.status}</b></div>
            <div>Hết hạn: <b>{data.expiredTime}</b></div>
            {data.qrCode && (
              <div style={{ marginTop: 8 }}>
                <img alt="QR" src={`data:image/png;base64,${data.qrCode}`} style={{ maxWidth: 180 }} />
              </div>
            )}
          </div>
        ),
      });
    } catch (e) {
      setCreatePopup({ title: 'Tạo booking thất bại', body: e.message || 'Không tạo được booking' });
    } finally {
      setCreatingBooking(false);
    }
  };

  return (
    <div className="staff-dashboard-wrap">
      {/* Panel ảnh 2 trụ */}
      <div className="staff-right-panel" style={{ display: 'flex', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="/ping.jpg"
            alt="Trụ Li-ion"
            className="staff-right-image"
            onClick={() => setShowStationModal(true)}
            style={{ cursor: 'pointer' }}
          />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Trụ Li-ion</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <img
            src="/ping.jpg"
            alt="Trụ LFP"
            className="staff-right-image"
            onClick={() => setShowStationModalLFP(true)}
            style={{ cursor: 'pointer' }}
          />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Trụ LFP</div>
        </div>
      </div>

      {/* Card dashboard */}
      <div className="staff-dashboard-card">
        <h2 className="staff-dashboard-title">Dashboard Nhân viên Trạm</h2>
        <div className="staff-dashboard-subtitle">Quản lý tồn kho pin và Check In</div>

        {/* KPI */}
        <div className="staff-dashboard-summary">
          {kpis.map((c, i) => (
            <div key={i} className="staff-dashboard-summary-card">
              <div className="staff-dashboard-summary-icon">{c.icon}</div>
              <div className="staff-dashboard-summary-value">{c.value}</div>
              <div className="staff-dashboard-summary-label">{c.label}</div>
              <div className="staff-dashboard-summary-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="staff-dashboard-tabs">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={'staff-dashboard-tab-btn' + (activeTab === tab.value ? ' active' : '')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Nội dung tab */}
        <div>
          {activeTab === 'inventory' && (
            <div className="staff-inventory-section">
              <div className="staff-inventory-title">Tình trạng trụ</div>
              <div className="staff-inventory-desc">Nhấn vào ảnh trụ ở trên để xem sơ đồ ô.</div>
              {err && <div style={{ color: '#ef4444', marginTop: 8 }}>{err}</div>}
              {loading && <div style={{ marginTop: 8 }}>Đang tải dữ liệu…</div>}
            </div>
          )}

          {activeTab === 'checkin' && (
            <div className="staff-transaction-section">
              <div className="staff-transaction-title">Check In</div>
              <div className="staff-transaction-desc">Nhập Booking ID của khách để tiến hành Check In.</div>

              <form onSubmit={handleCheckIn} className="checkin-form">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập Booking ID"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="input"
                  style={{ maxWidth: 280, marginRight: 12 }}
                />
                <button type="submit" className="detail-btn" disabled={checkingIn || !bookingId.trim()}>
                  {checkingIn ? 'Đang xử lý…' : 'Check In'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="staff-transaction-section">
              <div className="staff-transaction-title">Tạo Booking</div>
              <div className="staff-transaction-desc">
                Nhập <b>Email</b> khách hàng, chọn <b>Trạm</b> & <b>Xe</b> để tạo booking.
              </div>

              {/* Email + Lấy xe */}
              <div className="row">
                <label className="lbl">Email khách hàng</label>
                <div className="row-inline">
                  <input
                    type="email"
                    placeholder="vd: khach@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input grow"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={fetchVehiclesByEmail}
                    disabled={!email.trim() || loadingVehicles}
                    title="Tải xe theo email"
                  >
                    {loadingVehicles ? 'Đang tải…' : 'Lấy xe'}
                  </button>
                </div>
              </div>

              {/* Trạm */}
              <div className="row">
                <label className="lbl">Chọn trạm</label>
                <select
                  className="input"
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                >
                  {stationsLoading && <option>Đang tải trạm…</option>}
                  {!stationsLoading && stations.length === 0 && <option value="">Không có dữ liệu trạm</option>}
                  {!stationsLoading && stations.map((s) => {
                    const key = s.Station_ID ?? s.station_ID ?? s.id;
                    const label = s.Name ?? s.station_Name ?? s.Station_Name ?? s.name ?? `Station #${key ?? ''}`;
                    return (
                      <option key={key} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {stationsErr && <small className="hint error">{stationsErr}</small>}
              </div>

              {/* Xe */}
              <div className="row">
                <label className="lbl">Chọn xe</label>
                <select
                  className="input"
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  disabled={vehicles.length === 0}
                >
                  {vehicles.length === 0 && <option value="">Chưa có xe — hãy “Lấy xe”</option>}
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      #{v.vehicleId} — {v.modelName || v.brand || 'Xe'} ({v.batteryType || '—'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút tạo */}
              <div className="row">
                <button
                  type="button"
                  className="detail-btn"
                  onClick={handleCreateBooking}
                  disabled={creatingBooking || !email.trim() || !selectedStation || !selectedVehicle}
                >
                  {creatingBooking ? 'Đang tạo…' : 'Tạo Booking'}
                </button>
                <small className="hint">Hệ thống sẽ tự giữ pin phù hợp tại trạm trong 1 giờ.</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal trụ Li-ion */}
      {showStationModal && (
        <div className="station-modal-backdrop" onClick={() => setShowStationModal(false)}>
          <div className="station-modal" onClick={(e) => e.stopPropagation()}>
            {loading && <div>Đang tải dữ liệu…</div>}
            {err && <div style={{ color: '#ef4444' }}>{err}</div>}
            {!loading && <PinStationMockup batteries={lithiumFromApi} />}
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <button className="detail-btn" onClick={() => setShowStationModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal trụ LFP */}
      {showStationModalLFP && (
        <div className="station-modal-backdrop" onClick={() => setShowStationModalLFP(false)}>
          <div className="station-modal" onClick={(e) => e.stopPropagation()}>
            {loading && <div>Đang tải dữ liệu…</div>}
            {err && <div style={{ color: '#ef4444' }}>{err}</div>}
            {!loading && <PinStationMockup batteries={lfpFromApi} />}
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <button className="detail-btn" onClick={() => setShowStationModalLFP(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Check In */}
      <MessageBox
        open={!!checkinPopup}
        title={checkinPopup?.title || ''}
        onClose={() => setCheckinPopup(null)}
        tone={
          checkinPopup?.title?.toLowerCase().includes('thất bại') ? 'error' :
          checkinPopup?.title?.toLowerCase().includes('thành công') ? 'success' :
          'info'
        }
      >
        <div className="msgbox-content">{checkinPopup?.body}</div>
      </MessageBox>

      {/* Popup Tạo Booking */}
      <MessageBox
        open={!!createPopup}
        title={createPopup?.title || ''}
        onClose={() => setCreatePopup(null)}
        tone={
          createPopup?.title?.toLowerCase().includes('thành công') ? 'success' :
          createPopup?.title?.toLowerCase().includes('lỗi') ? 'error' :
          createPopup?.title?.toLowerCase().includes('thất bại') ? 'error' :
          'info'
        }
      >
        <div className="msgbox-content">{createPopup?.body}</div>
      </MessageBox>
    </div>
  );
}
