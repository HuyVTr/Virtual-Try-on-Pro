import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, Shirt, RefreshCw, AlertCircle, Download,
  MessageSquare, Video, Zap, Info, Palette, Image as ImageIcon,
  Type, LayoutPanelTop, GalleryHorizontalEnd,
  Clapperboard, FileVideo, Copy, Database,
  Sun, Moon, Monitor, Check, X, Maximize2, Clock, Wind,
  Quote, Camera
} from 'lucide-react';
import FloatingBackground from './components/FloatingBackground';
import { ImageUpload } from './components/ImageUpload';
import { ApiKeyModal } from './components/ApiKeyModal';
import VideoPlayer from './components/VideoPlayer';
import {
  GenerationStatus, AppModule, Language, Theme,
  AVAILABLE_MODELS, BackgroundConfig, UploadedImage,
  BackgroundMode, UPSCALE_MODEL_METADATA, ENHANCE_MODEL_METADATA
} from './types';
import { translations } from './translations';
import { generateTryOnImage, generateVideo, generateTextToVideo, generateStudioImage, analyzeVideoContent, checkApiKeyAvailability } from './services/geminiService';
import { saveToLibrary } from './services/db';
import Library from './components/Library';


// Simple Image Preview Modal
const ImagePreviewModal: React.FC<{ url: string; onClose: () => void; lang: Language }> = ({ url, onClose, lang }) => {
  const t_modal = translations[lang];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl transition-[opacity] animate-in fade-in" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-[background-color,transform] z-10"
        aria-label="Close preview"
      >
        <X size={24} />
      </button>
      <div className="relative max-w-7xl max-h-full transition-transform animate-in zoom-in-95 duration-300">
        {url.startsWith('data:video/') || url.endsWith('.mp4') ? (
          <video 
            src={url} 
            controls 
            autoPlay 
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border border-white/10" 
          />
        ) : (
          <img src={url} alt="Full Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10" />
        )}
        <div className="mt-4 flex justify-center">
          <a
            href={url}
            download={`gemlab_${Date.now()}.${(url.startsWith('data:video/') || url.endsWith('.mp4')) ? 'mp4' : 'png'}`}
            className="px-6 py-3 bg-white text-slate-900 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-[background-color,transform] active:scale-95"
          >
            <Download size={16} />
            {t_modal.label_download_hq}
          </a>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.VI);
  const t = translations[lang];

  // Theme Management
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('gemlab-theme') as Theme;
    return saved || Theme.SYSTEM;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    localStorage.setItem('gemlab-theme', theme);

    if (theme === Theme.SYSTEM) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const isDark = mediaQuery.matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
        if (isDark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.add('light');
          root.classList.remove('dark');
        }
      };
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme === Theme.DARK ? 'dark' : 'light');
      if (theme === Theme.DARK) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const [currentModule, setCurrentModule] = useState<AppModule>(AppModule.TRY_ON);

  // States cho Try-On
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [garmentImage, setGarmentImage] = useState<UploadedImage | null>(null);
  const [tryOnUserPrompt, setTryOnUserPrompt] = useState<string>('');
  const [tryOnBackgroundConfig, setTryOnBackgroundConfig] = useState<BackgroundConfig>({
    bgMode: 'DEFAULT',
    bgDescription: '',
    bgImage: null,
  });

  // States cho Video Creator
  const [videoImage, setVideoImage] = useState<UploadedImage | null>(null);
  const [videoUserPrompt, setVideoUserPrompt] = useState<string>('');
  const [textToVideoUserPrompt, setTextToVideoUserPrompt] = useState<string>('');

  // States cho AI Photo Studio
  const [studioMode, setStudioMode] = useState<'TEXT_TO_IMAGE' | 'ENHANCE' | 'UPSCALE'>('TEXT_TO_IMAGE');
  const [studioImage, setStudioImage] = useState<UploadedImage | null>(null);
  const [studioUserPrompt, setStudioUserPrompt] = useState<string>('');
  const [upscaleResolution] = useState<'2K' | '4K'>('2K');

  // States cho Video Analysis
  const [analysisVideoFile, setAnalysisVideoFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);

  // Global Session States
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-2.5-flash-image');
  const [moduleStatus, setModuleStatus] = useState<Record<AppModule, GenerationStatus>>({
    [AppModule.TRY_ON]: GenerationStatus.IDLE,
    [AppModule.VIDEO]: GenerationStatus.IDLE,
    [AppModule.TEXT_TO_VIDEO]: GenerationStatus.IDLE,
    [AppModule.STUDIO]: GenerationStatus.IDLE,
    [AppModule.VIDEO_ANALYSIS]: GenerationStatus.IDLE,
    [AppModule.LIBRARY]: GenerationStatus.IDLE,
  });
  const [moduleErrors, setModuleErrors] = useState<Record<AppModule, string | null>>({
    [AppModule.TRY_ON]: null,
    [AppModule.VIDEO]: null,
    [AppModule.TEXT_TO_VIDEO]: null,
    [AppModule.STUDIO]: null,
    [AppModule.VIDEO_ANALYSIS]: null,
    [AppModule.LIBRARY]: null,
  });
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [textToVideoResult, setTextToVideoResult] = useState<string | null>(null);
  const [studioResult, setStudioResult] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Lọc model theo module hiện tại
  const compatibleModels = useMemo(() => {
    return AVAILABLE_MODELS.filter(m => m.supportedModules.includes(currentModule));
  }, [currentModule]);

  useEffect(() => {
    checkKey();
  }, []);

  // Set default model when module changes
  useEffect(() => {
    if (currentModule === AppModule.VIDEO || currentModule === AppModule.TEXT_TO_VIDEO) {
      setSelectedModelId('veo-3.1-fast-generate-preview');
    } else if (currentModule === AppModule.STUDIO && studioMode === 'TEXT_TO_IMAGE') {
      setSelectedModelId('imagen-3.0-generate-001');
    } else if (currentModule === AppModule.STUDIO && (studioMode === 'ENHANCE' || studioMode === 'UPSCALE')) {
      setSelectedModelId('gemini-3-pro-image-preview');
    } else {
      setSelectedModelId('gemini-2.5-flash-image');
    }
  }, [currentModule, studioMode]);

  const checkKey = async () => {
    const available = await checkApiKeyAvailability();
    setHasApiKey(available);
  };

  const handleGenerate = async () => {
    if (!hasApiKey) {
      setShowKeyModal(true);
      return;
    }

    const moduleToRun = currentModule;
    setModuleStatus(prev => ({ ...prev, [moduleToRun]: GenerationStatus.LOADING }));
    setModuleErrors(prev => ({ ...prev, [moduleToRun]: null }));

    // Reset kết quả của module hiện tại trước khi tạo mới
    if (moduleToRun === AppModule.TRY_ON) setTryOnResult(null);
    else if (moduleToRun === AppModule.VIDEO) setVideoResult(null);
    else if (moduleToRun === AppModule.TEXT_TO_VIDEO) setTextToVideoResult(null);
    else if (moduleToRun === AppModule.STUDIO) setStudioResult(null);

    try {
      let result: string | null = null;
      if (moduleToRun === AppModule.TRY_ON) {
        if (!personImage || !garmentImage) throw new Error(t.missing_input);
        result = await generateTryOnImage(personImage, garmentImage, tryOnUserPrompt, selectedModelId, tryOnBackgroundConfig);
        setTryOnResult(result);
      } else if (moduleToRun === AppModule.VIDEO) {
        if (!videoImage) throw new Error(t.missing_input);
        result = await generateVideo(videoImage, videoUserPrompt, selectedModelId);
        setVideoResult(result);
      } else if (moduleToRun === AppModule.TEXT_TO_VIDEO) {
        if (!textToVideoUserPrompt) throw new Error(t.missing_studio_prompt);
        result = await generateTextToVideo(textToVideoUserPrompt, selectedModelId);
        setTextToVideoResult(result);
      } else if (moduleToRun === AppModule.STUDIO) {
        if (studioMode === 'TEXT_TO_IMAGE' && !studioUserPrompt) throw new Error(t.missing_studio_prompt);
        if ((studioMode === 'ENHANCE' || studioMode === 'UPSCALE') && !studioImage) throw new Error(t.missing_studio_img);

        result = await generateStudioImage(studioMode, studioUserPrompt, studioImage, selectedModelId, upscaleResolution);
        setStudioResult(result);
      } else if (moduleToRun === AppModule.VIDEO_ANALYSIS) {
        if (!analysisVideoFile) throw new Error(t.missing_video);
        const analysis = await analyzeVideoContent(analysisVideoFile, selectedModelId);
        setAnalysisResults(analysis);
        setModuleStatus(prev => ({ ...prev, [moduleToRun]: GenerationStatus.SUCCESS }));
        return;
      }

      setModuleStatus(prev => ({ ...prev, [moduleToRun]: GenerationStatus.SUCCESS }));

      // Tự động lưu vào Thư viện local
      if (result) {
        const type = (moduleToRun === AppModule.VIDEO || moduleToRun === AppModule.TEXT_TO_VIDEO) ? 'video' : 'image';
        const prompt = moduleToRun === AppModule.TRY_ON ? tryOnUserPrompt :
          moduleToRun === AppModule.VIDEO ? videoUserPrompt :
          moduleToRun === AppModule.TEXT_TO_VIDEO ? textToVideoUserPrompt : studioUserPrompt;

        await saveToLibrary({
          type,
          data: result,
          prompt: prompt || 'AI Generated Asset',
          model: selectedModelId,
          module: moduleToRun
        });
      }

    } catch (err: any) {
      console.error(err);
      const errorMessage = (err.message || t.gen_failed);
      if (errorMessage === "API_KEY_INVALID") {
        setHasApiKey(false);
        setShowKeyModal(true);
        setModuleErrors(prev => ({ ...prev, [moduleToRun]: t.invalid_key_msg }));
      } else {
        setModuleErrors(prev => ({ ...prev, [moduleToRun]: errorMessage }));
      }
      setModuleStatus(prev => ({ ...prev, [moduleToRun]: GenerationStatus.ERROR }));
    }
  };

  const handleReset = () => {
    if (currentModule === AppModule.TRY_ON) setTryOnResult(null);
    else if (currentModule === AppModule.VIDEO) setVideoResult(null);
    else if (currentModule === AppModule.TEXT_TO_VIDEO) {
      setTextToVideoResult(null);
      setTextToVideoUserPrompt('');
    }
    else if (currentModule === AppModule.STUDIO) setStudioResult(null);
    else if (currentModule === AppModule.VIDEO_ANALYSIS) {
      setAnalysisResults([]);
      setAnalysisVideoFile(null);
    }
    
    setModuleStatus(prev => ({ ...prev, [currentModule]: GenerationStatus.IDLE }));
    setModuleErrors(prev => ({ ...prev, [currentModule]: null }));
  };

  const selectedModel = useMemo(() => {
    const baseModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId);
    if (!baseModel) return null;

    // Apply specific metadata overrides for Studio modes
    if (currentModule === AppModule.STUDIO) {
      if (studioMode === 'UPSCALE') {
        return { ...baseModel, ...UPSCALE_MODEL_METADATA[selectedModelId] };
      } else if (studioMode === 'ENHANCE') {
        return { ...baseModel, ...ENHANCE_MODEL_METADATA[selectedModelId] };
      }
    }
    return baseModel;
  }, [selectedModelId, currentModule, studioMode]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 relative ${resolvedTheme === 'dark' ? 'dark text-white' : 'light text-slate-900'} bg-transparent`}>
      <FloatingBackground theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT} />

      {/* Premium Header */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl border-b border-[var(--glass-border)] bg-[var(--glass-header-bg)] py-3 sm:py-4 shadow-lg glass-reflection">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer" onClick={() => setCurrentModule(AppModule.TRY_ON)}>
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-rose-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-500">
              <Sparkles className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tighter bg-gradient-to-r from-[var(--text-main)] to-indigo-400 bg-clip-text text-transparent leading-none">GEM-LAB 3.1</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">{t.brand_sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1 flex gap-0.5 sm:gap-1 mr-1 sm:mr-2 shadow-sm">
              {[
                { id: Theme.LIGHT, icon: Sun },
                { id: Theme.DARK, icon: Moon },
                { id: Theme.SYSTEM, icon: Monitor }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTheme(item.id)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-[background-color,color,box-shadow,transform] ${theme === item.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:text-indigo-400 dark:hover:text-slate-200'}`}
                  title={translations[lang][`theme_${item.id}` as keyof typeof t] as string}
                  aria-label={`Set theme to ${item.id}`}
                >
                  <item.icon size={12} className="sm:w-[14px] sm:h-[14px]" />
                </button>
              ))}
            </div>

            <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl p-1 flex gap-0.5 sm:gap-1 mr-2 sm:mr-4 shadow-sm">
              {[Language.VI, Language.EN].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black transition-[background-color,color,box-shadow] ${lang === l ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-400 dark:hover:text-slate-300'}`}
                  aria-label={`Switch language to ${l === Language.VI ? 'Vietnamese' : 'English'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowKeyModal(true)}
              className={`group hidden sm:flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500 ${hasApiKey ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'}`}
            >
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500 shadow-[0_0_10px_rgb(52,211,153)]' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {hasApiKey ? t.engine_active : 'Engine Offline'}
              </span>
            </button>


            <button 
              className="text-[var(--text-muted)] hover:text-indigo-400 transition-colors"
              aria-label="Application Information"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Global Navigation */}
      <div className="max-w-5xl mx-auto mt-6 sm:mt-10 px-4 sm:px-6 w-full perspective-1000">
        <div className="glass-card glass-reflection depth-shadow p-1.5 rounded-3xl sm:rounded-[2rem] flex sm:flex-wrap items-center overflow-x-auto sm:justify-center gap-1 relative z-10 scrollbar-hide snap-x">
          {[
            { id: AppModule.TRY_ON, label: t.nav_try_on, icon: Shirt, color: 'from-indigo-600 to-indigo-400' },
            { id: AppModule.VIDEO, label: t.nav_video, icon: Video, color: 'from-purple-600 to-purple-400' },
            { id: AppModule.TEXT_TO_VIDEO, label: t.nav_text_to_video, icon: Sparkles, color: 'from-blue-600 to-blue-400' },
            { id: AppModule.STUDIO, label: t.nav_studio, icon: GalleryHorizontalEnd, color: 'from-rose-600 to-rose-400' },
            { id: AppModule.VIDEO_ANALYSIS, label: t.nav_analysis, icon: Clapperboard, color: 'from-teal-600 to-teal-400' },
            { id: AppModule.LIBRARY, label: t.nav_library, icon: Database, color: 'from-indigo-600 to-rose-400' }
          ].map((module) => (
            <button
              key={module.id}
              onClick={() => setCurrentModule(module.id)}
              className={`flex-1 min-w-[120px] sm:min-w-[140px] py-3 sm:py-4 rounded-2xl sm:rounded-[1.5rem] font-bold text-[11px] sm:text-sm flex items-center justify-center gap-2 sm:gap-3 transition-all duration-500 relative overflow-hidden group snap-center ${currentModule === module.id ? 'text-white' : 'text-[var(--text-muted)] hover:text-indigo-400 dark:hover:text-slate-200'}`}
            >
              {currentModule === module.id && (
                <div className={`absolute inset-0 bg-gradient-to-r ${module.color} opacity-100 animate-in fade-in duration-500`} />
              )}
              <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                <module.icon size={16} className={currentModule === module.id ? 'animate-pulse' : 'group-hover:scale-110 transition-[transform]'} />
                <span className="whitespace-nowrap">{module.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 w-full">


        {/* Library Module (Full Width) */}
        {currentModule === AppModule.LIBRARY && (
          <Library lang={lang} onPreview={setPreviewImage} />
        )}

        {/* Module Specific Content */}
        {currentModule !== AppModule.LIBRARY && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* Input Section */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700 perspective-1000">

              {/* Model Selection UI - Refined */}
              <div className="glass-card glass-reflection depth-shadow p-5 space-y-4 border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Zap size={16} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-main)]">{t.label_model_engine}</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {compatibleModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModelId(model.id)}
                      className={`px-4 py-3 rounded-xl border text-[11px] font-bold tracking-tight transition-all flex items-center gap-3 relative group/btn overflow-hidden ${selectedModelId === model.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 dark:bg-white/[0.02] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-hover-bg)] hover:text-[var(--text-main)]'}`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${selectedModelId === model.id ? 'bg-white/20' : 'bg-slate-500/10'}`}>
                        {selectedModelId === model.id ? <Check size={12} className="text-white" /> : <div className="w-1 h-1 rounded-full bg-slate-500" />}
                      </div>
                      <span className="truncate">{(t.models as any)[model.id]?.name || model.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Info Card - Refined */}
              {selectedModel && (
                <div className="group glass-card p-8 overflow-hidden relative border-indigo-500/10 dark:border-indigo-500/10 shadow-xl">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Zap size={60} className="text-indigo-500 dark:text-indigo-400" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                        <Sparkles className="text-indigo-500 dark:text-indigo-400" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl tracking-tighter text-[var(--text-main)]">
                          {(t.models as any)[selectedModel.id]?.name || selectedModel.name}
                        </h3>
                        <div className="h-0.5 w-12 bg-gradient-to-r from-indigo-500 to-transparent mt-1" />
                      </div>
                    </div>

                    <p className="text-sm text-[var(--text-main)] mb-8 font-medium leading-relaxed opacity-80 italic">
                      {(() => {
                        if (currentModule === AppModule.STUDIO) {
                          if (studioMode === 'UPSCALE') return (t as any).upscale_meta[selectedModel.id]?.desc || selectedModel.description;
                          if (studioMode === 'ENHANCE') return (t as any).enhance_meta[selectedModel.id]?.desc || selectedModel.description;
                        }
                        return (t.models as any)[selectedModel.id]?.desc || selectedModel.description;
                      })()}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-[var(--glass-border)]">
                      <div className="space-y-4">
                        <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          {t.strengths}
                        </h4>
                        <ul className="space-y-3">
                          {(() => {
                            let pros = (t.models as any)[selectedModel.id]?.pros || selectedModel.pros;
                            if (currentModule === AppModule.STUDIO) {
                              if (studioMode === 'UPSCALE') pros = (t as any).upscale_meta[selectedModel.id]?.pros || pros;
                              if (studioMode === 'ENHANCE') pros = (t as any).enhance_meta[selectedModel.id]?.pros || pros;
                            }
                            return pros.map((pro: string, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-xs font-bold text-[var(--text-main)] leading-snug">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                {pro}
                              </li>
                            ));
                          })()}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-bold text-[11px] uppercase tracking-[0.3em] text-rose-600 dark:text-rose-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          {t.constraints}
                        </h4>
                        <ul className="space-y-3">
                          {(() => {
                            let cons = (t.models as any)[selectedModel.id]?.cons || selectedModel.cons;
                            if (currentModule === AppModule.STUDIO) {
                              if (studioMode === 'UPSCALE') cons = (t as any).upscale_meta[selectedModel.id]?.cons || cons;
                              if (studioMode === 'ENHANCE') cons = (t as any).enhance_meta[selectedModel.id]?.cons || cons;
                            }
                            return cons.map((con: string, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-xs font-bold text-[var(--text-main)] leading-snug">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-500 shrink-0" />
                                {con}
                              </li>
                            ));
                          })()}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inputs based on Module */}
              <div className="glass-card p-8 space-y-8 shadow-2xl relative overflow-hidden">
                {currentModule === AppModule.TRY_ON && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                      <ImageUpload
                        label={t.label_upload_portrait}
                        onImageChange={setPersonImage}
                        image={personImage}
                      />
                      <ImageUpload
                        label={t.label_upload_garment}
                        onImageChange={setGarmentImage}
                        image={garmentImage}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <Palette size={16} className="text-indigo-400" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">{t.step_environment}</label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'DEFAULT', label: t.bg_mode_original, icon: Sparkles },
                          { id: 'TEXT_PROMPT', label: t.bg_mode_ai, icon: Type },
                          { id: 'IMAGE_UPLOAD', label: t.bg_mode_custom, icon: ImageIcon }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setTryOnBackgroundConfig(prev => ({ ...prev, bgMode: mode.id as BackgroundMode }))}
                            className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-bold text-xs ${tryOnBackgroundConfig.bgMode === mode.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-hover-bg)]'}`}
                          >
                            <mode.icon size={16} />
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      {tryOnBackgroundConfig.bgMode === 'TEXT_PROMPT' && (
                        <div className="relative group/input animate-in slide-in-from-top-2 duration-300">
                          <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400 group-focus-within/input:scale-110 transition-transform" size={18} />
                          <input
                            type="text"
                            placeholder={t.bg_placeholder_ai}
                            value={tryOnBackgroundConfig.bgDescription}
                            onChange={(e) => setTryOnBackgroundConfig(prev => ({ ...prev, bgDescription: e.target.value }))}
                            className="w-full pl-12 pr-4 py-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500 text-sm font-medium text-[var(--text-main)]"
                          />
                        </div>
                      )}

                      {tryOnBackgroundConfig.bgMode === 'IMAGE_UPLOAD' && (
                        <ImageUpload
                          label={t.label_upload_background}
                          onImageChange={(img) => setTryOnBackgroundConfig(prev => ({ ...prev, bgImage: img }))}
                          image={tryOnBackgroundConfig.bgImage}
                        />
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                          <MessageSquare size={16} className="text-rose-500 dark:text-rose-400" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">{t.step_directives}</label>
                      </div>
                      <textarea
                        placeholder={t.prompt_placeholder_tryon}
                        value={tryOnUserPrompt}
                        onChange={(e) => setTryOnUserPrompt(e.target.value)}
                        className="w-full p-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all min-h-[120px] placeholder:text-slate-500 text-sm font-medium text-[var(--text-main)] leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                )}

                {currentModule === AppModule.VIDEO && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <ImageUpload
                      label={t.label_upload_video_source}
                      onImageChange={setVideoImage}
                      image={videoImage}
                    />
                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-2">{t.step_video_motion}</label>
                      <textarea
                        placeholder={t.prompt_placeholder_video}
                        value={videoUserPrompt}
                        onChange={(e) => setVideoUserPrompt(e.target.value)}
                        className="w-full p-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all min-h-[120px] placeholder:text-slate-500 text-sm font-medium text-[var(--text-main)] leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                )}

                {currentModule === AppModule.TEXT_TO_VIDEO && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Step 2: Visual Concept */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Clapperboard size={16} className="text-blue-500" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">{t.label_visual_concept}</label>
                      </div>
                      <textarea
                        placeholder={t.prompt_placeholder_video}
                        value={textToVideoUserPrompt}
                        onChange={(e) => setTextToVideoUserPrompt(e.target.value)}
                        className="w-full p-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all min-h-[140px] placeholder:text-slate-500 text-sm font-medium text-[var(--text-main)] leading-relaxed resize-none"
                      />
                    </div>

                    {/* Step 3: Style & Motion */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Wind size={16} className="text-purple-500" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">{t.label_motion_style}</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[t.tag_cinematic, t.tag_drone, t.tag_hyper, 'FPV Shot', 'Golden Hour'].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setTextToVideoUserPrompt(prev => prev + (prev ? ', ' : '') + tag)}
                            className="px-3 py-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] text-[10px] font-bold text-[var(--text-muted)] hover:bg-purple-500 hover:text-white hover:border-purple-400 transition-all uppercase tracking-wider"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 4: Timeline (UI only for consistency) */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <Clock size={16} className="text-indigo-400" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">{t.step_timeline}</label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">{t.duration_label}</span>
                          <span className="text-xs font-black text-indigo-500">6s</span>
                        </div>
                        <div className="p-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl flex items-center justify-between opacity-50">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">FPS</span>
                          <span className="text-xs font-black text-indigo-500">24</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentModule === AppModule.STUDIO && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                          <LayoutPanelTop size={16} className="text-rose-500 dark:text-rose-400" />
                        </div>
                        <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)]">{t.step_studio_mode}</label>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'TEXT_TO_IMAGE', label: t.studio_mode_create, icon: Type },
                          { id: 'ENHANCE', label: t.studio_mode_refine, icon: Sparkles },
                          { id: 'UPSCALE', label: t.studio_mode_magnify, icon: ImageIcon }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => setStudioMode(mode.id as any)}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all font-bold text-xs ${studioMode === mode.id ? 'bg-rose-600 border-rose-400 text-white shadow-lg' : 'bg-[var(--input-bg)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-hover-bg)]'}`}
                          >
                            <mode.icon size={20} />
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {studioMode !== 'TEXT_TO_IMAGE' && (
                      <ImageUpload
                        label={t.label_upload_studio_source}
                        onImageChange={setStudioImage}
                        image={studioImage}
                      />
                    )}

                    <div className="space-y-4">
                      <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-2">
                        {studioMode === 'TEXT_TO_IMAGE' ? t.prompt_placeholder_studio : t.step_directives}
                      </label>
                      <textarea
                        placeholder={t.prompt_placeholder_studio}
                        value={studioUserPrompt}
                        onChange={(e) => setStudioUserPrompt(e.target.value)}
                        className="w-full p-4 bg-[var(--input-bg)] border border-[var(--glass-border)] rounded-2xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all min-h-[120px] placeholder:text-slate-500 text-sm font-medium text-[var(--text-main)] leading-relaxed resize-none"
                      />
                    </div>
                  </div>
                )}

                {currentModule === AppModule.VIDEO_ANALYSIS && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] block">{t.label_upload_video_source}</label>
                      <div className="relative group">
                        <div 
                          className={`
                            border-2 border-dashed rounded-[2rem] p-12 text-center transition-all min-h-[280px] flex flex-col items-center justify-center relative overflow-hidden
                            ${analysisVideoFile 
                              ? 'border-teal-500/30 bg-teal-500/5' 
                              : 'border-[var(--glass-border)] border-[var(--glass-border)] hover:border-teal-500/50 hover:bg-teal-500/5'}
                          `}
                        >
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setAnalysisVideoFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title=""
                          />
                          
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border transition-all duration-500 ${analysisVideoFile ? 'bg-teal-500/20 border-teal-500/30 scale-110' : 'bg-white/5 border-[var(--glass-border)] dark:border-white/10 group-hover:scale-110 group-hover:border-teal-500/30'}`}>
                            <FileVideo className={analysisVideoFile ? 'text-teal-500' : 'text-slate-500 group-hover:text-teal-500'} size={36} />
                          </div>

                          <div className="space-y-2 relative z-20">
                            <h4 className="text-sm font-black text-[var(--text-main)] tracking-tight px-4 max-w-xs truncate">
                              {analysisVideoFile ? analysisVideoFile.name : t.video_upload_placeholder}
                            </h4>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-600">
                              {analysisVideoFile ? (analysisVideoFile.size / (1024 * 1024)).toFixed(2) + ' MB' : t.video_upload_limit}
                            </p>
                          </div>

                          {analysisVideoFile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnalysisVideoFile(null);
                              }}
                              className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all z-20 hover:scale-110 active:scale-90"
                              title={t.remove_img}
                            >
                              <X size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={moduleStatus[currentModule] === GenerationStatus.LOADING}
                  className={`w-full py-5 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 transition-all duration-500 relative overflow-hidden group shadow-2xl ${moduleStatus[currentModule] === GenerationStatus.LOADING ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 text-white hover:shadow-indigo-500/25 dark:hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {moduleStatus[currentModule] === GenerationStatus.LOADING && <RefreshCw className="animate-spin" size={20} />}
                  <span className="relative z-10 text-sm font-bold">
                    {moduleStatus[currentModule] === GenerationStatus.LOADING ? t.generating_btn : t.manifest_btn}
                  </span>
                  {moduleStatus[currentModule] !== GenerationStatus.LOADING && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-transparent to-rose-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                  )}
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div className="space-y-8 animate-in slide-in-from-right duration-700">
              {moduleStatus[currentModule] === GenerationStatus.LOADING ? (
                <div className="glass-card glass-reflection depth-shadow p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[600px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-rose-500/5" />
                  <div className="relative">
                    <div className="w-32 h-32 border-2 border-indigo-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-0 w-32 h-32 border-t-2 border-indigo-600 dark:border-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-4 w-24 h-24 border-2 border-rose-500/20 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
                    <div className="absolute inset-4 w-24 h-24 border-t-2 border-rose-600 dark:border-rose-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles size={30} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">{t.synthesizing}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 font-medium max-w-[280px] leading-relaxed">
                      {currentModule === AppModule.VIDEO ? t.video_wait : t.loading_generic}
                    </p>
                  </div>

                  <div className="flex gap-2 relative z-10">
                    <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-purple-600 dark:bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-rose-600 dark:bg-rose-500 rounded-full animate-bounce" />
                  </div>
                </div>
              ) : moduleErrors[currentModule] ? (
                <div className="glass-card glass-reflection depth-shadow p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
                  <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
                    <AlertCircle className="text-rose-500" size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-rose-500 uppercase tracking-widest">Error Ocurred</h3>
                    <p className="text-sm text-[var(--text-main)] font-medium max-w-sm">{moduleErrors[currentModule]}</p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-8 py-3 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] hover:bg-[var(--glass-hover-bg)] transition-all"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  {/* 1. KẾT QUẢ CHO TRY-ON / VIDEO / STUDIO */}
                  {(() => {
                    const currentResult = 
                      currentModule === AppModule.TRY_ON ? tryOnResult : 
                      currentModule === AppModule.VIDEO ? videoResult : 
                      currentModule === AppModule.TEXT_TO_VIDEO ? textToVideoResult :
                      currentModule === AppModule.STUDIO ? studioResult : null;
                    
                    if (!currentResult) return null;

                    return (
                      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-1000">
                        <div className="glass-card glass-reflection depth-shadow overflow-hidden group/result relative">
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover/result:opacity-100 transition-opacity duration-1000" />
                          <div className="bg-black aspect-[4/5] sm:aspect-square md:aspect-video flex items-center justify-center relative">
                            {currentModule !== AppModule.VIDEO && currentModule !== AppModule.TEXT_TO_VIDEO ? (
                              <div className="relative w-full h-full cursor-zoom-in group/img" onClick={() => setPreviewImage(currentResult)}>
                                <img src={currentResult} alt="Result" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                                    <Maximize2 className="text-white" size={24} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <VideoPlayer src={currentResult} />
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={handleReset}
                            className="flex-1 px-8 py-5 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] text-[var(--text-main)] hover:bg-[var(--glass-hover-bg)] transition-all flex items-center justify-center gap-3 group"
                          >
                            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
                            {t.reset_btn}
                          </button>
                          <a
                            href={currentResult}
                            download={`gemlab_${Date.now()}.${(currentModule === AppModule.VIDEO || currentModule === AppModule.TEXT_TO_VIDEO) ? 'mp4' : 'png'}`}
                            className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                          >
                            <Download size={18} />
                            {t.download_btn}
                          </a>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. KẾT QUẢ CHO VIDEO ANALYSIS */}
                  {currentModule === AppModule.VIDEO_ANALYSIS && analysisResults.length > 0 && (
                    <div className="space-y-8 animate-in fade-in duration-1000">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-1 text-[var(--text-main)]">{t.analysis_title}</h2>
                          <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 tracking-[0.3em] uppercase">{t.analysis_subtitle}</p>
                        </div>
                        <button
                          onClick={() => setAnalysisResults([])}
                          className="px-6 py-2.5 bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500/20 transition-all font-bold"
                        >
                          {t.analysis_new_btn}
                        </button>
                      </div>

                      <div className="space-y-12">
                        {analysisResults.map((scene, index) => (
                          <div key={index} className="group relative">
                            {/* Storyboard Connector */}
                            <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-teal-500/50 via-teal-500/10 to-transparent" />
                            <div className="absolute -left-[31px] top-6 w-4 h-4 rounded-full bg-teal-500 ring-4 ring-teal-500/20 flex items-center justify-center text-[8px] text-white font-black z-10">
                              {index + 1}
                            </div>

                            <div className="glass-card glass-reflection depth-shadow hover:border-teal-500/40 transition-all duration-500 overflow-hidden">
                              <div className="flex flex-col">
                                {/* Row 1: Visual Stage (Image & Prompt) */}
                                <div className="p-6 md:p-8 bg-black/10 dark:bg-black/30 border-b border-[var(--glass-border)]">
                                  <div className="flex flex-col gap-8">
                                    {/* Top Side: Frame & Time */}
                                    <div className="w-full space-y-5">
                                      <div className="relative group/frame rounded-2xl overflow-hidden border border-white/5 shadow-2xl cursor-zoom-in bg-black/40" onClick={() => scene.frameBase64 && setPreviewImage(scene.frameBase64)}>
                                        {scene.frameBase64 ? (
                                          <img src={scene.frameBase64} alt={`Frame ${index}`} className="w-full h-auto max-h-[600px] object-contain group-hover:scale-[1.02] transition-transform duration-700" />
                                        ) : (
                                          <div className="w-full h-[200px] flex items-center justify-center bg-slate-900">
                                            <ImageIcon className="text-slate-800" size={30} />
                                          </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/frame:opacity-100 transition-opacity flex items-center justify-center">
                                          <Maximize2 className="text-white" size={24} />
                                        </div>
                                        <div className="absolute top-4 left-4">
                                          <div className="px-3 py-1.5 bg-teal-500/90 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-2xl">
                                            Frame {index + 1}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between px-2 bg-white/5 p-3 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                                            <Clock size={14} className="text-teal-500" />
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter leading-none">Timeline</span>
                                            <span className="text-xs font-black text-[var(--text-main)] tracking-widest uppercase">
                                              {scene.timestamp || '00:00'}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)] animate-pulse" />
                                      </div>
                                    </div>

                                    {/* Bottom Side: Visual Narrative (The Prompt) */}
                                    <div className="w-full space-y-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Sparkles size={14} className="text-teal-500" />
                                          <h4 className="font-black text-teal-600 dark:text-teal-400 text-[10px] uppercase tracking-[0.3em]">{t.visual_prompt}</h4>
                                        </div>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(scene.visual_prompt)}
                                          className="p-2 rounded-lg bg-white/5 hover:bg-teal-500 hover:text-white transition-[background-color,color,transform] border border-white/10 shadow-sm active:scale-95"
                                          title={t.copy_prompt}
                                          aria-label={t.copy_prompt}
                                        >
                                          <Copy size={12} />
                                        </button>
                                      </div>
                                      <div className="bg-white/5 dark:bg-black/40 p-6 rounded-2xl border border-[var(--glass-border)] text-[13px] text-[var(--text-main)] font-semibold leading-relaxed italic shadow-inner relative">
                                        <Quote size={30} className="absolute -top-3 -left-3 text-teal-500/10" />
                                        <p className="relative z-10 w-full line-clamp-6">"{scene.visual_prompt}"</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Row 2: Intelligence Grid (Technical Details) */}
                                <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 bg-white/[0.02]">
                                  {/* Technical Specifications */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-fit">
                                      <Camera size={14} className="text-slate-500" />
                                      <h4 className="font-black text-slate-500 text-[9px] uppercase tracking-[0.2em]">{t.tech_spec}</h4>
                                    </div>
                                    <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/10">
                                      <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-loose">
                                        {scene.tech_specs || 'N/A'}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Audio & Soundscape */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-fit">
                                      <Wind size={14} className="text-slate-500" />
                                      <h4 className="font-black text-slate-500 text-[9px] uppercase tracking-[0.2em]">{t.audio_context}</h4>
                                    </div>
                                    <p className="text-xs font-medium text-[var(--text-muted)] italic leading-relaxed pl-2 border-l-2 border-teal-500/20">
                                      {scene.audio || 'Ambient noise.'}
                                    </p>
                                  </div>

                                  {/* AI Object Recognition */}
                                  <div className="col-span-1 sm:col-span-2 space-y-3 pt-4 border-t border-[var(--glass-border)]">
                                    <div className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-fit">
                                      <Zap size={14} className="text-slate-500" />
                                      <h4 className="font-black text-slate-500 text-[9px] uppercase tracking-[0.2em]">{t.object_manifest}</h4>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(scene.items || []).map((item: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-500/5 dark:bg-white/5 border border-slate-500/10 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[8px] font-black rounded-lg uppercase tracking-widest">
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. TRẠNG THÁI TRỐNG (Khi chưa có kết quả cho module hiện tại) */}
                  {(() => {
                    const hasResult = 
                      (currentModule === AppModule.TRY_ON && tryOnResult) ||
                      (currentModule === AppModule.VIDEO && videoResult) ||
                      (currentModule === AppModule.TEXT_TO_VIDEO && textToVideoResult) ||
                      (currentModule === AppModule.STUDIO && studioResult) ||
                      (currentModule === AppModule.VIDEO_ANALYSIS && analysisResults.length > 0);
                    
                    if (!hasResult) {
                      return (
                        <div className="glass-card glass-reflection depth-shadow p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[600px] border-dashed border-indigo-500/10">
                          <div className="w-24 h-24 bg-indigo-500/5 dark:bg-white/5 rounded-full flex items-center justify-center animate-pulse border border-indigo-500/10 dark:border-white/5 shadow-inner">
                            <Sparkles className="text-indigo-400 dark:text-slate-700" size={40} />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-400 dark:text-slate-700 uppercase tracking-widest">{t.awaiting_directives}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-600 font-medium max-w-[250px] mx-auto italic">
                              "Start your creation by filling the blueprint on the left"
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </div>
          </div>
        )}

      </main>

      {/* API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        lang={lang}
        onKeySave={() => {
          checkKey();
          setShowKeyModal(false);
        }}
      />

      {/* Fullscreen Image Preview */}
      {previewImage && (
        <ImagePreviewModal url={previewImage} onClose={() => setPreviewImage(null)} lang={lang} />
      )}
    </div>
  );
};

export default App;