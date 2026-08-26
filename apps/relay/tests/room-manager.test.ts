import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RoomManager } from "../src/room-manager.js";

describe("RoomManager", () => {
  let manager: RoomManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new RoomManager({ defaultTtlMs: 300_000 }); // 5 min
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("creates and retrieves an active room session by PIN", () => {
    const room = manager.createRoom(
      "123456",
      "host_socket_1",
      "MacBook Pro",
      "/Users/dev/project",
    );

    expect(room.pin).toBe("123456");
    expect(room.hostSocketId).toBe("host_socket_1");
    expect(room.hostName).toBe("MacBook Pro");
    expect(room.workspacePath).toBe("/Users/dev/project");
    expect(room.expiresAt).toBe(Date.now() + 300_000);

    const fetched = manager.getRoom("123456");
    expect(fetched).toBe(room);
    expect(manager.getActiveRoomCount()).toBe(1);
  });

  it("pairs a client socket with an existing room", () => {
    manager.createRoom("654321", "host_1", "Dev PC", "/work");

    const paired = manager.pairClient("654321", "client_1", "iPhone 15");
    expect(paired).toBeDefined();
    expect(paired?.clientSocketId).toBe("client_1");
    expect(paired?.clientName).toBe("iPhone 15");

    const byClient = manager.getRoomByClientSocketId("client_1");
    expect(byClient?.pin).toBe("654321");
  });

  it("returns undefined when pairing with a non-existent or expired PIN", () => {
    const paired = manager.pairClient("999999", "client_unknown");
    expect(paired).toBeUndefined();
  });

  it("looks up room by host socket ID and generic socket ID", () => {
    manager.createRoom("111222", "host_socket_x", "Host X", "/workspace");
    manager.pairClient("111222", "client_socket_y", "Mobile Y");

    expect(manager.getRoomByHostSocketId("host_socket_x")?.pin).toBe("111222");
    expect(manager.getRoomByClientSocketId("client_socket_y")?.pin).toBe("111222");
    expect(manager.getRoomBySocketId("host_socket_x")?.pin).toBe("111222");
    expect(manager.getRoomBySocketId("client_socket_y")?.pin).toBe("111222");
  });

  it("cleans up previous room when the same host socket creates a new room", () => {
    manager.createRoom("PIN001", "host_socket_same", "Host A", "/path1");
    expect(manager.getActiveRoomCount()).toBe(1);

    manager.createRoom("PIN002", "host_socket_same", "Host A", "/path2");
    expect(manager.getActiveRoomCount()).toBe(1);
    expect(manager.getRoom("PIN001")).toBeUndefined();
    expect(manager.getRoom("PIN002")).toBeDefined();
  });

  it("expires rooms automatically after 5-minute TTL elapses", () => {
    manager.createRoom("EXP001", "host_exp", "Host Exp", "/path");
    expect(manager.getRoom("EXP001")).toBeDefined();

    // Fast-forward 300,001 ms
    vi.advanceTimersByTime(300_001);

    expect(manager.getRoom("EXP001")).toBeUndefined();
    expect(manager.getActiveRoomCount()).toBe(0);
  });

  it("removes rooms by PIN or disconnecting socket ID", () => {
    manager.createRoom("DEL001", "host_del", "Host Del", "/path");
    manager.pairClient("DEL001", "client_del");

    const removedBySocket = manager.removeBySocketId("client_del");
    expect(removedBySocket?.pin).toBe("DEL001");
    expect(manager.getRoom("DEL001")).toBeUndefined();
    expect(manager.getRoomByHostSocketId("host_del")).toBeUndefined();
    expect(manager.getRoomByClientSocketId("client_del")).toBeUndefined();
  });

  it("prunes expired rooms on cleanExpired()", () => {
    manager.createRoom("ROOM_A", "host_a", "Host A", "/a");
    manager.createRoom("ROOM_B", "host_b", "Host B", "/b");

    vi.advanceTimersByTime(300_001);

    const cleaned = manager.cleanExpired();
    expect(cleaned).toBe(2);
    expect(manager.getActiveRoomCount()).toBe(0);
  });
});
