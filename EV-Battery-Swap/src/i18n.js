import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/common.json';
import vi from './locales/vi/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      vi: { common: vi }
    },
    fallbackLng: 'en',
    debug: false,
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // order and caching from cookie/localStorage
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
