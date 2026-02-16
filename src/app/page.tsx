"use client";
import { Environment } from "@react-three/drei";
import { Stars } from "./components/Stars";
import { useDebugUI } from "./hooks/useDebugUI";
import { Leva } from "leva";
import { Lights } from "./components/Lights";
import { Spaceship } from "./components/Spaceship";
import { Asteroids } from "./components/Asteroids";
import { Planet } from "./components/Planet";
import { GameplayProvider } from "./contexts/GameplayContext";
import { GameplayHUD } from "./components/GameplayHUD";
import WebGPUCanvas from "./components/WebGPUCanvas";
import { PostProcessing } from "./components/PostProcessing";

export default function Home() {
  const {
    postProcessing,
    gemPlanet,
    tealPlanet,
    purplePlanet,
    yellowPlanet,
    lavaPlanet,
  } = useDebugUI();

  return (
    <GameplayProvider>
    <div className="w-full h-screen">
      <div className="z-50 absolute overflow-auto top-1 right-1 rounded-md max-w-[370px] max-h-screen ">
        <Leva fill collapsed/>
      </div>

      <GameplayHUD />

      <WebGPUCanvas>
        <Environment backgroundIntensity={2} background files="/hdr_compressed.hdr" />
        <Lights />
        <fog attach="fog" args={["#000001", 10, 100]} />
        <Stars radius={1000} depth={2000} count={10000} factor={32} saturation={1} fade speed={1} />
        <Stars radius={100} depth={2000} count={30000} factor={1} saturation={1} fade speed={1} />
        <Spaceship />
        <Asteroids />

        <Planet
          position={[1500, -2500, 1500]}
          size={100}
          color={gemPlanet.color}
          emissive={gemPlanet.emissive}
          emissiveIntensity={gemPlanet.emissiveIntensity}
          textureType="gem"
        />
        <Planet
          position={[-1500, -1500, -1500]}
          size={200}
          color={tealPlanet.color}
          emissive={tealPlanet.emissive}
          emissiveIntensity={tealPlanet.emissiveIntensity}
          textureType="abstract3"
        />
        <Planet
          position={[-2000, -1500, -1500]}
          size={100}
          color={purplePlanet.color}
          emissive={purplePlanet.emissive}
          emissiveIntensity={purplePlanet.emissiveIntensity}
          textureType="abstract3"
        />
        <Planet
          position={[100, 0, 2500]}
          size={300}
          color={yellowPlanet.color}
          emissive={yellowPlanet.emissive}
          emissiveIntensity={yellowPlanet.emissiveIntensity}
          textureType="abstract"
        />
        <Planet
          position={[-2000, 3000, -2000]}
          size={900}
          color={lavaPlanet.color}
          emissive={lavaPlanet.emissive}
          emissiveIntensity={lavaPlanet.emissiveIntensity}
          textureType="lava"
        />
        <PostProcessing
          strength={postProcessing.strength}
          radius={postProcessing.radius}
          threshold={postProcessing.threshold}
          />
      </WebGPUCanvas>
    </div>
    </GameplayProvider>
  );
}
