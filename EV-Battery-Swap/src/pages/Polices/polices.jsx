import React, { useEffect, useRef, useState } from "react";
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

export default function Polices() {
	return (
		<>
			<PolicesHeader />
			<PolicesPricingFAQ />
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

// --- Pricing Data ---
// Dữ liệu các gói cước không đổi
const pricingTiers = [
		{
				nameVi: "Gói Linh Hoạt Tiết Kiệm",
				price: 0,
				period: "VND/tháng",
				description: "Đi ít trả ít",
				features: [
					"Phí thuê tháng: 0 VND",
					"Phí hoán đổi: ~1.000 VND/km",
					"Phí thiết lập: 4.500.000 VND",
					"Miễn phí đổi pin tháng đầu",
					"Phù hợp: <300km/tháng",
					"Lý tưởng cho: Nhân viên VP, học sinh, người già",
				],
				cta: "Chọn gói này",
				cardClass: "card--basic"
			},
			{
				nameVi: "Gói Tiêu Chuẩn",
				price: 350000,
				period: "VND/tháng",
				description: "Tháng ổn định, đổi pin không giới hạn giờ thấp điểm",
				features: [
					"Phí thuê: 350.000 VND/tháng",
					"Miễn phí đổi: 10:00-16:00 & 22:00-06:00",
					"Phí ngoài giờ: 2.000 VND/Ah",
					"Phí thiết lập: 4.500.000 VND (hoặc 2.000.000 nếu ≥24 tháng)",
					"Kiểm soát chi phí ổn định",
					"Phù hợp: Nhân viên hành chính, giao hàng",
				],
				cta: "Chọn gói này",
				highlighted: true,
				cardClass: "card--standard"
			},
			{
				nameVi: "Gói Đi Nhiều",
				price: 570000,
				period: "VND/tháng",
				description: "Hoán đổi mọi lúc, phí cố định",
				features: [
					"Phí thuê: 570.000 VND/tháng",
					"Miễn phí đổi pin: Không giới hạn thời gian",
					"Phí thiết lập: 4.500.000 VND (trả góp 6 tháng)",
					"Ưu đãi bảo dưỡng xe pin",
					"Không lo chi phí phát sinh",
					"Phù hợp: Giao nhận, chạy xe ≥800km/tháng",
				],
				cta: "Chọn gói này",
				cardClass: "card--optimal"
			},
			{
				nameVi: "Gói Ngắn Hạn",
				price: "60.000 - 350.000",
				period: "VND/ngày hoặc tuần",
				description: "Khách du lịch, công tác, người mới trải nghiệm",
				features: [
					"Gói ngày: 60.000 VND (~650km)",
					"Gói tuần: 350.000 VND/7 ngày",
					"Miễn phí 3 lần đổi pin/ngày",
					"Không cần hợp đồng dài hạn",
					"Thanh toán linh hoạt qua app",
					"Phù hợp: Du lịch, công tác ngắn ngày",
				],
				cta: "Chọn gói này",
				cardClass: "card--advanced"
			},
];


// --- Main Page Component ---
// Component chính của trang
export function PolicesPricingFAQ() {
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
								<Button size="lg" className="w-full">
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
