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

  let headY = -12;
  let bodyY = -4;
  let armRot = 0;
  let legLRot = 0;
  let legRRot = 0;

  // Hoạt ảnh di chuyển mượt mà (Bobbing & Swinging)
  if (state === 'walk') {
    const speedMult = 0.015;
    const bob = Math.sin(phase * speedMult);
    headY += bob * 1.5;
    bodyY += bob * 1.5;
    legLRot = Math.sin(phase * speedMult) * 0.6;
    legRRot = -Math.sin(phase * speedMult) * 0.6;
    armRot = Math.sin(phase * speedMult) * 0.3;
  } else if (state === 'idle') {
    const bob = Math.sin(phase * 0.003);
    headY += bob * 0.5;
    bodyY += bob * 0.5;
  } else if (state === 'roll') {
    ctx.rotate(phase * 0.04 * facing);
    headY = -4;
    bodyY = 0;
  }

  const atkProgress = Math.min(1.0, (performance.now() - (player.lastAttackTime || 0)) / 200);
  if (state === 'attack') {
    if (weapon && weapon.type === 'melee') {
      // Vung kiếm rộng hơn
      armRot = -Math.PI * 0.6 + atkProgress * Math.PI * 1.2; 
    } else {
      // Giật súng
      armRot = -0.2 + (atkProgress < 0.3 ? -0.2 : 0); 
    }
  }

  if (state === 'dead') {
    // Vũng máu lớn chân thực
    const bloodGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    bloodGrad.addColorStop(0, '#450a0a');
    bloodGrad.addColorStop(1, 'rgba(69, 10, 10, 0)');
    ctx.fillStyle = bloodGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 10, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.roundRect(-12, -4, 24, 10, 4); // Thân nằm ngang
    ctx.fill();
    ctx.restore();
    return;
  }

  // --- VẼ BÓNG ĐỔ DƯỚI CHÂN (DROP SHADOW) ---
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 10, 12, 4, 0, 0, Math.PI*2);
  ctx.fill();

  if (isHitFlash) color = '#ffffff';

  // --- CHÂN (LEGS WITH KNEES) ---
  const drawLeg = (offsetX: number, rot: number, isWalking: boolean) => {
    ctx.save();
    ctx.translate(offsetX, bodyY + 8);
    ctx.rotate(rot);
    
    // Đùi
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#27272a'; // Quần tối màu
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 7); // Độ dài đùi
    ctx.stroke();

    // Cẳng chân (gập lại khi chạy)
    let kneeRot = 0;
    if (isWalking) {
      // Khi chân đưa về phía sau, gập gối lên
      kneeRot = rot < 0 ? -rot * 1.5 : 0;
    }
    
    ctx.translate(0, 7);
    ctx.rotate(kneeRot);
    
    // Bắp chân và bàn chân
    ctx.strokeStyle = '#1c1917'; // Giày da / Giáp chân
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 7); // Cẳng chân
    ctx.lineTo(3, 7); // Mũi giày
    ctx.stroke();
    
    ctx.restore();
  };

  const isWalking = state === 'walk';
  drawLeg(-4, legLRot, isWalking);
  drawLeg(4, legRRot, isWalking);

  // --- VẼ THÂN VÀ ĐẦU THEO CLASS (REALISTIC) ---
  const drawBody = (gradColors: string[], armorStyle: 'cloth' | 'plate' | 'leather') => {
    const grad = ctx.createLinearGradient(0, bodyY - 6, 0, bodyY + 10);
    grad.addColorStop(0, gradColors[0]);
    grad.addColorStop(1, gradColors[1]);
    ctx.fillStyle = isHitFlash ? '#fff' : grad;
    
    ctx.beginPath();
    if (armorStyle === 'cloth') {
      // Áo choàng rộng
      ctx.moveTo(-10, bodyY - 6);
      ctx.lineTo(10, bodyY - 6);
      ctx.lineTo(12, bodyY + 12);
      ctx.lineTo(-12, bodyY + 12);
      ctx.fill();
      ctx.stroke();
    } else if (armorStyle === 'plate') {
      // Giáp bo tròn nặng nề
      ctx.roundRect(-10, bodyY - 6, 20, 16, 4);
      ctx.fill();
      ctx.stroke();
      // Đai kim loại giữa ngực
      ctx.fillStyle = '#71717a';
      ctx.fillRect(-10, bodyY, 20, 4);
    } else {
      // Da bó sát
      ctx.roundRect(-8, bodyY - 5, 16, 14, 3);
      ctx.fill();
      ctx.stroke();
    }
  };

  const drawHead = (hoodColor: string | null, skinColor: string, eyeColor: string) => {
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, headY, 7, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    if (hoodColor) {
      ctx.fillStyle = hoodColor;
      ctx.beginPath();
      ctx.arc(0, headY - 1, 8, Math.PI, 0); // Mũ trùm che nửa đầu
      ctx.fill();
      ctx.stroke();
      
      // Bóng mũ đổ xuống mặt
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(0, headY, 7, Math.PI, 0);
      ctx.fill();
    }

    // Mắt
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(-3, headY + 1, 1.5, 0, Math.PI*2);
    ctx.arc(3, headY + 1, 1.5, 0, Math.PI*2);
    ctx.fill();
  };

  if (classId === 'mage') {
    drawBody(['#3b0764', '#171717'], 'cloth');
    drawHead('#1c1917', '#e5e5e5', '#a855f7');
    // Runes xoay quanh đầu
    ctx.fillStyle = '#c084fc';
    const runeAngle = performance.now() / 500;
    ctx.beginPath(); ctx.arc(Math.cos(runeAngle) * 12, headY + Math.sin(runeAngle) * 4, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(Math.cos(runeAngle + Math.PI) * 12, headY + Math.sin(runeAngle + Math.PI) * 4, 1.5, 0, Math.PI*2); ctx.fill();
  } else if (classId === 'knight') {
    // Áo choàng đỏ rách nát phía sau
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath(); ctx.moveTo(-6, bodyY); ctx.lineTo(-14, bodyY + 15 + Math.sin(phase/20)*3); ctx.lineTo(-4, bodyY + 12); ctx.fill();
    
    drawBody(['#52525b', '#27272a'], 'plate');
    // Mũ sắt kín đầu
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.roundRect(-8, headY - 8, 16, 16, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000'; // Khe nhìn hình T
    ctx.fillRect(-2, headY - 4, 4, 10);
    ctx.fillRect(-6, headY - 2, 12, 3);
    // Lông vũ cắm trên mũ
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, headY - 8); ctx.quadraticCurveTo(-5, headY - 15, -8, headY - 12); ctx.stroke();
  } else if (classId === 'rogue') {
    drawBody(['#451a03', '#1c1917'], 'leather');
    drawHead('#292524', color, '#000');
    // Khăn che miệng đỏ máu
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-6, headY + 3, 12, 4);
    // Khăn quàng cổ bay phấp phới
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, headY + 5); ctx.lineTo(-15 + Math.sin(phase/15)*4, headY + 8); ctx.stroke();
  } else if (classId === 'archer') {
    drawBody(['#14532d', '#064e3b'], 'leather');
    drawHead('#064e3b', color, '#fde047');
    // Mũ trùm lá
    ctx.fillStyle = '#166534';
    ctx.beginPath(); ctx.moveTo(0, headY - 8); ctx.lineTo(-6, headY); ctx.lineTo(8, headY); ctx.fill();
  } else if (classId === 'summoner') {
    drawBody(['#7f1d1d', '#450a0a'], 'cloth');
    drawHead(null, '#fca5a5', '#000');
    // Ấn máu trên trán phát sáng
    ctx.shadowBlur = 5; ctx.shadowColor = '#dc2626';
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-1, headY - 4, 2, 4);
    ctx.fillRect(-2, headY - 3, 4, 2);
    ctx.shadowBlur = 0;
  } else if (classId === 'paladin') {
    drawBody(['#ca8a04', '#713f12'], 'plate');
    // Mũ chóp có hào quang
    ctx.shadowBlur = 10; ctx.shadowColor = '#fef08a';
    ctx.fillStyle = '#854d0e';
    ctx.beginPath(); ctx.moveTo(-6, headY+2); ctx.lineTo(6, headY+2); ctx.lineTo(0, headY-10); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (classId === 'berserker') {
  } else if (classId === 'berserker') {
    // Chainsaw Man (Public Safety Uniform - Thon gọn)
    
    // Áo sơ mi trắng (Slim)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-4, bodyY - 6); ctx.lineTo(4, bodyY - 6); // Vai hẹp
    ctx.lineTo(3, bodyY + 5); ctx.lineTo(-3, bodyY + 5); // Eo thon
    ctx.fill(); ctx.stroke();
    
    // Cà vạt đen thon dài
    ctx.fillStyle = '#171717';
    ctx.beginPath(); ctx.moveTo(-1, bodyY-5); ctx.lineTo(1, bodyY-5); ctx.lineTo(0.5, bodyY+5); ctx.lineTo(-0.5, bodyY+5); ctx.fill();
    
    // Quần đen bó sát (Slim pants)
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-3, bodyY+5); ctx.lineTo(3, bodyY+5);
    ctx.lineTo(4, bodyY+12); ctx.lineTo(-4, bodyY+12);
    ctx.fill(); ctx.stroke();

    // Máu văng trên áo trắng
    ctx.fillStyle = '#991b1b';
    ctx.beginPath(); ctx.arc(-2, bodyY, 1.5, 0, Math.PI*2); ctx.arc(1, bodyY+2, 1, 0, Math.PI*2); ctx.fill();

    // Đầu cưa máy (Chainsaw Head) với điểm nhấn màu cam/đỏ
    ctx.fillStyle = '#ea580c'; // Cam/Đỏ của Chainsaw
    ctx.beginPath(); ctx.roundRect(-5, headY-6, 10, 10, 2); ctx.fill();
    ctx.fillStyle = '#292524'; // Phần kim loại tối
    ctx.beginPath(); ctx.roundRect(-3, headY-3, 10, 8, 2); ctx.fill();

    // Hàm dưới bằng kim loại thu gọn
    ctx.fillStyle = '#52525b';
    ctx.beginPath(); ctx.moveTo(-4, headY+2); ctx.lineTo(4, headY+2); ctx.lineTo(3, headY-1); ctx.lineTo(-4, headY-1); ctx.fill();
    // Răng nanh sắt nhọn
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-3, headY+2); ctx.lineTo(3, headY+2); ctx.lineTo(2, headY+4); ctx.lineTo(-2, headY+4); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-3, headY+2); ctx.lineTo(-3, headY+5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, headY+2); ctx.lineTo(0, headY+5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3, headY+2); ctx.lineTo(3, headY+5); ctx.stroke();

    // Lưỡi cưa nhô ra từ giữa mặt
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(4, headY-5, 16, 4); // Lưỡi cưa dài
    // Răng cưa máy trên đầu
    ctx.fillStyle = '#1c1917';
    for (let i=0; i<3; i++) {
      ctx.beginPath(); ctx.moveTo(6 + i*5, -5 + headY); ctx.lineTo(8 + i*5, -7 + headY); ctx.lineTo(10 + i*5, -5 + headY); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6 + i*5, -1 + headY); ctx.lineTo(8 + i*5, 1 + headY); ctx.lineTo(10 + i*5, -1 + headY); ctx.fill();
    }
    // Máu trên lưỡi cưa
    ctx.fillStyle = '#991b1b'; ctx.fillRect(12, headY-5, 6, 2);

    // Mắt rỗng / khe hở
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(1, headY-1, 1.5, 0, Math.PI*2); ctx.fill();

  } else if (classId === 'ninja') {
    drawBody(['#171717', '#0a0a0a'], 'cloth');
    drawHead('#0a0a0a', color, '#ef4444');
    // Khăn quàng cổ đen bay
    ctx.strokeStyle = '#171717'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, headY + 5); ctx.lineTo(-18 + Math.sin(phase/10)*5, headY + 9); ctx.stroke();
    // Băng trán kim loại
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(-6, headY - 5, 12, 3);
  } else if (classId === 'bomb_devil') {
    // Reze (Bomb Devil) - Slim Pixel Art Style
    
    // Body váy đen xòe cực nhẹ (thon thả)
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.moveTo(-4, bodyY+2); ctx.lineTo(4, bodyY+2); 
    ctx.lineTo(5, bodyY+12); ctx.lineTo(-5, bodyY+12);
    ctx.fill(); ctx.stroke();
    
    // Áo trắng phần trên ngực (Thon gầy)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-4, bodyY-5); ctx.lineTo(4, bodyY-5); ctx.lineTo(3, bodyY+2); ctx.lineTo(-3, bodyY+2); ctx.fill(); ctx.stroke();
    
    // Nơ trắng viền đen ở cổ áo
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, bodyY-5); ctx.lineTo(-2, bodyY-3); ctx.lineTo(-0.5, bodyY-1); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, bodyY-5); ctx.lineTo(2, bodyY-3); ctx.lineTo(0.5, bodyY-1); ctx.fill(); ctx.stroke();

    // Dải yếm sọc caro (Checkered apron) treo dài xuống
    ctx.fillStyle = '#27272a'; // Nền xám đen
    ctx.fillRect(-2, bodyY+2, 4, 18); // Nhỏ lại, dài xuống
    ctx.fillStyle = '#09090b'; // Sọc ngang caro
    for(let i=0; i<4; i++) {
      ctx.fillRect(-2, bodyY+4 + i*4, 4, 2);
    }
    // Sọc dọc caro
    ctx.fillRect(-0.5, bodyY+2, 1, 18);

    // Đầu Quỷ Boom - Torpedo nhỏ gọn
    ctx.fillStyle = '#171717'; // Xám đen nhám
    ctx.beginPath();
    ctx.moveTo(-3, headY+2);
    ctx.quadraticCurveTo(-10, headY-4, -6, headY-10); // Phần gáy cong
    ctx.quadraticCurveTo(2, headY-12, 8, headY-3); // Phần chóp mũi cong ra trước
    ctx.lineTo(6, headY+2);
    ctx.fill();
    ctx.stroke();

    // Ngòi nổ chùm trên gáy (Như búi tóc)
    ctx.fillStyle = '#27272a';
    ctx.beginPath(); ctx.arc(-6, headY-6, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-4, headY-10, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-1, headY-12, 2, 0, Math.PI*2); ctx.fill();

    // Khe miệng trắng rực (Slit)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(1, headY); ctx.lineTo(6, headY-1); ctx.lineTo(5, headY+1); ctx.lineTo(2, headY+1); ctx.fill();

    // Mắt trắng rực (Slit)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(3, headY-3); ctx.lineTo(6, headY-4); ctx.lineTo(5, headY-2); ctx.fill();
    
    // Tia lửa bùng nổ nhỏ ở cổ
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(-3, headY+1, 1.5, 0, Math.PI*2); ctx.fill();
  } else {
    // Default
    drawBody(['#09090b', '#000'], 'cloth');
    drawHead('#000', color, '#ef4444');
  }

  // --- VẼ TAY & VŨ KHÍ (REALISTIC) ---
  ctx.save();
  ctx.translate(0, bodyY);
  ctx.rotate(armRot);

  // Tay cầm vũ khí (Tay phải)
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-3, -3, 10, 6, 3); ctx.fill(); ctx.stroke();

  if (classId === 'berserker') {
    // Cánh tay áo sơ mi trắng cuộn lên
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, -2, 6, 4);
    
    // Chainsaw Arm mỏng hơn
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#292524';
    ctx.fillRect(4, -4, 16, 4); // Thân cưa ở tay
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(8, -3, 18, 2); // Lưỡi cưa
    // Răng cưa
    ctx.fillStyle = '#1c1917';
    for (let i=0; i<3; i++) {
      ctx.beginPath(); ctx.moveTo(10 + i*5, -3); ctx.lineTo(12 + i*5, -5); ctx.lineTo(14 + i*5, -3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(10 + i*5, -1); ctx.lineTo(12 + i*5, 1); ctx.lineTo(14 + i*5, -1); ctx.fill();
    }
  } else if (classId === 'bomb_devil') {
    // Tay đen kịt thon gọn
    ctx.fillStyle = '#171717';
    ctx.beginPath(); ctx.roundRect(-2, -2, 10, 4, 2); ctx.fill();
    // Gai nhọn nhỏ mọc trên tay
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(3, -4); ctx.lineTo(5, -2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(5, 4); ctx.lineTo(7, 2); ctx.fill();
  } else if (weapon) {
    ctx.translate(8, 0); // Vị trí vũ khí
    ctx.fillStyle = weapon.color || '#94a3b8';
    
    if (weapon.id === 'kunai') {
      // Kunai
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(3, -12); ctx.lineTo(0, -20); ctx.lineTo(-3, -12); ctx.fill();
      ctx.fillStyle = '#1c1917'; ctx.fillRect(-1, 0, 2, -6);
      ctx.beginPath(); ctx.arc(0, 2, 2, 0, Math.PI*2); ctx.stroke();
    } else if (weapon.id === 'holy_mace' || weapon.id === 'heavy_axe') {
      // Vũ khí hạng nặng (Búa/Rìu)
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#78350f'; ctx.fillRect(-2, -18, 4, 22); // Cán gỗ dài
      ctx.fillStyle = weapon.color || '#ffffff';
      if (weapon.id === 'holy_mace') {
        ctx.shadowBlur = 10; ctx.shadowColor = weapon.color || '#ffffff';
        ctx.beginPath(); ctx.arc(0, -20, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Rìu
        ctx.beginPath(); ctx.moveTo(2, -15); ctx.lineTo(12, -22); ctx.lineTo(12, -8); ctx.fill();
      }
    } else if (weapon.id === 'blood_grimoire') {
      // Sách ma thuật
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-6, -8, 12, 16);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-4, -6, 8, 12);
      ctx.fillStyle = '#991b1b'; // Ký tự máu
      ctx.fillRect(-2, -4, 4, 2);
      ctx.fillRect(-2, 0, 4, 2);
    } else if (weapon.id === 'bomb_detonator') {
      // Kíp nổ Reze
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-3, -6, 6, 12); // Hộp
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -8, 4, 2); // Nút bấm
      if (atkProgress < 0.2) { // Bấm nút
        ctx.fillStyle = '#fca5a5'; ctx.fillRect(-2, -7, 4, 1);
      }
    } else if (weapon.type === 'melee') {
      ctx.rotate(-Math.PI / 4);
      // Kiếm dài, có độ vát (Lưỡi kiếm sáng)
      const bladeGrad = ctx.createLinearGradient(-2, 0, 2, 0);
      bladeGrad.addColorStop(0, '#cbd5e1');
      bladeGrad.addColorStop(0.5, '#f8fafc');
      bladeGrad.addColorStop(1, '#64748b');
      
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(-2, 0);
      ctx.lineTo(-4, -22); // Gốc
      ctx.lineTo(0, -28);  // Mũi nhọn
      ctx.lineTo(4, -22);
      ctx.lineTo(2, 0);
      ctx.fill();
      ctx.stroke();

      // Rãnh giữa kiếm
      ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22); ctx.stroke();

      // Chuôi và Tsuba (chặn kiếm)
      ctx.fillStyle = '#b45309'; ctx.fillRect(-3, 0, 6, 6);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-6, -2, 12, 2);
    } else if (weapon.id === 'magic_staff') {
      // Gậy phép thuật
      ctx.fillStyle = '#451a03'; // Gỗ
      ctx.fillRect(-2, -4, 4, 24);
      // Ngọc phát sáng
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#d8b4fe';
      ctx.beginPath(); ctx.arc(0, -6, 5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Súng/Cung chi tiết hơn
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-2, 0, 6, 8);  // Tay cầm
      ctx.fillStyle = '#52525b';
      ctx.fillRect(0, -4, 16, 6); // Nòng
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(16, -3, 4, 4); // Đầu nòng
    }
  }
  ctx.restore();

  // Tay trái (nếu có dùng skill Knight)
  if (isKnightSkill && weapon) {
    ctx.save();
    ctx.translate(0, bodyY);
    ctx.rotate(armRot + Math.PI); // Vung tay ngược lại
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-3, -3, 10, 6, 3); ctx.fill(); ctx.stroke();

    ctx.translate(8, 0);
    ctx.fillStyle = weapon.color || '#94a3b8';
    if (weapon.type === 'melee') {
      ctx.rotate(-Math.PI / 4);
      ctx.fillRect(-2, -22, 4, 22);
      ctx.fillStyle = '#451a03'; ctx.fillRect(-3, 0, 6, 6);
    } else {
      ctx.fillRect(0, -4, 16, 6);
      ctx.fillStyle = '#1c1917'; ctx.fillRect(-2, 0, 6, 8);
    }
    ctx.restore();
  } else {
    // Tay trái vung vẩy khi đi
    ctx.save();
    ctx.translate(-5, bodyY);
    ctx.rotate(-armRot);
    if (classId === 'berserker') {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -2, 6, 4); // Áo sơ mi trắng
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#292524'; ctx.fillRect(4, -4, 16, 4);
      ctx.fillStyle = '#d4d4d8'; ctx.fillRect(8, -3, 18, 2);
      ctx.fillStyle = '#1c1917';
      for (let i=0; i<3; i++) {
        ctx.beginPath(); ctx.moveTo(10 + i*5, -3); ctx.lineTo(12 + i*5, -5); ctx.lineTo(14 + i*5, -3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10 + i*5, -1); ctx.lineTo(12 + i*5, 1); ctx.lineTo(14 + i*5, -1); ctx.fill();
      }
    } else if (classId === 'bomb_devil') {
      ctx.fillStyle = '#171717';
      ctx.beginPath(); ctx.roundRect(-2, -2, 10, 4, 2); ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.moveTo(2, -2); ctx.lineTo(3, -4); ctx.lineTo(5, -2); ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(-4, -3, 8, 6, 3); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();
}
