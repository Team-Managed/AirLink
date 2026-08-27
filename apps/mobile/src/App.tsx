import React, { useState, useEffect } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { THEME_COLORS } from "./theme";
import { PairingScreen } from "./screens/PairingScreen";
import { SessionScreen } from "./screens/SessionScreen";
import { mobileSocketService } from "./services/socket";
import type { SessionConnected, StandardError } from "./types";

export function App(): React.JSX.Element {
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionConnected | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = mobileSocketService.subscribe({
      onSessionConnected: (data: SessionConnected) => {
        setIsConnecting(false);
        if (data.status === "disconnected") {
          setIsPaired(false);
          setSessionData(null);
          setErrorMessage("Workstation host has disconnected from the room.");
          return;
        }
        setIsPaired(true);
        setSessionData(data);
        setErrorMessage(null);
      },
      onError: (err: StandardError) => {
        setIsConnecting(false);
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

  const handleConnect = (pin: string, relayUrl: string) => {
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      mobileSocketService.connect(relayUrl);
      mobileSocketService.join(pin, "Agent Remote Mobile Client");
    } catch (err) {
      setIsConnecting(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Connection initialization error: ${msg}`);
    }
  };

  const handleDisconnect = () => {
    mobileSocketService.disconnect();
    setIsPaired(false);
    setSessionData(null);
    setErrorMessage(null);
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLORS.backgroundBase} />
      {isPaired && sessionData ? (
        <SessionScreen sessionData={sessionData} onDisconnect={handleDisconnect} />
      ) : (
        <PairingScreen
          onConnect={handleConnect}
          isConnecting={isConnecting}
          errorMessage={errorMessage}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: THEME_COLORS.backgroundBase,
  },
});

export default App;
