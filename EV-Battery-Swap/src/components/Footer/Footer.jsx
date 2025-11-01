// src/components/Footer/Footer.jsx
import './Footer.css';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Cột logo và social */}
        <div className="footer-col">
          <h2 className="footer-logo">MyBrand</h2>
          <ul className="social-links">
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
          </ul>
        </div>

        {/* Smart Vehicles */}
        <div className="footer-col">
          <h4>{t('footer.smartVehicles.title')}</h4>
          <ul>
            <li><a href="#">{t('footer.smartVehicles.pulse')}</a></li>
            <li><a href="#">{t('footer.smartVehicles.delight')}</a></li>
            <li><a href="#">{t('footer.smartVehicles.crossover')}</a></li>
          </ul>
        </div>

        {/* About Us */}
        <div className="footer-col">
          <h4>{t('footer.about.title')}</h4>
          <ul>
            <li><a href="#">{t('footer.about.company')}</a></li>
            <li><a href="#">{t('footer.about.news')}</a></li>
            <li><a href="#">{t('footer.about.media')}</a></li>
          </ul>
        </div>

        {/* Get Support */}
        <div className="footer-col">
          <h4>{t('footer.support.title')}</h4>
          <ul>
            <li><a href="#">{t('footer.support.tech')}</a></li>
            <li><a href="#">{t('footer.support.contact')}</a></li>
            <li><a href="#">{t('footer.support.faq')}</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        {t('footer.copyrightPrefix', { year })} All rights reserved.
      </div>
    </footer>
  );
}
