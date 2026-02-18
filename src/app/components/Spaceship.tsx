"use client";
import { useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, ThreeElements } from "@react-three/fiber";
import {
  Matrix4, Vector3, Group, Quaternion, Object3D, Mesh,
  MeshStandardMaterial, Raycaster, CylinderGeometry, InstancedMesh,
} from "three";
import { updateShipAxis, shoot, getShipSpeed } from "./controls";
import { useDebugUI } from "../hooks/useDebugUI";
import { useGameplay } from "../hooks/useGameplay";
import { Shield } from "./Shield";

const shipPosition = new Vector3(0, 3, 7)

const x = new Vector3(1, 0, 0)
const y = new Vector3(0, 1, 0)
const z = new Vector3(0, 0, 1)

const delayedRotMatrix = new Matrix4()
const delayedQuaternion = new Quaternion()

const MAX_PROJECTILES = 10;
const PROJECTILE_LENGTH = 0.5;

interface Projectile {
  active: boolean;
  origin: Vector3;
  direction: Vector3;
  traveled: number;
  speed: number;
}

type SpaceshipProps = ThreeElements["group"]

export function Spaceship(props: SpaceshipProps) {
  const { scene } = useGLTF('/spaceship.glb');
  const groupRef = useRef<Group>(null);
  const shieldRef = useRef<Mesh>(null);
  const { laser: laserControls, shipOtherMaterials: otherMaterialsControls } = useDebugUI();
  const gameplay = useGameplay();

  const raycasterRef = useRef(new Raycaster());
  const coreInstanceRef = useRef<InstancedMesh>(null);
  const glowInstanceRef = useRef<InstancedMesh>(null);
  const coreMaterialRef = useRef<MeshStandardMaterial>(null);
  const glowMaterialRef = useRef<MeshStandardMaterial>(null);
  const projectilesRef = useRef<Projectile[]>(
    Array.from({ length: MAX_PROJECTILES }, () => ({
      active: false,
      origin: new Vector3(),
      direction: new Vector3(),
      traveled: 0,
      speed: 0,
    }))
  );

  const coreGeometry = useMemo(() => new CylinderGeometry(0.02, 0.02, PROJECTILE_LENGTH, 8), []);
  const glowGeometry = useMemo(() => new CylinderGeometry(0.06, 0.06, PROJECTILE_LENGTH, 8), []);

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
        else if (stdMat?.isMeshStandardMaterial) {
          stdMat.emissive.set(otherMaterialsControls.emissiveColor);
          stdMat.emissiveIntensity = otherMaterialsControls.emissiveIntensity;
          stdMat.needsUpdate = true;
        }
      });
    });
  }, [scene, otherMaterialsControls]);

  useFrame(({ camera, clock }, delta) => {
    turbineNodes.forEach((turbine) => {
      turbine.rotation.z += delta * 5;
    });

    updateShipAxis(x, y, z, shipPosition, camera, delta)
    gameplay.shipPositionRef.current.copy(shipPosition)
    const rotMatrix = new Matrix4().makeBasis(x, y, z)

    const matrix = new Matrix4()
      .multiply(new Matrix4().makeTranslation(shipPosition.x, shipPosition.y, shipPosition.z))
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
      .multiply(new Matrix4().makeTranslation(shipPosition.x, shipPosition.y, shipPosition.z))
      .multiply(delayedRotMatrix)
      .multiply(new Matrix4().makeRotationX(-0.3))
      .multiply(new Matrix4().makeTranslation(0, 0.03, 0.3))

    camera.matrixAutoUpdate = false
    camera.matrix.copy(cameraMatrix)
    camera.matrixWorldNeedsUpdate = true

    const { maxDistance, projectileSpeed, minProjectileSpeed } = laserControls;

    if (shoot()) {
      const slot = projectilesRef.current.find((p) => !p.active);
      if (slot) {
        slot.active = true;
        slot.origin.copy(shipPosition);
        slot.direction.copy(z).negate().normalize();
        slot.traveled = 0;
        slot.speed = Math.max(getShipSpeed() + projectileSpeed, minProjectileSpeed);
      }
    }

    // Update projectile pool
    const tmpMatrix = new Matrix4();
    const tmpQuat = new Quaternion();
    const upVec = new Vector3(0, 1, 0);

    // Raycast directly against asteroid InstancedMeshes (shared via context)
    const asteroidMeshes = gameplay.asteroidMeshesRef.current;

    projectilesRef.current.forEach((proj, i) => {
      if (!proj.active) {
        tmpMatrix.makeScale(0, 0, 0);
        coreInstanceRef.current?.setMatrixAt(i, tmpMatrix);
        glowInstanceRef.current?.setMatrixAt(i, tmpMatrix);
        return;
      }

      proj.traveled += proj.speed * delta;

      if (proj.traveled >= maxDistance) {
        proj.active = false;
        tmpMatrix.makeScale(0, 0, 0);
        coreInstanceRef.current?.setMatrixAt(i, tmpMatrix);
        glowInstanceRef.current?.setMatrixAt(i, tmpMatrix);
        return;
      }

      const pos = proj.origin.clone().add(
        proj.direction.clone().multiplyScalar(proj.traveled)
      );

      raycasterRef.current.set(pos, proj.direction);
      raycasterRef.current.far = proj.speed * delta + PROJECTILE_LENGTH;

      const intersects = raycasterRef.current.intersectObjects(
        asteroidMeshes,
        false
      );

      if (intersects.length > 0) {
        const hit = intersects[0];

        // --- Gameplay: damage asteroid on hit ---
        if (hit.object?.userData?.isAsteroid && hit.instanceId !== undefined) {
          const asteroidName: string = hit.object.userData.asteroidName;
          const asteroidId = `${asteroidName}_${hit.instanceId}`;
          const damage = gameplay.getDamageMultiplier();
          gameplay.damageAsteroid(asteroidId, damage);
        }

        proj.active = false;
        tmpMatrix.makeScale(0, 0, 0);
        coreInstanceRef.current?.setMatrixAt(i, tmpMatrix);
        glowInstanceRef.current?.setMatrixAt(i, tmpMatrix);
        return;
      }

      tmpQuat.setFromUnitVectors(upVec, proj.direction);
      tmpMatrix.compose(pos, tmpQuat, new Vector3(0.03, 1, 0.03));
      coreInstanceRef.current?.setMatrixAt(i, tmpMatrix);
      glowInstanceRef.current?.setMatrixAt(i, tmpMatrix);
    });

    if (coreInstanceRef.current) coreInstanceRef.current.instanceMatrix.needsUpdate = true;
    if (glowInstanceRef.current) glowInstanceRef.current.instanceMatrix.needsUpdate = true;

    const t = clock.elapsedTime;
    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = 100 + Math.sin(t * 10) * 5;
    }
    if (glowMaterialRef.current) {
      glowMaterialRef.current.emissiveIntensity = 50 + Math.sin(t * 10) * 3;
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
        ref={coreInstanceRef}
        args={[coreGeometry, undefined, MAX_PROJECTILES]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          ref={coreMaterialRef}
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={20}
          transparent
          opacity={0.85}
        />
      </instancedMesh>

      {/* Projectile glow halos (instanced) */}
      <instancedMesh
        ref={glowInstanceRef}
        args={[glowGeometry, undefined, MAX_PROJECTILES]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          ref={glowMaterialRef}
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
