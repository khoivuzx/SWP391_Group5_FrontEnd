
import React from 'react';
import Header from '../../../components/Header/Header';

export default function AdminDashboard({ user, onLoginClick }) {
  return (
    <>
      <Header user={user} onLoginClick={onLoginClick} />
      <div style={{padding: '60px 20px'}}>
        <h1>Admin Dashboard</h1>
        <p>Welcome, admin! This is your management dashboard.</p>
      </div>
    </>
  );
}
