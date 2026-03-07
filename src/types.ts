export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum AppModule {
  TRY_ON = 'TRY_ON',
  VIDEO = 'VIDEO',
  STUDIO = 'STUDIO',
  VIDEO_ANALYSIS = 'VIDEO_ANALYSIS',
}

export type StudioMode = 'TEXT_TO_IMAGE' | 'ENHANCE' | 'UPSCALE';

export type BackgroundMode = 'DEFAULT' | 'TEXT_PROMPT' | 'IMAGE_UPLOAD';

export interface BackgroundConfig {
  bgMode: BackgroundMode;
  bgDescription: string;
  bgImage: UploadedImage | null;
}

export interface Model {
  id: string;
  name: string;
  description: string;
  dailyLimit: string;
  supportedModules: AppModule[];
  pros: string[];
  cons: string[];
}

export interface GeneratedResult {
  imageUrl: string;
}

export interface SceneAnalysis {
  timestamp: string;
  visual_prompt: string;
  audio: string;
  tech_specs: string;
  frameBase64?: string; // Để hiển thị lại ảnh đã cắt
}

// Global interface for AI Studio embedded key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

export const AVAILABLE_MODELS: Model[] = [
  // NHÓM ẢNH (PHOTO MODE - FREE TIER)
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash (Tốc độ cao)',
    description: 'Model tối ưu tốc độ (<3s), miễn phí & ổn định.',
    dailyLimit: '15 RPM | 500 Images/Ngày',
    supportedModules: [AppModule.TRY_ON, AppModule.STUDIO, AppModule.VIDEO_ANALYSIS],
    pros: ['Miễn phí 100%', 'Tốc độ cực nhanh', 'Quota ổn định cho Production'],
    cons: ['Độ phân giải trung bình', 'Hiểu vật lý vải mức khá'],
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro (Chất lượng cao)',
    description: 'Model thế hệ mới nhất, chi tiết cực cao.',
    dailyLimit: '10 RPM | 100 Images/Ngày',
    supportedModules: [AppModule.TRY_ON, AppModule.STUDIO, AppModule.VIDEO_ANALYSIS],
    pros: ['Chi tiết cực cao', 'Ánh sáng chân thực', 'Hỗ trợ Upscale 4K'],
    cons: ['Giới hạn số lượng (100/ngày)', 'Có thể không ổn định (Preview)'],
  },
  // NHÓM VIDEO (VIDEO MODE - PAID PREVIEW)
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast (Turbo)',
    description: 'Video tốc độ cao. Yêu cầu bật Billing.',
    dailyLimit: '10 RPM | Billing Required (~$0.15/sec)',
    supportedModules: [AppModule.VIDEO],
    pros: ['Render nhanh', 'Phù hợp test chuyển động'],
    cons: ['Cần trả phí (Pay-as-you-go)', 'Không có Free Tier'],
  },
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1 Standard (Cinema)',
    description: 'Chất lượng điện ảnh. Yêu cầu bật Billing.',
    dailyLimit: '2 RPM | Billing Required (~$0.40/sec)',
    supportedModules: [AppModule.VIDEO],
    pros: ['Chất lượng tốt nhất', 'Vật lý chân thực'],
    cons: ['Chi phí cao', 'Thời gian chờ >60s', 'Cần thẻ thanh toán'],
  },
  // NHÓM STUDIO (PAID)
  {
    id: 'imagen-3.0-generate-001',
    name: 'Imagen 3 (Photorealistic)',
    description: 'Model chuyên dụng tạo ảnh thực tế nhất của Google.',
    dailyLimit: 'Billing Required (Tính phí)',
    supportedModules: [AppModule.STUDIO],
    pros: ['Ánh sáng quang học chuẩn xác', 'Vẽ chữ (Text rendering) cực tốt'],
    cons: ['Cần bật Billing (Tính phí)', 'Không có Free Tier'],
  }
];

export interface TryOnRequest {
  bgMode: BackgroundMode;
  bgDescription: string;
  bgImageFile: File | null;
}

// Metadata riêng cho chế độ Upscale (AI Photo Studio)
export const UPSCALE_MODEL_METADATA: Record<string, Partial<Model>> = {
  'gemini-3-pro-image-preview': {
    description: '✅ KHUYÊN DÙNG: Model duy nhất hỗ trợ Upscale 4K Native. Tối ưu hóa chi tiết nhỏ (lỗ chân lông, sợi vải) mà không làm biến đổi khuôn mặt.',
    pros: ['Độ phân giải 4K thực (Native Support)', 'Giữ nguyên 100% đặc điểm nhận dạng', 'Tái tạo texture da và vải chân thực nhất'],
    cons: ['Tốc độ xử lý chậm hơn Flash', 'Giới hạn 100 ảnh/ngày']
  },
  'gemini-2.5-flash-image': {
    description: 'Upscale Cơ Bản (Draft): Phù hợp để test nhanh bố cục hoặc ảnh vector/đồ họa đơn giản. Không tối ưu cho ảnh người thật.',
    pros: ['Tốc độ cực nhanh (<3s)', 'Miễn phí hoàn toàn', 'Tốt cho ảnh hoạt hình/Line art'],
    cons: ['Chỉ tăng kích thước, không thêm chi tiết', 'Có thể bị bệt màu da', 'Không hỗ trợ 4K sắc nét']
  },
  'imagen-3.0-generate-001': {
    description: 'Creative Upscale (Sáng tạo lại): Model sẽ "vẽ lại" bức ảnh ở độ phân giải cao hơn. Thích hợp nếu ảnh gốc quá mờ hoặc cần thay đổi phong cách.',
    pros: ['Thêm chi tiết siêu thực (lông mi, tóc)', 'Cân chỉnh lại ánh sáng chuẩn Studio', 'Cứu được ảnh gốc chất lượng rất thấp'],
    cons: ['CÓ THỂ LÀM THAY ĐỔI KHUÔN MẶT', 'Tính phí (Billing Required)', 'Không trung thực với ảnh gốc']
  }
};

// Metadata riêng cho chế độ Enhance (AI Photo Studio)
export const ENHANCE_MODEL_METADATA: Record<string, Partial<Model>> = {
  'gemini-3-pro-image-preview': {
    description: '✅ KHUYÊN DÙNG: Phục hồi ảnh cũ/mờ chuyên nghiệp. Sử dụng thuật toán Vision cao cấp để tái tạo chi tiết bị mất do rung tay hoặc thiếu sáng.',
    pros: ['Khử nhiễu (Denoise) cực tốt', 'Làm nét ảnh bị rung (Deblur)', 'Cân bằng lại ánh sáng/màu sắc'],
    cons: ['Xử lý lâu hơn Flash', 'Giới hạn 100 ảnh/ngày']
  },
  'gemini-2.5-flash-image': {
    description: 'Enhance Cơ Bản: Tự động cân chỉnh màu sắc và độ sáng (Auto-Tone). Phù hợp ảnh chụp điện thoại đời thường.',
    pros: ['Tốc độ tức thì', 'Làm tươi màu ảnh', 'Miễn phí hoàn toàn'],
    cons: ['Khả năng khử mờ kém hơn Pro', 'Không tái tạo được chi tiết đã mất']
  },
  'imagen-3.0-generate-001': {
    description: 'Creative Enhance: "Vẽ lại" bức ảnh để đạt chất lượng Studio. Có thể thay đổi nhẹ cấu trúc ảnh để đẹp hơn.',
    pros: ['Biến ảnh chụp vội thành ảnh nghệ thuật', 'Ánh sáng chuẩn điện ảnh', 'Thêm chi tiết nền'],
    cons: ['Thay đổi tính chất ảnh gốc', 'Tính phí (Billing Required)']
  }
};
