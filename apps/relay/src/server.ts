import http from "node:http";
import { Server as SocketIOServer, Socket } from "socket.io";
import {
  SOCKET_EVENTS,
  RegisterHostSchema,
  JoinSessionSchema,
  SessionConnected,
  SessionConnectedSchema,
  ClientPromptSchema,
  AgentStreamSchema,
  ApprovalRequestSchema,
  ApprovalResponseSchema,
  ClientSyncSchema,
  StreamBatchSchema,
  StandardError,
  StandardErrorSchema,
} from "@agent-remote/protocol";
import { IPRateLimiter, RateLimiterOptions } from "./rate-limiter.js";
import { RoomManager, RoomManagerOptions } from "./room-manager.js";

export interface RelayServerOptions {
  port?: number | undefined;
  roomOptions?: RoomManagerOptions | undefined;
  rateLimitOptions?: RateLimiterOptions | undefined;
}

export interface RelayServerInstance {
  httpServer: http.Server;
  io: SocketIOServer;
  roomManager: RoomManager;
  rateLimiter: IPRateLimiter;
  port: number;
  start: (port?: number) => Promise<{ port: number }>;
  stop: () => Promise<void>;
}

function getClientIp(socket: Socket): string {
  const forwarded = socket.handshake.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() || socket.handshake.address;
  }
  return socket.handshake.address || "127.0.0.1";
}

/**
 * Creates and configures the standalone Socket.io Cloud Relay Server.
 */
export function createRelayServer(options: RelayServerOptions = {}): RelayServerInstance {
  const port = options.port ?? Number(process.env.PORT || 3001);
  const roomManager = new RoomManager(options.roomOptions);
  const rateLimiter = new IPRateLimiter(options.rateLimitOptions);

  const httpServer = http.createServer((req, res) => {
    // Enable CORS for HTTP routes
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET" && (req.url === "/health" || req.url === "/healthz")) {
      const activeRooms = roomManager.getActiveRoomCount();
      const body = JSON.stringify({
        status: "ok",
        activeRooms,
        timestamp: Date.now(),
      });

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      });
      res.end(body);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket: Socket) => {
    const ip = getClientIp(socket);

    // 1. Host Registration
    socket.on(SOCKET_EVENTS.REGISTER_HOST, (data: unknown) => {
      const parsed = RegisterHostSchema.safeParse(data);
      if (!parsed.success) {
        const err: StandardError = {
          code: "INVALID_REGISTRATION",
          message: "Invalid host registration payload",
          details: parsed.error.issues,
        };
        socket.emit(SOCKET_EVENTS.ERROR, StandardErrorSchema.parse(err));
        return;
      }

      const { pin, hostName, workspacePath } = parsed.data;
      roomManager.createRoom(pin, socket.id, hostName, workspacePath);
      socket.join(pin);
    });

    // 2. Client Pairing
    socket.on(SOCKET_EVENTS.JOIN_SESSION, (data: unknown) => {
      // Check IP lockout before processing
      if (rateLimiter.isLocked(ip)) {
        const remaining = rateLimiter.getRemainingLockoutMs(ip);
        const err: StandardError = {
          code: "RATE_LIMITED",
          message: `Too many failed PIN attempts. IP locked out for ${Math.ceil(remaining / 1000)}s.`,
        };
        socket.emit(SOCKET_EVENTS.ERROR, StandardErrorSchema.parse(err));
        return;
      }

      const parsed = JoinSessionSchema.safeParse(data);
      if (!parsed.success) {
        rateLimiter.recordFailure(ip);
        const err: StandardError = {
          code: "INVALID_JOIN_PAYLOAD",
          message: "Invalid join payload",
          details: parsed.error.issues,
        };
        socket.emit(SOCKET_EVENTS.ERROR, StandardErrorSchema.parse(err));
        return;
      }

      const { pin, clientName } = parsed.data;
      const room = roomManager.getRoom(pin);

      if (!room) {
        const rateResult = rateLimiter.recordFailure(ip);
        const err: StandardError = {
          code: rateResult.locked ? "RATE_LIMITED" : "INVALID_PIN",
          message: rateResult.locked
            ? "Too many failed attempts. You have been locked out for 5 minutes."
            : "PIN not found or pairing session expired.",
        };
        socket.emit(SOCKET_EVENTS.ERROR, StandardErrorSchema.parse(err));
        return;
      }

      // Successful PIN authentication
      rateLimiter.recordSuccess(ip);
      roomManager.pairClient(pin, socket.id, clientName);
      socket.join(pin);

      const connectedPayload: SessionConnected = {
        sessionId: pin,
        deviceName: room.hostName,
        workspacePath: room.workspacePath,
        status: "connected",
        connectedAt: Date.now(),
      };

      const validated = SessionConnectedSchema.parse(connectedPayload);
      io.to(pin).emit(SOCKET_EVENTS.SESSION_CONNECTED, validated);
    });

    // 3. Client Prompt Forwarding
    socket.on(SOCKET_EVENTS.CLIENT_PROMPT, (data: unknown) => {
      const parsed = ClientPromptSchema.safeParse(data);
      if (!parsed.success) return;

      const room = roomManager.getRoomByClientSocketId(socket.id);
      if (room && room.hostSocketId) {
        io.to(room.hostSocketId).emit(SOCKET_EVENTS.CLIENT_PROMPT, parsed.data);
      }
    });

    // 4. Agent Stream Chunk Forwarding
    socket.on(SOCKET_EVENTS.AGENT_STREAM, (data: unknown) => {
      const parsed = AgentStreamSchema.safeParse(data);
      if (!parsed.success) return;

      const room = roomManager.getRoomByHostSocketId(socket.id);
      if (room && room.clientSocketId) {
        io.to(room.clientSocketId).emit(SOCKET_EVENTS.AGENT_STREAM, parsed.data);
      }
    });

    // 5. Approval Required Forwarding
    socket.on(SOCKET_EVENTS.APPROVAL_REQUIRED, (data: unknown) => {
      const parsed = ApprovalRequestSchema.safeParse(data);
      if (!parsed.success) return;

      const room = roomManager.getRoomByHostSocketId(socket.id);
      if (room && room.clientSocketId) {
        io.to(room.clientSocketId).emit(SOCKET_EVENTS.APPROVAL_REQUIRED, parsed.data);
      }
    });

    // 6. Approval Response Forwarding
    socket.on(SOCKET_EVENTS.APPROVAL_RESPONSE, (data: unknown) => {
      const parsed = ApprovalResponseSchema.safeParse(data);
      if (!parsed.success) return;

      const room = roomManager.getRoomByClientSocketId(socket.id);
      if (room && room.hostSocketId) {
        io.to(room.hostSocketId).emit(SOCKET_EVENTS.APPROVAL_RESPONSE, parsed.data);
      }
    });

    // 7. Client Reconnection Sync Forwarding
    socket.on(SOCKET_EVENTS.CLIENT_SYNC, (data: unknown) => {
      const parsed = ClientSyncSchema.safeParse(data);
      if (!parsed.success) return;

      const room = roomManager.getRoomByClientSocketId(socket.id);
      if (room && room.hostSocketId) {
        io.to(room.hostSocketId).emit(SOCKET_EVENTS.CLIENT_SYNC, parsed.data);
      }
    });

    // 8. Stream Batch Catch-Up Forwarding
    socket.on(SOCKET_EVENTS.STREAM_BATCH, (data: unknown) => {
      const parsed = StreamBatchSchema.safeParse(data);
      if (!parsed.success) return;

      const room = roomManager.getRoomByHostSocketId(socket.id);
      if (room && room.clientSocketId) {
        io.to(room.clientSocketId).emit(SOCKET_EVENTS.STREAM_BATCH, parsed.data);
      }
    });

    // 9. Socket Disconnect
    socket.on("disconnect", () => {
      const removedRoom = roomManager.removeBySocketId(socket.id);
      if (removedRoom) {
        const wasHost = removedRoom.hostSocketId === socket.id;
        const remainingPeerSocketId = wasHost
          ? removedRoom.clientSocketId
          : removedRoom.hostSocketId;

        if (remainingPeerSocketId) {
          const disconnectNotice: SessionConnected = {
            sessionId: removedRoom.pin,
            deviceName: removedRoom.hostName,
            workspacePath: removedRoom.workspacePath,
            status: "disconnected",
            connectedAt: Date.now(),
          };
          io.to(remainingPeerSocketId).emit(
            SOCKET_EVENTS.SESSION_CONNECTED,
            SessionConnectedSchema.parse(disconnectNotice),
          );
        }
      }
    });
  });

  const start = (overridePort?: number): Promise<{ port: number }> => {
    const listenPort = overridePort ?? port;
    return new Promise<{ port: number }>((resolve, reject) => {
      httpServer.listen(listenPort, () => {
        const addr = httpServer.address();
        const actualPort =
          typeof addr === "object" && addr !== null ? addr.port : listenPort;
        resolve({ port: actualPort });
      });
      httpServer.once("error", reject);
    });
  };

  const stop = (): Promise<void> => {
    return new Promise<void>((resolve) => {
      io.close(() => {
        if (httpServer.listening) {
          httpServer.close(() => resolve());
        } else {
          resolve();
        }
      });
    });
  };

  return {
    httpServer,
    io,
    roomManager,
    rateLimiter,
    port,
    start,
    stop,
  };
}
