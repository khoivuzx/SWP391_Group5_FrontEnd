import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RegisterModal from './RegisterModal';
import './LoginModal.css';
import API_BASE_URL from '../../config';


/**
 * Component LoginModal
 * @param {boolean} isOpen - Trạng thái hiển thị modal
 * @param {function} onClose - Hàm đóng modal
 * @param {function} onLoginSuccess - Hàm gọi khi đăng nhập thành công
 */
export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [showRegister, setShowRegister] = useState(false);
  const modalRef = useRef();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
  const endpoint = `${API_BASE_URL}/webAPI/api/login`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', [...res.headers.entries()]);

      // Try to parse JSON safely
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = null;
      }
      if (res.ok) {
        if (data && data.token) {
          localStorage.setItem('authToken', data.token);
        }
        if (data && data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        if (data && data.user && onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        onClose();
        if (data && data.user && data.user.role) {
          const role = String(data.user.role).toLowerCase();
          if (role === 'admin') {
            navigate('/dashboard/admin');
          } else if (role === 'staff') {
            navigate('/dashboard/staff');
          } else if (role === 'driver') {
            navigate('/dashboard/driver');
          } else {
            setError('Tài khoản không có quyền truy cập dashboard phù hợp!');
            navigate('/');
          }
        } else {
          setError('API không trả về user.role. Vui lòng kiểm tra lại backend!');
          navigate('/');
        }
      } else {
        const msg = data?.message || data?.error || res.statusText || 'Email hoặc mật khẩu không đúng.';
        setError(msg);
      }
    } catch (err) {
      setError('Lỗi kết nối mạng. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Hiển thị RegisterModal nếu showRegister true
  if (showRegister) {
    return (
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="login-modal" ref={modalRef}>
        <button className="close-btn" onClick={onClose} aria-label="Đóng">
          &times;
        </button>
        <h2 className="modal-title">Đăng nhập</h2>
        <p className="modal-subtitle">Chào mừng trở lại. Vui lòng nhập thông tin của bạn.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Nhập email của bạn"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              placeholder="Nhập mật khẩu"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          <div className="form-options" style={{ marginTop: 12 }}>
            <a href="#" className="forgot-password">Quên mật khẩu?</a>
          </div>
        </form>
        <p className="signup-link">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            className="register-link"
            style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            onClick={() => setShowRegister(true)}
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
}