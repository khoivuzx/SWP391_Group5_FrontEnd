
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
        nameVi: "Gói Theo Năng Lượng",
        price: 0,
        period: "VND/tháng",
        description: "Chỉ trả tiền cho năng lượng bạn thực sự sử dụng.",
        features: [
          "Phí thuê tháng: 0 VND",
          "Phí đổi pin: 2.500 VND / %SOC sử dụng", // Thay đổi từ km sang %SOC
          "Đảm bảo SOH (sức khỏe pin) > 85%", // Thêm chỉ số SOH
          "Phí thiết lập ban đầu",
          "Lý tưởng cho người đi ít, không cố định",
        ],
        cta: "Chọn gói này",
        cardClass: "card--basic"
    },
    {
        nameVi: "Gói Tối Ưu",
        price: 399000,
        period: "VND/tháng",
        description: "Cân bằng chi phí và chất lượng pin cho nhu cầu hàng ngày.",
        features: [
          "Bao gồm 200% SOC/tháng (~2 lần đổi đầy)", // Thay đổi sang SOC
          "Phí vượt mức: 2.000 VND / %SOC", // Thêm phí vượt mức
          "Đảm bảo SOH (sức khỏe pin) > 90%", // SOH cao hơn
          "Phí thiết lập ưu đãi",
          "Phù hợp cho người đi làm, di chuyển đều đặn",
        ],
        cta: "Chọn gói này",
        highlighted: true,
        cardClass: "card--standard"
    },
    {
        nameVi: "Gói Cao Cấp",
        price: 650000,
        period: "VND/tháng",
        description: "Năng lượng không giới hạn và pin chất lượng tốt nhất.",
        features: [
          "Năng lượng đổi pin: Không giới hạn", // Thay đổi
          "Đảm bảo SOH (sức khỏe pin) > 95%", // SOH cao nhất
          "Ưu tiên tại trạm và các dịch vụ đặc biệt",
          "Miễn phí thiết lập khi cam kết dài hạn",
          "Dành cho tài xế công nghệ, người đi rất nhiều",
        ],
        cta: "Chọn gói này",
        cardClass: "card--optimal"
    },
    {
        nameVi: "Gói Trải Nghiệm",
        price: "70.000",
        period: "VND / lần đổi pin đầy",
        description: "Lựa chọn hoàn hảo cho du khách hoặc dùng thử dịch vụ.",
        features: [
          "Thanh toán một lần cho một pin đầy (100% SOC)", // Thay đổi
          "Không cần hợp đồng hay cam kết",
          "Đảm bảo SOH (sức khỏe pin) > 85%",
          "Trải nghiệm nhanh chóng và tiện lợi",
          "Phù hợp cho khách du lịch, công tác ngắn ngày",
        ],
        cta: "Chọn gói này",
        cardClass: "card--advanced"
    },
];


// --- Main Page Component ---
// Component chính của trang
export function PolicesPricingFAQ({ onLoginClick, user }) {
	// Kiểm tra đăng nhập qua user (truyền từ App.jsx)
	const isLoggedIn = !!(user && user.fullName);
	// Xử lý khi nhấn nút chọn gói
	const handleChoosePlan = () => {
		if (!isLoggedIn && onLoginClick) {
			onLoginClick();
		} else {
			// TODO: Thực hiện logic chọn gói cho user đã đăng nhập
			alert('Bạn đã đăng nhập, thực hiện chọn gói!');
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
								<Button size="lg" className="w-full" onClick={handleChoosePlan}>
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
