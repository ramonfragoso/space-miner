"use client";
import { useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDebugUI } from "../hooks/useDebugUI";

interface AsteroidData {
  position: THREE.Vector3;
  rotationVelocity: THREE.Vector3;
  movementDirection: THREE.Vector3;
  baseRotationSpeed: number;
  baseMovementSpeed: number;
  asteroidTypeIndex: number;
  scale: number;
}

const ASTEROID_COUNT = 1000;

export function Asteroids() {
  const { nodes } = useGLTF('/asteroids.glb');
  const groupRef = useRef<THREE.Group>(null);
  const { asteroids: asteroidControls } = useDebugUI();

  const asteroidNamesByType = useMemo(() => ({
    big: [
      'asteroid_big',
      'asteroid_big001',
      'asteroid_big002',
    ],
    medium: [
      'asteroid_medium',
      'asteroid_medium001',
      'asteroid_medium002',
    ],
    small: [
      'asteroid_small',
      'asteroid_small002',
      'asteroid_small003',
    ],
  }), []);

  const allAsteroidNames = useMemo(() => [
    ...asteroidNamesByType.big,
    ...asteroidNamesByType.medium,
    ...asteroidNamesByType.small,
  ], [asteroidNamesByType]);

  const { bigPercent, mediumPercent, smallPercent } = asteroidControls;

  const asteroidsData = useMemo<AsteroidData[]>(() => {
    const totalPercent = bigPercent + mediumPercent + smallPercent;
    
    // Normalize percentages if they don't add up to 100
    const normalizedBig = totalPercent > 0 ? bigPercent / totalPercent : 0.1;
    const normalizedMedium = totalPercent > 0 ? mediumPercent / totalPercent : 0.4;

    return Array.from({ length: ASTEROID_COUNT }, () => {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500
      );

      const rotationVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(Math.random() * 0.02 + 0.01);

      const movementDirection = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      const baseRotationSpeed = Math.random() * 0.01 + 0.005;
      const baseMovementSpeed = Math.random() * 0.5 + 0.1;

      // Determine asteroid type based on percentages
      const rand = Math.random();
      let asteroidName: string;
      let scale: number;

      if (rand < normalizedBig) {
        const typeNames = asteroidNamesByType.big;
        asteroidName = typeNames[Math.floor(Math.random() * typeNames.length)];
        scale = 10;
      } else if (rand < normalizedBig + normalizedMedium) {
        const typeNames = asteroidNamesByType.medium;
        asteroidName = typeNames[Math.floor(Math.random() * typeNames.length)];
        scale = 2;
      } else {
        const typeNames = asteroidNamesByType.small;
        asteroidName = typeNames[Math.floor(Math.random() * typeNames.length)];
        scale = 1;
      }

      // Find the index in the allAsteroidNames array
      const asteroidTypeIndex = allAsteroidNames.indexOf(asteroidName);

      return {
        position,
        rotationVelocity,
        movementDirection,
        baseRotationSpeed,
        baseMovementSpeed,
        asteroidTypeIndex,
        scale,
      };
    });
  }, [asteroidNamesByType, allAsteroidNames, bigPercent, mediumPercent, smallPercent]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    asteroidsData.forEach((asteroidData, index) => {
      const asteroid = groupRef.current?.children[index] as THREE.Group;
      if (!asteroid) return;

      const rotationSpeed = asteroidData.baseRotationSpeed * asteroidControls.spinVelocityMultiplier;
      asteroid.rotation.x += asteroidData.rotationVelocity.x * rotationSpeed;
      asteroid.rotation.y += asteroidData.rotationVelocity.y * rotationSpeed;
      asteroid.rotation.z += asteroidData.rotationVelocity.z * rotationSpeed;

      const movementSpeed = asteroidData.baseMovementSpeed * asteroidControls.moveVelocityMultiplier;
      asteroidData.position.add(
        asteroidData.movementDirection.clone().multiplyScalar(movementSpeed * delta)
      );

      const halfSize = 500;
      if (Math.abs(asteroidData.position.x) > halfSize) {
        asteroidData.position.x = -Math.sign(asteroidData.position.x) * halfSize;
      }
      if (Math.abs(asteroidData.position.y) > halfSize) {
        asteroidData.position.y = -Math.sign(asteroidData.position.y) * halfSize;
      }
      if (Math.abs(asteroidData.position.z) > halfSize) {
        asteroidData.position.z = -Math.sign(asteroidData.position.z) * halfSize;
      }

      asteroid.position.copy(asteroidData.position);
    });
  });

  return (
    <group 
      ref={groupRef}
    >
      {asteroidsData.map((asteroidData, index) => {
        const asteroidName = allAsteroidNames[asteroidData.asteroidTypeIndex];
        const node = nodes?.[asteroidName as keyof typeof nodes] as THREE.Mesh | undefined;
        if (!node?.geometry || !node?.material) return null;

        return (
          <group key={index} position={asteroidData.position} scale={asteroidData.scale}>
            <mesh 
              geometry={node.geometry} 
              material={node.material}
            />
          </group>
        );
      })}
    </group>
  );
}

useGLTF.preload("/asteroids.glb");
