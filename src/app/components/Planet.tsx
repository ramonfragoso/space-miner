"use client";
import { useRef } from "react";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

type TextureType = "abstract" | "abstract2" | "abstract3" | "gem" | "lava";

interface PlanetProps {
  position?: [number, number, number];
  size?: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  textureType?: TextureType;
}

// Texture paths mapping for each texture type
const getTexturePaths = (type: TextureType) => {
  const basePath = `/textures/${type}/`;
  
  switch (type) {
    case "abstract":
      return {
        map: `${basePath}Abstract_Organic_005_basecolor.jpg`,
        aoMap: `${basePath}Abstract_Organic_005_ambientOcclusion.jpg`,
        displacementMap: `${basePath}Abstract_Organic_005_height.png`,
        normalMap: `${basePath}Abstract_Organic_005_normal.jpg`,
        roughnessMap: `${basePath}Abstract_Organic_005_roughness.jpg`,
      };
    case "abstract2":
      return {
        map: `${basePath}Abstract_Organic_002_COLOR.jpg`,
        aoMap: `${basePath}Abstract_Organic_002_OCC.jpg`,
        displacementMap: `${basePath}Abstract_Organic_002_DISP.png`,
        normalMap: `${basePath}Abstract_Organic_002_NORM.jpg`,
        roughnessMap: `${basePath}Abstract_Organic_002_ROUGH.jpg`,
      };
    case "abstract3":
      return {
        map: `${basePath}Abstract_003_COLOR.jpg`,
        aoMap: `${basePath}Abstract_003_OCC.jpg`,
        displacementMap: `${basePath}Abstract_003_DISP.png`,
        normalMap: `${basePath}Abstract_003_NRM.jpg`,
        roughnessMap: `${basePath}Abstract_003_OCC.jpg`, // No roughness, using OCC
      };
    case "gem":
      return {
        map: `${basePath}Encrusted_Gems_002_COLOR.jpg`,
        aoMap: `${basePath}Encrusted_Gems_002_OCC.jpg`,
        displacementMap: `${basePath}Encrusted_Gems_002_DISP.png`,
        normalMap: `${basePath}Encrusted_Gems_002_NORM.jpg`,
        roughnessMap: `${basePath}Encrusted_Gems_002_ROUGH.jpg`,
      };
    case "lava":
      return {
        map: `${basePath}Lava_006_basecolor.jpg`,
        aoMap: `${basePath}Lava_006_ambientOcclusion.jpg`,
        displacementMap: `${basePath}Lava_006_height.png`,
        normalMap: `${basePath}Lava_006_normal.jpg`,
        roughnessMap: `${basePath}Lava_006_roughness.jpg`,
        emissiveMap: `${basePath}Lava_006_emissive.jpg`,
      };
  }
};

export function Planet({
  position = [1000, -1000, -1000],
  size = 200,
  color = "#ffffff",
  emissive = "#666600",
  emissiveIntensity = 10,
  roughness = 0.7,
  metalness = 0.3,
  textureType = "lava",
}: PlanetProps) {
  const meshRef = useRef<Mesh>(null);
  
  // Get texture paths based on type
  const texturePaths = getTexturePaths(textureType);
  
  // Load all textures
  const textures = useTexture({
    map: texturePaths.map,
    aoMap: texturePaths.aoMap,
    displacementMap: texturePaths.displacementMap,
    normalMap: texturePaths.normalMap,
    roughnessMap: texturePaths.roughnessMap,
    ...(texturePaths.emissiveMap && { emissiveMap: texturePaths.emissiveMap }),
  });

  // Optional: Add a slow rotation to the planet
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial
        map={textures.map}
        aoMap={textures.aoMap}
        aoMapIntensity={1}
        displacementMap={textures.displacementMap}
        displacementScale={0.1}
        normalMap={textures.normalMap}
        normalScale={[1, 1]}
        roughnessMap={textures.roughnessMap}
        emissiveMap={textures.emissiveMap}
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}

// Preload all texture sets for better performance
const textureTypes: TextureType[] = ["abstract", "abstract2", "abstract3", "gem", "lava"];
textureTypes.forEach((type) => {
  const paths = getTexturePaths(type);
  Object.values(paths).forEach((path) => {
    if (path) useTexture.preload(path);
  });
});
