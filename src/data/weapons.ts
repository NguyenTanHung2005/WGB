import type { Weapon } from '../types/interfaces';

export const WEAPONS: Weapon[] = [
  {
    id: 'rusty_pistol',
    name: 'Súng lục rỉ sét',
    type: 'ranged',
    damage: 3,
    fireRate: 350,
    projectileSpeed: 10,
    range: 500,
    color: '#94a3b8'
  },
  {
    id: 'assault_rifle',
    name: 'Assault Rifle',
    type: 'ranged',
    damage: 2,
    fireRate: 120,
    projectileSpeed: 14,
    range: 600,
    color: '#f59e0b'
  },
  {
    id: 'broadsword',
    name: 'Broadsword',
    type: 'melee',
    damage: 10,
    fireRate: 500,
    range: 85,
    color: '#38bdf8'
  },
  {
    id: 'magic_staff',
    name: 'Trượng ma thuật',
    type: 'magic',
    damage: 8,
    fireRate: 600,
    projectileSpeed: 8,
    range: 450,
    color: '#a855f7'
  },
  {
    id: 'laser_shotgun',
    name: 'Laser Shotgun',
    type: 'ranged',
    damage: 4,
    fireRate: 500,
    projectileSpeed: 13,
    range: 550,
    color: '#ec4899'
  },
  {
    id: 'dagger',
    name: 'Dao găm bóng đêm',
    type: 'melee',
    damage: 5,
    fireRate: 200,
    range: 60,
    color: '#cbd5e1'
  },
  {
    id: 'wooden_bow',
    name: 'Cung Gỗ',
    type: 'ranged',
    damage: 6,
    fireRate: 700,
    projectileSpeed: 10,
    range: 450,
    color: '#8b5cf6'
  },
  {
    id: 'sniper_rifle',
    name: 'Sniper Rifle',
    type: 'ranged',
    damage: 15,
    fireRate: 1500,
    projectileSpeed: 25,
    range: 1000,
    color: '#10b981'
  },
  {
    id: 'plasma_cannon',
    name: 'Pháo Plasma',
    type: 'magic',
    damage: 10,
    fireRate: 600,
    projectileSpeed: 6,
    range: 600,
    color: '#0ea5e9'
  },
  {
    id: 'heavy_axe',
    name: 'Rìu Chiến',
    type: 'melee',
    damage: 18,
    fireRate: 900,
    range: 75,
    color: '#f43f5e'
  },
  {
    id: 'crossbow',
    name: 'Nỏ Kép',
    type: 'ranged',
    damage: 6,
    fireRate: 350,
    projectileSpeed: 16,
    range: 500,
    color: '#a3e635'
  },
  {
    id: 'kunai',
    name: 'Kunai Bóng Tối',
    type: 'ranged',
    damage: 4,
    fireRate: 250,
    projectileSpeed: 15,
    range: 400,
    color: '#94a3b8'
  },
  {
    id: 'blood_grimoire',
    name: 'Huyết Thư',
    type: 'magic',
    damage: 12,
    fireRate: 800,
    projectileSpeed: 7,
    range: 500,
    color: '#991b1b'
  },
  {
    id: 'holy_mace',
    name: 'Búa Thánh',
    type: 'melee',
    damage: 14,
    fireRate: 600,
    range: 80,
    color: '#fef08a'
  },
  {
    id: 'bomb_detonator',
    name: 'Kíp Nổ Reze',
    type: 'magic',
    damage: 25,
    fireRate: 1000,
    projectileSpeed: 5,
    range: 300,
    color: '#ef4444'
  }
];
