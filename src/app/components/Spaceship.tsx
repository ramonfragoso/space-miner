"use client";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, ThreeElements } from "@react-three/fiber";
import { Matrix4, Vector3, Group, Mesh, Quaternion } from "three";
import { updateShipAxis } from "./controls";

const shipPosition = new Vector3(0, 3, 7)

const x = new Vector3(1, 0, 0)
const y = new Vector3(0, 1, 0)
const z = new Vector3(0, 0, 1)

const delayedRotMatrix = new Matrix4()
const delayedQuaternion = new Quaternion()

type SpaceshipProps = ThreeElements["group"]

export function Spaceship(props: SpaceshipProps) {
  const { nodes } = useGLTF('/spaceship.glb');
  const groupRef = useRef<Group>(null);

  useFrame(({ camera }, delta) => {
    updateShipAxis(x, y, z, shipPosition, camera, delta)
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
  });

  const cubeNode = nodes?.Cube as Mesh | undefined;
  if (!cubeNode?.geometry || !cubeNode?.material) return null;

  return (
    <group
      ref={groupRef}
    >
      <group {...props} dispose={null} scale={0.01} rotation-y={Math.PI / 2}>
        <mesh geometry={cubeNode.geometry} material={cubeNode.material} />
      </group>
    </group>
  );
}

useGLTF.preload("/spaceship.glb");
