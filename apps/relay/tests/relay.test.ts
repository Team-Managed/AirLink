import * as crypto from "node:crypto";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { createRelayServer, RelayServerInstance } from "../src/server.js";
import {
  SOCKET_EVENTS,
  RegisterHost,
  JoinSession,
  SessionConnected,
  ClientPrompt,
  AgentStream,
  ApprovalRequest,
  ApprovalResponse,
  ClientSync,
  StreamBatch,
  StandardError,
} from "@airlink/protocol";

function waitForConnect(socket: ClientSocket): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise<void>((resolve) => socket.once("connect", () => resolve()));
}

describe("Relay Server Integration", () => {
  let server: RelayServerInstance;
  let serverUrl: string;

  beforeAll(async () => {
    // Start on ephemeral port
    server = createRelayServer({ port: 0 });
    const { port } = await server.start();
    serverUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(() => {
    server.rateLimiter.clear();
  });

  it("exposes GET /health endpoint returning 200 OK and active room stats", async () => {
    const res = await fetch(`${serverUrl}/health`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { status: string; activeRooms: number; timestamp: number };
    expect(json.status).toBe("ok");
    expect(typeof json.activeRooms).toBe("number");
    expect(typeof json.timestamp).toBe("number");
  });

  it("exposes GET / endpoint returning friendly JSON greeting and health route info", async () => {
    const res = await fetch(`${serverUrl}/`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { name: string; status: string; version: string; health: string };
    expect(json.name).toBe("AirLink WebSocket Relay");
    expect(json.status).toBe("ok");
    expect(json.health).toBe("/health");
  });

  it("handles host registration, client pairing, and bidirectional message routing", async () => {
    const pin = "834192";
    const hostSocket: ClientSocket = ioClient(serverUrl, { transports: ["websocket"] });
    const clientSocket: ClientSocket = ioClient(serverUrl, { transports: ["websocket"] });

    await Promise.all([waitForConnect(hostSocket), waitForConnect(clientSocket)]);

    const hostSecret = crypto.randomUUID();

    // 1. Host registers
    const hostReg: RegisterHost = {
      pin,
      hostName: "MacBook Pro Workstation",
      workspacePath: "/Users/dev/code/agent-harness",
      hostSecret,
    };
    hostSocket.emit(SOCKET_EVENTS.REGISTER_HOST, hostReg);

    // Wait short tick for registration in roomManager
    await new Promise((r) => setTimeout(r, 50));
    expect(server.roomManager.getRoom(pin)).toBeDefined();

    // 2. Client pairs
    const connectedEvents: SessionConnected[] = [];
    hostSocket.on(SOCKET_EVENTS.SESSION_CONNECTED, (data: SessionConnected) => {
      connectedEvents.push(data);
    });
    clientSocket.on(SOCKET_EVENTS.SESSION_CONNECTED, (data: SessionConnected) => {
      connectedEvents.push(data);
    });

    const joinPayload: JoinSession = {
      pin,
      clientName: "iPhone 15 Pro",
    };
    clientSocket.emit(SOCKET_EVENTS.JOIN_SESSION, joinPayload);

    // Wait for session:connected broadcast
    await new Promise((r) => setTimeout(r, 100));

    expect(connectedEvents.length).toBe(2);
    expect(connectedEvents[0]?.sessionId).toBe(pin);
    expect(connectedEvents[0]?.deviceName).toBe("MacBook Pro Workstation");
    expect(connectedEvents[0]?.status).toBe("connected");

    // 3. Client sends prompt -> Host receives
    const receivedPrompts: ClientPrompt[] = [];
    hostSocket.on(SOCKET_EVENTS.CLIENT_PROMPT, (data: ClientPrompt) => {
      receivedPrompts.push(data);
    });

    const promptPayload: ClientPrompt = {
      sessionId: pin,
      turnId: "turn_001",
      prompt: "Refactor rate limiter to use sliding window",
    };
    clientSocket.emit(SOCKET_EVENTS.CLIENT_PROMPT, promptPayload);

    await new Promise((r) => setTimeout(r, 100));
    expect(receivedPrompts.length).toBe(1);
    expect(receivedPrompts[0]?.prompt).toBe("Refactor rate limiter to use sliding window");

    // 4. Host sends stream chunk -> Client receives
    const receivedStreams: AgentStream[] = [];
    clientSocket.on(SOCKET_EVENTS.AGENT_STREAM, (data: AgentStream) => {
      receivedStreams.push(data);
    });

    const streamChunk: AgentStream = {
      seqId: 1,
      sessionId: pin,
      turnId: "turn_001",
      type: "thought",
      content: "Analyzing AST structure...",
      timestamp: Date.now(),
    };
    hostSocket.emit(SOCKET_EVENTS.AGENT_STREAM, streamChunk);

    await new Promise((r) => setTimeout(r, 100));
    expect(receivedStreams.length).toBe(1);
    expect(receivedStreams[0]?.content).toBe("Analyzing AST structure...");

    // 5. Host requests approval -> Client receives
    const receivedApprovals: ApprovalRequest[] = [];
    clientSocket.on(SOCKET_EVENTS.APPROVAL_REQUIRED, (data: ApprovalRequest) => {
      receivedApprovals.push(data);
    });

    const approvalReq: ApprovalRequest = {
      seqId: 2,
      approvalId: "appr_100",
      sessionId: pin,
      turnId: "turn_001",
      toolName: "execute_bash",
      commandOrDiff: "git commit -m 'feat: update rate limiter'",
      riskLevel: "medium",
      timeoutMs: 180000,
      createdAt: Date.now(),
    };
    hostSocket.emit(SOCKET_EVENTS.APPROVAL_REQUIRED, approvalReq);

    await new Promise((r) => setTimeout(r, 100));
    expect(receivedApprovals.length).toBe(1);
    expect(receivedApprovals[0]?.approvalId).toBe("appr_100");

    // 6. Client sends approval response -> Host receives
    const receivedResponses: ApprovalResponse[] = [];
    hostSocket.on(SOCKET_EVENTS.APPROVAL_RESPONSE, (data: ApprovalResponse) => {
      receivedResponses.push(data);
    });

    const approvalRes: ApprovalResponse = {
      approvalId: "appr_100",
      sessionId: pin,
      approved: true,
      reason: "Looks great",
      resolvedAt: Date.now(),
    };
    clientSocket.emit(SOCKET_EVENTS.APPROVAL_RESPONSE, approvalRes);

    await new Promise((r) => setTimeout(r, 100));
    expect(receivedResponses.length).toBe(1);
    expect(receivedResponses[0]?.approved).toBe(true);

    // 7. Client requests sync -> Host receives
    const receivedSyncs: ClientSync[] = [];
    hostSocket.on(SOCKET_EVENTS.CLIENT_SYNC, (data: ClientSync) => {
      receivedSyncs.push(data);
    });

    const syncPayload: ClientSync = {
      sessionId: pin,
      lastSeenSeq: 1,
    };
    clientSocket.emit(SOCKET_EVENTS.CLIENT_SYNC, syncPayload);

    await new Promise((r) => setTimeout(r, 100));
    expect(receivedSyncs.length).toBe(1);
    expect(receivedSyncs[0]?.lastSeenSeq).toBe(1);

    // 8. Host sends batch stream catchup -> Client receives
    const receivedBatches: StreamBatch[] = [];
    clientSocket.on(SOCKET_EVENTS.STREAM_BATCH, (data: StreamBatch) => {
      receivedBatches.push(data);
    });

    const batchPayload: StreamBatch = {
      sessionId: pin,
      events: [streamChunk],
    };
    hostSocket.emit(SOCKET_EVENTS.STREAM_BATCH, batchPayload);

    await new Promise((r) => setTimeout(r, 100));
    expect(receivedBatches.length).toBe(1);
    expect(receivedBatches[0]?.events.length).toBe(1);

    hostSocket.disconnect();
    clientSocket.disconnect();
  });

  it("enforces rate-limiting and locks out after 3 invalid PIN submissions", async () => {
    const client: ClientSocket = ioClient(serverUrl, { transports: ["websocket"] });
    await waitForConnect(client);

    const errors: StandardError[] = [];
    client.on(SOCKET_EVENTS.ERROR, (err: StandardError) => {
      errors.push(err);
    });

    // Attempt 1: Invalid PIN
    client.emit(SOCKET_EVENTS.JOIN_SESSION, { pin: "000001", clientName: "Bad Actor" });
    await new Promise((r) => setTimeout(r, 100));
    expect(errors.length).toBe(1);
    expect(errors[0]?.code).toBe("INVALID_PIN");

    // Attempt 2: Invalid PIN
    client.emit(SOCKET_EVENTS.JOIN_SESSION, { pin: "000002", clientName: "Bad Actor" });
    await new Promise((r) => setTimeout(r, 100));
    expect(errors.length).toBe(2);
    expect(errors[1]?.code).toBe("INVALID_PIN");

    // Attempt 3: Invalid PIN -> Triggers RATE_LIMITED lockout!
    client.emit(SOCKET_EVENTS.JOIN_SESSION, { pin: "000003", clientName: "Bad Actor" });
    await new Promise((r) => setTimeout(r, 100));
    expect(errors.length).toBe(3);
    expect(errors[2]?.code).toBe("RATE_LIMITED");

    // Attempt 4: Even with a valid PIN now, IP is locked out
    client.emit(SOCKET_EVENTS.JOIN_SESSION, { pin: "123456", clientName: "Bad Actor" });
    await new Promise((r) => setTimeout(r, 100));
    expect(errors.length).toBe(4);
    expect(errors[3]?.code).toBe("RATE_LIMITED");

    client.disconnect();
  });

  it("preserves host room and PIN when a client disconnects, allowing reconnection", async () => {
    const pin = "555666";
    const hostSocket: ClientSocket = ioClient(serverUrl, { transports: ["websocket"] });
    const clientSocket1: ClientSocket = ioClient(serverUrl, { transports: ["websocket"] });

    await Promise.all([waitForConnect(hostSocket), waitForConnect(clientSocket1)]);

    // 1. Host registers
    hostSocket.emit(SOCKET_EVENTS.REGISTER_HOST, {
      pin,
      hostName: "Persistent Host",
      workspacePath: "/code",
      hostSecret: crypto.randomUUID(),
    });
    await new Promise((r) => setTimeout(r, 50));

    // 2. Client 1 pairs and waits for connected confirmation
    const client1ConnectedPromise = new Promise<void>((resolve) => {
      clientSocket1.on(SOCKET_EVENTS.SESSION_CONNECTED, (d: SessionConnected) => {
        if (d.status === "connected") resolve();
      });
    });
    clientSocket1.emit(SOCKET_EVENTS.JOIN_SESSION, { pin, clientName: "Mobile Client 1" });
    await client1ConnectedPromise;

    // 3. Host room is active with paired client
    expect(server.roomManager.getRoom(pin)?.clientSocketId).toBeDefined();

    // 4. Client 1 disconnects (e.g. backgrounded or mobile connection dropped)
    clientSocket1.disconnect();
    await new Promise((r) => setTimeout(r, 100));

    // Host room is STILL active in RoomManager under PIN for reconnection!
    const roomAfterDisconnect = server.roomManager.getRoom(pin);
    expect(roomAfterDisconnect).toBeDefined();
    expect(roomAfterDisconnect?.clientSocketId).toBeUndefined();

    // 5. Reconnecting Client 2 joins the same room with same PIN
    const clientSocket2: ClientSocket = ioClient(serverUrl, { transports: ["websocket"] });
    await waitForConnect(clientSocket2);

    const client2ConnectedEvents: SessionConnected[] = [];
    clientSocket2.on(SOCKET_EVENTS.SESSION_CONNECTED, (d: SessionConnected) => {
      client2ConnectedEvents.push(d);
    });

    clientSocket2.emit(SOCKET_EVENTS.JOIN_SESSION, {
      pin,
      clientName: "Mobile Client Reconnected",
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(client2ConnectedEvents.length).toBe(1);
    expect(client2ConnectedEvents[0]?.status).toBe("connected");
    expect(client2ConnectedEvents[0]?.sessionId).toBe(pin);

    hostSocket.disconnect();
    clientSocket2.disconnect();
  });
});
