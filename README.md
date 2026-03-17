# 🌟 Virtual Try-On Pro: AI Fashion Laboratory

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-blue?logo=google-gemini)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**Virtual Try-On Pro** là một nền tảng tiên tiến ứng dụng trí tuệ nhân tạo (AI) vào lĩnh vực thời trang và sáng tạo nội dung số. Dự án cung cấp các công cụ mạnh mẽ từ thử đồ ảo, tạo video AI cho đến phân tích kịch bản video chuyên sâu.

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 👗 Thử Đồ Ảo (Virtual Try-On)
- **Dress Up AI:** Thử các loại trang phục lên ảnh chân dung cá nhân một cách chân thực nhất.
- **AI Scene:** Thay đổi môi trường xung quanh (Location) bằng AI prompts.
- **Smart Directives:** Tùy chỉnh cách mặc (sơ vin, xắn tay áo, oversized...) bằng chỉ thị ngôn ngữ tự nhiên.

### 🎥 Sáng Tạo Video AI (AI Video Suite)
- **Image to Video:** Biến ảnh tĩnh thành video thời trang sống động với công nghệ **Veo 3.1**.
- **Text to Video:** Tạo video từ mô tả văn bản (Visual Concept).
- **Motion Dynamics:** Tùy chỉnh phong cách và tốc độ chuyển động (Cinematic, Drone shot...).

### 📸 Studio Ảnh AI (AI Photo Studio)
- **Upscale 4K Native:** Phóng to ảnh lên độ phân giải cực cao mà không mất chi tiết.
- **Image Refine:** Khử nhiễu, làm nét và phục hồi ảnh cũ/mờ chuyên nghiệp.
- **Creative Creation:** Tạo ảnh nghệ thuật từ mô tả văn bản với Imagen 3.

### 🔍 Phân Tích Video (Neural Storyboard)
- **Semantic Analysis:** Giải mã video thành kịch bản phân cảnh (Storyboard).
- **Prompt Extraction:** Tự động trích xuất Visual Prompts và thông số kỹ thuật từ video nguồn.

### 📚 Thư Viện Cá Nhân (Local Library)
- Lưu trữ mọi kiệt tác đã tạo trực tiếp trên trình duyệt của bạn bằng **Dexie/IndexedDB**.
- Bảo mật tuyệt đối, không lưu trữ ảnh lên máy chủ trung gian.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend:** [React.js](https://reactjs.org/) (Hooks, Context API).
- **Build Tool:** [Vite](https://vitejs.dev/) (Tối ưu hóa tốc độ build và hot reload).
- **AI Integration:** [Google Generative AI SDK](https://github.com/google-gemini/generative-ai-js) (Gemini 2.5 Flash, Gemini 3 Pro, Veo 3.1, Imagen 3).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism & Adaptive UI).
- **Icons:** [Lucide React](https://lucide.dev/).
- **Database:** [Dexie.js](https://dexie.org/) (IndexedDB wrapper).
- **Responsive:** Hỗ trợ Mobile (Portrait/Landscape), Tablet và Desktop 4K.

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

### 1. Yêu cầu hệ thống
- Node.js version 18 trở lên.
- Một API Key từ [Google AI Studio](https://aistudio.google.com/).

### 2. Cài đặt
```bash
# Clone dự án
git clone https://github.com/HuyVTr/Virtual-Try-on-Pro.git

# Di chuyển vào thư mục dự án
cd virtual-try-on-pro

# Cài đặt các thư viện
npm install
```

### 3. Cấu hình
Tạo file `.env` tại thư mục gốc và thêm API Key của bạn (hoặc bạn có thể nhập trực tiếp trong giao diện ứng dụng):
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### 4. Chạy dự án
```bash
npm run dev
```
Truy cập: `http://localhost:5173`

---

## 🎨 Ngôn Ngữ & Giao Diện
Ứng dụng hỗ trợ đa ngôn ngữ hoàn chỉnh:
- 🇻🇳 **Tiếng Việt** (Mặc định).
- 🇺🇸 **English**.

Hỗ trợ 3 chế độ hiển thị (Themes):
- ☀️ **Light Mode**
- 🌙 **Dark Mode**
- 💻 **System Preference**

---

## 🤝 Đóng Góp
Mọi đóng góp nhằm cải thiện tính năng hoặc khắc phục lỗi đều được hoan nghênh. Vui lòng tạo **Issue** hoặc gửi **Pull Request**.

## 📄 Giấy Phép
Dự án được phát hành dưới giấy phép MIT.

---
*Phát triển bởi một mình tôi* 🚀
