import React, { useState } from 'react';

export default function ReservationForm({ stations, selectedStation, setSelectedStation, onFindPath, mode = 'station', foundStations = [], onFindBattery }) {
  const [selectedBattery, setSelectedBattery] = useState("");
  const [msg, setMsg] = useState("");
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState(mode); // 'station' or 'battery'

  const batteryOptions = [
    { id: 'A', label: 'Battery A' },
    { id: 'B', label: 'Battery B' },
    { id: 'C', label: 'Battery C' }
  ];

  // Reservations are handled from the map popup now. This form only selects station/battery and finds path.

  const handleFindPath = () => {
    if (!selectedStation) {
      setMsg("Please select a station first to find the path.");
      return;
    }
    setMsg("");
    if (onFindPath) onFindPath();
  };

  return (
    <form
      // no direct submit; booking happens via map popup
      style={{
        maxWidth: 420,
        padding: 24,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
        color: '#333'
      }}
    >
      <h2 style={{ margin: 0, fontSize: '1.3em', fontWeight: 600, color: '#222' }}>
        🔋 Reserve Battery
      </h2>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setViewMode('station')} style={{ flex: 1, padding: 8, background: viewMode === 'station' ? '#1976d2' : '#eef2f7', color: viewMode === 'station' ? '#fff' : '#222', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Find station</button>
        <button type="button" onClick={() => setViewMode('battery')} style={{ flex: 1, padding: 8, background: viewMode === 'battery' ? '#1976d2' : '#eef2f7', color: viewMode === 'battery' ? '#fff' : '#222', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Find battery</button>
      </div>

      {viewMode === 'station' && (
        <label style={{ textAlign: 'left', fontWeight: 500 }}>
          Station:
          <select
            value={selectedStation}
            onChange={e => setSelectedStation(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: 6,
              borderRadius: 8,
              border: '1px solid #ccc',
              fontFamily: 'inherit',
              fontSize: '0.95em'
            }}
          >
            <option value="">Select station...</option>
            {stations.map(station => (
              <option key={station.id} value={station.name}>{station.name}</option>
            ))}
          </select>
        </label>
      )}

      {viewMode === 'battery' && (
        <div>
          <label style={{ textAlign: 'left', fontWeight: 500, display: 'block' }}>
            Battery chemistry:
            <select
              value={selectedBattery}
              onChange={e => setSelectedBattery(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: 6, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="">Select chemistry...</option>
              <option value="Li-ion">Lithium-ion</option>
              <option value="LFP">LFP</option>
            </select>
          </label>
          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={async () => {
              if (typeof onFindBattery !== 'function') return;
              setSearching(true);
              try {
                await onFindBattery(selectedBattery);
              } finally { setSearching(false); }
            }} style={{ padding: '10px', width: '100%', background: '#0d6efd', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{searching ? 'Searching…' : 'Find stations with battery'}</button>
          </div>

          {/* display found stations if provided */}
          {searching && <div style={{ marginTop: 12 }}>Searching nearby stations…</div>}
          {!searching && foundStations && foundStations.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Stations found</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {foundStations.map(fs => (
                  <div key={fs.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, borderRadius: 8, background: '#f7fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{fs.name}</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>{(fs.distanceMeters/1000).toFixed(2)} km</div>
                    </div>
                    <div>
                      <button type="button" onClick={() => setSelectedStation(fs.name)} style={{ padding: '6px 10px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Select</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!searching && foundStations && foundStations.length === 0 && (
            <div style={{ marginTop: 12, color: '#666' }}>No nearby stations found with that battery type.</div>
          )}
        </div>
      )}

      {/* Battery selection removed from station-find mode to simplify UX. Booking happens from the popup. */}

      {/* Reserve action moved to map popup (Book Now). */}

      {viewMode === 'station' && (
        <button
          type="button"
          onClick={handleFindPath}
          style={{
            padding: '10px 0',
            background: '#2e7d32',
            color: '#fff',
            fontWeight: 600,
            border: 'none',
            borderRadius: 8,
            fontSize: '1em',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#276c2a'}
          onMouseOut={e => e.currentTarget.style.background = '#2e7d32'}
        >
          Find path to this station
        </button>
      )}

      {msg && (
        <div style={{ color: '#1976d2', marginTop: 8, fontWeight: 500, fontSize: '0.95em' }}>
          {msg}
        </div>
      )}
    </form>
  );
}
