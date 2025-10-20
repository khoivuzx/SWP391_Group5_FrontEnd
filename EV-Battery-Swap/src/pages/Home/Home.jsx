
import React, { useState, useEffect } from 'react';
import ReservationForm from '../../components/ReserveForm/ReservationForm';
import MapboxMap from '../../components/Mapbox/MapboxMap';
import API_BASE_URL from '../../config';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2hvaXZ1engiLCJhIjoiY21nNHcyZXZ4MHg5ZTJtcGtrNm9hbmVpciJ9.N3prC7rC3ycR6DV5giMUfg';

export default function Home() {
  const [selectedStation, setSelectedStation] = useState("");
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState("");

  useEffect(() => {
    setStationsLoading(true);
    setStationsError("");
    fetch("/src/data/stations.json")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load stations.json");
        return res.json();
      })
      .then(data => {
        setStations(data);
        setStationsLoading(false);
      })
      .catch(err => {
        setStationsError("Failed to load stations: " + err.message);
        setStationsLoading(false);
      });
  }, []);

  const handleFindPath = async () => {
    setRouteError("");
    if (!selectedStation) {
      setRouteError("Please select a station first.");
      return;
    }
    const stationObj = stations.find(s => s.name === selectedStation);
    if (!stationObj) {
      setRouteError("Station not found.");
      return;
    }
    setRouteLoading(true);
    const start = [106.660172, 10.762622];
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

  return (
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
            />
          )}
          {routeLoading && <div style={{ color: '#1976d2', marginTop: 8 }}>Finding route...</div>}
          {routeError && <div style={{ color: 'red', marginTop: 8 }}>{routeError}</div>}
        </div>
        <div style={{ flex: 7, height: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          <MapboxMap
            token={MAPBOX_TOKEN}
            stations={stations}
            selectedStation={selectedStation}
            setSelectedStation={setSelectedStation}
            routeGeoJSON={routeGeoJSON}
            showPopup={true}
            style={{ width: '100%', height: '100%', borderRadius: 12 }}
          />
        </div>
      </div>
    </main>
  );
}
