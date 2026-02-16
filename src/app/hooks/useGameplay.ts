"use client";
import { useContext } from "react";
import {
  GameplayContext,
  type GameplayContextValue,
} from "../contexts/GameplayContext";

export function useGameplay(): GameplayContextValue {
  const context = useContext(GameplayContext);
  if (!context) {
    throw new Error("useGameplay must be used within a <GameplayProvider>");
  }
  return context;
}
