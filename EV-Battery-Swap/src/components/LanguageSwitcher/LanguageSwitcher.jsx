import React from 'react';
import i18n from '../../i18n';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const change = (lng) => {
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch (_) {}
  };

  return (
    <div className="lang-switch">
      <button className="lang-btn" onClick={() => change('en')}>EN</button>
      <button className="lang-btn" onClick={() => change('vi')}>VI</button>
    </div>
  );
}
