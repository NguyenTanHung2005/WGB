import type { CharacterClass } from '../types/interfaces';

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'knight',
    name: 'Kỵ sĩ (Knight)',
    maxHp: 8,
    maxShield: 6,
    speed: 4.0,
    skillName: 'Dual Wield',
    skillCooldown: 12000,
    skillDescription: 'Sử dụng hai bản sao của vũ khí hiện tại cùng lúc, nhân đôi tốc độ đánh và sát thương trong 5 giây. Không tốn thêm mana cho vũ khí thứ hai.'
  },
  {
    id: 'rogue',
    name: 'Sát thủ (Rogue)',
    maxHp: 6,
    maxShield: 4,
    speed: 5.5,
    skillName: 'Dodge Roll',
    skillCooldown: 4000,
    skillDescription: 'Nhào lộn né tránh theo hướng di chuyển. Miễn nhiễm mọi sát thương trong 0.4 giây lộn. Đòn đánh đầu tiên ngay sau khi lộn chắc chắn chí mạng (Crit x1.5 sát thương).'
  },
  {
    id: 'mage',
    name: 'Pháp sư (Mage)',
    maxHp: 5,
    maxShield: 5,
    speed: 3.5,
    skillName: 'Lightning Chain',
    skillCooldown: 10000,
    skillDescription: 'Phóng ra luồng sét lan truyền giữa tối đa 5 kẻ địch gần nhất trong phòng, gây 15 sát thương và làm choáng (stun) kẻ địch trong 1.5 giây.'
  },
  {
    id: 'archer',
    name: 'Cung thủ (Archer)',
    maxHp: 6,
    maxShield: 4,
    speed: 4.8,
    skillName: 'Piercing Arrow',
    skillCooldown: 6000,
    skillDescription: 'Bắn ra một mũi tên cực mạnh xuyên thấu toàn bộ kẻ địch trên đường bay, gây 10 sát thương và không bị chặn bởi thùng gỗ.'
  }
];
