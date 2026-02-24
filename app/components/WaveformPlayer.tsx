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
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#4B5563",
      progressColor: "#F97316",
      cursorColor: "#F97316",
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
      ws.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.url]);

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

  return (
    <div className="group flex flex-col gap-3 rounded-2xl bg-neutral-900 border border-neutral-800 p-5 transition-all hover:border-neutral-700">
      {/* Song header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base font-semibold text-white truncate capitalize">
            {song.name}
          </span>
          {song.bpm != null && (
            <span className="flex-shrink-0 text-xs font-medium text-orange-500 bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5 tabular-nums">
              {Math.round(song.bpm)} BPM
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          {/* Time */}
          <span className="text-xs text-neutral-500 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>
          {/* Download button */}
          <a
            href={song.url}
            download
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </a>
          {/* Like button */}
          <button
            onClick={onToggleLike}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border ${
              isLiked
                ? "bg-orange-500 border-orange-500 text-white"
                : "border-neutral-700 text-neutral-400 hover:border-orange-500 hover:text-orange-500"
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

      {/* Waveform + play button row */}
      <div className="flex items-center gap-4">
        {/* Play/Stop button */}
        <button
          onClick={isPlaying ? onStop : onPlay}
          disabled={!isReady}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isReady
              ? "bg-orange-500 hover:bg-orange-400 text-white cursor-pointer"
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

        {/* Waveform */}
        <div ref={containerRef} className="flex-1 min-w-0" />
      </div>
    </div>
  );
}
