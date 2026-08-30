"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useWebSession } from "../../hooks/useWebSession";
import { DitheredBackground } from "../../components/landing/DitheredBackground";
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
      <DitheredBackground />

      <div style={styles.relativeContent}>
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
    </div>
  );
}

export default function WebPairPage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 40, color: "#94a3b8" }}>Loading AirLink Web Remote...</div>}
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
    position: "relative",
    overflowX: "hidden",
  },
  relativeContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  toastBanner: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderBottom: "1px solid rgba(16, 185, 129, 0.3)",
    padding: "6px 16px",
    color: "#34d399",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderBottom: "1px solid rgba(239, 68, 68, 0.3)",
    padding: "6px 16px",
    color: "#f87171",
    fontSize: 12,
    textAlign: "center",
    fontWeight: 700,
  },
  sessionContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxWidth: 1040,
    margin: "0 auto",
    width: "100%",
    padding: "16px 20px",
    gap: 12,
  },
};
