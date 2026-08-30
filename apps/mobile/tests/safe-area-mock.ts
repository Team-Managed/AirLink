import React from "react";

export interface MockSafeAreaProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | Record<string, unknown>;
  [key: string]: unknown;
}

export const SafeAreaView = ({ children, style, ...props }: MockSafeAreaProps) =>
  React.createElement("div", { style, ...props }, children);

export const SafeAreaProvider = ({ children }: { children?: React.ReactNode }) =>
  React.createElement("div", null, children);

export const SafeAreaConsumer = ({
  children,
}: {
  children: (insets: { top: number; bottom: number; left: number; right: number }) => React.ReactNode;
}) => children({ top: 0, bottom: 0, left: 0, right: 0 });

export const useSafeAreaInsets = () => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
});
