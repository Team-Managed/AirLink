import React, { useState, useEffect } from "react";
import { View, StyleSheet, StatusBar, Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { THEME_COLORS } from "./theme";
import { PairingScreen } from "./screens/PairingScreen";
import { SessionScreen } from "./screens/SessionScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { mobileSocketService } from "./services/socket";
import { vaultService } from "./services/vault";
import type { SessionConnected, StandardError, BYOKConfig } from "./types";

export function App(): React.JSX.Element {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionConnected | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [byokConfig, setByokConfig] = useState<BYOKConfig | null>(null);

  const STORAGE_PIN_KEY = "agent_remote_active_pin";
  const STORAGE_RELAY_KEY = "agent_remote_active_relay";

  const handleConnect = (pin: string, relayUrl: string) => {
    setErrorMessage(null);
    setIsConnecting(true);

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(STORAGE_PIN_KEY, pin);
        localStorage.setItem(STORAGE_RELAY_KEY, relayUrl);
      } catch {
        // Storage fallback
      }
    }

    try {
      mobileSocketService.connect(relayUrl);
      mobileSocketService.join(pin, "Agent Remote Mobile Client");
    } catch (err) {
      setIsConnecting(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Connection initialization error: ${msg}`);
    }
  };

  useEffect(() => {
    void (async () => {
      const active = await vaultService.getActiveConfig();
      setByokConfig(active);

      // Auto-reconnect to existing active session on page reload or app restart
      if (typeof localStorage !== "undefined") {
        try {
          const savedPin = localStorage.getItem(STORAGE_PIN_KEY);
          const savedRelay = localStorage.getItem(STORAGE_RELAY_KEY) || (typeof process !== "undefined" && process.env.EXPO_PUBLIC_RELAY_URL) || "https://airlink-relay.onrender.com";
          if (savedPin && savedPin.replace(/\D/g, "").length === 6) {
            handleConnect(savedPin.replace(/\D/g, ""), savedRelay);
          }
        } catch {
          // Storage fallback
        }
      }
    })();

    const unsubscribe = mobileSocketService.subscribe({
      onSessionConnected: (data: SessionConnected) => {
        setIsConnecting(false);
        if (data.status === "disconnected") {
          setIsPaired(false);
          setSessionData(null);
          if (typeof localStorage !== "undefined") {
            try {
              localStorage.removeItem(STORAGE_PIN_KEY);
            } catch {
              // Ignore
            }
          }
          setErrorMessage("Workstation host has disconnected from the room.");
          return;
        }
        setIsPaired(true);
        setSessionData(data);
        setErrorMessage(null);
      },
      onError: (err: StandardError) => {
        setIsConnecting(false);
        if (
          err.code === "INVALID_PIN" ||
          err.code === "ROOM_EXPIRED" ||
          err.code === "RATE_LIMITED"
        ) {
          if (typeof localStorage !== "undefined") {
            try {
              localStorage.removeItem(STORAGE_PIN_KEY);
            } catch {
              // Ignore
            }
          }
        }
        setErrorMessage(`[${err.code}] ${err.message}`);
      },
      onDisconnect: (_reason: string) => {
        setIsConnecting(false);
        setIsPaired(false);
      },
      onConnectError: (err: Error) => {
        setIsConnecting(false);
        setErrorMessage(`Relay connection failed: ${err.message}`);
      },
    });

    return () => {
      unsubscribe();
      mobileSocketService.disconnect();
    };
  }, []);

  const handleDisconnect = () => {
    mobileSocketService.disconnect();
    setIsPaired(false);
    setSessionData(null);
    setErrorMessage(null);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_PIN_KEY);
        localStorage.removeItem(STORAGE_RELAY_KEY);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.rootContainer}>
        <StatusBar barStyle="light-content" backgroundColor={THEME_COLORS.backgroundBase} />
        <View style={styles.appViewport}>
          {isPaired && sessionData ? (
            <SessionScreen
              sessionData={sessionData}
              onDisconnect={handleDisconnect}
              byokConfig={byokConfig}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          ) : (
            <PairingScreen
              onConnect={handleConnect}
              isConnecting={isConnecting}
              errorMessage={errorMessage}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          <Modal
            visible={isSettingsOpen}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setIsSettingsOpen(false)}
          >
            <SettingsScreen
              onClose={() => setIsSettingsOpen(false)}
              onConfigSaved={(cfg) => setByokConfig(cfg)}
            />
          </Modal>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: THEME_COLORS.backgroundBase,
    alignItems: "center",
    justifyContent: "center",
  },
  appViewport: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    backgroundColor: THEME_COLORS.backgroundBase,
  },
});

export default App;


