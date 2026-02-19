"use client";
import { useRef, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, ThreeElements } from "@react-three/fiber";
import {
  Matrix4, Vector3, Group, Quaternion, Object3D, Mesh,
  MeshStandardMaterial,
} from "three";
import { updateShipAxis, blockControlsFor } from "./controls";
import { useDebugUI } from "../hooks/useDebugUI";
import { useGameplay } from "../hooks/useGameplay";
import { useShooting } from "../hooks/useShooting";
import { useProjectileCollision } from "../hooks/useProjectileCollision";
import { MAX_PROJECTILES_CONST } from "../hooks/useShooting";
import { Shield } from "./Shield";

const PUSH_DISTANCE = 10;
const PUSH_DURATION = 3;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const shipPosition = new Vector3(0, 3, 7)

const x = new Vector3(1, 0, 0)
const y = new Vector3(0, 1, 0)
const z = new Vector3(0, 0, 1)

const delayedRotMatrix = new Matrix4()
const delayedQuaternion = new Quaternion()

type SpaceshipProps = ThreeElements["group"]

const _zero = new Vector3(0, 0, 0);

export function Spaceship(props: SpaceshipProps) {
  const { scene } = useGLTF('/spaceship.glb');
  const groupRef = useRef<Group>(null);
  const shieldRef = useRef<Mesh>(null);
  const { shipOtherMaterials: otherMaterialsControls } = useDebugUI();
  const gameplay = useGameplay();

  const pushOffsetRef = useRef(new Vector3(0, 0, 0));
  const pushTargetRef = useRef(new Vector3(0, 0, 0));
  const pushProgressRef = useRef(1);
  const effectivePositionRef = useRef(new Vector3(0, 0, 0));

  const intersectionRef = useRef(new Vector3());
  const asteroidCenterRef = useRef(new Vector3());

  useEffect(() => {
    gameplay.onShieldDamageRef.current = (data) => {
      asteroidCenterRef.current.set(
        data.asteroidCenter[0],
        data.asteroidCenter[1],
        data.asteroidCenter[2]
      );
      intersectionRef.current.set(
        data.intersectionPoint[0],
        data.intersectionPoint[1],
        data.intersectionPoint[2]
      );
      const dir = intersectionRef.current
        .clone()
        .sub(asteroidCenterRef.current)
        .normalize();
      pushTargetRef.current.copy(dir).multiplyScalar(PUSH_DISTANCE);
      pushProgressRef.current = 0;
      blockControlsFor(500);
    };
    return () => {
      gameplay.onShieldDamageRef.current = null;
    };
  }, [gameplay]);

  const shooting = useShooting();
  const { updateCollisions } = useProjectileCollision(
    shooting.projectilesRef,
    shooting.coreInstanceRef,
    shooting.glowInstanceRef,
    gameplay
  );

  const turbineNodes = useMemo(() => {
    const turbines: Object3D[] = [];
    scene.traverse((child) => {
      if (child.name.toLowerCase().includes('turbine')) {
        turbines.push(child);
      }
    });
    return turbines;
  }, [scene]);



  useMemo(() => {
    scene.traverse((child) => {
      if (!child.isObject3D || !(child as Mesh).isMesh) return;
      const mesh = child as Mesh;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m) => {
        const stdMat = m as MeshStandardMaterial;
        if (stdMat?.isMeshStandardMaterial && stdMat.name === 'sidelights') {
          stdMat.emissive.set('#ff4400');
          stdMat.emissiveIntensity = 15;
          stdMat.needsUpdate = true;
        }
        else if (stdMat?.isMeshStandardMaterial && stdMat.name === 'winglights') {
          stdMat.emissive.set('#0044ff');
          stdMat.emissiveIntensity = 15;
          stdMat.needsUpdate = true;
        }
        else if (stdMat?.isMeshStandardMaterial && stdMat.name === 'turbinelights') {
          stdMat.emissive.set('#ff0044');
          stdMat.emissiveIntensity = 25;
          stdMat.needsUpdate = true;
        }
        else if (stdMat?.isMeshStandardMaterial && stdMat.name.includes('shipbaked')) {
          stdMat.color.set(otherMaterialsControls.color);
          stdMat.emissive.set(otherMaterialsControls.emissive);
          stdMat.emissiveIntensity = otherMaterialsControls.emissiveIntensity;
          stdMat.metalness = otherMaterialsControls.metalness;
          stdMat.opacity = otherMaterialsControls.opacity;
          stdMat.transparent = otherMaterialsControls.transparent;
          stdMat.envMapIntensity = otherMaterialsControls.envMapIntensity;
          const n = otherMaterialsControls.normalScale;
          stdMat.normalScale.set(n, n);
          stdMat.needsUpdate = true;
        }
      });
    });
  }, [scene, otherMaterialsControls]);

  useFrame(({ camera, clock }, delta) => {
    turbineNodes.forEach((turbine) => {
      turbine.rotation.z += delta * 5;
    });

    updateShipAxis(x, y, z, shipPosition, camera, delta);

    const pushOffset = pushOffsetRef.current;
    const pushTarget = pushTargetRef.current;
    let progress = pushProgressRef.current;
    if (progress < 1) {
      progress = Math.min(1, progress + delta / PUSH_DURATION);
      pushProgressRef.current = progress;
      const t = easeOutCubic(progress);
      pushOffset.lerpVectors(_zero, pushTarget, t);
      if (progress >= 1) {
        shipPosition.add(pushOffset);
        pushOffset.set(0, 0, 0);
      }
    }

    const effectivePosition = effectivePositionRef.current;
    effectivePosition.copy(shipPosition).add(pushOffset);
    gameplay.shipPositionRef.current.copy(effectivePosition);

    const rotMatrix = new Matrix4().makeBasis(x, y, z)

    const matrix = new Matrix4()
      .multiply(new Matrix4().makeTranslation(effectivePosition.x, effectivePosition.y, effectivePosition.z))
      .multiply(rotMatrix)

    if (groupRef.current) {
      groupRef.current.matrixAutoUpdate = false
      groupRef.current.matrix.copy(matrix)
      groupRef.current.matrixWorldNeedsUpdate = true
    }

    const quaternionA = new Quaternion().copy(delayedQuaternion)
    const quaternionB = new Quaternion()
    quaternionB.setFromRotationMatrix(rotMatrix)

    const interpolationFactor = 0.0175 * delta * 60
    const interpolatedQuaternion = new Quaternion().copy(quaternionA)
    interpolatedQuaternion.slerp(quaternionB, Math.min(interpolationFactor, 1))
    delayedQuaternion.copy(interpolatedQuaternion)
    delayedRotMatrix.identity()
    delayedRotMatrix.makeRotationFromQuaternion(delayedQuaternion)

    const cameraMatrix = new Matrix4()
      .multiply(new Matrix4().makeTranslation(effectivePosition.x, effectivePosition.y, effectivePosition.z))
      .multiply(delayedRotMatrix)
      .multiply(new Matrix4().makeRotationX(-0.3))
      .multiply(new Matrix4().makeTranslation(0, 0.03, 0.3))

    camera.matrixAutoUpdate = false
    camera.matrix.copy(cameraMatrix)
    camera.matrixWorldNeedsUpdate = true

    shooting.trySpawn(effectivePosition, z);
    updateCollisions(delta, shooting.maxDistance);

    const t = clock.elapsedTime;
    if (shooting.coreMaterialRef.current) {
      shooting.coreMaterialRef.current.emissiveIntensity = 100 + Math.sin(t * 10) * 5;
    }
    if (shooting.glowMaterialRef.current) {
      shooting.glowMaterialRef.current.emissiveIntensity = 50 + Math.sin(t * 10) * 3;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <group {...props} dispose={null} scale={0.03}>
          <primitive object={scene} />
        </group>
        <Shield ref={shieldRef} />
      </group>

      {/* Projectile cores (instanced) */}
      <instancedMesh
        ref={shooting.coreInstanceRef}
        args={[shooting.coreGeometry, undefined, MAX_PROJECTILES_CONST]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          ref={shooting.coreMaterialRef}
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={20}
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      {/* Projectile glow halos (instanced) */}
      <instancedMesh
        ref={shooting.glowInstanceRef}
        args={[shooting.glowGeometry, undefined, MAX_PROJECTILES_CONST]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          ref={shooting.glowMaterialRef}
          color="#ff4400"
          emissive="#ff2200"
          emissiveIntensity={10}
          transparent
          opacity={0.3}
        />
      </instancedMesh>
    </>
  );
}

useGLTF.preload("/spaceship.glb");
