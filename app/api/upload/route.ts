import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Handle CORS preflight — Vercel Blob's client calls this route cross-origin
// to obtain an upload token, so the OPTIONS response must be valid.
export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

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
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isValidBlobPath(pathname)) {
          throw new Error("Invalid upload path");
        }
        return {
          allowedContentTypes: ["audio/mpeg"],
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob uploaded:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
