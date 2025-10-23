// src/App.jsx

import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LoginModal from './components/Login/LoginModal';

// Components Trang
import Home from './pages/Home/Home';
import Battery from './pages/Battery Electric/Battery';
import BatteryPin from './pages/Battery Electric/BatteryPin';
import Polices from './pages/Polices/polices';
import ForgotPass from './components/Login/ForgotPass';
import ResetPass from './components/Login/ResetPass'; // 👈 THÊM DÒNG NÀY
import AdminDashboard from './pages/Dashboard/Admin/admin';
import StaffDashboard from './pages/Dashboard/Staff/staff';
import DriverDashboard from './pages/Dashboard/Driver/findSation/driver.jsx';
import VehicleLink from './pages/Dashboard/Driver/vehicleLink/VehicleLink';
import UserInfo from './pages/User/UserInfo';
import TransactionHistory from './pages/User/TransactionHistory';
import Booking from './pages/Dashboard/Driver/Booking/booking.jsx';

function AppContent() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); 
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleOpenModal = () => setIsLoginModalOpen(true);
  const handleCloseModal = () => setIsLoginModalOpen(false);
  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    setIsLoginModalOpen(false);
  };

  const location = useLocation();
  // const isDriverRoute = location.pathname.startsWith('/dashboard/driver');
  const isUserRoute = location.pathname.startsWith('/user');

  React.useEffect(() => {
    // Nếu truy cập nhầm /admin/dashboard thì chuyển hướng sang /dashboard/admin
    if (window.location.hash === '#/admin/dashboard') {
      window.location.hash = '#/dashboard/admin';
    }
    // Nếu truy cập nhầm /dashboard/staff thì chuyển hướng sang /staff/dashboard
    if (window.location.hash === '#/dashboard/staff') {
      window.location.hash = '#/staff/dashboard';
    }
  }, []);
  return (
    <>
      <Header onLoginClick={handleOpenModal} user={user} />
      <main> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/battery" element={<Battery />} /> 
          <Route path="/battery-pin" element={<BatteryPin />} />
          <Route path="/polices" element={<Polices onLoginClick={handleOpenModal} user={user} />} />
          <Route path="/dashboard/admin" element={<AdminDashboard user={user} onLoginClick={handleOpenModal} />} />
          <Route path="/staff/dashboard" element={<StaffDashboard user={user} onLoginClick={handleOpenModal} />} />
          <Route path="/dashboard/driver" element={<DriverDashboard />} />
          <Route path="/dashboard/driver/booking" element={<Booking />} />
          <Route path="/vehicle-link" element={<VehicleLink />} />
          <Route path="/forgot-pass" element={<ForgotPass />} />
          <Route path="/reset-password" element={<ResetPass />} />
          <Route path="/user/info" element={<UserInfo />} />
          <Route path="/user/transactions" element={<TransactionHistory />} />
        </Routes>
      </main>
      {!isUserRoute && <Footer />}
      <LoginModal
        isOpen={isLoginModalOpen} 
        onClose={handleCloseModal} 
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}