import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import API_BASE_URL from "../../config"; // ví dụ: https://442a6c8156af.ngrok-free.app

export default function UserInfo() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [profile, setProfile] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Lấy token JWT từ localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  useEffect(() => {
    let alive = true;

    if (!token) {
      setLoading(false);
      setErr(t('user.notLoggedIn'));
      return;
    }

    async function loadProfile() {
      try {
        setLoading(true);
        setErr("");

        const url = `${API_BASE_URL}/webAPI/api/secure/getProfile`;
        console.log("→ Fetch URL:", url);

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        const ct = res.headers.get("content-type") || "";
        const raw = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}\n${raw.slice(0, 300)}`);
        }
        if (!ct.includes("application/json")) {
          throw new Error(`Expected JSON but got: ${ct}\n${raw.slice(0, 300)}`);
        }

        const data = JSON.parse(raw);
        if (!alive) return;

        setProfile(data);
        if (data?.vehicles?.length) {
          setSelectedVehicleId(data.vehicles[0].Vehicle_ID);
        }
      } catch (e) {
        setErr(e.message || t('user.cannotLoadProfile'));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [token]);

  const vehicles = useMemo(() => profile?.vehicles || [], [profile]);
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.Vehicle_ID === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );

  // ✅ Hàm xử lý URL avatar (sửa chuẩn)
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return "https://via.placeholder.com/96x96.png?text=Avatar";

    // Nếu avatar đã là URL đầy đủ (http hoặc https)
    if (avatarPath.startsWith("http")) return avatarPath;

    // Nếu đường dẫn chứa '\', đổi thành '/'
    const normalized = avatarPath.replace(/\\/g, "/");

    // Đảm bảo không bị trùng API_BASE_URL
    if (normalized.startsWith("/")) {
      return `${API_BASE_URL}${normalized}`;
    } else {
      return `${API_BASE_URL}/${normalized}`;
    }
  };

  if (loading) return <div style={{ padding: 24 }}>{t('user.loadingProfile')}</div>;
  if (err)
    return (
      <div style={{ padding: 24, color: "red" }}>
        <h3>{t('user.errorTitle')}</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{err}</pre>
      </div>
    );
  if (!profile) return <div style={{ padding: 24 }}>{t('user.noData')}</div>;

  const { user, package: pkg } = profile;

  return (
    <div style={{ padding: "32px 20px", maxWidth: 960, margin: "0 auto" }}>
  <h1 style={{ marginBottom: 16 }}>{t('user.title')}</h1>

      {/* USER */}
      <div style={card}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <img
            src={getAvatarUrl(user?.avatarUrl)}
            alt="avatar"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #e5e7eb",
            }}
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/96x96.png?text=No+Image";
            }}
          />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {user?.fullName}
            </div>
            <div style={{ color: "#374151", marginTop: 4 }}>{user?.email}</div>
            <div style={{ color: "#374151", marginTop: 2 }}>{user?.phone}</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
              Vai trò: <b>{user?.role}</b> • Trạng thái: <b>{user?.status}</b>
            </div>
          </div>
        </div>
      </div>

      {/* PACKAGE */}
      <div style={card}>
        <h2 style={{ margin: 0 }}>{t('user.currentPackage')}</h2>
        {pkg ? (
          <div style={{ marginTop: 10 }}>
            <div>
              {t('user.package.name')}: <b>{pkg.packageName}</b>
            </div>
            <div>
              {t('user.package.validity')}: {pkg.startDate} → {pkg.endDate}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, color: "#6b7280" }}>
            {t('user.package.none')}
          </div>
        )}
      </div>

      {/* VEHICLES */}
      <div style={card}>
  <h2 style={{ marginTop: 0 }}>{t('user.yourVehicles')}</h2>

        {vehicles.length === 0 ? (
          <div style={{ color: "#6b7280" }}>{t('user.noVehiclesLinked')}</div>
        ) : (
          <>
            <label htmlFor="vehicleSelect" style={{ fontSize: 14 }}>
              {t('user.selectVehicle')}
            </label>
            <select
              id="vehicleSelect"
              value={selectedVehicleId || ""}
              onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
              style={select}
            >
              {vehicles.map((v) => (
                <option key={v.Vehicle_ID} value={v.Vehicle_ID}>
                  {v.Model_Name} • {v.License_Plate}
                </option>
              ))}
            </select>

            {selectedVehicle && (
              <div style={kv}>
                <div style={kvRow}>
                  <span style={kvKey}>{t('user.vehicle.model')}:</span>
                  <span style={kvVal}>{selectedVehicle.Model_Name}</span>
                </div>
                <div style={kvRow}>
                  <span style={kvKey}>{t('user.vehicle.plate')}:</span>
                  <span style={kvVal}>{selectedVehicle.License_Plate}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 🎨 CSS inline
const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
};
const select = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  fontSize: 14,
};
const kv = {
  marginTop: 14,
  borderTop: "1px dashed #e5e7eb",
  paddingTop: 12,
};
const kvRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "6px 0",
};
const kvKey = { color: "#6b7280" };
const kvVal = { fontWeight: 600 };
