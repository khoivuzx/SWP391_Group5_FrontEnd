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
              <option value="">-- Chọn trạm --</option>              rm -rf node_modules ; npm install ; npm run dev
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
          <label style={{display:'block'}}>
            <span style={{display:'flex',alignItems:'center',gap:8,fontWeight:500}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>
              Chọn ngày
            </span>
            <div style={{display:'flex',justifyContent:'center',margin:'16px 0'}}>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="booking-input"
                style={{padding:'0.5rem 1rem',borderRadius:'8px',border:'1px solid #ececf0',fontSize:'1rem'}}
              />
            </div>
          </label>
          <label style={{display:'block'}}>
            <span style={{display:'flex',alignItems:'center',gap:8,fontWeight:500}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4}}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Chọn giờ
            </span>
            <div style={{margin:'16px 0'}}>
              <select
                value={time}
                onChange={e => setTime(e.target.value)}
                required
                className="booking-input"
                style={{padding:'0.5rem 1rem',borderRadius:'8px',border:'1px solid #ececf0',fontSize:'1rem'}}
              >
                <option value="">Chọn khung giờ</option>
                {[...Array(13)].map((_,i)=>{
                  const hour = 7+i;
                  const label = `${hour.toString().padStart(2,'0')}:00`;
                  return (
                    <option key={label} value={label}>{label}</option>
                  );
                })}
              </select>
            </div>
          </label>
          <button type="submit">Đăng ký</button>
        </form>
      )}
    </div>
  );
}
