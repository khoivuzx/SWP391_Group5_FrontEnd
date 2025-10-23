
import React from "react";
import "./policesGogoro.css";

// ===================== GOGORO POLICY MODERN DESIGN =====================
export const tabDataGogoro = [
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

export function renderListGogoro(list) {
  if (!list) return null;
  // Nếu là mảng section, render section title và items
  if (Array.isArray(list) && list[0] && list[0].section) {
    return (
      <div>
        {list.map((section, idx) => (
          <div key={idx} className="gogoro-section-block">
            <div className="section-title">{section.section}</div>
            <ul>
              {section.items.map((item, i) => (
                <li key={i}>{item}</li>
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
          <ul key={idx} className="gogoro-nested-list">{renderListGogoro(item)}</ul>
        ) : (
          <li key={idx}>{item}</li>
        )
      )}
    </ul>
  );
}

export function GogoroPolicyModern() {
  const [tab, setTab] = React.useState(0);
  const data = tabDataGogoro[tab];
  return (
    <div className="gogoro-policy-modern polices-container">
      <h1>Chính sách thuê pin Gogoro</h1>
      <div className="gogoro-tabs">
        {tabDataGogoro.map((t, idx) => (
          <button
            key={t.label}
            className={"gogoro-tab" + (tab === idx ? " active" : "")}
            onClick={() => setTab(idx)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="gogoro-policy-content">
        <div className="gogoro-policy-left">
          <h2>{data.leftTitle}</h2>
          <div className="gogoro-left-list">{renderListGogoro(data.left)}</div>
        </div>
        <div className="gogoro-policy-right">
          <h2>{data.rightTitle}</h2>
          <div className="right-note">{data.rightNote}</div>
          {data.plans.map((plan, idx) => (
            <div key={plan.name} className="plan">
              <div className="plan-title">{plan.name}</div>
              <ul>
                {plan.price.map((p, i) => (
                  <li key={i}>{p.pin} Pin: {p.value.toLocaleString()} VNĐ/tháng</li>
                ))}
              </ul>
              <div className="plan-note">{plan.note}</div>
            </div>
          ))}
          <div className="vat">Giá đã bao gồm VAT</div>
        </div>
      </div>
    </div>
  );
}