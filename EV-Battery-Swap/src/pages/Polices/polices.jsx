
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./polices.css";

const slideWords = [
	"Dễ dàng và tiện lợi",
	"Giá trị tốt cho tiền",
	"trình độ cao",
	"Không có hạn chế",
	"Toàn diện",
	"Thêm phản hồi",
	"Bất cứ lúc nào, bất cứ lúc nào",
	"Hiệu quả",
	"Nhiều ưu đãi",
	"Hiểu bạn",
	"Thật vui",
	"có ý nghĩa to lớn",
	"Toàn diện",
	"tương lai",
	"Công suất tối đa",
	"Tùy chỉnh",
	"Nhiều khả năng",
	"độ đàn hồi",
	"Sinh ra là dành cho bạn",
	"đáng tin cậy",
	"Đạt yêu cầu",
	"Dễ dàng và tiện lợi",
];


function PolicesHeader() {
	const [current, setCurrent] = useState(0);
	const intervalRef = useRef();

	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setCurrent((prev) => (prev + 1) % slideWords.length);
		}, 1800);
		return () => clearInterval(intervalRef.current);
	}, []);

	return (
		<section className="section section-leading">
			<div className="container">
				<h1 className="leading-title texture-solid">
					Làm cho trải nghiệm của bạn nhiều hơn
				</h1>
				<div className="slidewords-row">
					<span className="word-slide sliding" style={{ height: "1.25em" }}>
						<span
							className="words word-slide-track"
							style={{ transform: `translateY(-${current * 1.25}em)` }}
						>
							{slideWords.map((word, idx) => (
								<span className="word" key={idx}>{word}</span>
							))}
						</span>
					</span>
				</div>
				<h2 className="leading-subtitle">
					Sau đó, hãy tạm biệt việc tiếp nhiên liệu và bắt đầu thay pin.
				</h2>
				<p className="leading-description">
					Nhiều gói cước khác nhau, bạn có thể đi theo bất kỳ cách nào bạn muốn!
				</p>
			</div>
		</section>
	);
}

export default function Polices({ onLoginClick, user }) {
	// Truyền prop từ App.jsx
	return (
		<>
			<PolicesHeader />
			<PolicesPricingFAQ onLoginClick={onLoginClick} user={user} />
		</>
	);
}
// --- SVG Icon Component ---
// Thay thế cho thư viện lucide-react
const CheckIcon = ({ className }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M20 6 9 17l-5-5" />
	</svg>
);

// --- Reusable Button Component ---
// Component Button được tùy biến lại với CSS thuần
const Button = ({ size = 'md', variant = 'default', className = '', children, ...props }) => {
	const sizeClass = `btn--${size}`;
	const variantClass = `btn--${variant}`;

	return (
		<button className={`btn ${sizeClass} ${variantClass} ${className}`} {...props}>
			{children}
		</button>
	);
};

// --- DỮ LIỆU GÓI CƯỚC ĐÃ ĐƯỢC CẬP NHẬT THEO SOC/SOH ---
const pricingTiers = [
	{
		nameVi: "Eco",
		price: 200000,
		period: "VND/tháng",
		description: "Nhận pin nhóm C (75–80%). Pin trả ≥75% thì free",
		features: [
			"Nhận pin nhóm C (SoH 75–80%)",
			"Pin trả ≥75% thì miễn phí",
			"Yêu cầu SoH tối thiểu: 75%",
			"Phù hợp cho nhu cầu tiết kiệm",
		],
		cta: "Chọn gói Eco",
		cardClass: "card--basic"
	},
	{
		nameVi: "Basic",
		price: 300000,
		period: "VND/tháng",
		description: "Nhận pin nhóm B (80%–85%). Pin trả ≥75% thì free",
		features: [
			"Nhận pin nhóm B (SoH 80–85%)",
			"Pin trả ≥75% thì miễn phí",
			"Yêu cầu SoH tối thiểu: 75%",
			"Phù hợp cho người dùng phổ thông",
		],
		cta: "Chọn gói Basic",
		highlighted: true,
		cardClass: "card--standard"
	},
	{
		nameVi: "Standard",
		price: 500000,
		period: "VND/tháng",
		description: "Nhận pin nhóm A (≥85%). Pin trả ≥70% thì free",
		features: [
			"Nhận pin nhóm A (SoH ≥85%)",
			"Pin trả ≥70% thì miễn phí",
			"Yêu cầu SoH tối thiểu: 70%",
			"Pin chất lượng cao, ổn định",
		],
		cta: "Chọn gói Standard",
		cardClass: "card--optimal"
	},
	{
		nameVi: "Premium",
		price: 800000,
		period: "VND/tháng",
		description: "Nhận pin nhóm A mới. Pin trả ≥70% thì free",
		features: [
			"Nhận pin nhóm A mới (SoH 90–100%)",
			"Pin trả ≥70% thì miễn phí",
			"Yêu cầu SoH tối thiểu: 70%",
			"Ưu tiên dịch vụ, pin mới nhất",
		],
		cta: "Chọn gói Premium",
		cardClass: "card--advanced"
	},
];


// --- Main Page Component ---
// Component chính của trang
import API_BASE_URL from '../../config';
export function PolicesPricingFAQ({ onLoginClick, user }) {
	const isLoggedIn = !!(user && user.fullName);
	const navigate = useNavigate();
	const [message, setMessage] = useState("");

	// Map tên gói sang packageId (theo backend)
	const packageIdMap = {
		"Eco": 1,
		"Basic": 2,
		"Standard": 3,
		"Premium": 4
	};

	// Xử lý khi nhấn nút chọn gói
	const handleChoosePlan = async (tier) => {
		if (!isLoggedIn && onLoginClick) {
			onLoginClick();
		} else {
			const userId = user?.userId || user?.id;
			const packageId = packageIdMap[tier.nameVi];
			if (!userId || !packageId) {
				setMessage("Không xác định được thông tin người dùng hoặc gói pin.");
				return;
			}
			try {
				const params = new URLSearchParams({
					userId: userId.toString(),
					packageId: packageId.toString()
				});
				const res = await fetch(`${API_BASE_URL}/webAPI/api/buyPackage?${params.toString()}`);
				let data = {};
				try {
					data = await res.json();
				} catch {
					data = {};
				}
				if (data.vnpayUrl) {
					window.location.href = data.vnpayUrl;
				} else if (data.message) {
					setMessage(data.message);
				} else {
					setMessage('Có lỗi khi mua gói.');
				}
			} catch (err) {
				setMessage("Có lỗi khi kết nối đến máy chủ.");
			}
		}
	};

	return (
		<div className="polices-container">
			{/* Header */}
			<header className="page-header">
				<div className="header-icon-wrapper">
					<svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h1 className="header-title">Gói cước dịch vụ đổi pin</h1>
				<p className="header-subtitle">
					Chọn gói cước phù hợp với nhu cầu di chuyển của bạn. Tất cả các gói đều có thể thay đổi bất kỳ lúc nào. Không có chi phí ẩn.
				</p>
			</header>

			{/* Pricing Cards Section */}
			<main className="pricing-section">
				{message && (
					<div className="api-message" style={{ marginBottom: 16, color: message.includes('thành công') ? 'green' : 'red' }}>{message}</div>
				)}
				<div className="pricing-grid">
					{pricingTiers.map((tier) => (
						<div key={tier.nameVi} className={`pricing-card ${tier.cardClass}`}>
							{tier.highlighted && (
								<div className="highlight-badge">Phổ biến nhất</div>
							)}

							<div className="card-content">
								<h3 className="card-title">{tier.nameVi}</h3>
								<p className="card-description">{tier.description}</p>

								<div className="card-price-wrapper">
									{typeof tier.price === 'number' && tier.price > 0 ? (
										<>
											<div className="card-price">{tier.price.toLocaleString('vi-VN')}</div>
											<div className="card-period">{tier.period}</div>
										</>
									) : (
										<div className="card-price-special">{tier.price === 0 ? "Miễn Phí" : tier.price}</div>
									)}
								</div>

								<ul className="card-features">
									{tier.features.map((feature, index) => (
										<li key={index} className="feature-item">
											<CheckIcon className="feature-icon" />
											<span>{feature}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="card-footer">
								<Button size="lg" className="w-full" onClick={() => handleChoosePlan(tier)}>
									{tier.cta}
								</Button>
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}
