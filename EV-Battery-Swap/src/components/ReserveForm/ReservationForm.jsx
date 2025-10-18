import React, { useState } from 'react';

export default function ReservationForm({ stations, selectedStation, setSelectedStation, onFindPath }) {
  const [selectedBattery, setSelectedBattery] = useState("");
  const [msg, setMsg] = useState("");

  const batteryOptions = [
    { id: 'A', label: 'Battery A' },
    { id: 'B', label: 'Battery B' },
    { id: 'C', label: 'Battery C' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStation || !selectedBattery) {
      setMsg("⚠️ Please select both station and battery.");
      return;
    }
    setMsg(`✅ Reservation submitted for ${selectedStation} with ${selectedBattery}. (Mock)`);
  };

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
      onSubmit={handleSubmit}
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

      <label style={{ textAlign: 'left', fontWeight: 500 }}>
        Battery:
        <select
          value={selectedBattery}
          onChange={e => setSelectedBattery(e.target.value)}
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
          <option value="">Select battery...</option>
          {batteryOptions.map(bat => (
            <option key={bat.id} value={bat.label}>{bat.label}</option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        style={{
          padding: '10px 0',
          background: '#1976d2',
          color: '#fff',
          fontWeight: 600,
          border: 'none',
          borderRadius: 8,
          fontSize: '1em',
          cursor: 'pointer',
          transition: 'background 0.2s ease'
        }}
        onMouseOver={e => e.currentTarget.style.background = '#1669bb'}
        onMouseOut={e => e.currentTarget.style.background = '#1976d2'}
      >
        Reserve
      </button>

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

      {msg && (
        <div style={{ color: '#1976d2', marginTop: 8, fontWeight: 500, fontSize: '0.95em' }}>
          {msg}
        </div>
      )}
    </form>
  );
}
