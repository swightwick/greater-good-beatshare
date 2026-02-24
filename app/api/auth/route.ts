import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();
  const correct = process.env.ADMIN_PASSWORD;

  if (!correct) {
    return NextResponse.json({ error: "No admin password set" }, { status: 500 });
  }

  if (password !== correct) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
