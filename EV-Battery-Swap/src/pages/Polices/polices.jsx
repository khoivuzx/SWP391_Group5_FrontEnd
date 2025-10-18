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

export default function Polices() {
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
