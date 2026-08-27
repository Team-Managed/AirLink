export interface RoomSession {
  pin: string;
  hostSocketId: string;
  hostSocketIds: string[];
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
 * Supports multi-host session synchronization (CLI <-> VS Code Extension).
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
   * Registers a host socket to a room session keyed by PIN.
   * If the room already exists (e.g. CLI started first, then VS Code connects with same PIN),
   * synchronizes the new host socket into the active room without evicting connected clients.
   */
  createRoom(
    pin: string,
    hostSocketId: string,
    hostName: string,
    workspacePath: string,
    ttlMs?: number,
  ): RoomSession {
    // 1. If this host socket previously created another PIN room, unmap it
    const existingPinForHost = this._hostSocketToPin.get(hostSocketId);
    if (existingPinForHost && existingPinForHost !== pin) {
      this.removeBySocketId(hostSocketId);
    }

    const now = Date.now();
    const duration = ttlMs ?? this.defaultTtlMs;

    // 2. If the room already exists for this PIN, check expiry or refresh and synchronize
    const existingRoom = this._rooms.get(pin);
    if (existingRoom) {
      if (now >= existingRoom.expiresAt) {
        // Room has expired: clean it up completely to prevent resurrection of stale client sockets
        this.removeRoom(pin);
      } else {
        existingRoom.expiresAt = now + duration;
        if (!existingRoom.hostSocketIds.includes(hostSocketId)) {
          existingRoom.hostSocketIds.push(hostSocketId);
        }
        existingRoom.hostSocketId = hostSocketId;
        if (workspacePath && workspacePath.trim().length > 0) {
          existingRoom.workspacePath = workspacePath;
        }
        if (hostName) {
          existingRoom.hostName = hostName;
        }
        this._hostSocketToPin.set(hostSocketId, pin);
        return existingRoom;
      }
    }

    // 3. Create fresh room session
    const session: RoomSession = {
      pin,
      hostSocketId,
      hostSocketIds: [hostSocketId],
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
    if (
      room &&
      (room.hostSocketIds?.includes(hostSocketId) || room.hostSocketId === hostSocketId)
    ) {
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
    return this.getRoomByHostSocketId(socketId) ?? this.getRoomByClientSocketId(socketId);
  }

  /**
   * Pairs a client socket to an active room.
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

    for (const hostId of room.hostSocketIds || [room.hostSocketId]) {
      this._hostSocketToPin.delete(hostId);
    }
    if (room.clientSocketId) {
      this._clientSocketToPin.delete(room.clientSocketId);
    }
    this._rooms.delete(pin);

    return true;
  }

  /**
   * Handles disconnection of a specific host socket.
   * If other host sockets are still active in the room, keeps the room alive!
   */
  removeBySocketId(socketId: string): RoomSession | undefined {
    const pin = this._hostSocketToPin.get(socketId);
    if (!pin) return undefined;

    this._hostSocketToPin.delete(socketId);
    const room = this._rooms.get(pin);
    if (!room) return undefined;

    room.hostSocketIds = (room.hostSocketIds || []).filter((id) => id !== socketId);

    if (room.hostSocketIds.length > 0) {
      room.hostSocketId = room.hostSocketIds[room.hostSocketIds.length - 1]!;
      return room;
    }

    // No hosts remaining in this room -> remove room
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
