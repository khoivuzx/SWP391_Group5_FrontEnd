import React, { useRef, useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import reactLogo from '../../assets/react.svg';
import API_BASE_URL from '../../config';

// Global Mapbox token constant
const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2hvaXZ1engiLCJhIjoiY21nNHcyZXZ4MHg5ZTJtcGtrNm9hbmVpciJ9.N3prC7rC3ycR6DV5giMUfg';

import ReservationForm from '../../components/ReserveForm/ReservationForm';

export default function Home() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // Lifted state for selected station
  const [selectedStation, setSelectedStation] = useState("");
  // State for route GeoJSON
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  // State for loading/error
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");

  // Find path handler
  const handleFindPath = async () => {
    setRouteError("");
    if (!selectedStation) {
      setRouteError("Please select a station first.");
      return;
    }
    // Find station object
    const stationObj = stations.find(s => s.name === selectedStation);
    if (!stationObj) {
      setRouteError("Station not found.");
      return;
    }
    setRouteLoading(true);
    // HCM City coordinates (fixed start)
    const start = [106.660172, 10.762622];
    const end = stationObj.coords;
    // Mapbox Directions API URL
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

  // Load stations from JSON file
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [stationsError, setStationsError] = useState("");
  // Battery cache (we'll fetch the global report once when a popup opens)
  const batteryCacheRef = useRef(new Map());
  const batteryLoadingRef = useRef(false);

  // Helper to build popup HTML for a station's battery list
  function renderBatteryHtml(station, batteries) {
    let html = '';
    if (batteries && batteries.length) {
      const totalSum = batteries.reduce((s, b) => s + (Number(b.Total ?? b.total ?? b.Total ?? 0)), 0);
      html += `<div style="font-weight:600; margin-bottom:6px;">Batteries — total: ${totalSum}</div>`;
      const hasAggregates = batteries.some(b => b.Good != null || b.Total != null || b.Average != null || b.Weak != null || b.Below75 != null);
      if (hasAggregates) {
        html += '<div style="max-height:220px; overflow:auto; text-align:left;">';
        html += '<table style="width:100%; border-collapse:collapse; font-size:0.95em;">';
        html += '<thead><tr style="text-align:left; border-bottom:1px solid rgba(0,0,0,0.08);"><th>Type</th><th style="padding-left:8px">Good</th><th style="padding-left:8px">Avg</th><th style="padding-left:8px">Weak</th><th style="padding-left:8px">&lt;75%</th><th style="padding-left:8px">Total</th></tr></thead>';
        html += '<tbody>';
        batteries.forEach(b => {
          const type = b.batteryType ?? b.BatteryType ?? b.battery_type ?? b.type ?? b.batteryTypeName ?? '';
          const good = b.Good ?? b.good ?? 0;
          const avg = b.Average ?? b.average ?? b.Avg ?? 0;
          const weak = b.Weak ?? b.weak ?? 0;
          const below = b.Below75 ?? b.below75 ?? b.Below ?? 0;
          const total = b.Total ?? b.total ?? 0;
          const colorCell = (v, color) => `<td style="padding-left:8px; color:${color}; font-weight:600">${v}</td>`;
          html += `<tr style="border-bottom:1px solid rgba(0,0,0,0.04);"><td style="padding:6px 0">${type}</td>${colorCell(good,'#16a34a')}${colorCell(avg,'#f59e0b')}${colorCell(weak,'#ef4444')}${colorCell(below,'#6b7280')}<td style="padding-left:8px">${total}</td></tr>`;
        });
        html += '</tbody></table></div>';
      } else {
        html += '<div style="max-height:160px; overflow:auto; text-align:left;">';
        batteries.forEach(b => {
          const label = b.Name || b.name || b.BatteryCode || b.Battery_SN || b.serial || b.Serial || JSON.stringify(b);
          html += `<div style="padding:4px 0; border-bottom:1px solid rgba(0,0,0,0.04);">${label}</div>`;
        });
        html += '</div>';
      }
    } else {
      html = '<div>No battery data available</div>';
    }
    return html;
  }

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

  // Store marker and popup references by station name
  const markerRefs = useRef({});
  const popupRefs = useRef({});
  // Initialize map only once
  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [106.660172, 10.762622],
      zoom: 12
    });
    map.current.on('load', () => {
      map.current.resize();
    });
  }, []);

  // Add markers when stations are loaded
  useEffect(() => {
    if (!map.current || !stations.length) return;
    // Remove old markers/popups
    Object.values(markerRefs.current).forEach(marker => marker.remove && marker.remove());
    markerRefs.current = {};
    popupRefs.current = {};
    stations.forEach((station) => {
      if (!station.coords) return;
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundImage = `url(${reactLogo})`;
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.backgroundSize = '100%';
      el.style.borderRadius = '50%';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      el.style.cursor = 'pointer';
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div style=\"color: #111; font-size: 1.1em; font-weight: 600;\">${station.name}</div>
          <div id=\"battery-container-${station.id}\" style=\"margin-top: 6px; color: #333; font-size: 0.95em;\">Click to load batteries</div>
        `);
      const marker = new mapboxgl.Marker(el)
        .setLngLat(station.coords)
        .setPopup(popup)
        .addTo(map.current);
      markerRefs.current[station.name] = marker;
      popupRefs.current[station.name] = popup;
      // Lazy-load batteries when popup opens
      popup.on('open', async () => {
        const containerId = `battery-container-${station.id}`;
        const popupEl = document.getElementById(containerId);
        if (popupEl) popupEl.innerHTML = 'Loading batteries...';

        // If we've already fetched and cached the list, use it
        if (batteryCacheRef.current.has('all')) {
          const list = batteryCacheRef.current.get('all');
          const stationB = list.filter(b => String(b.stationId ?? b.Station_ID ?? b.stationId ?? b.station) === String(station.id));
          const html = renderBatteryHtml(station, stationB);
          if (popupEl) popupEl.innerHTML = html;
          return;
        }

        // Avoid duplicate simultaneous fetches
        if (batteryLoadingRef.current) {
          if (popupEl) popupEl.innerHTML = 'Loading batteries...';
          return;
        }
        batteryLoadingRef.current = true;
        try {
          const url = `${API_BASE_URL}/webAPI/api/getStationBatteryReportGuest`;
          const res = await fetch(url, { credentials: 'omit', headers: { 'ngrok-skip-browser-warning': '1', 'Accept': 'application/json' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : []);
          batteryCacheRef.current.set('all', list);
          const stationB = list.filter(b => String(b.stationId ?? b.Station_ID ?? b.station_id ?? b.station) === String(station.id));
          const html = renderBatteryHtml(station, stationB);
          if (popupEl) popupEl.innerHTML = html;
        } catch (err) {
          if (popupEl) popupEl.innerHTML = '<div style="color:#c00">Failed to load batteries</div>';
        } finally {
          batteryLoadingRef.current = false;
        }
      });
    });
  }, [stations]);

  // We will lazy-load batteryReports when a popup opens. batteryLoadingRef prevents duplicate fetches.

  // Effect: when selectedStation changes, zoom to it and open popup
  useEffect(() => {
    if (!map.current || !selectedStation) return;
    // Close all popups
    Object.values(popupRefs.current).forEach(popup => {
      if (popup && popup.isOpen()) popup.remove();
    });
    const stationObj = stations.find(s => s.name === selectedStation);
    if (!stationObj) return;
    map.current.flyTo({ center: stationObj.coords, zoom: 15, speed: 1.2 });
    // Open popup for the marker
    const marker = markerRefs.current[selectedStation];
    const popup = popupRefs.current[selectedStation];
    if (marker && popup) {
      marker.setPopup(popup);
      popup.addTo(map.current);
    }
  }, [selectedStation]);

  // Effect to draw/remove route on map
  useEffect(() => {
    if (!map.current) return;
    // Remove previous route layer/source if exists
    if (map.current.getLayer('route-line')) {
      map.current.removeLayer('route-line');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }
    if (routeGeoJSON) {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: routeGeoJSON
        }
      });
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1976d2',
          'line-width': 6,
          'line-opacity': 0.85
        }
      });
      // Optionally fit bounds to route
      const coords = routeGeoJSON.coordinates;
      if (coords && coords.length > 1) {
        const bounds = coords.reduce(function(bounds, coord) {
          return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
        map.current.fitBounds(bounds, { padding: 60 });
      }
    }
  }, [routeGeoJSON]);

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
{/* Layout: Left (3 parts) - Right (7 parts)*/}
      <div style={{ display: 'flex', height: '80vh', gap: '16px', padding: '24px' }}>
        {/* Left: Reservation Form (3 parts) */}
        <div style={{ flex: 3 }}>
          {stationsLoading && <div>Loading stations...</div>}
          {stationsError && <div style={{color:'red'}}>{stationsError}</div>}
          {!stationsLoading && !stationsError && (
            <ReservationForm 
              stations={stations}
              selectedStation={selectedStation}
              setSelectedStation={setSelectedStation}
              onFindPath={handleFindPath}
            />
          )}
          {routeLoading && <div style={{color:'#1976d2',marginTop:8}}>Finding route...</div>}
          {routeError && <div style={{color:'red',marginTop:8}}>{routeError}</div>}
        </div>

        {/* Right: Map (7 parts) */}
        <div
          ref={mapContainer}
          style={{
            flex: 7,
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          }}
        />
      </div>
     
    </main>
  );
}
