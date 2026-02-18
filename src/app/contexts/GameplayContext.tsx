"use client";
import React, {
  createContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";
import { Vector3, type InstancedMesh } from "three";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AsteroidSizeType = "small" | "medium" | "large";

export interface AsteroidState {
  id: string;
  type: AsteroidSizeType;
  hp: number;
  maxHp: number;
  reward: number;
  alive: boolean;
}

export interface UpgradeState {
  damage: 1 | 2 | 3;
  speed: 1 | 2 | 3;
  shield: 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const ASTEROID_CONFIG: Record<
  AsteroidSizeType,
  { hp: number; reward: number }
> = {
  small: { hp: 1, reward: 50 },
  medium: { hp: 8, reward: 500 },
  large: { hp: 12, reward: 1200 },
};

export const UPGRADE_COSTS: Record<keyof UpgradeState, Record<2 | 3, number>> =
  {
    damage: { 2: 3000, 3: 8000 },
    speed: { 2: 2500, 3: 6000 },
    shield: { 2: 3500, 3: 7000 },
  };

export const ESCAPE_MODULE_COST = 15_000;

// ---------------------------------------------------------------------------
// Context value interface
// ---------------------------------------------------------------------------
export interface GameplayContextValue {
  /* ---- reactive state (triggers re‑renders) ---- */
  coins: number;
  upgrades: UpgradeState;
  hasEscapeModule: boolean;
  destroyedCount: number;

  /* ---- asteroid management ---- */
  registerAsteroid: (id: string, type: AsteroidSizeType) => void;
  /** Returns `true` when the asteroid is destroyed by this hit. */
  damageAsteroid: (id: string, damage: number) => boolean;
  isAsteroidAlive: (id: string) => boolean;
  getAsteroid: (id: string) => AsteroidState | undefined;

  /* ---- upgrades ---- */
  purchaseUpgrade: (type: keyof UpgradeState) => boolean;
  purchaseEscapeModule: () => boolean;
  canPurchaseUpgrade: (
    type: keyof UpgradeState
  ) => { canBuy: boolean; cost: number };
  canPurchaseEscapeModule: () => boolean;

  /* ---- multipliers (read from refs – safe in useFrame) ---- */
  getDamageMultiplier: () => number;
  getSpeedMultiplier: () => number;
  getShieldMultiplier: () => number;

  /* ---- shared mesh refs (for direct raycasting) ---- */
  asteroidMeshesRef: MutableRefObject<InstancedMesh[]>;
  shipPositionRef: MutableRefObject<Vector3>;

  /* ---- shield collision callback (called from Asteroids useFrame) ---- */
  onShieldCollisionRef: MutableRefObject<
    ((data: {
      uv: [number, number];
      direction: [number, number, number];
      asteroidId: string;
    }) => void) | null
  >;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export const GameplayContext = createContext<GameplayContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function GameplayProvider({ children }: { children: ReactNode }) {
  // ----- refs are the *source of truth* (fast reads in the game loop) -----
  const coinsRef = useRef(0);
  const upgradesRef = useRef<UpgradeState>({
    damage: 1,
    speed: 1,
    shield: 1,
  });
  const hasEscapeModuleRef = useRef(false);
  const asteroidRegistryRef = useRef<Map<string, AsteroidState>>(new Map());

  // Shared ref: Asteroids component pushes its InstancedMesh refs here
  // so the Spaceship can raycast against them directly.
  const asteroidMeshesRef = useRef<InstancedMesh[]>([]);

  // Shared ref: Spaceship writes its position here each frame for shield-asteroid collision.
  const shipPositionRef = useRef<Vector3>(new Vector3());

  // Callback ref: Shield (or other) registers to receive collision events with UV.
  const onShieldCollisionRef = useRef<
    ((data: {
      uv: [number, number];
      direction: [number, number, number];
      asteroidId: string;
    }) => void) | null
  >(null);

  // ----- state mirrors for React re‑renders (HUD / UI) -----
  const [coins, setCoins] = useState(0);
  const [upgrades, setUpgrades] = useState<UpgradeState>({
    damage: 1,
    speed: 1,
    shield: 1,
  });
  const [hasEscapeModule, setHasEscapeModule] = useState(false);
  const [destroyedCount, setDestroyedCount] = useState(0);

  // Helper – flush ref → state
  const syncCoins = useCallback(() => setCoins(coinsRef.current), []);

  // -----------------------------------------------------------------------
  // Asteroid helpers
  // -----------------------------------------------------------------------
  const registerAsteroid = useCallback(
    (id: string, type: AsteroidSizeType) => {
      if (asteroidRegistryRef.current.has(id)) return;
      const cfg = ASTEROID_CONFIG[type];
      asteroidRegistryRef.current.set(id, {
        id,
        type,
        hp: cfg.hp,
        maxHp: cfg.hp,
        reward: cfg.reward,
        alive: true,
      });
    },
    []
  );

  const damageAsteroid = useCallback(
    (id: string, damage: number): boolean => {
      const asteroid = asteroidRegistryRef.current.get(id);
      if (!asteroid || !asteroid.alive) return false;

      asteroid.hp -= damage;
      if (asteroid.hp <= 0) {
        asteroid.hp = 0;
        asteroid.alive = false;
        coinsRef.current += asteroid.reward;
        syncCoins();
        setDestroyedCount((prev) => prev + 1);
        return true; // destroyed
      }
      return false; // still alive
    },
    [syncCoins]
  );

  const isAsteroidAlive = useCallback((id: string): boolean => {
    return asteroidRegistryRef.current.get(id)?.alive ?? false;
  }, []);

  const getAsteroid = useCallback(
    (id: string): AsteroidState | undefined =>
      asteroidRegistryRef.current.get(id),
    []
  );

  // -----------------------------------------------------------------------
  // Multipliers (safe to call inside useFrame – read from refs)
  // -----------------------------------------------------------------------
  const getDamageMultiplier = useCallback(
    (): number => upgradesRef.current.damage,
    []
  );

  const getSpeedMultiplier = useCallback((): number => {
    const lvl = upgradesRef.current.speed;
    return lvl === 1 ? 1 : lvl === 2 ? 1.5 : 2;
  }, []);

  const getShieldMultiplier = useCallback(
    (): number => upgradesRef.current.shield,
    []
  );

  // -----------------------------------------------------------------------
  // Purchase helpers
  // -----------------------------------------------------------------------
  const canPurchaseUpgrade = useCallback(
    (type: keyof UpgradeState): { canBuy: boolean; cost: number } => {
      const currentLevel = upgradesRef.current[type];
      if (currentLevel >= 3) return { canBuy: false, cost: 0 };
      const nextLevel = (currentLevel + 1) as 2 | 3;
      const cost = UPGRADE_COSTS[type][nextLevel];
      return { canBuy: coinsRef.current >= cost, cost };
    },
    []
  );

  const purchaseUpgrade = useCallback(
    (type: keyof UpgradeState): boolean => {
      const currentLevel = upgradesRef.current[type];
      if (currentLevel >= 3) return false;
      const nextLevel = (currentLevel + 1) as 2 | 3;
      const cost = UPGRADE_COSTS[type][nextLevel];
      if (coinsRef.current < cost) return false;

      coinsRef.current -= cost;
      upgradesRef.current = { ...upgradesRef.current, [type]: nextLevel };

      setCoins(coinsRef.current);
      setUpgrades({ ...upgradesRef.current });
      return true;
    },
    []
  );

  const canPurchaseEscapeModule = useCallback((): boolean => {
    if (hasEscapeModuleRef.current) return false;
    const u = upgradesRef.current;
    return (
      u.damage === 3 &&
      u.speed === 3 &&
      u.shield === 3 &&
      coinsRef.current >= ESCAPE_MODULE_COST
    );
  }, []);

  const purchaseEscapeModule = useCallback((): boolean => {
    if (!canPurchaseEscapeModule()) return false;
    coinsRef.current -= ESCAPE_MODULE_COST;
    hasEscapeModuleRef.current = true;
    setCoins(coinsRef.current);
    setHasEscapeModule(true);
    return true;
  }, [canPurchaseEscapeModule]);

  // -----------------------------------------------------------------------
  // Context value
  // -----------------------------------------------------------------------
  const value: GameplayContextValue = {
    coins,
    upgrades,
    hasEscapeModule,
    destroyedCount,

    registerAsteroid,
    damageAsteroid,
    isAsteroidAlive,
    getAsteroid,

    purchaseUpgrade,
    purchaseEscapeModule,
    canPurchaseUpgrade,
    canPurchaseEscapeModule,

    getDamageMultiplier,
    getSpeedMultiplier,
    getShieldMultiplier,

    asteroidMeshesRef,
    shipPositionRef,
    onShieldCollisionRef,
  };

  return (
    <GameplayContext.Provider value={value}>
      {children}
    </GameplayContext.Provider>
  );
}
