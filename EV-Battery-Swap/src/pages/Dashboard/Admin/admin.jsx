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
  { label: 'Người dùng', value: 'user' },
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
/* ================== /Panel Xem điều phối pin ================== */

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
                {/* HÀNG 1: 2 biểu đồ cũ (trái: swap chart, phải: giờ cao điểm demo) */}
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

                {/* HÀNG 2: BIỂU ĐỒ DOANH THU MỚI - FULL WIDTH (bằng 2 biểu đồ trên) */}
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

                {/* AI Suggestion Section (giữ nguyên) */}
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

                {/* ======== Panel Xem điều phối pin ======== */}
                <AdminDispatchPanel />
              </>
            )}

            {activeTab === 'station' && (
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
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Quản lý trạm</div>
                  <ul style={{ color: '#444', fontSize: 15, marginBottom: 10, paddingLeft: 18 }}>
                    <li>Theo dõi lịch sử sử dụng & trạng thái sức khỏe (SoH – State of Health)</li>
                    <li>Điều phối pin giữa các trạm</li>
                    <li>Xử lý khiếu nại & đổi pin lỗi</li>
                  </ul>
                  <div style={{ color: '#bdbdbd', fontSize: 15 }}>Tính năng đang phát triển...</div>
                </div>
              </div>
            )}

            {activeTab === 'user' && (
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
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Quản lý người dùng & gói thuê</div>
                  <ul style={{ color: '#444', fontSize: 15, marginBottom: 10, paddingLeft: 18 }}>
                    <li>Quản lý khách hàng</li>
                    <li>Tạo gói thuê pin</li>
                    <li>Phân quyền nhân viên trạm đổi pin</li>
                  </ul>
                  <div style={{ color: '#bdbdbd', fontSize: 15 }}>Tính năng đang phát triển...</div>
                </div>
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
