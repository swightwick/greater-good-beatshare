import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const name = formData.get("name");
  const files = formData.getAll("files") as File[];

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const slug = slugify(name);
  if (!slug) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  // Guard against path traversal
  const songsRoot = path.join(process.cwd(), "public", "songs");
  const destDir = path.join(songsRoot, slug);
  if (!destDir.startsWith(songsRoot)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  fs.mkdirSync(destDir, { recursive: true });

  for (const file of files) {
    if (!file.name.toLowerCase().endsWith(".mp3")) continue;
    const buf = Buffer.from(await file.arrayBuffer());
    // Sanitise the filename too
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._\-\s]/g, "");
    fs.writeFileSync(path.join(destDir, safeName), buf);
  }

  return NextResponse.json({ slug });
}
