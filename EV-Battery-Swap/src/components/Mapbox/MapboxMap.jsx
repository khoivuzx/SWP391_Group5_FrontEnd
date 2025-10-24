import React, { useRef, useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import API_BASE_URL from '../../config';
import reactLogo from '../../assets/react.svg';
import { createMapManager } from '../../utils/mapManager';

/**
 * MapboxMap component
 * @param {string} token - Mapbox access token
 * @param {Array} stations - Array of station objects [{ name, lat, lng, ... }]
 * @param {string} selectedStation - Name of selected station
 * @param {function} setSelectedStation - Setter for selected station
 * @param {object} [routeGeoJSON] - GeoJSON for route (optional)
 * @param {function} [onFindPath] - Handler for finding path (optional)
 * @param {boolean} [showPopup] - Whether to show popup on marker click
 */
export default function MapboxMap({
  token,
  stations = [],
  selectedStation,
  setSelectedStation,
  routeGeoJSON,
  onFindPath,
  showPopup = true,
  style = { width: '100%', height: '400px', borderRadius: '16px' },
  userLocation = null,
  onStationsLoaded = null,
  onBookStation = null,
}) {
  const [internalStations, setInternalStations] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerRefs = useRef({});
  const popupRefs = useRef({});
  const batteryCacheRef = useRef({});
  const mapManagerRef = useRef(null);
  const openPopupRef = useRef(null);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      mapboxgl.accessToken = token;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: stations.length ? [stations[0].lng, stations[0].lat] : [106.7, 10.8],
        zoom: 12,
      });
      try { mapManagerRef.current = createMapManager(map.current); } catch (e) { mapManagerRef.current = null; }
    }
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    if (!map.current) return;
    const stationsToUse = Array.isArray(stations) && stations.length ? stations : (Array.isArray(internalStations) ? internalStations : null);
    if (!stationsToUse) return;
    // We'll use a Mapbox GeoJSON source + layer for station click handling
    // Build popup objects for each station (so popup DOMs and battery loading remain the same)
    popupRefs.current = {};
    const features = [];
    stationsToUse.forEach(station => {
      let lat = station.lat ?? station.latitude;
      let lng = station.lng ?? station.longitude;
      if ((lat === undefined || lng === undefined) && Array.isArray(station.coords)) {
        lng = station.coords[0];
        lat = station.coords[1];
      }
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      // create popup DOM content and popup instance
      if (showPopup) {
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false });
        const content = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = station.name;
        const body = document.createElement('div');
        body.className = 'popup-body';
        body.textContent = 'Click marker to load battery info';
        const actions = document.createElement('div');
        actions.style.marginTop = '8px';
        const bookBtn = document.createElement('button');
        bookBtn.textContent = 'Book Now';
        bookBtn.style.padding = '6px 10px';
        bookBtn.style.background = '#1976d2';
        bookBtn.style.color = 'white';
        bookBtn.style.border = 'none';
        bookBtn.style.borderRadius = '6px';
        bookBtn.style.cursor = 'pointer';
        actions.appendChild(bookBtn);
        content.appendChild(title);
        content.appendChild(body);
        content.appendChild(actions);

  popup.setDOMContent(content);
  popup.setLngLat([lng, lat]);
  popupRefs.current[station.name] = { popup, body, loadBattery: null, coords: [lng, lat] };

        const loadBattery = async () => {
          try {
            body.textContent = 'Loading battery info...';
            const cache = batteryCacheRef.current || {};
            if (cache[station.name]) {
              body.innerHTML = renderBatteryHtmlInner(station.name, cache[station.name]);
              return;
            }
            const url = (API_BASE_URL || '') + '/webAPI/api/getStationBatteryReportGuest';
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': '1',
              },
              body: JSON.stringify({ stationName: station.name }),
            });
            if (!res.ok) throw new Error('Failed to fetch battery report');
            const json = await res.json();
            batteryCacheRef.current = { ...batteryCacheRef.current, [station.name]: json };
            body.innerHTML = renderBatteryHtmlInner(station.name, json);
          } catch (err) {
            body.textContent = 'Failed to load battery info';
          }
        };

        popupRefs.current[station.name].loadBattery = loadBattery;
        bookBtn.addEventListener('click', (e) => {
          try { e.stopPropagation(); } catch (err) {}
          if (typeof onBookStation === 'function') onBookStation(station);
        });
      }

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { name: station.name },
      });
    });

    // add or update the stations source & layer
    const sourceId = 'stations-source';
    const layerId = 'stations-layer';
    const geojson = { type: 'FeatureCollection', features };
    if (map.current.getSource(sourceId)) {
      try { map.current.getSource(sourceId).setData(geojson); } catch (e) {}
    } else {
      map.current.addSource(sourceId, { type: 'geojson', data: geojson });
  // Attempt to load a marker image (use react.svg for now) and use a symbol layer.
      const markerImageUrl = reactLogo;
      // Use an HTMLImageElement with crossOrigin to avoid loadImage/CORS issues
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.onload = () => {
        try {
          if (!map.current.hasImage('gogoro-marker')) {
            // map.addImage accepts an HTMLImageElement directly
            map.current.addImage('gogoro-marker', imgEl);
          }
        } catch (e) {
          // ignore addImage failures
        }

        // add symbol layer using the image (if registered) otherwise fall back to circle
        try {
          const imageExists = map.current.hasImage && map.current.hasImage('gogoro-marker');
          if (imageExists) {
            map.current.addLayer({
              id: layerId,
              type: 'symbol',
              source: sourceId,
              layout: {
                'icon-image': 'gogoro-marker',
                'icon-size': 1.2,
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
              },
            });
          } else {
            map.current.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 14,
                'circle-color': '#1976d2',
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
              },
            });
          }
        } catch (e) {
          // if adding layer with image fails, add circle layer as fallback
          try {
            map.current.addLayer({
              id: layerId,
              type: 'circle',
              source: sourceId,
              paint: {
                'circle-radius': 14,
                'circle-color': '#1976d2',
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
              },
            });
          } catch (err) {}
        }

        // common handlers: cursor and click
        try { map.current.on('mouseenter', layerId, () => { map.current.getCanvas().style.cursor = 'pointer'; }); } catch (e) {}
        try { map.current.on('mouseleave', layerId, () => { map.current.getCanvas().style.cursor = ''; }); } catch (e) {}
        try { map.current.on('click', layerId, (e) => {
          const feat = e.features && e.features[0];
          if (!feat) return;
          const name = feat.properties && feat.properties.name;
          if (!name) return;
          const popupObj = popupRefs.current && popupRefs.current[name];
          try { if (openPopupRef.current && openPopupRef.current !== (popupObj && popupObj.popup)) { openPopupRef.current.remove(); } } catch (e) {}
          if (popupObj) {
            try {
              const scrollX = window.scrollX || window.pageXOffset;
              const scrollY = window.scrollY || window.pageYOffset;
              popupObj.popup.addTo(map.current);
              openPopupRef.current = popupObj.popup;
              try { const el = popupObj.popup.getElement(); if (el && typeof el.blur === 'function') el.blur(); } catch (ee) {}
              try { window.scrollTo(scrollX, scrollY); } catch (ee) {}
              try { setTimeout(() => { try { window.scrollTo(scrollX, scrollY); } catch (e) {} }, 50); } catch (ee) {}
              try { setTimeout(() => { try { window.scrollTo(scrollX, scrollY); } catch (e) {} }, 300); } catch (ee) {}
            } catch (e) {}
            try { map.current.once('click', () => { try { popupObj.popup.remove(); } catch (e){}; if (openPopupRef.current === popupObj.popup) openPopupRef.current = null; }); } catch (e) {}
            try { setSelectedStation && setSelectedStation(name); } catch (e) {}
            try { popupObj.loadBattery && popupObj.loadBattery(); } catch (e) {}
          }
        }); } catch (e) {}
      };
      imgEl.onerror = () => {
        // image failed to load: add fallback circle layer and handlers
        try {
          map.current.addLayer({
            id: layerId,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': 14,
              'circle-color': '#1976d2',
              'circle-stroke-color': '#fff',
              'circle-stroke-width': 2,
            },
          });
        } catch (err) {}
        try { map.current.on('mouseenter', layerId, () => { map.current.getCanvas().style.cursor = 'pointer'; }); } catch (e) {}
        try { map.current.on('mouseleave', layerId, () => { map.current.getCanvas().style.cursor = ''; }); } catch (e) {}
        try { map.current.on('click', layerId, (e) => {
          const feat = e.features && e.features[0];
          if (!feat) return;
          const name = feat.properties && feat.properties.name;
          if (!name) return;
          const popupObj = popupRefs.current && popupRefs.current[name];
          try { if (openPopupRef.current && openPopupRef.current !== (popupObj && popupObj.popup)) { openPopupRef.current.remove(); } } catch (e) {}
          if (popupObj) {
            try {
              const scrollX = window.scrollX || window.pageXOffset;
              const scrollY = window.scrollY || window.pageYOffset;
              popupObj.popup.addTo(map.current);
              openPopupRef.current = popupObj.popup;
              try { const el = popupObj.popup.getElement(); if (el && typeof el.blur === 'function') el.blur(); } catch (ee) {}
              try { window.scrollTo(scrollX, scrollY); } catch (ee) {}
              try { setTimeout(() => { try { window.scrollTo(scrollX, scrollY); } catch (e) {} }, 50); } catch (ee) {}
              try { setTimeout(() => { try { window.scrollTo(scrollX, scrollY); } catch (e) {} }, 300); } catch (ee) {}
            } catch (e) {}
            try { map.current.once('click', () => { try { popupObj.popup.remove(); } catch (e){}; if (openPopupRef.current === popupObj.popup) openPopupRef.current = null; }); } catch (e) {}
            try { setSelectedStation && setSelectedStation(name); } catch (e) {}
            try { popupObj.loadBattery && popupObj.loadBattery(); } catch (e) {}
          }
        }); } catch (e) {}
      };
      // finally set the src to start loading
      try { imgEl.src = markerImageUrl; } catch (e) { imgEl.onerror && imgEl.onerror(); }
    }
  }, [stations, showPopup, setSelectedStation]);

  // load stations.json if parent didn't provide stations
  useEffect(() => {
    if (Array.isArray(stations) && stations.length) return;
    let mounted = true;
    setInternalLoading(true);
    fetch('/src/data/stations.json')
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then(data => {
        if (!mounted) return;
        setInternalStations(data);
        setInternalLoading(false);
        if (typeof onStationsLoaded === 'function') onStationsLoaded(data);
      })
      .catch(err => {
        if (!mounted) return;
        setInternalError(err.message || 'failed');
        setInternalLoading(false);
      });
    return () => { mounted = false; };
  }, [stations]);

  useEffect(() => {
    if (!map.current || !selectedStation) return;
    const popupObj = popupRefs.current && popupRefs.current[selectedStation];
    if (!popupObj) return;
    // fly to the station coords
    try {
      if (Array.isArray(popupObj.coords) && popupObj.coords.length === 2) {
        map.current.flyTo({ center: popupObj.coords, zoom: 14 });
      }
    } catch (e) {}
    // close previous popup if any
    try { if (openPopupRef.current && openPopupRef.current !== popupObj.popup) { openPopupRef.current.remove(); } } catch (e) {}
    // open the popup while preserving/restoring page scroll to avoid jumps
    try {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      popupObj.popup.addTo(map.current);
      openPopupRef.current = popupObj.popup;
      // Blur the popup element to reduce browser auto-scroll on focus
      try { const el = popupObj.popup.getElement(); if (el && typeof el.blur === 'function') el.blur(); } catch (ee) {}
      // immediate restore
      try { window.scrollTo(scrollX, scrollY); } catch (ee) {}
      // schedule a couple of delayed restores in case Mapbox focuses after a short delay
      try { setTimeout(() => { try { window.scrollTo(scrollX, scrollY); } catch (e) {} }, 50); } catch (ee) {}
      try { setTimeout(() => { try { window.scrollTo(scrollX, scrollY); } catch (e) {} }, 300); } catch (ee) {}
    } catch (e) {}
    // ensure clicking elsewhere closes it
    try { map.current.once('click', () => { try { popupObj.popup.remove(); } catch (e) {}; if (openPopupRef.current === popupObj.popup) openPopupRef.current = null; }); } catch (e) {}
    // load battery info for popup
    try { popupObj.loadBattery && popupObj.loadBattery(); } catch (e) {}
  }, [selectedStation, showPopup]);

  useEffect(() => {
    if (!map.current) return;
    // Remove old route layer
    if (map.current.getSource('route')) {
      map.current.removeLayer('route');
      map.current.removeSource('route');
    }
    if (routeGeoJSON) {
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON,
      });
      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#1976d2', 'line-width': 5 },
      });
    }
  }, [routeGeoJSON]);

  // Delegate user location marker to centralized mapManager
  useEffect(() => {
    if (!mapManagerRef.current) return;
    if (!userLocation || !Array.isArray(userLocation) || userLocation.length !== 2) {
      try { mapManagerRef.current.clearUserLocation && mapManagerRef.current.clearUserLocation(); } catch (e) {}
      return;
    }
    try { mapManagerRef.current.setUserLocation && mapManagerRef.current.setUserLocation(userLocation); } catch (e) {}
  }, [userLocation]);

  // Ensure the map container allows pointer events and has a baseline z-index
  const mergedStyle = { pointerEvents: 'auto', zIndex: 900, ...style };
  return <div ref={mapContainer} style={mergedStyle} />;
}

// Helper to render battery report into HTML for popup content
function renderBatteryHtml(name, report) {
  // Defensive accessors; adapt to your API shape
  const total = report?.total ?? report?.length ?? 'N/A';
  const available = report?.available ?? report?.availableCount ?? 'N/A';
  const batteries = Array.isArray(report?.batteries) ? report.batteries : report?.items || [];
  const details = batteries.length
    ? `<ul style="margin:6px 0 0 0;padding-left:16px;max-height:120px;overflow:auto;">${batteries
        .map(b => `<li>${escapeHtml(b.id ?? b.serial ?? 'id')}: ${escapeHtml(b.state ?? b.status ?? JSON.stringify(b))}</li>`)
        .join('')}</ul>`
    : '';
  return `<strong>${escapeHtml(name)}</strong>
    <div class="popup-body">
      <div>Total: ${escapeHtml(String(total))}</div>
      <div>Available: ${escapeHtml(String(available))}</div>
      ${details}
    </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
