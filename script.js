// CẢNH BÁO: Chỉ nên để API Key trực tiếp trong code khi làm bài tập hoặc test cá nhân. 
// Nếu làm dự án thực tế public cho nhiều người dùng, bạn cần chuyển phần gọi API này lên một backend server.
const API_TOKEN = "AIzaSyCb5b9zt5E14v3EDeSN8aYI2z6H4fv9ZJU"; 

// Sử dụng model Stable Diffusion XL của Stability AI (miễn phí trên Hugging Face)
const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const resultImage = document.getElementById('resultImage');
const loadingText = document.getElementById('loading');

// Hàm gửi yêu cầu tạo ảnh
async function generateImage(prompt) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            throw new Error(`Lỗi từ server: ${response.status}`);
        }

        // AI sẽ trả về một file dạng Blob (dữ liệu nhị phân của bức ảnh)
        const blob = await response.blob();
        return blob;
    } catch (error) {
        console.error("Chi tiết lỗi:", error);
        alert("Đã xảy ra lỗi khi tạo ảnh. Vui lòng thử lại sau.");
        return null;
    }
}

// Lắng nghe sự kiện click nút
generateBtn.addEventListener('click', async () => {
    const promptText = promptInput.value.trim();
    
    if (!promptText) {
        alert("Vui lòng nhập mô tả hình ảnh!");
        return;
    }

    // Hiển thị trạng thái đang load
    generateBtn.disabled = true;
    generateBtn.innerText = "Đang kết xuất...";
    resultImage.classList.add('hidden');
    loadingText.classList.remove('hidden');

    // Gọi hàm AI
    const imageBlob = await generateImage(promptText);

    if (imageBlob) {
        // Chuyển Blob thành URL để hiển thị lên thẻ <img>
        const imageUrl = URL.createObjectURL(imageBlob);
        resultImage.src = imageUrl;
        resultImage.classList.remove('hidden');
    }

    // Tắt trạng thái load
    loadingText.classList.add('hidden');
    generateBtn.innerText = "Tạo Ảnh Ngay";
    generateBtn.disabled = false;
});