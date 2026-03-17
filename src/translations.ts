import { Language } from './types';

export const translations = {
  [Language.VI]: {
    // Header
    nav_try_on: 'Thử Đồ Ảo',
    nav_video: 'Tạo Video AI',
    nav_text_to_video: 'Video từ Văn Bản',
    nav_studio: 'Studio Ảnh AI',
    nav_analysis: 'Phân Tích Video',
    nav_library: 'Thư Viện Của Tôi',
    brand_sub: 'Phòng Thí Nghiệm Thời Trang AI',
    engine_active: 'Động cơ Hoạt động',
    
    // Themes
    theme_light: 'Sáng',
    theme_dark: 'Tối',
    theme_system: 'Hệ thống',
    
    // Virtual Try-On
    step_intelligence: '1. Model',
    step_model: '2. Đối Tượng',
    step_fabric: '3. Nguồn Quần Áo',
    step_environment: '4. Môi Trường',
    step_directives: '5. Chỉ Thị AI',
    label_model_engine: 'ĐỘNG CƠ XỬ LÝ (MODEL)',
    
    label_upload_portrait: 'Tải ảnh Portrait/Full body',
    label_upload_garment: 'Tải ảnh trang phục',
    label_upload_background: 'Tải ảnh nền',
    label_upscale: 'Phóng to 4K',
    
    bg_mode_original: 'Gốc',
    bg_mode_ai: 'AI Scene',
    bg_mode_custom: 'Tùy chỉnh',
    bg_placeholder_ai: 'Mô tả khung cảnh: Phố Paris, sảnh khách sạn sang trọng, hồ bơi lúc hoàng hôn…',
    bg_preserving: 'Giữ nguyên khung cảnh gốc',
    
    prompt_placeholder_tryon: 'Hướng dẫn cụ thể: Sơ vin, xắn tay áo, oversized, ánh sáng mờ ảo…',
    tag_tucked: 'Sơ vin',
    tag_loose: 'Rộng rãi',
    tag_rolled: 'Xắn tay áo',
    tag_studio: 'Ánh sáng Studio',
    
    label_upload_studio_source: 'Tải ảnh để xử lý',
    label_upscale_res: 'Độ phân giải mục tiêu',
    label_2k: '2K (Tiêu chuẩn)',
    label_4k: '4K (Siêu nét)',
    label_upscale_desc_2k: 'Tối ưu cho Web/Social',
    label_upscale_desc_4k: 'Chi tiết sắc nét nhất',
    
    // Image Upload hints
    upload_hint: 'Nhấp để tải lên',
    upload_limit: 'PNG, JPG tối đa 10MB',
    remove_img: 'Gỡ bỏ ảnh',
    
    // Video Creator
    step_video_visual: '2. Nguồn Hình Ảnh',
    step_video_motion: '3. Chuyển Động',
    step_timeline: '4. Thời Tuyến',
    step_text_video_prompt: '2. Mô tả Ý tưởng',
    label_visual_concept: 'Ý TƯỞNG HÌNH ẢNH',
    label_motion_style: 'PHONG CÁCH & CHUYỂN ĐỘNG',
    label_upload_video_source: 'Ảnh gốc cho Video',
    prompt_placeholder_video: 'Mô tả chuyển động: Người mẫu catwalk, hiệu ứng gió thổi tóc, máy quay zoom nhẹ…',
    duration_label: 'Thời lượng',
    timeline_fast: 'Nhanh',
    timeline_cinematic: 'Điện ảnh',
    
    // Video Analysis Output
    step_analysis_upload: '2. Tải lên Video',
    video_upload_placeholder: 'Kéo thả hoặc chọn video (MP4, MOV)',
    video_upload_limit: 'Tối đa 50MB. Hệ thống sẽ phân tích tự động.',
    step_studio_mode: '2. Chế độ Studio',
    studio_mode_create: 'Tạo ảnh',
    studio_mode_refine: 'Khử mờ',
    studio_mode_magnify: 'Phóng to',
    prompt_placeholder_studio: 'Mô tả kiệt tác: Thành phố Cyberpunk, chân dung tranh sơn dầu, ảnh sản phẩm tối giản…',
    
    // Common
    generate_btn: 'Tạo kết quả',
    generating_btn: 'Đang xử lý…',
    manifest_btn: 'Khởi tạo Kết quả',
    synthesizing: 'Đang tổng hợp…',
    result_title: 'Kết quả cuối cùng',
    reset_btn: 'Đặt lại không gian',
    download_btn: 'Tải xuống an toàn',
    label_download_hq: 'Tải ảnh chất lượng cao',
    awaiting_directives: 'Đang chờ chỉ thị',
    
    // Model Info Card
    capabilities: 'Khả năng',
    strengths: 'Điểm mạnh',
    constraints: 'Hạn chế',
    recommended: 'Khuyên dùng',
    enterprise_notice: 'Model doanh nghiệp. Tính phí theo token.',
    
    // Analysis
    analysis_title: 'Kịch Bản Phân Cảnh (Storyboard)',
    analysis_subtitle: 'Giải mã Video theo ngữ nghĩa',
    analysis_new_btn: 'Phân tích Video mới',
    copy_prompt: 'Sao chép Prompt',
    visual_prompt: 'Visual Prompt',
    audio_context: 'Ngữ cảnh âm thanh',
    tech_spec: 'Thông số kỹ thuật',
    object_manifest: 'Danh mục thực thể',
    full_reset: 'Làm mới không gian',
    library_empty: 'Thư viện chưa có dữ liệu. Hãy tạo ra kiệt tác đầu tiên của bạn!',
    library_delete_confirm: 'Bạn có chắc muốn xóa mục này khỏi thư viện local?',
    library_clear_all: 'Xóa toàn bộ thư viện',
    library_storage_info: 'Dữ liệu được lưu trữ an toàn ngay trên trình duyệt của bạn (Local Storage).',
    library_item_type: 'Loại: ',
    library_item_model: 'Model: ',
    library_item_date: 'Ngày tạo: ',
    
    // Messages
    error_apiKey: 'Vui lòng cung cấp API Key để tiếp tục',
    loading_generic: 'Hệ thống đang xử lý yêu cầu của bạn…',
    video_wait: 'Video mất khoảng 1-2 phút. Vui lòng chờ.',
    missing_input: 'Thiếu hình ảnh đầu vào',
    missing_video: 'Vui lòng tải lên video để phân tích.',
    missing_studio_img: 'Vui lòng tải ảnh để xử lý.',
    missing_studio_prompt: 'Vui lòng nhập mô tả ảnh.',
    tag_cinematic: 'Cinematic',
    tag_drone: 'Drone Shot',
    tag_hyper: 'Hyper-realistic',
    gen_failed: 'Tạo nội dung thất bại. Vui lòng thử lại.',
    invalid_key_msg: 'Vui lòng chọn hoặc nhập API Key hợp lệ để tiếp tục.',
    
    // API Modal
    modal_key_title: 'Cấu Hình Động Cơ AI',
    modal_key_desc: 'Kết nối API Key của bạn từ Google AI Studio để mở khóa toàn bộ tính năng cao cấp (Veo 3.1, Imagen 3, Gemini 3 Pro).',
    modal_key_placeholder: 'Nhập API Key của bạn tại đây…',
    modal_key_save: 'Lưu Cấu Hình',
    modal_key_get: 'Lấy API Key miễn phí',
    modal_key_status: 'Trạng thái: ',
    modal_key_status_active: 'Đã kết nối',
    modal_key_status_missing: 'Chưa kết nối',
    modal_key_hint: 'Gợi ý: Key sẽ được lưu an toàn trong trình duyệt của bạn.',

    // Models Localization
    models: {
      'gemini-2.5-flash-image': {
        name: 'Gemini 2.5 Flash (Tốc độ cao)',
        desc: 'Model tối ưu tốc độ (<3s), miễn phí & ổn định.',
        pros: ['Miễn phí 100%', 'Tốc độ cực nhanh', 'Quota ổn định cho Production'],
        cons: ['Độ phân giải trung bình', 'Hiểu vật lý vải mức khá']
      },
      'gemini-3-pro-image-preview': {
        name: 'Gemini 3 Pro (Chất lượng cao)',
        desc: 'Model thế hệ mới nhất, chi tiết cực cao.',
        pros: ['Chi tiết cực cao', 'Ánh sáng chân thực', 'Hỗ trợ Upscale 4K'],
        cons: ['Giới hạn số lượng (100/ngày)', 'Có thể không ổn định (Preview)']
      },
      'veo-3.1-fast-generate-preview': {
        name: 'Veo 3.1 Fast (Turbo)',
        desc: 'Video tốc độ cao. Yêu cầu bật Billing.',
        pros: ['Render nhanh', 'Phù hợp test chuyển động'],
        cons: ['Cần trả phí (Pay-as-you-go)', 'Không có Free Tier']
      },
      'veo-3.1-generate-preview': {
        name: 'Veo 3.1 Standard (Cinema)',
        desc: 'Chất lượng điện ảnh. Yêu cầu bật Billing.',
        pros: ['Chất lượng tốt nhất', 'Vật lý chân thực'],
        cons: ['Chi phí cao', 'Thời gian chờ >60s', 'Cần thẻ thanh toán']
      }
    },

    // Metadata Localization
    upscale_meta: {
      'gemini-3-pro-image-preview': {
        desc: '✅ KHUYÊN DÙNG: Model duy nhất hỗ trợ Upscale 4K Native. Tối ưu hóa chi tiết nhỏ mà không làm biến đổi khuôn mặt.',
        pros: ['Độ phân giải 4K thực', 'Giữ nguyên đặc điểm nhận dạng', 'Tái tạo texture da và vải chân thực'],
        cons: ['Xử lý chậm hơn Flash', 'Giới hạn 100 ảnh/ngày']
      },
      'gemini-2.5-flash-image': {
        desc: 'Upscale Cơ Bản (Draft): Phù hợp để test nhanh bố cục. Không tối ưu cho ảnh người thật.',
        pros: ['Tốc độ cực nhanh (<3s)', 'Miễn phí hoàn toàn', 'Tốt cho ảnh đồ họa'],
        cons: ['Chỉ tăng kích thước, không thêm chi tiết', 'Bệt màu da', 'Không sắc nét']
      }
    },
    enhance_meta: {
      'gemini-3-pro-image-preview': {
        desc: '✅ KHUYÊN DÙNG: Phục hồi ảnh cũ/mờ chuyên nghiệp. Tái tạo chi tiết bị mất do rung tay hoặc thiếu sáng.',
        pros: ['Khử nhiễu cực tốt', 'Làm nét ảnh bị rung', 'Cân bằng lại ánh sáng/màu sắc'],
        cons: ['Xử lý lâu hơn Flash', 'Giới hạn 100 ảnh/ngày']
      },
      'gemini-2.5-flash-image': {
        desc: 'Enhance Cơ Bản: Tự động cân chỉnh màu sắc và độ sáng. Phù hợp ảnh đời thường.',
        pros: ['Tốc độ tức thì', 'Làm tươi màu ảnh', 'Miễn phí hoàn toàn'],
        cons: ['Khả năng khử mờ kém hơn Pro', 'Không tái tạo được chi tiết đã mất']
      }
    }
  },
  [Language.EN]: {
    // Header
    nav_try_on: 'Virtual Try-On',
    nav_video: 'AI Video Creator',
    nav_text_to_video: 'Text to Video',
    nav_studio: 'AI Photo Studio',
    nav_analysis: 'Video Analysis',
    nav_library: 'My Library',
    brand_sub: 'AI Fashion Laboratory',
    engine_active: 'Engine Active',
    
    // Themes
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_system: 'System',
    
    // Virtual Try-On
    step_intelligence: '1. Intelligence Core',
    step_model: '2. Model Entity',
    step_fabric: '3. Fabric Source',
    step_environment: '4. Environment',
    step_directives: '5. AI Directives',
    label_model_engine: 'INTELLIGENCE ENGINE (MODEL)',
    
    label_upload_portrait: 'Upload Portrait/Full body',
    label_upload_garment: 'Upload Garment Image',
    label_upload_background: 'Upload Background Image',
    label_upscale: 'Upscale 4K',
    
    bg_mode_original: 'Original',
    bg_mode_ai: 'AI Scene',
    bg_mode_custom: 'Custom',
    bg_placeholder_ai: 'Describe the scene: Paris street, luxury hotel lobby, sunset pool…',
    bg_preserving: 'Preserving original scene',
    prompt_placeholder_tryon: 'Specific instructions: Tucked in, rolled sleeves, oversized fit, moody lighting…',
    tag_tucked: 'Tucked in',
    tag_loose: 'Loose fit',
    tag_rolled: 'Rolled sleeves',
    tag_studio: 'Studio Light',
    
    label_upload_studio_source: 'Upload image for processing',
    label_upscale_res: 'Target Resolution',
    label_2k: '2K (Standard)',
    label_4k: '4K (Ultra HD)',
    label_upscale_desc_2k: 'Optimized for Web/Social',
    label_upscale_desc_4k: 'Maximum crisp detail',

    // Image Upload hints
    upload_hint: 'Click to upload',
    upload_limit: 'PNG, JPG up to 10MB',
    remove_img: 'Remove image',
    
    // Video Creator
    step_video_visual: '2. Visual Source',
    step_video_motion: '3. Motion Dynamics',
    step_timeline: '4. Timeline',
    step_text_video_prompt: '2. Concept Description',
    label_visual_concept: 'VISUAL CONCEPT',
    label_motion_style: 'STYLE & MOTION',
    label_upload_video_source: 'Upload Base Image',
    prompt_placeholder_video: 'Describe motion: Catwalk walk, wind blowing hair, slight camera zoom…',
    duration_label: 'Duration',
    timeline_fast: 'Fast',
    timeline_cinematic: 'Cinematic',

    // Video Analysis Output
    step_analysis_upload: '2. Video Stream Upload',
    video_upload_placeholder: 'Drop or select video asset (MP4, MOV)',
    video_upload_limit: 'Max 50MB. Auto-segmentation enabled.',
    step_studio_mode: '2. Studio Mode',
    studio_mode_create: 'Create',
    studio_mode_refine: 'Refine',
    studio_mode_magnify: 'Magnify',
    prompt_placeholder_studio: 'Describe the masterpiece: Cyberpunk city, oil painting portrait, minimal product shot…',
    
    // Common
    generate_btn: 'Generate',
    generating_btn: 'Processing…',
    manifest_btn: 'Manifest Creation',
    synthesizing: 'Synthesizing…',
    result_title: 'Final Output',
    reset_btn: 'Reset Workspace',
    download_btn: 'Secure Download',
    label_download_hq: 'Download High Quality Image',
    awaiting_directives: 'Awaiting Directives',
    
    // Model Info Card
    capabilities: 'Capabilities',
    strengths: 'Strengths',
    constraints: 'Constraints',
    recommended: 'Recommended',
    enterprise_notice: 'Enterprise model. Token billing applies.',
    
    // Analysis
    analysis_title: 'Neural Storyboard',
    analysis_subtitle: 'Semantic Video Deconstruction',
    analysis_new_btn: 'Analyze New Stream',
    copy_prompt: 'Copy Prompt',
    visual_prompt: 'Visual Prompt',
    audio_context: 'Audio Context',
    tech_spec: 'Technical Spec',
    object_manifest: 'Object Manifest',
    full_reset: 'Reset Workspace',
    library_empty: 'Your library is empty. Go ahead and create your first masterpiece!',
    library_delete_confirm: 'Are you sure you want to delete this item from your local library?',
    library_clear_all: 'Clear All Library',
    library_storage_info: 'Data is stored securely right in your browser (Local Storage).',
    library_item_type: 'Type: ',
    library_item_model: 'Model: ',
    library_item_date: 'Date: ',
    
    // Messages
    error_apiKey: 'Please provide an API Key to continue',
    loading_generic: 'Our neural engines are processing your request…',
    video_wait: 'Video takes 1-2 minutes. Please wait.',
    missing_input: 'Missing input images',
    missing_video: 'Please upload a video to analyze.',
    missing_studio_img: 'Please upload an image to process.',
    missing_studio_prompt: 'Please enter an image description.',
    tag_cinematic: 'Cinematic',
    tag_drone: 'Drone Shot',
    tag_hyper: 'Hyper-realistic',
    gen_failed: 'Generation failed. Please try again.',
    invalid_key_msg: 'Please select or enter a valid API Key to continue.',

    // API Modal
    modal_key_title: 'AI Engine Configuration',
    modal_key_desc: 'Connect your Google AI Studio API Key to unlock all premium features (Veo 3.1, Imagen 3, Gemini 3 Pro).',
    modal_key_placeholder: 'Paste your API Key here…',
    modal_key_save: 'Save Configuration',
    modal_key_get: 'Get Free API Key',
    modal_key_status: 'Status: ',
    modal_key_status_active: 'Connected',
    modal_key_status_missing: 'Disconnected',
    modal_key_hint: 'Hint: Your key is stored securely in your browser.',

    // Models Localization
    models: {
      'gemini-2.5-flash-image': {
        name: 'Gemini 2.5 Flash (High Speed)',
        desc: 'Optimized speed (<3s), free & stable.',
        pros: ['100% Free', 'Ultra-fast speed', 'Stable weight for Production'],
        cons: ['Medium resolution', 'Fair fabric physics']
      },
      'gemini-3-pro-image-preview': {
        name: 'Gemini 3 Pro (High Quality)',
        desc: 'Latest generation model, high detail.',
        pros: ['Extreme detail', 'Realistic lighting', '4K Upscale support'],
        cons: ['Limited quantity (100/day)', 'May be unstable (Preview)']
      },
      'veo-3.1-fast-generate-preview': {
        name: 'Veo 3.1 Fast (Turbo)',
        desc: 'High-speed video. Billing required.',
        pros: ['Fast render', 'Great for motion tests'],
        cons: ['Paid (Pay-as-you-go)', 'No Free Tier']
      },
      'veo-3.1-generate-preview': {
        name: 'Veo 3.1 Standard (Cinema)',
        desc: 'Cinematic quality. Billing required.',
        pros: ['Best quality', 'Realistic physics'],
        cons: ['High cost', 'Wait time >60s', 'Payment card required']
      }
    },

    // Metadata Localization
    upscale_meta: {
      'gemini-3-pro-image-preview': {
        desc: '✅ RECOMMENDED: Native 4K Upscale. Optimizes small details without altering identified features.',
        pros: ['Native 4K Resolution', 'Preserves identity characteristics', 'Realistic skin/fabric texture'],
        cons: ['Slower than Flash', 'Limited 100/day']
      },
      'gemini-2.5-flash-image': {
        desc: 'Basic Upscale (Draft): Suitable for quick layout tests. Not optimized for real people.',
        pros: ['Ultra-fast (<3s)', '100% Free', 'Good for graphic art'],
        cons: ['Size increase only, no new detail', 'Flat skin tones', 'Not ultra-sharp']
      }
    },
    enhance_meta: {
      'gemini-3-pro-image-preview': {
        desc: '✅ RECOMMENDED: Professional old/blurry photo restoration.',
        pros: ['Excellent Denoise', 'Deblur shaky shots', 'Rebalances light/color'],
        cons: ['Slower than Flash', 'Limited 100/day']
      },
      'gemini-2.5-flash-image': {
        desc: 'Basic Enhance: Auto-tone and brightness adjustment. Good for phone snapshots.',
        pros: ['Instant speed', 'Freshens colors', '100% Free'],
        cons: ['Weaker deblur than Pro', 'Cannot restore lost detail']
      }
    }
  }
};
