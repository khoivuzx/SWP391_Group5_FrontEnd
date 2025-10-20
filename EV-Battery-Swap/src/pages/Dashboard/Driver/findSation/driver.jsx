
import React, { useState, useEffect } from 'react';
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
            <div className="driver-station-flex">
              <div className="driver-station-form-card">
                <button
                  onClick={handleFindPath}
                  disabled={!selectedStation || routeLoading}
                >
                  {routeLoading ? 'Đang tìm đường...' : 'Tìm đường đến trạm'}
                </button>
                {stationsLoading && <div>Đang tải danh sách trạm...</div>}
                {stationsError && <div className="error">{stationsError}</div>}
                {routeError && <div className="error">{routeError}</div>}
              </div>
              <div className="driver-map-card">
                <MapboxMap
                  token={MAPBOX_TOKEN}
                  stations={stations}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  routeGeoJSON={routeGeoJSON}
                  showPopup={true}
                  style={{ width: '100%', height: '100%', borderRadius: 16 }}
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
