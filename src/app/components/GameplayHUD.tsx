"use client";

import { useGameplay } from "../hooks/useGameplay";

const panelStyle =
  "bg-slate-900/50 backdrop-blur-xl border border-cyan-500/30 rounded-xl px-4 py-3 shadow-[0_0_20px_rgba(34,211,238,0.1)]";
const neonText = "text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]";

export function GameplayHUD() {
  const {
    phase,
    timeLeftSec,
    destroyedCount,
    shieldHp,
  } = useGameplay();

  if (phase !== "playing") return null;

  const mins = Math.floor(timeLeftSec / 60);
  const secs = timeLeftSec % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <>
      {/* Countdown - top center */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className={`${panelStyle} flex flex-col items-center`}>
          <span className="text-xs uppercase tracking-widest text-cyan-400/80">
            Time
          </span>
          <span
            className={`text-3xl font-bold tabular-nums ${neonText} ${
              timeLeftSec <= 10 ? "animate-pulse" : ""
            }`}
          >
            {timeStr}
          </span>
        </div>
      </div>

      {/* Asteroid count - bottom left */}
      <div className="fixed bottom-6 left-6 z-50 pointer-events-none">
        <div className={`${panelStyle}`}>
          <span className="text-xs uppercase tracking-widest text-cyan-400/80 block mb-0.5">
            Destroyed
          </span>
          <span className={`text-2xl font-bold ${neonText}`}>
            {destroyedCount}
          </span>
        </div>
      </div>

      {/* Shield HP - bottom right */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
        <div className={`${panelStyle}`}>
          <span className="text-xs uppercase tracking-widest text-cyan-400/80 block mb-0.5">
            Shield
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border transition-colors ${
                  i <= shieldHp
                    ? "bg-cyan-400 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    : "bg-slate-700/50 border-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
