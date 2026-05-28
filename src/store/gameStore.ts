import { create } from 'zustand';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'game_over' | 'victory' | 'cutscene_intro' | 'cutscene_boss' | 'cutscene_ending' | 'level_up' | 'next_floor' | 'boss_preview' | 'kesanga_preview' | 'gausamset_preview' | 'reze_preview';

interface GameState {
  phase: GamePhase;
  gold: number;
  score: number;
  selectedClassId: string | null;
  activeRoomId: string | null;
  currentFloor: number;
  isTransitioning: boolean;
  bossCutsceneViewed: boolean;
  hitStopUntil: number;
  announcement: { text: string; subtext?: string; until: number } | null;
  
  setPhase: (phase: GamePhase) => void;
  setBossCutsceneViewed: (val: boolean) => void;
  setGold: (gold: number) => void;
  addGold: (amount: number) => void;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;
  setSelectedClassId: (classId: string | null) => void;
  setActiveRoomId: (roomId: string | null) => void;
  setCurrentFloor: (floor: number) => void;
  setTransitioning: (val: boolean) => void;
  setAnnouncement: (text: string, subtext?: string, durationMs?: number) => void;
  triggerHitStop: (duration: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  isTransitioning: false,
  gold: 0,
  score: 0,
  currentFloor: 1,
  selectedClassId: null,
  activeRoomId: null,
  bossCutsceneViewed: false,
  hitStopUntil: 0,
  announcement: null,

  setPhase: (phase) => set({ phase }),
  setBossCutsceneViewed: (val) => set({ bossCutsceneViewed: val }),
  setGold: (gold) => set({ gold }),
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  setScore: (score) => set({ score }),
  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  setSelectedClassId: (selectedClassId) => set({ selectedClassId }),
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  setTransitioning: (val) => set({ isTransitioning: val }),
  setAnnouncement: (text, subtext, durationMs = 2000) => set({ announcement: { text, subtext, until: performance.now() + durationMs } }),
  triggerHitStop: (duration) => set({ hitStopUntil: performance.now() + duration }),
  resetGame: () => set({
    phase: 'menu',
    isTransitioning: false,
    gold: 0,
    score: 0,
    currentFloor: 1,
    selectedClassId: null,
    activeRoomId: null,
    bossCutsceneViewed: false,
    hitStopUntil: 0,
    announcement: null,
  }),
}));
