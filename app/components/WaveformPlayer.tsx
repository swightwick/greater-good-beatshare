"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface Song {
  id: string;
  name: string;
  url: string;
  bpm: number | null;
}

interface WaveformPlayerProps {
  song: Song;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  isLiked: boolean;
  onToggleLike: () => void;
}

export default function WaveformPlayer({
  song,
  isPlaying,
  onPlay,
  onStop,
  isLiked,
  onToggleLike,
}: WaveformPlayerProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Trigger load only when the card scrolls into view (or is near it)
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // start loading 200px before entering viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Create and load WaveSurfer only after the card enters the viewport
  useEffect(() => {
    if (!hasEntered || !containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#4B5563",
      progressColor: "#826921",
      cursorColor: "#826921",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64,
      normalize: true,
      backend: "WebAudio",
    });

    ws.load(song.url);

    ws.on("ready", () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on("audioprocess", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("finish", () => {
      onStop();
      ws.seekTo(0);
    });

    wavesurferRef.current = ws;

    return () => {
      try { ws.destroy(); } catch { /* abort from in-flight fetch on unmount — safe to ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEntered, song.url]);

  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReady) return;

    if (isPlaying) {
      ws.play();
    } else {
      ws.pause();
      ws.seekTo(0);
    }
  }, [isPlaying, isReady]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const downloadBtn = (extraClass: string) => (
    <a
      href={song.url}
      download
      className={`${extraClass} items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white`}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      Download
    </a>
  );

  return (
    <div ref={outerRef} className="group flex flex-col gap-3 shadow-xl rounded-2xl bg-neutral-800 border border-neutral-700 p-5 transition-all hover:border-neutral-700">
      {/* Song header */}
      <div className="flex flex-col gap-2">
        {/* Row 1: name + time (+ download on desktop) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base font-semibold text-white truncate capitalize">
              {song.name}
            </span>
            {song.bpm != null && (
              <span className="flex-shrink-0 text-xs font-medium text-gold bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5 tabular-nums">
                {Math.round(song.bpm)} BPM
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
            {/* Time */}
            <span className="text-xs text-neutral-500 tabular-nums">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
            {/* Download — desktop only */}
            {downloadBtn("hidden sm:flex")}
            {/* Like button — desktop only */}
            <button
              onClick={onToggleLike}
              className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                isLiked
                  ? "bg-gold border-gold text-white"
                  : "border-neutral-700 text-neutral-400 hover:border-gold hover:text-gold"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              {isLiked ? "Liked" : "Like"}
            </button>
          </div>
        </div>
      </div>

      {/* Waveform + play button row */}
      <div className="flex items-center gap-4">
        {/* Play/Stop button */}
        <button
          onClick={isPlaying ? onStop : onPlay}
          disabled={!isReady}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isReady
              ? "bg-gold hover:bg-gold-hover text-white cursor-pointer"
              : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
          }`}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
            </svg>
          )}
        </button>

        {/* Waveform with loading spinner */}
        <div className="relative flex-1 min-w-0 h-16">
          <div ref={containerRef} className="w-full" />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin text-neutral-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Like + Download — mobile only, full-width row at bottom */}
      <div className="flex sm:hidden gap-2">
        <button
          onClick={onToggleLike}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all border ${
            isLiked
              ? "bg-gold border-gold text-white"
              : "border-neutral-700 text-neutral-400 hover:border-gold hover:text-gold"
          }`}
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          {isLiked ? "Liked" : "Like"}
        </button>
        {downloadBtn("flex flex-1 justify-center")}
      </div>
    </div>
  );
}
