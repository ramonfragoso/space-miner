"use client";
import { Canvas, extend, type ThreeToJSXElements } from "@react-three/fiber";
import React, { type FC, type PropsWithChildren } from "react";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import { type WebGPURendererParameters } from "three/src/renderers/webgpu/WebGPURenderer.js";
import * as THREE from "three/webgpu";

declare module "@react-three/fiber" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
extend(THREE as any);

type Props = PropsWithChildren<{
  isMobile?: boolean;
}>;

const WebGPUCanvas: FC<Props> = ({ children }) => {
  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 45, near: 0.1, far: 5000 }}
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...props as WebGPURendererParameters,
          forceWebGL: !WebGPU.isAvailable(),
        });
        await renderer.init();
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        return renderer;
      }}
    >
      {children}
    </Canvas>
  );
};

export default WebGPUCanvas;
