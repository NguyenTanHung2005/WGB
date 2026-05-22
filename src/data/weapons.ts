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
    damage: 3,
    fireRate: 120,
    projectileSpeed: 14,
    range: 600,
    color: '#f59e0b'
  },
  {
    id: 'broadsword',
    name: 'Broadsword',
    type: 'melee',
    damage: 9,
    fireRate: 600,
    range: 85,
    color: '#38bdf8'
  },
  {
    id: 'magic_staff',
    name: 'Trượng ma thuật',
    type: 'magic',
    damage: 12,
    fireRate: 800,
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
    damage: 6,
    fireRate: 200,
    range: 60,
    color: '#cbd5e1'
  },
  {
    id: 'wooden_bow',
    name: 'Cung Gỗ',
    type: 'ranged',
    damage: 5,
    fireRate: 600,
    projectileSpeed: 10,
    range: 450,
    color: '#8b5cf6'
  }
];
