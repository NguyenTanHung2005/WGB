import type { AIPattern, Biome } from '../types/interfaces';

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

export const ENEMY_TEMPLATES_BY_BIOME: Record<Biome, EnemyTemplate[]> = {
  'dungeon': [
    { id: 'melee_goblin', name: 'Tà Giáo Đồ (Cultist)', maxHp: 20, speed: 2.5, radius: 16, damage: 3, aiPattern: 'dash_attack', attackCooldown: 1000, color: '#14532d' },
    { id: 'ranged_skeleton', name: 'Cung Thủ Hài Cốt', maxHp: 15, speed: 1.8, radius: 14, damage: 2, aiPattern: 'shoot', attackCooldown: 1500, color: '#737373' },
    { id: 'melee_skeleton', name: 'Chiến Binh Hài Cốt', maxHp: 18, speed: 2.8, radius: 14, damage: 4, aiPattern: 'ambush', attackCooldown: 800, color: '#52525b' },
    { id: 'necromancer', name: 'Tử Ma (Lich)', maxHp: 30, speed: 1.5, radius: 18, damage: 0, aiPattern: 'summon', attackCooldown: 4000, color: '#3b0764' }
  ],
  'volcano': [
    { id: 'fire_slime', name: 'Slime Lửa', maxHp: 30, speed: 3.8, radius: 15, damage: 5, aiPattern: 'charge', attackCooldown: 800, color: '#ef4444' },
    { id: 'lava_golem', name: 'Golem Dung Nham', maxHp: 60, speed: 1.2, radius: 24, damage: 8, aiPattern: 'chase', attackCooldown: 2000, color: '#7f1d1d' },
    { id: 'hellhound', name: 'Chó Săn Địa Ngục', maxHp: 25, speed: 4.5, radius: 14, damage: 4, aiPattern: 'dash_attack', attackCooldown: 1000, color: '#b91c1c' }
  ],
  'ice': [
    { id: 'frost_zombie', name: 'Zombie Băng', maxHp: 40, speed: 1.5, radius: 16, damage: 4, aiPattern: 'chase', attackCooldown: 1500, color: '#7dd3fc' },
    { id: 'ice_spirit', name: 'Oán Linh Băng', maxHp: 20, speed: 2.0, radius: 14, damage: 3, aiPattern: 'shoot', attackCooldown: 1200, color: '#bae6fd' },
    { id: 'yeti', name: 'Người Tuyết Yeti', maxHp: 70, speed: 2.2, radius: 26, damage: 7, aiPattern: 'ambush', attackCooldown: 2500, color: '#e0f2fe' }
  ],
  'moss': [
    { id: 'toxic_slime', name: 'Slime Độc', maxHp: 35, speed: 2.2, radius: 16, damage: 4, aiPattern: 'charge', attackCooldown: 1000, color: '#22c55e' },
    { id: 'poison_flower', name: 'Hoa Độc', maxHp: 25, speed: 0.5, radius: 18, damage: 5, aiPattern: 'shoot', attackCooldown: 2000, color: '#15803d' },
    { id: 'plague_rat', name: 'Chuột Dịch Bệnh', maxHp: 15, speed: 4.0, radius: 12, damage: 3, aiPattern: 'dash_attack', attackCooldown: 600, color: '#4d7c0f' }
  ],
  'blood': [
    { id: 'weeping_wraith', name: 'Oán Linh Máu', maxHp: 40, speed: 3.0, radius: 16, damage: 5, aiPattern: 'teleport_attack', attackCooldown: 2000, color: '#9f1239' },
    { id: 'flesh_golem', name: 'Golem Xác Thịt', maxHp: 90, speed: 1.0, radius: 28, damage: 8, aiPattern: 'chase', attackCooldown: 2500, color: '#713f12' },
    { id: 'suicide_bat', name: 'Khối U Lơ Lửng', maxHp: 20, speed: 4.0, radius: 14, damage: 6, aiPattern: 'charge', attackCooldown: 500, color: '#be123c' },
    { id: 'chainsaw_fiend', name: 'Ác Quỷ Cưa', maxHp: 50, speed: 3.5, radius: 18, damage: 7, aiPattern: 'dash_attack', attackCooldown: 800, color: '#b91c1c' }
  ]
};

export const BOSS_TEMPLATE_BY_BIOME: Record<Biome, EnemyTemplate> = {
  'dungeon': { id: 'the_fallen_king', name: 'Kẻ Sa Ngã (The Fallen King)', maxHp: 250, speed: 1.6, radius: 60, damage: 4, aiPattern: 'chase', attackCooldown: 2000, color: '#4b5563' },
  'volcano': { id: 'fire_dragon', name: 'Cổ Long Lửa (Fire Dragon)', maxHp: 400, speed: 2.0, radius: 110, damage: 6, aiPattern: 'dragon_boss', attackCooldown: 4000, color: '#dc2626' },
  'ice': { id: 'frost_lord', name: 'Chúa Tể Băng Giá (Frost Lord)', maxHp: 350, speed: 1.8, radius: 70, damage: 5, aiPattern: 'frost_boss', attackCooldown: 1500, color: '#0ea5e9' },
  'moss': { id: 'toxic_behemoth', name: 'Quái Thủy Tinh Độc (Toxic Behemoth)', maxHp: 500, speed: 1.2, radius: 90, damage: 5, aiPattern: 'toxic_boss', attackCooldown: 3000, color: '#166534' },
  'blood': { id: 'blood_fiend', name: 'Chúa Tể Huyết Hạm (Blood Fiend)', maxHp: 666, speed: 2.5, radius: 80, damage: 8, aiPattern: 'blood_boss', attackCooldown: 2000, color: '#831843' }
};

