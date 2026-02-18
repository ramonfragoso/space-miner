import { ConvexHull } from "three/addons/math/ConvexHull.js";
import type { BufferGeometry } from "three";
import { Box3, Sphere, Triangle, Vector3 } from "three";

const _triangle = new Triangle();
const _closestPoint = new Vector3();
const _box = new Box3();
const _sphere = new Sphere();

export interface AsteroidConvexHull {
  hull: ConvexHull;
  /** Bounding sphere radius in model space (for broad-phase culling) */
  boundingRadius: number;
}

/**
 * Build a convex hull from geometry vertices (model space).
 */
export function buildConvexHullFromGeometry(
  geometry: BufferGeometry
): AsteroidConvexHull | null {
  const pos = geometry.attributes.position;
  if (!pos || pos.count < 4) return null;

  const points: Vector3[] = [];
  for (let i = 0; i < pos.count; i++) {
    points.push(new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
  }

  const hull = new ConvexHull().setFromPoints(points);
  if (hull.faces.length === 0) return null;

  geometry.computeBoundingSphere();
  const bs = geometry.boundingSphere;
  const boundingRadius = bs
    ? bs.radius
    : _box.setFromPoints(points).getBoundingSphere(_sphere).radius;

  return { hull, boundingRadius };
}

/**
 * Distance from point to convex hull surface.
 * Returns 0 if point is inside the hull.
 * Optionally writes the closest point on the hull to `closestPointOut`.
 */
export function distanceFromPointToConvexHull(
  point: Vector3,
  hullData: AsteroidConvexHull,
  closestPointOut?: Vector3
): number {
  const hull = hullData.hull;
  if (hull.containsPoint(point)) {
    if (closestPointOut) closestPointOut.copy(point);
    return 0;
  }

  let minDistSq = Infinity;
  const faces = hull.faces;

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    const edge = face.edge;
    const a = edge.tail()?.point;
    const b = edge.head().point;
    const c = edge.next.head().point;
    if (!a) continue;

    _triangle.set(a, b, c);
    _triangle.closestPointToPoint(point, _closestPoint);
    const distSq = point.distanceToSquared(_closestPoint);
    if (distSq < minDistSq) {
      minDistSq = distSq;
      if (closestPointOut) closestPointOut.copy(_closestPoint);
    }
  }

  return Math.sqrt(minDistSq);
}

/**
 * Convert a unit direction (outward normal on sphere) to UV coords
 * matching Three.js SphereGeometry convention.
 * U: longitude [0,1], V: latitude [0,1] (0=bottom, 1=top)
 */
export function directionToSphereUV(direction: Vector3): [number, number] {
  const { x, y, z } = direction;
  const theta = Math.acos(Math.max(-1, Math.min(1, y)));
  const phi = Math.atan2(z, -x);
  const u = ((phi / (2 * Math.PI)) + 1) % 1;
  const v = 1 - theta / Math.PI;
  return [u, v];
}
