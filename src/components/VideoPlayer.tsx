import { useState, useRef } from 'react';
import { Maximize2, Play, ExternalLink } from 'lucide-react';
import { parseDemoVideo, getSafeMediaUrl } from '../utils/media';

interface VideoPlayerProps {
  videoUrl: string;
  projectName: string;
  fallbackCover?: string;
}

export function VideoPlayer({ videoUrl, projectName, fallbackCover }: VideoPlayerProps) {
  const parsed = parseDemoVideo(videoUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (!parsed) {
    return null;
  }

  const posterUrl =
    parsed.kind === 'youtube'
      ? parsed.thumbnailUrl
      : getSafeMediaUrl(fallbackCover) ?? undefined;

  const handleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-video rounded-[4px] overflow-hidden bg-black border border-white/10">
        {!isPlaying ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${projectName} demo video thumbnail`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="w-full h-full bg-[#191919]" />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/25"
            />
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label={`Play ${projectName} demo video`}
              className="relative z-10 inline-flex items-center gap-3 px-6 py-3.5 rounded-[3px] bg-[#109E6B] hover:bg-[#0D8A5D] text-white font-medium text-sm shadow-lg transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Play Demo Video</span>
            </button>
          </div>
        ) : parsed.kind === 'youtube' ? (
          <iframe
            src={`${parsed.embedUrl}&autoplay=1`}
            title={`${projectName} demo video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : videoError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-300 space-y-3">
            <p className="text-sm">
              This video format could not be played inline in the browser.
            </p>
            <a
              href={parsed.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#109E6B] text-white rounded-[3px] hover:bg-[#0D8A5D]"
            >
              <span>Open Video Link</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={parsed.src}
              controls
              autoPlay
              playsInline
              onError={() => setVideoError(true)}
              className="w-full h-full object-contain bg-black"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <span>
          {parsed.kind === 'youtube' ? 'YouTube Embedded Player' : 'Direct Video Playback'}
        </span>
        <div className="flex items-center gap-4">
          {isPlaying && parsed.kind === 'mp4' && !videoError && (
            <button
              type="button"
              onClick={handleFullscreen}
              className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#109E6B] font-medium"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen</span>
            </button>
          )}
          <a
            href={parsed.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#109E6B] font-medium"
          >
            <span>Open Original Video</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
