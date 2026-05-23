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
    aiPattern: 'dash_attack',
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
    aiPattern: 'ambush',
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
  },
  {
    id: 'weeping_wraith',
    name: 'Oán Linh Máu (Weeping Wraith)',
    maxHp: 25,
    speed: 2.0,
    radius: 16,
    damage: 3,
    aiPattern: 'teleport_attack', // Sẽ cần cập nhật aiPattern này hoặc map về dash_attack tạm thời
    attackCooldown: 2500,
    color: '#9f1239' // Đỏ huyết tẩm
  },
  {
    id: 'flesh_golem',
    name: 'Golem Xác Thịt (Flesh Golem)',
    maxHp: 80, // Rất trâu
    speed: 0.8, // Đi siêu chậm
    radius: 28, // Lớn
    damage: 8,  // Đánh rất đau
    aiPattern: 'chase', 
    attackCooldown: 3000,
    color: '#713f12' // Nâu xỉn thịt ôi
  },
  {
    id: 'chainsaw_fiend',
    name: 'Ác Quỷ Cưa (Chainsaw Fiend)',
    maxHp: 40,
    speed: 3.5,
    radius: 18,
    damage: 6,
    aiPattern: 'dash_attack',
    attackCooldown: 800,
    color: '#b91c1c' // Đỏ chót
  },
  {
    id: 'blood_priest',
    name: 'Tu Sĩ Máu (Blood Priest)',
    maxHp: 25,
    speed: 2.0,
    radius: 15,
    damage: 4,
    aiPattern: 'shoot',
    attackCooldown: 1200,
    color: '#881337' // Đỏ sẫm
  }
];

export const BOSS_NAMES = [
  'REZE THE BOMB DEVIL',
  'FLESH AMALGAMATION',
  'THE FORSAKEN ONE',
  'LORD OF DECAY',
  'BLOOD STARVED BEAST',
  'ORPHAN OF THE ABYSS',
  'GOREBEAST OF THE DEPTHS'
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
