"use client";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Stars } from "./components/Stars";
import * as THREE from "three";
import { useRef } from "react";
import { useDebugUI } from "./hooks/useDebugUI";
import { Leva } from "leva";
import { Lights } from "./components/Lights";
import { Spaceship } from "./components/Spaceship";
import { Asteroids } from "./components/Asteroids";
import { Planet } from "./components/Planet";

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
        <Spaceship />
        <Asteroids />

        <Planet
          position={[1500, -2500, 1500]}
          size={100}
          color="#ff4400"
          emissive="#ff2200"
          emissiveIntensity={5}
          textureType="gem"
        />
        <Planet
          position={[-1500, -1500, -1500]}
          size={200}
          color="#11aa88"
          emissive="#66aa99"
          emissiveIntensity={2.5}
          textureType="abstract3"
        />
        <Planet
          position={[-2000, -1500, -1500]}
          size={100}
          color="#cc88ff"
          emissive="#6611ee"
          emissiveIntensity={12}
          textureType="abstract3"
        />
        <Planet
          position={[100, 0, 2500]}
          size={300}
          color="#ffff88"
          emissive="#888800"
          emissiveIntensity={15}
          textureType="abstract"
        />
        <Planet
          position={[-2000, 3000, -2000]}
          size={900}
          color="#ff7700"
          emissive="#993300"
          emissiveIntensity={30}
          textureType="lava"
        />
        <EffectComposer>
          <Bloom
            mipmapBlur
            luminanceThreshold={1}
            intensity={1.5}
            luminanceSmoothing={0.025}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
