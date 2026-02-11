import { useControls } from "leva";

export const useDebugUI = () => {
  const lightingControls = useControls("Lighting", {
    ambientIntensity: { value: 7, min: 0, max: 20, step: 0.1 },
    directionalIntensity: { value: 0.8, min: 0, max: 10, step: 0.1 },
    directionalPosition: { value: [0, 10, 8], step: 0.5 },
    directionalColor: "#ffffff",
    pointIntensity: { value: 8, min: 0, max: 20, step: 0.1 },
    pointPosition: { value: [-3.38, 3.25, 0.69], step: 0.01 },
    pointColor: "#ef0707",
    showHelpers: true,
  }, { collapsed: true });

  const modelControls = useControls("Model", {
    position: { value: [0, 0, 0], step: 0.1 },
    scale: { value: [1, 1, 1], min: 0.1, max: 3, step: 0.1 },
    rotation: { value: [0, 0, 0], step: 0.1 },
    autoRotate: false,
    rotationSpeed: { value: 0.005, min: 0, max: 0.02, step: 0.001 },
  }, { collapsed: true });

  const asteroidControls = useControls("Asteroids", {
    spinVelocityMultiplier: { value: 10, min: 0, max: 30, step: 0.1 },
    moveVelocityMultiplier: { value: 10, min: 0, max: 30, step: 0.1 },
    bigCount: { value: 120, min: 0, max: 5000, step: 1 },
    mediumCount: { value: 2000, min: 0, max: 5000, step: 1 },
    smallCount: { value: 3000, min: 0, max: 10000, step: 1 },
  }, { collapsed: true });

  const lightPanelsControls = useControls("Light Panels", {
    color: { value: "#ffffff", label: "Base Color" },
    emissiveColor: { value: "#00ffaa", label: "Emissive Color" },
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Emissive Intensity" },
  }, { collapsed: false });

  const wingsLightsControls = useControls("Wings Lights", {
    color: { value: "#ffffff", label: "Base Color" },
    emissiveColor: { value: "#ff2200", label: "Emissive Color" },
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Emissive Intensity" },
  }, { collapsed: false });

  const turbineLightsControls = useControls("Turbine Lights", {
    color: { value: "#ffffff", label: "Base Color" },
    emissiveColor: { value: "#00aaff", label: "Emissive Color" },
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Emissive Intensity" },
  }, { collapsed: false });

  const sideLightsControls = useControls("Side Lights", {
    color: { value: "#ffffff", label: "Base Color" },
    emissiveColor: { value: "#ffaa00", label: "Emissive Color" },
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Emissive Intensity" },
  }, { collapsed: false });

  const laserControls = useControls("Laser", {
    maxDistance: { value: 100, min: 10, max: 500, step: 5, label: "Max Distance" },
    projectileSpeed: { value: 10, min: 10, max: 200, step: 5, label: "Projectile Speed" },
    minProjectileSpeed: { value: 30, min: 5, max: 200, step: 5, label: "Min Projectile Speed" },
  }, { collapsed: false });

  return {
    lighting: lightingControls,
    model: modelControls,
    asteroids: asteroidControls,
    lightPanels: lightPanelsControls,
    wingsLights: wingsLightsControls,
    turbineLights: turbineLightsControls,
    sideLights: sideLightsControls,
    laser: laserControls,
  };
};
