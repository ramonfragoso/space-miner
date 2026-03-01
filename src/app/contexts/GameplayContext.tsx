"use client";
import React, {
  createContext,
  useCallback,
  useEffect,
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

export type GamePhase =
  | "controls"   // Pre-game: showing controls + Next
  | "ready"      // Pre-game: showing Start
  | "playing"    // Active gameplay
  | "ended";     // Game over: score, retry

export interface AsteroidState {
  id: string;
  type: AsteroidSizeType;
  hp: number;
  maxHp: number;
  alive: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const ASTEROID_CONFIG: Record<AsteroidSizeType, { hp: number }> = {
  small: { hp: 1 },
  medium: { hp: 8 },
  large: { hp: 12 },
};

export const GAME_DURATION_SEC = 60;
export const SHIELD_MAX_HP = 3;
const RECORD_STORAGE_KEY = "space-miner-record";
const CONTROLS_SEEN_KEY = "space-miner-seen-controls";

// ---------------------------------------------------------------------------
// Context value interface
// ---------------------------------------------------------------------------
export interface GameplayContextValue {
  /* ---- reactive state ---- */
  phase: GamePhase;
  timeLeftSec: number;
  destroyedCount: number;
  shieldHp: number;
  shipHp: number; // 1 = alive, 0 = dead
  record: number;
  wasNewRecord: boolean;
  resetKey: number;

  /* ---- game flow ---- */
  goToReady: () => void;
  startGame: () => void;
  endGame: (_reason: "time" | "death") => void;
  retry: () => void;
  isGameActive: () => boolean;
  applyShieldDamage: () => void;

  /* ---- asteroid management ---- */
  registerAsteroid: (id: string, type: AsteroidSizeType) => void;
  damageAsteroid: (id: string, damage: number) => boolean;
  isAsteroidAlive: (id: string) => boolean;
  getAsteroid: (id: string) => AsteroidState | undefined;

  /* ---- shared refs ---- */
  asteroidMeshesRef: MutableRefObject<InstancedMesh[]>;
  shipPositionRef: MutableRefObject<Vector3>;
  onShieldCollisionRef: MutableRefObject<
    ((data: {
      uv: [number, number];
      direction: [number, number, number];
      asteroidId: string;
      intersectionPoint: [number, number, number];
    }) => void) | null
  >;
  onShieldDamageRef: MutableRefObject<
    ((data: {
      uv: [number, number];
      direction: [number, number, number];
      asteroidId: string;
      asteroidCenter: [number, number, number];
      intersectionPoint: [number, number, number];
    }) => void) | null
  >;
  onShieldCollisionSoundRef: MutableRefObject<
    ((position: [number, number, number]) => void) | null
  >;
  onAsteroidDestroyedRef: MutableRefObject<((asteroidId: string) => void) | null>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export const GameplayContext = createContext<GameplayContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function GameplayProvider({ children }: { children: ReactNode }) {
  const asteroidRegistryRef = useRef<Map<string, AsteroidState>>(new Map());
  const asteroidMeshesRef = useRef<InstancedMesh[]>([]);
  const shipPositionRef = useRef<Vector3>(new Vector3());

  const onShieldCollisionRef = useRef<
    ((data: {
      uv: [number, number];
      direction: [number, number, number];
      asteroidId: string;
      intersectionPoint: [number, number, number];
    }) => void) | null
  >(null);

  const onShieldDamageRef = useRef<
    ((data: {
      uv: [number, number];
      direction: [number, number, number];
      asteroidId: string;
      asteroidCenter: [number, number, number];
      intersectionPoint: [number, number, number];
    }) => void) | null
  >(null);

  const onShieldCollisionSoundRef = useRef<
    ((position: [number, number, number]) => void) | null
  >(null);

  const onAsteroidDestroyedRef = useRef<((asteroidId: string) => void) | null>(
    null
  );

  const isGameActiveRef = useRef(false);
  const destroyedCountRef = useRef(0);
  const recordRef = useRef(0);

  const [phase, setPhase] = useState<GamePhase>("controls");
  const [timeLeftSec, setTimeLeftSec] = useState(GAME_DURATION_SEC);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [shieldHp, setShieldHp] = useState(SHIELD_MAX_HP);
  const [shipHp, setShipHp] = useState(1);
  const [record, setRecord] = useState(0);
  const [wasNewRecord, setWasNewRecord] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Load record and controls-seen from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(RECORD_STORAGE_KEY);
        if (stored) {
          const val = parseInt(stored, 10);
          if (!isNaN(val)) {
            setRecord(val);
            recordRef.current = val;
          }
        }
        if (localStorage.getItem(CONTROLS_SEEN_KEY) === "1") {
          setPhase("ready");
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  const isGameActive = useCallback(() => isGameActiveRef.current, []);

  const endGame = useCallback(
    (reason: "time" | "death") => {
      void reason; // Used for API clarity; both paths behave the same
      isGameActiveRef.current = false;
      setPhase("ended");
      const count = destroyedCountRef.current;
      const prevRecord = recordRef.current;
      if (typeof window !== "undefined" && count > prevRecord) {
        try {
          localStorage.setItem(RECORD_STORAGE_KEY, String(count));
        } catch {
          /* ignore */
        }
        recordRef.current = count;
        setWasNewRecord(true);
        setRecord(count);
      } else {
        setWasNewRecord(false);
      }
    },
    []
  );

  const applyShieldDamage = useCallback(() => {
    if (!isGameActiveRef.current) return;
    setShieldHp((prev) => {
      if (prev <= 1) {
        setShipHp(0);
        endGame("death");
        return 0;
      }
      return prev - 1;
    });
  }, [endGame]);

  const goToReady = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CONTROLS_SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setPhase("ready");
  }, []);
  const startGame = useCallback(() => {
    setPhase("playing");
    setTimeLeftSec(GAME_DURATION_SEC);
    setDestroyedCount(0);
    destroyedCountRef.current = 0;
    setShieldHp(SHIELD_MAX_HP);
    setShipHp(1);
    isGameActiveRef.current = true;
  }, []);

  const retry = useCallback(() => {
    asteroidRegistryRef.current.clear();
    setResetKey((k) => k + 1);
    const seenControls =
      typeof window !== "undefined" &&
      localStorage.getItem(CONTROLS_SEEN_KEY) === "1";
    setPhase(seenControls ? "ready" : "controls");
    setTimeLeftSec(GAME_DURATION_SEC);
    setDestroyedCount(0);
    destroyedCountRef.current = 0;
    setShieldHp(SHIELD_MAX_HP);
    setShipHp(1);
    setWasNewRecord(false);
  }, []);

  // Countdown timer when playing
  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          endGame("time");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, endGame]);

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
        setDestroyedCount((prev) => {
          const next = prev + 1;
          destroyedCountRef.current = next;
          return next;
        });
        return true;
      }
      return false;
    },
    []
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
  // Context value
  // -----------------------------------------------------------------------
  const value: GameplayContextValue = {
    phase,
    timeLeftSec,
    destroyedCount,
    shieldHp,
    shipHp,
    record,
    wasNewRecord,
    resetKey,

    goToReady,
    startGame,
    endGame,
    retry,
    isGameActive,
    applyShieldDamage,

    registerAsteroid,
    damageAsteroid,
    isAsteroidAlive,
    getAsteroid,

    asteroidMeshesRef,
    shipPositionRef,
    onShieldCollisionRef,
    onShieldDamageRef,
    onShieldCollisionSoundRef,
    onAsteroidDestroyedRef,
  };

  return (
    <GameplayContext.Provider value={value}>
      {children}
    </GameplayContext.Provider>
  );
}
