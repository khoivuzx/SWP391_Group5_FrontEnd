// src/pages/Dashboard/Staff/staff.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import "./staff.css";
import API_BASE_URL from "../../../config";
import DispatchPanel from "./Dispatch/DispatchPanel";

const tabs = [
  { label: "Tồn kho pin", value: "inventory" },
  { label: "Check In", value: "checkin" },
  { label: "Tạo Booking", value: "create" },
];

/* ========= MessageBox ========= */
function MessageBox({ open, title, children, onClose, tone = "info" }) {
  if (!open) return null;
  const ICON = { success: "✅", error: "⚠️", info: "ℹ️" }[tone] || "ℹ️";
  return (
    <div className="msgbox-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className={`msgbox ${tone}`} onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <div className="msgbox-header">
          <span className="msgbox-icon" aria-hidden>{ICON}</span>
          <h3 className="msgbox-title">{title}</h3>
        </div>
        <div className="msgbox-body">{children}</div>
        <div className="msgbox-actions">
          <button className="detail-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

/* ========= MOCKUP TRỤ (có Gán pin + Gỡ pin) ========= */
function PinStationMockup({ slots, title, onReload }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [avail, setAvail] = useState([]);
  const [showSelect, setShowSelect] = useState(false);

  // luôn hiển thị 30 vị trí (nếu thiếu thì pad placeholder)
  const gridSlots = useMemo(() => {
    const list = Array.isArray(slots) ? [...slots] : [];
    while (list.length < 30) {
      list.push({
        __placeholder: true,
        id: `EMPTY_FAKE_${list.length + 1}`,
        code: `EMPTY${list.length + 1}`,
        state: "Empty",
        condition: "-",
        soh: 0,
        chargingStationName: "-",
        batteryId: null,
      });
    }
    return list.slice(0, 30);
  }, [slots]);

  const selected = selectedIndex != null ? gridSlots[selectedIndex] : null;

  function colorOf(s) {
    if (!s || s.__placeholder || !s.batteryId) return "#e5e7eb"; // Empty/placeholder
    const st = String(s.state || "").toLowerCase();
    const cd = String(s.condition || "").toLowerCase();
    if (cd === "damage" || cd === "damaged") return "#000000";   // Damaged
    if (cd === "weak" || cd === "charging" || st === "charging") return "#ef4444"; // Weak/Charging
    if (st === "reserved" || st === "reversed") return "#fbbf24"; // Reserved
    if (st === "occupied" && cd === "good") return "#22c55e";     // Ready
    return "#d1d5db";
  }

  const [msg, setMsg] = useState({ open: false, title: '', body: '', tone: 'info' });

  async function openAddBattery() {
    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/available-batteries`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : [];

      const normalized = list.map((x) => ({
        id: x.batteryId ?? x.Battery_ID ?? x.id,
        serial: x.serialNumber ?? x.Serial_Number ?? x.serial,
        soh: x.soH ?? x.SoH ?? 0,
        resistance: x.resistance ?? x.Resistance ?? null,
        typeId: x.typeId ?? x.Type_ID ?? null,
      }));

      setAvail(normalized);
      setShowSelect(true);
    } catch (e) {
      setMsg({ open: true, title: 'Lỗi', body: "Không tải được danh sách pin khả dụng: " + (e?.message || e), tone: 'error' });
    }
  }

  async function assignBattery(batteryId) {
    try {
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/assignBatteryToSlot`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json;charset=UTF-8",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          slotId: Number(selected.slotId),
          batteryId: Number(batteryId),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
      setMsg({ open: true, title: 'Thành công', body: '✅ Gắn pin thành công!', tone: 'success' });
      setShowSelect(false);
      setSelectedIndex(null);
      onReload && onReload();
    } catch (e) {
      setMsg({ open: true, title: 'Lỗi', body: "❌ Gắn pin thất bại: " + (e?.message || e), tone: 'error' });
    }
  }

  // ====== (MỚI) Gỡ pin khỏi slot: gọi /api/secure/removeBattery ======
  async function removeBattery() {
    try {
      if (!selected?.slotId) return;
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/removeBattery`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: new URLSearchParams({ slotId: String(selected.slotId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      setMsg({ open: true, title: 'Thành công', body: '✅ Đã gỡ pin khỏi ô.', tone: 'success' });
      setSelectedIndex(null);
      onReload && onReload();
    } catch (e) {
      setMsg({ open: true, title: 'Lỗi', body: "❌ Không thể gỡ pin: " + (e?.message || e), tone: 'error' });
    }
  }

  return (
    <React.Fragment>
      <MessageBox open={msg.open} title={msg.title} tone={msg.tone} onClose={() => setMsg({ ...msg, open: false })}>
        {msg.body}
      </MessageBox>
      <div className="station-mockup-minimal">
        {title && <div className="station-mockup-minimal-header">{title}</div>}
        <div className="station-mockup-minimal-inner">
          <div className="station-mockup-minimal-grid">
            {gridSlots.map((s, i) => {
              const color = colorOf(s);
              return (
                <div
                  key={s.slotId || s.code || i}
                  className={
                    "station-mockup-minimal-battery" +
                    (selectedIndex === i ? " selected" : "") +
                    (!s.batteryId ? " empty" : "")
                  }
                  onClick={() => setSelectedIndex(i)}
                  title={s.code || s.slotId}
                  style={{ cursor: "pointer" }}
                >
                  <span
                    className="station-mockup-minimal-dot"
                    style={{
                      background: color,
                      border: `2.5px solid ${color}`,
                      boxShadow: !s.batteryId || color === "#000000" ? "none" : `0 0 14px 3px ${color}55`,
                      opacity: !s.batteryId ? 0.6 : 1,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay chọn slot */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(2,6,23,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="station-popup"
            style={{
              position: "relative",
              zIndex: 10000,
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 8px 32px rgba(25,118,210,.13)",
              padding: "18px 28px",
              minWidth: 280,
              maxWidth: "calc(100% - 40px)",
              textAlign: "left",
              color: "#222",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!selected.batteryId ? (
              <React.Fragment>
                <strong>{selected.code || `Slot #${selected.slotId || "-"}`}</strong> — <em>Ô trống</em>
                <p>Hiện tại chưa có pin trong ô này.</p>
                <div>Vị trí: <b>{selected.chargingStationName || "-"}</b></div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  {selected.slotId && !selected.__placeholder ? (
                    <button className="detail-btn" onClick={openAddBattery}>➕ Thêm pin</button>
                  ) : null}
                  <button className="btn-secondary" onClick={() => setSelectedIndex(null)}>Đóng</button>
                </div>
                {selected.__placeholder && (
                  <small className="hint">Ô này là placeholder (API không trả slot). Không thể gán pin.</small>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment>
                <strong>{selected.serial || selected.code || `Slot #${selected.slotId}`}</strong> — {selected.chargingSlotType || "—"}
                <div>Trạng thái: <b>{selected.state || "-"}</b></div>
                <div>Sức khỏe: <b>{Number(selected.soh || 0)}%</b></div>
                <div>Vị trí: <b>{selected.chargingStationName || "-"}</b></div>
                <div>Mã slot: <b>{selected.code || "-"}</b></div>
                <div>Sạc lần cuối: <b>{selected.lastUpdate || "-"}</b></div>
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  {/* (MỚI) Nút Gỡ pin */}
                  <button
                    className="detail-btn"
                    onClick={removeBattery}
                    disabled={
                      String(selected.state || "").toLowerCase() !== "occupied" ||
                      String(selected.door || "").toLowerCase() !== "closed" ||
                      !selected.batteryId
                    }
                    title="Gỡ pin khỏi ô này"
                  >
                    🧲 Gỡ pin
                  </button>
                  <button className="btn-secondary" onClick={() => setSelectedIndex(null)}>Đóng</button>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {/* Modal chọn pin rảnh */}
      {showSelect && selected && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSelect(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,.55)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              width: "min(520px, 92vw)",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 24px 80px rgba(2,6,23,.25)",
            }}
          >
            <h3>Chọn pin để gắn vào {selected?.code || `slot #${selected?.slotId}`}</h3>
            <ul style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
              {avail.length === 0 ? (
                <li>Không có pin khả dụng.</li>
              ) : (
                avail.map((b) => (
                  <li
                    key={b.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}
                  >
                    <span style={{ minWidth: 200 }}>
                      {b.serial || `Battery #${b.id}`} — SoH {Number(b.soh ?? 0).toFixed(1)}%
                    </span>
                    <button className="detail-btn" onClick={() => assignBattery(b.id)}>Gắn</button>
                  </li>
                ))
              )}
            </ul>
            <div style={{ textAlign: "right", marginTop: 8 }}>
              <button className="btn-secondary" onClick={() => setShowSelect(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

/* ========= TRANG CHÍNH ========= */
export default function StaffDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("inventory");
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  const role = (user?.role || "").toLowerCase();
  const isManager = role === "manager";

  if (tab === "dispatch") {
    if (!isManager) return <Navigate to="/dashboard/staff" replace />;
    return <DispatchPanel user={user} />;
  }

  // ====== State chung ======
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [slots, setSlots] = useState([]);

  // Booking
  const [stations, setStations] = useState([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsErr, setStationsErr] = useState(null);
  const [email, setEmail] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Modal trụ
  const [showStationModal, setShowStationModal] = useState(false);
  const [showStationModalLFP, setShowStationModalLFP] = useState(false);

  // Popup
  const [checkinPopup, setCheckinPopup] = useState(null);
  const [createPopup, setCreatePopup] = useState(null);

  // ====== Load slots ======
  const loadSlots = async () => {
    try {
      setLoading(true);
      setErr(null);
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/viewBatterySlotStatus`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Unexpected payload");

      const normalized = data.map((x, i) => {
        const firstDefined = (...vals) => vals.find((v) => v !== undefined && v !== null);
        return {
          slotId: firstDefined(x.Slot_ID, x.slot_ID, x.slotId, i + 1),
          code: firstDefined(x.Slot_Code, x.slot_Code, x.slotCode, `S${i + 1}`),
          state: String(firstDefined(x.State, x.state, "")).trim(),
          condition: String(firstDefined(x.Condition, x.condition, "")).trim(),
          door: String(firstDefined(x.Door_State, x.door_State, x.doorState, "")).trim(),
          batteryId: firstDefined(x.Battery_ID, x.battery_ID, x.batteryId, null),
          soh: firstDefined(x.BatterySoH, x.batterySoH, x.soh, 0),
          serial: firstDefined(x.BatterySerial, x.batterySerial, x.serial, null),
          stationId: firstDefined(x.Station_ID, x.station_ID, x.stationId, null),
          chargingStationId: firstDefined(x.ChargingStation_ID, x.chargingStation_ID, x.chargingStationId, null),
          chargingSlotType: firstDefined(x.ChargingSlotType, x.chargingSlotType, x.slot_Type, ""),
          chargingStationName: firstDefined(x.ChargingStationName, x.chargingStationName, "Station"),
          lastUpdate: firstDefined(x.Last_Update, x.last_Update, x.lastUpdate, ""),
          batteryTypeId: firstDefined(x.BatteryTypeId, x.batteryTypeId, x.Type_ID, x.type_ID, x.typeId, null),
          batteryChemistry: String(firstDefined(x.BatteryChemistry, x.batteryChemistry, x.Chemistry, "")).toLowerCase(),
        };
      });

      setSlots(normalized);
    } catch (e) {
      setErr(e.message || "Failed to load slots");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();

    // Load stations song song
    (async () => {
      try {
        setStationsLoading(true);
        setStationsErr(null);
        const token = localStorage.getItem("authToken") || "";
        const res = await fetch(`${API_BASE_URL}/webAPI/api/getstations`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const ct = res.headers.get("content-type") || "";
        let payload = {};
        if (ct.includes("application/json")) payload = await res.json().catch(() => ({}));
        else payload = { status: "error", message: await res.text() };

        if (!res.ok) throw new Error(payload.message || `HTTP ${res.status}`);
        if (payload.status !== "success") throw new Error(payload.message || "Không lấy được danh sách trạm");

        const list = Array.isArray(payload.data) ? payload.data : [];
        setStations(list);
        if (list.length && !selectedStation) {
          const firstName = list[0].Name ?? list[0].station_Name ?? list[0].Station_Name ?? list[0].name ?? "";
          setSelectedStation(firstName || "");
        }
      } catch (e) {
        setStationsErr(e.message || "Không tải được danh sách trạm");
        setStations([]);
      } finally {
        setStationsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ====== SUY LUẬN TRỤ (để nhóm slot vào modal và giữ được EMPTY/RESERVED/WEAK) ======
  const inferChemFromSlot = (s) => {
    const t = String(s.chargingSlotType || "").toLowerCase();
    if (t.includes("lfp")) return "lfp";
    if (t.includes("li")) return "li";

    const id = Number(s.chargingStationId || 0);
    if (id === 11) return "lfp";
    if (id === 12) return "li";
    if (id) return id % 2 === 0 ? "lfp" : "li";

    const bc = String(s.batteryChemistry || "").toLowerCase();
    if (bc.includes("lfp")) return "lfp";
    if (bc.includes("lithium") || bc === "li") return "li";
    if (s.batteryTypeId === 2) return "lfp";
    if (s.batteryTypeId === 1) return "li";
    return "unknown";
  };

  // ====== Helper chuẩn hoá chữ thường ======
  const norm = useMemo(() => (v) => String(v || "").trim().toLowerCase(), []);

  // ====== MẢNG HIỂN THỊ CHO MODAL (có Empty / Reserved / Charging(Weak) / Occupied) ======
  // ====== MẢNG HIỂN THỊ CHO MODAL (ổn định theo batteryTypeId khi có pin) ======
  const lithiumDisplaySlots = useMemo(() => {
    return slots.filter(s => {
      const chem = inferChemFromSlot(s);
      const hasBattery = !!s.batteryId;
      const norm = (v) => String(v || "").trim().toLowerCase();
      return (
        norm(s.door) === "closed" &&
        !!s.code &&
        ["occupied", "reserved", "reversed", "empty", "charging"].includes(norm(s.state)) &&
        (
          (hasBattery && Number(s.batteryTypeId) === 1) || // pin thực Li-ion
          (!hasBattery && chem === "li")                   // ô trống thuộc trụ Li-ion
        )
      );
    });
  }, [slots]);

  const lfpDisplaySlots = useMemo(() => {
    return slots.filter(s => {
      const chem = inferChemFromSlot(s);
      const hasBattery = !!s.batteryId;
      const norm = (v) => String(v || "").trim().toLowerCase();
      return (
        norm(s.door) === "closed" &&
        !!s.code &&
        ["occupied", "reserved", "reversed", "empty", "charging"].includes(norm(s.state)) &&
        (
          (hasBattery && Number(s.batteryTypeId) === 2) || // pin thực LFP
          (!hasBattery && chem === "lfp")                  // ô trống thuộc trụ LFP
        )
      );
    });
  }, [slots]);

  // ====== BIẾN ĐẾM CHUẨN DRIVER (khớp Driver: 10–9) ======
  const { liionReady, lfpReady, totalReady } = useMemo(() => {
    const eligible = slots.filter(s =>
      norm(s.state) === "occupied" &&
      norm(s.door) === "closed" &&
      !!s.batteryId &&
      norm(s.condition) !== "weak" &&
      !!s.code
    );
    return {
      liionReady: eligible.filter(s => Number(s.batteryTypeId) === 1).length,
      lfpReady:   eligible.filter(s => Number(s.batteryTypeId) === 2).length,
      totalReady: eligible.length
    };
  }, [slots, norm]);

  // ====== KPI ======
  const summary = useMemo(() => {
    let full = 0, charging = 0, maintenance = 0, reserved = 0;
    for (const s of slots) {
      const st = String(s.state || "").trim().toLowerCase();
      const cd = String(s.condition || "").trim().toLowerCase();
      const isReserved = st === "reserved" || st === "reversed";
      const isFull = st === "occupied" && cd === "good";
      const isCharging = st === "charging" || cd === "weak" || cd === "charging";
      const isMaintenance = cd === "damage" || cd === "damaged";
      if (isReserved) reserved++;
      else if (isMaintenance) maintenance++;
      else if (isCharging) charging++;
      else if (isFull) full++;
    }
    return { full, charging, maintenance, reserved };
  }, [slots]);

  const kpis = [
    { icon: "🟢", label: "Pin đầy", value: summary.full, sub: "Sẵn sàng sử dụng" },
    { icon: "🔌", label: "Đang sạc", value: summary.charging, sub: "Đang nạp điện / Weak" },
    { icon: "⚠️", label: "Bảo dưỡng", value: summary.maintenance, sub: "Damaged" },
    { icon: "🟡", label: "Đặt trước", value: summary.reserved, sub: "Reserved/Reversed" },
  ];

  // ====== Check-in ======
  const [bookingId, setBookingId] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const handleCheckIn = async (e) => {
    e.preventDefault();
    const id = bookingId.trim();
    if (!id) return;

    try {
      setCheckingIn(true);
      const token = localStorage.getItem("authToken") || "";
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "ngrok-skip-browser-warning": "1",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const body = new URLSearchParams({ bookingId: id });

      const res = await fetch(`${API_BASE_URL}/webAPI/api/checkin`, {
        method: "POST",
        credentials: "include",
        headers,
        body,
      });

      let data = {};
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) data = await res.json().catch(() => ({}));
      else data = { error: await res.text() };

      if (!res.ok || data.error) {
        setCheckinPopup({ title: "Check In thất bại", body: data.error || `HTTP ${res.status}` });
        return;
      }

      if (data.paymentUrl) {
        setCheckinPopup({
          title: "Cần thanh toán trước khi đổi pin",
          body: (
            <>
              <div>Mã thanh toán: <b>{data.txnRef || "—"}</b></div>
              <div>Số tiền: <b>{Number(data.fee || 0).toLocaleString("vi-VN")} đ</b></div>
              <div style={{ marginTop: 8 }}>
                <a href={data.paymentUrl} target="_blank" rel="noreferrer" className="detail-btn">Mở VNPay</a>
              </div>
            </>
          ),
        });
        return;
      }

      setCheckinPopup({ title: "Check In thành công", body: data.message || "Đã xác nhận check-in." });
    } catch (err) {
      setCheckinPopup({ title: "Lỗi kết nối", body: String(err?.message || err) });
    } finally {
      setCheckingIn(false);
    }
  };

  // ====== Tạo Booking ======
  const fetchVehiclesByEmail = async () => {
    const mail = email.trim();
    if (!mail) return;
    try {
      setLoadingVehicles(true);
      const token = localStorage.getItem("authToken") || "";
      const qs = new URLSearchParams({ email: mail, station: selectedStation || "" }).toString();
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/staffBooking?${qs}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      const vs = Array.isArray(data.vehicles) ? data.vehicles : [];
      setVehicles(vs);
      setSelectedVehicle(vs.length > 0 ? String(vs[0].vehicleId) : "");
      setCreatePopup({
        title: "Đã tải danh sách xe",
        body: vs.length ? `Tìm thấy ${vs.length} xe. Hãy chọn 1 xe để tạo booking.` : "Không có xe nào cho email này.",
      });
    } catch (e) {
      setVehicles([]);
      setSelectedVehicle("");
      setCreatePopup({ title: "Lỗi", body: e.message || "Không tải được xe" });
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleCreateBooking = async () => {
    const mail = email.trim();
    if (!mail || !selectedStation || !selectedVehicle) {
      setCreatePopup({ title: "Thiếu thông tin", body: "Vui lòng nhập Email, chọn Trạm và chọn Xe trước khi tạo booking." });
      return;
    }
    try {
      setCreatingBooking(true);
      const token = localStorage.getItem("authToken") || "";
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/staffBooking`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json;charset=UTF-8",
          "ngrok-skip-browser-warning": "1",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: mail,
          stationName: selectedStation,
          vehicleId: Number(selectedVehicle),
        }),
      });

      let data = {};
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) data = await res.json().catch(() => ({}));
      else data = { error: await res.text() };

      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);

      setCreatePopup({
        title: "Tạo booking thành công",
        body: (
          <div>
            <div>Booking ID: <b>{data.bookingId}</b></div>
            <div>Trạng thái: <b>{data.status}</b></div>
            <div>Hết hạn: <b>{data.expiredTime}</b></div>
            {data.qrCode && (
              <div style={{ marginTop: 8 }}>
                <img alt="QR" src={`data:image/png;base64,${data.qrCode}`} style={{ maxWidth: 180 }} />
              </div>
            )}
          </div>
        ),
      });
    } catch (e) {
      setCreatePopup({ title: "Tạo booking thất bại", body: e.message || "Không tạo được booking" });
    } finally {
      setCreatingBooking(false);
    }
  };

  return (
    <div className="staff-dashboard-wrap">
      {/* Panel ảnh 2 trụ */}
      <div className="staff-right-panel" style={{ display: "flex", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <img
            src="/ping.jpg"
            alt="Trụ Li-ion"
            className="staff-right-image"
            onClick={() => setShowStationModal(true)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Trụ Li-ion</div>
        </div>

        <div style={{ textAlign: "center" }}>
          <img
            src="/ping.jpg"
            alt="Trụ LFP"
            className="staff-right-image"
            onClick={() => setShowStationModalLFP(true)}
            style={{ cursor: "pointer" }}
          />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Trụ LFP</div>
        </div>
      </div>

      {/* Card dashboard */}
      <div className="staff-dashboard-card">
        <h2 className="staff-dashboard-title">Dashboard Nhân viên Trạm</h2>
        <div className="staff-dashboard-subtitle">Quản lý tồn kho pin và Check In</div>

        {/* Hiển thị số đếm chuẩn Driver */}
        <div style={{ marginTop: 6, fontSize: 14, color: "#334155" }}>
          <b>Chuẩn Driver (sẵn sàng đổi):</b> Li-ion: {liionReady} • LFP: {lfpReady} • Tổng: {totalReady}
        </div>

        {/* KPI */}
        <div className="staff-dashboard-summary">
          {kpis.map((c, i) => (
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
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={"staff-dashboard-tab-btn" + (activeTab === tab.value ? " active" : "")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Nội dung tab */}
        <div>
          {activeTab === "inventory" && (
            <div className="staff-inventory-section">
              <div className="staff-inventory-title">Tình trạng trụ</div>
              <div className="staff-inventory-desc">Nhấn vào ảnh trụ ở trên để xem sơ đồ ô.</div>
              {err && <div style={{ color: "#ef4444", marginTop: 8 }}>{err}</div>}
              {loading && <div style={{ marginTop: 8 }}>Đang tải dữ liệu…</div>}
            </div>
          )}

          {activeTab === "checkin" && (
            <div className="staff-transaction-section">
              <div className="staff-transaction-title">Check In</div>
              <div className="staff-transaction-desc">Nhập Booking ID của khách để tiến hành Check In.</div>
              <form onSubmit={handleCheckIn} className="checkin-form">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Nhập Booking ID"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  className="input"
                  style={{ maxWidth: 280, marginRight: 12 }}
                />
                <button type="submit" className="detail-btn" disabled={checkingIn || !bookingId.trim()}>
                  {checkingIn ? "Đang xử lý…" : "Check In"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "create" && (
            <div className="staff-transaction-section">
              <div className="staff-transaction-title">Tạo Booking</div>
              <div className="staff-transaction-desc">
                Nhập <b>Email</b> khách hàng, chọn <b>Trạm</b> & <b>Xe</b> để tạo booking.
              </div>

              {/* Email + lấy xe */}
              <div className="row">
                <label className="lbl">Email khách hàng</label>
                <div className="row-inline">
                  <input
                    type="email"
                    placeholder="vd: khach@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input grow"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={fetchVehiclesByEmail}
                    disabled={!email.trim() || loadingVehicles}
                    title="Tải xe theo email"
                  >
                    {loadingVehicles ? "Đang tải…" : "Lấy xe"}
                  </button>
                </div>
              </div>

              {/* Trạm */}
              <div className="row">
                <label className="lbl">Chọn trạm</label>
                <select className="input" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}>
                  {stationsLoading && <option>Đang tải trạm…</option>}
                  {!stationsLoading && stations.length === 0 && <option value="">Không có dữ liệu trạm</option>}
                  {!stationsLoading && stations.map((s) => {
                    const key = s.Station_ID ?? s.station_ID ?? s.id;
                    const label = s.Name ?? s.station_Name ?? s.Station_Name ?? s.name ?? `Station #${key ?? ""}`;
                    return <option key={key} value={label}>{label}</option>;
                  })}
                </select>
                {stationsErr && <small className="hint error">{stationsErr}</small>}
              </div>

              {/* Xe */}
              <div className="row">
                <label className="lbl">Chọn xe</label>
                <select className="input" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} disabled={vehicles.length === 0}>
                  {vehicles.length === 0 && <option value="">Chưa có xe — hãy “Lấy xe”</option>}
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      #{v.vehicleId} — {v.modelName || v.brand || "Xe"} ({v.batteryType || "—"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút tạo */}
              <div className="row">
                <button
                  type="button"
                  className="detail-btn"
                  onClick={handleCreateBooking}
                  disabled={creatingBooking || !email.trim() || !selectedStation || !selectedVehicle}
                >
                  {creatingBooking ? "Đang tạo…" : "Tạo Booking"}
                </button>
                <small className="hint">Hệ thống sẽ tự giữ pin phù hợp tại trạm trong 1 giờ.</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal trụ Li-ion */}
      {showStationModal && (
        <div className="station-modal-backdrop" onClick={() => setShowStationModal(false)}>
          <div className="station-modal" onClick={(e) => e.stopPropagation()}>
            {loading && <div>Đang tải dữ liệu…</div>}
            {err && <div style={{ color: "#ef4444" }}>{err}</div>}
            {!loading && <PinStationMockup slots={lithiumDisplaySlots} title="Trụ Li-ion" onReload={loadSlots} />}
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="detail-btn" onClick={() => setShowStationModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal trụ LFP */}
      {showStationModalLFP && (
        <div className="station-modal-backdrop" onClick={() => setShowStationModalLFP(false)}>
          <div className="station-modal" onClick={(e) => e.stopPropagation()}>
            {loading && <div>Đang tải dữ liệu…</div>}
            {err && <div style={{ color: "#ef4444" }}>{err}</div>}
            {!loading && <PinStationMockup slots={lfpDisplaySlots} title="Trụ LFP" onReload={loadSlots} />}
            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="detail-btn" onClick={() => setShowStationModalLFP(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Check In */}
      <MessageBox
        open={!!checkinPopup}
        title={checkinPopup?.title || ""}
        onClose={() => setCheckinPopup(null)}
        tone={
          checkinPopup?.title?.toLowerCase().includes("thất bại")
            ? "error"
            : checkinPopup?.title?.toLowerCase().includes("thành công")
            ? "success"
            : "info"
        }
      >
        <div className="msgbox-content">{checkinPopup?.body}</div>
      </MessageBox>

      {/* Popup Tạo Booking */}
      <MessageBox
        open={!!createPopup}
        title={createPopup?.title || ""}
        onClose={() => setCreatePopup(null)}
        tone={
          createPopup?.title?.toLowerCase().includes("thành công")
            ? "success"
            : createPopup?.title?.toLowerCase().includes("lỗi") ||
              createPopup?.title?.toLowerCase().includes("thất bại")
            ? "error"
            : "info"
        }
      >
        <div className="msgbox-content">{createPopup?.body}</div>
      </MessageBox>
    </div>
  );
}
