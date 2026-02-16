import * as React from 'react'
import {
  Vector3, Spherical, Color, AdditiveBlending,
  InstancedBufferGeometry, InstancedBufferAttribute,
  PlaneGeometry, Mesh
} from 'three'
import { PointsNodeMaterial } from 'three/webgpu'
import {
  attribute, float, vec2,
  sin, exp, distance,
  time, positionView, positionGeometry
} from 'three/tsl'

export type StarsProps = {
  radius?: number
  depth?: number
  count?: number
  factor?: number
  saturation?: number
  fade?: boolean
  speed?: number
}

const genStar = (r: number) => {
  return new Vector3().setFromSpherical(new Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI))
}

/**
 * Stars component using TSL (Three.js Shading Language) for WebGPU/WebGL compatibility.
 *
 * Renders stars as instanced billboard quads via PointsNodeMaterial instead of
 * GL_POINTS with a custom GLSL ShaderMaterial. This approach works with both
 * the WebGPU renderer and the WebGL fallback.
 *
 * The original GLSL shader used `vec4(position, 0.5)` (w=0.5) which halves the
 * camera translation effect, creating a subtle parallax for the starfield.
 * The TSL version uses standard w=1.0 positioning. For stars at radius 100+,
 * the visual difference is minimal.
 */
export const Stars = React.forwardRef<Mesh, StarsProps>(
  ({ radius = 100, depth = 50, count = 5000, saturation = 0, factor = 4, fade = false, speed = 1 }, ref) => {

    const [geometry, material] = React.useMemo(() => {
      // --- Generate per-star data (same logic as original) ---
      const positions: number[] = []
      const colors: number[] = []
      const sizes = Array.from({ length: count }, () => (0.5 + 0.5 * Math.random()) * factor)
      const color = new Color()
      let maxR = 0
      for (let i = 0; i < count; i++) {
        const r = radius + Math.random() * depth
        if (r > maxR) maxR = r
        positions.push(...genStar(r).toArray())
        color.setHSL(i / count, saturation, 0.9)
        colors.push(color.r, color.g, color.b)
      }
      const positionsArray = new Float32Array(positions)
      const colorsArray = new Float32Array(colors)
      const sizesArray = new Float32Array(sizes)

      // --- Build an InstancedBufferGeometry: one quad per star ---
      const baseQuad = new PlaneGeometry(1, 1)
      const geo = new InstancedBufferGeometry()
      geo.index = baseQuad.index
      geo.attributes.position = baseQuad.attributes.position
      geo.attributes.uv = baseQuad.attributes.uv
      geo.instanceCount = count

      // Per-instance (per-star) attributes
      geo.setAttribute('starPosition', new InstancedBufferAttribute(positionsArray, 3))
      geo.setAttribute('starColor', new InstancedBufferAttribute(colorsArray, 3))
      geo.setAttribute('starSize', new InstancedBufferAttribute(sizesArray, 1))

      // --- Create the TSL material ---
      const mat = new PointsNodeMaterial()

      // TSL nodes that read instanced attributes by name
      const starPosNode = attribute('starPosition', 'vec3')
      const starColorNode = attribute('starColor', 'vec3')
      const starSizeNode = attribute('starSize', 'float')

      // Billboard center = star world position (transformed by modelViewMatrix internally)
      mat.positionNode = starPosNode

      // --- Point size (TSL equivalent of the original GLSL) ---
      // Original GLSL: gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0))
      //
      // With sizeAttenuation = false, PointsNodeMaterial's sizeNode value ≈ pixel diameter.
      // We replicate the distance-based attenuation and time-pulsation manually.
      const pulsation = float(3.0).add(sin(time.mul(float(speed)).add(100.0)))
      mat.sizeNode = starSizeNode
        .mul(float(30.0).div(positionView.z.negate()))
        .mul(pulsation)
      mat.sizeAttenuation = false

      // --- Color: per-star vertex color ---
      mat.colorNode = starColorNode

      // --- Opacity: smooth circular fade from center to edges ---
      // Original GLSL:
      //   float d = distance(gl_PointCoord, vec2(0.5, 0.5));
      //   opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
      //
      // positionGeometry.xy maps to [-0.5, 0.5] for the billboard quad;
      // adding 0.5 gives [0, 1] — the same as gl_PointCoord.
      if (fade) {
        const spriteUV = positionGeometry.xy.add(0.5)
        const d = distance(spriteUV, vec2(0.5, 0.5))
        mat.opacityNode = float(1.0).div(
          float(1.0).add(exp(float(16.0).mul(d.sub(0.25))))
        )
      }

      // --- Appearance ---
      mat.transparent = true
      mat.depthWrite = false
      mat.blending = AdditiveBlending

      return [geo, mat] as const
    }, [count, depth, factor, radius, saturation, fade, speed])

    // No useFrame needed — the built-in TSL `time` node auto-updates each frame.

    return (
      <mesh
        ref={ref as React.RefObject<Mesh>}
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
    )
  }
)

Stars.displayName = 'Stars'
