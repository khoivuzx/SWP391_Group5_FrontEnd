import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header/Header';
import API_BASE_URL from '../../../config';
import './admin.css';

/* ---------------- Mini BarChart (no lib) ---------------- */
function SimpleBarChart({ data = [], height = 220, yLabel = 'Lượt đổi' }) {
  const max = useMemo(() => Math.max(1, ...data.map(d => d.value || 0)), [data]);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{yLabel}</div>
      <div
        style={{
          height,
          display: 'grid',
          gridTemplateColumns: `repeat(${data.length || 1}, 1fr)`,
          gap: 10,
          alignItems: 'end',
          padding: '8px 4px',
          background: '#f7fafc',
          borderRadius: 12,
        }}
      >
        {data.map((d, idx) => {
          const h = Math.round(((d.value || 0) / max) * (height - 50));
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                title={`${d.label}: ${d.value.toLocaleString('vi-VN')}`}
                style={{
                  height: Math.max(6, h),
                  width: '100%',
                  borderRadius: 8,
                  background: '#1976d2',
                  boxShadow: '0 2px 6px rgba(25,118,210,0.24)',
                  transition: 'height .25s ease',
                }}
              />
              <div style={{ fontSize: 12, color: '#0f172a', marginTop: 6, textAlign: 'center', wordBreak: 'break-word' }}>
                {d.value.toLocaleString('vi-VN')}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, textAlign: 'center', maxWidth: 120 }}>
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function normalizeStations(rows = []) {
  return rows.map((r) => {
    const name =
      r.Station_Name || r.station_name || r.stationName || r.Name || r.name || `Trạm ${r.Station_ID || r.id || ''}`;
    const count = r.swapCount ?? r.total_swaps ?? r.TotalSwaps ?? r.totalSwaps ?? r.swaps ?? r.Swaps ?? r.count ?? 0;
    return { label: String(name), value: Number(count) || 0 };
  });
}

const summaryCards = [
  { label: 'Tổng doanh thu tháng này', value: '65,000,000 đ', sub: '+12% so với tháng trước', icon: '📈' },
  { label: 'Tổng số trạm', value: '4', sub: '3 hoạt động, 1 bảo trì', icon: '🏢' },
  { label: 'Khách hàng', value: '1,234', sub: '+85 người dùng mới', icon: '🧑‍🤝‍🧑' },
  { label: 'Lượt đổi pin', value: '2,600', sub: 'Trung bình 87/ngày', icon: '🔄' },
];

const tabs = [
  { label: 'Tổng quan', value: 'overview' },
  { label: 'Quản lý trạm', value: 'station' },
  { label: 'Pin', value: 'user' },
  { label: 'Phân tích', value: 'analytics' },
];

/* ================== Panel Xem điều phối pin (trong cùng file) ================== */
function AdminDispatchPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt_token') ||
    '';

  const fetchPending = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/admindispatchPending`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
      });
      const text = await res.text();
      let data = [];
      try { data = text ? JSON.parse(text) : []; } catch { data = []; }
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || 'Không tải được danh sách yêu cầu.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const doAction = async (requestId, action) => {
    try {
      if (!token) throw new Error('Bạn chưa đăng nhập Admin.');
      let body = new URLSearchParams();
      body.set('requestId', String(requestId));
      body.set('action', action);

      if (action === 'approve') {
        const name = window.prompt('Nhập tên trạm xuất pin (stationRespondName):');
        if (!name) return;
        body.set('stationRespondName', name.trim());
      }

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchApprove`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
        body: body.toString(),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      await fetchPending();
      alert(action === 'approve' ? 'Đã chuyển yêu cầu sang PREPARING.' : 'Đã hủy yêu cầu.');
    } catch (e) {
      alert(e.message || 'Xử lý thất bại.');
    }
  };

  const table = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    boxShadow: '0 0 0 1px #e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  };
  const boxInfo = { padding: 12, borderRadius: 10, background: '#f7fafc', color: '#475569' };
  const boxError = { padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c' };
  const badge = { background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6, fontSize: 12 };
  const baseBtn = { padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 };
  const btnApprove = { ...baseBtn, background: '#16a34a', color: '#fff', borderColor: '#16a34a' };
  const btnCancel  = { ...baseBtn, background: '#fff', color: '#b91c1c', borderColor: '#fca5a5' };
  const btnRefresh = { ...baseBtn, background: '#fff', color: '#0f172a' };

  return (
    <div style={{ marginTop: 24, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(33,150,243,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>📦 Xem điều phối pin (yêu cầu đang chờ)</div>
        <button onClick={fetchPending} style={btnRefresh}>Làm mới</button>
      </div>

      {loading && <div style={boxInfo}>Đang tải danh sách…</div>}
      {!loading && err && <div style={boxError}>{err}</div>}
      {!loading && !err && rows.length === 0 && <div style={boxInfo}>Không có yêu cầu nào đang chờ.</div>}

      {!loading && !err && rows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Trạm yêu cầu</th>
                <th>Loại pin</th>
                <th>Tốt</th>
                <th>Trung bình</th>
                <th>Xấu</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.requestId ?? i}>
                  <td>{r.requestId}</td>
                  <td>{r.stationRequestName}</td>
                  <td>{r.batteryName}</td>
                  <td>{r.qtyGood}</td>
                  <td>{r.qtyAverage}</td>
                  <td>{r.qtyBad}</td>
                  <td><span style={badge}>{r.status}</span></td>
                  <td>{r.requestTime}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => doAction(r.requestId, 'approve')} style={btnApprove}>Chấp nhận</button>
                      <button onClick={() => doAction(r.requestId, 'cancel')} style={btnCancel}>Hủy</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================== Station Manager Panel (NEW) ================== */
function StationManagerPanel() {
  const [data, setData] = useState({ stations: [], totals: null });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState({}); // stationId -> bool
  const [editing, setEditing] = useState(null); // { station: {...}, list: [...], deleteMissing: false, saving: false }

  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt_token') ||
    '';

  const fetchStations = async () => {
    try {
      setLoading(true);
      setErr('');

      if (!token) throw new Error('Vui lòng đăng nhập Admin.');

      const url = `${API_BASE_URL}/webAPI/api/secure/viewStationUpdate`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
      });

      const raw = await res.text();
      const json = raw ? JSON.parse(raw) : {};
      if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);

      const stations = Array.isArray(json?.stations) ? json.stations : [];
      setData({ stations, totals: json?.totals ?? null });
    } catch (e) {
      setErr(e.message || 'Không tải được danh sách trạm.');
      setData({ stations: [], totals: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStations(); }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  /* ---------- mở modal sửa ---------- */
  const openEdit = (st) => {
    const stationId = st.Station_ID ?? st.stationId ?? st.id;
    const station = {
      Station_ID: stationId,
      Name: st.Name ?? st.Station_Name ?? '',
      Address: st.Address ?? ''
    };
    const list = (Array.isArray(st.chargingStations) ? st.chargingStations : []).map(cs => ({
      ChargingStation_ID: cs.ChargingStation_ID ?? cs.chargingStationId ?? 0,
      Station_ID: stationId,
      Name: cs.Name ?? '',
      Slot_Capacity: Number(cs.Slot_Capacity ?? 0) || 0,
      Slot_Type: (cs.Slot_Type ?? '').toString(),
      // ⚠️ Power_Rating là string (đã normalize ở BE), giữ nguyên chuỗi
      Power_Rating: cs.Power_Rating == null ? '' : String(cs.Power_Rating)
    }));
    setEditing({ station, list, deleteMissing: false, saving: false });
  };

  /* ---------- thêm/xoá/sửa hàng ---------- */
  const addRow = () => {
    setEditing(prev => ({
      ...prev,
      list: [
        ...prev.list,
        {
          ChargingStation_ID: 0,                // 0 => insert mới
          Station_ID: prev.station.Station_ID,
          Name: '',
          Slot_Capacity: 0,
          Slot_Type: 'li',
          Power_Rating: ''                      // chuỗi
        }
      ]
    }));
  };

  const removeRowLocal = (idx) => {
    setEditing(prev => {
      const copy = prev.list.slice();
      copy.splice(idx, 1);
      return { ...prev, list: copy };
    });
  };

  const changeCell = (idx, key, val) => {
    setEditing(prev => {
      const copy = prev.list.slice();
      copy[idx] = { ...copy[idx], [key]: key === 'Slot_Capacity' ? Number(val || 0) : val };
      return { ...prev, list: copy };
    });
  };

  /* ---------- gọi API update ---------- */
  const saveUpdate = async () => {
    try {
      if (!token) throw new Error('Vui lòng đăng nhập Admin.');
      setEditing(prev => ({ ...prev, saving: true }));

      const payload = {
        station: {
          Station_ID: editing.station.Station_ID,
          Name: (editing.station.Name || '').trim(),
          Address: editing.station.Address ?? null
        },
        chargingStations: editing.list.map(cs => ({
          ChargingStation_ID: Number(cs.ChargingStation_ID || 0), // 0 => insert
          Name: (cs.Name || '').trim(),
          Slot_Capacity: Number(cs.Slot_Capacity || 0),
          Slot_Type: (cs.Slot_Type || '').toString(),
          // ⚠️ giữ Power_Rating là string (không ép số, không thêm "kW")
          Power_Rating: (cs.Power_Rating ?? '').toString().trim()
        })),
        syncMode: editing.deleteMissing ? 'delete-missing' : 'keep-missing'
      };

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/updateStation`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      setEditing(null);
      await fetchStations();
      alert('Cập nhật trạm & trụ sạc thành công.');
    } catch (e) {
      alert(e.message || 'Cập nhật thất bại.');
    } finally {
      setEditing(prev => prev ? ({ ...prev, saving: false }) : prev);
    }
  };

  /* ---------- UI helpers ---------- */
  const shell = {
    background: '#fff',
    borderRadius: 12,
    padding: 18,
    boxShadow: '0 1px 4px rgba(33,150,243,0.06)',
  };
  const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 };
  const baseBtn = { padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 };
  const btnRefresh = { ...baseBtn, background: '#fff', color: '#0f172a' };
  const btnEdit = { ...baseBtn, background: '#2563eb', color: '#fff', borderColor: '#2563eb' };
  const boxInfo = { padding: 12, borderRadius: 10, background: '#f7fafc', color: '#475569' };
  const boxError = { padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c' };
  const badge = { background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6, fontSize: 12 };

  return (
    <div style={shell}>
      <div style={header}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>🏢 Danh sách trạm & trụ sạc</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {data.totals && (
            <span style={badge}>
              Trạm: {Number(data.totals.stations || 0)} • Trụ sạc: {Number(data.totals.charging_stations || 0)}
            </span>
          )}
          <button onClick={fetchStations} style={btnRefresh}>Làm mới</button>
        </div>
      </div>

      {loading && <div style={boxInfo}>Đang tải danh sách…</div>}
      {!loading && err && <div style={boxError}>{err}</div>}

      {!loading && !err && data.stations.length === 0 && (
        <div style={boxInfo}>Chưa có trạm nào trong hệ thống.</div>
      )}

      {!loading && !err && data.stations.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {data.stations.map((st) => {
            const stationId = st.Station_ID ?? st.stationId ?? st.id;
            const name = st.Name ?? st.Station_Name ?? st.name ?? `Trạm #${stationId}`;
            const addr = st.Address ?? st.address ?? '';
            const list = Array.isArray(st.chargingStations) ? st.chargingStations : [];
            const isOpen = !!expanded[stationId];

            return (
              <div key={stationId} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  onClick={() => toggle(stationId)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{addr}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={btnEdit} onClick={(e) => { e.stopPropagation(); openEdit(st); }}>
                      Sửa
                    </button>
                    <div style={{ fontSize: 12, color: '#334155' }}>
                      {isOpen ? 'Ẩn' : 'Hiện'} trụ sạc • {list.length} trụ
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: 12 }}>
                    {list.length === 0 && (
                      <div style={{ padding: 10, borderRadius: 8, background: '#fff7ed', color: '#b45309' }}>
                        Trạm này chưa có trụ sạc.
                      </div>
                    )}

                    {list.length > 0 && (
                      <div style={{ overflowX: 'auto' }}>
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'separate',
                            borderSpacing: 0,
                            boxShadow: '0 0 0 1px #e5e7eb',
                            borderRadius: 10,
                            overflow: 'hidden',
                          }}
                        >
                          <thead>
                            <tr>
                              <th style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7', textAlign: 'left' }}>#CS</th>
                              <th style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7', textAlign: 'left' }}>Tên trụ</th>
                              <th style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7', textAlign: 'left' }}>Sức chứa</th>
                              <th style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7', textAlign: 'left' }}>Loại slot</th>
                              <th style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7', textAlign: 'left' }}>Công suất</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((cs) => {
                              const id = cs.ChargingStation_ID ?? cs.chargingStationId ?? cs.id;
                              const nm = cs.Name ?? cs.name ?? `CS-${id}`;
                              const cap = cs.Slot_Capacity ?? cs.slotCapacity ?? 0;
                              const type = cs.Slot_Type ?? cs.slotType ?? '';
                              // ⚠️ power là string — hiển thị nguyên văn, không Number()
                              const power = cs.Power_Rating ?? cs.powerRating ?? '';
                              return (
                                <tr key={id}>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7' }}>{id}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7' }}>{nm}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7' }}>{cap}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7' }}>{type}</td>
                                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #eef2f7' }}>{power || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== Modal Sửa Station + Charging Stations ===== */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60 }}
        >
          <div onClick={(e)=>e.stopPropagation()} style={{ width:860, maxHeight:'90vh', overflow:'auto', background:'#fff', borderRadius:12, padding:16, boxShadow:'0 10px 24px rgba(0,0,0,0.18)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:16 }}>
                Sửa trạm #{editing.station.Station_ID}
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
                <input type="checkbox"
                  checked={editing.deleteMissing}
                  onChange={e => setEditing(prev => ({ ...prev, deleteMissing: e.target.checked }))}
                />
                Xoá các trụ **không có** trong danh sách (syncMode = delete-missing)
              </label>
            </div>

            {/* Station fields */}
            <div className="grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Tên trạm
                <input
                  value={editing.station.Name}
                  onChange={e=>setEditing(prev => ({ ...prev, station: { ...prev.station, Name: e.target.value } }))}
                />
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Địa chỉ
                <input
                  value={editing.station.Address ?? ''}
                  onChange={e=>setEditing(prev => ({ ...prev, station: { ...prev.station, Address: e.target.value } }))}
                />
              </label>
            </div>

            {/* Charging Stations editable table */}
            <div style={{ marginTop: 6, marginBottom: 10, fontWeight: 600 }}>Trụ sạc</div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, boxShadow:'0 0 0 1px #e5e7eb', borderRadius:10 }}>
                <thead>
                  <tr>
                    <th style={{ padding:10, borderBottom:'1px solid #eef2f7', textAlign:'left' }}>#CS</th>
                    <th style={{ padding:10, borderBottom:'1px solid #eef2f7', textAlign:'left' }}>Tên trụ</th>
                    <th style={{ padding:10, borderBottom:'1px solid #eef2f7', textAlign:'left' }}>Sức chứa</th>
                    <th style={{ padding:10, borderBottom:'1px solid #eef2f7', textAlign:'left' }}>Loại slot</th>
                    <th style={{ padding:10, borderBottom:'1px solid #eef2f7', textAlign:'left' }}>Công suất (chuỗi)</th>
                    <th style={{ padding:10, borderBottom:'1px solid #eef2f7' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {editing.list.map((cs, idx) => (
                    <tr key={idx}>
                      <td style={{ padding:10, borderBottom:'1px solid #eef2f7' }}>{cs.ChargingStation_ID || '—'}</td>
                      <td style={{ padding:10, borderBottom:'1px solid #eef2f7' }}>
                        <input value={cs.Name} onChange={e=>changeCell(idx,'Name', e.target.value)} />
                      </td>
                      <td style={{ padding:10, borderBottom:'1px solid #eef2f7' }}>
                        <input type="number" value={cs.Slot_Capacity} onChange={e=>changeCell(idx,'Slot_Capacity', e.target.value)} style={{ width:100 }} />
                      </td>
                      <td style={{ padding:10, borderBottom:'1px solid #eef2f7' }}>
                        <select value={cs.Slot_Type} onChange={e=>changeCell(idx,'Slot_Type', e.target.value)}>
                          <option value="li">li</option>
                          <option value="lfp">lfp</option>
                        </select>
                      </td>
                      <td style={{ padding:10, borderBottom:'1px solid #eef2f7' }}>
                        <input
                          placeholder="vd: 7.5 hoặc 11"
                          value={cs.Power_Rating}
                          onChange={e=>changeCell(idx,'Power_Rating', e.target.value)}
                          // ⚠️ không format số, giữ y nguyên chuỗi
                        />
                      </td>
                      <td style={{ padding:10, borderBottom:'1px solid #eef2f7' }}>
                        <button onClick={()=>removeRowLocal(idx)} style={{ padding:'6px 8px', borderRadius:8, border:'1px solid #fecaca', color:'#b91c1c', background:'#fff' }}>
                          Xoá hàng
                        </button>
                      </td>
                    </tr>
                  ))}
                  {editing.list.length === 0 && (
                    <tr><td style={{ padding:10 }} colSpan={6}>Chưa có trụ sạc.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
              <button onClick={addRow} style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff' }}>
                + Thêm trụ sạc
              </button>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setEditing(null)} style={{ padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff' }}>
                  Hủy
                </button>
                <button disabled={editing.saving} onClick={saveUpdate} style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #16a34a', background:'#16a34a', color:'#fff', fontWeight:600 }}>
                  {editing.saving ? 'Đang lưu…' : 'Lưu cập nhật'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== /Station Manager Panel ================== */

/* ================== PIN PACKAGES (list + update + delete) ================== */
function PinPackagesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // object gói đang sửa

  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('jwt_token') ||
    '';

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setErr('');
      const res = await fetch(`${API_BASE_URL}/webAPI/api/getpackages`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
      });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      const list = Array.isArray(data?.data) ? data.data : [];
      setItems(list);
    } catch (e) {
      setErr(e.message || 'Không tải được danh sách gói pin.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);

  const openEdit = (pkg) => {
    setEditing({
      packageId: pkg.packageId ?? pkg.Package_ID ?? pkg.PackageId ?? pkg.Package_ID,
      name: pkg.name ?? pkg.Name ?? '',
      description: pkg.description ?? pkg.Description ?? '',
      price: Number(pkg.price ?? pkg.Price ?? 0),
      requiredSoH: Number(pkg.requiredSoH ?? pkg.Required_SoH ?? 0),
      minSoH: Number(pkg.minSoH ?? pkg.MinSoH ?? 0),
      maxSoH: Number(pkg.maxSoH ?? pkg.MaxSoH ?? 100),
      status: (pkg.status ?? pkg.Status ?? 'active').toString(),
    });
  };

  const saveEdit = async () => {
    try {
      if (!token) throw new Error('Vui lòng đăng nhập Admin.');
      const b = editing;
      if (!b.name?.trim()) throw new Error('Tên gói không được trống.');
      if (b.price < 0) throw new Error('Giá phải >= 0.');
      if (b.minSoH < 0 || b.maxSoH > 100 || b.minSoH > b.maxSoH)
        throw new Error('Khoảng SoH không hợp lệ (0 ≤ min ≤ max ≤ 100).');

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/updatePackage`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({
          packageId: b.packageId,
          name: b.name?.trim(),
          description: b.description ?? null,
          price: Number(b.price),
          requiredSoH: Number(b.requiredSoH),
          minSoH: Number(b.minSoH),
          maxSoH: Number(b.maxSoH),
          status: (b.status || 'active').trim(),
        }),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok || data?.status === 'fail') {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }
      setEditing(null);
      await fetchPackages();
      alert('Cập nhật gói pin thành công.');
    } catch (e) {
      alert(e.message || 'Cập nhật thất bại.');
    }
  };

  const deletePkg = async (id) => {
    if (!window.confirm(`Xóa (soft delete) gói #${id}?`)) return;
    try {
      if (!token) throw new Error('Vui lòng đăng nhập Admin.');
      let res = await fetch(`${API_BASE_URL}/webAPI/api/secure/package`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({ packageId: id }),
      });
      if (!res.ok) {
        res = await fetch(`${API_BASE_URL}/webAPI/api/secure/packageDelete`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'ngrok-skip-browser-warning': '1',
          },
          body: JSON.stringify({ packageId: id }),
        });
      }
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok || data?.status === 'fail')
        throw new Error(data?.message || `HTTP ${res.status}`);

      await fetchPackages();
      alert('Đã xóa (set Status=inactive).');
    } catch (e) {
      alert(e.message || 'Xóa thất bại.');
    }
  };

  const table = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    boxShadow: '0 0 0 1px #e5e7eb',
    borderRadius: 10,
    overflow: 'hidden',
  };
  const thtd = { padding: '10px 12px', fontSize: 14, textAlign: 'left', borderBottom: '1px solid #eef2f7' };
  const boxInfo = { padding: 12, borderRadius: 10, background: '#f7fafc', color: '#475569' };
  const boxError = { padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c' };
  const baseBtn = { padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 };
  const btnUpdate = { ...baseBtn, background: '#2563eb', color: '#fff', borderColor: '#2563eb' };
  const btnDelete = { ...baseBtn, background: '#fff', color: '#b91c1c', borderColor: '#fca5a5' };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(33,150,243,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>🔋 Danh sách gói pin (active)</div>
        <button onClick={fetchPackages} style={baseBtn}>Làm mới</button>
      </div>

      {loading && <div style={boxInfo}>Đang tải danh sách…</div>}
      {!loading && err && <div style={boxError}>{err}</div>}

      {!loading && !err && (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={thtd}>#ID</th>
                <th style={thtd}>Tên gói</th>
                <th style={thtd}>Mô tả</th>
                <th style={thtd}>Giá (₫)</th>
                <th style={thtd}>Required SoH</th>
                <th style={thtd}>Min</th>
                <th style={thtd}>Max</th>
                <th style={thtd}>Trạng thái</th>
                <th style={thtd}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const id  = p.packageId ?? p.Package_ID ?? p.PackageId ?? p.Package_ID;
                const nm  = p.name ?? p.Name;
                const des = p.description ?? p.Description;
                const pr  = Number(p.price ?? p.Price ?? 0);
                const r   = Number(p.requiredSoH ?? p.Required_SoH ?? 0);
                const mi  = Number(p.minSoH ?? p.MinSoH ?? 0);
                const ma  = Number(p.maxSoH ?? p.MaxSoH ?? 100);
                const st  = (p.status ?? p.Status ?? '').toString();

                return (
                  <tr key={id}>
                    <td style={thtd}>{id}</td>
                    <td style={thtd}>{nm}</td>
                    <td style={thtd}>{des}</td>
                    <td style={thtd}>{pr.toLocaleString('vi-VN')}</td>
                    <td style={thtd}>{r}%</td>
                    <td style={thtd}>{mi}%</td>
                    <td style={thtd}>{ma}%</td>
                    <td style={thtd}><span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:6, fontSize:12 }}>{st}</span></td>
                    <td style={thtd}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={btnUpdate} onClick={() => openEdit(p)}>Sửa</button>
                        <button style={btnDelete} onClick={() => deletePkg(id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && !loading && !err && (
                <tr><td style={{...thtd}} colSpan={9}>Không có gói nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal edit đơn giản */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}
        >
          <div onClick={(e)=>e.stopPropagation()} style={{ width:520, background:'#fff', borderRadius:12, padding:16, boxShadow:'0 10px 24px rgba(0,0,0,0.18)' }}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:12 }}>Sửa gói #{editing.packageId}</div>

            <div className="grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Tên gói
                <input value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Giá (₫)
                <input type="number" value={editing.price} onChange={e=>setEditing({...editing, price:Number(e.target.value)})}/>
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Required SoH (%)
                <input type="number" value={editing.requiredSoH} onChange={e=>setEditing({...editing, requiredSoH:Number(e.target.value)})}/>
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Min SoH (%)
                <input type="number" value={editing.minSoH} onChange={e=>setEditing({...editing, minSoH:Number(e.target.value)})}/>
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Max SoH (%)
                <input type="number" value={editing.maxSoH} onChange={e=>setEditing({...editing, maxSoH:Number(e.target.value)})}/>
              </label>
              <label style={{ display:'flex', flexDirection:'column', fontSize:13 }}>
                Trạng thái
                <select value={editing.status} onChange={e=>setEditing({...editing, status:e.target.value})}>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
            </div>

            <label style={{ display:'flex', flexDirection:'column', fontSize:13, marginTop:10 }}>
              Mô tả
              <textarea rows={3} value={editing.description ?? ''} onChange={e=>setEditing({...editing, description:e.target.value})}/>
            </label>

            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button onClick={()=>setEditing(null)} style={{ padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff' }}>Hủy</button>
              <button onClick={saveEdit} style={{ padding:'8px 10px', borderRadius:8, border:'1px solid #16a34a', background:'#16a34a', color:'#fff', fontWeight:600 }}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/* ================== /PIN PACKAGES ================== */

/* ================== /Panels ================== */

export default function AdminDashboard({ user, onLoginClick }) {
  const [activeTab, setActiveTab] = useState('overview');

  // ---- Chart lượt đổi pin theo trạm (API /analyticsSwap) ----
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState('');
  const [chartData, setChartData] = useState([]); // [{label, value}]

  // ---- Chart doanh thu tổng hợp (API /analyticsRevenue) ----
  const [revenueData, setRevenueData] = useState({ stations: [], packages: [], totals: null });
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState('');

  /* ================= fetch /analyticsSwap ================= */
  useEffect(() => {
    if (activeTab !== 'overview') return;

    let aborted = false;
    (async () => {
      try {
        setChartLoading(true);
        setChartError('');

        const token =
          localStorage.getItem('authToken') ||
          localStorage.getItem('jwt_token') ||
          '';

        if (!token) throw new Error('Bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản Admin.');

        const url = `${API_BASE_URL}/webAPI/api/secure/analyticsSwap`;

        const res = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (aborted) return;

        if (res.status === 401) throw new Error('401 Unauthorized — vui lòng đăng nhập lại bằng tài khoản Admin.');
        if (res.status === 403) throw new Error('403 Forbidden — chỉ Admin được phép xem thống kê này.');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const ct = (res.headers.get('content-type') || '').toLowerCase();
        const raw = await res.text();
        if (!ct.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${ct}. Body: ${raw.slice(0, 200)}`);
        }
        const json = JSON.parse(raw);

        if (!json?.success) throw new Error(json?.message || 'Không lấy được dữ liệu');

        const rows = Array.isArray(json.stations) ? json.stations : [];
        const normalized = normalizeStations(rows).sort((a, b) => b.value - a.value);
        setChartData(normalized);
      } catch (err) {
        setChartError(err.message || 'Lỗi không xác định');
        setChartData([]);
      } finally {
        !aborted && setChartLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [activeTab]);

  /* ================= fetch /analyticsRevenue ================= */
  useEffect(() => {
    if (activeTab !== 'overview') return;

    let aborted = false;
    (async () => {
      try {
        setRevenueLoading(true);
        setRevenueError('');

        const token =
          localStorage.getItem('authToken') ||
          localStorage.getItem('jwt_token') ||
          '';

        if (!token) throw new Error('Vui lòng đăng nhập Admin.');

        const url = `${API_BASE_URL}/webAPI/api/secure/analyticsRevenue`;
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': '1',
          },
        });

        if (aborted) return;
        if (res.status === 401) throw new Error('401 Unauthorized');
        if (res.status === 403) throw new Error('403 Forbidden');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const json = JSON.parse(text);

        if (!json?.success) throw new Error(json?.message || 'Không lấy được dữ liệu');

        const stations = Array.isArray(json.stations)
          ? json.stations.map(r => ({
              label: r.stationName || r.Station_Name || 'Trạm',
              value: Number(r.swapRevenue || 0),
            }))
          : [];

        const packages = Array.isArray(json.packages)
          ? json.packages.map(r => ({
              label: r.packageName || r.Package_Name || 'Gói',
              value: Number(r.revenue || 0),
            }))
          : [];

        const totals = json.totals || null;

        setRevenueData({
          stations: stations.sort((a, b) => b.value - a.value),
          packages: packages.sort((a, b) => b.value - a.value),
          totals,
        });
      } catch (err) {
        setRevenueError(err.message || 'Lỗi không xác định');
        setRevenueData({ stations: [], packages: [], totals: null });
      } finally {
        !aborted && setRevenueLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [activeTab]);

  return (
    <>
      <Header user={user} onLoginClick={onLoginClick} pageTitle="Hệ thống quản lí" />
      <div className="admin-dashboard-wrap">
        <div className="admin-dashboard-card">
          <h2 className="admin-dashboard-title">Hệ thống quản lí</h2>
          <div className="admin-dashboard-subtitle">Tổng quan hệ thống, báo cáo và phân tích dữ liệu</div>

          {/* Summary cards */}
          <div className="admin-dashboard-summary">
            {summaryCards.map((c, i) => (
              <div key={i} className="admin-dashboard-summary-card">
                <div style={{ fontSize: 15, color: '#7c8c8f', marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1976d2', marginBottom: 2 }}>{c.value}</div>
                <div style={{ fontSize: 13, color: '#10b981' }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="admin-dashboard-tabs">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={'admin-dashboard-tab-btn' + (activeTab === tab.value ? ' active' : '')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'overview' && (
              <>
                {/* HÀNG 1: 2 biểu đồ cũ */}
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {/* Biểu đồ đã gắn API */}
                  <div
                    style={{
                      flex: 2,
                      minWidth: 320,
                      background: '#fff',
                      borderRadius: 12,
                      padding: 18,
                      boxShadow: '0 1px 4px rgba(33,150,243,0.04)',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Doanh thu & Lượt đổi pin</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 10 }}>
                      Tổng lượt đổi pin theo trạm (tháng hiện tại)
                    </div>

                    {chartLoading && (
                      <div
                        style={{
                          height: 220,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f7fafc',
                          borderRadius: 12,
                          color: '#94a3b8',
                        }}
                      >
                        Đang tải dữ liệu…
                      </div>
                    )}

                    {!chartLoading && chartError && (
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: '#fef2f2',
                          color: '#b91c1c',
                          fontSize: 14,
                        }}
                      >
                        {chartError}
                      </div>
                    )}

                    {!chartLoading && !chartError && chartData.length > 0 && (
                      <SimpleBarChart data={chartData} height={220} yLabel="Lượt đổi" />
                    )}

                    {!chartLoading && !chartError && chartData.length === 0 && (
                      <div
                        style={{
                          height: 220,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f7fafc',
                          borderRadius: 12,
                          color: '#94a3b8',
                          fontSize: 14,
                        }}
                      >
                        Chưa có dữ liệu thống kê.
                      </div>
                    )}
                  </div>

                  {/* Giờ cao điểm (demo) */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 260,
                      background: '#fff',
                      borderRadius: 12,
                      padding: 18,
                      boxShadow: '0 1px 4px rgba(33,150,243,0.04)',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Giờ cao điểm</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>
                      Phân bổ lượt đổi pin theo giờ trong ngày
                    </div>
                    <div
                      style={{
                        height: 180,
                        background: '#f7fafc',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#bdbdbd',
                        fontSize: 18,
                      }}
                    >
                      Bar Chart (Demo)
                    </div>
                  </div>
                </div>

                {/* HÀNG 2: DOANH THU */}
                <div
                  style={{
                    marginTop: 18,
                    width: '100%',
                    background: '#fff',
                    borderRadius: 12,
                    padding: 24,
                    boxShadow: '0 1px 4px rgba(33,150,243,0.08)',
                  }}
                >
                  <h3 style={{ fontWeight: 600, marginBottom: 6 }}>📊 Thống kê doanh thu tháng hiện tại</h3>
                  <div style={{ color: '#64748b', marginBottom: 16 }}>
                    So sánh doanh thu đổi pin theo trạm và doanh thu thuê gói pin
                  </div>

                  {revenueLoading && (
                    <div
                      style={{
                        height: 240,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f7fafc',
                        borderRadius: 12,
                      }}
                    >
                      Đang tải dữ liệu…
                    </div>
                  )}

                  {!revenueLoading && revenueError && (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: 14,
                      }}
                    >
                      {revenueError}
                    </div>
                  )}

                  {!revenueLoading && !revenueError && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 10 }}>Doanh thu đổi pin theo trạm</div>
                        <SimpleBarChart data={revenueData.stations} height={240} yLabel="Doanh thu (₫)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 10 }}>Doanh thu thuê gói pin</div>
                        <SimpleBarChart data={revenueData.packages} height={240} yLabel="Doanh thu (₫)" />
                      </div>
                    </div>
                  )}

                  {revenueData.totals && (
                    <div style={{ marginTop: 20, fontSize: 15, color: '#334155' }}>
                      <b>Tổng doanh thu tháng:</b>{' '}
                      {Number(revenueData.totals.totalRevenue || 0).toLocaleString('vi-VN')} ₫
                      {'  ('}Đổi pin:{' '}
                      {Number(revenueData.totals.swapRevenue || 0).toLocaleString('vi-VN')} ₫, Thuê gói:{' '}
                      {Number(revenueData.totals.packageRevenue || 0).toLocaleString('vi-VN')} ₫{')'}
                    </div>
                  )}
                </div>

                {/* AI Suggestion (demo) */}
                <div style={{ marginTop: 28, background: '#f7fafc', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>AI Gợi ý nâng cấp hạ tầng</div>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 260,
                        background: '#e6f2fd',
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1976d2', marginBottom: 6 }}>
                        Trạm Nguyễn Huệ - Mở rộng khuyến nghị
                      </div>
                      <div style={{ color: '#444', fontSize: 15, marginBottom: 6 }}>
                        Nhu cầu tăng 45% trong giờ cao điểm. Đề xuất tăng thêm 5 pin để giảm thời gian chờ.
                      </div>
                      <span
                        style={{
                          background: '#d1fae5',
                          color: '#059669',
                          borderRadius: 6,
                          padding: '2px 10px',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Ưu tiên cao
                      </span>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        minWidth: 260,
                        background: '#fef9c3',
                        borderRadius: 10,
                        padding: 16,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#b45309', marginBottom: 6 }}>Khu vực Q7 - Mở trạm mới</div>
                      <div style={{ color: '#444', fontSize: 15, marginBottom: 6 }}>
                        Phát hiện 300+ yêu cầu tìm kiếm từ khu vực Q7. ROI dự kiến 18 tháng.
                      </div>
                      <span
                        style={{
                          background: '#fef08a',
                          color: '#b45309',
                          borderRadius: 6,
                          padding: '2px 10px',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Ưu tiên trung bình
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'station' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Bảng điều phối chờ duyệt */}
                <AdminDispatchPanel />

                {/* NEW: Bảng trạm & trụ sạc */}
                <StationManagerPanel />
              </div>
            )}

            {activeTab === 'user' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <PinPackagesPanel />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div
                  style={{
                    flex: 2,
                    minWidth: 320,
                    background: '#fff',
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: '0 1px 4px rgba(33,150,243,0.04)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Báo cáo & thống kê</div>
                  <ul style={{ color: '#444', fontSize: 15, marginBottom: 10, paddingLeft: 18 }}>
                    <li>Doanh thu, số lượt đổi pin</li>
                    <li>Báo cáo tần suất đổi pin, giờ cao điểm</li>
                    <li>AI gợi ý dự báo nhu cầu sử dụng trạm đổi pin để nâng cấp hạ tầng</li>
                  </ul>
                  <div style={{ color: '#bdbdbd', fontSize: 15 }}>Tính năng đang phát triển...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
