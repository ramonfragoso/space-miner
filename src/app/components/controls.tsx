import { Vector3 } from "three";
import type { PerspectiveCamera, OrthographicCamera } from "three";

const controls: Record<string, boolean> = {};

function easeOutQuad(x: number) {
  return 1 - (1 - x) * (1 - x)
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    controls[e.key.toLowerCase()] = true;
  });

  window.addEventListener("keyup", (e) => {
    controls[e.key.toLowerCase()] = false;
  });
}

let jawVelocity = 0;
let pitchVelocity = 0;
let steeringVelocity = 0;
let shipSpeed = 0;
let reverseSpeed = 0;
let turbo = 0;

let controlsBlockedUntil = 0;

/** Reset all velocity/speed state. Call on game retry. */
export function resetControls(): void {
  jawVelocity = 0;
  pitchVelocity = 0;
  steeringVelocity = 0;
  shipSpeed = 0;
  reverseSpeed = 0;
  turbo = 0;
}

/** Block ship controls for the given duration (ms). Used e.g. after shield damage. */
export function blockControlsFor(ms: number): void {
  controlsBlockedUntil = Date.now() + ms;
}

/** True when space (thrust) or shift (turbo) is pressed. */
export function isThrustPressed(): boolean {
  return !!(controls[" "] || controls["shift"]);
}

/** Returns the ship's current effective speed (units/sec). */
export function getShipSpeed(): number {
  const turboSpeed = easeOutQuad(turbo) * 0.02;
  return (shipSpeed + turboSpeed * 5) * 60;
}

/** Normalized ship speed in [0, 1]. shipSpeed raw range is treated as 0–10. */
export function getNormalizedShipSpeed(): number {
  return Math.min(Math.max(shipSpeed * 10, 0), 1);
}

/** Normalized turbo in [0, 1]. turboSpeed raw range 0–0.02 maps to 0–1. */
export function getNormalizedTurboSpeed(): number {
  return easeOutQuad(turbo);
}

let lastShootTime = 0;
let shootTriggered = false;
const SHOOT_COOLDOWN = 70;

export function shoot(): boolean {
  if (!controls["p"]) {
    shootTriggered = false;
    return false;
  }
  if (shootTriggered) return false;
  const now = Date.now();
  if (now - lastShootTime < SHOOT_COOLDOWN) return false;
  lastShootTime = now;
  shootTriggered = true;
  return true;
}

export function updateShipAxis(
  x: Vector3,
  y: Vector3,
  z: Vector3,
  shipPosition: Vector3,
  camera: PerspectiveCamera | OrthographicCamera,
  delta: number
) {
  if (Date.now() < controlsBlockedUntil) return;

  const deltaTime = delta * 60;
  
  jawVelocity *= Math.pow(0.93, deltaTime);
  pitchVelocity *= Math.pow(0.93, deltaTime);
  steeringVelocity *= Math.pow(0.93, deltaTime);
 
  if(controls[' ']) {
    shipSpeed += 0.0005 * deltaTime
  } else {
    shipSpeed *= Math.pow(0.95, deltaTime)
  }
  shipSpeed = Math.max(shipSpeed, 0)

  if (controls["a"]) {
    jawVelocity = 0.015;
  }

  if (controls["d"]) {
    jawVelocity = -0.015;
  }

  if (controls["s"]) {
    pitchVelocity = 0.015;
  }

  if (controls["w"]) {
    pitchVelocity = -0.015;
  }

  if (controls["q"]) {
    steeringVelocity = 0.01;
  }

  if (controls["e"]) {
    steeringVelocity = -0.01;
  }

  if (controls["control"]) {
    reverseSpeed += 0.0005 * deltaTime;
  } else {
    reverseSpeed *= Math.pow(0.95, deltaTime);
  }
  reverseSpeed = Math.max(reverseSpeed, 0);

  x.applyAxisAngle(z, jawVelocity * deltaTime)
  y.applyAxisAngle(z, jawVelocity * deltaTime)

  y.applyAxisAngle(x, pitchVelocity * deltaTime)
  z.applyAxisAngle(x, pitchVelocity * deltaTime)

  x.applyAxisAngle(y, steeringVelocity * deltaTime)
  z.applyAxisAngle(y, steeringVelocity * deltaTime)

  x.normalize()
  y.normalize()
  z.normalize()

  if (controls.shift) {
    turbo += 0.02 * deltaTime
  } else {
    turbo *= Math.pow(0.95, deltaTime)
  }
  turbo = Math.min(Math.max(turbo, 0), 1)

  const turboSpeed = easeOutQuad(turbo) * 0.02

  if ("isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
    camera.fov = 45 + (turboSpeed + Math.min(shipSpeed/5, 0.02)) * 900
    camera.updateProjectionMatrix()
  }
  shipPosition.add(z.clone().multiplyScalar((-shipSpeed + reverseSpeed - (turboSpeed * 5)) * deltaTime))
}