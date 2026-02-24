import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const songsRoot = path.join(process.cwd(), "public", "songs");

  if (!fs.existsSync(songsRoot)) {
    return NextResponse.json([]);
  }

  const entries = fs.readdirSync(songsRoot, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  return NextResponse.json(folders);
}
