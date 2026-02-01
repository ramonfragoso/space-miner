"use client";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SpaceshipProps = any

export function Spaceship(props: SpaceshipProps) {
  const { nodes } = useGLTF('/spaceship.glb');
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
  });

  return (
    <group 
      ref={groupRef}
    >
      <group {...props} dispose={null} rotation-y={Math.PI}>
        <mesh geometry={nodes?.Cube?.geometry} material={nodes?.Cube?.material}/>
      </group>
    </group>
  );
}

useGLTF.preload("/cozy_room.glb");
