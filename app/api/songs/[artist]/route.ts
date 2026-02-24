import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  const { artist } = await params;
  const songsDir = path.join(process.cwd(), "public", "songs", artist);

  if (!fs.existsSync(songsDir)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const files = fs.readdirSync(songsDir).filter((f) =>
    f.toLowerCase().endsWith(".mp3")
  );

  const { parseFile } = await import("music-metadata");

  const songs = await Promise.all(
    files.map(async (filename) => {
      let bpm: number | null = null;
      try {
        const meta = await parseFile(path.join(songsDir, filename), {
          duration: false,
        });
        bpm = meta.common.bpm ?? null;
      } catch {
        // no metadata
      }

      return {
        id: filename,
        name: filename.replace(/\.mp3$/i, "").replace(/[-_]/g, " "),
        url: `/songs/${artist}/${filename}`,
        bpm,
      };
    })
  );

  return NextResponse.json(songs);
}
