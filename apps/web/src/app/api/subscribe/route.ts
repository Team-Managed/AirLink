import { NextResponse } from "next/server";
import { saveSubscriber } from "../../../lib/subscribers-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid email address format",
        },
        { status: 400 }
      );
    }

    // Durably store newsletter subscription
    await saveSubscriber(email);

    console.info(`[AirLink Newsletter Subscription] Added & Stored: ${email}`);

    return NextResponse.json(
      {
        ok: true,
        message: "Subscription confirmed. You will receive AirLink updates.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    console.error("[Subscribe API] Failed to process newsletter subscription:", error);
    return NextResponse.json(
      {
        ok: false,
        error: `Failed to process newsletter subscription: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
