import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Chỉ hỗ trợ phương thức POST"
    });
  }

  try {
    const { imageBase64, mimeType, prompt } = req.body;

    if (!imageBase64 || !mimeType || !prompt) {
      return res.status(400).json({
        error: "Thiếu ảnh hoặc prompt"
      });
    }

    const systemPrompt = `
Bạn là chuyên gia AI render kiến trúc và diễn họa công trình.

Nhiệm vụ:
Từ ảnh công trình thô do người dùng cung cấp, tạo ra một ảnh render kiến trúc chân thực, đẹp, có tính thương mại.

Nguyên tắc bắt buộc:
1. Giữ nguyên phối cảnh ảnh gốc.
2. Giữ nguyên hình khối chính của công trình.
3. Không tự ý thay đổi số tầng.
4. Không tự ý thêm công trình lớn khác.
5. Có thể cải thiện vật liệu, ánh sáng, cây xanh, mặt tiền, cửa, kính, sân, nền, bầu trời.
6. Kết quả phải giống ảnh render kiến trúc chuyên nghiệp.
7. Bắt buộc trả về hình ảnh hoàn chỉnh, không chỉ mô tả bằng chữ.

Chất lượng mong muốn:
- Photorealistic architectural visualization.
- High detail.
- Clean facade.
- Realistic materials.
- Natural lighting.
- Professional exterior render.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nYêu cầu của người dùng:\n${prompt}`
            },
            {
              inlineData: {
                mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE]
      }
    });

    let outputImage = null;
    let outputMimeType = "image/png";
    let outputText = "";

    const parts = response?.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.text) {
        outputText += part.text;
      }

      if (part.inlineData?.data) {
        outputImage = part.inlineData.data;
        outputMimeType = part.inlineData.mimeType || "image/png";
      }
    }

    if (!outputImage) {
      return res.status(500).json({
        error: "Gemini không trả về ảnh. Hãy thử prompt khác.",
        text: outputText
      });
    }

    return res.status(200).json({
      imageBase64: outputImage,
      mimeType: outputMimeType,
      text: outputText
    });
  } catch (error) {
    return res.status(500).json({
      error: "Lỗi khi gọi Gemini API",
      detail: error.message
    });
  }
}
