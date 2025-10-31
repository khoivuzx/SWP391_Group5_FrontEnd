import React, { useRef, useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import API_BASE_URL from '../../config';
import reactLogo from '../../assets/react.svg';
import { createMapManager } from '../../utils/mapManager';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

export default function MapboxMap({
  token,
  stations = [],
  selectedStation,
  setSelectedStation,
  routeGeoJSON,
  routeSummary = null,
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
  const popupRefs = useRef({});
  const batteryCacheRef = useRef({});
  const mapManagerRef = useRef(null);
  const openPopupRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      mapboxgl.accessToken = token;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: stations.length ? [stations[0].lng, stations[0].lat] : [106.7, 10.8],
        zoom: 12,
      });
      // Add the Mapbox GeolocateControl (button + built-in blue dot).
      try {
        const geolocate = new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        });
        map.current.addControl(geolocate, 'top-right');
        // When GeolocateControl emits a geolocate event, update the map manager so
        // the rest of the app sees the user location marker consistently.
        geolocate.on('geolocate', (evt) => {
          try {
            const coords = [evt.coords.longitude, evt.coords.latitude];
            if (mapManagerRef.current && typeof mapManagerRef.current.setUserLocation === 'function') {
              mapManagerRef.current.setUserLocation(coords);
            }
          } catch (e) {}
        });
      } catch (e) {
        // ignore if GeolocateControl unavailable
      }
      try { mapManagerRef.current = createMapManager(map.current); } catch { mapManagerRef.current = null; }
    }
    return () => { if (map.current) { map.current.remove(); map.current = null; } };
  }, [token]);

  useEffect(() => {
    if (!map.current) return;
    const stationsToUse = Array.isArray(stations) && stations.length ? stations : (Array.isArray(internalStations) ? internalStations : null);
    if (!stationsToUse) return;

    popupRefs.current = {};
    const features = [];
    stationsToUse.forEach(station => {
      let lat = station.lat ?? station.latitude;
      let lng = station.lng ?? station.longitude;
      if ((lat === undefined || lng === undefined) && Array.isArray(station.coords)) { lng = station.coords[0]; lat = station.coords[1]; }
      if (![lat, lng].every(n => typeof n === 'number' && !Number.isNaN(n))) return;

      if (showPopup) {
        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false });
  const content = document.createElement('div');
  const title = document.createElement('strong'); title.textContent = station.name;
  const body = document.createElement('div'); body.className = 'popup-body'; body.textContent = i18n.t('map.popup.clickToLoadBattery');
  const actions = document.createElement('div'); actions.style.marginTop = '8px';
  const bookBtn = document.createElement('button');
  bookBtn.textContent = i18n.t('map.popup.bookNow');
        Object.assign(bookBtn.style, { padding: '6px 10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' });
        actions.appendChild(bookBtn);
        content.appendChild(title); content.appendChild(body); content.appendChild(actions);

        popup.setDOMContent(content);
        popup.setLngLat([lng, lat]);
        popupRefs.current[station.name] = { popup, body, loadBattery: null, coords: [lng, lat] };

        const loadBattery = async () => {
            try {
            body.textContent = i18n.t('map.popup.loadingBattery');
            const cacheKey = String(station.id ?? station.stationId ?? station.name);
            if (batteryCacheRef.current[cacheKey]) {
              body.innerHTML = renderBatteryTable(station.name, batteryCacheRef.current[cacheKey]);
              return;
            }

            // Build URL (stationId nếu có; nếu không lấy tất cả rồi filter theo tên)
            const stationId = station.id ?? station.stationId ?? station.Station_ID ?? station.StationId ?? null;
            const qs = stationId != null ? `?stationId=${encodeURIComponent(stationId)}` : '';
            const url = (API_BASE_URL || '') + '/webAPI/api/getStationBatteryReportGuest' + qs;

            const res = await fetch(url, {
              method: 'GET',
              headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': '1' },
              credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch battery report');
            const json = await res.json();

            // Chuẩn hoá: tạo mảng các dòng thuộc đúng trạm
            const rowsAll = Array.isArray(json?.data) ? json.data : [];
            const rows = stationId != null
              ? rowsAll.filter(r => String(r.stationId) === String(stationId))
              : rowsAll.filter(r => (r.stationName || '').trim() === (station.name || '').trim());

            batteryCacheRef.current[cacheKey] = rows;
            body.innerHTML = renderBatteryTable(station.name, rows);
            } catch (err) {
            body.textContent = i18n.t('map.popup.failedToLoad');
          }
        };

        popupRefs.current[station.name].loadBattery = loadBattery;
        bookBtn.addEventListener('click', (e) => { try { e.stopPropagation(); } catch {} if (typeof onBookStation === 'function') onBookStation(station); });
      }

      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lng, lat] }, properties: { name: station.name } });
    });

    const sourceId = 'stations-source';
    const layerId = 'stations-layer';
    const geojson = { type: 'FeatureCollection', features };
      const addGeoAndLayer = () => {
        if (map.current.getSource(sourceId)) { try { map.current.getSource(sourceId).setData(geojson); } catch {} return; }

        map.current.addSource(sourceId, { type: 'geojson', data: geojson });

        const imgEl = new Image(); imgEl.crossOrigin = 'anonymous'; imgEl.src = reactLogo;
        imgEl.onload = () => {
          try { if (!map.current.hasImage('gogoro-marker')) map.current.addImage('gogoro-marker', imgEl); } catch {}
          try {
            const hasImg = map.current.hasImage && map.current.hasImage('gogoro-marker');
            if (hasImg) {
              map.current.addLayer({ id: layerId, type: 'symbol', source: sourceId, layout: { 'icon-image': 'gogoro-marker', 'icon-size': 1.2, 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
            } else {
              map.current.addLayer({ id: layerId, type: 'circle', source: sourceId, paint: { 'circle-radius': 14, 'circle-color': '#1976d2', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
            }
          } catch {
            try { map.current.addLayer({ id: layerId, type: 'circle', source: sourceId, paint: { 'circle-radius': 14, 'circle-color': '#1976d2', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } }); } catch {}
          }

          try { map.current.on('mouseenter', layerId, () => { map.current.getCanvas().style.cursor = 'pointer'; }); } catch {}
          try { map.current.on('mouseleave', layerId, () => { map.current.getCanvas().style.cursor = ''; }); } catch {}
          try { map.current.on('click', layerId, (e) => {
            const feat = e.features && e.features[0]; if (!feat) return;
            const name = feat.properties && feat.properties.name; if (!name) return;
            const popupObj = popupRefs.current && popupRefs.current[name];
            try { if (openPopupRef.current && openPopupRef.current !== (popupObj && popupObj.popup)) { openPopupRef.current.remove(); } } catch {}
            if (popupObj) {
              try {
                const sx = window.scrollX || window.pageXOffset; const sy = window.scrollY || window.pageYOffset;
                popupObj.popup.addTo(map.current); openPopupRef.current = popupObj.popup;
                try { const el = popupObj.popup.getElement(); if (el?.blur) el.blur(); } catch {}
                try { window.scrollTo(sx, sy); } catch {}
                try { setTimeout(() => { try { window.scrollTo(sx, sy); } catch {} }, 50); } catch {}
                try { setTimeout(() => { try { window.scrollTo(sx, sy); } catch {} }, 300); } catch {}
              } catch {}
              try { map.current.once('click', () => { try { popupObj.popup.remove(); } catch {}; if (openPopupRef.current === popupObj.popup) openPopupRef.current = null; }); } catch {}
              try { setSelectedStation && setSelectedStation(name); } catch {}
              try { popupObj.loadBattery && popupObj.loadBattery(); } catch {}
            }
          }); } catch {}
        };
        imgEl.onerror = () => {
          try { map.current.addLayer({ id: layerId, type: 'circle', source: sourceId, paint: { 'circle-radius': 14, 'circle-color': '#1976d2', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } }); } catch {}
          try { map.current.on('mouseenter', layerId, () => { map.current.getCanvas().style.cursor = 'pointer'; }); } catch {}
          try { map.current.on('mouseleave', layerId, () => { map.current.getCanvas().style.cursor = ''; }); } catch {}
          try { map.current.on('click', layerId, (e) => {
            const feat = e.features && e.features[0]; if (!feat) return;
            const name = feat.properties && feat.properties.name; if (!name) return;
            const popupObj = popupRefs.current && popupRefs.current[name];
            try { if (openPopupRef.current && openPopupRef.current !== (popupObj && popupObj.popup)) { openPopupRef.current.remove(); } } catch {}
            if (popupObj) {
              try {
                const sx = window.scrollX || window.pageXOffset; const sy = window.scrollY || window.pageYOffset;
                popupObj.popup.addTo(map.current); openPopupRef.current = popupObj.popup;
                try { const el = popupObj.popup.getElement(); if (el?.blur) el.blur(); } catch {}
                try { window.scrollTo(sx, sy); } catch {}
                try { setTimeout(() => { try { window.scrollTo(sx, sy); } catch {} }, 50); } catch {}
                try { setTimeout(() => { try { window.scrollTo(sx, sy); } catch {} }, 300); } catch {}
              } catch {}
              try { map.current.once('click', () => { try { popupObj.popup.remove(); } catch {}; if (openPopupRef.current === popupObj.popup) openPopupRef.current = null; }); } catch {}
              try { setSelectedStation && setSelectedStation(name); } catch {}
              try { popupObj.loadBattery && popupObj.loadBattery(); } catch {}
            }
          }); } catch {}
        };
      };

      // Ensure the map style is loaded before adding sources/layers
      try {
        const isStyleLoaded = typeof map.current.isStyleLoaded === 'function' ? map.current.isStyleLoaded() : true;
        if (!isStyleLoaded) {
          map.current.once('load', addGeoAndLayer);
        } else {
          addGeoAndLayer();
        }
      } catch (err) {
        // Fallback: try to add immediately
        try { addGeoAndLayer(); } catch (e) {}
      }
  }, [stations, showPopup, setSelectedStation]);

  useEffect(() => {
    if (Array.isArray(stations) && stations.length) return;
    let mounted = true;
    setInternalLoading(true);
    fetch('/src/data/stations.json')
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then(data => { if (!mounted) return; setInternalStations(data); setInternalLoading(false); if (typeof onStationsLoaded === 'function') onStationsLoaded(data); })
      .catch(err => { if (!mounted) return; setInternalError(err.message || 'failed'); setInternalLoading(false); });
    return () => { mounted = false; };
  }, [stations]);

  useEffect(() => {
    if (!map.current || !selectedStation) return;
    const popupObj = popupRefs.current && popupRefs.current[selectedStation];
    if (!popupObj) return;
    try { if (Array.isArray(popupObj.coords) && popupObj.coords.length === 2) map.current.flyTo({ center: popupObj.coords, zoom: 14 }); } catch {}
    try { if (openPopupRef.current && openPopupRef.current !== popupObj.popup) openPopupRef.current.remove(); } catch {}
    try {
      const sx = window.scrollX || window.pageXOffset; const sy = window.scrollY || window.pageYOffset;
      popupObj.popup.addTo(map.current); openPopupRef.current = popupObj.popup;
      try { const el = popupObj.popup.getElement(); if (el?.blur) el.blur(); } catch {}
      try { window.scrollTo(sx, sy); } catch {}
      try { setTimeout(() => { try { window.scrollTo(sx, sy); } catch {} }, 50); } catch {}
      try { setTimeout(() => { try { window.scrollTo(sx, sy); } catch {} }, 300); } catch {}
    } catch {}
    try { map.current.once('click', () => { try { popupObj.popup.remove(); } catch {}; if (openPopupRef.current === popupObj.popup) openPopupRef.current = null; }); } catch {}
    try { popupObj.loadBattery && popupObj.loadBattery(); } catch {}
  }, [selectedStation, showPopup]);

  useEffect(() => {
    if (!map.current) return;
    if (map.current.getSource('route')) { map.current.removeLayer('route'); map.current.removeSource('route'); }
    if (routeGeoJSON) {
      map.current.addSource('route', { type: 'geojson', data: routeGeoJSON });
      map.current.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#1976d2', 'line-width': 5 } });
      // Fit the map to the route geometry so the entire route is visible
      try {
        // routeGeoJSON may be a geometry object or a Feature
        const geom = routeGeoJSON.type === 'Feature' ? routeGeoJSON.geometry : routeGeoJSON;
        const coords = (geom && geom.coordinates) || [];
        if (coords && coords.length) {
          // coords may be nested (LineString) or array of arrays; compute bounds
          let flat = coords;
          // if featureCollection or MultiLineString, flatten one level
          if (Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
            flat = coords.flat();
          }
          let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
          for (const c of flat) {
            if (!Array.isArray(c) || c.length < 2) continue;
            const [lng, lat] = c;
            if (lng < minLng) minLng = lng;
            if (lat < minLat) minLat = lat;
            if (lng > maxLng) maxLng = lng;
            if (lat > maxLat) maxLat = lat;
          }
          if (isFinite(minLng) && isFinite(minLat) && isFinite(maxLng) && isFinite(maxLat)) {
            try {
              map.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 15, duration: 800 });
            } catch (e) {}
          }
        }
      } catch (err) {
        // ignore fit errors
      }
    }
  }, [routeGeoJSON]);

  useEffect(() => {
    if (!mapManagerRef.current) return;
    if (!userLocation || !Array.isArray(userLocation) || userLocation.length !== 2) { try { mapManagerRef.current.clearUserLocation?.(); } catch {} return; }
    try { mapManagerRef.current.setUserLocation?.(userLocation); } catch {}
  }, [userLocation]);

  const mergedStyle = { pointerEvents: 'auto', zIndex: 900, ...style };
  // small helpers for formatting the route summary inside the map
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

  const overlayStyle = {
    position: 'absolute',
    left: 12,
    bottom: 12,
    background: 'rgba(255,255,255,0.95)',
    padding: '8px 10px',
    borderRadius: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    fontSize: 13,
    color: '#222',
    zIndex: 9999,
  };

  return (
    <div style={{ position: 'relative', ...mergedStyle }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: mergedStyle.borderRadius }} />
      {routeSummary && (
        <div style={overlayStyle} aria-hidden>
          <strong style={{ marginRight: 8 }}>{i18n.t('map.routeLabel')}</strong>
          <span style={{ marginRight: 8 }}> </span>
          <span style={{ marginRight: 8 }}>{formatDistance(routeSummary.distance)}</span>
          <span style={{ opacity: 0.85 }}>{formatDuration(routeSummary.duration)}</span>
        </div>
      )}
    </div>
  );
}

/** Render 2 loại pin + Good/Average/Weak/Below75/Total cho mỗi loại */
/** Render 2 loại pin + Tốt/Khá/Yếu/Dưới 75%/Tổng cho mỗi loại */
function renderBatteryTable(_stationName, rows) {
  // rows: [{stationId, stationName, batteryType, Good, Average, Weak, Below75, Total}, ...]
  const grouped = (Array.isArray(rows) ? rows : []).reduce((acc, r) => {
    const key = String(r.batteryType || 'Unknown');
    acc[key] = acc[key] || { Good: 0, Average: 0, Weak: 0, Below75: 0, Total: 0 };
    acc[key].Good    += Number(r.Good || 0);
    acc[key].Average += Number(r.Average || 0);
    acc[key].Weak    += Number(r.Weak || 0);
    acc[key].Below75 += Number(r.Below75 || 0);
    acc[key].Total   += Number(r.Total || 0);
    return acc;
  }, {});

  const COLOR = {
    good:  '#2e7d32', // Tốt - xanh
    avg:   '#f9a825', // Khá - vàng
    weak:  '#d32f2f', // Yếu - đỏ
    lt75:  '#000000', // Dưới 75% - đen
    total: '#37474f'
  };

  const dot = (c) => `
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
                 background:${c};margin-right:6px;transform:translateY(-1px);"></span>`;

  const sections = Object.entries(grouped).map(([type, v]) => `
    <div style="margin-top:8px;">
      <div style="font-weight:600">${escapeHtml(type)}</div>
      <table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:6px;">
        <tbody>
          <tr>
            <td style="padding:2px 0;">${dot(COLOR.good)}${i18n.t('battery.good')}</td>
            <td style="text-align:right; color:${COLOR.good}; padding:2px 0;">${escapeHtml(String(v.Good))}</td>
            <td style="padding:2px 0 2px 12px;">${dot(COLOR.avg)}${i18n.t('battery.average')}</td>
            <td style="text-align:right; color:${COLOR.avg}; padding:2px 0;">${escapeHtml(String(v.Average))}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;">${dot(COLOR.weak)}${i18n.t('battery.weak')}</td>
            <td style="text-align:right; color:${COLOR.weak}; padding:2px 0;">${escapeHtml(String(v.Weak))}</td>
            <td style="padding:2px 0 2px 12px;">${dot(COLOR.lt75)}${i18n.t('battery.below75')}</td>
            <td style="text-align:right; color:${COLOR.lt75}; padding:2px 0;">${escapeHtml(String(v.Below75))}</td>
          </tr>
          <tr>
            <td style="padding-top:4px; font-weight:600; color:${COLOR.total}">${i18n.t('battery.total')}</td>
            <td style="text-align:right; font-weight:600; color:${COLOR.total}; padding-top:4px">${escapeHtml(String(v.Total))}</td>
            <td></td><td></td>
          </tr>
        </tbody>
      </table>
    </div>
  `).join('') || '<div style="margin-top:6px;">Không có dữ liệu</div>';

  // ⚠️ Không render tên trạm ở đây để tránh trùng với <strong> ở phần title popup
  const noDataHtml = `<div style="margin-top:6px;">${i18n.t('battery.noData')}</div>`;
  return `<div style="margin-top:6px;">${sections}</div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
