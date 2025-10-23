import React, { useRef, useEffect, useState } from 'react';
import API_BASE_URL from '../../config';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin, onRegisterSuccess }) {
  const modalRef = useRef();

  // ======= form state =======
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
  });

  // ======= ui state =======
  const [step, setStep] = useState(1); // 1: nhập thông tin & gửi OTP, 2: nhập OTP & xác thực
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  // resend controls (khớp logic BE: cooldown 60s, max 5 lần)
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const MAX_RESEND = 5;

  // close-outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose && onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // reset state khi mở/đóng
  useEffect(() => {
    if (isOpen) return;
    setStep(1);
    setOtp('');
    setError(null);
    setNotice(null);
    setLoading(false);
    setResendCooldown(0);
    setResendCount(0);
    setRegForm({ fullName: '', phone: '', email: '', password: '', confirm: '' });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
  };

  // ================== API calls ==================
  async function apiSendOtp(payload) {
    const res = await fetch(`${API_BASE_URL}/webAPI/api/register/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify(payload),
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      throw new Error(data.error || data.message || `Send OTP failed (HTTP ${res.status})`);
    }
    return data;
  }

  async function apiVerifyOtp({ email, otp }) {
    const res = await fetch(`${API_BASE_URL}/webAPI/api/register/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ email, otp }),
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      throw new Error(data.error || data.message || `Verify OTP failed (HTTP ${res.status})`);
    }
    return data; // {status, token, user, message}
  }

  async function apiResendOtp({ email }) {
    const res = await fetch(`${API_BASE_URL}/webAPI/api/register/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ email }),
    });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      throw new Error(data.error || data.message || `Resend OTP failed (HTTP ${res.status})`);
    }
    return data;
  }

  // ================== handlers ==================
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Theo yêu cầu: không validate phức tạp → chỉ check có nhập
    const { fullName, phone, email, password, confirm } = regForm;
    if (!fullName || !phone || !email || !password || !confirm) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      await apiSendOtp({ fullName, phone, email, password });
      setStep(2);
      setNotice(`Đã gửi OTP tới ${email}. Vui lòng kiểm tra hộp thư (OTP hiệu lực 5 phút).`);
      // set cooldown lần đầu
      setResendCooldown(60);
      setResendCount(0);
    } catch (err) {
      setError(err.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!otp) {
      setError('Vui lòng nhập mã OTP.');
      return;
    }

    try {
      setLoading(true);
      const { email } = regForm;
      const data = await apiVerifyOtp({ email, otp });
      // Thành công → có token & user
      setNotice('Xác thực thành công! Tài khoản đã được tạo.');
      // callback cho app lưu token/user nếu cần
      if (onRegisterSuccess) {
        onRegisterSuccess({ token: data.token, user: data.user });
      }
      // chuyển sang login (hoặc đóng modal)
      onSwitchToLogin ? onSwitchToLogin() : onClose && onClose();
    } catch (err) {
      setError(err.message || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);

    if (resendCooldown > 0) return;
    if (resendCount >= MAX_RESEND) {
      setError('Bạn đã vượt quá số lần gửi lại OTP. Vui lòng chờ hoặc đăng ký lại.');
      return;
    }

    try {
      setLoading(true);
      await apiResendOtp({ email: regForm.email });
      setNotice('Đã gửi lại OTP. Vui lòng kiểm tra email.');
      setResendCooldown(60);
      setResendCount((c) => c + 1);
    } catch (err) {
      setError(err.message || 'Gửi lại OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ================== render ==================
  return (
    <div className="modal-backdrop">
      <div className="login-modal" ref={modalRef}>
        <button className="close-btn" onClick={onClose} aria-label="Đóng">&times;</button>

        <h2 className="modal-title">Đăng ký</h2>
        <p className="modal-subtitle">
          {step === 1 ? 'Nhập thông tin và gửi OTP để xác thực email' : 'Nhập mã OTP để hoàn tất đăng ký'}
        </p>

        {step === 1 && (
          <form className="login-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="reg-fullName">Họ và tên</label>
              <input
                type="text"
                id="reg-fullName"
                name="fullName"
                placeholder="Nhập họ và tên"
                required
                value={regForm.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Số điện thoại</label>
              <input
                type="text"
                id="reg-phone"
                name="phone"
                placeholder="Nhập số điện thoại"
                required
                value={regForm.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                placeholder="Nhập email"
                required
                value={regForm.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Mật khẩu</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                placeholder="Nhập mật khẩu"
                required
                value={regForm.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="reg-confirm"
                name="confirm"
                placeholder="Nhập lại mật khẩu"
                required
                value={regForm.confirm}
                onChange={handleChange}
              />
            </div>

            {error && <p className="error-message">{error}</p>}
            {notice && <p className="notice-message" style={{ color: '#0a7' }}>{notice}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi OTP'}
            </button>

            <div className="form-options" style={{ marginTop: 12 }}>
              <a href="#" className="forgot-password">Quên mật khẩu?</a>
            </div>

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
          </form>
        )}

        {step === 2 && (
          <form className="login-form" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label>Email</label>
              <input type="text" value={regForm.email} disabled />
            </div>

            <div className="form-group">
              <label htmlFor="reg-otp">Mã OTP</label>
              <input
                type="text"
                id="reg-otp"
                placeholder="Nhập OTP 6 chữ số"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />
            </div>

            {error && <p className="error-message">{error}</p>}
            {notice && <p className="notice-message" style={{ color: '#0a7' }}>{notice}</p>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'Xác thực & Tạo tài khoản'}
            </button>

            <div className="form-options" style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                ← Sửa thông tin
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0 || resendCount >= MAX_RESEND}
                title={resendCooldown > 0 ? `Chờ ${resendCooldown}s để gửi lại` : undefined}
              >
                {resendCooldown > 0
                  ? `Gửi lại OTP (${resendCooldown}s)`
                  : (resendCount >= MAX_RESEND ? 'Đã hết lượt gửi lại' : 'Gửi lại OTP')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
