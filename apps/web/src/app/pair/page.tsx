"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWebSession } from "../../hooks/useWebSession";
import { PairHeader } from "../../components/pair/PairHeader";
import { PairingCard } from "../../components/pair/PairingCard";
import { WebTerminalFeed } from "../../components/pair/WebTerminalFeed";
import { WebPromptBar } from "../../components/pair/WebPromptBar";
import { WebApprovalModal } from "../../components/pair/WebApprovalModal";
import { WebSettingsModal } from "../../components/pair/WebSettingsModal";

function WebPairClient() {
  const searchParams = useSearchParams();
  const initialPin = searchParams.get("pin") || "";
  const initialRelay =
    searchParams.get("relay") || process.env.NEXT_PUBLIC_RELAY_URL || "http://localhost:3001";

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const {
    pin,
    relayUrl,
    isConnecting,
    isConnected,
    errorBanner,
    reconnectToast,
    sessionData,
    feedItems,
    activeApproval,
    isStreaming,
    provider,
    model,
    apiKey,
    showApiKey,
    setPin,
    setRelayUrl,
    setProvider,
    setModel,
    setApiKey,
    setShowApiKey,
    connect,
    disconnect,
    sendPrompt,
    approve,
    deny,
  } = useWebSession({
    initialPin,
    initialRelayUrl: initialRelay,
  });

  return (
    <div style={styles.webContainer}>
      {/* Top Bar */}
      <PairHeader
        isConnected={isConnected}
        sessionData={sessionData}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onDisconnect={disconnect}
      />

      {/* Notifications */}
      {reconnectToast && (
        <div style={styles.toastBanner}>
          <span>{reconnectToast}</span>
        </div>
      )}
      {errorBanner && (
        <div style={styles.errorBanner}>
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <WebSettingsModal
          provider={provider}
          model={model}
          apiKey={apiKey}
          showApiKey={showApiKey}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onApiKeyChange={setApiKey}
          onToggleShowApiKey={() => setShowApiKey(!showApiKey)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Main Content: Pairing View vs Live Session View */}
      {!isConnected ? (
        <PairingCard
          pin={pin}
          relayUrl={relayUrl}
          isConnecting={isConnecting}
          onPinChange={setPin}
          onRelayUrlChange={setRelayUrl}
          onConnect={connect}
        />
      ) : (
        <div style={styles.sessionContainer}>
          <WebTerminalFeed feedItems={feedItems} isStreaming={isStreaming} />
          <WebPromptBar isStreaming={isStreaming} onSendPrompt={sendPrompt} />

          {activeApproval && (
            <WebApprovalModal activeApproval={activeApproval} onApprove={approve} onDeny={deny} />
          )}
        </div>
      )}
    </div>
  );
}

export default function WebPairPage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 40, color: "#94a3b8" }}>Loading Web Remote Shell...</div>}
    >
      <WebPairClient />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  webContainer: {
    backgroundColor: "#090d16",
    color: "#f8fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  toastBanner: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderBottom: "1px solid #38bdf8",
    padding: "6px 16px",
    color: "#38bdf8",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "var(--font-mono)",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderBottom: "1px solid #ef4444",
    padding: "6px 16px",
    color: "#ef4444",
    fontSize: 12,
    textAlign: "center",
  },
  sessionContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxWidth: 1000,
    margin: "0 auto",
    width: "100%",
    padding: "16px 20px",
    gap: 12,
  },
};
