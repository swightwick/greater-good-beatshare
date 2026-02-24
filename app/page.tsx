"use client";

import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import UploadModal from "./components/UploadModal";
import LogoCanvas from "./components/LogoCanvas";

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
      body: JSON.stringify({ password }),
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
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* 3D Logo */}
        <div className="flex justify-center mb-4">
          <LogoCanvas />
        </div>

        {/* <h1 className="text-5xl font-bold tracking-tight mb-6">{process.env.NEXT_PUBLIC_ARTIST_NAME}</h1> */}

        {/* Bio */}
        <p className="text-neutral-400 leading-relaxed mb-6 mt-12 text-center">
          Your bio goes here. Tell people who you are, what kind of beats you
          make, who you&apos;ve worked with, or whatever you want them to know.
        </p>

        {/* Links */}
        <div className="flex flex-row justify-center gap-6 mb-10">
          <a href="https://instagram.com/greater_good" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-400 hover:text-white transition-colors group">
            <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </span>
          </a>

          <a href="https://soundcloud.com/greater_good" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-400 hover:text-white transition-colors group">
            <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.175 12.225c-.15 0-.25.1-.275.25l-.35 2.325.35 2.375c.025.15.125.25.275.25s.25-.1.275-.25l.4-2.375-.4-2.325c-.025-.15-.125-.25-.275-.25zm1.65-.7c-.175 0-.325.15-.35.325l-.3 3.025.3 3c.025.175.175.325.35.325s.325-.15.35-.325l.35-3-.35-3.025c-.025-.175-.175-.325-.35-.325zm1.7-.35c-.2 0-.375.175-.4.375l-.25 3.375.25 3.35c.025.2.2.375.4.375s.375-.175.4-.375l.275-3.35-.275-3.375c-.025-.2-.2-.375-.4-.375zm1.7-.2c-.225 0-.425.2-.425.425l-.225 3.575.225 3.55c0 .225.2.425.425.425s.425-.2.425-.425l.25-3.55-.25-3.575c0-.225-.2-.425-.425-.425zm1.725.05c-.25 0-.45.2-.475.45l-.2 3.525.2 3.5c.025.25.225.45.475.45s.45-.2.475-.45l.225-3.5-.225-3.525c-.025-.25-.225-.45-.475-.45zm1.725-.225c-.275 0-.5.225-.5.5l-.175 3.75.175 3.725c0 .275.225.5.5.5s.5-.225.5-.5l.2-3.725-.2-3.75c0-.275-.225-.5-.5-.5zm1.75-.375c-.3 0-.55.25-.55.55l-.15 4.125.15 4.1c0 .3.25.55.55.55s.55-.25.55-.55l.175-4.1-.175-4.125c0-.3-.25-.55-.55-.55zm4.45-2.75c-.15-.075-.3-.1-.475-.1-.525 0-1 .2-1.35.525-.375-.45-.925-.725-1.55-.725-.275 0-.525.05-.75.15-.1.05-.125.1-.125.175v8.45c0 .1.075.175.175.2h8.125c.825 0 1.5-.675 1.5-1.5 0-.825-.675-1.5-1.5-1.5-.1 0-.2.01-.3.03.05-.2.075-.4.075-.63 0-1.55-1.25-2.8-2.8-2.8-.3 0-.575.05-.85.15l.025-.425z"/>
              </svg>
            </span>
          </a>

          <a href="https://open.spotify.com/artist/yourprofile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-400 hover:text-white transition-colors group">
            <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.786-2.131-9.965-1.166a.78.78 0 01-.453-1.492c3.633-1.102 8.147-.568 11.233 1.329a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.794c3.563-1.08 9.487-.872 13.23 1.35a.937.937 0 01-.071 1.6z"/>
              </svg>
            </span>
          </a>

          <a href="https://youtube.com/@yourhandle" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-400 hover:text-white transition-colors group">
            <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </span>
          </a>
        </div>

        {/* Admin section */}
        <div className="border-t border-neutral-800 pt-8">
          {!unlocked ? (
            <form onSubmit={handleUnlock} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
                placeholder="Password"
                className={`flex-1 bg-neutral-900 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none transition-colors ${
                  authError ? "border-red-500" : "border-neutral-800 focus:border-neutral-600"
                }`}
              />
              <button
                type="submit"
                disabled={authLoading || !password}
                className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-xs font-medium text-white transition-colors"
              >
                {authLoading ? "…" : "Unlock"}
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest text-neutral-600 font-medium">
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
                <ul className="flex flex-col gap-1">
                  {artists.map((slug) => (
                    <li key={slug} className="flex items-center justify-between group">
                      <a
                        href={`/${slug}`}
                        className="text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        {slugToName(slug)}
                        <span className="ml-2 text-neutral-700 text-xs">/{slug}</span>
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
