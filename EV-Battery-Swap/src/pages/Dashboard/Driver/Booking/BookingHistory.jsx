// src/pages/.../BookingHistory.jsx
import React, { useEffect, useState } from 'react';
import './booking.css';
import API_BASE_URL from '../../../../config';

const STATUS_VI = {
  reserved: 'Đặt trước',
  reverse: 'Đặt trước',   // đề phòng data cũ
  expired: 'Hết hạn',
  completed: 'Hoàn thành',
  complete: 'Hoàn thành',
};

const toViStatus = (s) => STATUS_VI[String(s || '').toLowerCase()] || s || '-';

const getStatusColor = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'complete') return '#10B981';
  if (s === 'expired') return '#EF4444';
  if (s === 'reserved' || s === 'reverse') return '#F59E0B';
  return '#111827';
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc
  const [status, setStatus] = useState('');      // value gửi cho BE: '', 'Reserved', 'Expired', 'Completed'
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');     // YYYY-MM-DD

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy token theo nhiều key (đồng bộ với các trang khác)
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('jwt_token') ||
        '';

      // ===== Tạo query string =====
      const params = new URLSearchParams();
      if (status) params.append('status', status);     // giữ nguyên Reserved/Expired/Completed cho BE
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);

      const url =
        `${API_BASE_URL}/webAPI/api/secure/my-bookings` +
        (params.toString() ? `?${params.toString()}` : '');

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // Đọc text rồi parse thủ công để không crash nếu payload không phải JSON hợp lệ
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

      // Nếu BE trả error (kể cả HTTP 200), ném lỗi để UI hiển thị
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (data && data.error) throw new Error(data.error);

      const items = Array.isArray(data.items) ? data.items : [];
      setBookings(items);
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử đặt lịch');
      setBookings([]); // clear
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => fetchBookings();

  return (
    <div className="booking-container">
      <h2 className="booking-title">Lịch sử đặt lịch đổi pin</h2>

      {/* ===== Bộ lọc ===== */}
      <div className="filter-bar">
        <div className="filter-item">
          <label>Từ ngày:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>Đến ngày:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>Trạng thái:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            {/* TEXT hiển thị tiếng Việt, VALUE giữ đúng format DB */}
            <option value="Reserved">Đặt trước</option>
            <option value="Expired">Hết hạn</option>
            <option value="Completed">Hoàn thành</option>
          </select>
        </div>
        <button className="btn-filter" onClick={handleFilter}>
          Lọc
        </button>
      </div>

      {loading && (
        <div style={{ color: '#666', textAlign: 'center' }}>
          Đang tải dữ liệu…
        </div>
      )}
      {error && (
        <div style={{ color: '#d32f2f', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <table className="booking-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Trạm</th>
              <th>Trạm sạc</th>
              <th>Xe</th>
              <th>Yêu cầu pin</th>
              <th>Ngày đặt</th>
              <th>Giờ đặt</th>
              <th>Ngày hết hạn</th>
              <th>Giờ hết hạn</th>
              <th>Slot ID</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const model = b.modelName || b.vehicleModelName || '-';
              const plate = b.licensePlate || b.vehicleLicensePlate || '-';
              return (
                <tr key={b.bookingId}>
                  <td>{b.bookingId}</td>
                  <td>{b.stationName || '-'}</td>
                  <td>{b.chargingStationName || '-'}</td>
                  <td title={b.vehicleId ? `Vehicle ID: ${b.vehicleId}` : undefined}>
                    {model} — {plate}
                  </td>
                  <td>{b.batteryRequest || '-'}</td>
                  <td>{b.bookingDate || '-'}</td>
                  <td>{b.bookingTime || '-'}</td>
                  <td>{b.expiredDate || '-'}</td>
                  <td>{b.expiredTime || '-'}</td>
                  <td>{b.slotId || '-'}</td>
                  <td style={{ color: getStatusColor(b.status), fontWeight: 600 }}>
                    {toViStatus(b.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div style={{ color: '#888', textAlign: 'center' }}>
          Không có dữ liệu hiển thị
        </div>
      )}
    </div>
  );
}
