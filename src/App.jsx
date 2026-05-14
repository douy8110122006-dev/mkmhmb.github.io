import { useState } from "react";

function handleImageChange(event) {
  const file = event.target.files[0];

  if (!file) return;

  const maxSizeMB = 2;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    setError(`Ảnh quá nặng. Vui lòng chọn ảnh dưới ${maxSizeMB} MB.`);
    setImageFile(null);
    setPreviewImage("");
    setResultImage("");
    return;
  }

  setImageFile(file);
  setPreviewImage(URL.createObjectURL(file));
  setResultImage("");
  setError("");
}
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [prompt, setPrompt] = useState(
    "Render lại công trình thành nhà phố hiện đại, ánh sáng ban ngày, vật liệu kính và bê tông sơn trắng, giữ nguyên hình khối và phối cảnh ảnh gốc."
  );
  const [resultImage, setResultImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(event) {
    const file = event.target.files[0];

    if (!file) return;

    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setResultImage("");
    setError("");
  }

  async function handleRender() {
    if (!imageFile) {
      setError("Vui lòng chọn ảnh công trình trước.");
      return;
    }

    if (!prompt.trim()) {
      setError("Vui lòng nhập mô tả render.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResultImage("");

      const imageBase64 = await fileToBase64(imageFile);

      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageFile.type,
          prompt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi render ảnh.");
      }

      const imageUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
      setResultImage(imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadImage() {
    if (!resultImage) return;

    const link = document.createElement("a");
    link.href = resultImage;
    link.download = "ai-render-cong-trinh.png";
    link.click();
  }

  return (
    <main className="page">
      <section className="hero">
        <h1>AI Render Hình Ảnh Công Trình</h1>
        <p>
          Upload ảnh thô của nhà hoặc công trình, nhập phong cách mong muốn,
          hệ thống sẽ dùng Gemini API để tạo ảnh render kiến trúc.
        </p>
      </section>

      <section className="card">
        <label className="label">1. Chọn ảnh công trình</label>

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {previewImage && (
          <div className="imageBox">
            <h3>Ảnh gốc</h3>
            <img src={previewImage} alt="Ảnh gốc công trình" />
          </div>
        )}

        <label className="label">2. Mô tả phong cách render</label>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={7}
          placeholder="Ví dụ: Render thành biệt thự hiện đại, vật liệu đá tự nhiên, kính lớn, sân vườn, ánh sáng hoàng hôn..."
        />

        <button onClick={handleRender} disabled={loading}>
          {loading ? "Đang render..." : "Render bằng AI"}
        </button>

        {error && <p className="error">{error}</p>}
      </section>

      {resultImage && (
        <section className="card">
          <div className="resultHeader">
            <h2>Kết quả render</h2>
            <button onClick={downloadImage}>Tải ảnh</button>
          </div>

          <div className="imageBox">
            <img src={resultImage} alt="Ảnh render AI" />
          </div>
        </section>
      )}
    </main>
  );
}
