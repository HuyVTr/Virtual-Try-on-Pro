import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface VideoPlayerProps {
    src: string;
    className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(currentProgress);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seekTime = (parseFloat(e.target.value) / 100) * (videoRef.current?.duration || 0);
        if (videoRef.current) {
            videoRef.current.currentTime = seekTime;
            setProgress(parseFloat(e.target.value));
        }
    };

    const toggleFullScreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    return (
        <div className={`relative group/player rounded-2xl overflow-hidden bg-black shadow-2xl ${className}`}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
                autoPlay
                loop
            />

            {/* Overlay Controls */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
                {/* Progress Bar */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1.5 mb-4 accent-indigo-500 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors">
                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                        </div>
                        
                        {/* Time Display */}
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                            {videoRef.current ? Math.floor(videoRef.current.currentTime) : 0}s / {Math.floor(duration)}s
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                         <button onClick={() => {
                             if (videoRef.current) videoRef.current.currentTime = 0;
                         }} className="text-white hover:text-indigo-400 transition-colors">
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={toggleFullScreen} className="text-white hover:text-indigo-400 transition-colors">
                            <Maximize size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Large Center Play Icon when paused */}
            {!isPlaying && (
                <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-transform hover:scale-110">
                        <Play size={32} className="text-white ml-1" fill="white" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
