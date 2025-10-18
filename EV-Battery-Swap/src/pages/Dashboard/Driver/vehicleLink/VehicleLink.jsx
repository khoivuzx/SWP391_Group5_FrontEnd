
import React, { useState } from "react";
import API_BASE_URL from '../../../../config';

export default function VehicleLink() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Lấy JWT từ localStorage (sau khi login)
  const jwt = localStorage.getItem("authToken") || localStorage.getItem("jwt_token");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setPreview(selectedFile ? URL.createObjectURL(selectedFile) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Vui lòng chọn ảnh cà vẹt!");

    setLoading(true);
    const formData = new FormData();
    formData.append("carDoc", file);

    try {
      const res = await fetch(`${API_BASE_URL}/webAPI/api/secure/linkVehicle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi gửi yêu cầu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
      <h2>🚗 Liên kết xe của bạn</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ margin: "10px 0" }}
        />
        {preview && (
          <div style={{ margin: "10px 0" }}>
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {loading ? "Đang xử lý..." : "Liên kết xe"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 20, textAlign: "left" }}>
          <h4>Kết quả:</h4>
          <pre
            style={{
              background: "#f6f6f6",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
