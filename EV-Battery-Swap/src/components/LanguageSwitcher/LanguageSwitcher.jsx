import React, { useEffect, useState } from 'react';
import i18n from '../../i18n';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(i18n.language || 'en');

  useEffect(() => {
    const handle = (lng) => setLang(lng);
    i18n.on && i18n.on('languageChanged', handle);
    return () => { i18n.off && i18n.off('languageChanged', handle); };
  }, []);

  const change = (lng) => {
    if (lng === lang) return;
    i18n.changeLanguage(lng);
    try { localStorage.setItem('i18nextLng', lng); } catch (_) {}
    setLang(lng);
  };

  return (
    <div className="lang-switch" role="tablist" aria-label="Language switcher">
      <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} aria-pressed={lang === 'en'} onClick={() => change('en')}>EN</button>
      <button className={`lang-btn ${lang === 'vi' ? 'active' : ''}`} aria-pressed={lang === 'vi'} onClick={() => change('vi')}>VI</button>
    </div>
  );
}
