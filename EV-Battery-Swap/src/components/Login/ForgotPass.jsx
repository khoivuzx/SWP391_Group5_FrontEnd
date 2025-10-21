
import React, { useState } from 'react';
import './ForgotPass.css';

export default function ForgotPass() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Gửi yêu cầu quên mật khẩu tới API
    setSubmitted(true);
  };

  return (
    <div className="forgotpass-container">
      <div className="forgotpass-box">
        <h2>Quên mật khẩu</h2>
        <p>Nhập email bạn đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.</p>
        {submitted ? (
          <div className="forgotpass-success">
            <p>Vui lòng kiểm tra email để nhận hướng dẫn đặt lại mật khẩu.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgotpass-form">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button type="submit">Gửi yêu cầu</button>
          </form>
        )}
      </div>
    </div>
  );
}
