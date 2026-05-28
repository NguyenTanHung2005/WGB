export const GAU_SAM_SET_PALETTE = {
  // Lông gấu trắng — gradient 3 tông
  fur_light: '#f0f0f5',    // Lông sáng nhất (bụng, ngực)
  fur_mid: '#c8ccd0',      // Lông trung (thân, lưng)
  fur_dark: '#8b9098',     // Lông tối (bóng, nếp gấp)

  // Gai băng tinh thể
  ice_bright: '#7dd3fc',   // Xanh sáng chóp gai
  ice_mid: '#38bdf8',      // Xanh trung thân gai
  ice_dark: '#0369a1',     // Xanh tối gốc gai
  ice_glow: '#bae6fd',     // Glow viền gai

  // Sấm sét
  lightning: '#fde047',     // Vàng sét chính
  lightning_core: '#ffffff',// Lõi trắng sáng
  lightning_outer: '#f59e0b',// Viền ngoài sét

  // Chi tiết
  claw: '#1c1917',          // Móng vuốt đen
  nose: '#292524',          // Mũi đen
  mouth_inner: '#7f1d1d',  // Trong miệng đỏ tối
  fang: '#e7e5e4',         // Răng nanh trắng ngà
  eye_glow: '#60a5fa',     // Mắt xanh phase 1
  eye_rage: '#ef4444',     // Mắt đỏ phase 3
  scar: '#6b7280',         // Sẹo chiến

  highlight: '#ffffff',
  shadow: '#0c0a09',
};

/**
 * Tạo Offscreen Canvas 2000x2000 cho Boss "Gấu Sấm Sét"
 * Gồm 5 hàng (rows) Animation:
 * Row 0: IDLE (4 frames) — thở phập phồng, gai lấp lánh, sét mini
 * Row 1: ATTACK (8 frames) — anticipation → strike → recovery
 * Row 2: HURT (3 frames) — rung lắc + flash
 * Row 3: DEATH (8 frames) — gai vỡ, tan rã pixel
 * Row 4: SPECIAL (10 frames) — đứng 2 chân, triệu hồi sét khổng lồ
 */
export function generateGauSamSetSpriteSheet(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  const W = 6000;
  const H = 2000;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d')!;
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  // ===== UTILITY FUNCTIONS =====

  /** Vẽ ellipse có gradient radial */
  const fillEllipseGrad = (
    cx: number, cy: number, rx: number, ry: number,
    colorInner: string, colorOuter: string, rotation = 0
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    const grad = ctx.createRadialGradient(0, -ry * 0.2, 0, 0, 0, Math.max(rx, ry));
    grad.addColorStop(0, colorInner);
    grad.addColorStop(1, colorOuter);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /** Vẽ tia sét procedural với nhánh phụ */
  const drawLightningBolt = (
    startX: number, startY: number, endX: number, endY: number,
    width: number, branches: number, seed: number
  ) => {
    const seededRandom = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297) * 49297;
      return x - Math.floor(x);
    };

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer glow
    ctx.strokeStyle = GAU_SAM_SET_PALETTE.lightning_outer;
    ctx.lineWidth = width + 6;
    ctx.shadowBlur = 25;
    ctx.shadowColor = GAU_SAM_SET_PALETTE.lightning;
    ctx.globalAlpha = 0.6;
    drawBoltPath(startX, startY, endX, endY, seededRandom, 0);
    ctx.stroke();

    // Main bolt
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = GAU_SAM_SET_PALETTE.lightning;
    ctx.lineWidth = width + 2;
    ctx.shadowBlur = 15;
    drawBoltPath(startX, startY, endX, endY, seededRandom, 0);
    ctx.stroke();

    // Inner core (white)
    ctx.globalAlpha = 1;
    ctx.strokeStyle = GAU_SAM_SET_PALETTE.lightning_core;
    ctx.lineWidth = width;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#fff';
    drawBoltPath(startX, startY, endX, endY, seededRandom, 0);
    ctx.stroke();

    // Branches
    for (let b = 0; b < branches; b++) {
      const t = 0.2 + seededRandom(b * 100) * 0.6;
      const bx = startX + (endX - startX) * t + (seededRandom(b * 200) - 0.5) * 30;
      const by = startY + (endY - startY) * t + (seededRandom(b * 300) - 0.5) * 30;
      const bex = bx + (seededRandom(b * 400) - 0.5) * 80;
      const bey = by + seededRandom(b * 500) * 60;

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = GAU_SAM_SET_PALETTE.lightning;
      ctx.lineWidth = width * 0.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = GAU_SAM_SET_PALETTE.lightning;
      drawBoltPath(bx, by, bex, bey, seededRandom, b * 1000);
      ctx.stroke();
    }

    ctx.restore();
  };

  /** Path zigzag cho tia sét */
  const drawBoltPath = (
    sx: number, sy: number, ex: number, ey: number,
    rng: (i: number) => number, offset: number
  ) => {
    const segments = 6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const mx = sx + (ex - sx) * t + (rng(offset + i) - 0.5) * 40;
      const my = sy + (ey - sy) * t + (rng(offset + i + 50) - 0.5) * 20;
      ctx.lineTo(mx, my);
    }
  };

  /** Vẽ gai băng tinh thể */
  const drawIceSpike = (cx: number, cy: number, w: number, h: number, angle: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Gốc gai (dark)
    const grad = ctx.createLinearGradient(0, 0, 0, -h);
    grad.addColorStop(0, GAU_SAM_SET_PALETTE.ice_dark);
    grad.addColorStop(0.5, GAU_SAM_SET_PALETTE.ice_mid);
    grad.addColorStop(0.85, GAU_SAM_SET_PALETTE.ice_bright);
    grad.addColorStop(1, GAU_SAM_SET_PALETTE.ice_glow);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(-w * 0.15, -h * 0.7);
    ctx.lineTo(0, -h);  // Chóp nhọn
    ctx.lineTo(w * 0.15, -h * 0.7);
    ctx.lineTo(w / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Glow viền
    ctx.strokeStyle = GAU_SAM_SET_PALETTE.ice_glow;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.stroke();

    // Highlight specular bên trái
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-w * 0.4, 0);
    ctx.lineTo(-w * 0.1, -h * 0.65);
    ctx.lineTo(0, -h * 0.6);
    ctx.lineTo(-w * 0.15, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  /** Vẽ móng vuốt */
  const drawClaw = (cx: number, cy: number, size: number, angle: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = GAU_SAM_SET_PALETTE.claw;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, 0);
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.6, 0, -size);
    ctx.quadraticCurveTo(size * 0.1, -size * 0.6, size * 0.3, 0);
    ctx.closePath();
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(-size * 0.15, -size * 0.2);
    ctx.quadraticCurveTo(0, -size * 0.8, size * 0.05, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /** Vẽ đầu gấu chi tiết */
  const drawBearHead = (hx: number, hy: number, scale: number, mouthOpen: number, eyeColor: string) => {
    ctx.save();
    ctx.translate(hx, hy);

    const s = scale;

    // Tai trái
    fillEllipseGrad(-55 * s, -70 * s, 28 * s, 32 * s, GAU_SAM_SET_PALETTE.fur_mid, GAU_SAM_SET_PALETTE.fur_dark);
    fillEllipseGrad(-55 * s, -68 * s, 16 * s, 18 * s, GAU_SAM_SET_PALETTE.mouth_inner, '#44403c');

    // Tai phải
    fillEllipseGrad(55 * s, -70 * s, 28 * s, 32 * s, GAU_SAM_SET_PALETTE.fur_mid, GAU_SAM_SET_PALETTE.fur_dark);
    fillEllipseGrad(55 * s, -68 * s, 16 * s, 18 * s, GAU_SAM_SET_PALETTE.mouth_inner, '#44403c');

    // Khuôn mặt chính (tròn lớn)
    fillEllipseGrad(0, -20 * s, 75 * s, 80 * s, GAU_SAM_SET_PALETTE.fur_light, GAU_SAM_SET_PALETTE.fur_mid);

    // Vùng mõm (sáng hơn, nhô ra)
    fillEllipseGrad(0, 15 * s, 40 * s, 30 * s, GAU_SAM_SET_PALETTE.fur_light, GAU_SAM_SET_PALETTE.fur_mid);

    // Mũi
    fillEllipseGrad(0, 5 * s, 14 * s, 10 * s, '#1c1917', GAU_SAM_SET_PALETTE.nose);
    // Highlight mũi
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-4 * s, 2 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Miệng
    if (mouthOpen > 0) {
      ctx.fillStyle = GAU_SAM_SET_PALETTE.mouth_inner;
      ctx.beginPath();
      ctx.ellipse(0, 22 * s, 25 * s * mouthOpen, 15 * s * mouthOpen, 0, 0, Math.PI);
      ctx.fill();

      // Răng nanh
      ctx.fillStyle = GAU_SAM_SET_PALETTE.fang;
      // Nanh trái
      ctx.beginPath();
      ctx.moveTo(-18 * s, 15 * s);
      ctx.lineTo(-14 * s, 30 * s * mouthOpen);
      ctx.lineTo(-10 * s, 15 * s);
      ctx.fill();
      // Nanh phải
      ctx.beginPath();
      ctx.moveTo(18 * s, 15 * s);
      ctx.lineTo(14 * s, 30 * s * mouthOpen);
      ctx.lineTo(10 * s, 15 * s);
      ctx.fill();
    } else {
      // Miệng khép
      ctx.strokeStyle = GAU_SAM_SET_PALETTE.nose;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-15 * s, 18 * s);
      ctx.quadraticCurveTo(0, 24 * s, 15 * s, 18 * s);
      ctx.stroke();
    }

    // Mắt trái
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = eyeColor;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(-30 * s, -25 * s, 10 * s, 8 * s, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Đồng tử
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(-30 * s, -25 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-33 * s, -28 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Mắt phải
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = eyeColor;
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(30 * s, -25 * s, 10 * s, 8 * s, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(30 * s, -25 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(27 * s, -28 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Sẹo chiến trên mặt
    ctx.strokeStyle = GAU_SAM_SET_PALETTE.scar;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-45 * s, -40 * s);
    ctx.lineTo(-20 * s, -15 * s);
    ctx.stroke();

    ctx.restore();
  };

  /** Vẽ cánh tay gấu với móng vuốt */
  const drawBearArm = (
    ax: number, ay: number, s: number,
    armAngle: number, isLeft: boolean, showLightning: boolean, seed: number
  ) => {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(armAngle);

    const dir = isLeft ? -1 : 1;

    // Vai (cơ bắp lớn)
    fillEllipseGrad(0, 0, 65 * s, 50 * s, GAU_SAM_SET_PALETTE.fur_light, GAU_SAM_SET_PALETTE.fur_dark);

    // Cánh tay trên
    fillEllipseGrad(0, 70 * s, 45 * s, 70 * s, GAU_SAM_SET_PALETTE.fur_mid, GAU_SAM_SET_PALETTE.fur_dark);

    // Bàn tay / bàn chân
    fillEllipseGrad(0, 140 * s, 40 * s, 30 * s, GAU_SAM_SET_PALETTE.fur_dark, GAU_SAM_SET_PALETTE.shadow);

    // 4 móng vuốt
    for (let c = 0; c < 4; c++) {
      const cx = (-25 + c * 17) * s;
      const cy = 165 * s;
      drawClaw(cx, cy, 22 * s, (c - 1.5) * 0.15 * dir);
    }

    // Hiệu ứng sấm sét trên tay
    if (showLightning) {
      drawLightningBolt(
        -10 * s, 30 * s, 15 * s, 155 * s,
        3, 2, seed
      );
    }

    ctx.restore();
  };

  // ===== MAIN FRAME DRAWING =====

  const drawFrame = (frameIndex: number, rowY: number, framesCount: number, type: string, time: number) => {
    const fw = W / framesCount;
    const fh = 400;
    const ox = frameIndex * fw + fw / 2;
    const oy = rowY + fh - 20;

    ctx.save();
    ctx.translate(ox, oy);

    // Animation parameters
    let bodySquash = 1.0;   // Squash-stretch Y
    let bodyStretch = 1.0;  // Squash-stretch X
    let floatY = 0;
    let jitter = 0;
    let leftArmAngle = 0.3;
    let rightArmAngle = -0.3;
    let mouthOpen = 0;
    let eyeColor = GAU_SAM_SET_PALETTE.eye_glow;
    let showArmLightning = false;
    let globalAlpha = 1;
    let headOffsetY = 0;

    const seed = frameIndex * 137 + rowY;

    switch (type) {
      case 'idle': {
        const breath = Math.sin(time);
        bodySquash = 1.0 + breath * 0.03;
        bodyStretch = 1.0 - breath * 0.02;
        floatY = breath * 8;
        leftArmAngle = 0.3 + Math.sin(time * 0.7) * 0.05;
        rightArmAngle = -0.3 - Math.sin(time * 0.7 + 1) * 0.05;
        headOffsetY = breath * 4;
        break;
      }
      case 'attack': {
        const phase = time / Math.PI;
        if (phase < 0.4) {
          // Anticipation — cúi lưng, kéo tay lại
          bodySquash = 1.1;
          bodyStretch = 0.9;
          leftArmAngle = 0.8;
          rightArmAngle = -0.8;
          floatY = 15;
          headOffsetY = 20;
        } else if (phase < 0.7) {
          // Strike — vung tay mạnh
          bodySquash = 0.85;
          bodyStretch = 1.15;
          leftArmAngle = -0.6;
          rightArmAngle = 0.6;
          floatY = -20;
          mouthOpen = 1;
          eyeColor = GAU_SAM_SET_PALETTE.eye_rage;
          showArmLightning = true;
          headOffsetY = -15;
        } else {
          // Recovery
          bodySquash = 1.0;
          bodyStretch = 1.0;
          leftArmAngle = 0.2;
          rightArmAngle = -0.2;
          floatY = 5;
          headOffsetY = 5;
        }
        break;
      }
      case 'hurt': {
        jitter = (Math.sin(time * 20) * 15);
        mouthOpen = 0.5;
        eyeColor = '#fff';
        headOffsetY = 10;
        break;
      }
      case 'death': {
        const deathProgress = time / Math.PI;
        globalAlpha = Math.max(0, 1 - deathProgress * 0.9);
        floatY = deathProgress * 40;
        bodySquash = 1.0 + deathProgress * 0.3;
        bodyStretch = 1.0 - deathProgress * 0.2;
        headOffsetY = deathProgress * 30;
        break;
      }
      case 'special': {
        const phase = time / Math.PI;
        // Đứng dậy 2 chân, giơ tay lên trời
        bodySquash = 0.85;
        bodyStretch = 1.1;
        floatY = -30;
        leftArmAngle = -1.2 - Math.sin(time * 3) * 0.2;
        rightArmAngle = 1.2 + Math.sin(time * 3 + 1) * 0.2;
        mouthOpen = 0.8 + Math.sin(time * 4) * 0.2;
        eyeColor = GAU_SAM_SET_PALETTE.lightning;
        showArmLightning = true;
        headOffsetY = -25 + Math.sin(time * 2) * 5;

        // Sét lớn đánh xuống khi hit frame
        if (phase > 0.5) {
          drawLightningBolt(
            -50 + Math.sin(seed) * 30, -350,
            (Math.sin(seed * 2) - 0.5) * 100, 100,
            5, 3, seed + frameIndex * 7
          );
        }
        break;
      }
    }

    ctx.globalAlpha = globalAlpha;
    ctx.translate(jitter, floatY);

    // === VẼ BÓNG MẶT ĐẤT ===
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 130 * bodyStretch, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.scale(bodyStretch, bodySquash);

    // === VẼ CHÂN (phía sau) ===
    fillEllipseGrad(-60, -15, 50, 35, GAU_SAM_SET_PALETTE.fur_dark, GAU_SAM_SET_PALETTE.shadow);
    fillEllipseGrad(60, -15, 50, 35, GAU_SAM_SET_PALETTE.fur_dark, GAU_SAM_SET_PALETTE.shadow);

    // === VẼ THÂN CHÍNH (cơ bắp, nhiều lớp) ===
    // Lớp bóng bên ngoài
    fillEllipseGrad(0, -140, 145, 170, GAU_SAM_SET_PALETTE.fur_dark, GAU_SAM_SET_PALETTE.shadow);
    // Lớp lông chính
    fillEllipseGrad(0, -145, 135, 160, GAU_SAM_SET_PALETTE.fur_mid, GAU_SAM_SET_PALETTE.fur_dark);
    // Lớp bụng sáng
    fillEllipseGrad(0, -120, 80, 110, GAU_SAM_SET_PALETTE.fur_light, GAU_SAM_SET_PALETTE.fur_mid);

    // Cơ ngực (2 bên)
    fillEllipseGrad(-55, -160, 50, 60, GAU_SAM_SET_PALETTE.fur_mid, GAU_SAM_SET_PALETTE.fur_dark, -0.2);
    fillEllipseGrad(55, -160, 50, 60, GAU_SAM_SET_PALETTE.fur_mid, GAU_SAM_SET_PALETTE.fur_dark, 0.2);

    // Lông texture (stripes nhỏ)
    ctx.strokeStyle = GAU_SAM_SET_PALETTE.fur_dark;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 12; i++) {
      const angle = -Math.PI * 0.8 + i * (Math.PI * 0.6 / 12);
      const len = 100 + Math.sin(i * 2) * 30;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 60, -140 + Math.sin(angle) * 60);
      ctx.lineTo(Math.cos(angle) * len, -140 + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.globalAlpha = globalAlpha;

    // === VẼ GAI BĂNG TRÊN LƯNG (7-9 gai) ===
    const spikeCount = 8;
    for (let i = 0; i < spikeCount; i++) {
      const t = i / (spikeCount - 1);
      const angle = Math.PI * 0.85 + t * Math.PI * 0.3;
      const dist = 120 + Math.sin(i * 1.5) * 15;
      const sx = Math.cos(angle) * dist;
      const sy = -150 + Math.sin(angle) * dist;
      const spikeH = 50 + Math.sin(i * 2.3 + 1) * 25;
      const spikeW = 14 + Math.sin(i * 1.7) * 6;
      const spikeAngle = angle + Math.PI / 2;

      // Glow dưới chân gai
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = GAU_SAM_SET_PALETTE.ice_glow;
      drawIceSpike(sx, sy, spikeW, spikeH, spikeAngle);
      ctx.restore();
    }

    ctx.restore(); // Restore scale

    // === VẼ CÁNH TAY ===
    drawBearArm(-140, -100, 0.9, leftArmAngle, true, showArmLightning, seed);
    drawBearArm(140, -100, 0.9, rightArmAngle, false, showArmLightning, seed + 500);

    // === VẼ ĐẦU GẤU ===
    drawBearHead(0, -260 + headOffsetY, 1.0, mouthOpen, eyeColor);

    // === HIỆU ỨNG SẤM SÉT QUANH THÂN (Passive) ===
    if (type !== 'death' && type !== 'hurt') {
      // Mini lightning arcs quanh thân
      const arcCount = type === 'special' ? 4 : 1;
      for (let a = 0; a < arcCount; a++) {
        const lseed = seed + a * 333;
        const seededR = Math.sin(lseed * 9301) * 49297;
        const r = seededR - Math.floor(seededR);
        if (r > 0.5) {
          const sx2 = (r - 0.5) * 400 - 100;
          const sy2 = -100 - r * 200;
          drawLightningBolt(sx2, sy2, sx2 + (r - 0.5) * 60, sy2 - 40, 2, 1, lseed);
        }
      }
    }

    // === HURT FLASH OVERLAY ===
    if (type === 'hurt') {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, -150, 180, 200, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // === DEATH PARTICLES ===
    if (type === 'death') {
      const deathProgress = time / Math.PI;
      const particleCount = Math.floor(deathProgress * 30);
      for (let p = 0; p < particleCount; p++) {
        const px = (Math.sin(p * 73 + seed) * 200);
        const py = -150 + (Math.cos(p * 47 + seed) * 150) - deathProgress * p * 3;
        const pr = 3 + Math.sin(p) * 2;
        const colors = [GAU_SAM_SET_PALETTE.ice_mid, GAU_SAM_SET_PALETTE.fur_light, GAU_SAM_SET_PALETTE.lightning];
        ctx.fillStyle = colors[p % 3];
        ctx.globalAlpha = Math.max(0, 0.8 - deathProgress * 0.5);
        ctx.fillRect(px - pr / 2, py - pr / 2, pr, pr);
      }
    }

    ctx.restore();
  };

  // === GENERATE ALL ROWS ===
  // Row 0: IDLE (4 frames)
  for (let i = 0; i < 4; i++) drawFrame(i, 0, 4, 'idle', i * Math.PI / 2);
  // Row 1: ATTACK (8 frames)
  for (let i = 0; i < 8; i++) drawFrame(i, 400, 8, 'attack', i * Math.PI / 4);
  // Row 2: HURT (3 frames)
  for (let i = 0; i < 3; i++) drawFrame(i, 800, 3, 'hurt', i * Math.PI / 1.5);
  // Row 3: DEATH (8 frames)
  for (let i = 0; i < 8; i++) drawFrame(i, 1200, 8, 'death', i * Math.PI / 4);
  // Row 4: SPECIAL SKILL (10 frames)
  for (let i = 0; i < 10; i++) drawFrame(i, 1600, 10, 'special', i * Math.PI / 5);

  return canvas;
}
