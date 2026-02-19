"use client";

import { useRef } from "react";
import {
  Matrix4,
  Quaternion,
  Vector3,
  Raycaster,
  type InstancedMesh,
  type MutableRefObject,
} from "three";
import type { Projectile } from "./useShooting";
import { PROJECTILE_LENGTH_CONST } from "./useShooting";
import type { GameplayContextValue } from "../contexts/GameplayContext";

export function useProjectileCollision(
  projectilesRef: MutableRefObject<Projectile[]>,
  coreInstanceRef: MutableRefObject<InstancedMesh | null>,
  glowInstanceRef: MutableRefObject<InstancedMesh | null>,
  gameplay: GameplayContextValue,
) {
  const raycasterRef = useRef(new Raycaster());

  function updateCollisions(delta: number, maxDistance: number) {
    const raycaster = raycasterRef.current;
    const tmpMatrix = new Matrix4();
    const tmpQuat = new Quaternion();
    const upVec = new Vector3(0, 1, 0);
    const asteroidMeshes = gameplay.asteroidMeshesRef.current;

    projectilesRef.current.forEach((proj: Projectile, i: number) => {
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

      const pos = proj.origin
        .clone()
        .add(proj.direction.clone().multiplyScalar(proj.traveled));

      raycaster.set(pos, proj.direction);
      raycaster.far = proj.speed * delta + PROJECTILE_LENGTH_CONST;

      const intersects = raycaster.intersectObjects(asteroidMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0];

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

    if (coreInstanceRef.current)
      coreInstanceRef.current.instanceMatrix.needsUpdate = true;
    if (glowInstanceRef.current)
      glowInstanceRef.current.instanceMatrix.needsUpdate = true;
  }

  return { updateCollisions };
}
