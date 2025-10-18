import { useEffect, useState } from "react";
import logo from "../../assets/react.svg";
import "./Header.css";
import { Link, useLocation } from 'react-router-dom';

// Component Brand
function Brand() {
  return (
    <a className="brand" href="/" aria-label="home">
      <img src={logo} alt="Logo" className="brand-logo" />
      <span className="brand-title">EV Battery Swapping</span>
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
        Pin và trạm sạc
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
function Navigation({ isActive, isBatteryActive, showBatteryDropdown, setShowBatteryDropdown }) {
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
      <Link 
        to="/polices" 
        className={`nav-link ${isActive('/polices') ? 'active' : ''}`}
      >
        Chính sách
      </Link>
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

  return (
    <header
      className={`site-header ${scrolled ? "scrolled" : hovered ? "hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="header-inner">
        <Brand />
        {!(isDriverDashboard || isStaffDashboard || isAdminDashboard) && (
          <Navigation
            isActive={isActive}
            isBatteryActive={isBatteryActive}
            showBatteryDropdown={showBatteryDropdown}
            setShowBatteryDropdown={setShowBatteryDropdown}
          />
        )}

        <div className="actions">
          {user && user.fullName && (
            <span className="user-welcome" style={{marginRight: 16, fontWeight: 500, color: '#1976d2'}}>
              Welcome, {user.fullName}
            </span>
          )}
          {(isDriverDashboard || isStaffDashboard || isAdminDashboard) ? (
            <UserActions role={role} isDashboard={true} onLogout={handleLogout} />
          ) : (
            user ? (
              <UserActions role={role} isDashboard={false} onLogout={handleLogout} />
            ) : (
              <LoginButton onLoginClick={onLoginClick} />
            )
          )}
        </div>
      </div>
    </header>
  );
}