"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import WaveformPlayer from "./WaveformPlayer";
import LogoCanvas from "./LogoCanvas";
import SocialLinks from "./SocialLinks";

interface Song {
  id: string;
  name: string;
  url: string;
  bpm: number | null;
}

const DEFAULT_ARTIST_NAME = process.env.NEXT_PUBLIC_ARTIST_NAME;
const SESSION_KEY = "bs_viewer_unlocked";

function slugToName(slug: string) {
  try { slug = decodeURIComponent(slug); } catch { /* leave as-is */ }
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BeatShareApp({ slug }: { slug?: string }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Password gate
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
    else setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    setAuthLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, type: "viewer" }),
    });
    setAuthLoading(false);
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setAuthError(true);
      setPassword("");
      inputRef.current?.focus();
    }
  };

  const artistName = slug ? slugToName(slug) : DEFAULT_ARTIST_NAME;
  const apiUrl = slug ? `/api/songs/${slug}` : "/api/songs";

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(apiUrl)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setSongs(data);
        setLoading(false);
      });
  }, [apiUrl]);

  const handlePlay = (id: string) => setPlayingId(id);
  const handleStop = () => setPlayingId(null);

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const likedSongs = songs.filter((s) => likedIds.has(s.id));

  const handleCopy = async () => {
    const text = likedSongs.map((s) => s.name).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = async (songsToZip: Song[], filename: string) => {
    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      await Promise.all(
        songsToZip.map(async (song) => {
          const res = await fetch(song.url);
          const buf = await res.arrayBuffer();
          zip.file(song.id, buf);
        })
      );

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-widest text-gold font-medium text-center mb-6">
            Private
          </p>
          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
              placeholder="Password"
              className={`w-full bg-neutral-900 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                authError ? "border-red-500" : "border-neutral-800 focus:border-neutral-600"
              }`}
            />
            {authError && (
              <p className="text-xs text-red-400 text-center">Incorrect password</p>
            )}
            <button
              type="submit"
              disabled={authLoading || !password}
              className="w-full py-3 rounded-xl bg-gold text-white text-sm font-medium hover:bg-gold-hover transition-colors disabled:opacity-40"
            >
              {authLoading ? "…" : "Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-14">
        {/* Header */}
        <div className="mb-4 text-center">
          <LogoCanvas height={200} />
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-medium mb-2 mt-2">
            Beats for
          </p>
          <h1 className="text-4xl font-bold tracking-tight mb-5">{artistName}</h1>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-neutral-400 text-sm">
              {songs.length} {songs.length === 1 ? "track" : "tracks"}
            </p>
            {songs.length > 0 && (
              <button
                onClick={() => handleDownloadAll(songs, "all-beats.zip")}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-medium border border-neutral-800 text-neutral-400 hover:border-neutral-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Zipping…
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download all
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Track list */}
        {notFound ? (
          <div className="text-center py-20 text-neutral-600">
            <p className="text-sm">No folder found for <code className="text-neutral-400">{slug}</code></p>
            <p className="text-xs mt-2 text-neutral-700">Create <code className="text-neutral-600">public/songs/{slug}/</code> and drop in some MP3s</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-20 text-neutral-600">
            <svg
              className="w-12 h-12 mx-auto mb-4 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
              />
            </svg>
            <p className="text-sm">
              Drop MP3s into{" "}
              <code className="text-neutral-400">public/songs/</code> to get
              started
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {songs.map((song) => (
              <WaveformPlayer
                key={song.id}
                song={song}
                isPlaying={playingId === song.id}
                onPlay={() => handlePlay(song.id)}
                onStop={handleStop}
                isLiked={likedIds.has(song.id)}
                onToggleLike={() => toggleLike(song.id)}
              />
            ))}
          </div>
        )}

        {/* Liked songs */}
        {likedSongs.length > 0 && (
          <div className="mt-14">
            {/* Liked header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <svg
                  className="w-4 h-4 text-gold"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
                  Liked
                </h2>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white transition-all"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      Copy list
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDownloadAll(likedSongs, "liked-beats.zip")}
                  disabled={downloading}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Zipping…
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download all
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Song list */}
            <ul className="flex flex-col gap-2">
              {likedSongs.map((song, i) => (
                <li
                  key={song.id}
                  className="flex items-center gap-3 text-sm text-neutral-300"
                >
                  <span className="w-5 text-right text-neutral-600 tabular-nums text-xs">
                    {i + 1}
                  </span>
                  <span className="capitalize">{song.name}</span>
                  {song.bpm != null && (
                    <span className="text-xs text-neutral-600 tabular-nums">
                      {Math.round(song.bpm)} BPM
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SocialLinks className="mt-16" />
      </div>
    </div>
  );
}
