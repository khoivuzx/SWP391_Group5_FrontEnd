import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../../config"; // ví dụ: http://localhost:8084  (KHÔNG có /webAPI)
import "./TransactionHistory.css";

export default function TransactionHistory() {
  const jwt =
    localStorage.getItem("authToken") || localStorage.getItem("jwt_token");

  const [activeTab, setActiveTab] = useState("swap");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [swapItems, setSwapItems] = useState([]);
  const [packageItems, setPackageItems] = useState([]);
  const [error, setError] = useState("");

  // ⛳️ Build query string từ from/to (định dạng yyyy-MM-dd)
  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.append("from", from);
    if (to) p.append("to", to);
    return p.toString() ? `?${p.toString()}` : "";
  }, [from, to]);

  // Đọc JSON an toàn (nếu BE trả HTML lỗi => ném lỗi rõ ràng)
  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    const text = await res.text();
    throw new Error(`HTTP ${res.status} – ${text.slice(0, 200)}`);
  };

  // Chuẩn hoá 1 item swap về camelCase cho FE
  const normalizeSwap = (s) => ({
    id: s.id != null ? s.id : s.ID,
    stationId: s.stationId != null ? s.stationId : s.Station_ID,
    chargingStationId:
      s.chargingStationId != null ? s.chargingStationId : s.ChargingStation_ID,
    sohOld: s.sohOld != null ? s.sohOld : s.SoH_Old,
    sohNew: s.sohNew != null ? s.sohNew : s.SoH_New,
    fee: s.fee != null ? s.fee : s.Fee,
    paymentId: s.paymentId != null ? s.paymentId : s.Payment_ID,
    status: s.status != null ? s.status : s.Status,
    swapTime: s.swapTime != null ? s.swapTime : s.Swap_Time,
  });

  // Chuẩn hoá 1 item package payment về camelCase
  const normalizePackage = (x) => ({
    id: x.id != null ? x.id : x.ID,
    userId: x.userId != null ? x.userId : x.User_ID,
    stationId: x.stationId != null ? x.stationId : x.Station_ID,
    packageId: x.packageId != null ? x.packageId : x.Package_ID,
    amount: x.amount != null ? x.amount : x.Amount,
    paymentMethod:
      x.paymentMethod != null ? x.paymentMethod : x.Payment_Method,
    description: x.description != null ? x.description : x.Description,
    transactionTime:
      x.transactionTime != null ? x.transactionTime : x.Transaction_Time,
  });

  const fetchSwaps = async () => {
    if (!jwt) {
      setError("Vui lòng đăng nhập lại.");
      return;
    }
    setLoading(true);
    setError("");

    const url = `${API_BASE_URL}/webAPI/api/secure/my-swaps${params}`;
    console.log("🌐 GET", url);

    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      });

      const data = await safeJson(res);
      if (!res.ok || (data && data.error)) {
        throw new Error((data && data.error) || `Lỗi ${res.status}`);
      }

      const arr = Array.isArray(data) ? data : [];
      setSwapItems(arr.map(normalizeSwap));
    } catch (e) {
      console.error("❌ Fetch swaps error:", e);
      setError(e.message || "Có lỗi xảy ra khi tải dữ liệu.");
      setSwapItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackageHistory = async () => {
    if (!jwt) {
      setError("Vui lòng đăng nhập lại.");
      return;
    }
    setLoading(true);
    setError("");

    const url = `${API_BASE_URL}/webAPI/api/secure/my-package-history${params}`;
    console.log("🌐 GET", url);

    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "ngrok-skip-browser-warning": "true",
          "Content-Type": "application/json",
        },
      });

      const data = await safeJson(res);
      if (!res.ok || (data && data.error)) {
        throw new Error((data && data.error) || `Lỗi ${res.status}`);
      }

      const arr = Array.isArray(data) ? data : [];
      setPackageItems(arr.map(normalizePackage));
    } catch (e) {
      console.error("❌ Fetch package history error:", e);
      setError(e.message || "Có lỗi xảy ra khi tải dữ liệu gói pin.");
      setPackageItems([]);
    } finally {
      setLoading(false);
    }
  };

  // load lần đầu: gọi cả hai
  useEffect(() => {
    fetchSwaps();
    fetchPackageHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nhấn nút Lọc thì gọi lại API với params hiện tại
  const onFilter = (e) => {
    e.preventDefault();
    fetchSwaps();
    fetchPackageHistory();
  };

  const currency = (v) =>
    typeof v === "number"
      ? v.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
      : "-";

  const dateTime = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      // Nếu BE trả “YYYY-MM-DD HH:mm:ss.SSS” thì Date có thể hiểu kém ⇒ fallback 'T'
      if (isNaN(d.getTime())) {
        const parsed = new Date(String(iso).replace(" ", "T"));
        return isNaN(parsed.getTime())
          ? String(iso)
          : parsed.toLocaleString("vi-VN");
      }
      return d.toLocaleString("vi-VN");
    } catch {
      return String(iso);
    }
  };

  const Empty = ({ text }) => (
    <div className="th-empty">
      <div className="th-empty-ico">🗂️</div>
      <div>{text}</div>
    </div>
  );

  return (
    <div className="th-page">
      <div className="th-card">
        <div className="th-header">
          <h1 className="th-title">Lịch sử thanh toán</h1>

          <form className="th-filters" onSubmit={onFilter}>
            <div className="th-field">
              <label>Từ ngày</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="th-field">
              <label>Đến ngày</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <button className="th-btn th-btn-primary" type="submit">
              Lọc
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="th-tabs">
          <button
            className={`th-tab ${activeTab === "swap" ? "active" : ""}`}
            onClick={() => setActiveTab("swap")}
          >
            Đổi pin (Swap)
          </button>
          <button
            className={`th-tab ${activeTab === "package" ? "active" : ""}`}
            onClick={() => setActiveTab("package")}
          >
            Mua/Thuê gói pin (Package)
          </button>
        </div>

        {error && <div className="th-alert">{error}</div>}
        {loading && <div className="th-loading">Đang tải dữ liệu…</div>}

        {/* Bảng Đổi pin */}
        {!loading && activeTab === "swap" && (
          <>
            {swapItems.length === 0 ? (
              <Empty text="Chưa có lịch sử đổi pin." />
            ) : (
              <div className="th-table-wrap">
                <table className="th-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Trạm</th>
                      <th>Kiosk</th>
                      <th>SoH cũ → mới</th>
                      <th>Phí</th>
                      <th>PTTT</th>
                      <th>Mô tả</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swapItems.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.stationId ?? "-"}</td>
                        <td>{r.chargingStationId ?? "-"}</td>
                        <td>
                          {r.sohOld != null ? r.sohOld : "-"} →{" "}
                          <b>{r.sohNew != null ? r.sohNew : "-"}</b>
                        </td>
                        <td>{currency(r.fee)}</td>
                        <td>{r.paymentMethod ?? r.paymentId ?? "-"}</td>
                        <td>{r.description ?? r.status ?? "-"}</td>
                        <td>{dateTime(r.swapTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Bảng Gói pin */}
        {!loading && activeTab === "package" && (
          <>
            {packageItems.length === 0 ? (
              <Empty text="Chưa có lịch sử mua/thuê gói pin." />
            ) : (
              <div className="th-table-wrap">
                <table className="th-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Gói</th>
                      <th>Số tiền</th>
                      <th>PTTT</th>
                      <th>Mô tả</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageItems.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.packageId ?? "-"}</td>
                        <td>{currency(r.amount)}</td>
                        <td>{r.paymentMethod ?? "-"}</td>
                        <td>{r.description ?? "-"}</td>
                        <td>{dateTime(r.transactionTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
