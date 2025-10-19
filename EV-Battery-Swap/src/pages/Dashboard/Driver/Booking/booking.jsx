import React, { useState } from 'react';
import API_BASE_URL from '../../../../config';
import './booking.css';

export default function Booking() {
  const [station, setStation] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Demo danh sách trạm, thực tế lấy từ API
  const stations = [
    'Gogoro Central Park',
    'Gogoro Grand Park - Khu 1',
    'Gogoro Central Đồng Khởi',
    'Gogoro Golden River',
  ];
  // Demo danh sách xe, thực tế lấy từ API hoặc user
  const vehicles = [
    "Gogoro SuperSport",
    "Gogoro 2 Delight",
    "Gogoro Viva Mix",
    "Gogoro CrossOver S",
    "Gogoro S2 ABS",    
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      // Lấy token từ localStorage (ưu tiên accessToken, authToken, jwt)
      const token = localStorage.getItem("accessToken") || localStorage.getItem("authToken") || localStorage.getItem("jwt");

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          station,
          vehicleName,
          date,
          time,
        }),
      });
      const text = await res.text();
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
      if (data.status === 'success') {
        setSuccess(true);
      } else {
        setError(data.message || 'Đặt lịch thất bại!');
      }
    } catch (err) {
      setError(err.message || 'Lỗi kết nối server!');
    }
  };

  return (
    <div className="booking-container">
      <h2 className="booking-title">Đăng ký lịch đổi pin</h2>
      {success ? (
        <div className="booking-success">
          Đăng ký thành công! Vui lòng đến trạm đúng giờ để đổi pin.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="booking-error">{error}</div>}
          <label>
            Tên trạm:
            <select value={station} onChange={e => setStation(e.target.value)} required>
              <option value="">-- Chọn trạm --</option>
              {stations.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </label>
          <label>
            Tên xe:
            <select value={vehicleName} onChange={e => setVehicleName(e.target.value)} required>
              <option value="">-- Chọn xe --</option>
              {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>
            Ngày đổi pin:
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </label>
          <label>
            Giờ đổi pin:
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          </label>
          <button type="submit">Đăng ký</button>
        </form>
      )}
    </div>
  );
}
