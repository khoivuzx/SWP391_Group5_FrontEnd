// src/utils/mapManager.js
// Simple Map manager to host map-related helpers that require access to the map instance.
// This keeps features like the user-location marker centralized and reusable.

import mapboxgl from 'mapbox-gl';

export function createMapManager(mapInstance) {
  if (!mapInstance) throw new Error('map instance required');
  let userMarker = null;

  function setUserLocation(coords) {
    // coords: [lng, lat]
    if (!coords || !Array.isArray(coords) || coords.length !== 2) return;
    // remove old marker
    if (userMarker) {
      try { userMarker.remove(); } catch (e) {}
      userMarker = null;
    }
  const el = document.createElement('div');
  // inline styles so the marker is visible out-of-the-box (blue dot with white border)
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.borderRadius = '50%';
  el.style.background = '#1E90FF'; // blue
  el.style.border = '2px solid #fff';
  el.style.boxSizing = 'border-box';
  el.style.boxShadow = '0 0 6px rgba(30,144,255,0.6)';
  el.style.pointerEvents = 'none';
  el.className = 'map-user-marker';
    userMarker = new mapboxgl.Marker({ element: el })
      .setLngLat([coords[0], coords[1]])
      .addTo(mapInstance);
    // Do not auto-zoom to the user location here; fitting to routes or selected stations
    // should be handled at the Map component level to avoid flicker.
    return userMarker;
  }

  function clearUserLocation() {
    if (userMarker) {
      try { userMarker.remove(); } catch (e) {}
      userMarker = null;
    }
  }

  return { setUserLocation, clearUserLocation };
}
