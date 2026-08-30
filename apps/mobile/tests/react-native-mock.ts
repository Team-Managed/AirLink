import React from "react";

export interface MockComponentProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | Record<string, unknown>;
  onPress?: () => void;
  [key: string]: unknown;
}

export const View = ({ children, style, ...props }: MockComponentProps) =>
  React.createElement("div", { style, ...props }, children);
export const Text = ({ children, style, ...props }: MockComponentProps) =>
  React.createElement("span", { style, ...props }, children);
export const TextInput = React.forwardRef<HTMLInputElement, MockComponentProps>(
  ({ style, ...props }, ref) => React.createElement("input", { ref, style, ...props }),
);
TextInput.displayName = "TextInput";

export const TouchableOpacity = ({ children, style, onPress, ...props }: MockComponentProps) =>
  React.createElement("button", { style, onClick: onPress, ...props }, children);
export const ScrollView = ({ children, style, ...props }: MockComponentProps) =>
  React.createElement("div", { style, ...props }, children);

export interface FlatListProps<T = unknown> {
  data?: readonly T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
}

export const FlatList = <T,>({ data, renderItem, keyExtractor }: FlatListProps<T>) =>
  React.createElement(
    "div",
    null,
    data?.map((item: T, idx: number) => {
      const key = keyExtractor ? keyExtractor(item, idx) : String(idx);
      return React.createElement(React.Fragment, { key }, renderItem({ item, index: idx }));
    }),
  );

export const Modal = ({ children, visible }: { children?: React.ReactNode; visible?: boolean }) =>
  visible ? React.createElement("div", null, children) : null;
export const SafeAreaView = ({ children, style, ...props }: MockComponentProps) =>
  React.createElement("div", { style, ...props }, children);
export const StatusBar = () => null;
export const ActivityIndicator = () => React.createElement("div", null, "Loading...");

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
};

export const Animated = {
  Value: class {
    private val: number;
    constructor(v: number) {
      this.val = v;
    }
    setValue(v: number) {
      this.val = v;
    }
    stopAnimation() {}
  },
  timing: () => ({
    start: (cb?: (result: { finished: boolean }) => void) => {
      if (cb) cb({ finished: true });
    },
  }),
};

export const Vibration = {
  vibrate: (_pattern?: number | number[]) => {},
  cancel: () => {},
};

export const Platform = {
  OS: "web",
  select: <T>(obj: { web?: T; default?: T } & Record<string, T | undefined>): T | undefined =>
    obj.web ?? obj.default,
};
