import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./DispatchPanel.css";
import API_BASE_URL from "../../../../config";

export default function DispatchPanel({ user }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    batteryName: "",
    qtyGood: 0,
    qtyAverage: 0,
    qtyBad: 0,
  });

  // loading khi ấn xác nhận từng dòng
  const [confirmingId, setConfirmingId] = useState(null);

  /* ======= Handle input ======= */
  const onChange = (e) => {
    const { name, value } = e.target;

    // Chuẩn hóa riêng cho input số: ép >= 0, integer
    if (name === "qtyGood" || name === "qtyAverage" || name === "qtyBad") {
      let v = String(value || "0").replace(/[^\d]/g, "");
      const n = Math.max(0, parseInt(v || "0", 10));
      setForm((prev) => ({ ...prev, [name]: n }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ======= Load danh sách yêu cầu (đang dùng /dispatchPending) ======= */
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
      // Validate cơ bản phía FE
      if (!form.batteryName) throw new Error(t('manager.dispatch.form.selectBatteryError'));
      const total = Number(form.qtyGood || 0) + Number(form.qtyAverage || 0) + Number(form.qtyBad || 0);
      if (total === 0) throw new Error(t('manager.dispatch.form.quantityError'));

      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: `Bearer ${token}`,
        },
        // ❗ Không gửi stationName nữa — BE tự lấy Station_ID theo Manager đăng nhập
        body: new URLSearchParams({
          batteryName: form.batteryName,
          qtyGood: String(form.qtyGood),
          qtyAverage: String(form.qtyAverage),
          qtyBad: String(form.qtyBad),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Gửi yêu cầu thất bại.");

      setResult({
        type: "success",
        message: `${t('manager.dispatch.result.successPrefix')}${data.requestId || "?"}${t('manager.dispatch.result.successSuffix')}`,
      });

      // Reset form (không reset loại pin để thao tác nhanh)
      setForm((prev) => ({ ...prev, qtyGood: 0, qtyAverage: 0, qtyBad: 0 }));
      await loadRequests();
    } catch (err) {
      setResult({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ======= Xác nhận đã nhận pin (Manager trạm request) ======= */
  const handleConfirm = async (dispatchId) => {
    if (!dispatchId) return;
    setConfirmingId(dispatchId);
    setResult(null);

    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/dispatchConfirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
        body: new URLSearchParams({ dispatchId: String(dispatchId) }),
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { success: false, message: text }; }

      if (!res.ok || data.success === false) {
        throw new Error(data.message || `Xác nhận thất bại (HTTP ${res.status})`);
      }

      const moved = t('manager.dispatch.confirmSuccess', {
        good: data.movedGood ?? 0,
        avg: data.movedAverage ?? data.movedAvg ?? 0,
        bad: data.movedBad ?? 0
      });
      const warn = data.warning ? t('manager.dispatch.confirmWarning', { warning: data.warning }) : "";
      setResult({ type: "success", message: `${moved}${warn}` });

      await loadRequests();
    } catch (err) {
      setResult({ type: "error", message: err.message || t('manager.dispatch.confirmError') });
    } finally {
      setConfirmingId(null);
    }
  };

  /* ======= Helper ======= */
  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = iso.includes("T") ? iso.split("T")[0] : iso;
    return d;
  };

  const totalOf = (r) =>
    Number(r?.qtyGood || 0) + Number(r?.qtyAverage || 0) + Number(r?.qtyBad || 0);

  const renderStatus = (status) => {
    const key = String(status || "pending").toLowerCase();
    const map = {
      pending: t('manager.dispatch.list.statusPending'),
      preparing: t('manager.dispatch.list.statusPreparing'),
      approved: t('manager.dispatch.list.statusApproved'),
      rejected: t('manager.dispatch.list.statusRejected'),
      complete: t('manager.dispatch.list.statusComplete'),
      completed: t('manager.dispatch.list.statusCompleted'),
      cancelled: t('manager.dispatch.list.statusCancelled'),
    };
    return map[key] || status || t('manager.dispatch.list.statusUnknown');
  };

  const canConfirm = (row) =>
    String(row?.status || "").toLowerCase() === "preparing";

  /* ======= JSX ======= */
  return (
    <div className="dispatch-panel">
      <h2 className="dispatch-title">{t('manager.dispatch.title')}</h2>
      <p className="dispatch-desc" dangerouslySetInnerHTML={{ __html: t('manager.dispatch.desc') }} />

      {/* Banner: nhắc không cần nhập tên trạm */}
      <div className="info-banner" role="status" aria-live="polite">
        <span className="info-dot" aria-hidden>ℹ️</span>
        <div>
          <div><b>{t('manager.dispatch.infoBanner.title')}</b> {t('manager.dispatch.infoBanner.line1')}</div>
          <div dangerouslySetInnerHTML={{ __html: t('manager.dispatch.infoBanner.line2') }} />
        </div>
      </div>

      {/* ==== FORM ==== */}
      <form className="dispatch-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>{t('manager.dispatch.form.batteryType')}</label>
            <select
              name="batteryName"
              value={form.batteryName}
              onChange={onChange}
              required
            >
              <option value="">{t('manager.dispatch.form.selectBattery')}</option>
              {/* Giá trị nên khớp với tên trong bảng Battery_Type (Model) để DAO map chính xác */}
              <option value="Lithium-ion">{t('manager.dispatch.form.lithium')}</option>
              <option value="LFP">{t('manager.dispatch.form.lfp')}</option>
            </select>
            <small className="hint">{t('manager.dispatch.form.batteryHint')}</small>
          </div>

          <div className="form-group soh-col">
            <label>{t('manager.dispatch.form.quantityLabel')}</label>
            <div className="soh-row">
              <div>
                <span>{t('manager.dispatch.form.good')}</span>
                <input
                  type="number"
                  name="qtyGood"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.qtyGood}
                  onChange={onChange}
                />
              </div>
              <div>
                <span>{t('manager.dispatch.form.average')}</span>
                <input
                  type="number"
                  name="qtyAverage"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.qtyAverage}
                  onChange={onChange}
                />
              </div>
              <div>
                <span>{t('manager.dispatch.form.weak')}</span>
                <input
                  type="number"
                  name="qtyBad"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.qtyBad}
                  onChange={onChange}
                />
              </div>
            </div>
            <small className="hint">{t('manager.dispatch.form.quantityHint')}</small>
          </div>
        </div>

        <button type="submit" className="dispatch-btn" disabled={loading}>
          {loading ? t('manager.dispatch.form.sending') : t('manager.dispatch.form.sendButton')}
        </button>
      </form>

      {result && (
        <div className={`dispatch-result ${result.type}`}>
          {result.type === "success" ? "✅" : "⚠️"} {result.message}
        </div>
      )}

      {/* ==== DANH SÁCH ==== */}
      <h3 className="dispatch-subtitle">{t('manager.dispatch.list.title')}</h3>

      <div className="table-wrapper">
        <table className="req-table">
          <thead>
            <tr>
              <th>{t('manager.dispatch.list.table.id')}</th>
              <th>{t('manager.dispatch.list.table.requestStation')}</th>
              <th>{t('manager.dispatch.list.table.respondStation')}</th>
              <th>{t('manager.dispatch.list.table.batteryType')}</th>
              <th>{t('manager.dispatch.list.table.quantity')}<br /><small>{t('manager.dispatch.list.table.quantitySub')}</small></th>
              <th>{t('manager.dispatch.list.table.requestTime')}</th>
              <th>{t('manager.dispatch.list.table.status')}</th>
              <th>{t('manager.dispatch.list.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-cell">
                  {t('manager.dispatch.list.empty')}
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
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleConfirm(r.requestId)}
                      disabled={!canConfirm(r) || confirmingId === r.requestId}
                      className="btn-confirm"
                      title={t('manager.dispatch.list.table.confirmTitle')}
                    >
                      {confirmingId === r.requestId ? t('manager.dispatch.list.table.confirming') : t('manager.dispatch.list.table.confirm')}
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={loadRequests}
                      title={t('manager.dispatch.list.table.refreshTitle')}
                    >
                      {t('manager.dispatch.list.table.refresh')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
