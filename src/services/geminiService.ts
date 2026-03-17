import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Part } from "@google/generative-ai";
import { UploadedImage, BackgroundConfig, StudioMode, SceneAnalysis } from "../types";

/**
 * Parses a Gemini API error and returns a user-friendly message.
 * @param error The original error object.
 * @returns A user-friendly error string.
 */
const parseGeminiError = (error: any): string => {
  const errorMessage = String(error.message || '').toLowerCase();
  const errorStatus = String(error.status || '').toLowerCase(); // gRPC status

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
  return !!localStorage.getItem('gem_lab_api_key') || !!import.meta.env.VITE_GEMINI_API_KEY;
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
  const apiKey = localStorage.getItem('gem_lab_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  let finalPrompt = '';
  const payloadParts: Part[] = [];

  payloadParts.push(
    { inlineData: { mimeType: personImage.mimeType, data: personImage.base64.split(',')[1] || personImage.base64 } },
    { inlineData: { mimeType: garmentImage.mimeType, data: garmentImage.base64.split(',')[1] || garmentImage.base64 } }
  );


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

  const generationConfig: any = {};
  if (modelName.includes('imagen')) {
    generationConfig.aspectRatio = '3:4';
    if (modelName.includes('pro')) {
      generationConfig.imageSize = '2K';
    }
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: payloadParts }],
      generationConfig: generationConfig
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
 * Helper: Extracts keyframes from a video file using HTML5 Canvas.
 */
export const extractFramesFromVideo = (videoFile: File): Promise<{ frames: string[], timestamps: string[] }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    const timestamps: string[] = [];
    const url = URL.createObjectURL(videoFile);

    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      
      // Extract 8 points across the video duration
      const points = [0.05, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 0.98];
      const timePoints = points.map(p => p * duration);

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
            
            // Format timestamp: MM:SS
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            const ts = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            timestamps.push(ts);
          }
        }
        resolve({ frames, timestamps });
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
        video.remove();
        canvas.remove();
      }
    };

    video.onerror = (_e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc file video. Vui lòng kiểm tra định dạng."));
    };
  });
};

export const analyzeVideoContent = async (videoFile: File, modelName: string): Promise<SceneAnalysis[]> => {
  const apiKey = localStorage.getItem('gem_lab_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  // 1. Extract frames and timestamps
  const { frames, timestamps } = await extractFramesFromVideo(videoFile);

  // 2. Prepare Payload
  const payloadParts: Part[] = frames.map(base64 => ({
    inlineData: { mimeType: 'image/jpeg', data: base64.split(',')[1] }
  }));

  const prompt = `
    VAI TRÒ: Chuyên gia Storyboard và Đạo diễn Hình ảnh.
    NHIỆM VỤ: Phân tích chuỗi ${frames.length} khung hình từ một video để tạo ra bảng phân cảnh chi tiết.
    
    THÔNG TIN THỜI GIAN CỦA TỪNG KHUNG HÌNH (theo thứ tự):
    ${timestamps.map((t, i) => `Ảnh ${i+1}: ${t}`).join(', ')}

    YÊU CẦU TRẢ VỀ: Một JSON Array thuần túy (không kèm markdown), mỗi object chứa:
    - "timestamp": Sử dụng đúng mốc thời gian đã cung cấp phía trên.
    - "visual_prompt": Mô tả hình ảnh chuyên sâu (English). Tập trung vào chuyển động, ánh sáng, góc máy.
    - "audio": Gợi ý âm thanh/nhạc nền phù hợp với cảnh.
    - "tech_specs": Chi tiết kỹ thuật (Shot type, Camera movement).
    - "items": Các đối tượng/phụ kiện xuất hiện trong cảnh (Array of strings).
  `;

  payloadParts.unshift({ text: prompt });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: payloadParts }]
  });

  const text = result.response.text();
  const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const analysis = JSON.parse(jsonString);
    
    // Normalize data to ensure string fields are actually strings (not objects)
    const normalizedAnalysis = (analysis as any[]).map((scene, index) => {
      // Helper to ensure target is string
      const ensureString = (val: any): string => {
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val !== null) {
          return Object.entries(val)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        }
        return String(val || '');
      };

      return {
        ...scene,
        visual_prompt: ensureString(scene.visual_prompt),
        audio: ensureString(scene.audio),
        tech_specs: ensureString(scene.tech_specs),
        items: Array.isArray(scene.items) ? scene.items.map(String) : [],
        frameBase64: frames[index],
        timestamp: timestamps[index] // Force match video extraction logic
      } as SceneAnalysis;
    });

    return normalizedAnalysis;
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
  modelName: string
): Promise<string> => {
  const apiKey = localStorage.getItem('gem_lab_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  const baseUrl = "/google-api/v1beta";

  const videoPrompt = `
    VAI TRÒ: Video Director.
    NHIỆM VỤ: Tạo video từ ảnh gốc.
    YÊU CẦU CHUYỂN ĐỘNG: "${prompt.trim() || "Cinematic motion, natural movement"}"
  `;

  try {
    console.info(`[Gem-Lab] Khôi phục Logic ổn định cho: ${modelName}...`);

    const endpoint = `${baseUrl}/models/${modelName}:predictLongRunning?key=${apiKey}`;

    const requestBody = {
      instances: [{
        prompt: videoPrompt,
        referenceImages: [{
          image: {
            bytesBase64Encoded: inputImage.base64.split(',')[1] || inputImage.base64,
            mimeType: inputImage.mimeType
          },
          referenceType: "FIRST_FRAME"
        }]
      }],
      parameters: {
        personGeneration: "allow_adult"
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorClone = response.clone();
        const status = response.status;
        let errMsg = `Lỗi hệ thống (${status})`;
        try {
            const data = await response.json();
            errMsg = data.error?.message || errMsg;
        } catch (e) {
            errMsg = await errorClone.text();
        }
        throw new Error(errMsg);
    }

    const initialOperation = await response.json();
    let operation = initialOperation;
    console.info(`[Gem-Lab] Task: ${operation.name} đã được tạo.`);

    // 2. Polling (Chờ video render)
    const maxAttempts = 120;
    let attempts = 0;
    
    while (!operation.done && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const pollResponse = await fetch(`${baseUrl}/${operation.name}?key=${apiKey}`);
      if (pollResponse.ok) {
        operation = await pollResponse.json();
        console.log(`[Gem-Lab] Trạng thái xử lý (${attempts})...`);
      }
    }

    if (!operation.done) throw new Error("Quá thời gian render trên máy chủ Google.");

    // 3. Xử lý kết quả trả về
    const videoUri = 
        operation.response?.video?.uri ||
        operation.response?.generatedVideos?.[0]?.video?.uri || 
        operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

    if (!videoUri) {
        console.error("[Gem-Lab] Response Full:", operation);
        throw new Error("Không thể lấy đường dẫn video từ phản hồi.");
    }

    const downloadRes = await fetch(`${videoUri}&key=${apiKey}`);
    if (!downloadRes.ok) throw new Error("Lỗi tải video từ server Google.");
    
    const blob = await downloadRes.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Lỗi chuyển đổi dữ liệu video."));
        reader.readAsDataURL(blob);
    });

  } catch (error: any) {
    console.error("[Gem-Lab] Error in generateVideo:", error);
    throw error;
  }
};

/**
 * Text-to-Video generation using Veo 3.1
 */
export const generateTextToVideo = async (
  videoPrompt: string,
  modelId: string = 'veo-3.1-fast-generate-preview'
): Promise<string> => {
  try {
    const apiKey = localStorage.getItem('gem_lab_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API_KEY_INVALID");

    const baseUrl = "/google-api/v1beta";
    const modelName = modelId;
    
    const formattedPrompt = `
      VAI TRÒ: Video Director.
      NHIỆM VỤ: Tạo video từ mô tả văn bản.
      YÊU CẦU SÁNG TẠO: "${videoPrompt.trim()}"
    `;

    const endpoint = `${baseUrl}/models/${modelName}:predictLongRunning?key=${apiKey}`;

    const requestBody = {
      instances: [{
        prompt: formattedPrompt
      }]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorClone = response.clone();
        const status = response.status;
        let errMsg = `Lỗi hệ thống (${status})`;
        try {
            const data = await response.json();
            errMsg = data.error?.message || errMsg;
        } catch (e) {
            errMsg = await errorClone.text();
        }
        throw new Error(errMsg);
    }

    const initialOperation = await response.json();
    let operation = initialOperation;
    console.info(`[Gem-Lab] Text-to-Video Task: ${operation.name} đã được tạo.`);

    // Polling
    const maxAttempts = 120;
    let attempts = 0;
    
    while (!operation.done && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const pollResponse = await fetch(`${baseUrl}/${operation.name}?key=${apiKey}`);
      if (pollResponse.ok) {
        operation = await pollResponse.json();
        console.log(`[Gem-Lab] Text-to-Video Trạng thái (${attempts})...`);
      }
    }

    if (!operation.done) throw new Error("Quá thời gian render trên máy chủ Google.");

    const videoUri = 
        operation.response?.video?.uri ||
        operation.response?.generatedVideos?.[0]?.video?.uri || 
        operation.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;

    if (!videoUri) throw new Error("Không thể lấy đường dẫn video từ phản hồi.");

    const downloadRes = await fetch(`${videoUri}&key=${apiKey}`);
    if (!downloadRes.ok) throw new Error("Lỗi tải video từ server Google.");
    
    const blob = await downloadRes.blob();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Lỗi chuyển đổi dữ liệu video."));
        reader.readAsDataURL(blob);
    });

  } catch (error: any) {
    console.error("[Gem-Lab] Error in generateTextToVideo:", error);
    throw error;
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
  const apiKey = localStorage.getItem('gem_lab_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
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

  const generationConfig: any = {};
  if (modelName.includes('imagen')) {
    if (studioMode === 'UPSCALE' && modelName.includes('pro')) {
      generationConfig.imageSize = upscaleResolution;
    }
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: payloadParts }],
      generationConfig: generationConfig
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
