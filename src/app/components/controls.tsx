import { Vector3, Camera } from "three";

const controls: Record<string, boolean> = {};

window.addEventListener("keydown", (e) => {
  controls[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
  controls[e.key.toLowerCase()] = false;
});

let jawVelocity = 0;
let pitchVelocity = 0;
const shipSpeed = 0.01;

export function updateShipAxis(
  x: Vector3,
  y: Vector3,
  z: Vector3,
  shipPosition: Vector3,
  camera: Camera
) {
  jawVelocity = 0;
  pitchVelocity = 0;

  if (controls["a"]) {
    jawVelocity = 0.025;
  }

  if (controls["d"]) {
    jawVelocity = -0.025;
  }

  if (controls["s"]) {
    pitchVelocity = 0.025;
  }

  if (controls["w"]) {
    pitchVelocity = -0.025;
  }

  x.applyAxisAngle(z, jawVelocity)
  y.applyAxisAngle(z, jawVelocity)

  y.applyAxisAngle(x, pitchVelocity)
  z.applyAxisAngle(x, pitchVelocity)

  x.normalize()
  y.normalize()
  z.normalize()

  shipPosition.add(z.clone().multiplyScalar(-shipSpeed))
}
