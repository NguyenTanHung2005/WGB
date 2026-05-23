import type { CharacterClass } from '../types/interfaces';

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'knight',
    name: 'Lính Đánh Thuê (Mercenary)',
    maxHp: 5,
    maxShield: 2,
    speed: 3.8,
    skillName: 'Blood Frenzy',
    skillCooldown: 12000,
    skillDescription: 'Vung vũ khí một cách điên cuồng, nhân đôi tốc độ đánh và sát thương trong 5 giây. Không tốn thêm mana cho vũ khí thứ hai.'
  },
  {
    id: 'rogue',
    name: 'Kẻ Ngoại Đạo (Outlander)',
    maxHp: 4,
    maxShield: 1,
    speed: 5.0,
    skillName: 'Desperate Roll',
    skillCooldown: 4000,
    skillDescription: 'Lộn nhào trong hoảng loạn để né tránh cái chết. Miễn nhiễm sát thương trong 0.4 giây. Đòn đánh tiếp theo mang theo sự thù hận chí mạng (Crit x1.5).'
  },
  {
    id: 'mage',
    name: 'Tu Sĩ Bóng Tối (Dark Priest)',
    maxHp: 3,
    maxShield: 2,
    speed: 3.5,
    skillName: 'Blood Magic',
    skillCooldown: 10000,
    skillDescription: 'Hiến tế linh hồn kẻ địch để tạo ra luồng sét huyết ngải giật liên hoàn 5 mục tiêu, gây 15 sát thương và làm tê liệt chúng trong 1.5 giây.'
  },
  {
    id: 'archer',
    name: 'Kẻ Săn Đêm (Night Hunter)',
    maxHp: 4,
    maxShield: 1,
    speed: 4.5,
    skillName: 'Cursed Arrow',
    skillCooldown: 6000,
    skillDescription: 'Phóng ra một mũi tên mang lời nguyền xuyên thấu mọi xác thịt, gây 10 sát thương và cắm phập vào bóng tối vô tận.'
  },
  {
    id: 'summoner',
    name: 'Phù Thủy Huyết Ngải (Blood Sorcerer)',
    maxHp: 3,
    maxShield: 1,
    speed: 4.0,
    skillName: 'Summon Ghoul',
    skillCooldown: 15000,
    skillDescription: 'Triệu hồi 2 u linh (Ghoul) từ cõi âm để cắn xé kẻ địch. Chúng sẽ tan rã thành cát bụi sau 15 giây.'
  },
  {
    id: 'paladin',
    name: 'Kẻ Tử Đạo (Martyr)',
    maxHp: 6,
    maxShield: 3,
    speed: 3.0,
    skillName: 'False Light',
    skillCooldown: 20000,
    skillDescription: 'Hút 2 HP của bản thân để tạo ra vụ nổ ánh sáng gây mù loà, xoá sổ mọi luồng đạn và gây 20 sát thương xung quanh.'
  },

  {
    id: 'berserker',
    name: 'Linh Hồn Bị Nguyền Rủa (Cursed Soul)',
    maxHp: 8,
    maxShield: 0,
    speed: 4.5,
    skillName: 'Death Spin',
    skillCooldown: 12000,
    skillDescription: 'Lên cơn điên loạn, xoay vũ khí như một cỗ máy xay thịt trong 4 giây. Liên tục gây sát thương lên những xác chết xung quanh.'
  },
  {
    id: 'ninja',
    name: 'Sát Thủ Bóng Đêm (Shadow Assassin)',
    maxHp: 3,
    maxShield: 1,
    speed: 5.5,
    skillName: 'Poison Blades',
    skillCooldown: 8000,
    skillDescription: 'Phóng ra 8 lưỡi dao tẩm độc phân hủy theo mọi hướng.'
  },
  {
    id: 'bomb_devil',
    name: 'Quỷ Boom (Bomb Devil)',
    maxHp: 6,
    maxShield: 1,
    speed: 4.8,
    skillName: 'Explosive Chain',
    skillCooldown: 6000,
    skillDescription: 'Ném ra một cái đầu phát nổ, tự kích hoạt sau 1 giây và gây sát thương khủng khiếp diện rộng. Kẻ địch bị nổ sẽ văng tung tóe.'
  }
];
