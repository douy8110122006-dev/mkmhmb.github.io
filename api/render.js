import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Chỉ hỗ trợ phương thức POST",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Chưa cấu hình GEMINI_API_KEY trên Vercel",
      });
    }

    const { imageBase64, mimeType, prompt } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({
        error: "Thiếu imageBase64",
      });
    }

    if (!mimeType) {
      return res.status(400).json({
        error: "Thiếu mimeType",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        error: "Thiếu prompt",
      });
    }

    const finalPrompt = `
Bạn là AI render kiến trúc chuyên nghiệp.

Hãy chỉnh ảnh công trình người dùng gửi thành ảnh render kiến trúc chân thực.

Yêu cầu bắt buộc:
- Giữ nguyên phối cảnh ảnh gốc.
- Giữ nguyên hình khối chính.
- Không tự ý đổi số tầng.
- Không tự ý thêm công trình lớn khác.
- Cải thiện vật liệu, mặt tiền, ánh sáng, cây xanh, bầu trời.
- Kết quả phải là ảnh render kiến trúc hoàn chỉnh.
- Bắt buộc trả về hình ảnh, không chỉ trả lời bằng chữ.

Yêu cầu người dùng:
${prompt}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: finalPrompt,
            },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const parts = response?.candidates?.[0]?.content?.parts || [];

    let imageResult = null;
    let resultMimeType = "image/png";
    let textResult = "";

    for (const part of parts) {
      if (part.text) {
        textResult += part.text;
      }

      if (part.inlineData?.data) {
        imageResult = part.inlineData.data;
        resultMimeType = part.inlineData.mimeType || "image/png";
      }
    }

    if (!imageResult) {
      return res.status(500).json({
        error: "Gemini không trả về ảnh. Hãy thử prompt khác hoặc ảnh khác.",
        text: textResult,
      });
    }

    return res.status(200).json({
      imageBase64: imageResult,
      mimeType: resultMimeType,
      text: textResult,
    });
  } catch (error) {
    console.error("GEMINI_ERROR:", error);

    return res.status(500).json({
      error: "Lỗi khi gọi Gemini API",
      detail: error?.message || String(error),
    });
  }
}
