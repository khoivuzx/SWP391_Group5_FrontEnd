
import React, { useState, useEffect, useRef } from 'react';
// BookingForm nội bộ cho đặt lịch
function BookingForm({ initialStation, stations: propStations, onSelectStation, containerRef, highlightKey }) {
  const [station, setStation] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(false);

  // Demo danh sách trạm (fallback to this if propStations not provided)
  const demoStations = [
    "Gogoro Central Park",
    "Gogoro Grand Park - Khu 1",
    "Gogoro Central Đồng Khởi",
    "Gogoro Golden River",
  ];
  const availableStations = Array.isArray(propStations) && propStations.length
    ? propStations.map(s => (typeof s === 'string' ? s : (s.name || s.stationName || ''))).filter(Boolean)
    : demoStations;
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

  useEffect(() => {
    if (initialStation) {
      setStation(initialStation);
      if (typeof onSelectStation === 'function') onSelectStation(initialStation);
    }
  }, [initialStation, onSelectStation]);

  useEffect(() => {
    if (highlightKey) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [highlightKey]);

  return (
  <div ref={containerRef} style={{ background: '#fff', borderRadius: 12, boxShadow: flash ? '0 0 0 4px rgba(25,118,210,0.12), 0 2px 12px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.07)', padding: 24, marginTop: 32, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', transition: 'box-shadow 280ms ease' }}>
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
            <select value={station} onChange={e => {
              const v = e.target.value;
              setStation(v);
              if (typeof onSelectStation === 'function') onSelectStation(v);
            }} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', marginTop: 4 }}>
              <option value="">-- Chọn trạm --</option>
              {availableStations.map(st => (
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
import SearchForm from '../../../../components/SearchForm/SearchForm';
import useGeolocation from '../../../../hooks/useGeolocation';
import LocationPermissionModal from '../../../../components/LocationPermissionModal/LocationPermissionModal';
import API_BASE_URL from '../../../../config';
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
  const [userLocation, setUserLocation] = useState(null);
  const [foundStations, setFoundStations] = useState([]);
  const bookingRef = useRef(null);
  const [bookingHighlightKey, setBookingHighlightKey] = useState(0);
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

  // Helper: distance in meters between two [lng,lat] points (Haversine)
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

    // Request user location via the geolocation hook
    const perm = await checkPermission();
    if (perm === 'denied') {
      setRouteError('Location access blocked. Please enable location permission.');
      return;
    }
    if (perm === 'prompt') {
      setShowPrePerm(true);
      const resp = await new Promise(resolve => { prePermResolveRef.current = resolve; });
      setShowPrePerm(false);
      prePermResolveRef.current = null;
      if (!resp) {
        setRouteError('Location permission required to find nearest stations.');
        return;
      }
    }

    let pos;
    try {
      pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000 });
      const userCoords = [pos.coords.longitude, pos.coords.latitude];
      setUserLocation(userCoords);

      // Fetch the full battery report once and group results by stationName.
      const candidates = [];
      try {
        const url = (API_BASE_URL || '') + '/webAPI/api/getStationBatteryReportGuest';
        const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': '1' } });
        if (res.ok) {
          const payload = await res.json();
          const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
          // group by stationName (normalize casing/whitespace)
          const grouped = {};
          for (const item of list) {
            const nameRaw = item.stationName || item.station || '';
            const name = String(nameRaw).trim().toLowerCase();
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
      } catch (e) {
        // fallthrough to empty candidates
      }

      if (!candidates.length) {
        setFoundStations([]);
        return [];
      }

      // Compute straight-line distance (meters) from user to each candidate and pick top 3 closest.
      const withDistances = candidates.map(c => {
        const dest = c.station.coords || [(c.station.lng || c.station.longitude), (c.station.lat || c.station.latitude)];
        const dist = distanceMeters(userCoords, dest);
        return { ...c, distanceMeters: dist };
      });

      withDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);
      const top3 = withDistances.slice(0, 3);
      const mapped = top3.map(r => ({ name: r.name, distanceMeters: r.distanceMeters, coords: r.station.coords || [r.station.lng || r.station.longitude, r.station.lat || r.station.latitude] }));
      setFoundStations(mapped);
      return mapped;
    } catch (err) {
      setRouteError('Could not get location.');
      return [];
    }
  };

  const handleFindPath = async () => {
    setRouteError("");
    if (!selectedStation) {
      setRouteError("Please select a station first.");
      return;
    }
    // Permissions API pre-check: use the reusable hook
    let permState = await checkPermission();
    if (permState === 'denied') {
      setRouteError('Location access is blocked for this site. Please enable location in your browser settings.');
      return;
    }
    const stationObj = stations.find(s => s.name === selectedStation);
    if (!stationObj) {
      setRouteError("Station not found.");
      return;
    }
    setRouteLoading(true);
    let start;
    try {
      if (permState === 'prompt') {
        setShowPrePerm(true);
        const resp = await new Promise(resolve => { prePermResolveRef.current = resolve; });
        setShowPrePerm(false);
        prePermResolveRef.current = null;
        if (!resp) {
          setRouteLoading(false);
          setRouteError('Location permission required to guide.');
          return;
        }
      }
      const pos = await getCurrentPositionAsync({ enableHighAccuracy: true, timeout: 10000 });
      start = [pos.coords.longitude, pos.coords.latitude];
      try { setUserLocation(start); } catch (e) {}
    } catch (err) {
      if (err && err.code === 1) setRouteError('Location permission denied. Using default location.');
      else if (err && err.code === 2) setRouteError('Position unavailable. Using default location.');
      else if (err && err.code === 3) setRouteError('Location request timed out. Using default location.');
      else setRouteError('Could not get current location. Using default location.');
      start = [106.660172, 10.762622];
    }
    const end = stationObj.coords;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        setRouteGeoJSON(data.routes[0].geometry);
      } else {
        setRouteError("No route found.");
        setRouteGeoJSON(null);
      }
    } catch (err) {
      setRouteError("Failed to fetch route.");
      setRouteGeoJSON(null);
    }
    setRouteLoading(false);
  };

  // When selectedStation changes (from map, search, or booking form), scroll booking into view and flash it
  useEffect(() => {
    if (selectedStation) {
      try {
        bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
      setBookingHighlightKey(k => k + 1);
    }
  }, [selectedStation]);

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
        <div className="driver-header-welcome">Xin chào, {user?.fullName || 'Driver'}!</div>
      </div>
      <div className="driver-main-wrap">
        <TabBar tabs={tabList} active={activeTab} onChange={setActiveTab} />
        {activeTab === 'find' && (
          <>
            <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 16 }}>Tìm trạm đổi pin</h2>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 32 }}>
              {/* Left column: SearchForm (map features) and BookingForm below */}
              <div style={{ flex: '1 1 420px', minWidth: 340, maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 24 }}>
                <SearchForm
                  stations={stations}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  onFindPath={handleFindPath}
                  foundStations={foundStations}
                  onFindBattery={handleFindBattery}
                />

                {/* Booking form below the search form */}
                <BookingForm initialStation={selectedStation} stations={stations} onSelectStation={setSelectedStation} containerRef={bookingRef} highlightKey={bookingHighlightKey} />
              </div>

              {/* Right column: Map (same as Home.jsx usage) */}
              <div className="driver-map-card" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden', height: 420, flex: '2 1 600px', minWidth: 340, maxWidth: 900 }}>
                <MapboxMap
                  token={MAPBOX_TOKEN}
                  stations={stations}
                  selectedStation={selectedStation}
                  setSelectedStation={setSelectedStation}
                  routeGeoJSON={routeGeoJSON}
                  showPopup={true}
                  userLocation={userLocation}
                  onStationsLoaded={(data) => {
                    setStations(Array.isArray(data) ? data : (data.data || []));
                    setStationsLoading(false);
                    setStationsError("");
                  }}
                  onBookStation={(st) => {
                    // Focus/select the station and optionally scroll booking into view
                    setSelectedStation(st?.name || st);
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
            <PolicesPricingFAQ user={user} />
          </div>
        )}
        {activeTab === 'history' && (
         <div style={{padding:'32px 0'}}>
            <TransactionHistory user={user} />
          </div>
        )}
      </div>
      <LocationPermissionModal
        open={showPrePerm}
        onCancel={() => { if (prePermResolveRef.current) { prePermResolveRef.current(false); prePermResolveRef.current = null; } }}
        onConfirm={() => { if (prePermResolveRef.current) { prePermResolveRef.current(true); prePermResolveRef.current = null; } }}
      />
    </div>
  );
}
