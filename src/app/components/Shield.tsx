"use client";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mesh, Vector3 } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import { acos, dot, mx_hsvtorgb, positionLocal, smoothstep, uniform, vec3 } from "three/tsl";
import { extend, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useDebounce } from "../hooks/useDebounce";
import { useDebugUI } from "../hooks/useDebugUI";
import { useGameplay } from "../hooks/useGameplay";

extend(MeshBasicNodeMaterial)
interface Rings {
  id: number
  center: [x: number, y: number, z: number]
}

interface RingProps {
  centerDir: [number, number, number]
  onDone: () => void
  shieldControls: {
    radius: number
    fade: number
    hueSeed: number
    thickness: number
    feather: number
    innerBright: number
    outerBright: number
    colorMultiplier: number
  }
}

const _localPoint = new Vector3()

const Ring = ({ centerDir, onDone, shieldControls }: RingProps) => {
  const {
    radius: radiusMax,
    fade: fadeMax,
    hueSeed,
    thickness,
    feather,
    innerBright,
    outerBright,
    colorMultiplier,
  } = shieldControls

  const radius = useMemo(() => uniform(0.0), [])
  const fade = useMemo(() => uniform(0.0), [])

  const { colorNode, opacityNode } = useMemo(() => {
    // Use 3D angular distance instead of UV distance to avoid the UV seam.
    // positionLocal gives the interpolated vertex position on the sphere;
    // normalizing projects it onto the unit sphere.
    const fragDir = positionLocal.normalize()
    const center = vec3(centerDir[0], centerDir[1], centerDir[2])

    // Great-circle (angular) distance, normalized to [0, 1]
    // 0 = same point, 1 = diametrically opposite (π radians)
    const d = acos(dot(fragDir, center).clamp(-1, 1)).div(Math.PI)

    const halfT = thickness / 2.0

    const outer = smoothstep(
      radius.sub(halfT).sub(feather),
      radius.add(halfT).add(feather),
      d
    )

    const inner = smoothstep(
      radius.sub(halfT).add(feather),
      radius.add(halfT).sub(feather),
      d
    )

    const ringMask = outer.sub(inner)
    const hsv = vec3(hueSeed, 1.0, 1.0)
    const baseRGB = mx_hsvtorgb(hsv)
    const tBand = d.sub(radius.sub(halfT)).div(thickness).saturate()

    const brightness = tBand.mul(innerBright - outerBright).add(outerBright)

    const finalRGB = baseRGB.mul(brightness).mul(colorMultiplier)
    const alpha = ringMask.mul(fade.oneMinus())

    return { colorNode: finalRGB, opacityNode: alpha }
  }, [centerDir, radius, fade, thickness, feather, hueSeed, innerBright, outerBright, colorMultiplier])

  const tRef = useRef(0)
  const doneRef = useRef(false)

  useFrame((_, delta) => {
    tRef.current += delta / 1.5
    let t = tRef.current > 1 ? 1 : tRef.current
    t = 1 - Math.pow(1 - t, 1)

    radius.value = t * radiusMax
    fade.value = t * fadeMax

    if (t >= 1 && !doneRef.current){
      doneRef.current = true
      onDone()
    }

  })

  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[0.1, 20, 20]} />
      <meshBasicNodeMaterial colorNode={colorNode} opacityNode={opacityNode} transparent side={2}/>
    </mesh>
  )

}

const RING_DEBOUNCE_LIMIT = 3
const RING_DEBOUNCE_MS = [100, 100, 2000]

export const Shield = forwardRef<Mesh>(function Shield(_, ref) {
  const [rings, setRings] = useState<Rings[]>([])
  const idRef = useRef<number>(0)
  const { shield: shieldControls } = useDebugUI()
  const gameplay = useGameplay()
  const shieldMeshRef = useRef<Mesh | null>(null)
  const debouncedInvoke = useDebounce({
    limit: RING_DEBOUNCE_LIMIT,
    delayMs: RING_DEBOUNCE_MS,
  })

  const addRing = useCallback(
    (center: [number, number, number]) => {
      debouncedInvoke(() => {
        setRings((prev) => [...prev, { id: idRef.current++, center }])
      })
    },
    [debouncedInvoke]
  )

  useEffect(() => {
    gameplay.onShieldCollisionRef.current = (data) => {
      const mesh = shieldMeshRef.current
      if (!mesh || !data.intersectionPoint) {
        addRing(data.direction)
        return
      }
      _localPoint.set(
        data.intersectionPoint[0],
        data.intersectionPoint[1],
        data.intersectionPoint[2],
      )
      mesh.worldToLocal(_localPoint)
      _localPoint.normalize()
      addRing([_localPoint.x, _localPoint.y, _localPoint.z])
    }
    return () => {
      gameplay.onShieldCollisionRef.current = null
    }
  }, [gameplay, addRing])

  const handlePointerDown = useCallback((e: ThreeEvent<MouseEvent>) => {
    _localPoint.copy(e.point)
    e.object.worldToLocal(_localPoint)
    _localPoint.normalize()
    addRing([_localPoint.x, _localPoint.y, _localPoint.z])
  }, [addRing])

  return (
    <>
      <mesh
        onPointerDown={handlePointerDown}
        ref={(mesh) => {
          if (typeof ref === "function") {
            ref(mesh)
          } else if (ref) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(ref as any).current = mesh
          }
          shieldMeshRef.current = mesh
        }}
      >
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial transparent opacity={0.0} depthTest={false} depthWrite={false} />
      </mesh>
      {rings.map(ring => (<Ring centerDir={ring.center} key={ring.id} onDone={() => { }} shieldControls={shieldControls} />))}
    </>
  );
});
