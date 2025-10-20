import React, { useRef, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';

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
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markerRefs = useRef({});
  const popupRefs = useRef({});

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      mapboxgl.accessToken = token;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: stations.length ? [stations[0].lng, stations[0].lat] : [106.7, 10.8],
        zoom: 12,
      });
    }
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    if (!map.current || !Array.isArray(stations)) return;
    // Remove old markers
    Object.values(markerRefs.current).forEach(m => m.remove && m.remove());
    markerRefs.current = {};
    popupRefs.current = {};
    stations.forEach(station => {
      // Support both lat/lng and latitude/longitude, fallback to coords
      let lat = station.lat ?? station.latitude;
      let lng = station.lng ?? station.longitude;
      if ((lat === undefined || lng === undefined) && Array.isArray(station.coords)) {
        lng = station.coords[0];
        lat = station.coords[1];
      }
      // Defensive: skip if lat/lng are not valid numbers
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
      const marker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current);
      markerRefs.current[station.name] = marker;
      if (showPopup) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<strong>${station.name}</strong>`);
        marker.setPopup(popup);
        popupRefs.current[station.name] = popup;
        marker.getElement().addEventListener('click', () => {
          setSelectedStation && setSelectedStation(station.name);
        });
      }
    });
  }, [stations, showPopup, setSelectedStation]);

  useEffect(() => {
    if (!map.current || !selectedStation || !markerRefs.current[selectedStation]) return;
    const marker = markerRefs.current[selectedStation];
    const lngLat = marker.getLngLat();
    map.current.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 14 });
    if (showPopup && popupRefs.current[selectedStation]) {
      popupRefs.current[selectedStation].addTo(map.current);
    }
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

  return <div ref={mapContainer} style={style} />;
}
