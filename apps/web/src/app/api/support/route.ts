import * as crypto from "node:crypto";
import { NextResponse } from "next/server";
import { saveSupportTicket } from "../../../lib/support-store";

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

    const randomSuffix = crypto.randomInt(100, 1000).toString();
    const ticketId = `AIR-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const receivedAt = new Date().toISOString();

    // Durably store support ticket
    await saveSupportTicket({
      ticketId,
      name,
      email,
      subject,
      message,
      receivedAt,
      status: "open",
    });

    console.info(`[AirLink Support Ticket Logged & Stored] ID: ${ticketId} | From: ${name} <${email}> | Topic: ${subject}`);

    return NextResponse.json(
      {
        ok: true,
        ticketId,
        receivedAt,
        message: "Support ticket successfully registered and persisted with engineering team.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("[Support API] Failed to process support ticket:", error);
    return NextResponse.json(
      {
        ok: false,
        error: `Failed to process support ticket: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
