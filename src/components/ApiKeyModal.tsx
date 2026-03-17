import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, X, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { translations } from '../translations';
import { Language } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onKeySave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, lang, onKeySave }) => {
  const t = translations[lang];
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SAVED'>('IDLE');

  useEffect(() => {
    const savedKey = localStorage.getItem('gem_lab_api_key');
    if (savedKey) setInputValue(savedKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!inputValue.trim()) return;
    localStorage.setItem('gem_lab_api_key', inputValue.trim());
    onKeySave(inputValue.trim());
    setStatus('SAVED');
    setTimeout(() => {
        setStatus('IDLE');
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-[var(--glass-border)] rounded-[2.5rem] shadow-2xl dark:shadow-[0_0_50px_rgba(99,102,241,0.2)] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 dark:bg-indigo-600/20 blur-[60px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-600/10 dark:bg-rose-600/20 blur-[60px] rounded-full" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all z-10"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="p-10 space-y-8 relative z-10">
          {/* Icon & Title */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3 transition-transform duration-500">
              <Key size={38} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight pt-2">{t.modal_key_title}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mx-auto font-semibold tracking-tight">
              {t.modal_key_desc}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="relative group">
              <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.modal_key_placeholder}
                aria-label="API Key"
                className="w-full pl-12 pr-6 py-5 bg-[var(--input-bg)] border border-slate-200 dark:border-[var(--glass-border)] rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-slate-900 dark:text-white font-mono text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
              />
              <ShieldCheck size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 dark:text-indigo-400 opacity-50" />
            </div>

            <button
              onClick={handleSave}
              disabled={status === 'SAVED'}
              className={`w-full py-5 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500 shadow-xl ${status === 'SAVED' ? 'bg-green-600 text-white shadow-green-500/20' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200'}`}
            >
              {status === 'SAVED' ? (
                  <>
                    <Zap size={18} className="fill-white" />
                    {t.modal_key_status_active}
                  </>
                ) : (
                  <>
                    {t.modal_key_save}
                  </>
                )}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-4 text-center">
             <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 group transition-all"
            >
              <ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              {t.modal_key_get}
            </a>
            
            <div className="pt-4 flex items-center justify-center gap-2 border-t border-slate-100 dark:border-white/5 opacity-80 dark:opacity-50">
               <AlertCircle size={12} className="text-slate-400 dark:text-slate-500" />
               <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                 {t.modal_key_hint}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};