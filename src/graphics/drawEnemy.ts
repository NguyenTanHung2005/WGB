import type { Entity } from '../types/interfaces';

// === PIXEL ART HELPER ===
function px(ctx: CanvasRenderingContext2D, x: number, y: number, s: number = 2) {
  ctx.fillRect(x, y, s, s);
}
function pxRow(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, s: number = 2) {
  ctx.fillRect(x, y, s * count, s);
}
function pxCol(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, s: number = 2) {
  ctx.fillRect(x, y, s, s * count);
}

export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Entity, bounce: number, isStunned: boolean) {
  const time = performance.now();
  const S = 2;
  
  ctx.save();
  ctx.rotate(enemy.angle);

  let renderColor = isStunned ? '#67e8f9' : (enemy.color || '#ef4444');
  if (enemy.dashState === 'warning') {
    renderColor = Math.floor(time / 100) % 2 === 0 ? '#fff' : '#ef4444';
  }

  const tId = enemy.templateId;
  const r = enemy.radius;
  
  let isHandled = false;

  // ========== 1. DUNGEON ==========
  if (tId === 'melee_goblin') {
    const breath = Math.sin(time / 200) * 1.5;
    // Thân goblin xanh pixel
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-6, bounce - r + 2, 12, r * 1.5 + breath);
    // Áo rách tả tơi
    ctx.fillStyle = '#0f3520';
    pxCol(ctx, -4, bounce - r + 4, 5, S);
    pxCol(ctx, 2, bounce - r + 4, 5, S);
    // Đai lưng
    ctx.fillStyle = '#78350f';
    pxRow(ctx, -6, bounce, 6, S);
    // Đầu goblin to, tai nhọn
    ctx.fillStyle = '#57534e';
    ctx.fillRect(-5, bounce - r - 4 - breath, 10, 8);
    // Tai nhọn pixel
    ctx.fillStyle = '#78716c';
    px(ctx, -7, bounce - r - 2 - breath, S);
    px(ctx, -9, bounce - r - 4 - breath, S);
    px(ctx, 7, bounce - r - 2 - breath, S);
    px(ctx, 9, bounce - r - 4 - breath, S);
    // Mắt đỏ phát sáng
    ctx.fillStyle = '#dc2626';
    ctx.shadowBlur = 4; ctx.shadowColor = '#dc2626';
    px(ctx, -3, bounce - r - 2 - breath, S);
    px(ctx, 1, bounce - r - 2 - breath, S);
    ctx.shadowBlur = 0;
    // Miệng
    ctx.fillStyle = '#000';
    pxRow(ctx, -2, bounce - r - breath, 2, S);
    // Vũ khí (dao ngắn pixel)
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.fillStyle = '#78716c';
      ctx.fillRect(6, bounce - 2 - breath, 3, 2);
      ctx.fillStyle = '#a1a1aa';
      ctx.fillRect(9, bounce - 4 - breath, 2, 6);
    }
    isHandled = true;

  } else if (tId === 'ranged_skeleton' || tId === 'melee_skeleton') {
    const breath = Math.sin(time / 150) * 1.5;
    // Xương sống pixel
    ctx.fillStyle = '#e4e4e7';
    pxCol(ctx, -1, bounce - r + 2, Math.floor(r * 0.9) + breath, S);
    pxCol(ctx, 1, bounce - r + 2, Math.floor(r * 0.9) + breath, S);
    // Xương sườn pixel
    ctx.fillStyle = '#d4d4d8';
    pxRow(ctx, -6 - breath, bounce - r * 0.2, 6 + breath, S);
    pxRow(ctx, -5, bounce + 2, 5, S);
    // Xương chậu
    pxRow(ctx, -4, bounce + r * 0.5, 4, S);
    // Chân xương
    ctx.fillStyle = '#a1a1aa';
    pxCol(ctx, -3, bounce + r * 0.6, 3, S);
    pxCol(ctx, 3, bounce + r * 0.6, 3, S);
    
    // Đầu lâu pixel art chi tiết
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(-5, bounce - r - 4 - breath, 10, 8);
    // Hốc mắt đen
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, bounce - r - 2 - breath, 3, 3);
    ctx.fillRect(1, bounce - r - 2 - breath, 3, 3);
    // Mắt xanh phát sáng pixel
    ctx.fillStyle = '#3b82f6';
    ctx.shadowBlur = 4; ctx.shadowColor = '#60a5fa';
    px(ctx, -3, bounce - r - 1 - breath, S);
    px(ctx, 2, bounce - r - 1 - breath, S);
    ctx.shadowBlur = 0;
    // Mũi (tam giác pixel)
    ctx.fillStyle = '#000';
    px(ctx, -1, bounce - r + 1 - breath, 1);
    px(ctx, 0, bounce - r + 1 - breath, 1);
    // Hàm răng
    ctx.fillStyle = '#e4e4e7';
    for (let i = 0; i < 4; i++) {
      px(ctx, -4 + i * 2, bounce - r + 3 - breath, S);
    }
    
    // Vũ khí
    if (!enemy.missingLimbs?.includes('arm')) {
      if (tId === 'ranged_skeleton') {
        // Cung pixel
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(8, bounce - breath, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.fillStyle = '#a1a1aa';
        ctx.fillRect(8, bounce - 6 - breath, 1, 12);
      } else {
        // Kiếm ngắn pixel
        ctx.fillStyle = '#a1a1aa';
        ctx.fillRect(6, bounce - 6 - breath, 2, 14);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(5, bounce + 4 - breath, 4, 3);
      }
    }
    isHandled = true;

  } else if (tId === 'necromancer') {
    const breath = Math.sin(time / 250) * 2;
    // Áo choàng tím pixel
    ctx.fillStyle = '#6b21a8';
    ctx.fillRect(-7, bounce - r + 2, 14, r * 1.8 + breath);
    // Nếp áo tối
    ctx.fillStyle = '#4c1d95';
    pxCol(ctx, -5, bounce - r + 4, 7, S);
    pxCol(ctx, 3, bounce - r + 4, 7, S);
    // Ký hiệu arcane trên áo pixel
    ctx.fillStyle = '#a855f7';
    pxCol(ctx, -1, bounce - r + 6, 4, S);
    pxCol(ctx, 1, bounce - r + 6, 4, S);
    pxRow(ctx, -3, bounce - r + 10, 3, S);

    // Đầu mũ trùm pixel
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-6, bounce - r - 4 - breath, 12, 8);
    ctx.beginPath();
    ctx.moveTo(-6, bounce - r - 4 - breath);
    ctx.lineTo(0, bounce - r - 10 - breath);
    ctx.lineTo(6, bounce - r - 4 - breath);
    ctx.fill();
    // Mặt tối
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, bounce - r - breath, 8, 4);
    // Mắt tím sáng
    ctx.fillStyle = '#f3e8ff';
    ctx.shadowBlur = 8; ctx.shadowColor = '#d8b4fe';
    px(ctx, -3, bounce - r + 1 - breath, S);
    px(ctx, 1, bounce - r + 1 - breath, S);
    ctx.shadowBlur = 0;
    
    // Gậy ma thuật pixel
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(7, bounce - r * 0.8 - breath, 2, r * 2);
      // Orb phát sáng trên gậy
      ctx.fillStyle = '#c084fc';
      ctx.shadowBlur = 12; ctx.shadowColor = '#c084fc';
      ctx.beginPath(); ctx.arc(8, bounce - r * 0.8 - breath - 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(7, bounce - r * 0.8 - breath - 3, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    isHandled = true;

  } else if (tId === 'the_fallen_king') {
    const breath = Math.sin(time / 200) * 2;
    const glitch = Math.random() > 0.9 ? Math.random() * 8 - 4 : 0;
    
    // Hào quang bóng tối rung giật
    const darkAura = ctx.createRadialGradient(0, bounce, 0, 0, bounce, r * 2.5);
    darkAura.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    darkAura.addColorStop(0.5, 'rgba(17, 24, 39, 0.4)');
    darkAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = darkAura;
    ctx.beginPath(); ctx.arc(glitch, bounce + glitch, r * 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(glitch, glitch); // Erratic movement

    // Giáp nặng pixel mục nát, xương sườn chọc thủng
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-r * 0.4, bounce - r + 2, r * 0.8, r * 1.8);
    ctx.fillStyle = '#3f3f46';
    pxCol(ctx, -r * 0.3, bounce - r + 4, Math.floor(r * 0.4), S);
    // Xương sườn nhô ra
    ctx.fillStyle = '#d4d4d8';
    for(let i=0; i<3; i++) {
      pxRow(ctx, -r * 0.5, bounce - r * 0.5 + i * 10, Math.floor(r * 0.2), S);
      pxRow(ctx, r * 0.1, bounce - r * 0.5 + i * 10, Math.floor(r * 0.2), S);
    }
    
    // Cape đỏ tơi tả rách rưới
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, bounce - r + 2);
    ctx.lineTo(-r * 0.8, bounce + r * 1.5 + Math.sin(time / 100) * 10);
    ctx.lineTo(-r * 0.5, bounce + r);
    ctx.lineTo(-r * 0.3, bounce + r * 1.2 + Math.sin(time / 150) * 5);
    ctx.lineTo(-r * 0.1, bounce + r * 0.8);
    ctx.fill();
    
    // Đầu lâu khổng lồ vỡ nát, mất hàm dưới
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-r * 0.3, bounce - r - 15 - breath, r * 0.6, 20);
    // Vương miện vàng gãy
    ctx.fillStyle = '#ca8a04';
    pxRow(ctx, -r * 0.35, bounce - r - 20 - breath, Math.floor(r * 0.35), S);
    px(ctx, -r * 0.35, bounce - r - 25 - breath, 4);
    px(ctx, -r * 0.1, bounce - r - 22 - breath, 3);
    px(ctx, r * 0.2, bounce - r - 28 - breath, 5);
    // Hốc mắt đen sâu hoắm
    ctx.fillStyle = '#000';
    ctx.fillRect(-r * 0.2, bounce - r - 10 - breath, 8, 8);
    ctx.fillRect(r * 0.05, bounce - r - 10 - breath, 8, 8);
    // Dấu chấm đỏ điên dại trong hốc mắt
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 15; ctx.shadowColor = '#dc2626';
    const eyeGlitchX = Math.random() * 2 - 1;
    const eyeGlitchY = Math.random() * 2 - 1;
    px(ctx, -r * 0.15 + eyeGlitchX, bounce - r - 8 - breath + eyeGlitchY, 3);
    px(ctx, r * 0.1 + eyeGlitchX, bounce - r - 8 - breath + eyeGlitchY, 3);
    ctx.shadowBlur = 0;
    
    // Đại kiếm rỉ sét khổng lồ lết dưới đất
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.save();
      ctx.translate(r * 0.6, bounce + r * 0.5);
      ctx.rotate(-Math.PI / 4 + Math.sin(time / 200) * 0.1); // Kéo lê nặng nề
      // Lưỡi kiếm rỉ sét và nứt nẻ
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(-8, -r * 1.5, 16, r * 2.5);
      ctx.fillStyle = '#78350f'; // Rỉ sét
      px(ctx, -6, -r, 5); px(ctx, 0, -r * 0.5, 4); px(ctx, -4, 0, 6);
      ctx.fillStyle = '#000'; // Vết nứt
      pxRow(ctx, -8, -r * 0.8, 4, S);
      // Chuôi
      ctx.fillStyle = '#1c1917'; ctx.fillRect(-12, -r * 1.5, 24, 6);
      // Tia lửa lê đất (nếu đang đi)
      if (enemy.vx !== 0 || enemy.vy !== 0) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowBlur = 10; ctx.shadowColor = '#f59e0b';
        for(let i=0; i<3; i++) {
          px(ctx, 4 + Math.random()*10, r - Math.random()*15, Math.random()*3 + 1);
        }
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
    ctx.restore();
    isHandled = true;
  }

  // ========== 2. VOLCANO ==========
  else if (tId === 'fire_slime') {
    const breath = Math.sin(time / 120) * 2;
    const drip = Math.sin(time / 150) * 4;
    // Slime lửa pixel — giọt nhầy hình phễu
    const slimeGrad = ctx.createRadialGradient(0, bounce - r * 0.3, 2, 0, bounce, r * 1.2);
    slimeGrad.addColorStop(0, '#fef08a');
    slimeGrad.addColorStop(0.4, '#f97316');
    slimeGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = isStunned ? '#67e8f9' : slimeGrad;
    // Dạng pixel blob
    ctx.fillRect(-r + 2, bounce - 2, r * 2 - 4, r * 0.8 + drip);
    ctx.fillRect(-r + 4, bounce - r * 0.6 - breath, r * 2 - 8, r * 0.6);
    ctx.fillRect(-r + 6, bounce - r - breath, r * 2 - 12, 4);
    // Highlight sáng
    ctx.fillStyle = '#fef08a';
    px(ctx, -r + 6, bounce - r + 2 - breath, 3);
    // Mắt pixel
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 4; ctx.shadowColor = '#fef08a';
    px(ctx, -3, bounce - 4 - breath / 2, 3);
    px(ctx, 3, bounce - 4 - breath / 2, 3);
    ctx.shadowBlur = 0;
    // Giọt nhầy lửa rỏ xuống pixel
    ctx.fillStyle = '#f97316';
    px(ctx, -4, bounce + r * 0.4 + drip, S);
    px(ctx, 2, bounce + r * 0.3 + drip + 2, S);
    isHandled = true;

  } else if (tId === 'lava_golem') {
    const breath = Math.sin(time / 180) * 1.5;
    // Thân golem đá pixel khối to
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-8, bounce - r, 16, r * 2 + breath);
    // Vai rộng
    ctx.fillRect(-10, bounce - r, 4, 6);
    ctx.fillRect(6, bounce - r, 4, 6);
    // Vết nứt dung nham pixel (phát sáng)
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 8; ctx.shadowColor = '#f97316';
    pxCol(ctx, -4, bounce - r * 0.5 - breath, 4, S);
    pxCol(ctx, 2, bounce - r * 0.3, 3, S);
    px(ctx, -2, bounce, S); px(ctx, 0, bounce + 4, S);
    ctx.shadowBlur = 0;
    // Mắt dung nham
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 6; ctx.shadowColor = '#f97316';
    px(ctx, -5, bounce - r + 4, 3);
    px(ctx, 3, bounce - r + 4, 3);
    ctx.shadowBlur = 0;
    // Tay đá
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.fillStyle = '#292524';
      ctx.fillRect(10, bounce - 4 - breath, 10, 6 + breath);
      ctx.fillStyle = '#ef4444';
      ctx.shadowBlur = 4; ctx.shadowColor = '#ef4444';
      ctx.fillRect(18, bounce - 6 - breath, 4, 10 + breath);
      ctx.shadowBlur = 0;
    }
    isHandled = true;

  } else if (tId === 'hellhound') {
    const breath = Math.sin(time / 100) * 1.5;
    const legRun = Math.sin(time / 80) * 3;
    // Thân chó pixel nằm ngang
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-r + 2, bounce - 4, r * 2 - 4, 8 + breath);
    // Đầu chó pixel
    ctx.fillStyle = '#18181b';
    ctx.fillRect(r - 6, bounce - 8 - breath, 10, 10);
    // Tai nhọn
    px(ctx, r - 4, bounce - 10 - breath, S);
    px(ctx, r, bounce - 10 - breath, S);
    // Mắt lửa
    ctx.fillStyle = '#f97316';
    ctx.shadowBlur = 6; ctx.shadowColor = '#f97316';
    px(ctx, r - 2, bounce - 6 - breath, S);
    px(ctx, r + 2, bounce - 6 - breath, S);
    ctx.shadowBlur = 0;
    // Miệng
    ctx.fillStyle = '#ef4444';
    pxRow(ctx, r - 2, bounce - 2 - breath, 3, S);
    // Chân pixel (4 chân)
    ctx.fillStyle = '#1c1917';
    pxCol(ctx, -r + 4, bounce + 4, 3 + legRun, S);
    pxCol(ctx, -r + 8, bounce + 4, 3 - legRun, S);
    pxCol(ctx, r - 6, bounce + 4, 3 - legRun, S);
    pxCol(ctx, r - 2, bounce + 4, 3 + legRun, S);
    // Đuôi pixel
    ctx.fillStyle = '#0a0a0a';
    px(ctx, -r, bounce - 2, S);
    px(ctx, -r - 2, bounce - 4, S);
    isHandled = true;

  } else if (tId === 'fire_dragon') {
    const flap = Math.sin(time / 150);
    const tailWhip = Math.sin(time / 200) * 20;
    
    if (enemy.angle === undefined && (enemy.vx !== 0 || enemy.vy !== 0)) {
      ctx.rotate(Math.atan2(enemy.vy, enemy.vx) + Math.PI / 2);
    } else if (enemy.angle === undefined) {
      ctx.rotate(Math.PI);
    }

    // Heat distortion (sóng nhiệt rung bần bật)
    const heat = Math.random() > 0.5 ? Math.random() * 6 - 3 : 0;
    ctx.save();
    ctx.translate(heat, heat);

    // Hào quang rực lửa khổng lồ
    const dragonAura = ctx.createRadialGradient(0, bounce, r * 0.5, 0, bounce, r * 2.5);
    dragonAura.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    dragonAura.addColorStop(0.4, 'rgba(249, 115, 22, 0.3)');
    dragonAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = dragonAura;
    ctx.beginPath(); ctx.arc(0, bounce, r * 2.5, 0, Math.PI * 2); ctx.fill();

    // Đuôi xương xẩu
    ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, bounce + r * 0.5);
    ctx.quadraticCurveTo(tailWhip, bounce + r * 1.5, tailWhip * 1.5, bounce + r * 2.5);
    ctx.stroke();
    // Gai trên đuôi
    ctx.fillStyle = '#1c1917';
    for(let i=0; i<5; i++) {
      px(ctx, tailWhip * (i/5), bounce + r * (0.5 + i*0.4), 6);
    }

    // Cánh khổng lồ rách rưới thây ma
    ctx.fillStyle = '#7f1d1d';
    // Cánh trái
    ctx.beginPath();
    ctx.moveTo(-10, bounce);
    ctx.quadraticCurveTo(-r * 1.5, bounce - r * 0.5 + flap * 30, -r * 3, bounce - r * 0.8 + flap * 50);
    ctx.lineTo(-r * 2.8, bounce - r * 0.2 + flap * 40); // Lỗ rách
    ctx.lineTo(-r * 3.5, bounce + flap * 30);
    ctx.quadraticCurveTo(-r * 2.0, bounce + r * 0.8 + flap * 10, -10, bounce + r * 0.5);
    ctx.fill();
    // Cánh phải
    ctx.beginPath();
    ctx.moveTo(10, bounce);
    ctx.quadraticCurveTo(r * 1.5, bounce - r * 0.5 + flap * 30, r * 3, bounce - r * 0.8 + flap * 50);
    ctx.lineTo(r * 2.8, bounce - r * 0.2 + flap * 40); // Lỗ rách
    ctx.lineTo(r * 3.5, bounce + flap * 30);
    ctx.quadraticCurveTo(r * 2.0, bounce + r * 0.8 + flap * 10, 10, bounce + r * 0.5);
    ctx.fill();
    
    // Xương cánh tủa ra nhọn hoắt
    ctx.strokeStyle = '#450a0a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-10, bounce); ctx.lineTo(-r * 3, bounce - r * 0.8 + flap * 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, bounce); ctx.lineTo(r * 3, bounce - r * 0.8 + flap * 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, bounce); ctx.lineTo(-r * 3.5, bounce + flap * 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, bounce); ctx.lineTo(r * 3.5, bounce + flap * 30); ctx.stroke();

    // Thân rồng mục nát lộ lõi dung nham
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-r * 0.4, bounce - r * 0.8, r * 0.8, r * 1.6);
    // Lõi dung nham rực sáng ở ngực
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 30; ctx.shadowColor = '#f97316';
    ctx.beginPath(); ctx.arc(0, bounce - r * 0.2, r * 0.3 + Math.sin(time/100)*10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Xương sườn bao bọc lõi
    ctx.fillStyle = '#1c1917';
    for (let i = 0; i < 4; i++) {
      pxRow(ctx, -r * 0.4, bounce - r * 0.5 + i * 15, Math.floor(r * 0.2), 4);
      pxRow(ctx, r * 0.1, bounce - r * 0.5 + i * 15, Math.floor(r * 0.2), 4);
    }

    // Đầu rồng rớt hàm, tan chảy
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-r * 0.25, bounce - r * 2.0, r * 0.5, r * 0.8);
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-r * 0.35, bounce - r * 2.6, r * 0.7, r * 0.6);
    // Mắt chùm kinh dị (Nhiều con mắt không đều)
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 15; ctx.shadowColor = '#fef08a';
    px(ctx, -r * 0.2, bounce - r * 2.3, 4);
    px(ctx, -r * 0.1, bounce - r * 2.4, 3);
    px(ctx, r * 0.15, bounce - r * 2.2, 5);
    px(ctx, r * 0.25, bounce - r * 2.4, 2);
    ctx.shadowBlur = 0;
    // Sừng đen gãy
    ctx.fillStyle = '#000';
    px(ctx, -r * 0.4, bounce - r * 2.8, 6);
    px(ctx, r * 0.3, bounce - r * 2.7, 8);
    // Nham thạch nhiễu nhão từ mồm
    ctx.fillStyle = '#f97316';
    for(let i=0; i<3; i++) {
      px(ctx, -r*0.2 + i*r*0.15, bounce - r * 2.0 + (time/20 + i*10) % 30, 4);
    }

    // Lửa phun diện rộng kinh hoàng
    if (enemy.dashState === 'warning' || enemy.dashState === 'fire_breath') {
      ctx.fillStyle = '#f97316';
      ctx.shadowBlur = 40; ctx.shadowColor = '#ef4444';
      ctx.beginPath(); ctx.arc(0, bounce - r * 2.8, r * 0.8 + Math.random() * 20, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
    isHandled = true;
  }

  // ========== 3. ICE ==========
  else if (tId === 'frost_zombie') {
    const breath = Math.sin(time / 200) * 1.5;
    // Thân zombie băng pixel
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-6, bounce - r + 2, 12, r * 1.6 + breath);
    // Đóng băng pixel
    ctx.fillStyle = '#7dd3fc';
    px(ctx, -4, bounce - r + 4, S); px(ctx, 2, bounce, S);
    px(ctx, -2, bounce + 4, S);
    // Tay rủ xuống
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(6, bounce - 2 - breath, 8, 3 + breath / 2);
    }
    // Đầu zombie pixel
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(-5, bounce - r - 4 - breath, 10, 8);
    // Mắt đóng băng pixel
    ctx.fillStyle = '#0284c7';
    ctx.shadowBlur = 3; ctx.shadowColor = '#38bdf8';
    px(ctx, -3, bounce - r - 2 - breath, S);
    px(ctx, 1, bounce - r - 2 - breath, S);
    ctx.shadowBlur = 0;
    // Tinh thể băng trên đầu pixel
    ctx.fillStyle = '#e0f2fe';
    px(ctx, -2, bounce - r - 6 - breath, S);
    px(ctx, 2, bounce - r - 6 - breath, S);
    px(ctx, 0, bounce - r - 8 - breath, S);
    isHandled = true;

  } else if (tId === 'ice_spirit') {
    const wave = Math.sin(time / 150) * 4;
    const breath = Math.sin(time / 120) * 2;
    // Hồn băng lơ lửng pixel — dạng kim cương
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(0, bounce - r + wave - breath);
    ctx.lineTo(r * 0.6 + breath, bounce + wave);
    ctx.lineTo(0, bounce + r + wave + breath);
    ctx.lineTo(-r * 0.6 - breath, bounce + wave);
    ctx.fill();
    // Pixel outlines
    ctx.fillStyle = '#bae6fd';
    px(ctx, -1, bounce - r + wave - breath + 2, S);
    px(ctx, 1, bounce - r + wave - breath + 2, S);
    // Lõi sáng
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#bae6fd';
    px(ctx, -1, bounce + wave - 2, 3);
    ctx.shadowBlur = 0;
    // Đuôi pixel bay
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
    px(ctx, -2, bounce + r + wave + breath, S);
    px(ctx, 0, bounce + r + wave + breath + 2, S);
    px(ctx, 2, bounce + r + wave + breath, S);
    isHandled = true;

  } else if (tId === 'yeti') {
    const breath = Math.sin(time / 200) * 2;
    // Thân yeti to pixel — lông trắng bù xù
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-r * 0.5 - breath, bounce - r + 2, r + breath * 2, r * 1.8 + breath);
    // Lông pixel bù xù
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < 6; i++) {
      const fx = Math.sin(i * 1.5) * (r * 0.4);
      const fy = bounce - r + 4 + i * 5;
      px(ctx, fx - r * 0.5 - 2, fy, S);
      px(ctx, fx + r * 0.4, fy, S);
    }
    // Mặt đen pixel
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-5 - breath / 2, bounce - r * 0.5 - breath, 10 + breath, 6);
    // Mắt đỏ
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 3; ctx.shadowColor = '#ef4444';
    px(ctx, -3, bounce - r * 0.4 - breath, S);
    px(ctx, 1, bounce - r * 0.4 - breath, S);
    ctx.shadowBlur = 0;
    // Tay to
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(r * 0.4, bounce - r * 0.3 - breath, 4, r + breath);
      ctx.fillRect(-r * 0.4 - 4, bounce - r * 0.3 - breath, 4, r + breath);
    }
    isHandled = true;

  } else if (tId === 'frost_lord') {
    const floatOffset = Math.sin(time / 200) * 5;
    const cloakWhip = Math.sin(time / 150) * 15;
    // Giật lag ma quái
    const glitch = Math.random() > 0.95 ? Math.random() * 20 - 10 : 0;
    
    if (enemy.angle === undefined && (enemy.vx !== 0 || enemy.vy !== 0)) {
      ctx.rotate(Math.atan2(enemy.vy, enemy.vx) + Math.PI / 2);
    } else if (enemy.angle === undefined) {
      ctx.rotate(Math.PI);
    }

    ctx.save();
    ctx.translate(glitch, 0); // Lơ lửng giật cục

    // Sương mù băng giá tỏa ra dưới chân
    const auraGrad = ctx.createRadialGradient(0, bounce + floatOffset + r, 0, 0, bounce + floatOffset + r, r * 3);
    auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
    auraGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.3)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath(); ctx.arc(0, bounce + floatOffset + r, r * 3, 0, Math.PI * 2); ctx.fill();

    ctx.shadowBlur = 30; ctx.shadowColor = '#38bdf8';
    // Áo choàng rách bươm sắc nhọn như dao băng
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, bounce + floatOffset);
    ctx.lineTo(-r * 2.0, bounce + r * 1.5 + cloakWhip);
    ctx.lineTo(-r * 1.0, bounce + r * 2.0);
    ctx.lineTo(-r * 1.5, bounce + r * 3.5 + cloakWhip * 0.5);
    ctx.lineTo(0, bounce + r * 2.5);
    ctx.lineTo(r * 1.5, bounce + r * 3.5 - cloakWhip);
    ctx.lineTo(r * 1.0, bounce + r * 2.0);
    ctx.lineTo(r * 2.0, bounce + r * 1.5 - cloakWhip);
    ctx.lineTo(r * 0.8, bounce + floatOffset);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gai băng đâm xuyên từ lưng ra
    ctx.fillStyle = '#e0f2fe';
    for(let i=0; i<6; i++) {
      const angle = -Math.PI + (i * Math.PI / 5);
      const spikeX = Math.cos(angle) * r * 1.5;
      const spikeY = bounce + floatOffset + Math.sin(angle) * r * 1.5;
      ctx.beginPath(); ctx.moveTo(0, bounce + floatOffset); ctx.lineTo(spikeX, spikeY - 10); ctx.lineTo(spikeX + 10, spikeY); ctx.fill();
    }

    // Thân pha lê rạn nứt
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(-r * 0.6, bounce + floatOffset - r * 0.8, r * 1.2, r * 1.8);
    // Vết nứt đen ngòm trên thân
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.moveTo(-r*0.2, bounce + floatOffset - r*0.5); ctx.lineTo(r*0.3, bounce + floatOffset); ctx.lineTo(-r*0.1, bounce + floatOffset + r*0.5); ctx.stroke();

    // Đầu bị chẻ làm đôi trôi nổi
    const headSplit = Math.sin(time / 100) * 5 + 5;
    ctx.fillStyle = '#bae6fd';
    // Nửa trái
    ctx.fillRect(-r * 0.4 - headSplit, bounce - r * 1.2 + floatOffset, r * 0.4, r * 0.8);
    // Nửa phải
    ctx.fillRect(headSplit, bounce - r * 1.2 + floatOffset, r * 0.4, r * 0.8);
    // Khoảng không đen ở giữa
    ctx.fillStyle = '#000';
    ctx.fillRect(-headSplit, bounce - r * 1.2 + floatOffset, headSplit * 2, r * 0.8);
    // Con mắt quỷ dị ở giữa khe nứt
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
    px(ctx, -2, bounce - r * 0.8 + floatOffset, 4);
    ctx.shadowBlur = 0;

    // Vương miện băng trôi nổi lệch
    ctx.fillStyle = '#e0f2fe';
    px(ctx, -r * 0.5 - headSplit, bounce - r * 1.8 + floatOffset, 5);
    px(ctx, r * 0.5 + headSplit, bounce - r * 1.6 + floatOffset, 6);
    
    // Quyền trượng khổng lồ cắm đầy đầu lâu băng
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(r * 1.2, bounce + floatOffset - r * 2, 8, r * 4);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowBlur = 20; ctx.shadowColor = '#7dd3fc';
    ctx.beginPath(); ctx.moveTo(r * 1.2 + 4, bounce + floatOffset - r * 2.5); ctx.lineTo(r * 0.8, bounce + floatOffset - r * 1.5); ctx.lineTo(r * 1.8, bounce + floatOffset - r * 1.5); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
    isHandled = true;
  }

  // ========== 4. MOSS ==========
  else if (tId === 'toxic_slime') {
    const pulse = Math.sin(time / 100) * 2;
    const breath = Math.sin(time / 130) * 1.5;
    // Slime độc pixel — flat blob
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-r - pulse, bounce + 2, r * 2 + pulse * 2, r * 0.6 + breath);
    ctx.fillRect(-r + 2, bounce - 2 - breath, r * 2 - 4, 6);
    ctx.fillRect(-r + 4, bounce - 6 - breath, r * 2 - 8, 4);
    // Highlight
    ctx.fillStyle = '#4ade80';
    ctx.shadowBlur = 4; ctx.shadowColor = '#22c55e';
    px(ctx, -r + 6, bounce - 4 - breath, 3);
    // Bọt khí pixel
    px(ctx, -r * 0.5, bounce - 2, S);
    px(ctx, r * 0.3, bounce + 2, S);
    ctx.shadowBlur = 0;
    // Giọt nhầy rỏ
    ctx.fillStyle = '#22c55e';
    px(ctx, -4, bounce + r * 0.5 + breath, S);
    px(ctx, 3, bounce + r * 0.3 + breath + 2, S);
    isHandled = true;

  } else if (tId === 'poison_flower') {
    const breath = Math.sin(time / 200) * 2;
    // Thân cây pixel
    ctx.fillStyle = '#166534';
    ctx.fillRect(-1, bounce + 2, 3, r + 2);
    // Lá pixel
    ctx.fillStyle = '#22c55e';
    px(ctx, -4, bounce + 4, 3);
    px(ctx, 3, bounce + 8, 3);
    // Cánh hoa pixel (5 cánh)
    ctx.fillStyle = '#991b1b';
    const flowerY = bounce - r - 4 - breath;
    px(ctx, -r, flowerY + 2, 4);
    px(ctx, r - 4, flowerY + 2, 4);
    px(ctx, -r + 2, flowerY - 2, 4);
    px(ctx, r - 6, flowerY - 2, 4);
    px(ctx, -2, flowerY - 4, 4);
    // Gradient cánh hoa
    ctx.fillStyle = '#fca5a5';
    px(ctx, -r + 2, flowerY + 2, S);
    px(ctx, r - 4, flowerY + 2, S);
    // Nhụy hoa pixel phát sáng
    ctx.fillStyle = '#4ade80';
    ctx.shadowBlur = 5; ctx.shadowColor = '#22c55e';
    ctx.beginPath(); ctx.arc(0, flowerY, 4 + breath / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fef08a';
    px(ctx, -1, flowerY - 1, 3);
    ctx.shadowBlur = 0;
    isHandled = true;

  } else if (tId === 'plague_rat') {
    const breath = Math.sin(time / 80) * 1;
    const tailWag = Math.sin(time / 50) * 3;
    // Thân chuột pixel nằm ngang
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-r + 2, bounce + 2, r * 2 - 4, r * 0.5 + breath);
    // Bụng pixel sáng hơn
    ctx.fillStyle = '#3f3f46';
    pxRow(ctx, -r + 4, bounce + 4, Math.floor(r * 0.8), S);
    // Đầu chuột pixel (nhọn)
    ctx.fillStyle = '#27272a';
    ctx.fillRect(r - 6, bounce - 2 - breath, 8, 6);
    px(ctx, r + 2, bounce - breath, S);
    px(ctx, r + 4, bounce + 1 - breath, S);
    // Tai pixel
    ctx.fillStyle = '#fecdd3';
    px(ctx, r - 4, bounce - 4 - breath, S);
    px(ctx, r, bounce - 4 - breath, S);
    // Mắt đỏ
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 3; ctx.shadowColor = '#ef4444';
    px(ctx, r - 2, bounce - 1 - breath, S);
    ctx.shadowBlur = 0;
    // Đuôi pixel
    ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r + 2, bounce + 4);
    ctx.lineTo(-r - 4, bounce + 2 + tailWag);
    ctx.stroke();
    // Chân pixel nhỏ
    ctx.fillStyle = '#1c1917';
    px(ctx, -r + 4, bounce + r * 0.4 + breath, S);
    px(ctx, -r + 10, bounce + r * 0.4 + breath, S);
    px(ctx, r - 8, bounce + r * 0.4 + breath, S);
    px(ctx, r - 2, bounce + r * 0.4 + breath, S);
    isHandled = true;

  } else if (tId === 'toxic_behemoth') {
    // Khối thịt co bóp điên cuồng
    const pulseX = Math.sin(time / 80) * 15;
    const pulseY = Math.cos(time / 80) * 15;
    const throb = Math.sin(time / 40) * 5; // Nhịp đập tim nhanh

    if (enemy.angle === undefined && (enemy.vx !== 0 || enemy.vy !== 0)) {
      ctx.rotate(Math.atan2(enemy.vy, enemy.vx) + Math.PI / 2);
    } else if (enemy.angle === undefined) {
      ctx.rotate(Math.PI);
    }

    // Vũng độc dưới chân
    const poisonPool = ctx.createRadialGradient(0, bounce + r, 0, 0, bounce + r, r * 2.5);
    poisonPool.addColorStop(0, 'rgba(21, 128, 61, 0.8)');
    poisonPool.addColorStop(0.5, 'rgba(34, 197, 94, 0.4)');
    poisonPool.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = poisonPool;
    ctx.beginPath(); ctx.ellipse(0, bounce + r, r * 2.5, r * 1.5, 0, 0, Math.PI * 2); ctx.fill();

    // Khối nhầy khổng lồ lở loét (Amalgamation)
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.ellipse(0, bounce, r * 0.9 + pulseX, r * 1.1 + pulseY, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Gradient ruột gan nhầy nhụa
    const gutGrad = ctx.createRadialGradient(0, bounce, 0, 0, bounce, r);
    gutGrad.addColorStop(0, '#166534');
    gutGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = gutGrad;
    ctx.beginPath();
    ctx.ellipse(0, bounce, r * 0.7 + pulseX, r * 0.9 + pulseY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đầu lâu và mảnh xác người chìm bên trong
    ctx.fillStyle = '#a1a1aa'; // Xương
    for (let i = 0; i < 8; i++) {
      const skullX = Math.sin(i * Math.PI * 2 / 8 + time / 300) * (r * 0.6);
      const skullY = bounce + Math.cos(i * Math.PI * 2 / 8 + time / 300) * (r * 0.6);
      ctx.globalAlpha = 0.5 + Math.sin(time / 100 + i) * 0.5;
      ctx.fillRect(skullX - 6, skullY - 6, 12, 10);
      ctx.fillStyle = '#000'; // Hốc mắt sọ
      px(ctx, skullX - 4, skullY - 2, 3); px(ctx, skullX + 2, skullY - 2, 3);
      ctx.fillStyle = '#a1a1aa';
    }
    ctx.globalAlpha = 1.0;

    // Mụn nhọt phình to chực vỡ
    ctx.fillStyle = '#4ade80';
    for (let i = 0; i < 6; i++) {
      const ox = Math.sin(i * 1.23 + time / 150) * r * 0.8;
      const oy = bounce + Math.cos(i * 2.34 + time / 150) * r * 0.8;
      const pustuleSize = 10 + Math.sin(time / 50 + i) * 8; // Sưng to lên
      ctx.beginPath(); ctx.arc(ox, oy, pustuleSize, 0, Math.PI*2); ctx.fill();
      // Chấm vàng giữa mụn
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(ox, oy, pustuleSize * 0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4ade80';
      
      // Bắn mủ xanh nếu sưng to
      if (Math.sin(time / 50 + i) > 0.8) {
        ctx.fillStyle = '#86efac';
        px(ctx, ox + (Math.random()-0.5)*30, oy + (Math.random()-0.5)*30, 4);
        ctx.fillStyle = '#4ade80';
      }
    }
    
    // Khe hở miệng dọc khổng lồ rỉ máu xanh
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.ellipse(0, bounce, 15 + throb, r * 0.8 + throb, 0, 0, Math.PI * 2);
    ctx.fill();
    // Răng nanh mọc lởm chởm quanh khe miệng
    ctx.fillStyle = '#fef08a';
    for(let i=-r*0.6; i<r*0.6; i+=15) {
      px(ctx, -15 - throb, bounce + i, 4);
      px(ctx, 15 + throb - 4, bounce + i, 4);
    }

    isHandled = true;
  }

  // ========== 5. BLOOD ==========
  else if (tId === 'weeping_wraith') {
    const wave = Math.sin(time / 150) * 4;
    const breath = Math.sin(time / 200) * 2;
    // Áo choàng pixel mờ ảo
    ctx.fillStyle = 'rgba(153, 27, 27, 0.85)';
    ctx.fillRect(-7 - breath, bounce - r, 14 + breath * 2, r * 2 + wave);
    // Rìa áo rách pixel
    ctx.fillStyle = 'rgba(69, 10, 10, 0.6)';
    px(ctx, -8 - breath, bounce + r - 2 + wave, S);
    px(ctx, -6, bounce + r + wave, S);
    px(ctx, 4, bounce + r + 2 + wave, S);
    px(ctx, 6 + breath, bounce + r - 2 + wave, S);
    // Khuôn mặt pixel
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-5, bounce - r + 2, 10, 8);
    // Hốc mắt rỗng pixel
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, bounce - r + 3 - breath, 3, 4);
    ctx.fillRect(1, bounce - r + 3 - breath, 3, 4);
    // Nước mắt máu pixel chảy xuống
    ctx.fillStyle = '#dc2626';
    ctx.shadowBlur = 3; ctx.shadowColor = '#dc2626';
    pxCol(ctx, -3, bounce - r + 7 - breath, 4 + breath, S);
    pxCol(ctx, 2, bounce - r + 7 - breath, 4 + breath, S);
    ctx.shadowBlur = 0;
    isHandled = true;

  } else if (tId === 'flesh_golem') {
    const breath = Math.sin(time / 250) * 2;
    // Thân golem thịt pixel — khối to
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-8 - breath, bounce - r * 1.3, 16 + breath * 2, r * 2.5);
    // Vết khâu pixel
    ctx.fillStyle = '#450a0a';
    for (let i = 0; i < 4; i++) {
      pxRow(ctx, -4, bounce - r + i * 6, 4, 1);
      pxCol(ctx, -4 + i * 2, bounce - r + i * 6 - 1, 1, 1);
      pxCol(ctx, -4 + i * 2, bounce - r + i * 6 + 1, 1, 1);
    }
    // Mắt pixel — 1 mắt to 1 mắt nhỏ bất đối xứng
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-5, bounce - r * 1.1, 4, 3);
    px(ctx, 2, bounce - r * 1.0, S);
    // Tay to
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-14, bounce - r * 0.4 - breath, 6, 16 + breath);
      ctx.fillRect(8, bounce - breath, 6, 16 + breath);
      // Ngón pixel
      ctx.fillStyle = '#7f1d1d';
      px(ctx, -14, bounce + 12 - breath, S);
      px(ctx, -12, bounce + 14 - breath, S);
      px(ctx, 12, bounce + 12, S);
      px(ctx, 14, bounce + 14, S);
    }
    isHandled = true;

  } else if (tId === 'suicide_bat') {
    const sizeOffset = Math.sin(time / 100) * 3;
    // Thân dơi pixel tròn phồng
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(-r * 0.5 - sizeOffset, bounce - r * 0.4, r + sizeOffset * 2, r * 0.8);
    // Cánh dơi pixel
    ctx.fillStyle = '#b91c1c';
    // Cánh trái
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, bounce);
    ctx.quadraticCurveTo(-r * 1.2, bounce - r * 0.8, -r * 1.5, bounce - r + sizeOffset);
    ctx.lineTo(-r * 1.2, bounce + r * 0.3);
    ctx.fill();
    // Cánh phải
    ctx.beginPath();
    ctx.moveTo(r * 0.5, bounce);
    ctx.quadraticCurveTo(r * 1.2, bounce - r * 0.8, r * 1.5, bounce - r + sizeOffset);
    ctx.lineTo(r * 1.2, bounce + r * 0.3);
    ctx.fill();
    // Mắt pixel phát sáng
    ctx.fillStyle = '#fef08a';
    ctx.shadowBlur = 5; ctx.shadowColor = '#fef08a';
    px(ctx, -2, bounce - 2, 3);
    ctx.fillStyle = '#000';
    px(ctx, -1, bounce - 1, 1);
    ctx.shadowBlur = 0;
    isHandled = true;

  } else if (tId === 'chainsaw_fiend') {
    const breath = Math.sin(time / 150) * 1.5;
    // Thân pixel mảnh
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-6 - breath, bounce - r, 12 + breath * 2, r * 2);
    // Đai pixel
    ctx.fillStyle = '#3f3f46';
    pxRow(ctx, -6, bounce, 6, S);
    // Đầu cam pixel (Chainsaw Man style)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-7, bounce - r - 10 - breath, 14, 10);
    // Phần kim loại tối
    ctx.fillStyle = '#292524';
    ctx.fillRect(-5, bounce - r - 6 - breath, 12, 6);
    // Lưỡi cưa pixel nhô
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(7, bounce - r - 8 - breath, 16, 4);
    // Răng cưa pixel
    ctx.fillStyle = '#1c1917';
    for (let i = 0; i < 3; i++) {
      px(ctx, 9 + i * 5, bounce - r - 10 - breath, S);
      px(ctx, 9 + i * 5, bounce - r - 4 - breath, S);
    }
    // Mắt pixel
    ctx.fillStyle = '#000';
    px(ctx, -2, bounce - r - 4 - breath, S);
    // Máu trên lưỡi cưa
    ctx.fillStyle = '#991b1b';
    px(ctx, 15, bounce - r - 8 - breath, S);
    px(ctx, 19, bounce - r - 7 - breath, S);
    // Vũ khí tay
    if (!enemy.missingLimbs?.includes('arm')) {
      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(6, bounce - 2 - breath, 10, 4);
      // Lưỡi cưa tay
      ctx.fillRect(14, bounce - 4 - breath, 2, 8);
    }
    isHandled = true;

  } else if (tId === 'blood_fiend') {
    // Biblically Accurate Blood Angel
    const flap = Math.sin(time / 80);
    const flap2 = Math.cos(time / 90); // Nhịp cánh không đồng đều
    const flap3 = Math.sin(time / 70 + Math.PI);
    const float = Math.sin(time / 150) * 15;
    const eyeJitter = Math.random() > 0.8 ? Math.random() * 6 - 3 : 0;

    if (enemy.angle === undefined && (enemy.vx !== 0 || enemy.vy !== 0)) {
      ctx.rotate(Math.atan2(enemy.vy, enemy.vx) + Math.PI / 2);
    } else if (enemy.angle === undefined) {
      ctx.rotate(Math.PI);
    }

    // Blood Aura cuộn trào
    const bloodAura = ctx.createRadialGradient(0, bounce + float, r, 0, bounce + float, r * 4);
    bloodAura.addColorStop(0, 'rgba(159, 18, 57, 0.8)');
    bloodAura.addColorStop(0.5, 'rgba(127, 29, 29, 0.4)');
    bloodAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bloodAura;
    ctx.beginPath(); ctx.arc(0, bounce + float, r * 4, 0, Math.PI * 2); ctx.fill();

    // 6 chiếc cánh thịt dị dạng đập loạn xạ
    ctx.fillStyle = '#450a0a';
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 4;
    const drawFleshWing = (scaleX: number, angleOffset: number, currentFlap: number) => {
      ctx.save();
      ctx.translate(0, bounce + float);
      ctx.scale(scaleX, 1);
      ctx.rotate(angleOffset + currentFlap * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-r * 1.5, -r * 2, -r * 3, -r * 1.5);
      ctx.lineTo(-r * 2.5, -r * 0.5); // Rách
      ctx.quadraticCurveTo(-r * 3.5, r, -r * 2, r * 1.5);
      ctx.lineTo(0, r * 0.5);
      ctx.fill(); ctx.stroke();
      // Con mắt mọc trên cánh
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-r*1.5, -r*0.5, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#f43f5e'; px(ctx, -r*1.5 - 2, -r*0.5 - 2, 4);
      ctx.restore();
    };
    
    drawFleshWing(1, -Math.PI/6, flap); // Cánh trên trái
    drawFleshWing(-1, -Math.PI/6, flap); // Cánh trên phải
    drawFleshWing(1, 0, flap2); // Cánh giữa trái
    drawFleshWing(-1, 0, flap2); // Cánh giữa phải
    drawFleshWing(1, Math.PI/6, flap3); // Cánh dưới trái
    drawFleshWing(-1, Math.PI/6, flap3); // Cánh dưới phải

    // Thân rỗng chỉ có xương sườn khổng lồ bao bọc Con Mắt
    ctx.fillStyle = '#fda4af'; // Xương
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, bounce + float - r * 0.8 + i * 12);
      ctx.quadraticCurveTo(-r * 0.8, bounce + float - r * 0.5 + i * 15, -r * 0.5, bounce + float + r * 0.2 + i * 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, bounce + float - r * 0.8 + i * 12);
      ctx.quadraticCurveTo(r * 0.8, bounce + float - r * 0.5 + i * 15, r * 0.5, bounce + float + r * 0.2 + i * 5);
      ctx.stroke();
    }

    // CON MẮT TRUNG TÂM KHỔNG LỒ (Core)
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.ellipse(eyeJitter, bounce + float + eyeJitter, r * 0.6, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    // Đồng tử đỏ rực rỉ máu
    ctx.fillStyle = '#f43f5e';
    ctx.shadowBlur = 40; ctx.shadowColor = '#e11d48';
    ctx.beginPath(); ctx.arc(eyeJitter, bounce + float + eyeJitter, r * 0.3 + Math.sin(time/50)*5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Đồng tử khe dọc hẹp
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(eyeJitter, bounce + float + eyeJitter, 4, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();

    // Vòng thiên thần rỉ máu (Halo of Blood)
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, bounce + float - r * 1.5, r, r * 0.3, Math.sin(time/100)*0.2, 0, Math.PI * 2);
    ctx.stroke();
    // Máu rỏ từ Halo
    ctx.fillStyle = '#be123c';
    for(let i=0; i<5; i++) {
      px(ctx, -r*0.8 + i*r*0.4, bounce + float - r * 1.2 + (time/20 + i*15)%40, 4);
    }

    isHandled = true;
  }

  // ========== 6. ALLIES & SPECIALS ==========
  else if (tId === 'hallucination') {
    const wave = Math.sin(time / 150) * 5;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 + Math.sin(time / 200) * 0.3})`;
    ctx.shadowColor = '#450a0a'; ctx.shadowBlur = 15;
    // Bóng ma pixel tam giác
    ctx.fillRect(-r * 0.6 - wave, bounce - r + wave, r * 1.2 + wave * 2, r * 2);
    // Mắt pixel
    ctx.fillStyle = 'rgba(220, 38, 38, 0.8)';
    px(ctx, -3, bounce - r * 0.3, S);
    px(ctx, 1, bounce - r * 0.3, S);
    ctx.shadowBlur = 0;
    isHandled = true;

  } else if (tId === 'spirit_wolf') {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = enemy.color || '#2dd4bf';
    ctx.shadowColor = enemy.color || '#2dd4bf'; ctx.shadowBlur = 10;
    // Thân sói pixel nằm ngang
    ctx.fillRect(-r, bounce - r * 0.4, r * 2.5, r * 0.8);
    // Đầu sói pixel
    ctx.fillRect(r, bounce - r * 0.6, r * 0.8, r * 0.8);
    // Tai
    px(ctx, r + 1, bounce - r * 0.8, S);
    px(ctx, r + r * 0.5, bounce - r * 0.8, S);
    // Mắt
    ctx.fillStyle = '#fff';
    px(ctx, r + r * 0.3, bounce - r * 0.3, S);
    // Đuôi pixel
    ctx.fillStyle = enemy.color || '#2dd4bf';
    px(ctx, -r - 2, bounce - r * 0.2, S);
    px(ctx, -r - 4, bounce - r * 0.4, S);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1.0;
    isHandled = true;

  } else if (tId === 'fairy') {
    const flap = Math.sin(time / 30) * 5;
    ctx.shadowBlur = 20; ctx.shadowColor = enemy.color || '#fef08a';
    // Thân tiên pixel
    ctx.fillStyle = enemy.color || '#fef08a';
    ctx.fillRect(-r * 0.4, bounce - r * 0.4, r * 0.8, r * 0.8);
    // Lõi pixel
    ctx.fillStyle = '#fff';
    px(ctx, -r * 0.2, bounce - r * 0.2, 3);
    // Cánh pixel
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(-r, bounce - flap, r * 0.8, r * 0.4, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r, bounce - flap, r * 0.8, r * 0.4, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    isHandled = true;

  } else if (tId === 'grand_slime') {
    const isEnraged = enemy.hp < enemy.maxHp * 0.5;
    const stretch = Math.sin(time / 150) * 4;
    const t = time / 200;
    // Xúc tu pixel
    const numTentacles = isEnraged ? 8 : 5;
    for (let i = 0; i < numTentacles; i++) {
      const angleOffset = (i / numTentacles) * Math.PI * 2 + t * 0.2;
      const tentacleLength = r * (1.5 + Math.sin(t + i) * 0.5);
      ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.strokeStyle = '#450a0a';
      ctx.beginPath(); ctx.moveTo(0, bounce);
      let cx = 0, cy = bounce, sa = angleOffset;
      for (let j = 1; j <= 3; j++) {
        sa += Math.sin(t * 1.5 + i + j) * 0.4;
        cx += Math.cos(sa) * (tentacleLength / 3);
        cy += Math.sin(sa) * (tentacleLength / 3);
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.fillStyle = '#fca5a5'; px(ctx, cx - 1, cy - 1, 3);
    }
    // Thân blob pixel
    ctx.fillStyle = isStunned ? '#67e8f9' : (isEnraged ? '#ef4444' : '#991b1b');
    ctx.beginPath();
    for (let i = 0; i < Math.PI * 2; i += 0.5) {
      const wobble = Math.sin(t + i) * 8;
      const rx = Math.cos(i) * (r + stretch + wobble);
      const ry = Math.sin(i) * (r - stretch + wobble) + bounce;
      if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
    }
    ctx.closePath(); ctx.fill();
    // Mắt pixel
    const numEyes = isEnraged ? 8 : 4;
    for (let i = 0; i < numEyes; i++) {
      const ex = Math.sin(i * Math.PI / numEyes) * r * 0.6;
      const ey = Math.cos(i * Math.PI / numEyes) * r * 0.6 + bounce;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ex - 3, ey - 2, 6, 4);
      ctx.fillStyle = '#fef08a';
      px(ctx, ex - 1, ey - 1, 3);
    }
    isHandled = true;

  } else if (tId === 'blood_priest') {
    const floatBook = Math.sin(time / 200) * 4;
    // Áo choàng tam giác pixel
    ctx.fillStyle = '#881337';
    ctx.beginPath(); ctx.moveTo(0, bounce - r); ctx.lineTo(-r, bounce + r); ctx.lineTo(r, bounce + r); ctx.fill();
    // Sách pixel
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(-15, bounce + r * 0.2 + floatBook, 10, 14);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(-13, bounce + r * 0.2 + 2 + floatBook, 6, 10);
    // Rune trên sách pixel
    ctx.fillStyle = '#fca5a5';
    px(ctx, -11, bounce + r * 0.2 + 4 + floatBook, S);
    px(ctx, -9, bounce + r * 0.2 + 6 + floatBook, S);
    // Đầu pixel
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(-r * 0.35, bounce - r * 0.5, r * 0.7, r * 0.7);
    // Mắt pixel
    ctx.fillStyle = '#000';
    px(ctx, -r * 0.2, bounce - r * 0.3, S);
    px(ctx, r * 0.1, bounce - r * 0.3, S);
    isHandled = true;
  }

  // ========== FALLBACK ==========
  if (!isHandled) {
    ctx.fillStyle = renderColor;
    ctx.fillRect(-r, bounce - r, r * 2, r * 2);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.strokeRect(-r, bounce - r, r * 2, r * 2);
    // Mắt pixel mặc định
    ctx.fillStyle = '#000';
    px(ctx, -r * 0.3, bounce - r * 0.3, S);
    px(ctx, r * 0.2, bounce - r * 0.3, S);
  }

  ctx.restore();
}
