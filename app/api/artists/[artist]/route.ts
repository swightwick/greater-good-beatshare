import { list, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function toSlug(name: string) {
  try { name = decodeURIComponent(name); } catch { /* leave as-is */ }
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  const { artist } = await params;
  const artistSlug = toSlug(artist);

  if (!artistSlug) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  let deleted = false;

  // Filesystem — find and delete the matching folder
  const songsRoot = path.join(process.cwd(), "public", "songs");
  if (fs.existsSync(songsRoot)) {
    const folders = fs.readdirSync(songsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const matchFolder = folders.find((f) => toSlug(f) === artistSlug);
    if (matchFolder) {
      const target = path.join(songsRoot, matchFolder);
      try {
        fs.rmSync(target, { recursive: true, force: true });
        deleted = true;
      } catch {
        // Read-only filesystem on Vercel — ignore
      }
    }
  }

  // Vercel Blob
  try {
    const { blobs } = await list({ prefix: `songs/${artistSlug}/` });
    if (blobs.length) {
      await del(blobs.map((b) => b.url));
      deleted = true;
    }
  } catch (err) {
    // Blob not configured locally — ignore. But surface real errors.
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("BLOB_READ_WRITE_TOKEN")) {
      return NextResponse.json({ error: `Blob delete failed: ${msg}` }, { status: 500 });
    }
  }

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
