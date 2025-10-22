
import React, { useEffect, useState } from 'react';
import stationsData from '../../../data/stations.json';
import './staff.css';
import API_BASE_URL from '../../../config';

export default function StaffDashboard({ user, onLoginClick }) {
  const [stations, setStations] = useState([]);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [showFetchBanner, setShowFetchBanner] = useState(true);
  const [assignedStationId, setAssignedStationId] = useState(() => {
    try {
      const raw = localStorage.getItem('assignedStationId');
      return raw ? Number(raw) : (stationsData[0] && stationsData[0].id) || null;
    } catch (e) {
      return (stationsData[0] && stationsData[0].id) || null;
    }
  });

  // slots per station: { stationId: [ {index, status, soc, soh, charging}, ... ] }
  const [slotsMap, setSlotsMap] = useState({});

  useEffect(() => {
    // Try to load stations.json via fetch so we can detect network/file load failures.
    // Note: stations.json is bundled in the repo and usually served by dev server; this won't detect backend API availability.
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/src/data/stations.json');
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        if (mounted) {
          setStations(Array.isArray(json) ? json : (json.data || []));
          // leave fetchFailed alone for now; we'll check backend API availability separately
        }
      } catch (err) {
        if (mounted) {
          setStations(stationsData || []);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // One-shot health check for the battery API — if it fails, mark fetchFailed so slots render empty
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!API_BASE_URL) throw new Error('no api base');
        const url = `${API_BASE_URL}/webAPI/api/getStationBatteryReportGuest`;
        const res = await fetch(url, { credentials: 'omit', headers: { 'ngrok-skip-browser-warning': '1', 'Accept': 'application/json' } });
        if (!mounted) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // success: API available
        setFetchFailed(false);
      } catch (err) {
        if (!mounted) return;
        setFetchFailed(true);
        setShowFetchBanner(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!stations.length) return;
    const sm = {};
    stations.forEach(s => {
      const arr = [];
      for (let i = 1; i <= 20; i++) {
        // Initialize deterministic empty slots; real data will replace these when available
        arr.push({ index: i, status: 'empty', soc: 0, soh: 0, charging: false });
      }
      sm[s.id] = arr;
    });
    setSlotsMap(sm);
    if (!assignedStationId) setAssignedStationId(stations[0].id);
  }, [stations]);

  const assignedStation = stations.find(s => s.id === assignedStationId) || null;
  // Display station: prefer assignedStation, otherwise fall back to the first available station so UI shows slots immediately
  const displayStation = assignedStation || (stations && stations.length ? stations[0] : null);
  const displayStationId = displayStation ? displayStation.id : null;
  const slots = displayStationId ? (slotsMap[displayStationId] || []) : [];

  const openSlot = (index) => {
    // in real app you'd call backend; here we show a console message and toggle status to available
    setSlotsMap(prev => {
      const copy = { ...prev };
      copy[assignedStationId] = copy[assignedStationId].map(slot => slot.index === index ? { ...slot, status: 'available', soc: 100, charging: false } : slot);
      return copy;
    });
  };

  function VisualSlot({ slot }) {
    const stateClass = slot.status === 'charging' ? 'visual-slot charging' : (slot.status === 'available' ? 'visual-slot available' : 'visual-slot empty');
    return (
      <div className={stateClass} onClick={() => openSlot(slot.index)} title={`Slot ${slot.index} — ${slot.status}`}>
        <div className="visual-slot-index">{slot.index}</div>
        <div className="visual-slot-status">{slot.status}</div>
      </div>
    );
  }

  return (
    <main style={{ padding: 0, margin: 0, width: '100%' }}>
      <div className="staff-container">
        <h1>Station Slot Management</h1>
        {fetchFailed && showFetchBanner && (
          <div className="fetch-error-banner">
            <div>Failed to load station inventory — all slots shown as empty.</div>
            <button className="fetch-error-dismiss" onClick={() => setShowFetchBanner(false)}>Dismiss</button>
          </div>
        )}
        {displayStation ? (
          <>
            <div className="station-title"><strong>Station:</strong> {displayStation.name} (ID: {displayStation.id})</div>

            {/* Visual grid: left half = Lithium-Ion (slots 1-10), right half = LFP (slots 11-20) */}
            <div className="visual-slots-container">
              <div className="visual-half">
                <div className="visual-half-title">Lithium-Ion</div>
                <div className="visual-grid">
                  {slots.filter(s => s.index >= 1 && s.index <= 10).map(s => (
                    <VisualSlot key={s.index} slot={s} />
                  ))}
                </div>
              </div>
              <div className="visual-half">
                <div className="visual-half-title">LFP</div>
                <div className="visual-grid">
                  {slots.filter(s => s.index >= 11 && s.index <= 20).map(s => (
                    <VisualSlot key={s.index} slot={s} />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>No stations available</div>
        )}

        {/* Action bar placed below the station title area — always visible */}
        <div className="staff-action-bar">
          <button className="staff-action-btn" onClick={() => console.log('Check-in clicked')}>Check-in</button>
          <button className="staff-action-btn" onClick={() => console.log('Create booking clicked')}>Create booking</button>
          <button className="staff-action-btn" onClick={() => console.log('View booking clicked')}>View booking</button>
        </div>
      </div>
    </main>
  );
}
