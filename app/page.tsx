"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import UploadModal from "./components/UploadModal";
import LogoCanvas from "./components/LogoCanvas";
import SocialLinks from "./components/SocialLinks";
// import BackgroundShader from "./components/BackgroundShader";

function slugToName(slug: string) {
  try { slug = decodeURIComponent(slug); } catch { /* leave as-is */ }
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const SESSION_KEY = "bs_admin_unlocked";

export default function Home() {
  const [showUpload, setShowUpload] = useState(false);
  const [artists, setArtists] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Auth state
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore session
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setUnlocked(true);
  }, []);

  const fetchArtists = useCallback(async () => {
    const res = await fetch("/api/artists");
    setArtists(await res.json());
  }, []);

  useEffect(() => {
    if (unlocked) fetchArtists();
  }, [unlocked, fetchArtists]);

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(false);
    setAuthLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, type: "admin" }),
    });
    setAuthLoading(false);
    if (res.ok) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
      setPassword("");
    } else {
      setAuthError(true);
      setPassword("");
      inputRef.current?.focus();
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete page "${slugToName(slug)}"? This cannot be undone.`)) return;
    setDeleting(slug);
    await fetch(`/api/artists/${slug}`, { method: "DELETE" });
    setDeleting(null);
    fetchArtists();
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center px-4">
      {/* <BackgroundShader /> */}
      <div className="relative z-10 max-w-lg w-full">
        {/* 3D Logo */}
        <div className="flex justify-center mb-10">
          <LogoCanvas className="w-full h-[220px] sm:h-[350px]" />
        </div>

        {/* <h1 className="text-5xl font-bold tracking-tight mb-6">{process.env.NEXT_PUBLIC_ARTIST_NAME}</h1> */}

        {/* Bio */}
        {/* <p className="text-white/80 leading-relaxed mb-8 mt-12 text-center">
          Greater Good Beats
        </p> */}

        {/* Links */}
        <SocialLinks className="mb-8" />

        {/* Admin section */}
        <div className="border-t border-white/10 pt-8">
          {!unlocked ? (
            <form onSubmit={handleUnlock} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
                placeholder="Password"
                className={`flex-1 bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none transition-colors ${
                  authError ? "border-red-500" : "border-white/10 focus:border-neutral-600"
                }`}
              />
              <button
                type="submit"
                disabled={authLoading || !password}
                className="px-3 py-2.5 rounded-lg bg-neutral-800 border border-white/10 hover:bg-neutral-700 disabled:opacity-40 text-xs font-medium text-white transition-colors"
              >
                {authLoading ? "…" : "Unlock"}
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest text-neutral-500 font-medium">
                  Artist pages
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 rounded-full px-3 py-1.5 transition-all"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create artist page
                  </button>
                  <button
                    onClick={handleLock}
                    title="Lock"
                    className="text-neutral-700 hover:text-neutral-400 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </button>
                </div>
              </div>
              {artists.length === 0 ? (
                <p className="text-sm text-neutral-700">No pages yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {artists.map((slug) => (
                    <li key={slug} className="flex items-center justify-between group">
                      <a
                        href={`/${slug}`}
                        className="text-sm text-neutral-200 hover:text-white transition-colors"
                      >
                        {slugToName(slug)}
                        <span className="ml-2 text-neutral-500 text-xs">/{slug}</span>
                      </a>
                      <button
                        onClick={() => handleDelete(slug)}
                        disabled={deleting === slug}
                        className="opacity-0 group-hover:opacity-100 text-neutral-700 hover:text-red-400 transition-all disabled:opacity-30"
                        title="Delete page"
                      >
                        {deleting === slug ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => {
            setShowUpload(false);
            fetchArtists();
          }}
        />
      )}
    </div>
  );
}
