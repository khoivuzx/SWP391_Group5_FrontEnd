import { useEffect, useState, useCallback } from 'react';
import API_BASE_URL from '../config';

// Key used to cache stations in localStorage
const STORAGE_KEY = 'stations_cache_v1';

export default function useStations() {
  const [stations, setStations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Build API URL (same as the script expects)
    const apiUrl = (API_BASE_URL || '').replace(/\/+$/, '') + '/webAPI/api/getstations';

    // Try remote API first (this requires network)
    try {
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json', 'ngrok-skip-browser-warning': '1' } });
      if (res.ok) {
        const payload = await res.json();
        const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        setStations(arr);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
        setLoading(false);
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Remote fetch failed — attempt to use cached copy in localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw);
          setStations(cached);
          setLoading(false);
          setError(null);
          return;
        }
      } catch (e) {}

      // Fall back to bundled file under /data/stations.json
      try {
        const res2 = await fetch('/data/stations.json');
        if (res2.ok) {
          const j = await res2.json();
          setStations(Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : []));
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${res2.status}`);
      } catch (e2) {
        setError(err?.message || e2?.message || 'Failed to load stations');
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Run once on mount to populate stations automatically
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { stations, loading, error, refresh };
}
