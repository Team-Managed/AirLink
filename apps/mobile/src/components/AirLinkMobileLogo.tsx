import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";

export interface AirLinkMobileLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  animated?: boolean;
}

// Bundled local asset — Metro resolves this at build time on Android/iOS/Web
// eslint-disable-next-line @typescript-eslint/no-require-imports // APPROVED-SUPPRESSION: React Native bundler requires require() for local image assets
const MASCOT_IMG = require("../../assets/airlink_mascot.png");

/**
 * AirLink Origami Mascot — uses the official mascot PNG asset.
 * Renders the dark paper-airplane with sky-blue eyes, smile & flight trail.
 * Works on iOS, Android, and Expo Web without any native SVG dependency.
 */
export const AirLinkMobileLogo: React.FC<AirLinkMobileLogoProps> = ({
  size = 28,
  showText = false,
  textColor = "#f8fafc",
  animated = true,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -1.5, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 1.5, duration: 2200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, floatAnim]);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <Image
          source={MASCOT_IMG}
          style={[styles.image, { width: size, height: size }]}
          resizeMode="contain"
        />
      </Animated.View>

      {showText && (
        <Text style={[styles.brandText, { color: textColor, fontSize: Math.round(size * 0.5) }]}>
          AirLink
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  image: {
    // transparent PNG renders cleanly on all platforms
  },
  brandText: {
    fontWeight: "800",
    letterSpacing: -0.3,
    color: "#f8fafc",
  },
});

export default AirLinkMobileLogo;
