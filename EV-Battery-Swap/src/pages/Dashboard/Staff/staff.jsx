
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







// Pin station mockup - phong cách tối giản, pin hình tròn, nền sáng, hiệu ứng glow
function PinStationMockup({ batteries }) {
	const [selected, setSelected] = useState(null);
	const totalSlots = 30;
	const filled = batteries.slice(0, totalSlots);
	const emptySlots = totalSlots - filled.length;
	const allSlots = [
		...filled,
		...Array.from({ length: emptySlots }, (_, i) => ({
			id: `EMPTY${i+1}`,
			type: 'Chưa có pin',
			status: 'Trống',
			soh: 0,
			location: '-',
			lastCharge: '-',
			empty: true
		}))
	];
	const fullCount = filled.length;
	return (
		
		<div className="station-mockup-minimal">
			<div className="station-mockup-minimal-inner">
				<div className="station-mockup-minimal-screen">
			</div>
				<div className="station-mockup-minimal-grid">
					{allSlots.map((b, i) => (
						<div
							key={b.id}
							className={"station-mockup-minimal-battery" + (selected === i ? " selected" : "") + (b.empty ? " empty" : "")}
							onClick={() => setSelected(i)}
							title={b.id}
							style={{ cursor: 'pointer' }}
						>
							<span className="station-mockup-minimal-dot" style={{
								background: b.empty ? '#e5e7eb' : '#6be445',
								boxShadow: b.empty ? 'none' : '0 0 16px 4px #6be44588, 0 2px 8px #b6e4b6',
								border: b.empty ? '2px solid #bbb' : '2.5px solid #6be445',
								opacity: b.empty ? 0.5 : 1
							}}></span>
						</div>
					))}
				</div>
			</div>
			{selected !== null && (
				<div className="station-popup">
					{allSlots[selected].empty ? (
						<>
							<strong>{allSlots[selected].id}</strong> - <em>Ô trống</em><br />
							<span>Hiện tại chưa có pin trong ô này.</span><br />
							<span>Vị trí: <b>{allSlots[selected].location || '-'}</b></span><br />
						</>
					) : (
						<>
							<strong>{allSlots[selected].id}</strong> - {allSlots[selected].type}<br />
							<span>Trạng thái: <b>{allSlots[selected].status}</b></span><br />
							<span>Sức khỏe: <b>{allSlots[selected].soh}%</b></span><br />
							<span>Vị trí: <b>{allSlots[selected].location}</b></span><br />
							<span>Sạc lần cuối: <b>{allSlots[selected].lastCharge}</b></span><br />
						</>
					)}
					<button className="station-popup-close" onClick={() => setSelected(null)}>Đóng</button>
				</div>
			)}
		</div>
		
	);
}

export default function StaffDashboard({ user, onLoginClick }) {
	const [activeTab, setActiveTab] = useState('inventory');
	const [showStationModal, setShowStationModal] = useState(false);
	const openStationModal = () => setShowStationModal(true);
	const closeStationModal = () => setShowStationModal(false);
	return (
		<div className="staff-dashboard-wrap">

			{/* Right side image panel (moved to top) */}
			<div className="staff-right-panel">
				<img src="/ping.jpg" alt="Ping" className="staff-right-image" onClick={openStationModal} style={{ cursor: 'pointer' }} />
			</div>

			{/* Main dashboard card below the top row */}
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


			{/* Station modal (opens when clicking the image) */}
			{showStationModal && (
				<div className="station-modal-backdrop" onClick={closeStationModal}>
					<div className="station-modal" onClick={(e) => e.stopPropagation()}>
						{/* reuse the same mockup component inside the modal so clicking a slot shows the popup */}
						<PinStationMockup batteries={batteryList} />
						<div style={{ textAlign: 'right', marginTop: 12 }}>
							<button className="detail-btn" onClick={closeStationModal}>Đóng</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
