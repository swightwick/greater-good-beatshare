import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Normalize any folder name (including ones with spaces/caps/encoding) to a URL-safe slug
function toSlug(name: string) {
  try { name = decodeURIComponent(name); } catch { /* leave as-is */ }
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
}

export async function GET() {
  const artists = new Set<string>();

  // Filesystem — committed/local folders in public/songs/
  const songsRoot = path.join(process.cwd(), "public", "songs");
  if (fs.existsSync(songsRoot)) {
    fs.readdirSync(songsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .forEach((e) => {
        const slug = toSlug(e.name);
        if (slug) artists.add(slug);
      });
  }

  // Vercel Blob — uploaded folders
  try {
    const { blobs } = await list({ prefix: "songs/" });
    for (const blob of blobs) {
      const parts = blob.pathname.split("/");
      if (parts.length === 3 && parts[0] === "songs" && parts[1]) {
        artists.add(parts[1]); // blob paths are already slugified on upload
      }
    }
  } catch {
    // Blob not configured — fine for local dev
  }

  return NextResponse.json([...artists].sort());
}
