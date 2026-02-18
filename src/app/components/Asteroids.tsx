"use client";
import { useRef, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDebugUI } from "../hooks/useDebugUI";
import { useGameplay } from "../hooks/useGameplay";
import type { AsteroidSizeType } from "../contexts/GameplayContext";
import {
  buildConvexHullFromGeometry,
  distanceFromPointToConvexHull,
  directionToSphereUV,
} from "../utils/asteroidCollision";

const SHIELD_RADIUS = 0.1;

interface AsteroidData {
  id: string;
  gameplayType: AsteroidSizeType;
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
  const gameplay = useGameplay();

  const instancedMeshRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());
  const asteroidMatrixRef = useRef(new THREE.Matrix4());
  const asteroidMatrixInvRef = useRef(new THREE.Matrix4());
  const shipPosLocalRef = useRef(new THREE.Vector3());
  const scaleVecRef = useRef(new THREE.Vector3());
  const closestPointLocalRef = useRef(new THREE.Vector3());
  const closestPointWorldRef = useRef(new THREE.Vector3());
  const impactDirRef = useRef(new THREE.Vector3());

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

  /** Map visual type category → gameplay size type */
  const gameplayTypeForName = useMemo(() => {
    const map = new Map<string, AsteroidSizeType>();
    asteroidNamesByType.big.forEach((n) => map.set(n, "large"));
    asteroidNamesByType.medium.forEach((n) => map.set(n, "medium"));
    asteroidNamesByType.small.forEach((n) => map.set(n, "small"));
    return map;
  }, [asteroidNamesByType]);

  const { bigCount, mediumCount, smallCount } = asteroidControls;

  /** Convex hull per asteroid geometry (model space), built once when nodes load */
  const convexHullsByAsteroidName = useMemo(() => {
    const hulls = new Map<string, ReturnType<typeof buildConvexHullFromGeometry>>();
    if (!nodes) return hulls;

    allAsteroidNames.forEach((asteroidName) => {
      const node = nodes[asteroidName as keyof typeof nodes] as THREE.Mesh | undefined;
      const geometry = node?.geometry;
      if (geometry) {
        const hull = buildConvexHullFromGeometry(geometry);
        if (hull) hulls.set(asteroidName, hull);
      }
    });
    return hulls;
  }, [nodes, allAsteroidNames]);

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

      const gameplayType = gameplayTypeForName.get(asteroidName) ?? "small";
      const id = `${asteroidName}_${instanceIndex}`;

      return {
        id,
        gameplayType,
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
  }, [asteroidNamesByType, allAsteroidNames, gameplayTypeForName, bigCount, mediumCount, smallCount]);

  // ---- Register all asteroids with the gameplay context ----
  useEffect(() => {
    asteroidsData.forEach((a) => {
      gameplay.registerAsteroid(a.id, a.gameplayType);
    });
  }, [asteroidsData, gameplay]);

  // ---- Sync InstancedMesh refs into the shared gameplay ref ----
  useEffect(() => {
    const meshes = Array.from(instancedMeshRefs.current.values());
    gameplay.asteroidMeshesRef.current = meshes;
    return () => {
      gameplay.asteroidMeshesRef.current = [];
    };
  }, [asteroidsData, gameplay]);

  // ---- Initial matrix setup ----
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
      // Recompute so the raycaster broad-phase test sees the real positions
      instancedMesh.computeBoundingSphere();
    });
  }, [asteroidsData, allAsteroidNames]);

  // Counter for periodic bounding-sphere refresh (every ~60 frames)
  const frameCountRef = useRef(0);

  // ---- Per‑frame: rotate, move, and hide destroyed asteroids ----
  useFrame((state, delta) => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();

    asteroidsData.forEach((asteroidData) => {
      const alive = gameplay.isAsteroidAlive(asteroidData.id);
      const asteroidName = allAsteroidNames[asteroidData.asteroidTypeIndex];

      // Even if dead we still need to set the matrix (to 0‑scale)
      if (alive) {
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

        // Shield-asteroid collision (convex hull)
        const hullData = convexHullsByAsteroidName.get(asteroidName);
        if (hullData) {
          const shipPos = gameplay.shipPositionRef.current;
          const maxDist =
            hullData.boundingRadius * asteroidData.scale + SHIELD_RADIUS;
          const dx = Math.abs(asteroidData.position.x - shipPos.x);
          const dy = Math.abs(asteroidData.position.y - shipPos.y);
          const dz = Math.abs(asteroidData.position.z - shipPos.z);
          if (dx <= maxDist && dy <= maxDist && dz <= maxDist) {
            scaleVecRef.current.setScalar(asteroidData.scale);
            asteroidMatrixRef.current.compose(
              asteroidData.position,
              quaternion.setFromEuler(asteroidData.rotation),
              scaleVecRef.current
            );
            asteroidMatrixInvRef.current.copy(asteroidMatrixRef.current).invert();
            shipPosLocalRef.current
              .copy(shipPos)
              .applyMatrix4(asteroidMatrixInvRef.current);
            const distToHull = distanceFromPointToConvexHull(
              shipPosLocalRef.current,
              hullData,
              closestPointLocalRef.current
            );
            if (distToHull < SHIELD_RADIUS) {
              closestPointWorldRef.current
                .copy(closestPointLocalRef.current)
                .applyMatrix4(asteroidMatrixRef.current);
              impactDirRef.current
                .subVectors(closestPointWorldRef.current, shipPos)
                .normalize();
              const uv = directionToSphereUV(impactDirRef.current);
              const dir = impactDirRef.current;
              gameplay.onShieldCollisionRef.current?.({
                uv,
                direction: [dir.x, dir.y, dir.z],
                asteroidId: asteroidData.id,
              });
            }
          }
        }
      }

      const instancedMesh = instancedMeshRefs.current.get(asteroidName);

      if (instancedMesh) {
        if (alive) {
          quaternion.setFromEuler(asteroidData.rotation);
          matrix.compose(
            asteroidData.position,
            quaternion,
            new THREE.Vector3(asteroidData.scale, asteroidData.scale, asteroidData.scale)
          );
        } else {
          // Destroyed → collapse to zero scale
          matrix.makeScale(0, 0, 0);
        }
        instancedMesh.setMatrixAt(asteroidData.instanceIndex, matrix);
        instancedMesh.instanceMatrix.needsUpdate = true;
      }
    });

    // Periodically recompute bounding spheres so the raycaster broad-phase
    // test stays valid as asteroids drift.
    frameCountRef.current++;
    if (frameCountRef.current % 60 === 0) {
      instancedMeshRefs.current.forEach((mesh) => {
        mesh.computeBoundingSphere();
      });
    }
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
                // Tag so the Spaceship raycaster can recognise asteroid hits
                ref.userData = { isAsteroid: true, asteroidName };
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
