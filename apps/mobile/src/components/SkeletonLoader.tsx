import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from "react-native";
import { THEME_COLORS, THEME_RADII } from "../theme";

export interface SkeletonLoaderProps {
  width?: number | `${number}%` | "100%";
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = THEME_RADII.sm,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: false,
        }),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
};

export const TerminalFeedSkeleton: React.FC = () => {
  return (
    <View style={styles.feedSkeletonContainer}>
      <SkeletonLoader width="60%" height={16} style={styles.skeletonItem} />
      <SkeletonLoader width="90%" height={16} style={styles.skeletonItem} />
      <SkeletonLoader width="75%" height={16} style={styles.skeletonItem} />
      <View style={styles.skeletonCard}>
        <SkeletonLoader width="40%" height={14} style={styles.skeletonCardHeader} />
        <SkeletonLoader width="100%" height={40} style={styles.skeletonCardBody} />
      </View>
      <SkeletonLoader width="85%" height={16} style={styles.skeletonItem} />
      <SkeletonLoader width="50%" height={16} style={styles.skeletonItem} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: THEME_COLORS.border,
  },
  feedSkeletonContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonItem: {
    marginBottom: 8,
  },
  skeletonCard: {
    backgroundColor: THEME_COLORS.cardSurface,
    borderRadius: THEME_RADII.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME_COLORS.border,
    marginVertical: 6,
  },
  skeletonCardHeader: {
    marginBottom: 8,
  },
  skeletonCardBody: {
    opacity: 0.5,
  },
});
