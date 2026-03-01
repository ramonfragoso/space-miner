"use client";

import { useGameplay } from "../hooks/useGameplay";
import { CONTROLS_DISPLAY } from "../config/controlsDisplay";

const glassStyle =
  "bg-slate-900/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.15)]";

const neonText = "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]";

const btnBase =
  "px-8 py-3 rounded-xl font-bold text-lg tracking-wider transition-all duration-300 border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_35px_rgba(34,211,238,0.5)] hover:border-cyan-400/80 active:scale-95";

const btnPrimary =
  "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 " + btnBase;

export function GameOverlay() {
  const {
    phase,
    destroyedCount,
    wasNewRecord,
    goToReady,
    startGame,
    retry,
  } = useGameplay();

  if (phase === "playing") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Controls screen */}
      {phase === "controls" && (
        <div
          className={`relative ${glassStyle} p-8 max-w-5xl mx-4`}
        >
          <h2
            className={`text-2xl font-bold mb-6 ${neonText} text-center uppercase tracking-widest mr-32`}
          >
            Controls
          </h2>
          <div className="space-y-2 mb-8">
            {CONTROLS_DISPLAY.map(({ key, description }) => (
              <div
                key={key}
                className="flex justify-between items-center py-2 px-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
              >
                <kbd className="px-2 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 font-mono text-sm">
                  {key}
                </kbd>
                <span className="text-slate-200 text-sm">{description}</span>
              </div>
            ))}
          </div>
          <button onClick={goToReady} className={`w-full ${btnPrimary}`}>
            Next
          </button>
        </div>
      )}

      {/* Ready screen */}
      {phase === "ready" && (
        <div
          className={`relative ${glassStyle} p-12 max-w-sm mx-4`}
        >
          <h2
            className={`text-2xl font-bold mb-8 ${neonText} text-center uppercase tracking-widest`}
          >
            Ready to Mine
          </h2>
          <p className="text-slate-300 text-center mb-8 text-sm">
            Destroy as many asteroids as you can in 2 minutes.
            <br />
            Shield absorbs 3 hits — survive the chaos!
          </p>
          <button onClick={startGame} className={`w-full ${btnPrimary}`}>
            Start
          </button>
        </div>
      )}

      {/* Game over screen */}
      {phase === "ended" && (
        <div
          className={`relative ${glassStyle} p-10 max-w-md mx-4`}
        >
          <h2
            className={`text-2xl font-bold mb-6 ${neonText} text-center uppercase tracking-widest`}
          >
            Game Over
          </h2>
          <div className="text-center mb-6">
            <p className="text-slate-300 text-sm uppercase tracking-wider mb-1">
              Asteroids Destroyed
            </p>
            <p className={`text-5xl font-bold ${neonText}`}>{destroyedCount}</p>
          </div>
          {wasNewRecord && destroyedCount > 0 && (
            <p className="text-cyan-400 text-center mb-6 px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-sm italic">
              Congratulations, you&apos;ve broken your own record in mining asteroids!
            </p>
          )}
          <button onClick={retry} className={`w-full ${btnPrimary}`}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
