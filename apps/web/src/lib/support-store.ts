import * as fs from "node:fs";
import * as path from "node:path";

export interface SupportTicketRecord {
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string;
  status: "open" | "in_progress" | "resolved";
}

const memoryStore = new Map<string, SupportTicketRecord>();

function getStoragePath(): string {
  const dataDir = path.resolve(process.cwd(), ".airlink-data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[SupportStore] Could not create data directory ${dataDir}: ${msg}`);
    }
  }
  return path.join(dataDir, "support-tickets.json");
}

function loadFromDisk(): void {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list = JSON.parse(raw) as SupportTicketRecord[];
      if (Array.isArray(list)) {
        for (const item of list) {
          memoryStore.set(item.ticketId, item);
        }
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SupportStore] Error loading tickets from disk: ${msg}`);
  }
}

function persistToDisk(): void {
  try {
    const filePath = getStoragePath();
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SupportStore] Error persisting tickets to disk: ${msg}`);
    throw new Error(`Failed to durably persist support ticket to disk: ${msg}`);
  }
}

// Initial hydration
loadFromDisk();

/**
 * Durably saves a support ticket record.
 */
export async function saveSupportTicket(ticket: SupportTicketRecord): Promise<SupportTicketRecord> {
  memoryStore.set(ticket.ticketId, ticket);
  persistToDisk();
  return ticket;
}

/**
 * Retrieves a support ticket record by ticket ID.
 */
export async function getSupportTicket(ticketId: string): Promise<SupportTicketRecord | null> {
  return memoryStore.get(ticketId) ?? null;
}

/**
 * Lists all registered support tickets.
 */
export async function listSupportTickets(): Promise<SupportTicketRecord[]> {
  return Array.from(memoryStore.values());
}

/**
 * Clears the support ticket store (used in test cleanup).
 */
export async function clearSupportTickets(): Promise<void> {
  memoryStore.clear();
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[SupportStore] Error deleting ticket storage file: ${msg}`);
  }
}
