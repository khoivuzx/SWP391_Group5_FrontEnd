import React from 'react';
import './LocationPermissionModal.css';

export default function LocationPermissionModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="location-perm-backdrop">
      <div className="location-perm-card">
        <h3>Allow location?</h3>
        <p>We will request your device location to provide turn-by-turn guidance from your current position. The browser will show a permission prompt next.</p>
        <div className="location-perm-actions">
          <button className="location-perm-cancel" onClick={onCancel}>Cancel</button>
          <button className="location-perm-allow" onClick={onConfirm}>Allow</button>
        </div>
      </div>
    </div>
  );
}
