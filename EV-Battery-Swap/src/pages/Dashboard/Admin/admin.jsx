import React, { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header/Header';
import API_BASE_URL from '../../../config';
import './admin.css';

/* ---------------- Mini BarChart (no lib) ---------------- */
/* Fix chồng chéo: auto width + scroll ngang khi nhiều cột, nhãn rút gọn */
function SimpleBarChart({ data = [], height = 220, yLabel = 'Lượt đổi' }) {
  const max = useMemo(() => Math.max(1, ...data.map(d => Number(d.value) || 0)), [data]);
  const needScroll = (data?.length || 0) > 10;
  const chartWidth = needScroll ? Math.max(800, (data?.length || 0) * 80) : '100%';

  return (
    <div className="simple-bar-wrap" style={{ width: '100%' }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{yLabel}</div>
      <div
        className="simple-bar-track"
        style={{
          height,
          width: chartWidth,
          display: 'grid',
          gridTemplateColumns: `repeat(${data.length || 1}, 1fr)`,
          gap: 12,
          alignItems: 'end',
          padding: '8px 6px',
          background: '#f7fafc',
          borderRadius: 12,
        }}
      >
        {data.map((d, idx) => {
          const val = Number(d.value) || 0;
          const h = Math.round((val / max) * (height - 50));
          return (
            <div
              key={idx}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70, maxWidth: 100 }}
            >
              <div
                title={`${d.label}: ${val.toLocaleString('vi-VN')}`}
                style={{
                  height: Math.max(6, h),
                  width: '100%',
                  borderRadius: 8,
                  background: '#1976d2',
                  boxShadow: '0 2px 6px rgba(25,118,210,0.24)',
                  transition: 'height .25s ease',
                }}
              />
              <div
                style={{
                  fontSize: 12,
                  color: '#0f172a',
                  marginTop: 6,
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  whiteSpace: 'nowrap',
                }}
              >
                {val.toLocaleString('vi-VN')}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  marginTop: 2,
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 100,
                }}
                title={d.label}
              >
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
    const count =
      r.swapCount ?? r.total_swaps ?? r.TotalSwaps ?? r.totalSwaps ?? r.swaps ?? r.Swaps ?? r.count ?? 0;
    return { label: String(name), value: Number(count) || 0 };
  });
}

// ❌ BỎ mảng summaryCards vì bạn muốn xóa 4 ô vuông đầu
// const summaryCards = [...]

const tabs = [
  { label: 'Tổng quan', value: 'overview' },
  { label: 'Quản lý trạm', value: 'station' },
  { label: 'Pin', value: 'user' },
  { label: 'Nâng cấp hạ tầng', value: 'upgrade' },
];

/* ================== Panel Xem điều phối pin (Admin) ================== */
function AdminDispatchPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Modal Chọn trạm khi Chấp nhận + AI
  const [approveModal, setApproveModal] = useState({
    open: false,
    requestId: null,
    stations: [],
    selectedStationId: "",
    loading: false,
    error: "",
    ai: { loading: false, error: "", items: [], rawText: "" }, // gợi ý AI
  });

  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt_token") ||
    "";

  const withAuth = (headers = {}) => ({
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "ngrok-skip-browser-warning": "1",
    ...headers,
  });

  // ===== Helpers để chuẩn hóa tên pin về format BE hiểu =====
  const norm = (s) => (s || "").toString().trim().toLowerCase();
  const normalizeBatteryNameForBE = (batteryName) => {
    const b = norm(batteryName);
    if (b.includes("lfp")) return "LFP";
    // Các biến thể phổ biến
    if (b.includes("li-ion") || b.includes("li ion") || b.includes("lithium")) return "Lithium-ion";
    // Mặc định: trả nguyên như BE đang dùng
    return batteryName || "Lithium-ion";
  };

  // ===== Fetch các yêu cầu đang chờ =====
  const fetchPending = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/admindispatchPending`, {
        method: "GET",
        credentials: "include",
        headers: withAuth(),
      });
      const text = await res.text();
      let data = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Không tải được danh sách yêu cầu.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // --- mở modal chọn trạm
  const openApproveModal = async (requestId) => {
    try {
      setApproveModal((prev) => ({
        ...prev,
        open: true,
        requestId,
        loading: true,
        error: "",
        stations: [],
        selectedStationId: "",
        ai: { loading: false, error: "", items: [], rawText: "" },
      }));

      const res = await fetch(`${API_BASE_URL}/webAPI/api/getstations`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", "ngrok-skip-browser-warning": "1" },
      });
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      let stations = [];
      if (data?.status === "success" && Array.isArray(data?.data)) {
        stations = data.data.map((s) => ({
          id: s.Station_ID ?? s.StationId ?? s.id,
          name: s.Name ?? s.Station_Name ?? s.name ?? `Trạm #${s.Station_ID}`,
          address: s.Address ?? s.address ?? "",
        }));
      } else if (Array.isArray(data)) {
        stations = data.map((s) => ({
          id: s.Station_ID ?? s.StationId ?? s.id,
          name: s.Name ?? s.Station_Name ?? s.name ?? `Trạm #${s.Station_ID}`,
          address: s.Address ?? s.address ?? "",
        }));
      } else {
        throw new Error(data?.message || "Không có dữ liệu trạm.");
      }

      setApproveModal((prev) => ({
        ...prev,
        stations,
        loading: false,
        selectedStationId: stations[0]?.id ?? "",
      }));
    } catch (e) {
      setApproveModal((prev) => ({
        ...prev,
        loading: false,
        error: e.message || "Không tải được danh sách trạm.",
      }));
    }
  };

  // --- gọi AI gợi ý trạm theo nội dung yêu cầu + gửi kèm context số liệu
  const runAiSuggest = async () => {
    const row = rows.find((r) => String(r.requestId) === String(approveModal.requestId));
    try {
      if (!token) throw new Error("Bạn chưa đăng nhập Admin.");
      if (!row) throw new Error("Không tìm thấy yêu cầu điều phối.");

      setApproveModal((prev) => ({
        ...prev,
        ai: { ...prev.ai, loading: true, error: "", items: [], rawText: "" },
      }));

      // Chuẩn hóa loại pin cho BE
      const pinType = normalizeBatteryNameForBE(row.batteryName);

      // ===== 1) Thu thập số liệu để gửi kèm lên BE/Gemini =====
      // 1.1. Tồn kho theo trạm & loại pin & SoH
      const stockRes = await fetch(`${API_BASE_URL}/webAPI/api/getStationBatteryReportGuest`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json", "ngrok-skip-browser-warning": "1" },
      });
      const stockJson = await stockRes.text().then(t => (t ? JSON.parse(t) : {}));

      // 1.2. Doanh thu theo trạm (tháng hiện tại)
      const revRes = await fetch(`${API_BASE_URL}/webAPI/api/secure/analyticsRevenue`, {
        method: "GET",
        credentials: "include",
        headers: withAuth(),
      });
      const revJson = await revRes.text().then(t => (t ? JSON.parse(t) : {}));

      // 1.3. Lượt đổi pin theo trạm (tháng hiện tại)
      const swapRes = await fetch(`${API_BASE_URL}/webAPI/api/secure/analyticsSwap`, {
        method: "GET",
        credentials: "include",
        headers: withAuth(),
      });
      const swapJson = await swapRes.text().then(t => (t ? JSON.parse(t) : {}));

      // Chuẩn hóa mảnh dữ liệu gửi lên BE
      const stockRows =
        stockJson?.payload?.data && Array.isArray(stockJson.payload.data)
          ? stockJson.payload.data
          : [];

      const revenueStations =
        Array.isArray(revJson?.stations)
          ? revJson.stations.map(r => ({
              stationName: r.stationName ?? r.Station_Name ?? "Trạm",
              swapRevenue: Number(r.swapRevenue ?? 0),
            }))
          : [];

      const swapStations =
        Array.isArray(swapJson?.stations)
          ? swapJson.stations.map(r => ({
              stationName: r.stationName ?? r.Station_Name ?? "Trạm",
              totalSwaps: Number(r.total_swaps ?? r.totalSwaps ?? r.swaps ?? 0),
            }))
          : [];

      // ===== 2) Tạo request + context gửi lên assistant/chat =====
      const requestSpec = {
        stationRequestName: row.stationRequestName,
        batteryType: pinType, // "Lithium-ion" | "LFP"
        needGood: Number(row.qtyGood || 0),
        needAvg: Number(row.qtyAverage || 0),
        needWeak: Number(row.qtyBad || 0),
      };

      // "message" vẫn giữ format cũ để BE backward-compatible
      const ask = {
        message: `Đơn điều phối: từ ${row.stationRequestName}, pin ${pinType} số lượng tốt/trung bình/xấu: ${row.qtyGood}/${row.qtyAverage}/${row.qtyBad}.`,
        context: {
          request: requestSpec,
          metrics: {
            stock: stockRows,            // [{stationName,batteryType,Good,Average,Weak}, ...]
            revenueStations,             // [{stationName, swapRevenue}]
            swapStations,                // [{stationName, totalSwaps}]
          },
        },
      };

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/assistant/chat`, {
        method: "POST",
        credentials: "include",
        headers: withAuth({ "Content-Type": "application/json;charset=UTF-8" }),
        body: JSON.stringify(ask),
      });

      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}

      if (!res.ok || data?.success === false) throw new Error(data?.message || `HTTP ${res.status}`);

      const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
      const stations = approveModal.stations;
      const n = (s) => (s || "").toString().trim().toLowerCase();

      let bestPick = "";
      for (const sg of suggestions) {
        const sName = n(sg.station);
        const found = stations.find(
          (st) => n(st.name) === sName || n(st.name).includes(sName) || sName.includes(n(st.name))
        );
        if (found) {
          bestPick = found.id;
          break;
        }
      }

      setApproveModal((prev) => ({
        ...prev,
        selectedStationId: bestPick || prev.selectedStationId,
        ai: {
          loading: false,
          error: "",
          items: suggestions.map((sg, i) => ({
            idx: i + 1,
            stationName: sg.station || "",
            reason: sg.reason || "",
            confidence: null,
            matchedId: (() => {
              const sName = n(sg.station || "");
              const found = prev.stations.find(
                (st) => n(st.name) === sName || n(st.name).includes(sName) || sName.includes(n(st.name))
              );
              return found?.id || null;
            })(),
            quantity: Number(sg.quantity ?? 0), // BE đã kèm quantity khả dụng
          })),
          rawText: data?.answer || "",
        },
      }));
    } catch (e) {
      setApproveModal((prev) => ({
        ...prev,
        ai: { ...prev.ai, loading: false, error: e.message || "AI lỗi." },
      }));
    }
  };

  // --- gửi duyệt với stationRespondName là tên trạm đã chọn
  const approveWithStation = async () => {
    const { requestId, selectedStationId, stations } = approveModal;
    if (!requestId || !selectedStationId) {
      setApproveModal((prev) => ({ ...prev, error: "Vui lòng chọn trạm xuất pin." }));
      return;
    }

    try {
      const stationObj = stations.find((s) => String(s.id) === String(selectedStationId));
      const stationRespondName = stationObj?.name?.trim();
      if (!stationRespondName) {
        setApproveModal((prev) => ({ ...prev, error: "Vui lòng chọn trạm xuất pin hợp lệ." }));
        return;
      }

      if (!token) throw new Error("Bạn chưa đăng nhập Admin.");
      const body = new URLSearchParams();
      body.set("requestId", String(requestId));
      body.set("action", "approve");
      body.set("stationRespondName", stationRespondName);

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchApprove`, {
        method: "POST",
        credentials: "include",
        headers: withAuth({ "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }),
        body: body.toString(),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      setApproveModal({
        open: false,
        requestId: null,
        stations: [],
        selectedStationId: "",
        loading: false,
        error: "",
        ai: { loading: false, error: "", items: [], rawText: "" },
      });
      await fetchPending();
      alert("Đã chuyển yêu cầu sang PREPARING.");
    } catch (e) {
      setApproveModal((prev) => ({ ...prev, error: e.message || "Xử lý thất bại." }));
    }
  };

  // --- hủy yêu cầu
  const cancelRequest = async (requestId) => {
    try {
      if (!token) throw new Error("Bạn chưa đăng nhập Admin.");
      const body = new URLSearchParams({ requestId: String(requestId), action: "cancel" });

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchApprove`, {
        method: "POST",
        credentials: "include",
        headers: withAuth({ "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }),
        body: body.toString(),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}
      if (!res.ok || data?.success === false) throw new Error(data?.message || `HTTP ${res.status}`);

      await fetchPending();
      alert("Đã hủy yêu cầu.");
    } catch (e) {
      alert(e.message || "Xử lý thất bại.");
    }
  };

  // ===== UI =====
  const table = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    boxShadow: "0 0 0 1px #e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  };
  const boxInfo = { padding: 12, borderRadius: 10, background: "#f7fafc", color: "#475569" };
  const boxError = { padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b91c1c" };
  const badge = { background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 6, fontSize: 12 };
  const baseBtn = { padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", fontWeight: 600 };
  const btnApprove = { ...baseBtn, background: "#16a34a", color: "#fff", borderColor: "#16a34a" };
  const btnCancel = { ...baseBtn, background: "#fff", color: "#b91c1c", borderColor: "#fca5a5" };
  const btnRefresh = { ...baseBtn, background: "#fff", color: "#0f172a" };
  const btnAi = { ...baseBtn, background: "#0ea5e9", color: "#fff", borderColor: "#0ea5e9" };

  return (
    <div style={{ marginTop: 24, background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(33,150,243,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>📦 Xem điều phối pin (yêu cầu đang chờ)</div>
        <button onClick={fetchPending} style={btnRefresh}>
          Làm mới
        </button>
      </div>

      {loading && <div style={boxInfo}>Đang tải danh sách…</div>}
      {!loading && err && <div style={boxError}>{err}</div>}
      {!loading && !err && rows.length === 0 && <div style={boxInfo}>Không có yêu cầu nào đang chờ.</div>}

      {!loading && !err && rows.length > 0 && (
        <div style={{ overflowX: "auto" }}>
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
                  <td>
                    <span style={badge}>{r.status}</span>
                  </td>
                  <td>{r.requestTime}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openApproveModal(r.requestId)} style={btnApprove}>
                        Chấp nhận
                      </button>
                      <button onClick={() => cancelRequest(r.requestId)} style={btnCancel}>
                        Hủy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal chọn trạm xuất pin + AI suggest */}
      {approveModal.open && (
        <div
          onClick={() =>
            setApproveModal({
              open: false,
              requestId: null,
              stations: [],
              selectedStationId: "",
              loading: false,
              error: "",
              ai: { loading: false, error: "", items: [], rawText: "" },
            })
          }
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 560, background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 10px 24px rgba(0,0,0,0.18)" }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Chọn trạm xuất pin</div>

            {approveModal.loading && <div style={{ padding: 12, borderRadius: 8, background: "#f7fafc", color: "#475569" }}>Đang tải danh sách trạm…</div>}

            {!approveModal.loading && approveModal.error && (
              <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", color: "#b91c1c" }}>{approveModal.error}</div>
            )}

            {!approveModal.loading && !approveModal.error && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                    Trạm
                    <select
                      value={approveModal.selectedStationId}
                      onChange={(e) => setApproveModal((prev) => ({ ...prev, selectedStationId: e.target.value }))}
                      style={{ padding: "10px 12px", borderRadius: 8, border: "1.5px solid #cbd5e1", outline: "none" }}
                    >
                      {approveModal.stations.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button onClick={runAiSuggest} style={btnAi} disabled={approveModal.ai.loading}>
                    {approveModal.ai.loading ? "Đang gợi ý…" : "AI gợi ý trạm"}
                  </button>
                </div>

                {/* Khu vực hiển thị gợi ý AI */}
                {(approveModal.ai.items.length > 0 || approveModal.ai.rawText || approveModal.ai.error) && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#f7fafc" }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Gợi ý từ AI</div>

                    {approveModal.ai.error && (
                      <div style={{ padding: 10, borderRadius: 8, background: "#fef2f2", color: "#b91c1c" }}>{approveModal.ai.error}</div>
                    )}

                    {approveModal.ai.items.length > 0 && (
                      <div style={{ display: "grid", gap: 10 }}>
                        {approveModal.ai.items.map((sug) => (
                          <div key={sug.idx} style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {sug.idx}. {sug.stationName}
                                </div>
                                {sug.reason ? <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{sug.reason}</div> : null}
                              </div>
                              {sug.matchedId ? (
                                <button
                                  onClick={() => setApproveModal((prev) => ({ ...prev, selectedStationId: sug.matchedId }))}
                                  style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", fontWeight: 600 }}
                                >
                                  Chọn trạm này
                                </button>
                              ) : (
                                <span style={{ fontSize: 12, color: "#64748b" }}>Không khớp tên trạm trong hệ thống</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!approveModal.ai.items.length && approveModal.ai.rawText && (
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 13, color: "#334155" }}>{approveModal.ai.rawText}</pre>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                  <button
                    onClick={() =>
                      setApproveModal({
                        open: false,
                        requestId: null,
                        stations: [],
                        selectedStationId: "",
                        loading: false,
                        error: "",
                        ai: { loading: false, error: "", items: [], rawText: "" },
                      })
                    }
                    style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={approveWithStation}
                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #16a34a", background: "#16a34a", color: "#fff", fontWeight: 600 }}
                  >
                    Xác nhận
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================== Station Manager Panel ================== */
function StationManagerPanel() {
  const [data, setData] = useState({ stations: [], totals: null });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState(null);

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

const openEdit = (st) => {
  const stationId = st.Station_ID ?? st.stationId ?? st.id;
  const station = {
    Station_ID: stationId,
    Name: st.Name ?? st.Station_Name ?? '',
    Address: st.Address ?? '',
  };

  const list = (Array.isArray(st.chargingStations) ? st.chargingStations : []).map(cs => ({
    ChargingStation_ID: cs.ChargingStation_ID ?? cs.chargingStationId ?? 0,
    Station_ID: stationId,
    Name: cs.Name ?? '',
    Slot_Capacity: Number(cs.Slot_Capacity ?? 0) || 0,
    Slot_Type: (cs.Slot_Type ?? '').toString(),
    Power_Rating: cs.Power_Rating == null ? '' : String(cs.Power_Rating)
  }));

  setEditing({ station, list, deleteMissing: false, saving: false });
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
          ChargingStation_ID: Number(cs.ChargingStation_ID || 0),
          Name: (cs.Name || '').trim(),
          Slot_Capacity: Number(cs.Slot_Capacity || 0),
          Slot_Type: (cs.Slot_Type || '').toString(),
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
                Xoá các trụ <b>không có</b> trong danh sách (syncMode = delete-missing)
              </label>
            </div>

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

/* ================== PIN PACKAGES ================== */
function PinPackagesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);

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
      const t = localStorage.getItem('authToken') || localStorage.getItem('jwt_token') || '';
      if (!t) throw new Error('Vui lòng đăng nhập Admin.');
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
          Authorization: `Bearer ${t}`,
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
      const t = localStorage.getItem('authToken') || localStorage.getItem('jwt_token') || '';
      if (!t) throw new Error('Vui lòng đăng nhập Admin.');
      let res = await fetch(`${API_BASE_URL}/webAPI/api/secure/package`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          Authorization: `Bearer ${t}`,
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
            Authorization: `Bearer ${t}`,
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

/* ================== NÂNG CẤP HẠ TẦNG ================== */
function UpgradeSuggestionPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('authToken') || localStorage.getItem('jwt_token') || '';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) throw new Error('Vui lòng đăng nhập Admin.');
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/upgrade_suggestions`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': '1',
        },
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Không tải được dữ liệu.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const baseBtn = { padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600 };
  const btnRefresh = { ...baseBtn, background: '#fff', color: '#0f172a' };
  const boxInfo = { padding: 12, borderRadius: 10, background: '#f7fafc', color: '#475569' };
  const boxError = { padding: 12, borderRadius: 10, background: '#fef2f2', color: '#b91c1c' };
  const badge = (status) => {
    const map = {
      OK: ['#dcfce7', '#166534'],
      WARNING: ['#fef9c3', '#854d0e'],
      CRITICAL: ['#fee2e2', '#b91c1c'],
      WARNING_DATA: ['#fef9c3', '#78350f'],
    };
    const [bg, color] = map[status] || ['#f1f5f9', '#334155'];
    return { background: bg, color, padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 };
  };

  return (
    <div style={{ background:'#fff', borderRadius:12, padding:18, boxShadow:'0 1px 4px rgba(33,150,243,0.06)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div style={{ fontWeight:700, fontSize:16 }}>🏗️ Gợi ý nâng cấp hạ tầng trạm</div>
        <button onClick={fetchData} style={btnRefresh}>Làm mới</button>
      </div>

      {loading && <div style={boxInfo}>Đang tải dữ liệu…</div>}
      {!loading && error && <div style={boxError}>{error}</div>}
      {!loading && !error && rows.length === 0 && <div style={boxInfo}>Không có dữ liệu.</div>}

      {!loading && !error && rows.length > 0 && (
        <div style={{ overflowX:'auto' }}>
          <table style={{
            width:'100%',
            borderCollapse:'separate',
            borderSpacing:0,
            boxShadow:'0 0 0 1px #e5e7eb',
            borderRadius:10,
            overflow:'hidden'
          }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Tên trạm</th>
                <th>Sức chứa</th>
                <th>TB 7 ngày</th>
                <th>Tăng trưởng (%)</th>
                <th>Fail rate</th>
                <th>Trạng thái</th>
                <th>Gợi ý</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.stationId ?? i}>
                  <td>{r.stationId}</td>
                  <td>{r.stationName}</td>
                  <td>{r.slotCapacity}</td>
                  <td>{r.last7Avg?.toFixed?.(1) || '-'}</td>
                  <td>{r.growthPercent?.toFixed?.(1)}%</td>
                  <td>{r.failRate}</td>
                  <td><span style={badge(r.status)}>{r.status}</span></td>
                  <td style={{ fontSize:13, color:'#334155' }}>{r.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
/* ================== /NÂNG CẤP HẠ TẦNG ================== */

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

  // ---- NEW: Giờ cao điểm theo trạm (API /api/secure/analytics/peak-hours/stations) ----
  const [peakLoading, setPeakLoading] = useState(false);
  const [peakError, setPeakError] = useState('');
  const [peakData, setPeakData] = useState([]); // [{stationId, stationName, timeSlot, hitRate, totalSwaps, activeDays, totalDays, avgPerActiveDay}]

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

  /* ================= fetch /api/secure/analytics/peak-hours/stations ================= */
  useEffect(() => {
    if (activeTab !== 'overview') return;

    let aborted = false;
    (async () => {
      try {
        setPeakLoading(true);
        setPeakError('');

        const token =
          localStorage.getItem('authToken') ||
          localStorage.getItem('jwt_token') ||
          '';

        if (!token) throw new Error('Vui lòng đăng nhập Admin.');

        // nếu muốn lọc ngày thì gắn ?startDate=2025-10-01&endDate=2025-10-30&minRate=0.6
        const url = `${API_BASE_URL}/webAPI/api/secure/analytics/peak-hours/stations?minRate=0`;

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

        if (res.status === 401) throw new Error('401 Unauthorized — vui lòng đăng nhập lại.');
        if (res.status === 403) throw new Error('403 Forbidden — chỉ Admin/Staff được xem giờ cao điểm.');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();
        const json = text ? JSON.parse(text) : {};

        if (!json?.success) throw new Error(json?.message || 'Không lấy được dữ liệu giờ cao điểm.');

        const list = Array.isArray(json.stations) ? json.stations : [];
        // sắp xếp trạm nào hitRate cao lên đầu
        list.sort((a, b) => (b.hitRate || 0) - (a.hitRate || 0));
        setPeakData(list);
      } catch (err) {
        setPeakError(err.message || 'Lỗi không xác định');
        setPeakData([]);
      } finally {
        !aborted && setPeakLoading(false);
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

          {/* ❌ SUMMARY CARDS ĐÃ GỠ BỎ */}
          {/* <div className="admin-dashboard-summary">...</div> */}

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
                {/* HÀNG 1 */}
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

                  {/* BOX GIỜ CAO ĐIỂM - ĐÃ KẾT NỐI API */}
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
                      Phân bổ lượt đổi pin theo giờ trong ngày (trạm có tần suất ổn định)
                    </div>

                    {peakLoading && (
                      <div
                        style={{
                          height: 180,
                          background: '#f7fafc',
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontSize: 14,
                        }}
                      >
                        Đang tải giờ cao điểm…
                      </div>
                    )}

                    {!peakLoading && peakError && (
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: '#fef2f2',
                          color: '#b91c1c',
                          fontSize: 13,
                        }}
                      >
                        {peakError}
                      </div>
                    )}

                    {!peakLoading && !peakError && peakData.length === 0 && (
                      <div
                        style={{
                          height: 180,
                          background: '#f7fafc',
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                          fontSize: 14,
                        }}
                      >
                        Chưa có dữ liệu giờ cao điểm.
                      </div>
                    )}

                    {!peakLoading && !peakError && peakData.length > 0 && (
                      <div style={{ maxHeight: 180, overflowY: 'auto', display: 'grid', gap: 8 }}>
                        {peakData.map((row, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: idx === 0 ? '#eff6ff' : '#f7fafc',
                              border: '1px solid rgba(148, 163, 184, 0.12)',
                              borderRadius: 10,
                              padding: '8px 10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 10,
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>
                                {row.stationName || `Trạm #${row.stationId}`}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                Khung giờ: <b>{row.timeSlot}</b> • Tỷ lệ ngày có swap: {(row.hitRate * 100).toFixed(0)}%
                              </div>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                {row.activeDays}/{row.totalDays} ngày có phát sinh • TB/ngày hoạt động: {row.avgPerActiveDay}
                              </div>
                            </div>
                            <div
                              style={{
                                minWidth: 40,
                                textAlign: 'right',
                                fontWeight: 700,
                                fontSize: 12,
                                color: '#0f172a',
                              }}
                            >
                              {row.totalSwaps} lần
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
              </>
            )}

            {activeTab === 'station' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Bảng điều phối chờ duyệt (đã có modal chọn trạm + AI) */}
                <AdminDispatchPanel />

                {/* Bảng trạm & trụ sạc */}
                <StationManagerPanel />
              </div>
            )}

            {activeTab === 'user' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <PinPackagesPanel />
              </div>
            )}

            {activeTab === 'upgrade' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <UpgradeSuggestionPanel />
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
