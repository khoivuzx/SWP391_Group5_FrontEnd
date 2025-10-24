import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../../config";
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

  // Build query string từ from/to
  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.append("from", from);
    if (to) p.append("to", to);
    return p.toString() ? `?${p.toString()}` : "";
  }, [from, to]);

  // Đọc JSON an toàn
  const safeJson = async (res) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return await res.json();
    const text = await res.text();
    throw new Error(`HTTP ${res.status} – ${text.slice(0, 200)}`);
  };

  // ✅ Chuẩn hoá dữ liệu swap — KHÔNG CÒN paymentMethod
  const normalizeSwap = (s) => ({
    id: s.swapId ?? s.id ?? s.ID,
    station: s.station ?? s.Station ?? "-",
    chargingStation:
      s.chargingStation ?? s["Charging Station"] ?? s.Charging_Station ?? "-",
    sohOld: s.sohOld ?? s.SoH_Old ?? null,
    sohNew: s.sohNew ?? s.SoH_New ?? null,
    fee: s.fee ?? s.Fee ?? null,
    description:
      s.description ?? s.Description ?? s["Mô tả"] ?? s.status ?? s.Status ?? "-",
    time:
      s.time ?? s.TimeAt ?? s["Thời gian"] ?? s.swapTime ?? s.Swap_Time ?? null,
  });

  // Chuẩn hoá package (giữ nguyên)
  const normalizePackage = (x) => ({
    id: x.id != null ? x.id : x.ID,
    userId: x.userId != null ? x.userId : x.User_ID,
    stationId: x.stationId != null ? x.stationId : x.Station_ID,
    packageId: x.packageId != null ? x.packageId : x.Package_ID,
    amount: x.amount != null ? x.amount : x.Amount,
    paymentMethod: x.paymentMethod ?? x.Payment_Method ?? "-",
    description: x.description ?? x.Description ?? "-",
    transactionTime: x.transactionTime ?? x.Transaction_Time,
  });

  // Gọi API swap history
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

  // Gọi API package history
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

  useEffect(() => {
    fetchSwaps();
    fetchPackageHistory();
  }, []); // chỉ gọi 1 lần

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
                      <th>Mô tả</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {swapItems.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.station ?? "-"}</td>
                        <td>{r.chargingStation ?? "-"}</td>
                        <td>
                          {r.sohOld != null ? r.sohOld : "-"} →{" "}
                          <b>{r.sohNew != null ? r.sohNew : "-"}</b>
                        </td>
                        <td>{currency(r.fee)}</td>
                        <td>{r.description ?? "-"}</td>
                        <td>{dateTime(r.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Bảng Gói pin (GIỮ NGUYÊN) */}
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
