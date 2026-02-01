"use client";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import { useDebugUI } from "./hooks/useDebugUI";
import { Leva } from "leva";
import { Lights } from "./components/Lights";
import { Spaceship } from "./components/Spaceship";
import { Asteroids } from "./components/Asteroids";

export default function Home() {
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  useDebugUI(); 

  return (
    <div className="w-full h-screen">
      <div className="z-50 absolute  overflow-auto top-1 right-1 rounded-md max-w-[370px] ">
        <Leva fill />
      </div>
      
      <Canvas
        shadows
        dpr={[0.5, 0.8]}
        camera={{ position: [5, 5, 5], fov: 45, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0, 0);
          cameraRef.current = camera as THREE.PerspectiveCamera;
        }}
      >
        <Environment background files="/hdr_compressed.hdr" />
        <Lights />
        <Spaceship/>
        <Asteroids/>
      </Canvas>
    </div>
  );
}
