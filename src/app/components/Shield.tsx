"use client";
import { forwardRef, useMemo } from "react";
import { Mesh } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { color } from "three/tsl";

export const Shield = forwardRef<Mesh>(function Shield(_, ref) {
  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial();
    mat.colorNode = color(0xfa8072); // salmon
    return mat;
  }, []);

  return (
    <mesh ref={ref} material={material}>
      <sphereGeometry args={[0.1, 20, 20]} />
    </mesh>
  );
});
