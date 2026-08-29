import { NextResponse } from "next/server";

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

    console.info(`[AirLink Newsletter Subscription] Added: ${email}`);

    return NextResponse.json(
      {
        ok: true,
        message: "Subscription confirmed. You will receive AirLink updates.",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process newsletter subscription. Please try again.",
      },
      { status: 500 }
    );
  }
}
