import type { Relic } from '../types/interfaces';

export const RELICS: Record<string, Relic> = {
  vampire_tooth: {
    id: 'vampire_tooth',
    name: 'Vampire Tooth',
    description: 'Hồi 1 Máu khi tiêu diệt kẻ địch.',
    icon: '🦷'
  },
  hermes_boots: {
    id: 'hermes_boots',
    name: 'Hermes Boots',
    description: 'Tăng 15% tốc độ di chuyển.',
    icon: '🪽'
  },
  berserker_ring: {
    id: 'berserker_ring',
    name: 'Berserker Ring',
    description: 'Tăng 50% sát thương khi máu dưới 30%.',
    icon: '💍'
  }
};
