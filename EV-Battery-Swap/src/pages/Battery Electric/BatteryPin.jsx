
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './BatteryPin.css';

// Đăng ký plugin ScrollTrigger với GSAP một lần duy nhất
gsap.registerPlugin(ScrollTrigger);




export default function BatteryPin() {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedBatteryIndex, setSelectedBatteryIndex] = useState(null);

  const handleBatteryClick = (index) => {
    setSelectedBatteryIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBatteryIndex(null);
  };

  // --- Thêm các Ref cần thiết cho animation ---
  const canvasRef = useRef(null);
  const sectionRef = useRef(null); // Ref cho section "Power Packed"

  // --- Logic cho animation cuộn trang ---
  useEffect(() => {
  // Chỉ lấy các ảnh pin, không lấy ảnh xe máy
  // Đảm bảo chỉ vẽ các ảnh sequence-gn-battery-01.jpg đến 50.jpg
  const frameFiles = Array.from({length: 50}, (_, i) => `/pin/sequence-gn-battery-${String(i+1).padStart(2, '0')}.jpg`);
    const imageCache = [];
    frameFiles.forEach(src => {
      const img = new window.Image();
      img.src = src;
      imageCache.push(img);
    });
    const frameCount = frameFiles.length;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    // Đặt kích thước canvas phù hợp với ảnh (có thể điều chỉnh lại nếu ảnh khác size)
  canvas.width = 1374;
  canvas.height = 1374;
    // Vẽ ảnh đầu tiên lên canvas ngay khi nó tải xong
    imageCache[0].onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
  // Vẽ ảnh căn giữa, giữ tỉ lệ và zoom lớn hơn
  const img = imageCache[0];
  const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * zoom;
  const x = (canvas.width - img.width * scale) / 2;
  const y = (canvas.height - img.height * scale) / 2;
  context.drawImage(img, x, y, img.width * scale, img.height * scale);
    };
    let lastFrame = 0;
    const frameData = { frame: 0 };
    // Thiết lập animation với GSAP
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top center 20%',
        end: 'bottom 100%',
        scrub: 0.3, // scrub nhỏ hơn để animation mượt hơn
        pin: false,
      },
    });
    tl.to(frameData, {
      frame: frameCount - 1,
      ease: 'none',
      onUpdate: () => {
        // Lerp để chuyển đổi frame mượt hơn
        lastFrame += (frameData.frame - lastFrame) * 0.25;
        const frameIndex = Math.round(lastFrame);
        const currentImg = imageCache[frameIndex];
        if (currentImg && currentImg.complete) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          // Vẽ ảnh căn giữa, giữ tỉ lệ và zoom lớn hơn
          const zoom = 2;
          const scale = Math.min(canvas.width / currentImg.width, canvas.height / currentImg.height) * zoom;
          const x = (canvas.width - currentImg.width * scale) / 2;
          const y = (canvas.height - currentImg.height * scale) / 2;
          context.drawImage(currentImg, x, y, currentImg.width * scale, currentImg.height * scale);
        }
      },
    });
    return () => {
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill();
      }
    };
  }, []);

  return (
    <div className="battery-pin-page">
      {/* Main Container */}
      <div className="gogoro-container">
        {/* Background Video */}
        <video 
          className="background-video"
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/Pin.mp4" type="video/mp4" />
          {t('battery.pin.videoFallback')}
        </video>
        
        {/* Left Side - Text Content */}
        <div className="text-content">
          <h1>{t('battery.pin.heroTitle')}</h1>
          <p>{t('battery.pin.heroDesc')}</p>
        </div>

        {/* Right Side - Battery Station */}
        <div className="station-container">
          {/* Battery Grid */}
          <div className="battery-grid">
            {[...Array(18)].map((_, index) => (
              <div 
                key={index} 
                className="battery-slot"
                onClick={() => handleBatteryClick(index)}
                style={{'--i': index}}
              >
                <div className="battery-inner"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section giới thiệu pin kiểu VinFast */}
      <section className="vinfast-intro-section">
        {/* Left: Text */}
        <div className="vinfast-intro-text">
          <div className="vinfast-intro-label">{t('battery.pin.introLabel')}</div>
          <h2 className="vinfast-intro-title" dangerouslySetInnerHTML={{ __html: t('battery.pin.introHtml') }} />
        </div>
        {/* Right: Hình ảnh pin */}
        <div className="vinfast-intro-image-wrap">
          <img 
            src="/batterypin2.jpg" 
            alt="Gogoro Battery" 
            className="vinfast-intro-image" 
            style={{cursor: 'pointer'}}
            onClick={() => setIsModalOpen(true)}
          />
        </div>
      </section>

      {/* Modal hiển thị thông số khi click ảnh pin */}
      {isModalOpen && (
        <div className="battery-modal-overlay" onClick={closeModal}>
          <div className="battery-modal-content" onClick={e => e.stopPropagation()}>
            <button className="battery-modal-close" onClick={closeModal}>&times;</button>
            <div className="battery-modal-header">
              <h2>{t('battery.pin.modalHeader')}</h2>
            </div>
            <div className="battery-modal-body">
              <div>
                <div className="battery-modal-left">
                  <img src="/batterypin3.jpg" alt="Gogoro Battery" className="battery-modal-img" />
                </div>
                <div className="battery-modal-right">
                  <table className="battery-spec-table">
                    <tbody>
                      <tr><td>{t('battery.pin.specs.weight.label')}</td><td>{t('battery.pin.specs.weight.value')}</td></tr>
                      <tr><td>{t('battery.pin.specs.dimensions.label')}</td><td>{t('battery.pin.specs.dimensions.value')}</td></tr>
                      <tr><td>{t('battery.pin.specs.ip.label')}</td><td>{t('battery.pin.specs.ip.value')}</td></tr>
                      <tr><td>{t('battery.pin.specs.cooling.label')}</td><td>{t('battery.pin.specs.cooling.value')}</td></tr>
                      <tr><td>{t('battery.pin.specs.operatingTemp.label')}</td><td>{t('battery.pin.specs.operatingTemp.value')}</td></tr>
                      <tr><td>{t('battery.pin.specs.humidity.label')}</td><td>{t('battery.pin.specs.humidity.value')}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section pin nổi bật với animation cuộn ảnh */}
      <section ref={sectionRef} className="battery-pin-highlight">
        <div className="bph-text-content">
          <h2 className="bph-title">{t('battery.pin.powerPacked')}</h2>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%'}}>
          <canvas ref={canvasRef} className="bph-canvas" style={{display: 'block', margin: '32px auto 0 auto', maxWidth: '700px', width: '100%', height: 'auto', background: 'none'}}></canvas>
        </div>
      </section>
      {/* Section ảnh và số liệu nổi bật */}
      <section className="statsSection">
        <h2 className="title">
          {t('battery.pin.stats.title')}
        </h2>
        <p className="subtitle">
          {t('battery.pin.stats.subtitle')}
        </p>
        <div className="statsRow">
          <div className="statBlock">
            <div className="statNumber blue">50<sup>+</sup></div>
            <div className="statLabel">{t('battery.pin.stats.cityLabel')}</div>
          </div>
          <div className="statBlock">
            <div className="statNumber green">ONE</div>
            <div className="statLabel">{t('battery.pin.stats.platformLabel')}</div>
          </div>
          <div className="statBlock">
            <div className="statNumber blue">55<sup>+</sup></div>
            <div className="statLabel">{t('battery.pin.stats.modelsLabel')}</div>
          </div>
        </div>
        <img
          src="/img-pbgn-avengers@2x.jpg"
          alt={t('battery.pin.stats.imageAlt')}
          className="statsImage"
          style={{cursor: 'pointer'}}
          onClick={() => setIsStatsModalOpen(true)}
        />
      </section>

      {/* Modal hiển thị thông tin khi click ảnh stats */}
            <div style={{width: '100%', textAlign: 'center', margin: '0 auto', background: 'none'}}>
  <img src="/img-underfooter.jpg" alt={t('battery.pin.bannerAlt')} style={{width: '100%', maxWidth: '100vw', display: 'block', margin: '0 auto'}} />
      </div>
    </div>
    
  );
}