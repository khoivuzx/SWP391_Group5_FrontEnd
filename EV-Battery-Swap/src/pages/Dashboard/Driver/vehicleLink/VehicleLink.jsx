import React, { useState, useMemo } from "react";
import "./VehicleLink.css";
import API_BASE_URL from "../../../../config";

export default function VehicleLink() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rawText, setRawText] = useState("");
  const [suggests, setSuggests] = useState(null);
  const [acceptedModels, setAcceptedModels] = useState([]);

  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [ownerNoMark, setOwnerNoMark] = useState("");
  const [model, setModel] = useState("");

  const jwt =
    localStorage.getItem("authToken") || localStorage.getItem("jwt_token");

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
    setPreview(selected ? URL.createObjectURL(selected) : "");
    setRawText("");
    setSuggests(null);
    setAcceptedModels([]);
    setVin("");
    setLicensePlate("");
    setOwnerNoMark("");
    setModel("");
  };

  const handleOCR = async (e) => {
    e.preventDefault();
    if (!file) return alert("Vui lòng chọn ảnh cà vẹt!");

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
      if (!res.ok || data.status === "error")
        throw new Error(data?.message || "OCR thất bại");

      const s = data?.data?.suggests || {};
      const hints = data?.data?.hints || {};
      setRawText(data?.data?.rawText || "");
      setSuggests(s);
      setAcceptedModels(hints?.acceptedModels || []);
      setVin(s?.vin || "");
      setLicensePlate(s?.licensePlate || "");
      setOwnerNoMark(s?.ownerNoMark || "");
      setModel(s?.model || "");
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi OCR!");
    } finally {
      setLoadingOCR(false);
    }
  };

  const canSave = useMemo(() => {
    if (!vin || !licensePlate || !model) return false;
    const vinOk = /^[A-HJ-NPR-Z0-9]{17}$/.test(vin.trim().toUpperCase());
    const plateOk = /^[0-9]{2}[A-Z]{1,2}[0-9]{1}-[0-9]{4,6}$/.test(
      licensePlate.trim().toUpperCase()
    );
    return vinOk && plateOk;
  }, [vin, licensePlate, model]);

  const handleSave = async () => {
    if (!canSave) return alert("Vui lòng kiểm tra lại VIN / Biển số / Model!");
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/vehicleConfirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          vin: vin?.trim(),
          licensePlate: licensePlate?.trim(),
          ownerNoMark: ownerNoMark?.trim() || null,
          model: model?.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error")
        throw new Error(data?.message || "Lưu thất bại");

      alert("✅ Liên kết xe thành công!");
      // window.location.href = "/profile";
    } catch (err) {
      console.error(err);
      alert(err.message || "Có lỗi xảy ra khi lưu!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vehicle-link-center">
      <div className="vehicle-link-page">
        <h2>🚗 Liên kết xe của bạn</h2>

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

        {rawText && (
          <>
            <div className="ocr-result">
              <h4>Kết quả OCR (Raw Text)</h4>
              <pre>{rawText}</pre>
            </div>

            <div className="vehicle-form">
              <h4>Chỉnh thông tin trước khi lưu</h4>

              <div className="field">
                <label>VIN (17 ký tự):</label>
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="VD: LJHZZZ1C0ABCDEF12"
                />
              </div>

              <div className="field">
                <label>Biển số (xxA1-12345):</label>
                <input
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="VD: 59X3-40351"
                />
                <small>* Nếu OCR ra 59X340351 hãy sửa thành 59X3-40351</small>
              </div>

              <div className="field">
                <label>Tên chủ xe (không dấu) – tuỳ chọn:</label>
                <input
                  value={ownerNoMark}
                  onChange={(e) => setOwnerNoMark(e.target.value)}
                  placeholder="VD: Bui Tri Duc"
                />
              </div>

              <div className="field">
                <label>Model:</label>
                {acceptedModels?.length ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="">-- Chọn model --</option>
                    {acceptedModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Nhập model"
                  />
                )}
              </div>

              <button
                onClick={handleSave}
                className="upload-btn"
                disabled={!canSave || saving}
              >
                {saving ? "Đang lưu..." : "Lưu (Save)"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
