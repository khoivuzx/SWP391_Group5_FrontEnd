import { useEffect, useState, useRef } from "react";
import { FaUserCircle } from 'react-icons/fa';
import logo from "../../assets/react.svg";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { Link, useLocation } from 'react-router-dom';

// Component Brand
function Brand() {
  return (
    <a className="brand" href="/" aria-label="home">
      <img src={logo} alt="Logo" className="brand-logo" />
      <span className="brand-title">GogoRo Battery Swapping</span>
    </a>
  );
}

// Component Dropdown cho Battery Electric
function BatteryDropdown({ show, onEnter, onLeave, isActive }) {
  return (
    <div 
      className="nav-dropdown"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span className={`nav-link dropdown-trigger ${isActive ? 'active' : ''}`}>
        Pin và Trạm đổi pin
        <svg className="dropdown-arrow" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </span>
      {show && (
        <div className="dropdown-menu">
          <Link 
            to="/battery" 
            className={`dropdown-item ${isActive === '/battery' ? 'active' : ''}`}
          >
            Trạm đổi pin
          </Link>
          <Link 
            to="/battery-pin" 
            className={`dropdown-item ${isActive === '/battery-pin' ? 'active' : ''}`}
          >
            Công nghệ pin
          </Link>
        </div>
      )}
    </div>
  );
}

// Component Navigation
function Navigation({ isActive, isBatteryActive, showBatteryDropdown, setShowBatteryDropdown, hideService }) {
  return (
    <nav className="main-nav" aria-label="Primary">
      <Link 
        to="/" 
        className={`nav-link ${isActive('/') ? 'active' : ''}`}
      >
        Trang Chủ
      </Link>
      <BatteryDropdown 
        show={showBatteryDropdown}
        onEnter={() => setShowBatteryDropdown(true)}
        onLeave={() => setShowBatteryDropdown(false)}
        isActive={isBatteryActive()}
      />
      {!hideService && (
        <Link 
          to="/polices" 
          className={`nav-link ${isActive('/polices') ? 'active' : ''}`}
        >
          Gói dịch vụ
        </Link>
      )}
    </nav>
  );
}

// Component con cho nút Login
function LoginButton({ onLoginClick }) {
  return (
    <a 
      href="#" 
      className="cta login" 
      onClick={(e) => { 
        e.preventDefault(); 
        onLoginClick();
      }}
    >
      Đăng Nhập
    </a>
  );
}

// Component con cho các action của user (Logout, Liên kết xe)
function UserActions({ role, isDashboard, onLogout }) {
  // driver on dashboard: show vehicle-link and logout
  if (role === 'driver' && isDashboard) {
    return (
      <>
        <Link to="/vehicle-link" className="cta vehicle-link">Liên kết xe</Link>
        <button className="cta logout-btn" style={{ marginLeft: 12 }} onClick={onLogout}>Logout</button>
      </>
    );
  }
  // staff/admin on dashboard: only logout
  if ((role === 'staff' || role === 'admin') && isDashboard) {
    return <button className="cta logout-btn" onClick={onLogout}>Logout</button>;
  }
  // not dashboard but driver: show vehicle-link + logout
  if (role === 'driver') {
    return (
      <>
        <Link to="/vehicle-link" className="cta vehicle-link">Liên kết xe</Link>
        <button className="cta logout-btn" style={{ marginLeft: 12 }} onClick={onLogout}>Logout</button>
      </>
    );
  }
  // other logged in users: logout
  return <button className="cta logout-btn" onClick={onLogout}>Logout</button>;
}

// CHỈNH SỬA: Nhận prop onLoginClick từ App.jsx
export default function Header({ onLoginClick, user }) { 
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showBatteryDropdown, setShowBatteryDropdown] = useState(false);
  const location = useLocation();

  // LOGIC CUỘN CHUỘT: Thêm class 'scrolled' khi cuộn quá 20px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => location.pathname === path;
  const isBatteryActive = () => location.pathname === '/battery' || location.pathname === '/battery-pin';

  // Nếu là driver/staff/admin và đang ở dashboard tương ứng thì chỉ hiện Logout (và link riêng nếu cần)
  const role = user && user.role ? user.role.toLowerCase() : '';
  const isDriverDashboard = role === 'driver' && location.pathname === '/dashboard/driver';
  const isStaffDashboard = role === 'staff' && location.pathname === '/dashboard/staff';
  const isAdminDashboard = role === 'admin' && location.pathname === '/dashboard/admin';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // State cho menu user
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDriverMenu, setShowDriverMenu] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef();

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  return (
    <header
      className={`site-header ${scrolled ? "scrolled" : hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="header-inner">
        <Brand />

        {/* Nav cho driver dashboard */}
        <Navigation
          isActive={isActive}
          isBatteryActive={isBatteryActive}
          showBatteryDropdown={showBatteryDropdown}
          setShowBatteryDropdown={setShowBatteryDropdown}
          hideService={role === 'driver'}
        />
        {role === 'driver' && (
          <div
            className="nav-dropdown driver-dropdown"
            onMouseEnter={() => setShowDriverMenu(true)}
            onMouseLeave={() => setShowDriverMenu(false)}
          >
            <span
              className={`nav-link driver-nav-btn${isActive('/dashboard/driver') ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <span
                onClick={() => navigate('/dashboard/driver')}
                style={{ userSelect: 'none' }}
              >
                Driver
              </span>
              <svg
                className="dropdown-arrow driver-arrow"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ marginLeft: 6, pointerEvents: 'none' }}
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
            {showDriverMenu && (
              <div className="dropdown-menu driver-dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowDriverMenu(false);
                    navigate("/dashboard/driver/booking");
                  }}
                >
                  Đặt lịch
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowDriverMenu(false);
                    navigate("/driver/booking-history");
                  }}
                >
                  Kiểm tra đặt lịch
                </button>
              </div>
            )}
          </div>
        )}

        <div className="actions">
          {user && user.fullName && (
            <>
              <div className="user-menu-wrap" ref={userMenuRef}>
                <button
                  className="user-menu-trigger"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-label="User menu"
                >
                  <FaUserCircle className="user-menu-icon" />
                </button>
                <span className="user-menu-name">{user.fullName}</span>
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <button
                      className="user-menu-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/user/info");
                      }}
                    >
                      Thông tin người dùng
                    </button>
                    <button
                      className="user-menu-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate("/user/transactions");
                      }}
                    >
                      Lịch sử giao dịch
                    </button>
                    {role === 'driver' && (
                      <button
                        className="user-menu-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/vehicle-link");
                        }}
                      >
                        Liên kết xe
                      </button>
                    )}
                    <button
                      className="user-menu-btn logout"
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
              {/* Ẩn liên kết xe bên phải user icon khi ở dashboard driver */}
            </>
          )}
          {!user && <LoginButton onLoginClick={onLoginClick} />}
        </div>
      </div>
    </header>
  );
}