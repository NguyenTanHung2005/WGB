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

  // --- HOẠT ẢNH DI CHUYỂN / TRẠNG THÁI ---
  if (classId === 'mage') {
    headY += Math.sin(phase * 0.003) * 2;
    bodyY += Math.sin(phase * 0.003) * 2;
    if (state === 'walk') {
      armRot = Math.sin(phase * 0.01) * 0.2;
    }
  } else if (classId === 'rogue' && state === 'walk') {
    headY += Math.sin(phase * 0.03) * 1.5;
    legLRot = Math.sin(phase * 0.03) * 0.8;
    legRRot = -Math.sin(phase * 0.03) * 0.8;
    armRot = Math.PI / 4; 
  } else if (state === 'idle') {
    headY += Math.sin(phase * 0.005) * 1.5;
    bodyY += Math.sin(phase * 0.005) * 0.5;
  } else if (state === 'walk') {
    const speedMult = classId === 'knight' ? 0.015 : 0.02;
    const bounce = classId === 'knight' ? 2.5 : 2;
    headY += Math.sin(phase * speedMult) * bounce;
    legLRot = Math.sin(phase * speedMult) * 0.6;
    legRRot = -Math.sin(phase * speedMult) * 0.6;
    armRot = Math.sin(phase * speedMult) * 0.4;
  } else if (state === 'roll') {
    ctx.rotate(phase * 0.04 * facing);
    headY = 0;
    legLRot = 0.5; legRRot = -0.5;
  }

  if (state === 'attack') {
    const atkProgress = Math.min(1.0, (performance.now() - (player.lastAttackTime || 0)) / 200);
    if (classId === 'mage') {
      armRot = -Math.PI / 2 + Math.sin(atkProgress * Math.PI) * 0.5; 
    } else if (classId === 'archer') {
      armRot = -Math.PI / 4; 
    } else if (weapon && weapon.type === 'melee') {
      armRot = -Math.PI / 2 + atkProgress * Math.PI; 
    } else {
      armRot = -0.2 + (atkProgress < 0.5 ? -0.3 : 0); 
    }
  }

  if (state === 'dead') {
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-12, -15, 24, 30, 8) : ctx.fillRect(-12, -15, 24, 30);
    ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-16, 12, 32, 6);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(-2, -5, 4, 12); ctx.fillRect(-6, -1, 12, 4);
    ctx.fillStyle = '#334155'; ctx.font = 'bold 8px Courier New'; ctx.textAlign = 'center'; ctx.fillText('RIP', 0, 10);
    ctx.restore();
    return;
  }

  if (isHitFlash) color = '#ffffff';

  // --- VẼ CƠ THỂ ---
  // --- VẼ CƠ THỂ THEO CLASS ---
  if (classId === 'mage') {
    // PHÁP SƯ (MAGE)
    // Áo chùng pháp sư (Hình tam giác rộng ở dưới)
    ctx.fillStyle = isHitFlash ? '#ffffff' : '#4c1d95'; // Tím đậm
    ctx.beginPath();
    ctx.moveTo(0, bodyY - 4); // Cổ
    ctx.lineTo(12, bodyY + 14); // Gấu áo phải
    ctx.lineTo(-12, bodyY + 14); // Gấu áo trái
    ctx.fill();

    // Vành áo chi tiết vàng
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-11, bodyY + 13);
    ctx.lineTo(11, bodyY + 13);
    ctx.stroke();

    // Đầu pháp sư (Tròn)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, headY - 4, 7, 0, Math.PI * 2);
    ctx.fill();

    // Mắt
    ctx.fillStyle = '#111827';
    ctx.fillRect(-3, headY - 5, 8, 3);
    ctx.fillStyle = '#38bdf8'; 
    ctx.fillRect(-1, headY - 4, 3, 2);

    // Mũ chóp nhọn rộng vành (Wizard Hat)
    ctx.fillStyle = '#312e81'; // Xanh tím sẫm
    
    // Chóp mũ (Tam giác rất cao)
    ctx.beginPath();
    ctx.moveTo(-8, headY - 8);
    ctx.lineTo(8, headY - 8);
    ctx.lineTo(0, headY - 32); 
    ctx.fill();

    // Vành mũ (Khối bo tròn dẹt)
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-16, headY - 10, 32, 6, 3) : ctx.fillRect(-16, headY - 10, 32, 6);
    ctx.fill();

  } else if (classId === 'knight') {
    // HIỆP SĨ (KNIGHT)
    ctx.save(); ctx.translate(-4, bodyY + 6); ctx.rotate(legLRot);
    ctx.fillStyle = '#475569'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();
    ctx.save(); ctx.translate(4, bodyY + 6); ctx.rotate(legRRot);
    ctx.fillStyle = '#475569'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();

    ctx.fillStyle = isHitFlash ? '#ffffff' : '#94a3b8';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-8, bodyY - 4, 16, 14, 2) : ctx.fillRect(-8, bodyY - 4, 16, 14);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-9, bodyY - 4, 18, 5); // Cầu vai rộng
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-8, bodyY + 8, 16, 3); // Thắt lưng đen

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-9, headY - 11, 18, 16, 4) : ctx.fillRect(-9, headY - 11, 18, 16);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, headY - 8, 4, 10);
    ctx.fillRect(-6, headY - 4, 12, 3);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-3, headY - 3, 2, 2);
    ctx.fillRect(1, headY - 3, 2, 2);

  } else if (classId === 'rogue') {
    // SÁT THỦ (ROGUE)
    if (state === 'walk' || state === 'roll') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-20, bodyY - 4, 12, 12, 3) : ctx.fillRect(-20, bodyY - 4, 12, 12);
      ctx.fill();
    }

    ctx.save(); ctx.translate(-3, bodyY + 6); ctx.rotate(legLRot);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();
    ctx.save(); ctx.translate(3, bodyY + 6); ctx.rotate(legRRot);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();

    ctx.fillStyle = isHitFlash ? '#ffffff' : '#334155';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-5, bodyY - 4, 10, 12, 3) : ctx.fillRect(-5, bodyY - 4, 10, 12);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(-5, bodyY - 4); ctx.lineTo(-1, bodyY - 4); ctx.lineTo(5, bodyY + 6); ctx.lineTo(1, bodyY + 6);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-6, headY - 8, 12, 12, 4) : ctx.fillRect(-6, headY - 8, 12, 12);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-7, headY - 2, 14, 8, 3) : ctx.fillRect(-7, headY - 2, 14, 8);
    ctx.fill();
    
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-2, headY - 5, 4, 2);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, headY - 2, 8, Math.PI, 0);
    ctx.fill();

  } else if (classId === 'paladin') {
    // KỴ SĨ THÁNH (PALADIN)
    ctx.save(); ctx.translate(-5, bodyY + 6); ctx.rotate(legLRot);
    ctx.fillStyle = '#ca8a04'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();
    ctx.save(); ctx.translate(5, bodyY + 6); ctx.rotate(legRRot);
    ctx.fillStyle = '#ca8a04'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();

    ctx.fillStyle = isHitFlash ? '#ffffff' : '#fef08a'; // Giáp vàng sáng
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-10, bodyY - 4, 20, 16, 3) : ctx.fillRect(-10, bodyY - 4, 20, 16);
    ctx.fill();

    // Giáp vai khổng lồ
    ctx.fillStyle = '#fbbf24'; 
    ctx.beginPath(); ctx.arc(-10, bodyY - 2, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, bodyY - 2, 6, 0, Math.PI * 2); ctx.fill();

    // Đầu đội mũ trụ
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-9, headY - 12, 18, 16, 5) : ctx.fillRect(-9, headY - 12, 18, 16);
    ctx.fill();

    // Mắt sáng chói
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, headY - 6, 4, 3);
    ctx.fillRect(1, headY - 6, 4, 3);
    
    // Thánh giá trên mũ
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-1, headY - 14, 2, 6);
    ctx.fillRect(-3, headY - 12, 6, 2);

  } else if (classId === 'berserker') {
    // CUỒNG CHIẾN BINH (BERSERKER)
    ctx.save(); ctx.translate(-4, bodyY + 6); ctx.rotate(legLRot);
    ctx.fillStyle = '#78350f'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();
    ctx.save(); ctx.translate(4, bodyY + 6); ctx.rotate(legRRot);
    ctx.fillStyle = '#78350f'; ctx.fillRect(-3, 0, 6, 8); ctx.restore();

    // Thân trần, cơ bắp
    ctx.fillStyle = isHitFlash ? '#ffffff' : '#fca5a5';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-8, bodyY - 4, 16, 12, 2) : ctx.fillRect(-8, bodyY - 4, 16, 12);
    ctx.fill();

    // Sẹo chéo ngực
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-5, bodyY - 2); ctx.lineTo(5, bodyY + 6); ctx.stroke();
    
    // Quần thụng
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-9, bodyY + 6, 18, 4);

    // Đầu
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath(); ctx.arc(0, headY - 5, 8, 0, Math.PI * 2); ctx.fill();

    // Tóc rối đỏ
    ctx.fillStyle = '#9f1239';
    ctx.beginPath();
    ctx.moveTo(-10, headY - 4); ctx.lineTo(-6, headY - 14); ctx.lineTo(0, headY - 10); ctx.lineTo(6, headY - 16); ctx.lineTo(10, headY - 5);
    ctx.fill();

    // Đôi mắt điên dại
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, headY - 6, 3, 3); ctx.fillRect(1, headY - 6, 3, 3);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(-3, headY - 5, 1, 1); ctx.fillRect(2, headY - 5, 1, 1);

  } else if (classId === 'ninja') {
    // NHẪN GIẢ (NINJA)
    ctx.save(); ctx.translate(-3, bodyY + 6); ctx.rotate(legLRot);
    ctx.fillStyle = '#020617'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();
    ctx.save(); ctx.translate(3, bodyY + 6); ctx.rotate(legRRot);
    ctx.fillStyle = '#020617'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();

    // Áo ninja đen
    ctx.fillStyle = isHitFlash ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-6, bodyY - 4, 12, 12, 2) : ctx.fillRect(-6, bodyY - 4, 12, 12);
    ctx.fill();

    // Khăn quàng cổ lụa đỏ bay phấp phới
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    const scarfSway = Math.sin(phase * 0.01) * 6;
    ctx.moveTo(-4, bodyY - 4);
    ctx.quadraticCurveTo(-15, bodyY - 10 + scarfSway, -25, bodyY - 5 + scarfSway);
    ctx.quadraticCurveTo(-15, bodyY - 5 + scarfSway, -6, bodyY - 2);
    ctx.fill();

    // Đầu trùm kín
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(0, headY - 5, 7, 0, Math.PI * 2); ctx.fill();

    // Khe hở mắt
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(-5, headY - 7, 10, 4);

    // Mắt ninja sắc lẹm
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, headY - 6, 2, 2); ctx.fillRect(1, headY - 6, 2, 2);

  } else if (classId === 'summoner') {
    // TRIỆU HỒI SƯ (SUMMONER)
    // Áo dài rủ
    ctx.fillStyle = isHitFlash ? '#ffffff' : '#0d9488'; // Teal đậm
    ctx.beginPath();
    ctx.moveTo(0, bodyY - 4); 
    ctx.lineTo(10, bodyY + 12); 
    ctx.lineTo(-10, bodyY + 12); 
    ctx.fill();

    // Ngọc sáng giữa ngực
    ctx.fillStyle = '#5eead4';
    ctx.beginPath(); ctx.arc(0, bodyY + 2, 3, 0, Math.PI * 2); ctx.fill();

    // Đầu
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(0, headY - 5, 7, 0, Math.PI * 2); ctx.fill();

    // Tóc bồng bềnh
    ctx.fillStyle = '#115e59';
    ctx.beginPath(); ctx.arc(0, headY - 8, 8, Math.PI, 0); ctx.fill();

    // Phù hiệu ngọc bích trên trán
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(-1, headY - 9, 2, 3);

    // Mắt to tròn trong sáng
    ctx.fillStyle = '#000000';
    ctx.fillRect(-4, headY - 5, 3, 3); ctx.fillRect(1, headY - 5, 3, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, headY - 5, 1, 1); ctx.fillRect(2, headY - 5, 1, 1);

  } else {
    // CUNG THỦ (ARCHER) / DEFAULT
    ctx.save(); ctx.translate(-4, bodyY + 6); ctx.rotate(legLRot);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();
    ctx.save(); ctx.translate(4, bodyY + 6); ctx.rotate(legRRot);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(-2, 0, 4, 8); ctx.restore();

    ctx.fillStyle = isHitFlash ? '#ffffff' : '#15803d'; // Xanh rừng
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-6, bodyY - 4, 12, 12, 2) : ctx.fillRect(-6, bodyY - 4, 12, 12);
    ctx.fill();

    // Dây da chéo
    ctx.fillStyle = '#78350f'; ctx.fillRect(-6, bodyY + 2, 12, 3);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(-2, bodyY + 1, 4, 4);

    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-7, headY - 10, 14, 14, 3) : ctx.fillRect(-7, headY - 10, 14, 14);
    ctx.fill();

    // Mũ Peter Pan / Robin Hood
    ctx.fillStyle = '#166534';
    ctx.beginPath(); ctx.moveTo(-10, headY - 8); ctx.lineTo(10, headY - 8); ctx.lineTo(0, headY - 18); ctx.fill();
    // Lông chim đỏ
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(-2, headY - 18); ctx.quadraticCurveTo(-10, headY - 26, -5, headY - 20); ctx.fill();

    // Mắt
    ctx.fillStyle = '#111827'; ctx.fillRect(-4, headY - 6, 3, 3); ctx.fillRect(1, headY - 6, 3, 3);
  }

  // --- VẼ TAY PHẢI & VŨ KHÍ ---
  if (state !== 'dead') {
    ctx.save();
    ctx.translate(2, bodyY - 1);
    ctx.rotate(armRot);

    let armColor = '#4ade80';
    let handColor = '#fca5a5';
    if (classId === 'knight') { armColor = '#475569'; handColor = '#cbd5e1'; }
    else if (classId === 'rogue') { armColor = '#1e293b'; handColor = '#0f172a'; }
    else if (classId === 'mage') { armColor = '#4c1d95'; handColor = '#fca5a5'; }
    else if (classId === 'paladin') { armColor = '#ca8a04'; handColor = '#fde047'; }
    else if (classId === 'berserker') { armColor = '#78350f'; handColor = '#fca5a5'; }
    else if (classId === 'ninja') { armColor = '#020617'; handColor = '#fca5a5'; }
    else if (classId === 'summoner') { armColor = '#0d9488'; handColor = '#fef08a'; }
    else if (classId === 'archer') { armColor = '#15803d'; handColor = '#fca5a5'; }
    
    ctx.fillStyle = armColor;
    ctx.fillRect(-1, -1, 8, 4); // Cánh tay
    ctx.translate(8, 0);
    ctx.fillStyle = handColor; 
    ctx.fillRect(-2, -2, 4, 4); // Bàn tay

    if (weapon && state !== 'roll') {
      ctx.fillStyle = weapon.color || '#cbd5e1';
      ctx.rotate(Math.PI / 8);

      if (weapon.id === 'wooden_bow') {
        ctx.beginPath();
        ctx.arc(0, 0, 14, -Math.PI / 2, Math.PI / 2);
        ctx.strokeStyle = weapon.color || '#cbd5e1'; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -14);
        if (state === 'attack') { ctx.lineTo(-8, 0); } else { ctx.lineTo(0, 0); }
        ctx.lineTo(0, 14);
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
        if (state === 'attack') {
          ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-8, -1, 18, 2);
          ctx.fillStyle = '#ef4444'; ctx.fillRect(10, -2, 4, 4); 
        }
      } else if (weapon.id === 'magic_staff') {
        ctx.fillStyle = '#78350f'; ctx.fillRect(-2, -12, 4, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(0, -14, state === 'attack' ? 6 : 4, 0, Math.PI * 2); ctx.fill();
        if (state === 'attack') {
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -14, 3, 0, Math.PI * 2); ctx.fill();
        }
      } else if (weapon.type === 'melee') {
        ctx.fillRect(0, -12, 4, 24); 
        ctx.fillStyle = '#1e293b'; ctx.fillRect(-2, -2, 8, 4);
      } else {
        ctx.fillRect(0, -2, 14, 4); 
        ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 4, 6);
      }

      // Kỹ năng Dual Wield của Kỵ Sĩ
      if (isKnightSkill) {
        ctx.translate(0, 12);
        ctx.fillStyle = weapon.color || '#cbd5e1';
        if (weapon.type === 'melee') ctx.fillRect(0, -12, 4, 24);
        else ctx.fillRect(0, -2, 14, 4);
      }
    }
    ctx.restore();

    // VẼ TAY TRÁI & KHIÊN (HIỆP SĨ)
    if (classId === 'knight' && state !== 'roll') {
      ctx.save();
      ctx.translate(-6, bodyY);
      // Hiệu ứng khiên lấp lánh khi có giáp hoặc dùng skill
      ctx.fillStyle = isKnightSkill ? '#fbbf24' : '#64748b'; 
      ctx.fillRect(-1, -6, 4, 12); // Khiên sườn
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-2, -2, 6, 4); // Thập tự trên khiên
      ctx.restore();
    }

    // HIỆU ỨNG VẾT CHÉM KHÔNG GIAN
    if (state === 'attack' && weapon && weapon.type === 'melee' && weapon.id !== 'magic_staff') {
      const atkProgress = Math.min(1.0, (performance.now() - (player.lastAttackTime || 0)) / 200);
      if (atkProgress < 0.8) {
        ctx.save(); ctx.beginPath();
        ctx.arc(0, 0, 30, -Math.PI / 2 - 0.5, -Math.PI / 2 + atkProgress * Math.PI + 0.5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 4 * (1 - atkProgress); ctx.stroke();
        if (isKnightSkill) {
          ctx.beginPath(); ctx.arc(0, 15, 30, -Math.PI / 2 - 0.5, -Math.PI / 2 + atkProgress * Math.PI + 0.5);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)'; ctx.lineWidth = 4 * (1 - atkProgress); ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  // LỘN NHÀO (ROGUE)
  if (state === 'roll') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.beginPath(); ctx.arc(-10 * facing, 5, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; ctx.beginPath(); ctx.arc(-20 * facing, 5, 6, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}
