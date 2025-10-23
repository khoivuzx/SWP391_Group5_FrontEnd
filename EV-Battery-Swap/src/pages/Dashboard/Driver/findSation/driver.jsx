
import React, { useState, useEffect } from 'react';
// BookingForm nội bộ cho đặt lịch
function BookingForm() {
  const [station, setStation] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Demo danh sách trạm (có thể lấy từ prop hoặc API)
  const stations = [
    "Gogoro Central Park",
    "Gogoro Grand Park - Khu 1",
    "Gogoro Central Đồng Khởi",
    "Gogoro Golden River",
  ];
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
      if (!date || !time) {
        setError("Vui lòng chọn ngày và giờ đổi pin.");
        return;
      }
      const bookingDateTime = new Date(`${date}T${time}`);
      const now = new Date();
      if (isNaN(bookingDateTime.getTime())) {
        setError("Thời gian đặt lịch không hợp lệ.");
        return;
      }
      if (bookingDateTime <= now) {
        setError("Thời gian đặt lịch phải lớn hơn thời gian hiện tại.");
        return;
      }
      // Gửi API đặt lịch ở đây nếu cần
      setSuccess(true);
      setResult({
        bookingId: "BK00X",
        stationId: station,
        vehicleModel: vehicleName,
        bookingTime: `${date} ${time}`,
      });
    } catch (err) {
      setError(err.message || "Lỗi kết nối server!");
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24, marginTop: 32, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
      <h3 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12, color: '#1a7f37', textAlign: 'center' }}>Đặt lịch đổi pin</h3>
      {success ? (
        <div style={{ color: '#1a7f37', fontWeight: 500, textAlign: 'center' }}>
          ✅ Đăng ký thành công!<br />
          {result && (
            <div style={{ marginTop: 12 }}>
              <div>Mã đặt lịch: <b>{result.bookingId}</b></div>
              <div>Trạm: <b>{result.stationId}</b></div>
              <div>Model xe: <b>{result.vehicleModel}</b></div>
              <div>Thời gian: {result.bookingTime}</div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <label>
            Tên trạm:
            <select value={station} onChange={e => setStation(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', marginTop: 4 }}>
              <option value="">-- Chọn trạm --</option>
              {stations.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </label>
          <label>
            Tên xe:
            <select value={vehicleName} onChange={e => setVehicleName(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', marginTop: 4 }}>
              <option value="">-- Chọn xe --</option>
              {vehicles.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Ngày đổi pin:
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <label>
            Giờ đổi pin:
            <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', marginTop: 4 }} />
          </label>
          <button type="submit" style={{ marginTop: 8, padding: '10px 0', background: '#1a7f37', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>Đăng ký</button>
        </form>
      )}
    </div>
  );
}
import './driver.css';
import MapboxMap from '../../../../components/Mapbox/MapboxMap';
import TabBar from '../../../../components/TabBar/TabBar';
import { PolicesPricingFAQ } from '../../../Polices/polices';
import TransactionHistory from '../../../User/TransactionHistory';
import BookingHistory from '../Booking/BookingHistory';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2hvaXZ1engiLCJhIjoiY21nNHcyZXZ4MHg5ZTJtcGtrNm9hbmVpciJ9.N3prC7rC3ycR6DV5giMUfg';

export default function DriverDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [selectedStation, setSelectedStation] = useState("");
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState("");
  const [activeTab, setActiveTab] = useState('find');

  useEffect(() => {
    fetch('/data/stations.json')
      .then(res => res.json())
      .then(data => {
        setStations(data);
        setStationsLoading(false);
      })
      .catch(() => {
        setStationsError('Không thể tải danh sách trạm.');
        setStationsLoading(false);
      });
  }, []);

  const handleFindPath = () => {
    if (!selectedStation) return;
    setRouteLoading(true);
    setTimeout(() => {
      setRouteLoading(false);
      setRouteGeoJSON(null);
    }, 1000);
  };

  const tabList = [
    { label: 'Tìm trạm', value: 'find' },
    { label: 'Lịch đã đặt', value: 'booked' },
    { label: 'Gói dịch vụ', value: 'service' },
    { label: 'Lịch sử', value: 'history' },
  ];

  return (
    <div>
      <div className="driver-header-img-wrap">
        <img src="/img-header-driver.jpg" alt="Driver Header" className="driver-header-img" />
        <div className="driver-header-welcome">Welcome, {user?.fullName || 'Driver'}!</div>
      </div>
      <div className="driver-main-wrap">
        <TabBar tabs={tabList} active={activeTab} onChange={setActiveTab} />
        {activeTab === 'find' && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 16 }}>Tìm trạm đổi pin</h2>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 32 }}>
              {/* Cột trái: Đặt lịch + Tìm trạm */}
              <div style={{ flex: '1 1 420px', minWidth: 340, maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <BookingForm />
                <div className="driver-station-form-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 32, marginBottom: 0 }}>
                  <button
                    onClick={handleFindPath}
                    disabled={!selectedStation || routeLoading}
                    style={{
                      width: '100%',
                      padding: '12px 0',
                      background: '#1a7f37',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 17,
                      marginBottom: 16,
                      cursor: !selectedStation || routeLoading ? 'not-allowed' : 'pointer',
                      opacity: !selectedStation || routeLoading ? 0.7 : 1,
                      boxShadow: '0 2px 8px rgba(26,127,55,0.08)'
                    }}
                  >
                    {routeLoading ? 'Đang tìm đường...' : 'Tìm đường đến trạm'}
                  </button>
                  {stationsLoading && <div style={{ color: '#888', marginBottom: 8 }}>Đang tải danh sách trạm...</div>}
                  {stationsError && <div className="error" style={{ color: 'red', marginBottom: 8 }}>{stationsError}</div>}
                  {routeError && <div className="error" style={{ color: 'red', marginBottom: 8 }}>{routeError}</div>}
                </div>
              </div>
              {/* Cột phải: Map */}
              <div className="driver-map-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', height: 420, flex: '2 1 600px', minWidth: 340, maxWidth: 900 }}>
                <MapboxMap
                  token={MAPBOX_TOKEN}
                  stations={stations}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  routeGeoJSON={routeGeoJSON}
                  showPopup={true}
                  style={{ width: '100%', height: 420, borderRadius: 16 }}
                />
              </div>
            </div>
          </>
        )}
        {activeTab === 'booked' && (
          <div style={{padding:'32px 0'}}>
            <BookingHistory user={user} />
          </div>
        )}
        {activeTab === 'service' && (
          <div style={{padding:'32px 0'}}>
            <PolicesPricingFAQ user={user} />
          </div>
        )}
        {activeTab === 'history' && (
         <div style={{padding:'32px 0'}}>
            <TransactionHistory user={user} />
          </div>
        )}
      </div>
    </div>
  );
}
