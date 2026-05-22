import type { AIPattern } from '../types/interfaces';

export interface EnemyTemplate {
  id: string;
  name: string;
  maxHp: number;
  speed: number;
  radius: number;
  damage: number;
  aiPattern: AIPattern;
  attackCooldown: number; // ms
  color: string;
}

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'melee_goblin',
    name: 'Goblin Chiến Binh',
    maxHp: 15,
    speed: 2.2,
    radius: 16,
    damage: 2,
    aiPattern: 'chase',
    attackCooldown: 1000,
    color: '#15803d' // Xanh lá cây đậm
  },
  {
    id: 'ranged_skeleton',
    name: 'Cung Thủ Xương',
    maxHp: 12,
    speed: 1.6,
    radius: 14,
    damage: 1,
    aiPattern: 'shoot',
    attackCooldown: 1500,
    color: '#eab308' // Vàng
  },
  {
    id: 'suicide_bat',
    name: 'Dơi Lửa Tự Sát',
    maxHp: 8,
    speed: 3.5,
    radius: 12,
    damage: 4, // Sát thương nổ
    aiPattern: 'charge',
    attackCooldown: 500, // Phát nổ lập tức khi tiếp cận
    color: '#dc2626' // Đỏ rực
  },
  {
    id: 'melee_skeleton',
    name: 'Chiến Binh Xương',
    maxHp: 15,
    speed: 2.5,
    radius: 14,
    damage: 3,
    aiPattern: 'chase',
    attackCooldown: 800,
    color: '#94a3b8' // Xám nhạt
  },
  {
    id: 'necromancer',
    name: 'Tử Linh Sư',
    maxHp: 25,
    speed: 1.2,
    radius: 18,
    damage: 0, // Không gây sát thương trực tiếp
    aiPattern: 'summon',
    attackCooldown: 15000, // 15 giây gọi đệ 1 lần
    color: '#6b21a8' // Tím đậm
  }
];

export const BOSS_TEMPLATE = {
  id: 'grand_slime',
  name: 'Vua Slime Vĩ Đại (Grand Slime)',
  maxHp: 250,
  speed: 1.2,
  radius: 35,
  damage: 3,
  aiPattern: 'chase' as AIPattern,
  attackCooldown: 2000,
  color: '#06b6d4' // Cyan nhấp nháy
};
