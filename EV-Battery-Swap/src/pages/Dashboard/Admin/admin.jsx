
import React, { useState } from 'react';
import Header from '../../../components/Header/Header';
import './admin.css';

// Simple placeholder chart (replace with real chart lib later)
function PlaceholderChart({ type = 'line', height = 180 }) {
  return (
    <div style={{ height, background: '#f7fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdbdbd', fontSize: 18 }}>
      <span>{type === 'bar' ? 'Bar Chart' : 'Line Chart'} (Demo)</span>
    </div>
  );
}

const summaryCards = [
  {
    label: 'Tổng doanh thu tháng này',
    value: '65,000,000 đ',
    sub: '+12% so với tháng trước',
    icon: '📈',
  },
  {
    label: 'Tổng số trạm',
    value: '4',
    sub: '3 hoạt động, 1 bảo trì',
    icon: '🏢',
  },
  {
    label: 'Khách hàng',
    value: '1,234',
    sub: '+85 người dùng mới',
    icon: '🧑‍🤝‍🧑',
  },
  {
    label: 'Lượt đổi pin',
    value: '2,600',
    sub: 'Trung bình 87/ngày',
    icon: '🔄',
  },
];

const tabs = [
  { label: 'Tổng quan', value: 'overview' },
  { label: 'Quản lý trạm', value: 'station' },
  { label: 'Người dùng', value: 'user' },
  { label: 'Phân tích', value: 'analytics' },
];

export default function AdminDashboard({ user, onLoginClick }) {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <>
      <Header user={user} onLoginClick={onLoginClick} pageTitle="Hệ thống quản lí" />
      <div className="admin-dashboard-wrap">
        <div className="admin-dashboard-card">
          <h2 className="admin-dashboard-title">Hệ thống quản lí</h2>
          <div className="admin-dashboard-subtitle">Tổng quan hệ thống, báo cáo và phân tích dữ liệu</div>
          {/* Summary cards */}
          <div className="admin-dashboard-summary">
            {summaryCards.map((c, i) => (
              <div key={i} className="admin-dashboard-summary-card">
                <div style={{ fontSize: 15, color: '#7c8c8f', marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1976d2', marginBottom: 2 }}>{c.value}</div>
                <div style={{ fontSize: 13, color: '#10b981' }}>{c.sub}</div>
              </div>
            ))}
          </div>
          {/* Tabs */}
          <div className="admin-dashboard-tabs">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={"admin-dashboard-tab-btn" + (activeTab === tab.value ? " active" : "")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Tab content */}
          <div>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 320, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(33,150,243,0.04)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Doanh thu & Lượt đổi pin</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Xu hướng 5 tháng gần nhất</div>
                  <PlaceholderChart type="line" height={180} />
                </div>
                <div style={{ flex: 1, minWidth: 260, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(33,150,243,0.04)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Giờ cao điểm</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Phân bổ lượt đổi pin theo giờ trong ngày</div>
                  <PlaceholderChart type="bar" height={180} />
                </div>
              </div>
            )}
            {activeTab === 'station' && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 320, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(33,150,243,0.04)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Quản lý trạm</div>
                  <ul style={{ color: '#444', fontSize: 15, marginBottom: 10, paddingLeft: 18 }}>
                    <li>Theo dõi lịch sử sử dụng & trạng thái sức khỏe (SoH – State of Health)</li>
                    <li>Điều phối pin giữa các trạm</li>
                    <li>Xử lý khiếu nại & đổi pin lỗi</li>
                  </ul>
                  <div style={{ color: '#bdbdbd', fontSize: 15 }}>Tính năng đang phát triển...</div>
                </div>
              </div>
            )}
            {activeTab === 'user' && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 320, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(33,150,243,0.04)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Quản lý người dùng & gói thuê</div>
                  <ul style={{ color: '#444', fontSize: 15, marginBottom: 10, paddingLeft: 18 }}>
                    <li>Quản lý khách hàng</li>
                    <li>Tạo gói thuê pin</li>
                    <li>Phân quyền nhân viên trạm đổi pin</li>
                  </ul>
                  <div style={{ color: '#bdbdbd', fontSize: 15 }}>Tính năng đang phát triển...</div>
                </div>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 320, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 4px rgba(33,150,243,0.04)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Báo cáo & thống kê</div>
                  <ul style={{ color: '#444', fontSize: 15, marginBottom: 10, paddingLeft: 18 }}>
                    <li>Doanh thu, số lượt đổi pin</li>
                    <li>Báo cáo tần suất đổi pin, giờ cao điểm</li>
                    <li>AI gợi ý dự báo nhu cầu sử dụng trạm đổi pin để nâng cấp hạ tầng</li>
                  </ul>
                  <div style={{ color: '#bdbdbd', fontSize: 15 }}>Tính năng đang phát triển...</div>
                </div>
              </div>
            )}
          </div>
          {/* AI Suggestion Section */}
          <div style={{ marginTop: 28, background: '#f7fafc', borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 10 }}>AI Gợi ý nâng cấp hạ tầng</div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260, background: '#e6f2fd', borderRadius: 10, padding: 16, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, color: '#1976d2', marginBottom: 6 }}>Trạm Nguyễn Huệ - Mở rộng khuyến nghị</div>
                <div style={{ color: '#444', fontSize: 15, marginBottom: 6 }}>Nhu cầu tăng 45% trong giờ cao điểm. Đề xuất tăng thêm 5 pin để giảm thời gian chờ.</div>
                <span style={{ background: '#d1fae5', color: '#059669', borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>Ưu tiên cao</span>
              </div>
              <div style={{ flex: 1, minWidth: 260, background: '#fef9c3', borderRadius: 10, padding: 16, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, color: '#b45309', marginBottom: 6 }}>Khu vực Q7 - Mở trạm mới</div>
                <div style={{ color: '#444', fontSize: 15, marginBottom: 6 }}>Phát hiện 300+ yêu cầu tìm kiếm từ khu vực Q7. ROI dự kiến 18 tháng.</div>
                <span style={{ background: '#fef08a', color: '#b45309', borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 600 }}>Ưu tiên trung bình</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
