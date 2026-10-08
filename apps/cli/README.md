# @airlink/cli

> Interactive terminal CLI host and client for remote coding agent control.

Remotely prompt, stream, and approve your local AI coding agent from your mobile phone — without opening a single port.

## Quick Start

### 1. Launch AirLink
Once installed, simply run:

```bash
airlink
```

### 2. Instant Run (without installing)
You can also run AirLink directly via `npx`:

```bash
npx @airlink/cli
```

### 3. Global Installation
To install globally on your workstation:

```bash
npm install -g @airlink/cli
airlink
```

## Features

- **Zero-Port Tunneling:** Connects outbound to the Cloud Relay over secure WebSocket. No firewall rules or port forwarding required.
- **6-Digit PIN Pairing:** Secure 6-digit session pairing code and QR code for rapid mobile connection.
- **Human-in-the-Loop Safeguards:** Approve or reject destructive commands (bash, file modifications) directly from your phone with automatic timeout fallback.
- **Resilient Ring Buffer:** Reconnection catch-up via a 500-event ring buffer so elevator rides or network drops never lose state.
- **Full Terminal UI:** Interactive status, QR code display, connected clients count, and real-time execution logs.

## Requirements

- Node.js >= 18.0.0

## Documentation & Web Companion

- Web App: [https://airlink-green.vercel.app](https://airlink-green.vercel.app)
- Mobile Pairing: [https://airlink-green.vercel.app/pair](https://airlink-green.vercel.app/pair)

## License

MIT
