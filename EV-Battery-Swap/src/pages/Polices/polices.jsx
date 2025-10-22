import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./polices.css";
import API_BASE_URL from "../../config"; // đường dẫn gốc BE

// ===================== SLIDE WORDS =====================
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
                <span className="word" key={idx}>
                  {word}
                </span>
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
  return (
    <>
      <PolicesHeader />
      <PolicesPricingFAQ onLoginClick={onLoginClick} user={user} />
    </>
  );
}

// --- SVG Icon ---
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

// --- Button ---
const Button = ({
  size = "md",
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const sizeClass = `btn--${size}`;
  const variantClass = `btn--${variant}`;
  return (
    <button className={`btn ${sizeClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
// ===================== MAIN: Lấy dữ liệu gói từ BE =====================
export function PolicesPricingFAQ({ onLoginClick, user }) {
  const isLoggedIn = !!(user && user.fullName);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState([]);
  const [error, setError] = useState("");

  const cardClassByName = {
    Eco: "card--basic",
    Basic: "card--standard",
    Standard: "card--optimal",
    Premium: "card--advanced",
  };
  const isHighlighted = (name) => name === "Basic";

  // Lấy dữ liệu gói pin: ưu tiên API, fallback sang dữ liệu tĩnh nếu lỗi
  useEffect(() => {
    let abort = false;
    async function fetchPackages() {
      setLoading(true);
      setError("");
      try {
        const url = `${API_BASE_URL}/webAPI/api/getpackages`;
        const res = await fetch(url, {
          method: "GET",
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (abort) return;
        if (json?.status === "success" && Array.isArray(json?.data)) {
          const mapped = json.data.map((pkg) => ({
            packageId: pkg.packageId,
            nameVi: pkg.name,
            price: pkg.price,
            period: "VND/tháng",
            description: pkg.description,
            features: [
              `Nhận pin trong khoảng SoH ${pkg.minSoH}–${pkg.maxSoH}%`,
              `Pin trả ≥${pkg.requiredSoH}% thì miễn phí`,
              `Yêu cầu SoH tối thiểu: ${pkg.requiredSoH}%`,
              "Phù hợp cho nhu cầu di chuyển đa dạng",
            ],
            cta: `Chọn gói ${pkg.name}`,
            highlighted: isHighlighted(pkg.name),
            cardClass: cardClassByName[pkg.name] || "card--basic",
          }));
          setTiers(mapped);
        } else {
          throw new Error("Payload không hợp lệ");
        }
      } catch (e) {
        // Nếu lỗi API, fallback sang dữ liệu tĩnh
        setTiers(batteryPackages);
        setError("");
      } finally {
        if (!abort) setLoading(false);
      }
    }
    fetchPackages();
    return () => { abort = true; };
  }, []);

  // ======== Bổ sung hàm lấy userId ========
  const getUserIdFE = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      if (u?.id) return String(u.id);
    } catch {}
    return "";
  };

  // ======== MUA GÓI (THANH TOÁN VNPay) ========
  const handleChoosePlan = (tier) => {
    if (!isLoggedIn && onLoginClick) {
      onLoginClick();
      return;
    }

    const userId = user?.userId || user?.id || getUserIdFE();
    const packageId = tier?.packageId;
    const amount = tier?.price;

    if (!userId || !packageId || typeof amount !== "number") {
      setMessage("Không xác định được thông tin người dùng hoặc gói pin.");
      return;
    }
// API thanh toán từ BE
    const params = new URLSearchParams({
      userId: String(userId),
      amount: String(amount),
      orderType: "buyPackage",
      packageId: String(packageId),
    });

    const payUrl = `${API_BASE_URL}/webAPI/api/payment?${params.toString()}`;
    console.log("Redirecting to:", payUrl);
    window.open(payUrl, "_blank", "noopener,noreferrer"); // mở VNPay ở tab mới
  };

  // ===================== RENDER UI =====================
return (
  <>
    <div className="polices-container">
      <header className="page-header">
        <div className="header-icon-wrapper">
          <svg className="header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="header-title">Gói cước dịch vụ đổi pin</h1>
        <p className="header-subtitle">
          Chọn gói cước phù hợp với nhu cầu di chuyển của bạn. Tất cả các gói đều có thể thay đổi bất kỳ lúc nào. Không có chi phí ẩn.
        </p>
      </header>

      <main className="pricing-section">
        {message && (
          <div className="api-message" style={{
            marginBottom: 16,
            color: message.includes("thành công") ? "green" : "red",
          }}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="pricing-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pricing-card card--basic">
                <div className="card-content">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" />
                  <div className="card-price-wrapper">
                    <div className="skeleton skeleton-price" />
                  </div>
                  <ul className="card-features">
                    {[1, 2, 3, 4].map((j) => (
                      <li key={j} className="feature-item">
                        <span className="skeleton skeleton-line" />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-footer">
                  <Button size="lg" className="w-full" disabled>Đang tải…</Button>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="api-message" style={{ color: "red" }}>{error}</div>
        ) : (
          <div className="pricing-grid">
            {tiers.map((tier) => (
              <div key={tier.packageId} className={`pricing-card ${tier.cardClass}`}>
                {tier.highlighted && <div className="highlight-badge">Phổ biến nhất</div>}

                <div className="card-content">
                  <h3 className="card-title">{tier.nameVi}</h3>
<p className="card-description">{tier.description}</p>

                  <div className="card-price-wrapper">
                    {typeof tier.price === "number" && tier.price > 0 ? (
                      <>
                        <div className="card-price">
                          {tier.price.toLocaleString("vi-VN")}
                        </div>
                        <div className="card-period">{tier.period}</div>
                      </>
                    ) : (
                      <div className="card-price-special">
                        {tier.price === 0 ? "Miễn Phí" : tier.price}
                      </div>
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
        )}
      </main>
    </div>
    {/* ====== GOGORO POLICY MODERN DESIGN BÊN DƯỚI ====== */}
    <GogoroPolicyModern />
  </>
);
}

export function GogoroPolicyModern() {
  const [tab, setTab] = React.useState(0);
  const data = tabDataGogoro[tab];
  return (
    <div className="gogoro-policy-modern polices-container" style={{ background: "#fff", borderRadius: "16px", marginTop: "32px", padding: "32px 24px" }}>
      <h1 style={{ textAlign: "center", fontSize: "2.5rem", fontWeight: 600, color: "#3d9a3f", marginBottom: "24px" }}>Chính sách thuê pin Gogoro</h1>
      <div className="gogoro-tabs" style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        {tabDataGogoro.map((t, idx) => (
          <button
            key={t.label}
            className={"gogoro-tab" + (tab === idx ? " active" : "")}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.25rem",
              fontWeight: tab === idx ? 700 : 400,
              color: tab === idx ? "#02d306" : "#7c8c8f",
              borderBottom: tab === idx ? "3px solid #02d306" : "3px solid #eee",
              padding: "8px 32px",
              cursor: "pointer"
            }}
            onClick={() => setTab(idx)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="gogoro-policy-content" style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
        <div className="gogoro-policy-left" style={{ flex: 1, minWidth: 320, background: "#f7fafc", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#374151", fontWeight: 600, marginBottom: "16px" }}>{data.leftTitle}</h2>
          <div style={{ fontSize: "1.1rem", color: "#374151" }}>{renderListGogoro(data.left)}</div>
        </div>
        <div className="gogoro-policy-right" style={{ flex: 1, minWidth: 320, background: "#f7fafc", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#374151", fontWeight: 600, marginBottom: "16px" }}>{data.rightTitle}</h2>
          <div style={{ color: "#3d9a3f", fontSize: "1rem", marginBottom: "12px" }}>{data.rightNote}</div>
          {data.plans.map((plan, idx) => (
            <div key={plan.name} style={{ marginBottom: "24px", borderBottom: "1px solid #e5e7eb", paddingBottom: "16px" }}>
              <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "#111827", marginBottom: "8px" }}>{plan.name}</div>
              <ul style={{ marginLeft: "16px", marginBottom: "8px" }}>
                {plan.price.map((p, i) => (
                  <li key={i} style={{ fontSize: "1rem", color: "#374151" }}>{p.pin} Pin: {p.value.toLocaleString()} VNĐ/tháng</li>
                ))}
              </ul>
              <div style={{ background: "#fff", borderRadius: "8px", padding: "8px 12px", color: "#374151", fontSize: "0.95rem" }}>{plan.note}</div>
            </div>
          ))}
          <div style={{ color: "#374151", fontSize: "0.95rem", marginTop: "8px" }}>Giá đã bao gồm VAT</div>
        </div>
      </div>
    </div>
  );
}

// ===================== GOGORO POLICY MODERN DESIGN =====================
const tabDataGogoro = [
  {
    label: "Chính sách thuê Pin",
    leftTitle: "Áp dụng cho các dòng xe Gogoro Viva, Gogoro S2, Gogoro CrossOver S, v.v.",
    left: [
      "Đặt cọc pin: 1.200.000 VNĐ/pin",
      "Khách hàng sẽ được hoàn trả khoản cọc khi thanh lý hợp đồng thuê pin.",
      "Phí chuyển đổi gói cước: Không áp dụng.",
      "Thời hạn hợp đồng thuê: Vô thời hạn đến khi khách hàng hết nhu cầu hoặc hủy xe.",
      "Thời gian & hình thức thanh toán:",
      [
        "Chu kỳ tính cước: Tròn tháng, tính từ ngày đầu tiên của tháng tới ngày cuối cùng của tháng.",
        "Phí thuê bao pin được thu trước ngày 01 của tháng. Khách hàng có thể đóng 1 tháng hoặc nhiều tháng một lúc.",
        "Lịch sử thanh toán: Thanh toán tại đại lý/ứng dụng Gogoro."
      ]
    ],
    rightTitle: "Phí thuê pin hàng tháng",
    rightNote: "Khách hàng có nhu cầu chuyển đổi gói thuê pin tháng vui lòng liên hệ Hotline 1900 23 23 89 hoặc đại lý Gogoro.",
    plans: [
      {
        name: "GÓI TIÊU CHUẨN - TỪ 220.000 VNĐ/THÁNG",
        price: [
          { pin: 1, value: 220000 },
          { pin: 2, value: 350000 }
        ],
        note: "Không giới hạn quãng đường đi. Một số dòng xe chỉ áp dụng gói Tiêu chuẩn 2 pin."
      },
      {
        name: "GÓI SIÊU TIẾT KIỆM - TỪ 149.000 VNĐ/THÁNG",
        price: [
          { pin: 1, value: 149000 },
          { pin: 2, value: 299000 }
        ],
        note: "Giới hạn đi không quá 300 km/tháng. Nếu vượt quá sẽ tính giá theo gói Tiêu chuẩn."
      }
    ]
  },
  {
    label: "Quy định về pin",
    leftTitle: "Quy định về pin",
    left: [
      {
        section: "Quy định chung",
        items: [
          "Để nhận pin đảm bảo, Quý khách lưu ý chỉ nhận pin từ nhân viên tại điểm đổi pin và/hoặc từ nhân viên vận hành của Gogoro khi có yêu cầu cứu hộ pin trên đường.",
          "Quý khách chỉ nhận pin hoạt động tốt, nguyên vẹn, không móp, méo, hỏng hóc, có dấu hiệu cạy mở hoặc xuất hiện các dấu hiệu bất thường trên vỏ pin."
        ]
      },
      {
        section: "Điều kiện đổi/trả pin không mất phí đền bù",
        items: [
          "Pin phải đầy đủ phụ kiện, đúng chủng loại của hãng.",
          "Pin không có chỗ nào cháy sùi có thể quan sát bằng mắt thường.",
          "Pin không có chỗ nào biến dạng, khe hở giữa các thành phần nhỏ hơn 01 mm, có thể quan sát bằng mắt thường.",
          "Pin không có chỗ nào móp, méo có thể dễ dàng quan sát bằng mắt thường.",
          "Pin không có chỗ nào có vết nứt, vỡ có thể dễ dàng quan sát bằng mắt thường.",
          "Pin không có chỗ nào rỉ, sét, ố do bị ngấm nước hoặc tiếp xúc với hóa chất.",
          "Pin không có vết xước nào có độ sâu trên 01 mm.",
          "Khách hàng tuân thủ quy định về sử dụng và bảo quản pin mà Gogoro đã ban hành."
        ]
      }
    ],
    rightTitle: "",
    rightNote: "",
    plans: []
  }
];

function renderListGogoro(list) {
  if (!list) return null;
  // Nếu là mảng section, render section title và items
  if (Array.isArray(list) && list[0] && list[0].section) {
    return (
      <div>
        {list.map((section, idx) => (
          <div key={idx} style={{ marginBottom: "24px" }}>
            <div style={{ fontWeight: 600, fontSize: "1.25rem", color: "#374151", marginBottom: "8px" }}>{section.section}</div>
            <ul style={{ marginLeft: "16px" }}>
              {section.items.map((item, i) => (
                <li key={i} style={{ fontSize: "1rem", color: "#374151" }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }
  // Mặc định render như cũ
  return (
    <ul>
      {list.map((item, idx) =>
        Array.isArray(item) ? (
          <ul key={idx} style={{ marginLeft: 18 }}>{renderListGogoro(item)}</ul>
        ) : (
          <li key={idx}>{item}</li>
        )
      )}
    </ul>
  );
}