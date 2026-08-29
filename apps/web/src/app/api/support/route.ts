import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "General Inquiry";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: "A valid work email is required." }, { status: 400 });
    }
    if (!message || message.length < 5) {
      return NextResponse.json(
        { ok: false, error: "Message must be at least 5 characters long." },
        { status: 400 }
      );
    }

    const ticketId = `AIR-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    const receivedAt = new Date().toISOString();

    console.info(`[AirLink Support Ticket Logged] ID: ${ticketId} | From: ${name} <${email}> | Topic: ${subject}`);

    return NextResponse.json(
      {
        ok: true,
        ticketId,
        receivedAt,
        message: "Support ticket successfully registered with engineering team.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process support ticket. Please check your network and try again.",
      },
      { status: 500 }
    );
  }
}
