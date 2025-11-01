// src/pages/.../VehicleLink.jsx
import React, { useMemo, useState } from "react";
import "./VehicleLink.css";
import API_BASE_URL from "../../../../config";

const GOGORO_MODELS = [
  "Gogoro SuperSport",
  "Gogoro 2 Delight",
  "Gogoro Viva Mix",
  "Gogoro CrossOver S",
  "Gogoro S2 ABS",
];

// ===== Helpers =====
const toNoMark = (s) => {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const normalizePlate = (raw) => {
  if (!raw) return "";
  const p = raw.toUpperCase().replace(/\s+/g, "").replace(/\./g, "");
  const m = p.match(/^([0-9]{2}[A-Z]{1,2}[0-9]{1})([0-9]{4,6})$/);
  return m ? `${m[1]}-${m[2]}` : p;
};

const isVinOk = (vin) =>
  /^[A-HJ-NPR-Z0-9]{17}$/.test(String(vin || "").toUpperCase());
const isPlateOk = (plate) =>
  /^[0-9]{2}[A-Z]{1,2}[0-9]{1}-[0-9]{4,6}$/.test(
    String(plate || "").toUpperCase()
  );

export default function VehicleLink() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loadingOCR, setLoadingOCR] = useState(false);
  const [saving, setSaving] = useState(false);

  // OCR results / options
  const [acceptedModels, setAcceptedModels] = useState(GOGORO_MODELS);

  // Form fields
  const [owner, setOwner] = useState(""); // luôn là KHÔNG DẤU để hiển thị
  const [ownerNoMark, setOwnerNoMark] = useState(""); // để gửi backend
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [model, setModel] = useState("");
  const [modelSupported, setModelSupported] = useState(null);

  const typeLabel = useMemo(() => {
    if (modelSupported === true) return "Gogoro";
    if (modelSupported === false) return "Khác";
    return model ? "Không rõ" : "-";
  }, [modelSupported, model]);

  const jwt =
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    "";

  // ========== Handlers ==========
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
    setOwner("");
    setOwnerNoMark("");
    setVin("");
    setLicensePlate("");
    setModel("");
    setModelSupported(null);
  };

  const handleOCR = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Vui lòng chọn ảnh cà vẹt!");
      return;
    }

    setLoadingOCR(true);
    try {
      const formData = new FormData();
      formData.append("carDoc", file);

      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/vehicleOcr`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        throw new Error(data?.message || "OCR thất bại");
      }

      const s = data?.data?.suggests || {};
      const hints = data?.data?.hints || {};
      setAcceptedModels(
        Array.isArray(hints?.acceptedModels)
          ? hints.acceptedModels
          : GOGORO_MODELS
      );

      // ✅ Tên chủ xe: luôn hiển thị bản không dấu
      const plainOwner = toNoMark(s?.ownerWithMarks || s?.owner || "");
      setOwner(plainOwner.toUpperCase());
      setOwnerNoMark(plainOwner);

      // VIN / plate
      setVin(s?.vin || "");
      setLicensePlate(normalizePlate(s?.licensePlate || ""));

      // Model
      const beModel = s?.model || "";
      if (beModel && acceptedModels.includes(beModel)) {
        setModel(beModel);
        setModelSupported(true);
      } else {
        setModel("");
        setModelSupported(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi OCR!");
    } finally {
      setLoadingOCR(false);
    }
  };

  const canSave = useMemo(() => {
    if (!vin || !licensePlate || !model) return false;
    return isVinOk(vin) && isPlateOk(licensePlate);
  }, [vin, licensePlate, model]);

  const handleOwnerChange = (val) => {
    const noMark = toNoMark(val);
    setOwner(noMark.toUpperCase());
    setOwnerNoMark(noMark);
  };

  const handlePlateChange = (val) => {
    setLicensePlate(normalizePlate(val));
  };

  const handleSave = async () => {
    if (!canSave) {
      alert("Vui lòng kiểm tra lại VIN / Biển số / Model!");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/webAPI/api/secure/vehicleConfirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            vin: vin?.trim(),
            licensePlate: licensePlate?.trim(),
            owner: ownerNoMark?.trim() || null, // gửi không dấu
            ownerNoMark: ownerNoMark?.trim() || null,
            model: model?.trim(),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        if (Array.isArray(data?.acceptedModels)) {
          setAcceptedModels(data.acceptedModels);
        }
        throw new Error(data?.message || "Lưu thất bại");
      }

      alert("✅ Liên kết xe thành công!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi lưu!");
    } finally {
      setSaving(false);
    }
  };

  // ========== UI ==========
  return (
    <div className="vehicle-link-center">
      <div className="vehicle-link-page">
        <h2>🚗 Liên kết xe của bạn</h2>

        {/* Upload & OCR */}
        <form onSubmit={handleOCR} className="vehicle-upload-form">
          <label className="upload-label">
            Chọn ảnh cà vẹt xe:
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="preview" />
            </div>
          )}

          <button
            type="submit"
            className="upload-btn"
            disabled={loadingOCR || !file}
          >
            {loadingOCR ? "Đang OCR..." : "Đọc ảnh (OCR)"}
          </button>
        </form>

        {/* Form */}
        {(vin || licensePlate || owner || model) && (
          <div className="vehicle-form">
            <h4>Thông tin xe (có thể chỉnh trước khi lưu)</h4>

            <div className="field">
              <label>Tên chủ xe (KHÔNG DẤU):</label>
              <input
                value={owner}
                onChange={(e) => handleOwnerChange(e.target.value)}
                placeholder="VD: LA THI MY NGHI"
              />
            </div>

            <div className="field">
              <label>Số khung (VIN) – 17 ký tự:</label>
              <input
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="VD: LJHZZZ1C0ABCDEF12"
              />
              {!isVinOk(vin) && vin && (
                <small className="warn">VIN chưa hợp lệ.</small>
              )}
            </div>

            <div className="field">
              <label>Biển số (xxA1-12345):</label>
              <input
                value={licensePlate}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="VD: 59X3-40351"
              />
              {!isPlateOk(licensePlate) && licensePlate && (
                <small className="warn">Biển số chưa đúng định dạng.</small>
              )}
            </div>

            <div className="field">
              <label>Loại xe:</label>
              <input value={typeLabel} readOnly />
            </div>

            <div className="field">
              <label>Mẫu xe (Model):</label>
              <select
                value={acceptedModels.includes(model) ? model : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setModel(v);
                  setModelSupported(v ? true : null);
                }}
              >
                <option value="">-- Chọn model Gogoro --</option>
                {acceptedModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSave}
              className="upload-btn"
              disabled={!canSave || saving}
            >
              {saving ? "Đang lưu..." : "Lưu (Save)"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
