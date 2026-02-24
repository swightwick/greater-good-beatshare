import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password, type } = await req.json();
  const correct = type === "viewer"
    ? process.env.VIEWER_PASSWORD
    : process.env.ADMIN_PASSWORD;

  if (!correct) {
    return NextResponse.json({ error: "Password not configured" }, { status: 500 });
  }

  if (password !== correct) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
