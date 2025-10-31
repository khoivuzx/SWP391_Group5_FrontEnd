import React from 'react';
import './LocationPermissionModal.css';
import { useTranslation } from 'react-i18next';

export default function LocationPermissionModal({ open, onConfirm, onCancel }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="location-perm-backdrop">
      <div className="location-perm-card">
        <h3>{t('locationPermission.title')}</h3>
        <p>{t('locationPermission.description')}</p>
        <div className="location-perm-actions">
          <button className="location-perm-cancel" onClick={onCancel}>{t('locationPermission.cancel')}</button>
          <button className="location-perm-allow" onClick={onConfirm}>{t('locationPermission.allow')}</button>
        </div>
      </div>
    </div>
  );
}
