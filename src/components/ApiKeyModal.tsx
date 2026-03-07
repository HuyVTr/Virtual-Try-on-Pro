import React from 'react';
import { Key, ExternalLink } from 'lucide-react';
import { openApiKeySelection } from '../services/geminiService';

interface ApiKeyModalProps {
  onKeySelected: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySelected }) => {
  const handleSelectKey = async () => {
    await openApiKeySelection();
    // Optimistically assume success to trigger re-check in parent
    onKeySelected();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
          <Key size={32} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Unlock Pro Features</h2>
          <p className="text-slate-600">
            To generate high-quality try-on images with Gemini 3 Pro, you need to connect your Google Cloud API key.
          </p>
        </div>

        <button
          onClick={handleSelectKey}
          className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
        >
          Select API Key
        </button>

        <div className="pt-4 border-t border-slate-100">
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
          >
            Learn about billing <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};