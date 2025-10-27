// src/components/Booking/BookingModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../config';

export default function BookingModal({ open, onClose, stationName }) {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehLoading, setVehLoading] = useState(true);
  const [vehError, setVehError] = useState('');

  const [vehicleId, setVehicleId] = useState('');
  const [vehicleIdManual, setVehicleIdManual] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('booking-modal__backdrop')) {
      onClose && onClose();
    }
  };

  // Lấy list xe (để hiển thị Model_Name + License_Plate)
  useEffect(() => {
    if (!open) return;

    setVehLoading(true);
    setVehError('');
    setVehicles([]);
    setVehicleId('');
    setVehicleIdManual('');
    setSuccess(false);
    setResult(null);
    setError('');

    // lấy token (thử nhiều key để chắc)
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('jwt_token') ||
      '';

    const url = `${API_BASE_URL}/webAPI/api/secure/my-vehicles`;

    (async () => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'ngrok-skip-browser-warning': '1',
          },
          credentials: 'include',
        });

        const text = await res.text();
        let data = [];
        try { data = text ? JSON.parse(text) : []; } catch { data = []; }

        if (!res.ok) {
          throw new Error(
            (data && data.error) ||
            (data && data.message) ||
            `Tải danh sách xe thất bại (${res.status})`
          );
        }

        // Chuẩn hóa giống form cũ: dùng Vehicle_ID/Model_Name/License_Plate
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const normalized = arr.map(v => ({
          id: v.Vehicle_ID ?? v.vehicleId ?? v.id ?? v.vehicle_id,
          modelName: v.Model_Name ?? v.model_Name ?? v.modelName ?? v.model,
          licensePlate: v.License_Plate ?? v.license_Plate ?? v.licensePlate,
        })).filter(v => v.id != null);

        setVehicles(normalized);
        if (normalized.length === 1) setVehicleId(String(normalized[0].id));
      } catch (err) {
        setVehError(err?.message || 'Không tải được danh sách xe. Bạn có thể nhập Vehicle ID thủ công.');
      } finally {
        setVehLoading(false);
      }
    })();
  }, [open]);

  // Build option label "Model — Plate"
  const vehicleOptions = useMemo(() => {
    return vehicles.map(v => ({
      id: v.id,
      label: `${v.modelName || 'Model ?'} — ${v.licensePlate || 'Biển số ?'}`
    }));
  }, [vehicles]);

  const canSubmit = useMemo(() => {
    const hasVehicle = vehicles.length ? !!vehicleId : !!vehicleIdManual;
    return open && stationName && hasVehicle && date && time && !loading;
  }, [open, stationName, vehicles.length, vehicleId, vehicleIdManual, date, time, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setSuccess(false);
    setResult(null);
    setLoading(true);

    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('authToken') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('jwt_token') ||
      '';

    const vehicleIdFinal = vehicles.length ? parseInt(vehicleId) : parseInt(vehicleIdManual);
    if (!vehicleIdFinal || Number.isNaN(vehicleIdFinal)) {
      setLoading(false);
      setError('Vehicle ID không hợp lệ.');
      return;
    }

    try {
      const bookingTime = `${date}T${time}`;
      const payload = { stationName, vehicleId: vehicleIdFinal, bookingTime };

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': '1',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setSuccess(true);
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Lỗi đặt lịch.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="booking-modal__backdrop" onClick={handleBackdropClick} style={styles.backdrop}>
      <div className="booking-modal__content" style={styles.modal}>
        <div style={styles.header}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Đặt lịch đổi pin</div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Đóng">×</button>
        </div>

        <div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>
          Trạm: <b style={{ color: '#0f172a' }}>{stationName || '-'}</b>
        </div>

        {success ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: '#166534', fontWeight: 600, marginBottom: 8 }}>✅ Đặt lịch thành công!</div>
            {result && (
              <div style={styles.resultBox}>
                <div><b>Mã đặt lịch:</b> {result.bookingId}</div>
                <div><b>Vehicle ID:</b> {result.vehicleId}</div>
                <div><b>Loại pin:</b> {result.batteryType}</div>
                <div><b>Thời gian:</b> {result.bookingTime}</div>
                <div><b>Hết hạn:</b> {result.expiredTime}</div>
                {result.qrCode ? (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <img alt="QR" src={`data:image/png;base64,${result.qrCode}`} style={{ width: 164, height: 164 }} />
                  </div>
                ) : null}
              </div>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button onClick={onClose} style={styles.primaryBtn}>Đóng</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {error && <div style={styles.error}>{error}</div>}

            {vehLoading ? (
              <div style={{ fontSize: 14, color: '#64748b' }}>Đang tải xe liên kết…</div>
            ) : vehicles.length ? (
              <label style={styles.label}>
                Xe của bạn:
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  style={styles.input}
                >
                  <option value="">-- Chọn xe --</option>
                  {vehicleOptions.map(v => (
                    <option key={v.id} value={String(v.id)}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                {vehError ? <div style={styles.warn}>{vehError}</div> : null}
                <label style={styles.label}>
                  Nhập Vehicle ID:
                  <input
                    required
                    type="number"
                    value={vehicleIdManual}
                    onChange={(e) => setVehicleIdManual(e.target.value)}
                    placeholder="VD: 101"
                    style={styles.input}
                  />
                </label>
              </>
            )}

            <label style={styles.label}>
              Ngày đổi pin:
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
            </label>

            <label style={styles.label}>
              Giờ đổi pin:
              <input required type="time" value={time} onChange={(e) => setTime(e.target.value)} style={styles.input} />
            </label>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" onClick={onClose} style={styles.ghostBtn}>Hủy</button>
              <button disabled={!canSubmit} type="submit" style={styles.primaryBtn}>
                {loading ? 'Đang đặt…' : 'Đặt lịch'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
  },
  modal: {
    width: '100%', maxWidth: 520, background: '#fff', borderRadius: 16,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: 20,
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10, border: '1px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontSize: 22, lineHeight: '30px',
  },
  label: { display: 'grid', gap: 6, fontSize: 14, color: '#0f172a' },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid #e5e7eb', outline: 'none',
  },
  primaryBtn: {
    padding: '10px 14px', borderRadius: 10, border: 'none',
    background: '#1a7f37', color: '#fff', fontWeight: 700, cursor: 'pointer',
  },
  ghostBtn: {
    padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
    background: '#fff', color: '#0f172a', fontWeight: 600, cursor: 'pointer',
  },
  error: { background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, fontSize: 14 },
  warn: { background: '#fef9c3', color: '#854d0e', padding: 10, borderRadius: 8, fontSize: 14 },
  resultBox: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 10 },
};
