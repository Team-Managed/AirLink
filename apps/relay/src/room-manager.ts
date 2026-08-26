export interface RoomSession {
  pin: string;
  hostSocketId: string;
  hostName: string;
  workspacePath: string;
  clientSocketId?: string | undefined;
  clientName?: string | undefined;
  createdAt: number;
  expiresAt: number;
}

export interface RoomManagerOptions {
  defaultTtlMs?: number | undefined;
}

/**
 * RoomManager
 * In-memory manager for ephemeral pairing rooms mapped by 6-digit PIN.
 * Automatically enforces strict 5-minute TTL without persistent cloud database storage.
 */
export class RoomManager {
  readonly defaultTtlMs: number;
  private readonly _rooms = new Map<string, RoomSession>();
  private readonly _hostSocketToPin = new Map<string, string>();
  private readonly _clientSocketToPin = new Map<string, string>();

  constructor(options: RoomManagerOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs ?? 300_000; // 5 minutes
  }

  /**
   * Registers a new host room session keyed by PIN.
   * Cleans up any prior room using the same PIN or created by the same host socket.
   */
  createRoom(
    pin: string,
    hostSocketId: string,
    hostName: string,
    workspacePath: string,
    ttlMs?: number,
  ): RoomSession {
    // 1. If this host socket previously created another room, remove it
    const existingPinForHost = this._hostSocketToPin.get(hostSocketId);
    if (existingPinForHost) {
      this.removeRoom(existingPinForHost);
    }

    // 2. If the PIN is already in use by a previous host, completely purge that room
    if (this._rooms.has(pin)) {
      this.removeRoom(pin);
    }

    const now = Date.now();
    const duration = ttlMs ?? this.defaultTtlMs;

    const session: RoomSession = {
      pin,
      hostSocketId,
      hostName,
      workspacePath,
      createdAt: now,
      expiresAt: now + duration,
    };

    this._rooms.set(pin, session);
    this._hostSocketToPin.set(hostSocketId, pin);

    return session;
  }

  /**
   * Retrieves an active room by PIN.
   * If the room has expired, cleans it up and returns undefined.
   */
  getRoom(pin: string): RoomSession | undefined {
    const room = this._rooms.get(pin);
    if (!room) {
      return undefined;
    }

    if (Date.now() >= room.expiresAt) {
      this.removeRoom(pin);
      return undefined;
    }

    return room;
  }

  /**
   * Looks up a room by host socket ID.
   */
  getRoomByHostSocketId(hostSocketId: string): RoomSession | undefined {
    const pin = this._hostSocketToPin.get(hostSocketId);
    if (!pin) return undefined;
    const room = this.getRoom(pin);
    if (room && room.hostSocketId === hostSocketId) {
      return room;
    }
    return undefined;
  }

  /**
   * Looks up a room by client socket ID.
   */
  getRoomByClientSocketId(clientSocketId: string): RoomSession | undefined {
    const pin = this._clientSocketToPin.get(clientSocketId);
    if (!pin) return undefined;
    const room = this.getRoom(pin);
    if (room && room.clientSocketId === clientSocketId) {
      return room;
    }
    return undefined;
  }

  /**
   * Looks up a room by either host or client socket ID.
   */
  getRoomBySocketId(socketId: string): RoomSession | undefined {
    return (
      this.getRoomByHostSocketId(socketId) ?? this.getRoomByClientSocketId(socketId)
    );
  }

  /**
   * Pairs a client socket to an active room.
   * Revokes authorization for any displaced client socket to prevent stale routing.
   */
  pairClient(
    pin: string,
    clientSocketId: string,
    clientName: string = "Mobile App",
  ): RoomSession | undefined {
    const room = this.getRoom(pin);
    if (!room) {
      return undefined;
    }

    // Revoke previous client if a different client replaces it
    if (room.clientSocketId && room.clientSocketId !== clientSocketId) {
      this._clientSocketToPin.delete(room.clientSocketId);
    }

    // Clean old reverse mapping if incoming client was mapped to another PIN
    const oldPin = this._clientSocketToPin.get(clientSocketId);
    if (oldPin && oldPin !== pin) {
      const oldRoom = this._rooms.get(oldPin);
      if (oldRoom && oldRoom.clientSocketId === clientSocketId) {
        delete oldRoom.clientSocketId;
        delete oldRoom.clientName;
      }
    }

    room.clientSocketId = clientSocketId;
    room.clientName = clientName;
    this._clientSocketToPin.set(clientSocketId, pin);

    return room;
  }

  /**
   * Unpairs a client socket when disconnected, keeping the host room and PIN alive for reconnection.
   */
  unpairClient(clientSocketId: string): RoomSession | undefined {
    const pin = this._clientSocketToPin.get(clientSocketId);
    if (!pin) return undefined;

    this._clientSocketToPin.delete(clientSocketId);
    const room = this._rooms.get(pin);
    if (room && room.clientSocketId === clientSocketId) {
      delete room.clientSocketId;
      delete room.clientName;
      return room;
    }

    return undefined;
  }

  /**
   * Removes a room session by PIN and clears reverse socket lookup indices.
   */
  removeRoom(pin: string): boolean {
    const room = this._rooms.get(pin);
    if (!room) {
      return false;
    }

    this._hostSocketToPin.delete(room.hostSocketId);
    if (room.clientSocketId) {
      this._clientSocketToPin.delete(room.clientSocketId);
    }
    this._rooms.delete(pin);

    return true;
  }

  /**
   * Removes a room associated with a disconnecting host socket.
   */
  removeBySocketId(socketId: string): RoomSession | undefined {
    const pin = this._hostSocketToPin.get(socketId);
    if (!pin) return undefined;

    const room = this._rooms.get(pin);
    if (!room || room.hostSocketId !== socketId) return undefined;

    this.removeRoom(pin);
    return room;
  }

  /**
   * Prunes all expired room sessions from memory.
   * Returns count of cleaned rooms.
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [pin, room] of Array.from(this._rooms.entries())) {
      if (now >= room.expiresAt) {
        this.removeRoom(pin);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Returns count of currently active non-expired rooms.
   */
  getActiveRoomCount(): number {
    this.cleanExpired();
    return this._rooms.size;
  }

  /**
   * Returns array of all active non-expired rooms.
   */
  getAllRooms(): RoomSession[] {
    this.cleanExpired();
    return Array.from(this._rooms.values());
  }
}
