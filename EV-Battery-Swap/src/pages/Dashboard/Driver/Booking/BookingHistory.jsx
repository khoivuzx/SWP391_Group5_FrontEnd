import React from 'react';
import './booking.css';

export default function BookingHistory() {
  // TODO: Replace with real API data
  const bookings = [
    {
      id: 'BK-001',
      station: 'Gogoro Central Park',
      vehicle: 'Gogoro 2 Delight',
      date: '2025-12-31',
      time: '12:31',
      status: 'Thành công',
    },
    {
      id: 'BK-002',
      station: 'Gogoro Golden River',
      vehicle: 'Gogoro Viva Mix',
      date: '2025-11-15',
      time: '09:00',
      status: 'Đã hủy',
    },
  ];

  return (
    <div className="booking-container">
      <h2 className="booking-title">Lịch sử đặt lịch đổi pin</h2>
      <div style={{marginTop: 18}}>
        {bookings.length === 0 ? (
          <div style={{color:'#888',textAlign:'center'}}>Chưa có lịch sử đặt lịch.</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',marginTop:8}}>
            <thead>
              <tr style={{background:'#f7f8fa'}}>
                <th style={{padding:'10px',borderBottom:'1.5px solid #e0e7ef'}}>Mã</th>
                <th style={{padding:'10px',borderBottom:'1.5px solid #e0e7ef'}}>Trạm</th>
                <th style={{padding:'10px',borderBottom:'1.5px solid #e0e7ef'}}>Xe</th>
                <th style={{padding:'10px',borderBottom:'1.5px solid #e0e7ef'}}>Ngày</th>
                <th style={{padding:'10px',borderBottom:'1.5px solid #e0e7ef'}}>Giờ</th>
                <th style={{padding:'10px',borderBottom:'1.5px solid #e0e7ef'}}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{background:'#fff'}}>
                  <td style={{padding:'10px',borderBottom:'1px solid #f0f4fa',fontWeight:600}}>{b.id}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f0f4fa'}}>{b.station}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f0f4fa'}}>{b.vehicle}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f0f4fa'}}>{b.date}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f0f4fa'}}>{b.time}</td>
                  <td style={{padding:'10px',borderBottom:'1px solid #f0f4fa',color:b.status==='Thành công'?'#10B981':'#d32f2f',fontWeight:700}}>{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
