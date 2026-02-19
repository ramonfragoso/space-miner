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
  }, { collapsed: true });

  const wingsLightsControls = useControls("Wings Lights", {
    color: { value: "#ffffff", label: "Base Color" },
    emissiveColor: { value: "#ff2200", label: "Emissive Color" },
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Emissive Intensity" },
  }, { collapsed: true });

  const turbineLightsControls = useControls("Turbine Lights", {
    color: { value: "#ffffff", label: "Base Color" },
    emissiveColor: { value: "#00aaff", label: "Emissive Color" },
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Emissive Intensity" },
  }, { collapsed: true });

  const sideLightsControls = useControls("Side Lights", {
    color: { value: "#ffffff", label: "Base Color" },
    emissiveColor: { value: "#ffaa00", label: "Emissive Color" },
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1, label: "Emissive Intensity" },
  }, { collapsed: true });

  const shipOtherMaterialsControls = useControls("Ship Other Materials", {
    color: { value: "#6f6f6f", label: "Color" },
    emissive: { value: "#000000", label: "Emissive" },
    emissiveIntensity: { value: 0.0, min: 0, max: 50, step: 0.01, label: "Emissive Intensity" },
    roughness: { value: 0.5, min: 0, max: 1, step: 0.01, label: "Roughness" },
    metalness: { value: 0.5, min: 0, max: 1, step: 0.01, label: "Metalness" },
    opacity: { value: 1, min: 0, max: 1, step: 0.01, label: "Opacity" },
    transparent: { value: false, label: "Transparent" },
    envMapIntensity: { value: 1, min: 0, max: 3, step: 0.01, label: "Env Map Intensity" },
    normalScale: { value: 5, min: 0, max: 10, step: 0.01, label: "Normal Scale" },
    wireframe: { value: false, label: "Wireframe" },
    flatShading: { value: false, label: "Flat Shading" },
  }, { collapsed: true });

  const laserControls = useControls("Laser", {
    maxDistance: { value: 100, min: 10, max: 500, step: 5, label: "Max Distance" },
    projectileSpeed: { value: 10, min: 10, max: 200, step: 5, label: "Projectile Speed" },
    minProjectileSpeed: { value: 30, min: 5, max: 200, step: 5, label: "Min Projectile Speed" },
  }, { collapsed: true });

  const environmentControls = useControls("Environment", {
    backgroundIntensity: { value: 5, min: 0, max: 5, step: 0.1, label: "Background Intensity" },
    environmentIntensity: { value: 5, min: 0, max: 5, step: 0.1, label: "Environment Intensity" },
    background: { value: true, label: "Show Background" },
  }, { collapsed: true });

  const postProcessingControls = useControls("Post Processing", {
    strength: { value: 0.1, min: 0, max: 10, step: 0.01, label: "Strength" },
    radius: { value: 0.1, min: 0, max: 10, step: 0.01, label: "Radius" },
    threshold: { value: 0.01, min: 0, max: 10, step: 0.01, label: "Threshold" },
  }, { collapsed: true });

  const gemPlanetControls = useControls("Planet: Gem", {
    color: { value: "#ff1d00", label: "Color" },
    emissive: { value: "#7c0000", label: "Emissive" },
    emissiveIntensity: { value: 17.5, min: 0, max: 50, step: 0.5, label: "Emissive Intensity" },
  }, { collapsed: true });

  const tealPlanetControls = useControls("Planet: Teal", {
    color: { value: "#ce0000", label: "Color" },
    emissive: { value: "#399d84", label: "Emissive" },
    emissiveIntensity: { value: 11.5, min: 0, max: 50, step: 0.5, label: "Emissive Intensity" },
  }, { collapsed: true });

  const purplePlanetControls = useControls("Planet: Purple", {
    color: { value: "#cc88ff", label: "Color" },
    emissive: { value: "#4a00c1", label: "Emissive" },
    emissiveIntensity: { value: 9.0, min: 0, max: 50, step: 0.5, label: "Emissive Intensity" },
  }, { collapsed: true });

  const yellowPlanetControls = useControls("Planet: Yellow", {
    color: { value: "#ffff06", label: "Color" },
    emissive: { value: "#5c5c00", label: "Emissive" },
    emissiveIntensity: { value: 19.0, min: 0, max: 50, step: 0.5, label: "Emissive Intensity" },
  }, { collapsed: true });

  const lavaPlanetControls = useControls("Planet: Lava", {
    color: { value: "#6c4019", label: "Color" },
    emissive: { value: "#ce4600", label: "Emissive" },
    emissiveIntensity: { value: 50.0, min: 0, max: 50, step: 0.5, label: "Emissive Intensity" },
  }, { collapsed: true });

  const shieldControls = useControls("Shield", {
    radius: { value: 0.5, min: 0, max: 1, step: 0.01, label: "Radius" },
    fade: { value: 1.0, min: 0, max: 1, step: 0.01, label: "Fade" },
    hueSeed: { value: 0.5, min: 0, max: 1, step: 0.01, label: "Hue Seed" },
    thickness: { value: 0.12, min: 0.01, max: 0.5, step: 0.01, label: "Thickness" },
    feather: { value: 0.02, min: 0, max: 0.1, step: 0.001, label: "Feather" },
    innerBright: { value: 2.2, min: 0, max: 5, step: 0.1, label: "Inner Brightness" },
    outerBright: { value: 1.8, min: 0, max: 5, step: 0.1, label: "Outer Brightness" },
    colorMultiplier: { value: 2.0, min: 0, max: 5, step: 0.1, label: "Color Multiplier" },
  }, { collapsed: false });

  return {
    lighting: lightingControls,
    model: modelControls,
    asteroids: asteroidControls,
    lightPanels: lightPanelsControls,
    wingsLights: wingsLightsControls,
    turbineLights: turbineLightsControls,
    sideLights: sideLightsControls,
    shipOtherMaterials: shipOtherMaterialsControls,
    environment: environmentControls,
    laser: laserControls,
    postProcessing: postProcessingControls,
    gemPlanet: gemPlanetControls,
    tealPlanet: tealPlanetControls,
    purplePlanet: purplePlanetControls,
    yellowPlanet: yellowPlanetControls,
    lavaPlanet: lavaPlanetControls,
    shield: shieldControls,
  };
};
