// DEBUG: log mọi lần gọi fetch để biết URL + method + nơi khởi tạo
if (typeof window !== 'undefined' && !window.__FETCH_SPY__) {
  window.__FETCH_SPY__ = true;
  const _fetch = window.fetch;
  window.fetch = function (...args) {
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input?.url;
    const method = (init?.method || 'GET').toUpperCase();
    if (url?.includes('/webAPI/api/getStationBatteryReportGuest')) {
      console.group('[FETCH getStationBatteryReportGuest]');
      console.log('Method:', method);
      console.log('URL:', url);
      console.log('Init:', init);
      console.trace('Initiator stack');
      console.groupEnd();
    }
    return _fetch.apply(this, args);
  };
}

import React, { useState, useEffect, useRef } from 'react';
import ReservationForm from '../../components/ReserveForm/ReservationForm';
import MapboxMap from '../../components/Mapbox/MapboxMap';
import API_BASE_URL from '../../config';
import useGeolocation from '../../hooks/useGeolocation';
import LocationPermissionModal from '../../components/LocationPermissionModal/LocationPermissionModal';
import RegisterModal from '../../components/Login/RegisterModal';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2hvaXZ1engiLCJhIjoiY21nNHcyZXZ4MHg5ZTJtcGtrNm9hbmVpciJ9.N3prC7rC3ycR6DV5giMUfg';

export default function Home() {
  const [selectedStation, setSelectedStation] = useState("");
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [bookingMsg, setBookingMsg] = useState("");

  // onStationsLoaded will be called by MapboxMap when it loads stations.json internally
  const handleStationsLoaded = (data) => {
    setStations(Array.isArray(data) ? data : (data.data || []));
    setStationsLoading(false);
    setStationsError("");
  };

  const handleBookStation = (station) => {
    // If guest (no auth), open register modal with explanation
    // For now we assume this page is guest-only; show register modal
    setShowRegister(true);
    setRegisterNote(`To book a battery at ${station.name} you need an account. Please register to continue.`);
  };

  const [showRegister, setShowRegister] = useState(false);
  const [registerNote, setRegisterNote] = useState('');

  // Helper: distance in meters between two [lng,lat] points (Haversine)
  function distanceMeters(a, b) {
    const toRad = v => v * Math.PI / 180;
    const [lon1, lat1] = a; const [lon2, lat2] = b;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lat2 - lat1) ? toRad(lon2 - lon1) : toRad(lon2 - lon1); // keep function body unchanged in spirit
    const lat1r = toRad(lat1); const lat2r = toRad(lat2);
    const aHarv = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(aHarv), Math.sqrt(1-aHarv));
    return R * c;
  }

  const [foundStations, setFoundStations] = useState([]);

  // Find stations that have batteries of the given chemistry. This flow requests location permission first.
 // Find stations that have batteries of the given chemistry. This flow requests location permission first.
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

    // fetch battery reports for each station (sequential to be gentle)
    const results = [];
    for (const st of stations) {
      try {
        // ✅ BE chỉ hỗ trợ GET; ưu tiên truyền stationId nếu có
        const qs = (st.id != null) ? `?stationId=${encodeURIComponent(st.id)}` : '';
        const url = (API_BASE_URL || '') + '/webAPI/api/getStationBatteryReportGuest' + qs;

        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': '1',
          },
        });
        if (!res.ok) continue;

        const payload = await res.json();
        // BE thường trả { status, data: [...] }
        const arr = Array.isArray(payload?.data) ? payload.data
                  : (Array.isArray(payload) ? payload : []);
        const rep = arr[0] || payload;

        const items =
          Array.isArray(rep?.batteries) ? rep.batteries :
          Array.isArray(rep?.items) ? rep.items :
          Array.isArray(rep?.detail) ? rep.detail : [];

        const has = items.some(b =>
          String(b.chemistry || b.type || b.Battery_Type || '')
            .toLowerCase()
            .includes(chemistry.toLowerCase())
        );

        if (has) {
          const dist = distanceMeters(userCoords, st.coords);
          results.push({ name: st.name, station: st, distanceMeters: dist });
        }
      } catch (e) {
        continue;
      }
    }

    results.sort((a,b) => a.distanceMeters - b.distanceMeters);
    const mapped = results.map(r => ({ name: r.name, distanceMeters: r.distanceMeters, coords: r.station.coords }));
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
      // show in-page guidance — browser will not prompt again until user changes settings
      setRouteError('Location access is blocked for this site. Please enable location in your browser settings.');
      return;
    }
    const stationObj = stations.find(s => s.name === selectedStation);
    if (!stationObj) {
      setRouteError("Station not found.");
      return;
    }
    setRouteLoading(true);
    // Always attempt to get the user's current position when guiding.
    // The browser will show its permission prompt if the permission state is "prompt".
    let start;
    try {
      // If permission state is 'prompt' show a pre-permission explanation modal
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
      // store the user's location so the map can render a marker
      try { setUserLocation(start); } catch (e) {}
    } catch (err) {
      // If the user denies or an error occurs, show a helpful message and fall back to default coords
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

  const { getCurrentPositionAsync, checkPermission } = useGeolocation();
  const [showPrePerm, setShowPrePerm] = useState(false);
  const prePermResolveRef = useRef(null);

  return (
    <>
    <main style={{ padding: 0, margin: 0 }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      >
        <source src="/promo.mp4" type="video/mp4" />
      </video>
      <img
        src="/homemap.jpg"
        alt="Sơ đồ các trạm"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <div style={{ display: 'flex', height: '80vh', gap: '16px', padding: '24px' }}>
        <div style={{ flex: 3 }}>
          {stationsLoading && <div>Loading stations...</div>}
          {stationsError && <div style={{ color: 'red' }}>{stationsError}</div>}
          {!stationsLoading && !stationsError && (
            <ReservationForm
              stations={stations}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              onFindPath={handleFindPath}
              foundStations={foundStations}
              onFindBattery={handleFindBattery}
            />
          )}
          {routeLoading && <div style={{ color: '#1976d2', marginTop: 8 }}>Finding route...</div>}
          {routeError && <div style={{ color: 'red', marginTop: 8 }}>{routeError}</div>}
        </div>
        <div style={{ flex: 7, height: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          <MapboxMap
            token={MAPBOX_TOKEN}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            routeGeoJSON={routeGeoJSON}
            showPopup={true}
            userLocation={userLocation}
            onStationsLoaded={handleStationsLoaded}
            onBookStation={handleBookStation}
            style={{ width: '100%', height: '100%', borderRadius: 12 }}
          />
        </div>
      </div>
    </main>
      <LocationPermissionModal
        open={showPrePerm}
        onCancel={() => { if (prePermResolveRef.current) { prePermResolveRef.current(false); prePermResolveRef.current = null; } }}
        onConfirm={() => { if (prePermResolveRef.current) { prePermResolveRef.current(true); prePermResolveRef.current = null; } }}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => { /* optionally open login modal - not implemented here */ setShowRegister(false); }}
      >
        {/* provide a short explanation above the form via a simple element insertion if modal supports children */}
        <div style={{ padding: '12px 20px', background: '#fff', color: '#333' }}>{registerNote}</div>
      </RegisterModal>
    </>
  );
}
