"use client";
import { useRef, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDebugUI } from "../hooks/useDebugUI";

interface AsteroidData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  rotationVelocity: THREE.Vector3;
  movementDirection: THREE.Vector3;
  baseRotationSpeed: number;
  baseMovementSpeed: number;
  asteroidTypeIndex: number;
  scale: number;
  instanceIndex: number; 
}

export function Asteroids() {
  const { nodes } = useGLTF('/asteroids.glb');
  const { asteroids: asteroidControls } = useDebugUI();
  
  const instancedMeshRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());

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

  const { bigCount, mediumCount, smallCount } = asteroidControls;

  const { asteroidsData, instanceCounts } = useMemo(() => {
    const instanceIndices = new Map<number, number>();
    allAsteroidNames.forEach((_, idx) => instanceIndices.set(idx, 0));

    const data: AsteroidData[] = [];

    const createAsteroid = (
      typeNames: string[],
      scale: number
    ): AsteroidData => {
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500
      );

      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
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

      const asteroidName = typeNames[Math.floor(Math.random() * typeNames.length)];
      const asteroidTypeIndex = allAsteroidNames.indexOf(asteroidName);
      const instanceIndex = instanceIndices.get(asteroidTypeIndex) || 0;
      instanceIndices.set(asteroidTypeIndex, instanceIndex + 1);

      return {
        position,
        rotation,
        rotationVelocity,
        movementDirection,
        baseRotationSpeed,
        baseMovementSpeed,
        asteroidTypeIndex,
        scale,
        instanceIndex,
      };
    };

    for (let i = 0; i < bigCount; i++) {
      data.push(createAsteroid(asteroidNamesByType.big, 10));
    }

    for (let i = 0; i < mediumCount; i++) {
      data.push(createAsteroid(asteroidNamesByType.medium, 2));
    }

    for (let i = 0; i < smallCount; i++) {
      data.push(createAsteroid(asteroidNamesByType.small, 1));
    }

    const counts = new Map<number, number>();
    allAsteroidNames.forEach((_, idx) => {
      counts.set(idx, instanceIndices.get(idx) || 0);
    });

    return { asteroidsData: data, instanceCounts: counts };
  }, [asteroidNamesByType, allAsteroidNames, bigCount, mediumCount, smallCount]);

  useEffect(() => {
    const matrix = new THREE.Matrix4();
    
    instancedMeshRefs.current.forEach((instancedMesh, asteroidName) => {
      const asteroidTypeIndex = allAsteroidNames.indexOf(asteroidName);
      const instances = asteroidsData.filter(a => a.asteroidTypeIndex === asteroidTypeIndex);
      
      instances.forEach((asteroidData) => {
        matrix.compose(
          asteroidData.position,
          new THREE.Quaternion().setFromEuler(asteroidData.rotation),
          new THREE.Vector3(asteroidData.scale, asteroidData.scale, asteroidData.scale)
        );
        instancedMesh.setMatrixAt(asteroidData.instanceIndex, matrix);
      });
      
      instancedMesh.instanceMatrix.needsUpdate = true;
    });
  }, [asteroidsData, allAsteroidNames]);

  useFrame((state, delta) => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();

    asteroidsData.forEach((asteroidData) => {
      const rotationSpeed = asteroidData.baseRotationSpeed * asteroidControls.spinVelocityMultiplier;
      asteroidData.rotation.x += asteroidData.rotationVelocity.x * rotationSpeed;
      asteroidData.rotation.y += asteroidData.rotationVelocity.y * rotationSpeed;
      asteroidData.rotation.z += asteroidData.rotationVelocity.z * rotationSpeed;

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

      const asteroidName = allAsteroidNames[asteroidData.asteroidTypeIndex];
      const instancedMesh = instancedMeshRefs.current.get(asteroidName);
      
      if (instancedMesh) {
        quaternion.setFromEuler(asteroidData.rotation);
        matrix.compose(
          asteroidData.position,
          quaternion,
          new THREE.Vector3(asteroidData.scale, asteroidData.scale, asteroidData.scale)
        );
        instancedMesh.setMatrixAt(asteroidData.instanceIndex, matrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    });
  });

  return (
    <group>
      {allAsteroidNames.map((asteroidName) => {
        const node = nodes?.[asteroidName as keyof typeof nodes] as THREE.Mesh | undefined;
        if (!node?.geometry || !node?.material) return null;

        const count = instanceCounts.get(allAsteroidNames.indexOf(asteroidName)) || 0;
        if (count === 0) return null;

        return (
          <instancedMesh
            key={asteroidName}
            ref={(ref) => {
              if (ref) {
                instancedMeshRefs.current.set(asteroidName, ref);
              }
            }}
            args={[node.geometry, node.material, count]}
            frustumCulled={false}
          />
        );
      })}
    </group>
  );
}

useGLTF.preload("/asteroids.glb");
