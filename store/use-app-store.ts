import { create } from "zustand";

interface AppState {
  scrollProgress: number;
  currentSection: number;
  mousePosition: { x: number; y: number };
  isLoading: boolean;
  cursorVariant: "default" | "hover" | "action" | "hidden";

  setScrollProgress: (v: number) => void;
  setCurrentSection: (v: number) => void;
  setMousePosition: (x: number, y: number) => void;
  setIsLoading: (v: boolean) => void;
  setCursorVariant: (v: AppState["cursorVariant"]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  scrollProgress: 0,
  currentSection: 0,
  mousePosition: { x: 0, y: 0 },
  isLoading: true,
  cursorVariant: "default",

  setScrollProgress: (v) => set({ scrollProgress: v }),
  setCurrentSection: (v) => set({ currentSection: v }),
  setMousePosition: (x, y) => set({ mousePosition: { x, y } }),
  setIsLoading: (v) => set({ isLoading: v }),
  setCursorVariant: (v) => set({ cursorVariant: v }),
}));
