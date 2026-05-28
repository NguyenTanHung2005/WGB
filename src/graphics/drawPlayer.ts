import type { Entity, Weapon } from '../types/interfaces';

// === PIXEL ART HELPER ===
// Vẽ 1 ô pixel vuông tại vị trí (x, y) kích thước s
function px(ctx: CanvasRenderingContext2D, x: number, y: number, s: number = 2) {
  ctx.fillRect(x, y, s, s);
}

// Vẽ dãy pixel ngang
function pxRow(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, s: number = 2) {
  ctx.fillRect(x, y, s * count, s);
}

// Vẽ dãy pixel dọc
function pxCol(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, s: number = 2) {
  ctx.fillRect(x, y, s, s * count);
}

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

  const S = 2; // Pixel size — mỗi "pixel" = 2x2 canvas pixel
  let headY = -20;
  let bodyY = -8;
  let armRot = 0;
  let legLRot = 0;
  let legRRot = 0;
  let bodySquash = 0; // Breathing squash

  // === ANIMATION STATES ===
  if (state === 'walk') {
    const speedMult = 0.015;
    const bob = Math.sin(phase * speedMult);
    headY += bob * 2;
    bodyY += bob * 2;
    legLRot = Math.sin(phase * speedMult) * 0.7;
    legRRot = -Math.sin(phase * speedMult) * 0.7;
    armRot = Math.sin(phase * speedMult) * 0.4;
  } else if (state === 'idle') {
    const breathCycle = Math.sin(phase * 0.002);
    const bob = Math.sin(phase * 0.003);
    headY += bob * 1;
    bodyY += bob * 1;
    bodySquash = breathCycle * 0.5;
    armRot = breathCycle * 0.06;
  } else if (state === 'roll') {
    ctx.rotate(phase * 0.04 * facing);
    headY = -6;
    bodyY = 0;
  }

  const atkProgress = Math.min(1.0, (performance.now() - (player.lastAttackTime || 0)) / 200);
  if (state === 'attack') {
    if (weapon && weapon.type === 'melee') {
      armRot = -Math.PI * 0.6 + atkProgress * Math.PI * 1.2;
    } else {
      armRot = -0.2 + (atkProgress < 0.3 ? -0.3 : 0);
    }
  }

  // === DEAD STATE ===
  if (state === 'dead') {
    const bloodGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 28);
    bloodGrad.addColorStop(0, 'rgba(69, 10, 10, 0.9)');
    bloodGrad.addColorStop(0.6, 'rgba(127, 29, 29, 0.7)');
    bloodGrad.addColorStop(1, 'rgba(153, 27, 27, 0)');
    ctx.fillStyle = bloodGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Máu bắn tung tóe
    ctx.fillStyle = '#7f1d1d';
    for (let i = 0; i < 6; i++) {
      const sx = Math.sin(i * 1.23) * 18;
      const sy = Math.cos(i * 2.34) * 8;
      px(ctx, sx, sy, 3);
    }
    // Thân nằm ngang
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-14, -4, 28, 10);
    // Xương nhô ra
    ctx.fillStyle = '#e4e4e7';
    px(ctx, -12, -2, S); px(ctx, -14, -4, S);
    px(ctx, 10, 0, S); px(ctx, 12, -2, S);
    ctx.restore();
    return;
  }

  // === DROP SHADOW ===
  const shadowGrad = ctx.createRadialGradient(0, 14, 0, 0, 14, 16);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(0, 14, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isHitFlash) color = '#ffffff';

  // === LEGS (PIXEL ART) ===
  const drawPixelLeg = (offsetX: number, rot: number) => {
    ctx.save();
    ctx.translate(offsetX, bodyY + 14);
    ctx.rotate(rot);

    // Quần
    ctx.fillStyle = '#27272a';
    pxCol(ctx, -1, 0, 4, S);
    pxCol(ctx, 1, 0, 4, S);

    // Giày đen
    ctx.fillStyle = '#0a0a0a';
    pxRow(ctx, -1, 8, 3, S);

    ctx.restore();
  };

  drawPixelLeg(-5, legLRot);
  drawPixelLeg(3, legRRot);

  // === BODY & HEAD PER CLASS (PIXEL ART) ===

  if (classId === 'mage') {
    // === PHÁP SƯ BÓNG TỐI ===
    // Áo choàng tím pixel
    ctx.fillStyle = '#581c87';
    ctx.fillRect(-8, bodyY - 2, 16, 16 + bodySquash);
    // Nếp áo tối hơn
    ctx.fillStyle = '#3b0764';
    pxCol(ctx, -6, bodyY, 7, S);
    pxCol(ctx, 4, bodyY, 7, S);
    // Viền cổ vàng
    ctx.fillStyle = '#b45309';
    pxRow(ctx, -4, bodyY - 2, 4, S);
    // Vạt áo bay
    const capeFlutter = Math.sin(phase / 12) * 2;
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.moveTo(-8, bodyY + 14);
    ctx.lineTo(-12 + capeFlutter, bodyY + 22);
    ctx.lineTo(-4, bodyY + 18);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, bodyY + 14);
    ctx.lineTo(12 - capeFlutter, bodyY + 22);
    ctx.lineTo(4, bodyY + 18);
    ctx.fill();

    // Đầu — mũ trùm che mặt
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-7, headY - 2, 14, 14);
    // Mũ nhọn
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(-7, headY - 2); ctx.lineTo(0, headY - 10); ctx.lineTo(7, headY - 2);
    ctx.fill();
    // Bóng tối khuôn mặt
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, headY + 2, 10, 6);
    // Mắt tím phát sáng
    ctx.fillStyle = '#d8b4fe';
    ctx.shadowBlur = 8; ctx.shadowColor = '#a855f7';
    px(ctx, -2, headY + 4, S); px(ctx, 2, headY + 4, S);
    ctx.shadowBlur = 0;

    // Runes xoay quanh
    ctx.fillStyle = '#c084fc';
    const runeAngle = performance.now() / 500;
    ctx.shadowBlur = 6; ctx.shadowColor = '#c084fc';
    px(ctx, Math.cos(runeAngle) * 14, headY + Math.sin(runeAngle) * 5, 3);
    px(ctx, Math.cos(runeAngle + Math.PI) * 14, headY + Math.sin(runeAngle + Math.PI) * 5, 3);
    px(ctx, Math.cos(runeAngle + Math.PI / 2) * 12, headY + Math.sin(runeAngle + Math.PI / 2) * 4, S);
    ctx.shadowBlur = 0;

  } else if (classId === 'knight') {
    // === HIỆP SĨ GIÁP SẮT ===
    // Cape đỏ phía sau
    const capeW1 = Math.sin(phase / 15) * 4;
    const capeW2 = Math.cos(phase / 12) * 3;
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(-7, bodyY - 2);
    ctx.quadraticCurveTo(-12, bodyY + 10, -16 + capeW1, bodyY + 22 + capeW2);
    ctx.lineTo(-5, bodyY + 16);
    ctx.fill();
    ctx.fillStyle = 'rgba(69, 10, 10, 0.5)';
    ctx.beginPath();
    ctx.moveTo(-5, bodyY);
    ctx.quadraticCurveTo(-9, bodyY + 12, -13 + capeW2, bodyY + 25 + capeW1);
    ctx.lineTo(-3, bodyY + 18);
    ctx.fill();

    // Giáp thân — pixel art plate armor
    ctx.fillStyle = '#52525b';
    ctx.fillRect(-8, bodyY - 2, 16, 16);
    // Highlight kim loại
    ctx.fillStyle = '#71717a';
    pxCol(ctx, -6, bodyY, 6, S);
    pxCol(ctx, -4, bodyY, 6, S);
    // Đai giáp ngang
    ctx.fillStyle = '#3f3f46';
    pxRow(ctx, -8, bodyY + 4, 8, S);
    // Khoá vàng
    ctx.fillStyle = '#fbbf24';
    px(ctx, -2, bodyY + 4, S); px(ctx, 0, bodyY + 4, S);
    // Vai giáp
    ctx.fillStyle = '#52525b';
    ctx.fillRect(-10, bodyY - 2, 4, 6);
    ctx.fillRect(6, bodyY - 2, 4, 6);
    // Đinh tán
    ctx.fillStyle = '#a1a1aa';
    px(ctx, -9, bodyY - 1, 1); px(ctx, 7, bodyY - 1, 1);

    // Mũ sắt kín - pixel art
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-7, headY - 4, 14, 16);
    // Visor slot (khe nhìn hình T)
    ctx.fillStyle = '#000';
    pxRow(ctx, -4, headY + 2, 4, S);
    pxCol(ctx, -1, headY - 1, 5, S);
    pxCol(ctx, 1, headY - 1, 5, S);
    // Lông vũ đỏ
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, headY - 4);
    ctx.quadraticCurveTo(-4, headY - 14, -8, headY - 10);
    ctx.quadraticCurveTo(-3, headY - 8, 0, headY - 4);
    ctx.fill();

  } else if (classId === 'rogue') {
    // === SÁT THỦ NGOẠI ĐẠO ===
    // Áo măng tô dài pixel
    ctx.fillStyle = '#292524';
    ctx.fillRect(-7, bodyY - 2, 14, 20);
    // Nếp gấp áo
    ctx.fillStyle = '#1c1917';
    pxCol(ctx, -5, bodyY, 8, S);
    pxCol(ctx, 3, bodyY, 8, S);
    // Đai lưng nâu
    ctx.fillStyle = '#78350f';
    pxRow(ctx, -7, bodyY + 4, 7, S);
    // Dao giắt ngang eo
    ctx.fillStyle = '#94a3b8';
    px(ctx, -8, bodyY + 3, S); px(ctx, -10, bodyY + 4, S);
    // Vạt áo bay
    ctx.fillStyle = '#1c1917';
    const rogueFlap = Math.sin(phase / 10) * 2;
    ctx.beginPath();
    ctx.moveTo(7, bodyY + 10);
    ctx.lineTo(12 - rogueFlap, bodyY + 20);
    ctx.lineTo(7, bodyY + 18);
    ctx.fill();

    // Đầu — bandana + khăn che miệng
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(-5, headY, 10, 12);
    // Khăn trùm đen
    ctx.fillStyle = '#292524';
    ctx.fillRect(-6, headY - 2, 12, 6);
    // Khăn che miệng đỏ sẫm
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-4, headY + 6, 8, 4);
    // Mắt sắc — chỉ 1 dải ngang hẹp
    ctx.fillStyle = '#000';
    pxRow(ctx, -3, headY + 4, 3, S);
    // Đồng tử đỏ
    ctx.fillStyle = '#ef4444';
    px(ctx, -2, headY + 4, 1); px(ctx, 2, headY + 4, 1);
    // Khăn quàng bay
    ctx.fillStyle = '#991b1b';
    ctx.strokeStyle = '#991b1b'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, headY + 8);
    ctx.lineTo(-16 + Math.sin(phase / 15) * 4, headY + 12);
    ctx.stroke();

  } else if (classId === 'archer') {
    // === KẺ SĂN ĐÊM ===
    // Giáp da rêu pixel
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-6, bodyY - 2, 12, 14);
    // Nếp da
    ctx.fillStyle = '#0f3520';
    pxCol(ctx, -4, bodyY, 5, S);
    // Đai lưng nâu
    ctx.fillStyle = '#451a03';
    pxRow(ctx, -6, bodyY + 4, 6, S);
    // Ống tên đeo lưng
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, bodyY - 4, 3, 14);
    ctx.fillStyle = '#a8a29e'; // Mũi tên
    px(ctx, -7, bodyY - 5, 1); px(ctx, -7, bodyY - 3, 1);
    // Quần tối
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-5, bodyY + 12, 10, 4);

    // Đầu — mũ chóp rêu
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-5, headY, 10, 12);
    // Mũ chóp nhọn xanh rêu
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(-6, headY + 2); ctx.lineTo(0, headY - 8); ctx.lineTo(6, headY + 2);
    ctx.fill();
    // Mắt ngọc lục bảo phát sáng
    ctx.fillStyle = '#2dd4bf';
    ctx.shadowBlur = 6; ctx.shadowColor = '#14b8a6';
    px(ctx, -2, headY + 4, S); px(ctx, 2, headY + 4, S);
    ctx.shadowBlur = 0;

  } else if (classId === 'summoner') {
    // === PHÙ THUỶ HUYẾT NGẢI ===
    // Áo choàng đỏ thẫm pixel
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-7, bodyY - 2, 14, 18);
    // Nếp áo
    ctx.fillStyle = '#450a0a';
    pxCol(ctx, -5, bodyY, 7, S);
    pxCol(ctx, 3, bodyY, 7, S);
    // Ký hiệu vàng occult trên áo
    ctx.fillStyle = '#fbbf24';
    pxCol(ctx, -1, bodyY, 5, S);
    pxCol(ctx, 1, bodyY, 5, S);
    pxRow(ctx, -3, bodyY + 4, 3, S);
    // Hào quang máu dưới chân
    ctx.shadowBlur = 12; ctx.shadowColor = '#dc2626';
    ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, bodyY + 18, 8 + Math.sin(phase / 6) * 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Đầu — mũ trùm đỏ
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-6, headY - 2, 12, 6);
    ctx.fillRect(-5, headY + 4, 10, 8);
    // Mặt đen
    ctx.fillStyle = '#000';
    ctx.fillRect(-4, headY + 4, 8, 4);
    // Mắt phát sáng hồng
    ctx.fillStyle = '#fca5a5';
    ctx.shadowBlur = 4; ctx.shadowColor = '#ef4444';
    px(ctx, -2, headY + 5, S); px(ctx, 2, headY + 5, S);
    ctx.shadowBlur = 0;
    // Ấn máu trên trán
    ctx.fillStyle = '#ef4444';
    ctx.shadowBlur = 8; ctx.shadowColor = '#dc2626';
    px(ctx, -1, headY - 1, S); px(ctx, 1, headY - 1, S);
    pxRow(ctx, -2, headY, 2, S);
    const bPulse = Math.sin(performance.now() / 200) * 2;
    ctx.fillStyle = `rgba(239,68,68,${0.25 + Math.sin(performance.now() / 150) * 0.15})`;
    ctx.beginPath(); ctx.arc(0, headY, 6 + bPulse, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (classId === 'paladin') {
    // === KẺ CỨU RỖI ===
    // Khăn choàng trắng phía sau
    const capeW = Math.sin(phase / 15) * 3;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-6, bodyY - 2);
    ctx.quadraticCurveTo(-9, bodyY + 8, -12 + capeW, bodyY + 18 + Math.cos(phase / 12) * 2);
    ctx.lineTo(-5, bodyY + 14);
    ctx.fill();
    ctx.fillStyle = 'rgba(241,245,249,0.4)';
    ctx.beginPath();
    ctx.moveTo(-4, bodyY);
    ctx.quadraticCurveTo(-7, bodyY + 8, -10 + capeW * 0.5, bodyY + 20 + Math.sin(phase / 10) * 2);
    ctx.lineTo(-3, bodyY + 16);
    ctx.fill();

    // Giáp bạc pixel
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-7, bodyY - 2, 14, 14);
    // Highlight
    ctx.fillStyle = '#f1f5f9';
    pxCol(ctx, -5, bodyY, 5, S);
    // Chữ thập vàng phát sáng
    ctx.fillStyle = '#fde047';
    ctx.shadowBlur = 6; ctx.shadowColor = '#fef08a';
    pxCol(ctx, -1, bodyY - 1, 4, S);
    pxCol(ctx, 1, bodyY - 1, 4, S);
    pxRow(ctx, -3, bodyY + 2, 3, S);
    ctx.shadowBlur = 0;
    // Vai giáp sáng
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-9, bodyY - 2, 3, 5);
    ctx.fillRect(6, bodyY - 2, 3, 5);

    // Mũ giáp bạc pixel
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-6, headY - 2, 12, 14);
    // Khe mắt T
    ctx.fillStyle = '#0f172a';
    pxRow(ctx, -3, headY + 2, 3, S);
    pxCol(ctx, -1, headY, 5, S);
    pxCol(ctx, 1, headY, 5, S);

  } else if (classId === 'berserker') {
    // === CHAINSAW MAN ===
    // Áo sơ mi trắng pixel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, bodyY - 4, 10, 12);
    // Cà vạt đen
    ctx.fillStyle = '#171717';
    pxCol(ctx, -1, bodyY - 4, 6, S);
    pxCol(ctx, 1, bodyY - 4, 6, S);
    // Máu trên áo
    ctx.fillStyle = '#991b1b';
    px(ctx, -3, bodyY, S); px(ctx, 2, bodyY + 2, S); px(ctx, -1, bodyY + 4, 1);
    // Quần đen
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(-5, bodyY + 8, 10, 6);

    // Đầu cưa máy pixel art
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-5, headY - 4, 10, 12);
    // Phần kim loại tối
    ctx.fillStyle = '#292524';
    ctx.fillRect(-3, headY - 1, 10, 8);
    // Hàm kim loại
    ctx.fillStyle = '#52525b';
    ctx.fillRect(-5, headY + 4, 10, 4);
    // Răng nanh sắt
    ctx.fillStyle = '#fff';
    px(ctx, -4, headY + 6, S); px(ctx, -1, headY + 6, S); px(ctx, 2, headY + 6, S);
    // Răng cưa giữa
    ctx.fillStyle = '#000';
    pxCol(ctx, -4, headY + 4, 2, 1); pxCol(ctx, 0, headY + 4, 2, 1); pxCol(ctx, 3, headY + 4, 2, 1);
    // Lưỡi cưa nhô ra
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(5, headY - 3, 18, 4);
    // Răng cưa pixel
    ctx.fillStyle = '#1c1917';
    for (let i = 0; i < 4; i++) {
      px(ctx, 7 + i * 4, headY - 5, S);
      px(ctx, 7 + i * 4, headY + 1, S);
    }
    // Máu trên lưỡi cưa
    ctx.fillStyle = '#991b1b';
    px(ctx, 13, headY - 3, S); px(ctx, 17, headY - 2, S);
    // Mắt rỗng
    ctx.fillStyle = '#000';
    px(ctx, 1, headY, S);

  } else if (classId === 'ninja') {
    // === SÁT THỦ BÓNG ĐÊM ===
    // Đồ bó sát đen pixel
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-5, bodyY - 2, 10, 14);
    // Viền tím phát sáng
    ctx.shadowBlur = 6; ctx.shadowColor = '#a855f7';
    ctx.fillStyle = '#d8b4fe';
    pxCol(ctx, 0, bodyY - 1, 6, 1);
    ctx.shadowBlur = 0;
    // Nịt chéo pixel
    ctx.fillStyle = '#27272a';
    for (let i = 0; i < 5; i++) {
      px(ctx, -4 + i * 2, bodyY + i * 2, S);
    }

    // Khăn quàng bay pixel
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.moveTo(3, headY + 6);
    ctx.quadraticCurveTo(10, headY + 10, 14 - Math.sin(phase / 10) * 4, headY + 14);
    ctx.lineTo(16 - Math.sin(phase / 8) * 5, headY + 18);
    ctx.lineTo(10, headY + 8);
    ctx.fill();

    // Đầu quấn băng đen
    ctx.fillStyle = '#171717';
    ctx.fillRect(-5, headY - 2, 10, 12);
    // Mắt tím phát sáng dạng vết chém
    ctx.fillStyle = '#d8b4fe';
    ctx.shadowBlur = 8; ctx.shadowColor = '#a855f7';
    // Mắt hình tam giác sắc lẻm
    ctx.beginPath(); ctx.moveTo(-1, headY + 2); ctx.lineTo(3, headY + 1); ctx.lineTo(2, headY + 3); ctx.fill();
    ctx.shadowBlur = 0;

  } else if (classId === 'bomb_devil') {
    // === REZE (BOM DEVIL) ===
    // Áo trắng phần trên pixel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, bodyY - 4, 10, 8);
    // Nơ cổ pixel
    ctx.fillStyle = '#fff';
    px(ctx, -2, bodyY - 4, S); px(ctx, 2, bodyY - 4, S);
    px(ctx, 0, bodyY - 3, S);
    // Váy đen xoè nhẹ pixel
    ctx.fillStyle = '#171717';
    ctx.fillRect(-6, bodyY + 4, 12, 10);
    // Yếm sọc caro
    ctx.fillStyle = '#27272a';
    ctx.fillRect(-2, bodyY + 4, 4, 16);
    ctx.fillStyle = '#09090b';
    for (let i = 0; i < 3; i++) {
      pxRow(ctx, -2, bodyY + 6 + i * 4, 2, S);
    }
    pxCol(ctx, 0, bodyY + 4, 6, 1);

    // Đầu torpedo pixel
    ctx.fillStyle = '#171717';
    ctx.beginPath();
    ctx.moveTo(-4, headY + 4);
    ctx.quadraticCurveTo(-10, headY - 2, -7, headY - 8);
    ctx.quadraticCurveTo(1, headY - 10, 8, headY - 1);
    ctx.lineTo(7, headY + 4);
    ctx.fill();
    // Ngòi nổ pixel trên gáy
    ctx.fillStyle = '#3f3f46';
    px(ctx, -7, headY - 5, 3); px(ctx, -5, headY - 8, 3); px(ctx, -2, headY - 10, 3);
    // Mắt trắng rực pixel
    ctx.fillStyle = '#fff';
    px(ctx, 3, headY - 1, S); px(ctx, 5, headY - 2, S);
    // Miệng pixel
    px(ctx, 2, headY + 2, S); px(ctx, 4, headY + 1, S);
    // Tia lửa nhỏ
    ctx.fillStyle = '#f59e0b';
    px(ctx, -4, headY + 3, S);

  } else {
    // === DEFAULT ===
    ctx.fillStyle = '#09090b';
    ctx.fillRect(-6, bodyY - 2, 12, 14);
    // Đầu mặc định
    ctx.fillStyle = color;
    ctx.fillRect(-5, headY, 10, 12);
    ctx.fillStyle = '#ef4444';
    px(ctx, -2, headY + 4, S); px(ctx, 2, headY + 4, S);
  }

  // === TAY & VŨ KHÍ ===
  ctx.save();
  ctx.translate(0, bodyY + 2);
  ctx.rotate(armRot);

  // Tay pixel
  if (classId === 'knight') {
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(-1, -1, 4, 4);
  } else if (classId === 'ninja') {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(-1, -1, 3, 3);
  } else if (classId === 'mage') {
    ctx.fillStyle = '#581c87';
    ctx.fillRect(-1, -1, 4, 4);
  } else if (classId === 'archer') {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-1, -1, 3, 3);
  } else if (classId === 'rogue') {
    ctx.fillStyle = '#292524';
    ctx.fillRect(-1, -1, 3, 3);
  } else if (classId === 'summoner') {
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-1, -1, 3, 3);
  } else if (classId === 'paladin') {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-1, -1, 4, 4);
  } else if (classId === 'berserker') {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, -2, 6, 4);
  } else if (classId === 'bomb_devil') {
    ctx.fillStyle = '#171717';
    ctx.fillRect(-1, -1, 8, 4);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(-2, -2, 8, 5);
  }

  // Vũ khí đặc biệt Berserker
  if (classId === 'berserker') {
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#292524';
    ctx.fillRect(4, -3, 16, 4);
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(8, -2, 18, 2);
    ctx.fillStyle = '#1c1917';
    for (let i = 0; i < 3; i++) {
      px(ctx, 10 + i * 5, -4, S);
      px(ctx, 10 + i * 5, 0, S);
    }
  } else if (classId === 'bomb_devil') {
    ctx.fillStyle = '#0a0a0a';
    px(ctx, 3, -3, S); px(ctx, 5, 2, S);
  } else if (weapon) {
    ctx.translate(8, 0);
    ctx.fillStyle = weapon.color || '#94a3b8';

    if (weapon.id === 'kunai') {
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(3, -12); ctx.lineTo(0, -20); ctx.lineTo(-3, -12);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-1, -6, 2, 6);
    } else if (weapon.id === 'holy_mace' || weapon.id === 'heavy_axe') {
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -18, 4, 22);
      ctx.fillStyle = weapon.color || '#fff';
      if (weapon.id === 'holy_mace') {
        ctx.shadowBlur = 10; ctx.shadowColor = weapon.color || '#fff';
        ctx.beginPath(); ctx.arc(0, -20, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath(); ctx.moveTo(2, -15); ctx.lineTo(12, -22); ctx.lineTo(12, -8); ctx.fill();
      }
    } else if (weapon.id === 'blood_grimoire') {
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-6, -8, 12, 16);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(-4, -6, 8, 12);
      ctx.fillStyle = '#991b1b';
      px(ctx, -2, -4, S); px(ctx, 0, -4, S);
      px(ctx, -2, 0, S); px(ctx, 0, 0, S);
    } else if (weapon.id === 'bomb_detonator') {
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(-3, -6, 6, 12);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -8, 4, 2);
      if (atkProgress < 0.2) {
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(-2, -7, 4, 1);
      }
    } else if (weapon.id === 'magic_staff') {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-1, -4, 3, 24);
      ctx.strokeStyle = '#27272a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(2, 4); ctx.lineTo(-1, 8); ctx.stroke();
      const pulse = Math.abs(Math.sin(performance.now() / 200)) * 2;
      ctx.shadowColor = '#d8b4fe'; ctx.shadowBlur = 15 + pulse;
      ctx.fillStyle = '#d8b4fe';
      ctx.beginPath(); ctx.arc(1, -6 - pulse / 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, -7 - pulse / 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (weapon.type === 'melee') {
      ctx.rotate(-Math.PI / 4);
      // Pixel art blade
      const bladeGrad = ctx.createLinearGradient(-3, 0, 3, 0);
      bladeGrad.addColorStop(0, '#64748b');
      bladeGrad.addColorStop(0.5, '#ffffff');
      bladeGrad.addColorStop(1, '#475569');
      ctx.fillStyle = bladeGrad;
      ctx.shadowBlur = weapon.upgradeLevel ? 10 : 0;
      ctx.shadowColor = weapon.upgradeLevel ? '#fbbf24' : 'transparent';
      ctx.beginPath();
      ctx.moveTo(-3, 0); ctx.lineTo(-4, -22); ctx.lineTo(0, -30); ctx.lineTo(4, -22); ctx.lineTo(3, 0);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Sống kiếm
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-1, -28, 2, 28);
      // Cường hoá
      if (weapon.upgradeLevel && weapon.upgradeLevel > 0) {
        ctx.fillStyle = '#f87171';
        ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-2, -26); ctx.lineTo(2, -26); ctx.fill();
      }
      // Chuôi pixel
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, 0, 4, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, -2, 12, 3);
      ctx.fillStyle = '#f59e0b';
      px(ctx, -1, 8, 3);
    } else {
      // Súng pixel art
      ctx.fillStyle = '#292524';
      ctx.fillRect(-2, 0, 5, 8);
      const gunGrad = ctx.createLinearGradient(0, -4, 0, 2);
      gunGrad.addColorStop(0, '#71717a');
      gunGrad.addColorStop(1, '#3f3f46');
      ctx.fillStyle = gunGrad;
      ctx.fillRect(0, -4, 18, 5);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(18, -3, 3, 3);
      ctx.fillRect(6, -6, 4, 2);
    }
  }
  ctx.restore();

  // === TAY TRÁI ===
  if (isKnightSkill && weapon) {
    ctx.save();
    ctx.translate(0, bodyY + 2);
    ctx.rotate(armRot + Math.PI);
    ctx.fillStyle = color;
    ctx.fillRect(-2, -2, 8, 5);
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
    ctx.save();
    ctx.translate(-5, bodyY + 2);
    ctx.rotate(-armRot);

    if (classId === 'knight') {
      ctx.fillStyle = '#3f3f46'; ctx.fillRect(-1, -1, 4, 4);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#52525b'; ctx.fillRect(2, -2, 16, 4);
      ctx.fillStyle = '#7f1d1d'; ctx.fillRect(10, -2, 4, 2);
      ctx.fillStyle = '#27272a'; ctx.fillRect(0, -4, 2, 8);
    } else if (classId === 'berserker') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, -2, 6, 4);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = '#292524'; ctx.fillRect(4, -3, 16, 4);
      ctx.fillStyle = '#d4d4d8'; ctx.fillRect(8, -2, 18, 2);
      ctx.fillStyle = '#1c1917';
      for (let i = 0; i < 3; i++) {
        px(ctx, 10 + i * 5, -4, S);
        px(ctx, 10 + i * 5, 0, S);
      }
    } else if (classId === 'ninja') {
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-1, -1, 3, 3);
      ctx.translate(6, 0);
      ctx.fillStyle = '#171717'; ctx.fillRect(-2, -1, 4, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.moveTo(2, -1); ctx.lineTo(8, 0); ctx.lineTo(2, 1); ctx.fill();
      ctx.shadowBlur = 4; ctx.shadowColor = '#a855f7';
      ctx.fillStyle = '#a855f7'; px(ctx, 0, 0, 1);
      ctx.shadowBlur = 0;
    } else if (classId === 'bomb_devil') {
      ctx.fillStyle = '#171717';
      ctx.fillRect(-1, -1, 8, 4);
      ctx.fillStyle = '#0a0a0a';
      px(ctx, 2, -3, S); px(ctx, 4, 2, S);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(-3, -2, 7, 5);
    }
    ctx.restore();
  }

  ctx.restore();
}
