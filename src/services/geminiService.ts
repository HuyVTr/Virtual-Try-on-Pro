import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Part } from "@google/generative-ai";
import { UploadedImage, BackgroundConfig, StudioMode, SceneAnalysis } from "../types";

/**
 * Parses a Gemini API error and returns a user-friendly message.
 * @param error The original error object.
 * @returns A user-friendly error string.
 */
const parseGeminiError = (error: any): string => {
  const errorMessage = (error.message || '').toLowerCase();
  const errorStatus = (error.status || '').toLowerCase(); // gRPC status
  
  console.error("Gemini API Error Raw:", error);

  if (errorMessage.includes("api key not valid")) {
    return "API_KEY_INVALID";
  }
  
  // Billing-related errors
  if (errorStatus.includes('permission_denied') || errorMessage.includes('403') || errorMessage.includes('billing')) {
    if (errorMessage.includes('billing account not found')) {
      return 'Lỗi: Project của bạn chưa được liên kết với một tài khoản thanh toán (Billing Account).';
    }
    if (errorMessage.includes('billing is not enabled')) {
      return 'Lỗi: Tính năng thanh toán (Billing) chưa được bật cho Project này trên Google Cloud Console.';
    }
    // Generic billing/permission error for paid models
    return 'Lỗi: Model này yêu cầu thanh toán. Vui lòng kiểm tra xem bạn đã bật Billing và API Key có đủ quyền truy cập chưa.';
  }

  // Quota / Rate limiting errors
  if (errorStatus.includes('resource_exhausted') || errorMessage.includes('429') || errorMessage.includes('quota')) {
    return 'Lỗi: Bạn đã vượt quá hạn mức (quota) cho phép của model này. Vui lòng thử lại sau.';
  }
  
  // Invalid argument or malformed request
  if (errorStatus.includes('invalid_argument')) {
    return 'Lỗi: Yêu cầu không hợp lệ. Có thể do prompt hoặc tham số ảnh không đúng định dạng.';
  }

  // Fallback for other errors
  return error.message || "Đã xảy ra lỗi không xác định từ API.";
};


/**
 * Checks if the user has selected an API key via the AI Studio UI.
 */
export const checkApiKeyAvailability = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
    return await win.aistudio.hasSelectedApiKey();
  }
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};

/**
 * Opens the API Key selection dialog.
 */
export const openApiKeySelection = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
    await win.aistudio.openSelectKey();
  }
};

/**
 * Generates the try-on image using Gemini (Photo Mode).
 */
export const generateTryOnImage = async (
  personImage: UploadedImage,
  garmentImage: UploadedImage,
  userPrompt: string = "", 
  modelName: string,
  backgroundConfig: BackgroundConfig
): Promise<string> => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  let finalPrompt = '';
  const payloadParts: Part[] = [];
  
  payloadParts.push(
    { inlineData: { mimeType: personImage.mimeType, data: personImage.base64.split(',')[1] || personImage.base64 } },
    { inlineData: { mimeType: garmentImage.mimeType, data: garmentImage.base64.split(',')[1] || garmentImage.base64 } }
  );

  const clothAndModelDesc = userPrompt.trim() || "the specified clothing";

  switch (backgroundConfig.bgMode) {
    case 'TEXT_PROMPT':
      finalPrompt = `VAI TRÒ: Bạn là Gem-Lab Assistant, chuyên gia AI về xử lý hình ảnh thời trang (Virtual Try-On Specialist).
      CHẾ ĐỘ: ẢNH (Photo Mode).
      ĐẦU VÀO (INPUTS):
      1. Ảnh 1 (Ảnh gốc): Người mẫu.
      2. Ảnh 2 (Trang phục): Quần/Áo cần thử.
      3. Yêu cầu chi tiết: "${userPrompt.trim() || "Mặc tự nhiên, chuẩn form"}"
      4. Bối cảnh: "${backgroundConfig.bgDescription}".
      NHIỆM VỤ:
      Thực hiện thay thế trang phục từ Ảnh 2 sang người mẫu ở Ảnh 1.
      Đồng thời, tạo bối cảnh mới như mô tả và điều chỉnh ánh sáng, đổ bóng của người mẫu để phù hợp hoàn hảo với bối cảnh mới.
      YÊU CẦU KỸ THUẬT QUAN TRỌNG:
      1. GIỮ NGUYÊN: Khuôn mặt, màu da, dáng pose của Ảnh 1.
      2. XỬ LÝ TRANG PHỤC: Warp và fit trang phục từ Ảnh 2 vào người Ảnh 1 một cách chân thực (photorealistic), chú ý ánh sáng và nếp vải.
      3. KẾT QUẢ: Chỉ trả về hình ảnh kết quả cuối cùng.
      `;
      break;
      
    case 'IMAGE_UPLOAD':
      if (backgroundConfig.bgImage) {
        payloadParts.push({ inlineData: { mimeType: backgroundConfig.bgImage.mimeType, data: backgroundConfig.bgImage.base64.split(',')[1] || backgroundConfig.bgImage.base64 } });
        finalPrompt = `VAI TRÒ: Bạn là Gem-Lab Assistant, chuyên gia AI về xử lý hình ảnh thời trang (Virtual Try-On Specialist).
        CHẾ ĐỘ: ẢNH (Photo Mode).
        ĐẦU VÀO (INPUTS):
        1. Ảnh 1 (Ảnh gốc): Người mẫu.
        2. Ảnh 2 (Trang phục): Quần/Áo cần thử.
        3. Ảnh 3 (Bối cảnh): Ảnh nền mới.
        4. Yêu cầu chi tiết: "${userPrompt.trim() || "Mặc tự nhiên, chuẩn form"}"
        NHIỆM VỤ:
        Thực hiện thay thế trang phục từ Ảnh 2 sang người mẫu ở Ảnh 1.
        Sau đó, ghép người mẫu đã mặc trang phục mới vào Ảnh 3 (Ảnh nền) một cách liền mạch.
        YÊU CẦU KỸ THUẬT QUAN TRỌNG:
        1. GIỮ NGUYÊN: Khuôn mặt, màu da, dáng pose của Ảnh 1.
        2. XỬ LÝ TRANG PHỤC: Warp và fit trang phục từ Ảnh 2 vào người Ảnh 1 một cách chân thực (photorealistic), chú ý ánh sáng và nếp vải.
        3. KẾT NỐI BỐI CẢNH: Điều chỉnh ánh sáng, đổ bóng và tông màu của người mẫu để phù hợp hoàn hảo với điều kiện ánh sáng của Ảnh 3. Sự kết hợp phải trông như ảnh chụp thật.
        4. KẾT QUẢ: Chỉ trả về hình ảnh kết quả cuối cùng.
        `;
      } else {
        finalPrompt = `VAI TRÒ: Bạn là Gem-Lab Assistant, chuyên gia AI về xử lý hình ảnh thời trang (Virtual Try-On Specialist).
        CHẾ ĐỘ: ẢNH (Photo Mode).
        ĐẦU VÀO (INPUTS):
        1. Ảnh 1 (Ảnh gốc): Người mẫu.
        2. Ảnh 2 (Trang phục): Quần/Áo cần thử.
        3. Yêu cầu chi tiết: "${userPrompt.trim() || "Mặc tự nhiên, chuẩn form"}"
        NHIỆM VỤ:
        Thực hiện thay thế trang phục từ Ảnh 2 sang người mẫu ở Ảnh 1.
        YÊU CẦU KỸ THUẬT QUAN TRỌNG:
        1. GIỮ NGUYÊN: Khuôn mặt, màu da, dáng pose và bối cảnh gốc của Ảnh 1.
        2. XỬ LÝ TRANG PHỤC: Warp và fit trang phục từ Ảnh 2 vào người Ảnh 1 một cách chân thực (photorealistic), chú ý ánh sáng và nếp vải.
        3. KẾT QUẢ: Chỉ trả về hình ảnh kết quả cuối cùng.
        `;
      }
      break;

    case 'DEFAULT':
    default:
      finalPrompt = `VAI TRÒ: Bạn là Gem-Lab Assistant, chuyên gia AI về xử lý hình ảnh thời trang (Virtual Try-On Specialist).
      CHẾ ĐỘ: ẢNH (Photo Mode).
      ĐẦU VÀO (INPUTS):
      1. Ảnh 1 (Ảnh gốc): Người mẫu.
      2. Ảnh 2 (Trang phục): Quần/Áo cần thử.
      3. Yêu cầu chi tiết: "${userPrompt.trim() || "Mặc tự nhiên, chuẩn form"}"
      NHIỆM VỤ:
      Thực hiện thay thế trang phục từ Ảnh 2 sang người mẫu ở Ảnh 1.
      YÊU CẦU KỸ THUẬT QUAN TRỌNG:
      1. GIỮ NGUYÊN: Khuôn mặt, màu da, dáng pose và bối cảnh gốc của Ảnh 1.
      2. XỬ LÝ TRANG PHỤC: Warp và fit trang phục từ Ảnh 2 vào người Ảnh 1 một cách chân thực (photorealistic), chú ý ánh sáng và nếp vải.
      3. KẾT QUẢ: Chỉ trả về hình ảnh kết quả cuối cùng.
      `;
      break;
  }
  
  payloadParts.unshift({ text: finalPrompt });

  const imageConfig: { imageSize?: string; aspectRatio: string } = { aspectRatio: '3:4' };
  if (modelName.includes('pro')) {
    imageConfig.imageSize = '2K';
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: payloadParts }],
      generationConfig: { ...imageConfig } as any
    });

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Không tìm thấy dữ liệu hình ảnh trong phản hồi của API.");
  } catch (error: any) {
    throw new Error(parseGeminiError(error));
  }
};

/**
 * Helper: Extracts 4 keyframes from a video file using HTML5 Canvas.
 */
const extractFramesFromVideo = async (videoFile: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    const url = URL.createObjectURL(videoFile);

    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      // Extract at 10%, 30%, 60%, 90%
      const timePoints = [0.1, 0.3, 0.6, 0.9].map(p => p * duration);

      try {
        for (const time of timePoints) {
          video.currentTime = time;
          await new Promise<void>(r => {
              const seekHandler = () => {
                  video.removeEventListener('seeked', seekHandler);
                  r();
              };
              video.addEventListener('seeked', seekHandler);
          });
          
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              // Compress to JPEG 0.7 to reduce payload size
              frames.push(canvas.toDataURL('image/jpeg', 0.7)); 
          }
        }
        resolve(frames);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
        video.remove();
        canvas.remove();
      }
    };

    video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Không thể đọc file video. Vui lòng kiểm tra định dạng."));
    };
  });
};

/**
 * Analyzes video content by extracting frames and sending to Gemini.
 */
export const analyzeVideoContent = async (videoFile: File, modelName: string): Promise<SceneAnalysis[]> => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  // 1. Extract frames
  const frames = await extractFramesFromVideo(videoFile);
  
  // 2. Prepare Payload
  const payloadParts: Part[] = frames.map(base64 => ({
    inlineData: { mimeType: 'image/jpeg', data: base64.split(',')[1] }
  }));

  const prompt = `
    Bạn là một chuyên gia phân tích video và đạo diễn hình ảnh (Director of Photography).
    Hãy phân tích 4 khung hình này như một chuỗi liên tục của một video.
    Nhiệm vụ: Trả về kết quả dưới dạng JSON Array thuần túy (không có markdown block), trong đó mỗi object đại diện cho một cảnh tương ứng với ảnh và chứa các trường sau:
    - "timestamp": Khoảng thời gian ước lượng (ví dụ: '00:00 - 00:05').
    - "visual_prompt": Mô tả chi tiết hình ảnh để dùng cho AI tạo video (Chủ thể, Hành động, Ánh sáng, Màu sắc). Viết bằng tiếng Anh chuẩn prompt.
    - "audio": Gợi ý âm thanh hoặc lời thoại phù hợp.
    - "tech_specs": Góc máy (Wide/Close-up), Chuyển động camera (Pan/Zoom/Static).
  `;

  payloadParts.unshift({ text: prompt });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: payloadParts }]
  });

  const text = result.response.text();
  // Clean up markdown if present
  const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    const analysis = JSON.parse(jsonString) as SceneAnalysis[];
    // Attach frames back to result for UI display
    return analysis.map((scene, index) => ({ ...scene, frameBase64: frames[index] }));
  } catch (e) {
    console.error("JSON Parse Error:", text);
    throw new Error("Không thể phân tích phản hồi từ AI. Vui lòng thử lại.");
  }
};

/**
 * Generates a video from an image using Veo (Video Mode).
 */
export const generateVideo = async (
  inputImage: UploadedImage,
  prompt: string,
  modelName: string,
  duration: number 
): Promise<string> => {
  // Lưu ý: Veo chưa được hỗ trợ chính thức trong SDK client-side @google/generative-ai
  // Đoạn code này sử dụng REST API hoặc giả lập call để tránh lỗi TypeScript
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  
  const videoPrompt = `
    VAI TRÒ: Bạn là Gem-Lab Assistant, Đạo diễn hình ảnh động (Video Director).
    CHẾ ĐỘ: VIDEO (Image-to-Video).
    ĐẦU VÀO:
    1. Ảnh gốc: Image 1.
    2. Yêu cầu chuyển động: "${prompt.trim() || "Chuyển động điện ảnh, camera quay chậm, tự nhiên"}"
    NHIỆM VỤ:
    Tạo ra một đoạn video ngắn, chất lượng cao từ ảnh gốc dựa trên mô tả chuyển động.
  `;

  try {
    // Ép kiểu any cho model để truy cập method generateVideos (Beta feature)
    const model: any = genAI.getGenerativeModel({ model: modelName });
    
    if (typeof model.generateVideos !== 'function') {
        throw new Error("Thư viện hiện tại chưa hỗ trợ tạo Video (Veo). Vui lòng cập nhật SDK hoặc kiểm tra lại cấu hình.");
    }

    let operation = await model.generateVideos({
      prompt: videoPrompt,
      image: { imageBytes: inputImage.base64.split(',')[1] || inputImage.base64, mimeType: inputImage.mimeType },
      config: { 
        numberOfVideos: 1, 
        resolution: '720p', 
        aspectRatio: '9:16',
        durationSecs: duration 
      }
    });

    const pollingInterval = modelName === 'veo-3.1-generate-preview' ? 10000 : 5000;

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      // Giả lập polling
      operation = await (genAI as any).getVideosOperation ? (genAI as any).getVideosOperation({ operation: operation }) : operation;
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
       // Check for billing specific error from Veo API
       const responseError = operation.response?.error;
       if (responseError && responseError.code === 403) { // Assuming 403 is permission denied/billing error
           throw new Error("Lỗi 403: Vui lòng bật Billing trên Google Cloud để dùng Veo.");
       }
       throw new Error("Tạo video thất bại hoặc không nhận được liên kết. Nguyên nhân có thể do nội dung không phù hợp hoặc sự cố về thanh toán/hạn mức.");
    }

    const response = await fetch(`${downloadLink}&key=${import.meta.env.VITE_GEMINI_API_KEY}`);
    if (!response.ok) {
      throw new Error("Không thể tải xuống file video đã tạo. Liên kết có thể đã hết hạn.");
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    throw new Error(parseGeminiError(error));
  }
};

/**
 * Generates or processes images for the AI Photo Studio module.
 */
export const generateStudioImage = async (
  studioMode: StudioMode,
  userPrompt: string = "",
  inputImage: UploadedImage | null,
  modelName: string,
  upscaleResolution: string = '4K'
): Promise<string> => {
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  let finalPrompt = '';
  const payloadParts: Part[] = [];

  if (inputImage) {
      payloadParts.push({ inlineData: { mimeType: inputImage.mimeType, data: inputImage.base64.split(',')[1] || inputImage.base64 } });
  }

  switch (studioMode) {
    case 'TEXT_TO_IMAGE':
      finalPrompt = `Tạo một hình ảnh chất lượng cao dựa trên mô tả sau: "${userPrompt.trim()}". YÊU CẦU: photorealistic, 8k, extremely detailed, cinematic light, studio shot.`;
      break;
    case 'ENHANCE':
      if (!inputImage) throw new Error("Vui lòng tải ảnh để nâng cấp.");
      finalPrompt = `System Prompt: "Analyze image, fix blur, denoise, sharpen textures. Output High Fidelity. Cải thiện chất lượng hình ảnh này.`;
      break;
    case 'UPSCALE':
      if (!inputImage) throw new Error("Vui lòng tải ảnh để phóng to.");
      finalPrompt = `System Prompt: "Upscale to ${upscaleResolution}. Enhance micro-details (skin, fabric). Do not alter subject face. Phóng to hình ảnh này lên ${upscaleResolution} và cải thiện chi tiết nhỏ.`;
      break;
    default:
      throw new Error("Chế độ Studio không hợp lệ.");
  }

  payloadParts.unshift({ text: finalPrompt });

  const imageConfig: { imageSize?: string; aspectRatio?: string } = {}; // Adjust as needed for studio
  // For upscale, we might want to specify a larger output size if the model supports it.
  if (studioMode === 'UPSCALE' && modelName.includes('pro')) {
      imageConfig.imageSize = upscaleResolution; // Dynamic resolution based on user selection
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: payloadParts }],
      generationConfig: { ...imageConfig } as any
    });

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("Không tìm thấy dữ liệu hình ảnh trong phản hồi của API.");
  } catch (error: any) {
    throw new Error(parseGeminiError(error));
  }
};
