"use client";

import { useState } from "react";
import { useGameplay } from "../hooks/useGameplay";
import { CONTROLS_DISPLAY } from "../config/controlsDisplay";

const glassStyle =
  "bg-slate-900/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.15)]";
const neonText = "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]";
const btnPrimary =
  "px-8 py-3 rounded-xl font-bold text-lg tracking-wider transition-all duration-300 border-2 border-cyan-500/50 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30 hover:shadow-[0_0_35px_rgba(34,211,238,0.5)] active:scale-95";

export function ControlsHelpOverlay() {
  const { phase } = useGameplay();
  const [open, setOpen] = useState(false);

  if (phase !== "playing") return null;

  return (
    <>
      {/* Controls button - top right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 right-6 z-40 px-4 py-2 rounded-xl bg-slate-900/50 backdrop-blur-xl border border-cyan-500/30 text-cyan-200 font-bold text-sm uppercase tracking-wider hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-colors"
      >
        Controls
      </button>

      {/* Overlay modal - game continues underneath */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className={`relative ${glassStyle} p-8 max-w-5xl mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-2xl font-bold ${neonText} uppercase tracking-widest mr-32`}
              >
                Controls
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/20 text-sm font-bold"
              >
                X
              </button>
            </div>
            <div className="space-y-2 mb-6">
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
            <button
              onClick={() => setOpen(false)}
              className={`w-full ${btnPrimary}`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
