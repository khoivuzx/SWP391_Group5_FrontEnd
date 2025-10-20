
import React, { useState, useEffect } from 'react';
import './driver.css';
import MapboxMap from '../../../../components/Mapbox/MapboxMap';

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

  return (
    <div>
      <div className="driver-header-img-wrap">
        <img src="/img-header-driver.jpg" alt="Driver Header" className="driver-header-img" />
        <div className="driver-header-welcome">Welcome, {user?.fullName || 'Driver'}!</div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 16 }}>Tìm trạm đổi pin</h2>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 260, flex: '0 0 260px' }}>
            <label htmlFor="station-select" style={{ fontWeight: 600 }}>Chọn trạm:</label>
            <select
              id="station-select"
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 8, margin: '12px 0 18px 0', fontSize: 16 }}
            >
              <option value="">-- Chọn trạm --</option>
              {stations.map(station => (
                <option key={station.name} value={station.name}>{station.name}</option>
              ))}
            </select>
            <button
              onClick={handleFindPath}
              disabled={!selectedStation || routeLoading}
              style={{ width: '100%', padding: '10px 0', borderRadius: 8, background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 17, border: 'none', cursor: selectedStation ? 'pointer' : 'not-allowed', marginBottom: 12 }}
            >
              {routeLoading ? 'Đang tìm đường...' : 'Tìm đường đến trạm'}
            </button>
            {stationsLoading && <div>Đang tải danh sách trạm...</div>}
            {stationsError && <div style={{ color: 'red' }}>{stationsError}</div>}
            {routeError && <div style={{ color: 'red' }}>{routeError}</div>}
          </div>
          <div style={{ flex: 1, minWidth: 320, height: 420, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
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
      </div>
    </div>
  );
}
