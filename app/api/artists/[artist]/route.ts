import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ artist: string }> }
) {
  const { artist } = await params;

  const songsRoot = path.join(process.cwd(), "public", "songs");
  const target = path.join(songsRoot, artist);

  // Guard against path traversal
  if (!target.startsWith(songsRoot + path.sep)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  if (!fs.existsSync(target)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  fs.rmSync(target, { recursive: true, force: true });

  return NextResponse.json({ ok: true });
}
