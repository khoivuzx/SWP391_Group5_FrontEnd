import React, { useState } from "react";
import API_BASE_URL from "../../../../config";
import "./booking.css";

export default function Booking() {
  const [station, setStation] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // để hiện thông tin booking trả về

  // Demo danh sách trạm (thực tế: lấy từ API)
  const stations = [
    "Gogoro Central Park",
    "Gogoro Grand Park - Khu 1",
    "Gogoro Central Đồng Khởi",
    "Gogoro Golden River",
  ];

  // Demo danh sách xe (thực tế: lấy từ API hoặc theo user)
  const vehicles = [
    "Gogoro SuperSport",
    "Gogoro 2 Delight",
    "Gogoro Viva Mix",
    "Gogoro CrossOver S",
    "Gogoro S2 ABS",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setResult(null);

    try {
      // Lấy token từ localStorage (ưu tiên nhiều khóa để tránh lệch tên)
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt");

      const url = `${API_BASE_URL}/webAPI/api/secure/booking`;
      console.log("→ POST", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Nếu gọi qua ngrok, thêm header này để bỏ trang cảnh báo ngrok
          "ngrok-skip-browser-warning": "true",
        },
        credentials: "include",
        body: JSON.stringify({
          // BE chấp nhận cả schema cũ (station, vehicleName, date, time)
          station,
          vehicleName,
          date,     // YYYY-MM-DD từ <input type="date">
          time,     // HH:mm (24h) từ <input type="time"> — rất an toàn
        }),
      });

      const text = await res.text();
      const ct = res.headers.get("content-type") || "";
      console.log("HTTP", res.status, res.statusText, "| CT:", ct);
      console.log("RAW:", text);

      let data = {};
      try {
        data = text && text.trim() ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }

      if (!res.ok) {
        const msg = data?.error || data?.message || `Đặt lịch thất bại (${res.status})`;
        throw new Error(msg);
      }

      // ✅ Thành công khi có bookingId (BE trả status="Reserved")
      if (data.bookingId) {
        setSuccess(true);
        setResult(data); // lưu lại để hiển thị
        return;
      }

      // Nếu BE sau này đổi format, fallback message
      setError(data.message || "Đặt lịch thất bại!");
    } catch (err) {
      setError(err.message || "Lỗi kết nối server!");
    }
};

  return (
    <div className="booking-container">
      <h2 className="booking-title">Đăng ký lịch đổi pin</h2>

      {success ? (
        <div className="booking-success">
          <div>✅ Đăng ký thành công! Vui lòng đến trạm đúng giờ để đổi pin.</div>
          {result && (
            <div className="booking-result">
              <div>Mã đặt lịch: <b>{result.bookingId}</b></div>
              <div>Trạm: <b>{result.stationId}</b> • Trạm sạc: <b>{result.chargingStationId}</b></div>
              <div>Ô pin: <b>{result.slotId}</b></div>
              <div>Loại pin: <b>{result.batteryType}</b></div>
              <div>Model xe: <b>{result.vehicleModel || vehicleName}</b></div>
              <div>Thời gian: {result.bookingTime}</div>
              <div>Hết hạn: {result.expiredTime}</div>
              {result.qrCode && (
                <div style={{ marginTop: 12 }}>
                  <img
                    alt="QR Booking"
                    src={`data:image/png;base64,${result.qrCode}`}
                    style={{ width: 160, height: 160 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="booking-error">{error}</div>}

          <label>
            Tên trạm:
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              required
            >
              <option value="">-- Chọn trạm --</option>
              {stations.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tên xe:
            <select
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              required
            >
              <option value="">-- Chọn xe --</option>
              {vehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ngày đổi pin:
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label>
            Giờ đổi pin:
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </label>

          <button type="submit">Đăng ký</button>
        </form>
      )}
    </div>
  );
}