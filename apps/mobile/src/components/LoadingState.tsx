import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const CHEVRON_DELAYS = [
  0, 90, 180,
  90, 180, 270,
  180, 270, 360,
];

function useElapsed(active: boolean) {
  const [ds, setDs] = useState(0);

  useEffect(() => {
    if (!active) {
      setDs(0);
      return;
    }
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, [active]);

  const total = ds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

export interface LoadingStateProps {
  label?: string;
  isStreaming?: boolean;
  variant?: "Drive" | "Dots";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Agent working...",
  isStreaming = true,
  variant = "Drive",
}) => {
  const elapsed = useElapsed(isStreaming);
  const animValues = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(0.15)),
  ).current;
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  // Staggered chevron wavefront animation
  useEffect(() => {
    if (!isStreaming) return;

    const animations = animValues.map((anim, i) => {
      const delay = CHEVRON_DELAYS[i] || 0;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 325,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.15,
            duration: 325,
            useNativeDriver: true,
          }),
        ]),
      );
    });

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animations.forEach((a) => a.start());
    shimmer.start();

    return () => {
      animations.forEach((a) => a.stop());
      shimmer.stop();
    };
  }, [isStreaming, animValues, pulseAnim]);

  const isRound = variant === "Dots";

  return (
    <View style={styles.glassContainer}>
      {/* 3x3 Pixel Grid Wavefront */}
      <View style={styles.grid}>
        {[0, 1, 2].map((r) => (
          <View key={`r-${r}`} style={styles.gridRow}>
            {[0, 1, 2].map((c) => {
              const idx = r * 3 + c;
              return (
                <Animated.View
                  key={`cell-${idx}`}
                  style={[
                    styles.pixel,
                    isRound && styles.pixelRound,
                    { opacity: animValues[idx] },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Shimmering Text Label */}
      <Animated.Text style={[styles.labelText, { opacity: pulseAnim }]}>
        {label}
      </Animated.Text>

      {/* Monospace Live Elapsed Timer */}
      <Text style={styles.elapsedText}>{elapsed}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.30)",
    borderRadius: 9999,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  grid: {
    gap: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  gridRow: {
    flexDirection: "row",
    gap: 2,
  },
  pixel: {
    width: 3.5,
    height: 3.5,
    backgroundColor: "#ffffff",
    borderRadius: 1,
  },
  pixelRound: {
    borderRadius: 2,
  },
  labelText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  elapsedText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontFamily: "monospace",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default LoadingState;
