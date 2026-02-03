"use client";
import { Canvas } from "@react-three/fiber";
import { Environment, GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Stars } from "./components/Stars";
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
        camera={{ position: [5, 5, 5], fov: 45, near: 0.1, far: 5000 }}
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
        <fog attach="fog" args={["#000001", 10, 100]} />
        <Stars radius={1000} depth={2000} count={10000} factor={32} saturation={1} fade speed={1} />
        <Stars radius={10} depth={2000} count={30000} factor={1} saturation={1} fade speed={1} />
        <Spaceship/>
        <Asteroids/>
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={["red", "green", "blue"]} labelColor="white" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
