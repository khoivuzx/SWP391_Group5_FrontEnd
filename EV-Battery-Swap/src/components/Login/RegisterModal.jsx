import React, { useRef, useEffect, useState } from 'react';

import API_BASE_URL from '../../config';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin, onLoginSuccess }) {
  const modalRef = useRef();
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState(null);

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

  const handleRegChange = (e) => {
    setRegForm({ ...regForm, [e.target.id.replace('reg-', '')]: e.target.value });
  };

  async function registerUser({ fullName, phone, email, password }) {
    try {
      // Đổi key fullName thành full_name để backend nhận đúng
      const payload = { fullName: fullName, phone, email, password };
      console.log('Register payload:', payload);
  const response = await fetch(`${API_BASE_URL}/webAPI/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.log('Không parse được JSON từ response:', e);
      }
      console.log('Register response status:', response.status);
      console.log('Register response data:', data);
      if (!response.ok) {
        throw new Error((data.error || data.message || 'Đăng ký thất bại') + ` (HTTP ${response.status})`);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async function loginUser({ email, password }) {
    try {
      const response = await fetch(`${API_BASE_URL}/webAPI/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.log('Không parse được JSON từ login response:', e);
      }

      if (!response.ok) {
        throw new Error((data.error || data.message || 'Đăng nhập thất bại') + ` (HTTP ${response.status})`);
      }

      // Lưu thông tin đăng nhập
      if (data?.token) localStorage.setItem('authToken', data.token);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw error;
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    if (!regForm.fullName || !regForm.phone || !regForm.email || !regForm.password || !regForm.confirm) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (regForm.password !== regForm.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    try {
      // Đăng ký tài khoản
      await registerUser({
        fullName: regForm.fullName,
        phone: regForm.phone,
        email: regForm.email,
        password: regForm.password,
      });

      // Tự động đăng nhập sau khi đăng ký thành công
      try {
        const loginData = await loginUser({
          email: regForm.email,
          password: regForm.password,
        });

        // Cập nhật state và đóng modal
        if (onLoginSuccess && loginData?.user) {
          onLoginSuccess(loginData.user);
        }
        onClose();
      } catch (loginErr) {
        console.warn('Auto-login failed:', loginErr.message);
        // Nếu auto-login thất bại, vẫn thông báo đăng ký thành công
        // và chuyển sang trang đăng nhập
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
        setRegForm({ fullName: '', phone: '', email: '', password: '', confirm: '' });
        onSwitchToLogin && onSwitchToLogin();
      }
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="login-modal" ref={modalRef}>
        <button className="close-btn" onClick={onClose} aria-label="Đóng">&times;</button>
        <h2 className="modal-title">Đăng ký</h2>
        <p className="modal-subtitle">Tạo tài khoản mới để sử dụng dịch vụ.</p>
        <form className="login-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="reg-fullName">Họ và tên</label>
            <input type="text" id="reg-fullName" placeholder="Nhập họ và tên" required value={regForm.fullName} onChange={handleRegChange} />
          </div>
          <div className="form-group">
            <label htmlFor="reg-phone">Số điện thoại</label>
            <input type="text" id="reg-phone" placeholder="Nhập số điện thoại" required value={regForm.phone} onChange={handleRegChange} />
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input type="email" id="reg-email" placeholder="Nhập email" required value={regForm.email} onChange={handleRegChange} />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Mật khẩu</label>
            <input type="password" id="reg-password" placeholder="Nhập mật khẩu" required value={regForm.password} onChange={handleRegChange} />
          </div>
          <div className="form-group">
            <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
            <input type="password" id="reg-confirm" placeholder="Nhập lại mật khẩu" required value={regForm.confirm} onChange={handleRegChange} />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">Đăng ký</button>
          <div className="form-options" style={{ marginTop: 12 }}>
            <a href="#" className="forgot-password">Quên mật khẩu?</a>
          </div>
        </form>
        <p className="signup-link">
          Đã có tài khoản?{' '}
          <button
            type="button"
            className="register-link"
            style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
            onClick={onSwitchToLogin}
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}
