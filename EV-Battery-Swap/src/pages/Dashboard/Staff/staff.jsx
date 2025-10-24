
import React, { useState } from 'react';
import './staff.css';

const batterySummary = [
	{ label: 'Pin đầy', value: 5, sub: 'Sẵn sàng sử dụng', icon: '🟢' },
	{ label: 'Đang sạc', value: 2, sub: 'Đang nạp điện', icon: '🔌' },
	{ label: 'Bảo dưỡng', value: 1, sub: 'Cần kiểm tra', icon: '⚠️' },
	{ label: 'Giao dịch hôm nay', value: 24, sub: '+8% so với hôm qua', icon: '⏱️' },
];

const batteryList = [
	{ id: 'BAT001', type: '48V 30Ah', status: 'Đầy', soh: 98, location: 'Kệ A1', lastCharge: '10 phút trước', action: 'Chi tiết' },
	{ id: 'BAT002', type: '48V 30Ah', status: 'Đầy', soh: 95, location: 'Kệ A2', lastCharge: '25 phút trước', action: 'Chi tiết' },
	{ id: 'BAT003', type: '60V 40Ah', status: 'Đang sạc', soh: 88, location: 'Sạc B1', lastCharge: '2 giờ trước', action: 'Chi tiết' },
	{ id: 'BAT004', type: '48V 30Ah', status: 'Đầy', soh: 92, location: 'Kệ A3', lastCharge: '1 giờ trước', action: 'Chi tiết' },
	{ id: 'BAT005', type: '60V 40Ah', status: 'Bảo dưỡng', soh: 75, location: 'Khu vực sửa chữa', lastCharge: '1 ngày trước', action: 'Chi tiết' },
	{ id: 'BAT006', type: '48V 30Ah', status: 'Đang sạc', soh: 90, location: 'Sạc B2', lastCharge: '3 giờ trước', action: 'Chi tiết' },
	{ id: 'BAT007', type: '60V 40Ah', status: 'Đầy', soh: 97, location: 'Kệ C1', lastCharge: '15 phút trước', action: 'Chi tiết' },
	{ id: 'BAT008', type: '48V 30Ah', status: 'Đầy', soh: 85, location: 'Kệ A4', lastCharge: '45 phút trước', action: 'Chi tiết' },
];

const transactionList = [
	{ id: 'SW001', time: '14:30', customer: 'Nguyễn Văn A', vehicle: 'VN123456', pinReturn: 'BAT015', pinReceive: 'BAT001', payment: '25,000 đ' },
	{ id: 'SW002', time: '14:15', customer: 'Trần Thị B', vehicle: 'VN789012', pinReturn: 'BAT016', pinReceive: 'BAT002', payment: '25,000 đ' },
	{ id: 'SW003', time: '13:45', customer: 'Lê Văn C', vehicle: 'VN345678', pinReturn: 'BAT017', pinReceive: 'BAT004', payment: '30,000 đ' },
	{ id: 'SW004', time: '13:20', customer: 'Phạm Thị D', vehicle: 'VN901234', pinReturn: 'BAT018', pinReceive: 'BAT007', payment: '30,000 đ' },
];

const tabs = [
	{ label: 'Tồn kho pin', value: 'inventory' },
	{ label: 'Giao dịch đổi pin', value: 'transaction' },
];

export default function StaffDashboard({ user, onLoginClick }) {
	const [activeTab, setActiveTab] = useState('inventory');
	return (
		<div className="staff-dashboard-wrap">
			<div className="staff-dashboard-card">
				<h2 className="staff-dashboard-title">Dashboard Nhân viên Trạm</h2>
				<div className="staff-dashboard-subtitle">Quản lý tồn kho pin và giao dịch đổi pin</div>
				{/* Summary cards */}
				<div className="staff-dashboard-summary">
					{batterySummary.map((c, i) => (
						<div key={i} className="staff-dashboard-summary-card">
							<div className="staff-dashboard-summary-icon">{c.icon}</div>
							<div className="staff-dashboard-summary-value">{c.value}</div>
							<div className="staff-dashboard-summary-label">{c.label}</div>
							<div className="staff-dashboard-summary-sub">{c.sub}</div>
						</div>
					))}
				</div>
				{/* Tabs */}
				<div className="staff-dashboard-tabs">
					{tabs.map(tab => (
						<button
							key={tab.value}
							onClick={() => setActiveTab(tab.value)}
							className={"staff-dashboard-tab-btn" + (activeTab === tab.value ? " active" : "")}
						>
							{tab.label}
						</button>
					))}
				</div>
				{/* Tab content */}
				<div>
					{activeTab === 'inventory' && (
						<div className="staff-inventory-section">
							<div className="staff-inventory-title">Quản lý tồn kho pin</div>
							<div className="staff-inventory-desc">Theo dõi trạng thái và sức khỏe của từng viên pin</div>
							<div className="staff-inventory-table-wrap">
								<table className="staff-inventory-table">
									<thead>
										<tr>
											<th>Mã pin</th>
											<th>Loại pin</th>
											<th>Trạng thái</th>
											<th>Sức khỏe (SoH)</th>
											<th>Vị trí</th>
											<th>Sạc lần cuối</th>
											<th>Hành động</th>
										</tr>
									</thead>
									<tbody>
										{batteryList.map((b, i) => (
											<tr key={b.id}>
												<td>{b.id}</td>
												<td>{b.type}</td>
												<td>
													<span className={
														b.status === 'Đầy' ? 'badge badge-full' :
														b.status === 'Đang sạc' ? 'badge badge-charging' :
														b.status === 'Bảo dưỡng' ? 'badge badge-maintain' : ''
													}>{b.status}</span>
												</td>
												<td>
													<div className="soh-bar-wrap">
														<div className="soh-bar" style={{ width: b.soh + '%', background: b.soh > 90 ? '#1976d2' : b.soh > 80 ? '#f59e42' : '#ef4444' }}></div>
														<span className="soh-label">{b.soh}%</span>
													</div>
												</td>
												<td>{b.location}</td>
												<td>{b.lastCharge}</td>
												<td><button className="detail-btn">{b.action}</button></td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
					{activeTab === 'transaction' && (
						<div className="staff-transaction-section">
							<div className="staff-transaction-title">Giao dịch đổi pin gần đây</div>
							<div className="staff-transaction-desc">Lịch sử đổi pin trong ngày hôm nay</div>
							<div className="staff-transaction-table-wrap">
								<table className="staff-transaction-table">
									<thead>
										<tr>
											<th>Mã GD</th>
											<th>Thời gian</th>
											<th>Khách hàng</th>
											<th>Phương tiện</th>
											<th>Pin trả</th>
											<th>Pin nhận</th>
											<th>Thanh toán</th>
											<th>Hành động</th>
										</tr>
									</thead>
									<tbody>
										{transactionList.map((t, i) => (
											<tr key={t.id}>
												<td>{t.id}</td>
												<td>{t.time}</td>
												<td>{t.customer}</td>
												<td>{t.vehicle}</td>
												<td><span className="badge badge-return">{t.pinReturn}</span></td>
												<td><span className="badge badge-receive">{t.pinReceive}</span></td>
												<td>{t.payment}</td>
												<td><span className="action-done">✔</span></td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</div>
		</div>
	</div>
	);
}
