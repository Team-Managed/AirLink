import { describe, it, expect, beforeEach } from "vitest";
import { POST as handleSupport } from "../src/app/api/support/route.js";
import { POST as handleSubscribe } from "../src/app/api/subscribe/route.js";
import {
  saveSupportTicket,
  getSupportTicket,
  listSupportTickets,
  clearSupportTickets,
} from "../src/lib/support-store.js";
import {
  saveSubscriber,
  isSubscribed,
  listSubscribers,
  clearSubscribers,
} from "../src/lib/subscribers-store.js";

describe("Support and Subscription Durable Storage & API Routes", () => {
  beforeEach(async () => {
    await clearSupportTickets();
    await clearSubscribers();
  });

  it("persists support tickets durably and retrieves them by ID", async () => {
    const ticket = {
      ticketId: "AIR-TEST-001",
      name: "Alex Dev",
      email: "alex@example.com",
      subject: "VS Code Bridge",
      message: "Need help with port configuration.",
      receivedAt: new Date().toISOString(),
      status: "open" as const,
    };

    await saveSupportTicket(ticket);
    const retrieved = await getSupportTicket("AIR-TEST-001");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe("Alex Dev");
    expect(retrieved?.email).toBe("alex@example.com");

    const all = await listSupportTickets();
    expect(all.length).toBe(1);
    expect(all[0]?.ticketId).toBe("AIR-TEST-001");
  });

  it("persists newsletter subscribers and deduplicates by email", async () => {
    await saveSubscriber("developer@airlink.dev");
    expect(await isSubscribed("developer@airlink.dev")).toBe(true);
    expect(await isSubscribed("DEVELOPER@AIRLINK.DEV")).toBe(true);

    const list = await listSubscribers();
    expect(list.length).toBe(1);
    expect(list[0]?.email).toBe("developer@airlink.dev");
  });

  it("POST /api/support creates a durable ticket and returns 200 with ticket ID", async () => {
    const req = new Request("http://localhost:3000/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Samantha",
        email: "samantha@company.org",
        subject: "Question",
        message: "How do I pair with mobile?",
      }),
    });

    const res = await handleSupport(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean; ticketId: string; receivedAt: string };
    expect(body.ok).toBe(true);
    expect(body.ticketId).toMatch(/^AIR-/);

    const stored = await getSupportTicket(body.ticketId);
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe("Samantha");
    expect(stored?.email).toBe("samantha@company.org");
  });

  it("POST /api/subscribe creates a durable subscriber record and returns 200", async () => {
    const req = new Request("http://localhost:3000/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "team@build.io" }),
    });

    const res = await handleSubscribe(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as { ok: boolean; message: string };
    expect(body.ok).toBe(true);

    expect(await isSubscribed("team@build.io")).toBe(true);
  });
});
