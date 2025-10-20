

import React from 'react';
import './UserInfo.css';

export default function UserInfo() {
  // Demo data, replace with real user info
  const user = {
    name: 'Bui Tri Duc',
    email: 'duc@example.com',
    phone: '0123 456 789',
    avatar: 'https://ui-avatars.com/api/?name=Bui+Tri+Duc&background=1976d2&color=fff&size=128',
    role: 'Khách hàng',
    joined: '20/10/2025',
  };
  return (
    <div className="userinfo-container">
      <div className="userinfo-card">
        <div className="userinfo-avatar-wrap">
          <img src={user.avatar} alt="avatar" className="userinfo-avatar" />
        </div>
        <div className="userinfo-main">
          <h2 className="userinfo-name">{user.name}</h2>
          <div className="userinfo-role">{user.role}</div>
          <div className="userinfo-fields">
            <div className="userinfo-field">
              <span className="userinfo-label">Email:</span>
              <span className="userinfo-value">{user.email}</span>
            </div>
            <div className="userinfo-field">
              <span className="userinfo-label">Số điện thoại:</span>
              <span className="userinfo-value">{user.phone}</span>
            </div>
            <div className="userinfo-field">
              <span className="userinfo-label">Ngày tham gia:</span>
              <span className="userinfo-value">{user.joined}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
