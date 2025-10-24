import React, { useEffect, useState } from 'react';
import './booking.css';
import API_BASE_URL from '../../../../config';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bộ lọc
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken') || '';

      // ===== Tạo query string =====
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);

      const url = `${API_BASE_URL}/webAPI/api/secure/my-bookings?${params.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err.message || 'Không thể tải lịch sử đặt lịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleFilter = () => fetchBookings();

  const getStatusColor = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'complete') return '#10B981';
    if (s === 'expired') return '#EF4444';
    if (s === 'reserved' || s === 'reverse') return '#FACC15';
    return '#111827';
  };

  return (
    <div className="booking-container">
      <h2 className="booking-title">Lịch sử đặt lịch đổi pin</h2>

      {/* ===== Bộ lọc ===== */}
      <div className="filter-bar">
        <div className="filter-item">
          <label>Từ ngày:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>Đến ngày:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="filter-item">
          <label>Trạng thái:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="Reserved">Reserved</option>
            <option value="Expired">Expired</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <button className="btn-filter" onClick={handleFilter}>
          Lọc
        </button>
      </div>

      {loading && <div style={{ color: '#666', textAlign: 'center' }}>Đang tải dữ liệu…</div>}
      {error && <div style={{ color: '#d32f2f', textAlign: 'center' }}>{error}</div>}

      {!loading && !error && bookings.length > 0 && (
        <table className="booking-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Trạm</th>
              <th>Trạm sạc</th>
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
            {bookings.map((b) => (
              <tr key={b.bookingId}>
                <td>{b.bookingId}</td>
                <td>{b.stationName || '-'}</td>
                <td>{b.chargingStationName || '-'}</td>
                <td>{b.batteryRequest || '-'}</td>
                <td>{b.bookingDate || '-'}</td>
                <td>{b.bookingTime || '-'}</td>
                <td>{b.expiredDate || '-'}</td>
                <td>{b.expiredTime || '-'}</td>
                <td>{b.slotId || '-'}</td>
                <td style={{ color: getStatusColor(b.status), fontWeight: 600 }}>
                  {b.status || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div style={{ color: '#888', textAlign: 'center' }}>Không có dữ liệu hiển thị</div>
      )}
    </div>
  );
}
