"use client";

import { useRef, useMemo } from "react";
import {
  Vector3,
  CylinderGeometry,
  InstancedMesh,
  MeshStandardMaterial,
} from "three";
import { shoot, getShipSpeed } from "../components/controls";
import { useDebugUI } from "./useDebugUI";

const MAX_PROJECTILES = 10;
const PROJECTILE_LENGTH = 0.5;

export interface Projectile {
  active: boolean;
  origin: Vector3;
  direction: Vector3;
  traveled: number;
  speed: number;
}

export const PROJECTILE_LENGTH_CONST = PROJECTILE_LENGTH;
export const MAX_PROJECTILES_CONST = MAX_PROJECTILES;

export function useShooting() {
  const { laser: laserControls } = useDebugUI();
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

  const coreGeometry = useMemo(
    () => new CylinderGeometry(0.02, 0.02, PROJECTILE_LENGTH, 8),
    []
  );
  const glowGeometry = useMemo(
    () => new CylinderGeometry(0.06, 0.06, PROJECTILE_LENGTH, 8),
    []
  );

  function trySpawn(shipPosition: Vector3, forwardDirection: Vector3) {
    const { projectileSpeed, minProjectileSpeed } = laserControls;
    if (!shoot()) return;
    const slot = projectilesRef.current.find((p) => !p.active);
    if (slot) {
      slot.active = true;
      slot.origin.copy(shipPosition);
      slot.direction.copy(forwardDirection).negate().normalize();
      slot.traveled = 0;
      slot.speed = Math.max(
        getShipSpeed() + projectileSpeed,
        minProjectileSpeed
      );
    }
  }

  return {
    projectilesRef,
    trySpawn,
    coreInstanceRef,
    glowInstanceRef,
    coreMaterialRef,
    glowMaterialRef,
    coreGeometry,
    glowGeometry,
    maxDistance: laserControls.maxDistance,
  };
}
