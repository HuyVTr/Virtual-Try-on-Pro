import React, { useMemo } from 'react';
import { Theme } from '../types';
import {
  Shirt, Sparkles, Cpu, Camera, Scissors, Wand2,
  BrainCircuit, Glasses, Palette, Film, Gem
} from 'lucide-react';

interface FloatingBackgroundProps {
  theme: Theme;
}

const FloatingBackground: React.FC<FloatingBackgroundProps> = ({ theme }) => {
  const isDark = theme === Theme.DARK;

  // Curation of fashion and AI related icons with high visibility
  const floatingElements = useMemo(() => {
    const icons = [
      Shirt, Sparkles, Cpu, Camera, Scissors, Wand2,
      BrainCircuit, Glasses, Palette, Film, Gem
    ];

    return Array.from({ length: 22 }).map((_, i) => ({
      Icon: icons[i % icons.length],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 8 + 22, // Larger icons
      duration: Math.random() * 10 + 20,
      delay: Math.random() * 5,
      // Significant visibility boost for Light mode
      opacity: isDark ? (Math.random() * 0.1 + 0.05) : (Math.random() * 0.2 + 0.15),
    }));
  }, [isDark]);

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden transition-colors duration-700 ${isDark ? 'bg-[#050505]' : 'bg-[#f8fafc]'}`}>
      
      {/* LAYER 1: Dynamic Mesh Gradients (Bottom-most) */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        <div className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-pulse duration-[15s] ${
          isDark ? 'bg-indigo-600/10' : 'bg-indigo-400/12'
        }`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] animate-pulse duration-[10s] delay-700 ${
          isDark ? 'bg-rose-600/10' : 'bg-rose-400/12'
        }`} />
      </div>

      {/* LAYER 2: 3D Icons & Project Items (Middle / Under the Grid) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Meaningful 3D Project Items */}
        <div className={`absolute top-[18%] left-[12%] px-5 py-2.5 rounded-2xl border backdrop-blur-sm animate-float hidden md:flex items-center gap-3 shadow-2xl ${
          isDark ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-300/50' : 'border-indigo-200/30 bg-white/40 text-indigo-500/50'
        }`}>
          <div className="p-1.5 bg-indigo-500/10 rounded-lg">
            <Cpu size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Neural Engine</span>
        </div>
        
        <div className={`absolute bottom-[20%] right-[15%] px-5 py-2.5 rounded-2xl border backdrop-blur-sm animate-float-slow hidden md:flex items-center gap-3 shadow-2xl rotate-[-4deg] ${
          isDark ? 'border-rose-500/20 bg-rose-500/5 text-rose-300/50' : 'border-rose-200/30 bg-white/40 text-rose-500/50'
        }`}>
          <div className="p-1.5 bg-rose-500/10 rounded-lg">
            <Shirt size={18} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Try-On</span>
        </div>

        {/* Thematic Floating Icons */}
        {floatingElements.map((el, i) => (
          <div
            key={i}
            className={`absolute transition-opacity duration-1000`}
            style={{
              left: el.left,
              top: el.top,
              animation: `float ${el.duration}s ease-in-out infinite`,
              animationDelay: `${el.delay}s`,
              opacity: el.opacity * (isDark ? 0.6 : 0.4), // Muted because they are 'behind' the grid
            }}
          >
            <el.Icon size={el.size} className={isDark ? 'text-indigo-400/40' : 'text-indigo-500/30'} />
          </div>
        ))}
      </div>

      {/* LAYER 3: Precise Digital Grid with 3D Energy Wave (Top-most background layer) */}
      <div className="absolute inset-0 overflow-hidden transform-gpu z-10" style={{ perspective: '1200px' }}>
        <div className="absolute inset-0 [transform:rotateX(15deg)_translateY(-5%)]">
          {/* Static Base Grid */}
          <div className={`absolute inset-0 ${isDark
            ? 'bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#6366f112_1px,transparent_1px),linear-gradient(to_bottom,#6366f112_1px,transparent_1px)]'
          } bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]`} />
          
          {/* The Wave (Energy Pulse) - Pulse that sweeps through the grid lines */}
          <div className={`absolute inset-0 animate-grid-wave ${isDark
            ? 'bg-[linear-gradient(to_right,#6366f130_1px,transparent_1px),linear-gradient(to_bottom,#6366f130_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#6366f150_1px,transparent_1px),linear-gradient(to_bottom,#6366f150_1px,transparent_1px)]'
          } bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]`} />
        </div>
      </div>

      {/* Clean Texture Grain (Finishing touch on top of everything) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 pointer-events-none z-20" />
    </div>
  );
};

export default FloatingBackground;
