import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// Validates blob path is songs/{slug}/{filename}.mp3
function isValidBlobPath(pathname: string): boolean {
  const parts = pathname.split("/");
  return (
    parts.length === 3 &&
    parts[0] === "songs" &&
    /^[a-z0-9-]+$/.test(parts[1]) &&
    parts[2].toLowerCase().endsWith(".mp3")
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pathname = formData.get("pathname") as string | null;

    if (!file || !pathname) {
      return NextResponse.json({ error: "Missing file or pathname" }, { status: 400 });
    }

    if (!isValidBlobPath(pathname)) {
      return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
    }

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
