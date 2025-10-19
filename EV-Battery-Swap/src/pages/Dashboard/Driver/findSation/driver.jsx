import React, { useRef, useEffect, useState } from 'react';
import './driver.css';
import mapboxgl from 'mapbox-gl';

// Mapbox token (có thể lấy từ Home.jsx hoặc config riêng)
const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2hvaXZ1engiLCJhIjoiY21nNHcyZXZ4MHg5ZTJtcGtrNm9hbmVpciJ9.N3prC7rC3ycR6DV5giMUfg';

export default function DriverDashboard() {
  // Lấy tên user từ localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  // --- Mapbox logic (reuse from Home.jsx) ---
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [selectedStation, setSelectedStation] = useState("");
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState("");
  const markerRefs = useRef({});
  const popupRefs = useRef({});

  // Load stations from JSON file
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

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      accessToken: MAPBOX_TOKEN,
      center: [105.85, 21.03],
      zoom: 11
    });
  }, []);

  // Add markers when stations are loaded
  useEffect(() => {
    if (!map.current || !Array.isArray(stations)) return;
    import('mapbox-gl').then(mapboxgl => {
      // Remove old markers
      Object.values(markerRefs.current).forEach(marker => marker.remove && marker.remove());
      markerRefs.current = {};
      popupRefs.current = {};
      stations.forEach(station => {
        const popup = new mapboxgl.Popup({ offset: 25 }).setText(station.name);
        const marker = new mapboxgl.Marker()
          .setLngLat([station.lng, station.lat])
          .setPopup(popup)
          .addTo(map.current);
        markerRefs.current[station.name] = marker;
        popupRefs.current[station.name] = popup;
      });
    });
  }, [stations]);

  // Effect: when selectedStation changes, zoom to it and open popup
  useEffect(() => {
    if (!map.current || !selectedStation) return;
    const station = stations.find(s => s.name === selectedStation);
    if (station) {
      map.current.flyTo({ center: [station.lng, station.lat], zoom: 14 });
      if (popupRefs.current[station.name]) popupRefs.current[station.name].addTo(map.current);
    }
  }, [selectedStation, stations]);

  // Effect to draw/remove route on map
  useEffect(() => {
    if (!map.current) return;
    if (routeGeoJSON) {
      if (map.current.getSource('route')) {
        map.current.getSource('route').setData(routeGeoJSON);
      } else {
        map.current.addSource('route', {
          type: 'geojson',
          data: routeGeoJSON
        });
        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 5 }
        });
      }
    } else {
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
        map.current.removeSource('route');
      }
    }
  }, [routeGeoJSON]);

  // Handler: Find path (demo, chỉ zoom đến trạm)
  const handleFindPath = () => {
    if (!selectedStation) return;
    setRouteLoading(true);
    setTimeout(() => {
      setRouteLoading(false);
      // Demo: không gọi API route thật, chỉ zoom
      setRouteGeoJSON(null);
    }, 1000);
  };

  return (
    <div>
      <div className="driver-header-img-wrap">
        <img src="/img-header-driver.jpg" alt="Driver Header" className="driver-header-img" />
        <div className="driver-header-welcome">Welcome, {user.fullName}!</div>
      </div>
      {/* Giao diện tìm trạm và bản đồ Mapbox */}
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
            <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
