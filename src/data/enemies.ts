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
    name: 'Tà Giáo Đồ (Cultist)',
    maxHp: 20,
    speed: 2.5,
    radius: 16,
    damage: 3,
    aiPattern: 'chase',
    attackCooldown: 1000,
    color: '#14532d' // Xanh rêu tối
  },
  {
    id: 'ranged_skeleton',
    name: 'Bộ Cốt Lục Lạc (Shattered Skeleton Ranged)',
    maxHp: 15,
    speed: 1.8,
    radius: 14,
    damage: 2,
    aiPattern: 'shoot',
    attackCooldown: 1500,
    color: '#737373' // Xám xỉn
  },
  {
    id: 'suicide_bat',
    name: 'Khối U Lơ Lửng (Floating Tumor)',
    maxHp: 10,
    speed: 3.8,
    radius: 12,
    damage: 5, // Sát thương nổ
    aiPattern: 'charge',
    attackCooldown: 500, // Phát nổ lập tức khi tiếp cận
    color: '#7f1d1d' // Đỏ máu sẫm
  },
  {
    id: 'melee_skeleton',
    name: 'Xác Chết Rỉ Sét (Shattered Skeleton Melee)',
    maxHp: 18,
    speed: 2.8,
    radius: 14,
    damage: 4,
    aiPattern: 'chase',
    attackCooldown: 800,
    color: '#52525b' // Xám kẽm
  },
  {
    id: 'necromancer',
    name: 'Lich (Tử Ma)',
    maxHp: 30,
    speed: 1.5,
    radius: 18,
    damage: 0, // Không gây sát thương trực tiếp
    aiPattern: 'summon',
    attackCooldown: 4000, // 4 giây gọi đệ 1 lần
    color: '#3b0764' // Tím đen
  }
];

export const BOSS_TEMPLATE = {
  id: 'grand_slime',
  name: 'Quái Thai Khổng Lồ (Flesh Amalgamation)',
  maxHp: 300,
  speed: 1.5,
  radius: 35,
  damage: 4,
  aiPattern: 'chase' as AIPattern,
  attackCooldown: 2000,
  color: '#831843' // Tím hồng thịt rữa
};
