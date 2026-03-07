import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Shirt, User, RefreshCw, AlertCircle, Download, MessageSquare, Video, Camera, Zap, Info, Palette, Image as ImageIcon, Type, ShoppingCart, Clock, LayoutPanelTop, GalleryHorizontalEnd, Maximize, Clapperboard, FileVideo, Copy } from 'lucide-react';
import { ImageUpload } from './components/ImageUpload';
import { ApiKeyModal } from './components/ApiKeyModal';
import { UploadedImage, GenerationStatus, AppModule, StudioMode, Model, AVAILABLE_MODELS, BackgroundMode, BackgroundConfig, UPSCALE_MODEL_METADATA, ENHANCE_MODEL_METADATA, SceneAnalysis } from './types';
import { generateTryOnImage, generateVideo, generateStudioImage, analyzeVideoContent, checkApiKeyAvailability } from './services/geminiService';

const App: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<AppModule>(AppModule.TRY_ON);
  
  const modelsForCurrentModule = useMemo(() => AVAILABLE_MODELS.filter(m => m.supportedModules.includes(currentModule)), [currentModule]);
  
  const [selectedModelId, setSelectedModelId] = useState<string>(modelsForCurrentModule[0]?.id || '');
  const [modelDetails, setModelDetails] = useState<Model | null>(modelsForCurrentModule[0] || null);

  // Try-On Module States
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [garmentImage, setGarmentImage] = useState<UploadedImage | null>(null);
  const [tryOnUserPrompt, setTryOnUserPrompt] = useState<string>('');
  const [tryOnBackgroundConfig, setTryOnBackgroundConfig] = useState<BackgroundConfig>({
    bgMode: 'DEFAULT',
    bgDescription: '',
    bgImage: null,
  });

  // Video Module States
  const [videoImage, setVideoImage] = useState<UploadedImage | null>(null);
  const [videoUserPrompt, setVideoUserPrompt] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(4);

  // Studio Module States
  const [studioMode, setStudioMode] = useState<StudioMode>('TEXT_TO_IMAGE');
  const [studioUserPrompt, setStudioUserPrompt] = useState<string>('');
  const [studioImage, setStudioImage] = useState<UploadedImage | null>(null); // For Enhance/Upscale
  const [upscaleResolution, setUpscaleResolution] = useState<'2K' | '4K'>('4K');

  // Video Analysis Module States
  const [analysisVideoFile, setAnalysisVideoFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<SceneAnalysis[] | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  // Switch module effect
  useEffect(() => {
    const defaultModel = modelsForCurrentModule[0];
    if (defaultModel) {
        setSelectedModelId(defaultModel.id);
        setModelDetails(defaultModel);
    }

    // Reset outputs when module changes
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setStatus(GenerationStatus.IDLE);
    setError(null);
    setAnalysisResults(null);
  }, [currentModule, modelsForCurrentModule]);

  // Update model details when ID changes
  useEffect(() => {
    const foundModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
    setModelDetails(foundModel || null);
  }, [selectedModelId]);

  // Check for API key on mount
  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    const available = await checkApiKeyAvailability();
    setHasApiKey(available);
  };

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setShowKeyModal(true);
      return;
    }

    setStatus(GenerationStatus.LOADING);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);

    try {
      let result: string | null = null;
      if (currentModule === AppModule.TRY_ON) {
        if (!personImage || !garmentImage) throw new Error("Thiếu hình ảnh đầu vào");
        result = await generateTryOnImage(personImage, garmentImage, tryOnUserPrompt, selectedModelId, tryOnBackgroundConfig);
        setGeneratedImageUrl(result);
      } else if (currentModule === AppModule.VIDEO) {
        if (!videoImage) throw new Error("Thiếu ảnh gốc");
        result = await generateVideo(videoImage, videoUserPrompt, selectedModelId, videoDuration);
        setGeneratedVideoUrl(result);
      } else if (currentModule === AppModule.STUDIO) {
        if (studioMode === 'TEXT_TO_IMAGE' && !studioUserPrompt) throw new Error("Vui lòng nhập mô tả ảnh.");
        if ((studioMode === 'ENHANCE' || studioMode === 'UPSCALE') && !studioImage) throw new Error("Vui lòng tải ảnh để xử lý.");
        
        result = await generateStudioImage(studioMode, studioUserPrompt, studioImage, selectedModelId, upscaleResolution);
        setGeneratedImageUrl(result);
      } else if (currentModule === AppModule.VIDEO_ANALYSIS) {
        if (!analysisVideoFile) throw new Error("Vui lòng tải lên video để phân tích.");
        const analysis = await analyzeVideoContent(analysisVideoFile, selectedModelId);
        setAnalysisResults(analysis);
      }
      
      setStatus(GenerationStatus.SUCCESS);
      
    } catch (err: any) {
      const errorMessage = (err.message || "Tạo nội dung thất bại. Vui lòng thử lại.");
      if (errorMessage === "API_KEY_INVALID") {
        setHasApiKey(false);
        setShowKeyModal(true);
        setError("Vui lòng chọn API Key hợp lệ để tiếp tục.");
      } else {
        setError(errorMessage);
      }
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleReset = () => {
    setGeneratedImageUrl(null);
    setGeneratedVideoUrl(null);
    setStatus(GenerationStatus.IDLE);
    setError(null);
  };

  const fullReset = () => {
    setPersonImage(null);
    setGarmentImage(null);
    setTryOnUserPrompt('');
    setTryOnBackgroundConfig({
        bgMode: 'DEFAULT',
        bgDescription: '',
        bgImage: null,
    });
    setVideoImage(null);
    setVideoUserPrompt('');
    setVideoDuration(4);
    setStudioUserPrompt('');
    setStudioImage(null);
    setStudioMode('TEXT_TO_IMAGE');
    setUpscaleResolution('4K');
    setAnalysisVideoFile(null);
    setAnalysisResults(null);

    handleReset();
  };

  const handleDownload = () => {
    let url: string | null = null;
    let ext: string = '';

    if (currentModule === AppModule.TRY_ON || currentModule === AppModule.STUDIO) {
        url = generatedImageUrl;
        ext = 'png';
    } else if (currentModule === AppModule.VIDEO) {
        url = generatedVideoUrl;
        ext = 'mp4';
    }
    
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `gem-lab-result-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isPaidModel = useMemo(() => {
    if (!modelDetails) return false;
    return modelDetails.dailyLimit.includes('Billing Required');
  }, [modelDetails]);

  // Logic hiển thị thông tin model (Override nếu đang ở chế độ Upscale)
  const displayModelDetails = useMemo(() => {
    if (!modelDetails) return null;
    
    if (currentModule === AppModule.STUDIO) {
        if (studioMode === 'UPSCALE') {
            const upscaleInfo = UPSCALE_MODEL_METADATA[modelDetails.id];
            if (upscaleInfo) {
                return { ...modelDetails, ...upscaleInfo };
            }
        } else if (studioMode === 'ENHANCE') {
            const enhanceInfo = ENHANCE_MODEL_METADATA[modelDetails.id];
            if (enhanceInfo) {
                return { ...modelDetails, ...enhanceInfo };
            }
        }
    }
    return modelDetails;
  }, [modelDetails, currentModule, studioMode, UPSCALE_MODEL_METADATA, ENHANCE_MODEL_METADATA]);

  const infoCardStyles = useMemo(() => {
    if (!displayModelDetails) return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-800' };
    
    switch (displayModelDetails.id) {
        case 'gemini-2.5-flash-image':
            return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
        case 'gemini-3-pro-image-preview':
            return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' };
        case 'veo-3.1-fast-generate-preview':
        case 'veo-3.1-generate-preview':
            return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' };
        case 'imagen-3.0-generate-001':
            return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' };
        default:
            return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-800' };
    }
  }, [displayModelDetails]);


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">Gem-Lab <span className="text-indigo-600">Studio</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
             {hasApiKey && (
                 <span className="hidden md:inline-block text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-md border border-green-200">
                    API Key OK
                 </span>
             )}
          </div>
        </div>
      </header>

      {/* Global Navigation (Module Selector) */}
      <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-center gap-2">
            <button 
                onClick={() => setCurrentModule(AppModule.TRY_ON)}
                className={`flex-1 min-w-[150px] py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${currentModule === AppModule.TRY_ON ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Shirt size={16} />
                Thử Đồ Ảo
            </button>
            <button 
                onClick={() => setCurrentModule(AppModule.VIDEO)}
                className={`flex-1 min-w-[150px] py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${currentModule === AppModule.VIDEO ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Video size={16} />
                Tạo Video AI
            </button>
            <button 
                onClick={() => setCurrentModule(AppModule.STUDIO)}
                className={`flex-1 min-w-[150px] py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${currentModule === AppModule.STUDIO ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <GalleryHorizontalEnd size={16} />
                Studio Ảnh AI
            </button>
            <button 
                onClick={() => setCurrentModule(AppModule.VIDEO_ANALYSIS)}
                className={`flex-1 min-w-[150px] py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${currentModule === AppModule.VIDEO_ANALYSIS ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <Clapperboard size={16} />
                Phân Tích Video
            </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Module Specific Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Input Section */}
          <div className={`space-y-6 ${currentModule === AppModule.VIDEO_ANALYSIS && status === GenerationStatus.SUCCESS ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
            
            {/* Model Selector */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Zap size={18} className="text-slate-500" />
                <h3 className="font-semibold text-slate-800">1. Chọn Model</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modelsForCurrentModule.map(model => {
                  const isRecommended = currentModule === AppModule.STUDIO && 
                    ((studioMode === 'UPSCALE' || studioMode === 'ENHANCE') && model.id === 'gemini-3-pro-image-preview');
                  
                  return (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModelId(model.id)}
                      className={`p-3 text-left rounded-lg border transition-all h-full ${
                        selectedModelId === model.id
                          ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {isRecommended && (
                        <span className="block text-[10px] font-extrabold text-indigo-600 mb-1 flex items-center gap-1">
                            <Sparkles size={10} /> KHUYÊN DÙNG
                        </span>
                      )}
                      <p className="font-bold text-sm text-slate-800">{model.name}</p>
                    </button>
                  );
                })}
              </div>

              {/* Info Card */}
              {displayModelDetails && (
                <div className={`p-4 rounded-lg border mt-4 transition-all ${infoCardStyles.bg} ${infoCardStyles.border}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <Info size={16} className={infoCardStyles.text} />
                            <h4 className={`font-bold ${infoCardStyles.text}`}>
                                {currentModule === AppModule.STUDIO && studioMode === 'UPSCALE' ? 'Thông tin Upscale' : 
                                 currentModule === AppModule.STUDIO && studioMode === 'ENHANCE' ? 'Thông tin Enhance' : 
                                 'Thông số Model'}
                            </h4>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${infoCardStyles.bg} ${infoCardStyles.border} ${infoCardStyles.text}`}>
                           {displayModelDetails.dailyLimit}
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">{displayModelDetails.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-xs">
                        <div>
                            <p className="font-semibold text-green-700 mb-1">Ưu điểm:</p>
                            <ul className="list-disc list-inside text-slate-600 space-y-1">
                                {displayModelDetails.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                        </div>
                        <div className="mt-3 sm:mt-0">
                            <p className="font-semibold text-red-700 mb-1">Nhược điểm:</p>
                            <ul className="list-disc list-inside text-slate-600 space-y-1">
                                {displayModelDetails.cons.map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                        </div>
                    </div>
                    {isPaidModel && (
                        <div className="mt-4 p-3 rounded-md bg-white border border-purple-300 flex items-start gap-2.5">
                            <AlertCircle size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-purple-800 font-bold flex items-center gap-1">
                                <ShoppingCart size={14} /> Billing Required
                              </p>
                              <p className="text-xs text-purple-700 mt-1">
                                  Model này có thể phát sinh chi phí. Vui lòng kiểm tra tài khoản Google Cloud.
                              </p>
                            </div>
                        </div>
                    )}
                </div>
              )}
            </div>

            {/* Virtual Try-On Module Content */}
            {currentModule === AppModule.TRY_ON && (
              <div className="space-y-6">
                {/* Top Row: Image Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Person Upload */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 flex flex-col">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <User size={18} className="text-slate-500" />
                          <h3 className="font-semibold text-slate-800">2. Người mẫu</h3>
                      </div>
                      <ImageUpload
                          label="Ảnh người mẫu"
                          image={personImage}
                          onImageChange={setPersonImage}
                          disabled={status === GenerationStatus.LOADING}
                      />
                  </div>
                  {/* Garment Upload */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 flex flex-col">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Shirt size={18} className="text-slate-500" />
                          <h3 className="font-semibold text-slate-800">3. Trang phục</h3>
                      </div>
                      <ImageUpload
                          label="Ảnh trang phục"
                          image={garmentImage}
                          onImageChange={setGarmentImage}
                          disabled={status === GenerationStatus.LOADING}
                      />
                  </div>
                </div>

                {/* Bottom Row: Background & Prompt */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Background Control */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 flex flex-col h-full">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Palette size={18} className="text-slate-500" />
                          <h3 className="font-semibold text-slate-800">4. Tùy biến Bối cảnh</h3>
                      </div>
                      <div className="flex-grow flex flex-col space-y-4">
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setTryOnBackgroundConfig(c => ({...c, bgMode: 'DEFAULT'}))} className={`flex-1 text-xs font-semibold p-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${tryOnBackgroundConfig.bgMode === 'DEFAULT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Sparkles size={14}/> Giữ nguyên</button>
                            <button onClick={() => setTryOnBackgroundConfig(c => ({...c, bgMode: 'TEXT_PROMPT'}))} className={`flex-1 text-xs font-semibold p-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${tryOnBackgroundConfig.bgMode === 'TEXT_PROMPT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Type size={14}/> Mô tả</button>
                            <button onClick={() => setTryOnBackgroundConfig(c => ({...c, bgMode: 'IMAGE_UPLOAD'}))} className={`flex-1 text-xs font-semibold p-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${tryOnBackgroundConfig.bgMode === 'IMAGE_UPLOAD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><ImageIcon size={14}/> Dùng ảnh</button>
                        </div>
                        {tryOnBackgroundConfig.bgMode === 'TEXT_PROMPT' && (
                            <textarea
                                value={tryOnBackgroundConfig.bgDescription}
                                onChange={(e) => setTryOnBackgroundConfig(c => ({...c, bgDescription: e.target.value}))}
                                placeholder="Ví dụ: Quán cafe, ánh nắng chiều..."
                                disabled={status === GenerationStatus.LOADING}
                                className="w-full p-3 bg-white rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none h-20 text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 text-sm"
                            />
                        )}
                        {tryOnBackgroundConfig.bgMode === 'IMAGE_UPLOAD' && (
                            <ImageUpload
                                label="Tải ảnh nền"
                                image={tryOnBackgroundConfig.bgImage}
                                onImageChange={(img) => setTryOnBackgroundConfig(c => ({...c, bgImage: img}))}
                                disabled={status === GenerationStatus.LOADING}
                            />
                        )}
                      </div>
                    </div>
                    {/* Prompt Input */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 flex flex-col h-full">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <MessageSquare size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800">5. Yêu cầu chi tiết</h3>
                        </div>
                        <textarea
                            value={tryOnUserPrompt}
                            onChange={(e) => setTryOnUserPrompt(e.target.value)}
                            placeholder="Ví dụ: Sơ vin áo, xắn tay áo, dáng áo rộng (loose fit)..."
                            disabled={status === GenerationStatus.LOADING}
                            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-sm flex-grow"
                        />
                    </div>
                </div>
              </div>
            )}

            {/* AI Video Creator Module Content */}
            {currentModule === AppModule.VIDEO && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {/* Person Upload */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <User size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800">2. Ảnh gốc</h3>
                        </div>
                        <ImageUpload
                            label="Ảnh cần tạo chuyển động"
                            image={videoImage}
                            onImageChange={setVideoImage}
                            disabled={status === GenerationStatus.LOADING}
                        />
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Prompt Input */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <MessageSquare size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800">3. Mô tả chuyển động</h3>
                        </div>

                        <textarea
                            value={videoUserPrompt}
                            onChange={(e) => setVideoUserPrompt(e.target.value)}
                            placeholder="Ví dụ: Camera quay chậm quanh nhân vật, tóc bay trong gió, mỉm cười nhẹ..."
                            disabled={status === GenerationStatus.LOADING}
                            className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none h-28 text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-sm"
                        />
                    </div>
                     {/* Video Duration Slider */}
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <Clock size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800">4. Thời lượng video</h3>
                          </div>
                          <span className="font-bold text-indigo-600 text-sm">{videoDuration}s</span>
                        </div>
                        <div className="pt-2">
                           <input
                              type="range"
                              min="3"
                              max="8"
                              step="1"
                              value={videoDuration}
                              onChange={(e) => setVideoDuration(Number(e.target.value))}
                              disabled={status === GenerationStatus.LOADING}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full"
                           />
                        </div>
                     </div>
                  </div>
              </div>
            )}

            {/* AI Photo Studio Module Content */}
            {currentModule === AppModule.STUDIO && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <LayoutPanelTop size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800">2. Chế độ Studio</h3>
                        </div>
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setStudioMode('TEXT_TO_IMAGE')} className={`flex-1 text-xs font-semibold p-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${studioMode === 'TEXT_TO_IMAGE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Type size={14}/> Text-to-Image</button>
                            <button onClick={() => setStudioMode('ENHANCE')} className={`flex-1 text-xs font-semibold p-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${studioMode === 'ENHANCE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Sparkles size={14}/> Enhance</button>
                            <button onClick={() => setStudioMode('UPSCALE')} className={`flex-1 text-xs font-semibold p-2 rounded-md flex items-center justify-center gap-1.5 transition-all ${studioMode === 'UPSCALE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><ImageIcon size={14}/> Upscale</button>
                        </div>

                        {studioMode === 'TEXT_TO_IMAGE' && (
                            <textarea
                                value={studioUserPrompt}
                                onChange={(e) => setStudioUserPrompt(e.target.value)}
                                placeholder="Mô tả hình ảnh bạn muốn tạo..."
                                disabled={status === GenerationStatus.LOADING}
                                className="w-full p-4 bg-white rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none h-32 text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 transition-all text-sm"
                            />
                        )}

                        {(studioMode === 'ENHANCE' || studioMode === 'UPSCALE') && (
                            <ImageUpload
                                label="Tải ảnh để xử lý"
                                image={studioImage}
                                onImageChange={setStudioImage}
                                disabled={status === GenerationStatus.LOADING}
                            />
                        )}

                        {/* Upscale Resolution Selector */}
                        {studioMode === 'UPSCALE' && selectedModelId.includes('pro') && (
                            <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-200">
                                    <Maximize size={16} className="text-slate-500" />
                                    <h4 className="font-semibold text-sm text-slate-700">Độ phân giải mục tiêu</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setUpscaleResolution('2K')}
                                        className={`p-3 rounded-lg border text-left transition-all ${upscaleResolution === '2K' ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        <span className={`block text-sm font-bold ${upscaleResolution === '2K' ? 'text-indigo-700' : 'text-slate-700'}`}>2K (Standard)</span>
                                        <span className="text-xs text-slate-500 mt-1">Tối ưu cho Web/Social</span>
                                    </button>
                                    <button
                                        onClick={() => setUpscaleResolution('4K')}
                                        className={`p-3 rounded-lg border text-left transition-all ${upscaleResolution === '4K' ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        <span className={`block text-sm font-bold ${upscaleResolution === '4K' ? 'text-indigo-700' : 'text-slate-700'}`}>4K (Ultra HD)</span>
                                        <span className="text-xs text-slate-500 mt-1">Chi tiết sắc nét nhất</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Video Analysis Module Content */}
            {currentModule === AppModule.VIDEO_ANALYSIS && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <FileVideo size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800">2. Tải lên Video</h3>
                        </div>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                            <input 
                                type="file" 
                                accept="video/mp4,video/quicktime"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAnalysisVideoFile(e.target.files[0]);
                                        setAnalysisResults(null);
                                    }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={status === GenerationStatus.LOADING}
                            />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                {analysisVideoFile ? (
                                    <>
                                        <FileVideo className="w-10 h-10 text-indigo-500" />
                                        <p className="font-medium text-slate-700">{analysisVideoFile.name}</p>
                                        <p className="text-xs text-slate-500">{(analysisVideoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <Clapperboard className="w-10 h-10 text-slate-300" />
                                        <p className="font-medium text-slate-600">Kéo thả hoặc chọn video (MP4, MOV)</p>
                                        <p className="text-xs text-slate-400">Tối đa 50MB. Hệ thống sẽ tự động trích xuất khung hình.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {!(currentModule === AppModule.VIDEO_ANALYSIS && status === GenerationStatus.SUCCESS) && (
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleGenerate}
                disabled={
                    status === GenerationStatus.LOADING || 
                    (currentModule === AppModule.TRY_ON && (!personImage || !garmentImage)) ||
                    (currentModule === AppModule.VIDEO && !videoImage) ||
                    (currentModule === AppModule.STUDIO && studioMode === 'TEXT_TO_IMAGE' && !studioUserPrompt) ||
                    (currentModule === AppModule.STUDIO && (studioMode === 'ENHANCE' || studioMode === 'UPSCALE') && !studioImage) ||
                    (currentModule === AppModule.VIDEO_ANALYSIS && !analysisVideoFile)
                }
                className={`
                  relative w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-3 overflow-hidden
                  ${((currentModule === AppModule.TRY_ON && (!personImage || !garmentImage)) ||
                    (currentModule === AppModule.VIDEO && !videoImage) ||
                    (currentModule === AppModule.STUDIO && studioMode === 'TEXT_TO_IMAGE' && !studioUserPrompt) ||
                    (currentModule === AppModule.STUDIO && (studioMode === 'ENHANCE' || studioMode === 'UPSCALE') && !studioImage) ||
                    (currentModule === AppModule.VIDEO_ANALYSIS && !analysisVideoFile))
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : status === GenerationStatus.LOADING
                      ? 'bg-indigo-500 text-white cursor-wait'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/25 active:scale-[0.99]'
                  }
                `}
              >
                {status === GenerationStatus.LOADING ? (
                  <>
                    <RefreshCw className="animate-spin w-5 h-5" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    {currentModule === AppModule.TRY_ON && <Sparkles className="w-5 h-5" />}
                    {currentModule === AppModule.VIDEO && <Video className="w-5 h-5" />}
                    {currentModule === AppModule.STUDIO && <GalleryHorizontalEnd className="w-5 h-5" />}
                    {currentModule === AppModule.VIDEO_ANALYSIS && <Clapperboard className="w-5 h-5" />}
                    <span>Tạo kết quả</span>
                  </>
                )}
                
                {status === GenerationStatus.LOADING && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-[loading_2s_ease-in-out_infinite] w-full origin-left" />
                )}
              </button>
              
              {status === GenerationStatus.ERROR && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Result Section */}
          {currentModule !== AppModule.VIDEO_ANALYSIS && (
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-500" />
                  <h3 className="font-semibold text-slate-800">Kết quả</h3>
                </div>
                {status === GenerationStatus.SUCCESS && (generatedImageUrl || generatedVideoUrl) ? (
                    <div className="flex gap-2">
                        <button 
                            onClick={fullReset}
                            className="text-xs px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Làm mới
                        </button>
                    </div>
                ) : null}
              </div>

              <div className="flex-grow flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden relative group min-h-[500px]">
                {status === GenerationStatus.SUCCESS && (generatedImageUrl || generatedVideoUrl) ? (
                  <>
                    {(currentModule === AppModule.TRY_ON || currentModule === AppModule.STUDIO) && generatedImageUrl && (
                        <img 
                            src={generatedImageUrl} 
                            alt="Generated Content" 
                            className="max-w-full max-h-[80vh] object-contain shadow-md rounded-lg"
                        />
                    )}
                    
                    {currentModule === AppModule.VIDEO && generatedVideoUrl && (
                         <video 
                            src={generatedVideoUrl}
                            controls
                            autoPlay
                            loop
                            className="max-w-full max-h-[80vh] rounded-lg shadow-md"
                         />
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 pointer-events-none group-hover:pointer-events-auto">
                       <button 
                         onClick={handleDownload}
                         className="px-6 py-3 bg-white text-slate-900 rounded-full font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                       >
                         <Download size={20} /> Tải về
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400 max-w-xs px-4">
                    {status === GenerationStatus.LOADING ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <div className="space-y-1">
                                <p className="animate-pulse font-medium text-slate-600">
                                    {currentModule === AppModule.TRY_ON ? 'Đang ghép trang phục...' :
                                     currentModule === AppModule.VIDEO ? 'Đang sản xuất video...' :
                                     currentModule === AppModule.STUDIO ? 'Đang tạo hình ảnh...' :
                                     'Đang phân tích video...'
                                    }
                                </p>
                                {currentModule === AppModule.VIDEO && (
                                    <p className="text-xs text-slate-400">Video mất khoảng 1-2 phút. Vui lòng chờ.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                {currentModule === AppModule.TRY_ON && <Sparkles className="text-slate-300 w-10 h-10" />}
                                {currentModule === AppModule.VIDEO && <Video className="text-slate-300 w-10 h-10" />}
                                {currentModule === AppModule.STUDIO && <GalleryHorizontalEnd className="text-slate-300 w-10 h-10" />}
                             </div>
                             <p>
                                {currentModule === AppModule.TRY_ON 
                                    ? "Tải ảnh người mẫu và trang phục để bắt đầu." 
                                    : currentModule === AppModule.VIDEO
                                    ? "Tải ảnh và nhập mô tả để tạo video chuyển động."
                                    : "Chọn chế độ Studio và cung cấp thông tin đầu vào để tạo hình ảnh."}
                             </p>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Video Analysis Result (Full Width) */}
          {currentModule === AppModule.VIDEO_ANALYSIS && status === GenerationStatus.SUCCESS && analysisResults && (
              <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <Clapperboard className="text-indigo-600" /> Kịch bản phân cảnh (Storyboard)
                      </h3>
                      <button onClick={fullReset} className="text-sm px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-600">
                          Phân tích video khác
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                      {analysisResults.map((scene, index) => (
                          <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
                              {/* Frame Image */}
                              <div className="md:w-1/3 bg-slate-100 relative group">
                                  {scene.frameBase64 && (
                                      <img src={scene.frameBase64} alt={`Scene ${index + 1}`} className="w-full h-full object-cover min-h-[200px]" />
                                  )}
                                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                                      {scene.timestamp}
                                  </div>
                              </div>
                              
                              {/* Analysis Data */}
                              <div className="md:w-2/3 p-6 flex flex-col gap-4">
                                  <div>
                                      <div className="flex items-center justify-between mb-2">
                                          <h4 className="font-bold text-indigo-700 text-sm uppercase tracking-wider">Visual Prompt</h4>
                                          <button 
                                            onClick={() => navigator.clipboard.writeText(scene.visual_prompt)}
                                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Copy Prompt"
                                          >
                                              <Copy size={16} />
                                          </button>
                                      </div>
                                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 font-mono leading-relaxed">
                                          {scene.visual_prompt}
                                      </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                      <div>
                                          <span className="font-semibold text-slate-900 block mb-1">🔊 Âm thanh / Thoại:</span>
                                          <p className="text-slate-600">{scene.audio}</p>
                                      </div>
                                      <div>
                                          <span className="font-semibold text-slate-900 block mb-1">🎥 Thông số kỹ thuật:</span>
                                          <p className="text-slate-600">{scene.tech_specs}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

        </div>
      </main>

      {/* API Key Modal */}
      {showKeyModal && (
        <ApiKeyModal 
          onKeySelected={() => {
            setShowKeyModal(false);
            checkKey();
          }} 
        />
      )}
    </div>
  );
};

export default App;