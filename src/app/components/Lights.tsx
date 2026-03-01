"use client";

import { useDebugUI } from "../hooks/useDebugUI";

export function Lights() {
  const { lighting } = useDebugUI();
  const { ambientIntensity } = lighting;

  return <ambientLight intensity={ambientIntensity} />;
}
