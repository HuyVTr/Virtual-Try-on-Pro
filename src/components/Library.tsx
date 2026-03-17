import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteFromLibrary, clearLibrary } from '../services/db';
import { Download, Trash2, Calendar, Database, ImageIcon, Film, FileText, Search, Zap, Maximize2 } from 'lucide-react';
import { Language, AssetType, SavedItem } from '../types';
import { translations } from '../translations';

interface LibraryProps {
  lang: Language;
  onPreview: (url: string) => void;
}

const DeleteConfirmModal: React.FC<{ 
  onConfirm: () => void; 
  onCancel: () => void; 
  title: string;
  message: string;
}> = ({ onConfirm, onCancel, title, message }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in" onClick={onCancel} />
    <div className="relative glass-card p-8 max-w-sm w-full space-y-6 border-rose-500/20 shadow-2xl shadow-rose-500/10 animate-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
        <Trash2 size={32} className="text-rose-500" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-[var(--text-main)]">{title}</h3>
        <p className="text-sm text-slate-500 font-medium">{message}</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-white/5 border border-[var(--glass-border)] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-[background-color,color] text-slate-400"
        >
          Hủy
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-600 transition-[background-color] shadow-lg shadow-rose-500/20"
        >
          Xóa ngay
        </button>
      </div>
    </div>
  </div>
);

const Library: React.FC<LibraryProps> = ({ lang, onPreview }) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<AssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const items = useLiveQuery(
    async () => {
      let collection = db.library.reverse();
      if (filter !== 'all') {
        collection = db.library.where('type').equals(filter).reverse();
      }
      const results = await collection.toArray();
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return results.filter((item: SavedItem) => 
          item.prompt.toLowerCase().includes(query) || 
          item.model.toLowerCase().includes(query)
        );
      }
      return results;
    },
    [filter, searchQuery]
  );

  const handleDownload = (item: SavedItem) => {
    const link = document.createElement('a');
    link.href = item.data;
    link.download = `GemLab_${item.type}_${Date.now()}.${item.type === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async () => {
    if (deletingItemId) {
      await deleteFromLibrary(deletingItemId);
      setDeletingItemId(null);
    }
  };

  const confirmClearAll = async () => {
    await clearLibrary();
    setShowClearAllModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Search & Filter Header */}
      <div className="glass-card p-6 flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
                type="text" 
                placeholder="Search prompt or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/20 dark:bg-white/5 border border-[var(--glass-border)] rounded-2xl focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-[border-color,box-shadow] outline-none text-sm font-medium"
                aria-label="Search library"
            />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {[
                { id: 'all', label: 'All', icon: Database },
                { id: 'image', label: 'Images', icon: ImageIcon },
                { id: 'video', label: 'Videos', icon: Film },
                { id: 'analysis', label: 'Analysis', icon: FileText }
            ].map((btn) => (
                <button
                    key={btn.id}
                    onClick={() => setFilter(btn.id as any)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-[background-color,border-color,box-shadow,color] whitespace-nowrap border ${filter === btn.id ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                >
                    <btn.icon size={14} />
                    {btn.label}
                </button>
            ))}
        </div>
      </div>

      {/* Library Grid */}
      {!items || items.length === 0 ? (
        <div className="glass-card py-24 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                <Database size={40} className="text-slate-600 animate-pulse" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-[var(--text-main)]">{t.library_empty}</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
                    {t.library_storage_info}
                </p>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item: SavedItem) => (
                <div key={item.id} className="glass-card group/card overflow-hidden flex flex-col hover:border-indigo-500/30 transition-[border-color,box-shadow,transform] duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                    {/* Preview Area */}
                    <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                        {item.type === 'video' ? (
                            <video src={item.data} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" />
                        ) : (
                            <img src={item.data} alt={item.prompt} className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" />
                        )}
                        
                        {/* Type Badge */}
                        <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-white border border-white/10 flex items-center gap-2">
                            {item.type === 'video' ? <Film size={12} /> : item.type === 'analysis' ? <FileText size={12} /> : <ImageIcon size={12} />}
                            {item.type}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                                onClick={() => onPreview(item.data)}
                                className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-xl border border-white/20"
                                title="View Details"
                                aria-label="View Details"
                            >
                                <Maximize2 size={18} />
                            </button>
                            <button 
                                onClick={() => handleDownload(item)}
                                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-xl"
                                title="Download"
                                aria-label="Download asset"
                            >
                                <Download size={18} />
                            </button>
                            <button 
                                onClick={() => setDeletingItemId(item.id!)}
                                className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-xl"
                                title="Delete"
                                aria-label="Delete asset"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Info Area */}
                    <div className="p-5 flex-grow flex flex-col gap-4">
                        <div className="flex-grow">
                             <p className="text-xs font-medium text-[var(--text-main)] line-clamp-3 italic opacity-80 group-hover/card:opacity-100 transition-opacity">
                                "{item.prompt}"
                            </p>
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-500 flex items-center gap-2">
                                    <Zap size={12} /> {item.model}
                                </span>
                                <span className="text-slate-600 flex items-center gap-2">
                                    <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Footer Actions */}
      {items && items.length > 0 && (
          <div className="flex justify-between items-center py-6 border-t border-[var(--glass-border)]">
              <p className="text-xs text-slate-500 font-medium">
                  {t.library_storage_info}
              </p>
              <button 
                onClick={() => setShowClearAllModal(true)}
                className="flex items-center gap-3 px-6 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-[background-color,color] font-black text-[10px] uppercase tracking-widest"
              >
                  <Trash2 size={14} /> {t.library_clear_all}
              </button>
          </div>
      )}

      {/* Popups */}
      {deletingItemId !== null && (
        <DeleteConfirmModal 
          title="Xác nhận xóa"
          message={t.library_delete_confirm}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingItemId(null)}
        />
      )}

      {showClearAllModal && (
        <DeleteConfirmModal 
          title="Xóa toàn bộ thư viện"
          message="Bạn có chắc chắn muốn xóa toàn bộ tác phẩm trong thư viện? Hành động này không thể hoàn tác."
          onConfirm={confirmClearAll}
          onCancel={() => setShowClearAllModal(false)}
        />
      )}
    </div>
  );
};

export default Library;
