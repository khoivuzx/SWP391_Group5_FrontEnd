import React, { useState } from 'react';

export default function Booking() {
  const [station, setStation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [batteryType, setBatteryType] = useState('Gogoro');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  // Demo danh sách trạm, thực tế lấy từ API
  const stations = [
    'GoStation Hà Nội',
    'GoStation Đà Nẵng',
    'GoStation Hồ Chí Minh',
    'GoStation Hải Phòng',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Gửi dữ liệu đặt lịch tới API
    setSuccess(true);
  };

  return (
    <div style={{maxWidth: 480, margin: '48px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(33,150,243,0.08)', padding: 32}}>
      <h2 style={{color: '#1976d2', textAlign: 'center', marginBottom: 18}}>Đặt lịch đổi pin</h2>
      {success ? (
        <div style={{color: '#10B981', fontWeight: 600, textAlign: 'center', fontSize: '1.1rem'}}>
          Đặt lịch thành công! Vui lòng đến trạm đúng giờ để đổi pin.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 18}}>
          <label>
            Chọn trạm:
            <select value={station} onChange={e => setStation(e.target.value)} required style={{marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e7ef'}}>
              <option value="">-- Chọn trạm --</option>
              {stations.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </label>
          <label>
            Ngày đổi pin:
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e7ef'}} />
          </label>
          <label>
            Giờ đổi pin:
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={{marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e7ef'}} />
          </label>
          <label>
            Loại pin:
            <select value={batteryType} onChange={e => setBatteryType(e.target.value)} style={{marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e7ef'}}>
              <option value="Gogoro">Gogoro</option>
              <option value="VinFast">VinFast</option>
            </select>
          </label>
          <label>
            Số lượng pin:
            <input type="number" min={1} max={4} value={quantity} onChange={e => setQuantity(e.target.value)} style={{marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e7ef', width: 80}} />
          </label>
          <label>
            Ghi chú (tuỳ chọn):
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} style={{marginTop: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e7ef'}} />
          </label>
          <button type="submit" style={{background: 'linear-gradient(90deg,#1976d2,#10B981)', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '12px 0', fontSize: '1.1rem', marginTop: 12, cursor: 'pointer'}}>Đặt lịch</button>
        </form>
      )}
    </div>
  );
}
