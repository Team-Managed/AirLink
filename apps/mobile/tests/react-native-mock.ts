import React from "react";

export const View = ({ children, style, ...props }: any) => React.createElement("div", { style, ...props }, children);
export const Text = ({ children, style, ...props }: any) => React.createElement("span", { style, ...props }, children);
export const TextInput = React.forwardRef(({ style, ...props }: any, ref: any) =>
  React.createElement("input", { ref, style, ...props })
);
export const TouchableOpacity = ({ children, style, onPress, ...props }: any) =>
  React.createElement("button", { style, onClick: onPress, ...props }, children);
export const ScrollView = ({ children, style, ...props }: any) =>
  React.createElement("div", { style, ...props }, children);
export const FlatList = ({ data, renderItem, keyExtractor }: any) =>
  React.createElement(
    "div",
    null,
    data?.map((item: any, idx: number) => {
      const key = keyExtractor ? keyExtractor(item, idx) : String(idx);
      return React.createElement(React.Fragment, { key }, renderItem({ item, index: idx }));
    })
  );
export const Modal = ({ children, visible }: any) => (visible ? React.createElement("div", null, children) : null);
export const SafeAreaView = ({ children, style, ...props }: any) =>
  React.createElement("div", { style, ...props }, children);
export const StatusBar = () => null;
export const ActivityIndicator = () => React.createElement("div", null, "Loading...");

export const StyleSheet = {
  create: (styles: any) => styles,
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
    start: (cb?: any) => {
      if (cb) cb({ finished: true });
    },
  }),
};

export const Vibration = {
  vibrate: (_pattern: any) => {},
  cancel: () => {},
};

export const Platform = {
  OS: "web",
  select: (obj: any) => obj.web || obj.default,
};
