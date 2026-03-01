/**
 * Controls display config - derived from controls.tsx.
 * Used for dynamic display in the pre-game overlay.
 */
export const CONTROLS_DISPLAY = [
  { key: "Space", description: "Thrust" },
  { key: "Shift", description: "Turbo" },
  { key: "W", description: "Pitch up" },
  { key: "S", description: "Pitch down" },
  { key: "A", description: "Turn left" },
  { key: "D", description: "Turn right" },
  { key: "Q", description: "Roll left" },
  { key: "E", description: "Roll right" },
  { key: "Ctrl", description: "Reverse" },
  { key: "P", description: "Shoot" },
] as const;
