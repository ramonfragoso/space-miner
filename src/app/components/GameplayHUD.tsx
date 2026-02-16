"use client";
import { useGameplay } from "../hooks/useGameplay";
import {
  UPGRADE_COSTS,
  ESCAPE_MODULE_COST,
  type UpgradeState,
} from "../contexts/GameplayContext";

const UPGRADE_LABELS: Record<keyof UpgradeState, string> = {
  damage: "Damage",
  speed: "Speed",
  shield: "Shield",
};

const MULTIPLIER_DESC: Record<keyof UpgradeState, Record<1 | 2 | 3, string>> =
  {
    damage: { 1: "1x", 2: "2x", 3: "3x" },
    speed: { 1: "1x", 2: "1.5x", 3: "2x" },
    shield: { 1: "1x", 2: "2x", 3: "3x" },
  };

export function GameplayHUD() {
  const {
    coins,
    upgrades,
    hasEscapeModule,
    destroyedCount,
    purchaseUpgrade,
    purchaseEscapeModule,
    canPurchaseUpgrade,
    canPurchaseEscapeModule,
  } = useGameplay();

  const allMaxed =
    upgrades.damage === 3 && upgrades.speed === 3 && upgrades.shield === 3;

  return (
    <div className="fixed top-4 left-4 z-50 pointer-events-auto select-none font-mono text-sm space-y-3">
      {/* Coins & stats */}
      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white border border-white/10 shadow-lg">
        <div className="flex items-center gap-2 text-lg font-bold tracking-wide">
          <span className="text-yellow-400">&#x2B50;</span>
          <span>{coins.toLocaleString()} coins</span>
        </div>
        <div className="text-white/50 text-xs mt-1">
          Asteroids destroyed: {destroyedCount}
        </div>
      </div>

      {/* Upgrades */}
      <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white border border-white/10 shadow-lg space-y-2">
        <div className="text-xs uppercase tracking-widest text-white/40 mb-1">
          Upgrades
        </div>

        {(Object.keys(UPGRADE_LABELS) as (keyof UpgradeState)[]).map(
          (type) => {
            const level = upgrades[type];
            const { canBuy, cost } = canPurchaseUpgrade(type);
            const maxed = level >= 3;

            return (
              <div key={type} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-white/80">{UPGRADE_LABELS[type]}</span>
                  <span className="text-white/40 text-xs">
                    Lv{level} ({MULTIPLIER_DESC[type][level]})
                  </span>
                </div>

                {maxed ? (
                  <span className="text-green-400 text-xs">MAX</span>
                ) : (
                  <button
                    disabled={!canBuy}
                    onClick={() => purchaseUpgrade(type)}
                    className={`px-2 py-0.5 rounded text-xs transition-colors ${
                      canBuy
                        ? "bg-yellow-500/80 hover:bg-yellow-400 text-black cursor-pointer"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {cost.toLocaleString()} coins
                  </button>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Escape module */}
      {allMaxed && !hasEscapeModule && (
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-white border border-yellow-500/30 shadow-lg">
          <button
            disabled={!canPurchaseEscapeModule()}
            onClick={() => purchaseEscapeModule()}
            className={`w-full px-3 py-2 rounded font-bold text-sm tracking-wide transition-colors ${
              canPurchaseEscapeModule()
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black cursor-pointer"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            Escape Module — {ESCAPE_MODULE_COST.toLocaleString()} coins
          </button>
        </div>
      )}

      {hasEscapeModule && (
        <div className="bg-green-900/70 backdrop-blur-sm rounded-lg px-4 py-3 text-green-300 border border-green-500/30 shadow-lg text-center font-bold">
          ESCAPE MODULE ACTIVATED — YOU WIN!
        </div>
      )}
    </div>
  );
}
