
import React, { useEffect, useRef, useState } from "react";
import "./Battery.css";
import { useTranslation } from 'react-i18next';

function Battery() {
  // Khi vào trang này, tự động scroll lên đầu trang
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // đảm bảo video muted để browser cho autoplay
    v.muted = true;
    // playsInline cho mobile
    v.playsInline = true;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // nếu lần đầu tiên nhìn thấy >=50% thì play 1 lần
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !hasPlayedRef.current) {
            v.play().catch(() => {});
            hasPlayedRef.current = true;
          }
          // khi không hiển thị thì pause luôn
          if (!entry.isIntersecting) {
            v.pause();
          }
        });
      },
      { threshold: [0.5] }
    );

    obs.observe(v);
    return () => obs.disconnect();
  }, []);

  // Scroll đến đúng project-card theo index
  const scrollToProjectCard = (idx) => {
    const el = document.getElementById(`project-card-${idx}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const absoluteY = window.scrollY + rect.top;
      const centerY = absoluteY - (window.innerHeight / 2) + (rect.height / 2);
      window.scrollTo({ top: centerY, behavior: 'smooth' });
    }
  };


  // Card component
  const IntroCard = ({ img, title, desc, onClick }) => (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <img src={img} alt={title} />
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );

  // project-card-1 contents (localized if translations available)
  const projectCard1Contents = t('battery.projectCard1Contents', { returnObjects: true }) || [
    {
      img: '/b1.jpg',
      title: 'Pin thông minh - Đổi pin siêu tốc',
      subtitle: 'Chỉ vài giây, tiếp năng lượng cho hành trình mới.',
      desc: 'Không còn chờ đợi sạc. Đổi pin nhanh, sạch, tiện lợi. Công nghệ pin hiện đại giúp bạn luôn sẵn sàng di chuyển, tiết kiệm thời gian và bảo vệ môi trường.'
    },
    {
      img: '/b2.jpg',
      title: 'Pin Lithium thế hệ mới',
      subtitle: 'An toàn, tuổi thọ cao.',
      desc: 'Pin Lithium với công nghệ quản lý thông minh, chống cháy nổ, tuổi thọ vượt trội, bảo vệ môi trường.'
    },
    {
      img: '/a1.jpg',
      title: 'Đổi pin mọi lúc mọi nơi',
      subtitle: 'Tiện lợi cho mọi hành trình.',
      desc: 'Hệ thống trạm phủ rộng, đổi pin nhanh chóng, không lo hết năng lượng giữa đường.'
    }
  ];

  const [card1Idx, setCard1Idx] = useState(0);
  const [slide, setSlide] = useState(''); // '', 'left', 'right'
  const handleNextCard1 = () => {
    setSlide('left');
    setTimeout(() => {
      setCard1Idx((idx) => (idx === projectCard1Contents.length - 1 ? 0 : idx + 1));
      setSlide('right');
      setTimeout(() => setSlide(''), 300);
    }, 300);
  };
    const projectCard2Contents = t('battery.projectCard2Contents', { returnObjects: true }) || [
      {
        img: '/c2.jpg',
        title: 'Trạm đổi pin tự động',
        subtitle: 'Tiết kiệm thời gian, tối ưu chi phí.',
        desc: 'Trạm đổi pin thông minh vận hành 24/7, lưu trữ năng lượng an toàn, hỗ trợ nhiều loại xe điện. Đảm bảo nguồn pin luôn sẵn sàng, giảm thiểu chi phí bảo trì và vận hành.'
      },
      {
        img: '/img-network-feature-2.jpg',
        title: 'Trạm lưu trữ năng lượng',
        subtitle: 'An toàn, hiện đại, thân thiện môi trường.',
        desc: 'Trạm lưu trữ pin với công nghệ kiểm soát thông minh, tiết kiệm chi phí vận hành, bảo vệ môi trường.'
      }
    ];

  const [card2Idx, setCard2Idx] = useState(0);
  const [slide2, setSlide2] = useState('');
  const handleNextCard2 = () => {
    setSlide2('left');
    setTimeout(() => {
      setCard2Idx((idx) => (idx === projectCard2Contents.length - 1 ? 0 : idx + 1));
      setSlide2('right');
      setTimeout(() => setSlide2(''), 300);
    }, 300);
  };

  const projectCard3Contents = t('battery.projectCard3Contents', { returnObjects: true }) || [
    {
      img: '/img-network-feature-3.jpg',
      title: 'Ứng dụng quản lý & kết nối',
      subtitle: 'Kiểm soát pin, hành trình và thanh toán chỉ với một chạm.',
      desc: 'Kết nối hệ sinh thái pin đổi nhanh, tra cứu trạm gần nhất, quản lý lịch sử sử dụng, thanh toán không tiền mặt, nhận thông báo bảo trì và hỗ trợ 24/7. Trải nghiệm di chuyển thông minh, an toàn, tiện lợi.'
    },
    {
      img: '/d2.jpg',
      title: 'Quản lý thông minh',
      subtitle: 'Theo dõi trạng thái pin và xe mọi lúc.',
      desc: 'Ứng dụng di động giúp bạn kiểm tra trạng thái pin, lịch sử sử dụng, nhận thông báo bảo trì và hỗ trợ nhanh chóng.'
    }
  ];

  const [card3Idx, setCard3Idx] = useState(0);
  const [slide3, setSlide3] = useState('');
  const handleNextCard3 = () => {
    setSlide3('left');
    setTimeout(() => {
      setCard3Idx((idx) => (idx === projectCard3Contents.length - 1 ? 0 : idx + 1));
      setSlide3('right');
      setTimeout(() => setSlide3(''), 300);
    }, 300);
  };

  // ImageSwapper - crossfades between two images using CSS opacity transition
  const ImageSwapper = ({ srcA = '/pinswap/img-swap1.jpg', srcB = '/pinswap/img-swap2.jpg', interval = 4000, alt = '' }) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
      // Preload images so crossfade is smooth
      const a = new Image();
      const b = new Image();
      a.src = srcA;
      b.src = srcB;

      const id = setInterval(() => {
        setCurrent((c) => (c === 0 ? 1 : 0));
      }, interval);

      return () => clearInterval(id);
    }, [srcA, srcB, interval]);

    return (
      <div className="card-sumary image-swapper" role="img" aria-label={alt}>
        <img className={`swap-img ${current === 0 ? 'visible' : ''}`} src={srcA} alt={alt} />
        <img className={`swap-img ${current === 1 ? 'visible' : ''}`} src={srcB} alt={alt} />
      </div>
    );
  };

  return (
    <div className="battery-page">
      {/* HERO SECTION */}

        <div className="hero" style={{ marginBottom: 40 }}>
        <img src="/img-battery.jpg" alt="Battery Swap" className="hero-image" />
        <div className="hero-content">
          <h1>{t('battery.hero.title')}</h1>
        </div>
      </div>

      {/* Video minh họa quy trình swap pin */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', background: '#fff', margin: '40px auto 48px auto' }}>
        <video
          style={{ width: '100%', maxWidth: 1550, aspectRatio: '16/9', background: '#000', borderRadius: 0, boxShadow: 'none', display: 'block' }}
          autoPlay
          muted
          loop
          playsInline
          poster="/img-network-hero.jpg"
        >
          <source src="/video-gn-swap.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* GIỚI THIỆU VỀ GIẢI PHÁP */}
      <section className="intro-section">
        <h2>{t('battery.intro.heading')}</h2>
        <div className="intro-cards">
          <IntroCard
            img="/img-battery3.jpg"
            title={t('battery.intro.card1.title')}
            desc={t('battery.intro.card1.desc')}
            onClick={() => scrollToProjectCard(1)}
          />
          <IntroCard
            img="/img-battery4.jpg"
            title={t('battery.intro.card2.title')}
            desc={t('battery.intro.card2.desc')}
            onClick={() => scrollToProjectCard(2)}
          />
          <IntroCard
            img="/img-battery2.jpg"
            title={t('battery.intro.card3.title')}
            desc={t('battery.intro.card3.desc')}
            onClick={() => scrollToProjectCard(3)}
          />
        </div>
      </section>



      {/* PROJECT SECTION - BỐ CỤC ẢNH 50% - TEXT 50% */}
      <section className="project-section-single" id="project-section-single">
        <h2>{t('battery.platformHeading')}</h2>

        <div className="project-card-gogoro">
          {/* THẺ DỰ ÁN 1: SLIDE NỘI DUNG */}
          <div className="card-item" id="project-card-1">
            <div className={`card-image-wrapper slide-horizontal ${slide === 'left' ? 'slide-out-left' : ''}${slide === 'right' ? 'slide-in-right' : ''}`.trim()}>
              <img src={projectCard1Contents[card1Idx].img} alt={projectCard1Contents[card1Idx].title} />
            </div>
            <div className={`card-text-content card-text-with-slide slide-horizontal ${slide === 'left' ? 'slide-out-left' : ''}${slide === 'right' ? 'slide-in-right' : ''}`.trim()}>
              <div className="card-text-main">
                <h4>{projectCard1Contents[card1Idx].title}</h4>
                <h3>{projectCard1Contents[card1Idx].subtitle}</h3>
                <p>{projectCard1Contents[card1Idx].desc}</p>
              </div>
              <div className="card-slide-btns">
                <button className="slide-btn simple-circle" onClick={handleNextCard1} aria-label="Xem tiếp">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="12" stroke="#bbb" strokeWidth="2" fill="#fff" />
                    <path d="M12 10L16 14L12 18" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* THẺ DỰ ÁN 2: SLIDE NỘI DUNG */}
          <div className="card-item" id="project-card-2">
            <div className={`card-image-wrapper slide-horizontal ${slide2 === 'left' ? 'slide-out-left' : ''}${slide2 === 'right' ? 'slide-in-right' : ''}`.trim()}>
              <img src={projectCard2Contents[card2Idx].img} alt={projectCard2Contents[card2Idx].title} />
            </div>
            <div className={`card-text-content card-text-with-slide slide-horizontal ${slide2 === 'left' ? 'slide-out-left' : ''}${slide2 === 'right' ? 'slide-in-right' : ''}`.trim()}>
              <div className="card-text-main">
                <h4>{projectCard2Contents[card2Idx].title}</h4>
                <h3>{projectCard2Contents[card2Idx].subtitle}</h3>
                <p>{projectCard2Contents[card2Idx].desc}</p>
              </div>
              <div className="card-slide-btns">
                <button className="slide-btn simple-circle" onClick={handleNextCard2} aria-label="Xem tiếp">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="12" stroke="#bbb" strokeWidth="2" fill="#fff" />
                    <path d="M12 10L16 14L12 18" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* THẺ DỰ ÁN 3: SLIDE NỘI DUNG */}
          <div className="card-item" id="project-card-3">
            <div className={`card-image-wrapper slide-horizontal ${slide3 === 'left' ? 'slide-out-left' : ''}${slide3 === 'right' ? 'slide-in-right' : ''}`.trim()}>
              <img src={projectCard3Contents[card3Idx].img} alt={projectCard3Contents[card3Idx].title} />
            </div>
            <div className={`card-text-content card-text-with-slide slide-horizontal ${slide3 === 'left' ? 'slide-out-left' : ''}${slide3 === 'right' ? 'slide-in-right' : ''}`.trim()}>
              <div className="card-text-main">
                <h4>{projectCard3Contents[card3Idx].title}</h4>
                <h3>{projectCard3Contents[card3Idx].subtitle}</h3>
                <p>{projectCard3Contents[card3Idx].desc}</p>
              </div>
              <div className="card-slide-btns">
                <button className="slide-btn simple-circle" onClick={handleNextCard3} aria-label="Xem tiếp">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="12" stroke="#bbb" strokeWidth="2" fill="#fff" />
                    <path d="M12 10L16 14L12 18" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE OUR SOLUTION */}
      <section className="intro-section">
        <h2>{t('battery.why.heading')}</h2>
        <div className="intro-cards-sumary">
          <ImageSwapper srcA="/pinswap/img-swap1.jpg" srcB="/pinswap/img-swap2.jpg" interval={2000} alt="Pin cho xe điện" />

          <div className="sumary-text-chung">
            <div className="sumary-text-1">
              <h3 className="text">SỰ TIỆN LỢI</h3>
              <p>
Các điểm đổi pin EV sử dụng ít diện tích hơn so với chỗ đỗ xe và lắp đặt nhanh chóng, dễ dàng tại nhiều địa điểm khác nhau. Chỉ cần một điểm đổi pin, bạn có thể phục vụ hàng trăm lượt đổi pin mỗi ngày mà không cần chờ đợi.              </p>
            </div>

            <div className="sumary-text-1">
              <h3 className="text">DỄ VẬN HÀNH</h3>
              <p>
Chống chịu thời tiết. Chống phá hoại. Ít bảo trì. Giám sát 24 giờ, cập nhật từ xa và các biện pháp an toàn tự động mang lại thời gian hoạt động 99%.              </p>
            </div>

            <div className="sumary-text-1">
              <h3 className="text">XÂY DỰNG ĐỂ TRƯỜNG TỒN</h3>
              <p>
Thiết kế chắc chắn, công nghệ tiên tiến và cập nhật liên tục. Được thiết kế để đảm bảo độ tin cậy trong những môi trường đô thị khắc nghiệt nhất. Thay thế liên tục, năm này qua năm khác.              </p>
            </div>
          </div>
        </div>
      </section>

      
      {/* VIDEO SECTION: play/pause on scroll */}
      <section className="video-section video-hero">
        <video
          ref={videoRef}
          src="/video-gn-think-ahead.mp4"
          poster="/img-network-hero.jpg"
          // muted và playsInline đã set trong useEffect
          // không để controls để giống hero
          className="video-cover"
        />
        <div className="video-overlay">
          <div className="eyebrow">SMART &amp; CONNECTED</div>
          <h2 className="video-title">Thinking ahead.</h2>
          <p className="video-desc">
SmartGEN là trung tâm thần kinh kết nối đám mây của chúng tôi. Trí tuệ nhân tạo (AI) của nó liên tục học hỏi từ các kiểu lái xe và hành vi thay đổi để dự đoán thời điểm và địa điểm cần pin đầy. Bằng cách phân phối năng lượng thông minh, chúng tôi giúp hàng trăm nghìn người lái xe di chuyển nhanh chóng trên đường đi.          </p>
        </div>
      </section>


    </div>
  );
}

export default Battery;