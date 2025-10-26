import React, { useEffect, useState } from "react";
import "./DispatchPanel.css";
import API_BASE_URL from "../../../../config";

export default function DispatchPanel({ user }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    stationName: "",
    batteryName: "",
    qtyGood: 0,
    qtyAverage: 0,
    qtyBad: 0,
  });

  /* ======= Handle input ======= */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ======= Load danh sách yêu cầu ======= */
  const loadRequests = async () => {
    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchPending`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
      });

      const data = await res.json().catch(() => []);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadRequests error:", err);
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  /* ======= Submit form gửi yêu cầu ======= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          stationName: form.stationName,
          batteryName: form.batteryName,
          qtyGood: form.qtyGood,
          qtyAverage: form.qtyAverage,
          qtyBad: form.qtyBad,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Gửi yêu cầu thất bại.");

      setResult({
        type: "success",
        message: `Gửi yêu cầu thành công (Mã #${data.requestId || "?"})`,
      });
      setForm({ stationName: "", batteryName: "", qtyGood: 0, qtyAverage: 0, qtyBad: 0 });
      await loadRequests();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ======= Format ngày & tổng số lượng ======= */
  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = iso.includes("T") ? iso.split("T")[0] : iso;
    return d;
  };

  const totalOf = (r) =>
    Number(r?.qtyGood || 0) + Number(r?.qtyAverage || 0) + Number(r?.qtyBad || 0);

  /* ======= Render status (có hỗ trợ tiếng Việt) ======= */
  const renderStatus = (status) => {
    const key = String(status || "pending").toLowerCase();
    const map = {
      pending: "Đang chờ",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      complete: "Hoàn tất",
      completed: "Hoàn tất",
      cancelled: "Đã hủy",
    };
    return map[key] || status || "Không rõ";
  };

  /* ======= JSX ======= */
  return (
    <div className="dispatch-panel">
      <h2 className="dispatch-title">📦 Điều phối pin</h2>
      <p className="dispatch-desc">
        Quản lý gửi yêu cầu điều phối pin về cho <b>Admin</b> phê duyệt.
      </p>

      {/* ==== FORM ==== */}
      <form className="dispatch-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Tên trạm</label>
            <input
              type="text"
              name="stationName"
              placeholder="VD: Trạm Central Park"
              value={form.stationName}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Loại pin</label>
            <select
              name="batteryName"
              value={form.batteryName}
              onChange={onChange}
              required
            >
              <option value="">-- Chọn loại pin --</option>
              <option value="Lithium-ion">Lithium-ion</option>
              <option value="LFP">LFP</option>
            </select>
          </div>

          <div className="form-group soh-col">
            <label>Số lượng theo SoH</label>
            <div className="soh-row">
              <div>
                <span>Good:</span>
                <input
                  type="number"
                  name="qtyGood"
                  min="0"
                  value={form.qtyGood}
                  onChange={onChange}
                />
              </div>
              <div>
                <span>Average:</span>
                <input
                  type="number"
                  name="qtyAverage"
                  min="0"
                  value={form.qtyAverage}
                  onChange={onChange}
                />
              </div>
              <div>
                <span>Weak:</span>
                <input
                  type="number"
                  name="qtyBad"
                  min="0"
                  value={form.qtyBad}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="dispatch-btn" disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>

      {result && (
        <div className={`dispatch-result ${result.type}`}>
          {result.type === "success" ? "✅" : "⚠️"} {result.message}
        </div>
      )}

      {/* ==== DANH SÁCH ==== */}
      <h3 className="dispatch-subtitle">📋 Yêu cầu đã gửi</h3>

      <div className="table-wrapper">
        <table className="req-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Trạm gửi</th>
              <th>Trạm nhận</th>
              <th>Loại pin</th>
              <th>Số lượng<br /><small>(Good/Avg/Weak • Tổng)</small></th>
              <th>Thời gian Request</th>
              <th>Tình trạng</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-cell">
                  Chưa có yêu cầu nào.
                </td>
              </tr>
            )}

            {requests.map((r) => (
              <tr key={r.requestId}>
                <td className="id-cell">#{r.requestId}</td>
                <td>{r.stationRequestName || "—"}</td>
                <td>{r.stationRespondName || "—"}</td>
                <td>{r.batteryName || "—"}</td>
                <td>
                  {`${r.qtyGood || 0}/${r.qtyAverage || 0}/${r.qtyBad || 0}`}
                  {"  •  "}
                  <b>{totalOf(r)}</b>
                </td>
                <td>{formatDate(r.requestTime)}</td>
                <td>
                  <span
                    className={`status-badge ${String(
                      r.status || "pending"
                    ).toLowerCase()}`}
                  >
                    {renderStatus(r.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
