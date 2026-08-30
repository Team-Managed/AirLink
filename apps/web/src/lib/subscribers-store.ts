import * as fs from "node:fs";
import * as path from "node:path";

export interface NewsletterSubscriberRecord {
  email: string;
  subscribedAt: string;
  active: boolean;
}

const memoryStore = new Map<string, NewsletterSubscriberRecord>();

function getStoragePath(): string {
  const dataDir = path.resolve(process.cwd(), ".airlink-data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[SubscribersStore] Could not create data directory ${dataDir}: ${msg}`);
    }
  }
  return path.join(dataDir, "newsletter-subscribers.json");
}

function loadFromDisk(): void {
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list = JSON.parse(raw) as NewsletterSubscriberRecord[];
      if (Array.isArray(list)) {
        for (const item of list) {
          memoryStore.set(item.email.toLowerCase(), item);
        }
      }
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SubscribersStore] Error loading subscribers from disk: ${msg}`);
  }
}

function persistToDisk(): void {
  try {
    const filePath = getStoragePath();
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SubscribersStore] Error persisting subscribers to disk: ${msg}`);
    throw new Error(`Failed to durably persist newsletter subscribers to disk: ${msg}`);
  }
}

// Initial hydration
loadFromDisk();

/**
 * Durably saves a newsletter subscriber.
 */
export async function saveSubscriber(email: string): Promise<NewsletterSubscriberRecord> {
  const normalized = email.toLowerCase().trim();
  const existing = memoryStore.get(normalized);
  if (existing) {
    existing.active = true;
    persistToDisk();
    return existing;
  }

  const record: NewsletterSubscriberRecord = {
    email: normalized,
    subscribedAt: new Date().toISOString(),
    active: true,
  };

  memoryStore.set(normalized, record);
  persistToDisk();
  return record;
}

/**
 * Checks if an email is already subscribed.
 */
export async function isSubscribed(email: string): Promise<boolean> {
  const record = memoryStore.get(email.toLowerCase().trim());
  return !!record && record.active;
}

/**
 * Lists all registered subscribers.
 */
export async function listSubscribers(): Promise<NewsletterSubscriberRecord[]> {
  return Array.from(memoryStore.values());
}

/**
 * Clears subscriber store (used in test cleanup).
 */
export async function clearSubscribers(): Promise<void> {
  memoryStore.clear();
  try {
    const filePath = getStoragePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[SubscribersStore] Error deleting subscriber storage file: ${msg}`);
  }
}
