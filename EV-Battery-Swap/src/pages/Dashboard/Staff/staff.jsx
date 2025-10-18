
import React, { useEffect, useState } from 'react';
import Header from '../../../components/Header/Header';
import stationsData from '../../../data/stations.json';
import './staff.css';

function SlotCard({ slot, onOpen, onToggleCharging, onSetStatus }) {
  const cls = slot.status === 'charging' ? 'slot-row slot-row--charging' : (slot.status === 'available' ? 'slot-row slot-row--available' : 'slot-row slot-row--empty');
  return (
    <div className={cls}>
      <div className="slot-index">Slot #{slot.index}</div>
      <div className="slot-status"><strong>Status:</strong> {slot.status}</div>
      {slot.status !== 'empty' && (
        <>
          <div className="slot-soc">SoC: <strong>{slot.soc}%</strong></div>
          <div className="slot-soh">SoH: <strong>{slot.soh}%</strong></div>
        </>
      )}
      <div className="slot-actions">
        <button className="slot-action-btn" onClick={() => onOpen(slot.index)}>Open Slot</button>
        <button className="slot-action-btn" onClick={() => onToggleCharging(slot.index)}>{slot.charging ? 'Stop Charging' : 'Start Charging'}</button>
        <button className="slot-action-btn" onClick={() => onSetStatus(slot.index, 'empty')}>Set Empty</button>
      </div>
    </div>
  );
}

export default function StaffDashboard({ user, onLoginClick }) {
  const [stations, setStations] = useState([]);
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
    setStations(stationsData || []);
  }, []);

  useEffect(() => {
    if (!stations.length) return;
    const sm = {};
    stations.forEach(s => {
      const arr = [];
      for (let i = 1; i <= 20; i++) {
        // random initial statuses
        const statuses = ['empty', 'charging', 'available'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const soc = status === 'empty' ? 0 : Math.floor(Math.random() * 61) + 40; // 40-100
        const soh = Math.max(70, Math.floor(Math.random() * 31) + 70); // 70-100
        arr.push({ index: i, status, soc, soh, charging: status === 'charging' });
      }
      sm[s.id] = arr;
    });
    setSlotsMap(sm);
    if (!assignedStationId) setAssignedStationId(stations[0].id);
  }, [stations]);

  const assignedStation = stations.find(s => s.id === assignedStationId) || null;
  const slots = slotsMap[assignedStationId] || [];

  const openSlot = (index) => {
    // in real app you'd call backend; here we show a console message and toggle status to available
    setSlotsMap(prev => {
      const copy = { ...prev };
      copy[assignedStationId] = copy[assignedStationId].map(slot => slot.index === index ? { ...slot, status: 'available', soc: 100, charging: false } : slot);
      return copy;
    });
  };

  const toggleCharging = (index) => {
    setSlotsMap(prev => {
      const copy = { ...prev };
      copy[assignedStationId] = copy[assignedStationId].map(slot => {
        if (slot.index !== index) return slot;
        const newCharging = !slot.charging;
        return { ...slot, charging: newCharging, status: newCharging ? 'charging' : (slot.soc >= 100 ? 'available' : 'available') };
      });
      return copy;
    });
  };

  const setStatus = (index, status) => {
    setSlotsMap(prev => {
      const copy = { ...prev };
      copy[assignedStationId] = copy[assignedStationId].map(slot => {
        if (slot.index !== index) return slot;
        if (status === 'empty') return { ...slot, status: 'empty', soc: 0, charging: false };
        if (status === 'charging') return { ...slot, status: 'charging', charging: true };
        return { ...slot, status: 'available', charging: false };
      });
      return copy;
    });
  };

  function SlotRow({ slot }) {
    const cls = slot.status === 'charging' ? 'slot-row slot-row--charging' : (slot.status === 'available' ? 'slot-row slot-row--available' : 'slot-row slot-row--empty');
    return (
      <div className={cls}>
        <div className="slot-index">Slot #{slot.index}</div>
        <div className="slot-status"><strong>Status:</strong> {slot.status}</div>
        <div className="slot-soc">{slot.status !== 'empty' ? <span>SoC: {slot.soc}%</span> : <span>&nbsp;</span>}</div>
        <div className="slot-soh">{slot.status !== 'empty' ? <span>SoH: {slot.soh}%</span> : <span>&nbsp;</span>}</div>
        <div className="slot-actions">
          <button className="slot-action-btn" onClick={() => openSlot(slot.index)}>Open Slot</button>
          <button className="slot-action-btn" onClick={() => toggleCharging(slot.index)}>{slot.charging ? 'Stop' : 'Start'}</button>
          <button className="slot-action-btn" onClick={() => setStatus(slot.index, 'empty')}>Set Empty</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header user={user} onLoginClick={onLoginClick} />
      <div className="staff-container">
        <h1>Station Slot Management</h1>
        {assignedStation ? (
          <>
            <div className="station-title"><strong>Station:</strong> {assignedStation.name} (ID: {assignedStation.id})</div>

            <div className="slots-list">
              {slots.map(slot => (
                <SlotRow key={slot.index} slot={slot} />
              ))}
            </div>
          </>
        ) : (
          <div>No assigned station</div>
        )}
      </div>
    </>
  );
}
