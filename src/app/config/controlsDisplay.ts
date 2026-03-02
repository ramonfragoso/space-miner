/**
 * Controls display config - derived from controls.tsx.
 * Used for dynamic display in the pre-game overlay.
 * Key labels show alternatives (WASD + arrow keys).
 */
export const CONTROLS_DISPLAY = [
  { key: "Space", description: "Thrust" },
  { key: "Shift", description: "Turbo" },
  { key: "W or ↑", description: "Pitch up" },
  { key: "S or ↓", description: "Pitch down" },
  { key: "A or ←", description: "Turn left" },
  { key: "D or →", description: "Turn right" },
  { key: "Q", description: "Roll left" },
  { key: "E", description: "Roll right" },
  { key: "Ctrl", description: "Reverse" },
  { key: "P", description: "Shoot" },
] as const;

export const KEYBOARD_LAYOUT_DISCLAIMER =
  "Works with all keyboard layouts (QWERTY, AZERTY, etc.) — keys are mapped by physical position.";
