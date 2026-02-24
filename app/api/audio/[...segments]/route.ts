import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await params;

  // segments are already URL-decoded by Next.js router
  const filePath = path.join(process.cwd(), "public", "songs", ...segments);

  // Prevent path traversal
  const songsRoot = path.resolve(path.join(process.cwd(), "public", "songs"));
  if (!path.resolve(filePath).startsWith(songsRoot)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  const makeStream = (start?: number, end?: number) =>
    new ReadableStream({
      start(controller) {
        const s = fs.createReadStream(filePath, start != null ? { start, end } : undefined);
        s.on("data", (chunk) => controller.enqueue(chunk));
        s.on("end", () => controller.close());
        s.on("error", (err) => controller.error(err));
      },
    });

  if (range) {
    const [s, e] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(s, 10);
    const end = e ? parseInt(e, 10) : fileSize - 1;
    return new NextResponse(makeStream(start, end), {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(end - start + 1),
        "Content-Type": "audio/mpeg",
      },
    });
  }

  return new NextResponse(makeStream(), {
    headers: {
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "Content-Type": "audio/mpeg",
    },
  });
}
