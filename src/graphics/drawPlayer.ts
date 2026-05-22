import type { Entity, Weapon } from '../types/interfaces';

export function drawPlayerChibi(
  ctx: CanvasRenderingContext2D,
  player: Entity,
  color: string,
  state: string,
  facing: number,
  phase: number,
  classId: string,
  weapon?: Weapon,
  isKnightSkill?: boolean,
  isHitFlash?: boolean
) {
  ctx.save();
  ctx.scale(facing, 1);

  let headY = -8;
  let bodyY = 0;
  let armRot = 0;
  let legLRot = 0;
  let legRRot = 0;

  // Hoạt ảnh di chuyển blocky
  if (state === 'walk') {
    const speedMult = 0.02;
    headY += Math.sin(phase * speedMult) > 0 ? 1 : -1; // Giật giật kiểu retro
    legLRot = Math.sin(phase * speedMult) * 0.4;
    legRRot = -Math.sin(phase * speedMult) * 0.4;
    armRot = Math.sin(phase * speedMult) * 0.2;
  } else if (state === 'idle') {
    headY += Math.sin(phase * 0.005) > 0 ? 0.5 : 0;
  } else if (state === 'roll') {
    ctx.rotate(phase * 0.04 * facing);
    headY = 0;
  }

  if (state === 'attack') {
    const atkProgress = Math.min(1.0, (performance.now() - (player.lastAttackTime || 0)) / 200);
    if (weapon && weapon.type === 'melee') {
      armRot = -Math.PI / 2 + atkProgress * Math.PI; 
    } else {
      armRot = -0.2 + (atkProgress < 0.5 ? -0.3 : 0); 
    }
  }

  if (state === 'dead') {
    ctx.fillStyle = '#450a0a'; // Máu me
    ctx.fillRect(-12, -2, 24, 6); // Vũng máu vuông vức
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-8, -6, 16, 8); // Thân nằm ngang
    ctx.restore();
    return;
  }

  if (isHitFlash) color = '#ffffff';

  // Chân chung cho mọi class (Dạng cột vuông)
  ctx.save(); ctx.translate(-4, bodyY + 6); ctx.rotate(legLRot);
  ctx.fillStyle = '#1c1917'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();
  ctx.save(); ctx.translate(4, bodyY + 6); ctx.rotate(legRRot);
  ctx.fillStyle = '#1c1917'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();

  // --- VẼ THEO TỪNG CLASS (DARK FANTASY PIXEL) ---
  if (classId === 'mage') {
    // Tu Sĩ Bóng Tối (Dark Priest)
    ctx.fillStyle = isHitFlash ? '#fff' : '#271c19'; // Đen ám đỏ
    ctx.fillRect(-8, bodyY - 4, 16, 16); // Áo dài sậm
    ctx.fillStyle = '#7f1d1d'; // Vệt máu
    ctx.fillRect(-2, bodyY + 2, 4, 10); 
    
    // Đầu
    ctx.fillStyle = color;
    ctx.fillRect(-6, headY - 6, 12, 12);
    // Mũ trùm che nửa mắt
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-7, headY - 7, 14, 6);
    // Mắt đỏ phát sáng
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-4, headY - 1, 2, 2);
    ctx.fillRect(2, headY - 1, 2, 2);

  } else if (classId === 'knight') {
    // Lính Đánh Thuê (Mercenary)
    ctx.fillStyle = isHitFlash ? '#fff' : '#3f3f46'; // Áo giáp xỉn màu
    ctx.fillRect(-8, bodyY - 4, 16, 14);
    ctx.fillStyle = '#27272a'; // Thắt lưng
    ctx.fillRect(-8, bodyY + 6, 16, 4);

    // Đầu
    ctx.fillStyle = color;
    ctx.fillRect(-6, headY - 6, 12, 12);
    // Mũ bảo hiểm rỉ sét
    ctx.fillStyle = '#52525b';
    ctx.fillRect(-7, headY - 8, 14, 10);
    // Khe nhìn đen kịt
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, headY - 4, 10, 4);

  } else if (classId === 'rogue') {
    // Kẻ Ngoại Đạo (Outlander)
    ctx.fillStyle = isHitFlash ? '#fff' : '#292524'; // Đồ da đen tã tượi
    ctx.fillRect(-7, bodyY - 4, 14, 12);
    ctx.fillStyle = '#451a03'; 
    ctx.fillRect(-5, bodyY - 4, 10, 6); 

    // Đầu
    ctx.fillStyle = color;
    ctx.fillRect(-6, headY - 6, 12, 12);
    // Tóc rối hoặc nón vải
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-6, headY - 8, 12, 4);
    // Mắt vô hồn
    ctx.fillStyle = '#000';
    ctx.fillRect(-3, headY - 2, 2, 2);
    ctx.fillRect(1, headY - 2, 2, 2);

  } else if (classId === 'archer') {
    // Kẻ Săn Đêm
    ctx.fillStyle = isHitFlash ? '#fff' : '#14532d'; // Áo thợ săn mục
    ctx.fillRect(-7, bodyY - 4, 14, 12);

    // Đầu
    ctx.fillStyle = color;
    ctx.fillRect(-6, headY - 6, 12, 12);
    // Mũ trùm
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(-7, headY - 7, 14, 14);
    ctx.fillStyle = '#000'; // Che mặt
    ctx.fillRect(-5, headY - 3, 10, 6);
    // Mắt
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-3, headY - 1, 2, 2);

  } else if (classId === 'summoner') {
    // Phù Thủy Huyết Ngải
    ctx.fillStyle = isHitFlash ? '#fff' : '#450a0a'; // Áo choàng máu
    ctx.fillRect(-8, bodyY - 4, 16, 16);

    // Đầu
    ctx.fillStyle = '#fca5a5'; // Da tái nhợt
    ctx.fillRect(-6, headY - 6, 12, 12);
    // Dấu ấn trên trán
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-2, headY - 4, 4, 2);
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, headY - 1, 2, 2);
    ctx.fillRect(2, headY - 1, 2, 2);

  } else if (classId === 'paladin') {
    // Kẻ Tử Đạo
    ctx.fillStyle = isHitFlash ? '#fff' : '#713f12'; // Giáp đồng thau móp méo
    ctx.fillRect(-9, bodyY - 4, 18, 14);

    // Đầu
    ctx.fillStyle = color;
    ctx.fillRect(-6, headY - 6, 12, 12);
    // Mũ trùm kín
    ctx.fillStyle = '#a16207';
    ctx.fillRect(-7, headY - 8, 14, 14);
    ctx.fillStyle = '#000';
    ctx.fillRect(-2, headY - 6, 4, 10); // Khe dọc hình chữ thập hẹp
    ctx.fillRect(-5, headY - 2, 10, 2);

  } else if (classId === 'berserker') {
    // Linh Hồn Bị Nguyền Rủa
    ctx.fillStyle = isHitFlash ? '#fff' : '#f87171'; // Thân trần đầy máu
    ctx.fillRect(-8, bodyY - 4, 16, 10);
    ctx.fillStyle = '#991b1b'; // Máu tóe
    ctx.fillRect(-8, bodyY, 6, 4);
    
    // Quần rách
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-8, bodyY + 6, 16, 4);

    // Đầu
    ctx.fillStyle = '#f87171';
    ctx.fillRect(-6, headY - 6, 12, 12);
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, headY - 2, 8, 4); // Mồm há hốc gào thét

  } else if (classId === 'ninja') {
    // Sát Thủ Bóng Đêm
    ctx.fillStyle = isHitFlash ? '#fff' : '#09090b'; 
    ctx.fillRect(-7, bodyY - 4, 14, 12);
    // Khăn đỏ
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-7, bodyY - 4, 14, 3);

    // Đầu
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-6, headY - 6, 12, 12);
    // Băng mắt
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(-6, headY - 2, 12, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(-3, headY - 1, 2, 2);
    ctx.fillRect(1, headY - 1, 2, 2);
  }

  // --- VẼ TAY & VŨ KHÍ ---
  ctx.save();
  ctx.translate(0, bodyY);
  ctx.rotate(armRot);

  // Tay cầm vũ khí (Tay phải - Vuông vức)
  ctx.fillStyle = color;
  ctx.fillRect(-2, -2, 8, 4);

  if (weapon) {
    ctx.translate(6, 0); // Vị trí vũ khí
    ctx.fillStyle = weapon.color || '#94a3b8';
    if (weapon.type === 'melee') {
      ctx.rotate(-Math.PI / 4);
      // Kiếm dạng khối vuông
      ctx.fillRect(0, -16, 4, 20); // Lưỡi
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, -2, 8, 4);  // Chuôi
    } else {
      // Súng/Cung dạng khối vuông
      ctx.fillRect(0, -2, 12, 4); // Nòng súng
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-2, 0, 4, 6);  // Tay cầm
    }
  }
  ctx.restore();

  // Tay trái (nếu có dùng skill Knight)
  if (isKnightSkill && weapon) {
    ctx.save();
    ctx.translate(0, bodyY);
    ctx.rotate(armRot + Math.PI); // Vung tay ngược lại
    ctx.fillStyle = color;
    ctx.fillRect(-2, -2, 8, 4);

    ctx.translate(6, 0);
    ctx.fillStyle = weapon.color || '#94a3b8';
    if (weapon.type === 'melee') {
      ctx.rotate(-Math.PI / 4);
      ctx.fillRect(0, -16, 4, 20);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, -2, 8, 4);
    } else {
      ctx.fillRect(0, -2, 12, 4);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-2, 0, 4, 6);
    }
    ctx.restore();
  } else {
    // Tay trái vung vẩy khi đi
    ctx.save();
    ctx.translate(-4, bodyY);
    ctx.rotate(-armRot);
    ctx.fillStyle = color;
    ctx.fillRect(-4, -2, 6, 4);
    ctx.restore();
  }

  ctx.restore();
}
