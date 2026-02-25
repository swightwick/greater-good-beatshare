import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isValidBlobPath(pathname: string): boolean {
  const parts = pathname.split("/");
  return (
    parts.length === 3 &&
    parts[0] === "songs" &&
    /^[a-z0-9-]+$/.test(parts[1]) &&
    parts[2].toLowerCase().endsWith(".mp3")
  );
}

export async function PUT(request: Request) {
  const pathname = new URL(request.url).searchParams.get("pathname") ?? "";

  if (!isValidBlobPath(pathname)) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "No body" }, { status: 400 });
  }

  try {
    const buffer = await request.arrayBuffer();
    const blob = await put(pathname, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "audio/mpeg",
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
