import type { CharacterReze } from './CharacterReze';

export function basicAttack(char: CharacterReze) {
  char.state = 'attack';
  char.cooldowns.basic_atk = 0.4; // 0.4s cooldown
  
  // Hitbox trả về để engine bắt va chạm (nếu có quái)
  const attackBox = {
    x: char.x + (char.facingRight ? char.width / 2 : -char.width / 2 - 40),
    y: char.y - 60,
    w: 60,
    h: 60,
    dmg: char.damage,
    type: 'physical'
  };

  // Tạo screen shake nhẹ
  char.screenShake = 5;

  return attackBox;
}

export function skill1(char: CharacterReze) {
  if (char.cooldowns.skill1 > 0 || char.mp < 30) return;
  
  char.mp -= 30;
  char.state = 'jump'; // Bay lên xả bom
  char.cooldowns.skill1 = 5; // 5s cooldown
  
  // Áp dụng lực nhảy cực mạnh nhờ phản lực bom
  char.vy = -char.jumpForce * 1.5;
  char.screenShake = 15; // Rung màn hình mạnh
  
  // Tạo hitbox nổ diện rộng dưới chân
  const explosionBox = {
    x: char.x - 100,
    y: char.y - 50,
    w: 200,
    h: 100,
    dmg: char.damage * 2.5,
    type: 'explosion'
  };

  return explosionBox;
}

export function gainExp(char: CharacterReze, amount: number) {
  char.exp += amount;
  while (char.exp >= char.expToNext) {
    char.exp -= char.expToNext;
    char.level++;
    char.expToNext = Math.floor(char.expToNext * 1.4);
    
    // Stat boost per level
    char.maxHP += 30; 
    char.hp = char.maxHP;
    char.maxMP += 10;
    char.mp = char.maxMP;
    char.damage += 5; 
    char.defense += 2;
    
    char.onLevelUp?.(char.level);
  }
}
