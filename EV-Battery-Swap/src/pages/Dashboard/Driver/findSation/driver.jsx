import React, { useState, useEffect, useRef } from 'react';
import './driver.css';
import MapboxMap from '../../../../components/Mapbox/MapboxMap';
import SearchForm from '../../../../components/SearchForm/SearchForm';
import useGeolocation from '../../../../hooks/useGeolocation';
import LocationPermissionModal from '../../../../components/LocationPermissionModal/LocationPermissionModal';
import API_BASE_URL from '../../../../config';
import TabBar from '../../../../components/TabBar/TabBar';
import { PolicesOnlyPricingFAQ } from '../../../Polices/polices';
import TransactionHistory from '../../../User/TransactionHistory';
import BookingHistory from '../Booking/BookingHistory';

// 👉 New: modal
import BookingModal from '../../../../components/Booking/BookingModal';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2hvaXZ1engiLCJhIjoiY21nNHcyZXZ4MHg5ZTJtcGtrNm9hbmVpciJ9.N3prC7rC3ycR6DV5giMUfg';

export default function DriverDashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [selectedStation, setSelectedStation] = useState('');
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null); // { distance, duration }
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [foundStations, setFoundStations] = useState([]);

  // Đọc tab từ localStorage khi khởi tạo
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('driverDashboardTab') || 'find';
  });

  // Lưu tab vào localStorage mỗi khi đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('driverDashboardTab', tab);
  };

  // modal state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStationName, setBookingStationName] = useState('');

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

  // Haversine
  function distanceMeters(a, b) {
    const toRad = v => v * Math.PI / 180;
    const [lon1, lat1] = a; const [lon2, lat2] = b;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1r = toRad(lat1); const lat2r = toRad(lat2);
    const aHarv = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1-aHarv));
    return R * c;
  }

  const { getCurrentPositionAsync, checkPermission } = useGeolocation();
  const [showPrePerm, setShowPrePerm] = useState(false);
  const prePermResolveRef = useRef(null);

  const handleFindBattery = async (chemistry) => {
    setFoundStations([]);
    if (!chemistry) return setRouteError('Please select a battery chemistry');
    setRouteError('');

    const perm = await checkPermission();
    if (perm === 'denied') {
      setRouteError('Location access blocked. Please enable location permission.');
      return [];
    }
    if (perm === 'prompt') {
      setShowPrePerm(true);
      const resp = await new Promise(resolve => { prePermResolveRef.current = resolve; });
      setShowPrePerm(false);
      prePermResolveRef.current = null;
      if (!resp) {
        setRouteError('Location permission required to find nearest stations.');
        return [];
      }
    }

    try {
      const pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000 });
      const userCoords = [pos.coords.longitude, pos.coords.latitude];
      setUserLocation(userCoords);

      // Fetch báo cáo pin guest và group theo stationName
      const candidates = [];
      try {
        const url = (API_BASE_URL || '') + '/webAPI/api/getStationBatteryReportGuest';
        const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' } });
        if (res.ok) {
          const payload = await res.json();
          const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
          const grouped = {};
          for (const item of list) {
            const name = String(item.stationName || item.station || '').trim().toLowerCase();
            if (!grouped[name]) grouped[name] = [];
            grouped[name].push(item);
          }
          for (const st of stations) {
            const key = String(st.name || '').trim().toLowerCase();
            const items = grouped[key] || [];
            const has = items.some(b => String(b.batteryType || b.chemistry || b.type || b.Battery_Type || '').toLowerCase().includes(chemistry.toLowerCase()));
            if (has) candidates.push({ name: st.name, station: st });
          }
        }
      } catch (_) {}

      if (!candidates.length) { setFoundStations([]); return []; }

      const withDistances = candidates.map(c => {
        const dest = c.station.coords || [(c.station.lng || c.station.longitude), (c.station.lat || c.station.latitude)];
        const dist = distanceMeters(userCoords, dest);
        return { ...c, distanceMeters: dist };
      }).sort((a,b) => a.distanceMeters - b.distanceMeters);

      const top3 = withDistances.slice(0, 3).map(r => ({
        name: r.name, distanceMeters: r.distanceMeters,
        coords: r.station.coords || [r.station.lng || r.station.longitude, r.station.lat || r.station.latitude]
      }));
      setFoundStations(top3);
      return top3;
    } catch (err) {
      setRouteError('Could not get location.');
      return [];
    }
  };

  const handleFindPath = async () => {
    setRouteError('');
    if (!selectedStation) {
      setRouteError('Please select a station first.');
      return;
    }
    let permState = await checkPermission();
    if (permState === 'denied') {
      setRouteError('Location access is blocked for this site. Please enable location in your browser settings.');
      return;
    }
    const stationObj = stations.find(s => s.name === selectedStation);
    if (!stationObj) {
      setRouteError('Station not found.');
      return;
    }
    setRouteLoading(true);
  setRouteSummary(null);
    let start;
    try {
      if (permState === 'prompt') {
        setShowPrePerm(true);
        const resp = await new Promise(resolve => { prePermResolveRef.current = resolve; });
        setShowPrePerm(false);
        prePermResolveRef.current = null;
        if (!resp) { setRouteLoading(false); setRouteError('Location permission required to guide.'); return; }
      }
      const pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000 });
      start = [pos.coords.longitude, pos.coords.latitude];
      setUserLocation(start);
    } catch (err) {
      setRouteError('Could not get current location. Using default location.');
      start = [106.660172, 10.762622];
    }
    const end = stationObj.coords;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.length) {
        setRouteGeoJSON(data.routes[0].geometry);
        setRouteSummary({ distance: data.routes[0].distance, duration: data.routes[0].duration });
      } else {
        setRouteError('No route found.'); setRouteGeoJSON(null); setRouteSummary(null);
      }
    } catch (_) {
      setRouteError('Failed to fetch route.'); setRouteGeoJSON(null); setRouteSummary(null);
    }
    setRouteLoading(false);
  };

  // Helpers for formatting
  const formatDistance = (meters) => {
    if (meters == null) return '';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };
  const formatDuration = (seconds) => {
    if (seconds == null) return '';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hours}h ${rem}m`;
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
  <TabBar tabs={tabList} active={activeTab} onChange={handleTabChange} />

        {activeTab === 'find' && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 16 }}>Tìm trạm đổi pin</h2>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 32 }}>
              {/* Cột trái: SearchForm (không còn BookingForm ở đây) */}
              <div style={{ flex: '1 1 420px', minWidth: 340, maxWidth: 440 }}>
                <SearchForm
                  stations={stations}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  onFindPath={handleFindPath}
                  foundStations={foundStations}
                  onFindBattery={handleFindBattery}
                />
                {routeLoading && <div style={{ marginTop: 8, color: '#333' }}>Finding route...</div>}
                {routeError && <div style={{ marginTop: 8, color: 'crimson' }}>{routeError}</div>}
                {routeSummary && (
                  <div style={{ marginTop: 8, background: '#f6f7fb', padding: '8px 12px', borderRadius: 8, color: '#222' }}>
                    <strong>Route:</strong>&nbsp;{formatDistance(routeSummary.distance)} • {formatDuration(routeSummary.duration)}
                  </div>
                )}
              </div>

              {/* Cột phải: Map */}
              <div className="driver-map-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', height: 420, flex: '2 1 600px', minWidth: 340, maxWidth: 900 }}>
                <MapboxMap
                  token={MAPBOX_TOKEN}
                  stations={stations}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  routeGeoJSON={routeGeoJSON}
                  routeSummary={routeSummary}
                  showPopup={true}
                  userLocation={userLocation}
                  onStationsLoaded={(data) => {
                    setStations(Array.isArray(data) ? data : (data.data || []));
                    setStationsLoading(false);
                    setStationsError('');
                  }}
                  onBookStation={(st) => {
                    // Khi nhấn "Book Now" trên popup — mở modal
                    const name = st?.name || st;
                    setSelectedStation(name);
                    setBookingStationName(name);
                    setBookingOpen(true);
                  }}
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
            <PolicesOnlyPricingFAQ user={user} />
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{padding:'32px 0'}}>
            <TransactionHistory user={user} />
          </div>
        )}
      </div>

      {/* Modal xin quyền vị trí (giữ nguyên) */}
      <LocationPermissionModal
        open={showPrePerm}
        onCancel={() => { if (prePermResolveRef.current) { prePermResolveRef.current(false); prePermResolveRef.current = null; } }}
        onConfirm={() => { if (prePermResolveRef.current) { prePermResolveRef.current(true); prePermResolveRef.current = null; } }}
      />

      {/* 🔔 Modal ĐẶT LỊCH mới */}
      <BookingModal
        open={bookingOpen}
        stationName={bookingStationName}
        onClose={() => setBookingOpen(false)}
      />
    </div>
  );
}
