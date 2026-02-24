"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState, DragEvent, ChangeEvent } from "react";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ slug: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const mp3s = Array.from(incoming).filter((f) =>
      f.name.toLowerCase().endsWith(".mp3")
    );
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...mp3s.filter((f) => !existing.has(f.name))];
    });
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.name !== name));

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onSubmit = async () => {
    setError(null);
    if (!name.trim()) { setError("Enter a name first."); return; }
    if (!files.length) { setError("Add at least one MP3."); return; }

    const slug = slugify(name.trim());
    if (!slug) { setError("Invalid name."); return; }

    setUploading(true);
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._\- ]/g, "_");
        await upload(`songs/${slug}/${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
      }
      const url = `${window.location.origin}/${slug}`;
      setResult({ slug, url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const copyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">

        {result ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-[#826921]/10 border border-[#826921]/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-[#826921]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-1">Page created</h2>
            <p className="text-sm text-neutral-400 mb-6">
              Share this link with your artist
            </p>

            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 mb-6">
              <span className="flex-1 text-sm text-neutral-300 truncate text-left">
                {result.url}
              </span>
              <button
                onClick={copyLink}
                className="flex-shrink-0 text-xs font-medium text-[#826921] hover:text-[#9a7d28] transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-all"
              >
                Close
              </button>
              <a
                href={`/${result.slug}`}
                className="flex-1 py-2.5 rounded-xl bg-[#826921] hover:bg-[#9a7d28] text-sm font-semibold text-white text-center transition-colors"
              >
                Open page
              </a>
            </div>
          </div>
        ) : (
          /* ── Upload form ── */
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold">New beat page</h2>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Name field */}
            <div className="mb-4">
              <label className="block text-xs text-neutral-500 uppercase tracking-wider mb-2">
                Artist / page name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="e.g. Jay, Mike, Coldplay"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#826921] transition-colors"
              />
              {name.trim() && (
                <p className="mt-1.5 text-xs text-neutral-600">
                  Page will be at{" "}
                  <span className="text-neutral-400">
                    /{slugify(name.trim())}
                  </span>
                </p>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all mb-4 ${
                dragging
                  ? "border-[#826921] bg-[#826921]/5"
                  : "border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <svg className="w-8 h-8 mx-auto mb-2 text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-neutral-500">
                Drop MP3s here or <span className="text-white">browse</span>
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <ul className="flex flex-col gap-1.5 mb-4 max-h-36 overflow-y-auto">
                {files.map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs"
                  >
                    <span className="text-neutral-300 truncate mr-3">{f.name}</span>
                    <button
                      onClick={() => removeFile(f.name)}
                      className="text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <p className="text-xs text-red-400 mb-4">{error}</p>
            )}

            <button
              onClick={onSubmit}
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-[#826921] hover:bg-[#9a7d28] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
            >
              {uploading ? "Uploading…" : `Create page${files.length ? ` · ${files.length} track${files.length > 1 ? "s" : ""}` : ""}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
