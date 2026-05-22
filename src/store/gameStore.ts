import { create } from 'zustand';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'game_over' | 'victory';

interface GameState {
  phase: GamePhase;
  gold: number;
  score: number;
  selectedClassId: string | null;
  activeRoomId: string | null;
  
  setPhase: (phase: GamePhase) => void;
  setGold: (gold: number) => void;
  addGold: (amount: number) => void;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;
  setSelectedClassId: (classId: string | null) => void;
  setActiveRoomId: (roomId: string | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  gold: 0,
  score: 0,
  selectedClassId: null,
  activeRoomId: null,

  setPhase: (phase) => set({ phase }),
  setGold: (gold) => set({ gold }),
  addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
  setScore: (score) => set({ score }),
  addScore: (amount) => set((state) => ({ score: state.score + amount })),
  setSelectedClassId: (selectedClassId) => set({ selectedClassId }),
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  resetGame: () => set({
    phase: 'menu',
    gold: 0,
    score: 0,
    selectedClassId: null,
    activeRoomId: null,
  }),
}));
