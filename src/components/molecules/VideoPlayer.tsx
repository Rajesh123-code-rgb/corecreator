"use client";

import * as React from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    SkipBack,
    SkipForward,
    Loader2,
} from "lucide-react";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    onProgress?: (progress: { currentTime: number; duration: number; percentage: number }) => void;
    onComplete?: () => void;
    initialTime?: number;
    autoPlay?: boolean;
    className?: string;
}

export function VideoPlayer({
    src,
    poster,
    onProgress,
    onComplete,
    initialTime = 0,
    autoPlay = false,
    className = "",
}: VideoPlayerProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const progressRef = React.useRef<HTMLDivElement>(null);
    const progressInterval = React.useRef<NodeJS.Timeout | null>(null);

    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isMuted, setIsMuted] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showControls, setShowControls] = React.useState(true);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [volume, setVolume] = React.useState(1);
    const [playbackRate, setPlaybackRate] = React.useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = React.useState(false);
    const [buffered, setBuffered] = React.useState(0);

    const hideControlsTimeout = React.useRef<NodeJS.Timeout | null>(null);
    const hasMarkedComplete = React.useRef(false);

    const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

    // Initialize video
    React.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            if (initialTime > 0 && initialTime < video.duration) {
                video.currentTime = initialTime;
            }
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);

            // Update buffered
            if (video.buffered.length > 0) {
                setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
            }

            // Check for completion (90% watched)
            const percentage = (video.currentTime / video.duration) * 100;
            if (percentage >= 90 && !hasMarkedComplete.current) {
                hasMarkedComplete.current = true;
                onComplete?.();
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
        };

        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("ended", handleEnded);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);

        return () => {
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("ended", handleEnded);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("canplay", handleCanPlay);
        };
    }, [initialTime, onComplete]);

    // Progress callback
    React.useEffect(() => {
        if (!onProgress || !videoRef.current) return;

        progressInterval.current = setInterval(() => {
            if (videoRef.current && isPlaying) {
                onProgress({
                    currentTime: videoRef.current.currentTime,
                    duration: videoRef.current.duration,
                    percentage: (videoRef.current.currentTime / videoRef.current.duration) * 100,
                });
            }
        }, 5000); // Save progress every 5 seconds

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [isPlaying, onProgress]);

    // Auto-hide controls
    React.useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
            if (isPlaying) {
                hideControlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
            }
        };

        const container = containerRef.current;
        container?.addEventListener("mousemove", handleMouseMove);
        container?.addEventListener("mouseleave", () => isPlaying && setShowControls(false));

        return () => {
            container?.removeEventListener("mousemove", handleMouseMove);
            if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
        };
    }, [isPlaying]);

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!containerRef.current?.contains(document.activeElement)) return;

            switch (e.key) {
                case " ":
                case "k":
                    e.preventDefault();
                    togglePlay();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    skip(-10);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    skip(10);
                    break;
                case "m":
                    toggleMute();
                    break;
                case "f":
                    toggleFullscreen();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const toggleFullscreen = async () => {
        const container = containerRef.current;
        if (!container) return;

        if (!isFullscreen) {
            await container.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const skip = (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration));
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        const progressBar = progressRef.current;
        if (!video || !progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const percentage = (e.clientX - rect.left) / rect.width;
        video.currentTime = percentage * video.duration;
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current;
        if (!video) return;
        const newVolume = parseFloat(e.target.value);
        video.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const handleSpeedChange = (speed: number) => {
        const video = videoRef.current;
        if (!video) return;
        video.playbackRate = speed;
        setPlaybackRate(speed);
        setShowSpeedMenu(false);
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div
            ref={containerRef}
            className={`relative bg-black group ${className}`}
            tabIndex={0}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                autoPlay={autoPlay}
                className="w-full h-full"
                onClick={togglePlay}
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
            )}

            {/* Play Button Overlay (when paused) */}
            {!isPlaying && !isLoading && (
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-10 h-10 text-gray-900 ml-1" />
                    </div>
                </button>
            )}

            {/* Controls */}
            <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity ${showControls ? "opacity-100" : "opacity-0"
                    }`}
            >
                {/* Progress Bar */}
                <div
                    ref={progressRef}
                    className="h-1 bg-white/30 rounded-full mb-4 cursor-pointer group/progress"
                    onClick={handleProgressClick}
                >
                    {/* Buffered */}
                    <div
                        className="absolute h-1 bg-white/50 rounded-full"
                        style={{ width: `${buffered}%` }}
                    />
                    {/* Progress */}
                    <div
                        className="h-1 bg-[var(--secondary-500)] rounded-full relative"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <button onClick={togglePlay} className="hover:text-[var(--secondary-400)] transition-colors">
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>

                        {/* Skip buttons */}
                        <button onClick={() => skip(-10)} className="hover:text-[var(--secondary-400)] transition-colors">
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button onClick={() => skip(10)} className="hover:text-[var(--secondary-400)] transition-colors">
                            <SkipForward className="w-5 h-5" />
                        </button>

                        {/* Volume */}
                        <div className="flex items-center gap-2">
                            <button onClick={toggleMute} className="hover:text-[var(--secondary-400)] transition-colors">
                                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                        </div>

                        {/* Time */}
                        <span className="text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Playback Speed */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                className="flex items-center gap-1 text-sm hover:text-[var(--secondary-400)] transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                                {playbackRate}x
                            </button>
                            {showSpeedMenu && (
                                <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                                    {playbackSpeeds.map((speed) => (
                                        <button
                                            key={speed}
                                            onClick={() => handleSpeedChange(speed)}
                                            className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-700 ${speed === playbackRate ? "text-[var(--secondary-400)]" : ""
                                                }`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Fullscreen */}
                        <button
                            onClick={toggleFullscreen}
                            className="hover:text-[var(--secondary-400)] transition-colors"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
