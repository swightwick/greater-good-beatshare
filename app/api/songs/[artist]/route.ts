import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function toSlug(name: string) {
  try { name = decodeURIComponent(name); } catch { /* leave as-is */ }
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  const { artist } = await params;
  const artistSlug = toSlug(artist);
  const songs: Array<{ id: string; name: string; url: string; bpm: number | null }> = [];

  // Filesystem — find the actual folder whose slug matches (handles "Ray Vendetta" → "ray-vendetta")
  const songsRoot = path.join(process.cwd(), "public", "songs");
  if (fs.existsSync(songsRoot)) {
    const folders = fs.readdirSync(songsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const matchFolder = folders.find((f) => toSlug(f) === artistSlug);
    if (matchFolder) {
      const songsDir = path.join(songsRoot, matchFolder);
      const files = fs.readdirSync(songsDir).filter((f) => f.toLowerCase().endsWith(".mp3"));
      const { parseFile } = await import("music-metadata");
      for (const filename of files) {
        let bpm: number | null = null;
        try {
          const meta = await parseFile(path.join(songsDir, filename), { duration: false });
          bpm = meta.common.bpm ?? null;
        } catch {
          // no metadata — fine
        }
        songs.push({
          id: filename,
          name: filename.replace(/\.mp3$/i, "").replace(/[-_]/g, " "),
          url: `/api/audio/${encodeURIComponent(matchFolder)}/${encodeURIComponent(filename)}`,
          bpm,
        });
      }
    }
  }

  // Vercel Blob — uploaded MP3s (always stored under the slug)
  try {
    const { blobs } = await list({ prefix: `songs/${artistSlug}/` });
    for (const blob of blobs.filter((b) => b.pathname.toLowerCase().endsWith(".mp3"))) {
      const filename = blob.pathname.split("/").pop() ?? "";
      if (!songs.some((s) => s.id === filename)) {
        songs.push({
          id: filename,
          name: filename.replace(/\.mp3$/i, "").replace(/[-_]/g, " "),
          url: blob.url,
          bpm: null,
        });
      }
    }
  } catch {
    // Blob not configured — fine for local dev
  }

  if (!songs.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(songs);
}
