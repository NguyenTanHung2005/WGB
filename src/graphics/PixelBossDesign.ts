export const COLORS = {
  // Thân rồng — gradient 3 tông
  body_dark: '#0f0f1a',      // Vảy rồng đen hắc
  body_mid: '#1e1b3a',       // Vảy ánh tím
  body_light: '#2d2854',     // Bụng/cổ sáng hơn
  scale_accent: '#4c1d95',   // Viền vảy tím royal

  // Cánh
  wing_bone: '#44403c',      // Xương cánh xám tối
  wing_membrane: '#3b0764',  // Màng cánh tím tối
  wing_vein: '#581c87',      // Gân tĩnh mạch cánh
  wing_glow: '#7c3aed',      // Cánh phát sáng (phase 3)

  // Mắt
  eye_glow: '#ef4444',       // Mắt đỏ phase 1
  eye_rage: '#fbbf24',       // Mắt vàng phase 3

  // Lửa — 5 lớp
  fire_core: '#fef3c7',      // Lõi lửa trắng vàng
  fire_bright: '#fde047',    // Lửa sáng vàng
  fire_mid: '#f97316',       // Lửa cam
  fire_outer: '#dc2626',     // Lửa ngoài đỏ
  fire_smoke: '#78350f',     // Khói nâu tối

  // Chi tiết
  horn: '#d6d3d1',           // Sừng trắng xám ngà
  fang: '#e7e5e4',           // Răng nanh trắng ngà
  claw: '#1c1917',           // Móng vuốt đen
  spine: '#52525b',          // Gai xương sống lưng

  highlight: '#ffffff',
  shadow: '#000000',
};

/**
 * Tạo Offscreen Canvas 2000x2000 cho Boss "Hắc Long Vương" (Dark Dragon Lord)
 * 5 hàng animation:
 * Row 0: IDLE (4 frames) — thở nhẹ, mắt sáng, đuôi sway
 * Row 1: FLY (6 frames) — đập cánh mạnh, bay cao
 * Row 2: ATTACK (8 frames) — anticipation → fire breath → recovery
 * Row 3: HURT (3 frames) — rung lắc + flash
 * Row 4: DEATH (6 frames) — rơi xuống, cánh gãy, tan rã
 */
export function generateBossSpriteSheet(): HTMLCanvasElement {
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

  const fillEllipseGrad = (
    cx: number, cy: number, rx: number, ry: number,
    inner: string, outer: string, rot = 0
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const g = ctx.createRadialGradient(0, -ry * 0.2, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /** Seeded random cho deterministic sprites */
  const seededRng = (seed: number, i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 49297;
    return x - Math.floor(x);
  };

  /** Vẽ sừng rồng cong */
  const drawHorn = (hx: number, hy: number, length: number, curve: number, angle: number) => {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -length);
    grad.addColorStop(0, COLORS.spine);
    grad.addColorStop(0.4, COLORS.horn);
    grad.addColorStop(1, COLORS.highlight);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(-4 + curve, -length * 0.6, curve * 1.5, -length);
    ctx.quadraticCurveTo(curve * 0.5, -length * 0.55, 6, 0);
    ctx.closePath();
    ctx.fill();

    // Specular highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.quadraticCurveTo(curve * 0.3, -length * 0.6, curve * 1.2, -length * 0.9);
    ctx.stroke();

    ctx.restore();
  };

  /** Vẽ mắt rồng reptile (slit pupil) */
  const drawDragonEye = (ex: number, ey: number, size: number, color: string, lookAngle: number) => {
    ctx.save();
    ctx.translate(ex, ey);

    // Outer glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;

    // Sclera (lòng trắng hơi vàng)
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.7, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Iris (mống mắt)
    const ix = Math.cos(lookAngle) * size * 0.15;
    const iy = Math.sin(lookAngle) * size * 0.1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(ix, iy, size * 0.65, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slit pupil (đồng tử khe dọc — reptile)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(ix, iy, size * 0.12, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight specular
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(ix - size * 0.2, iy - size * 0.15, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  /** Vẽ đầu rồng reptile chi tiết */
  const drawDragonHead = (
    hx: number, hy: number, scale: number,
    mouthOpen: number, eyeColor: string, neckGlow: number
  ) => {
    ctx.save();
    ctx.translate(hx, hy);

    const s = scale;

    // Cổ (nối thân)
    fillEllipseGrad(0, 40 * s, 35 * s, 50 * s, COLORS.body_light, COLORS.body_dark);

    // Glow cổ khi chuẩn bị phun lửa
    if (neckGlow > 0) {
      ctx.save();
      ctx.globalAlpha = neckGlow * 0.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.fire_mid;
      fillEllipseGrad(0, 30 * s, 25 * s, 40 * s, COLORS.fire_mid, 'transparent');
      ctx.restore();
    }

    // Hộp sọ dài (reptile/croc shape)
    fillEllipseGrad(0, -15 * s, 55 * s, 45 * s, COLORS.body_mid, COLORS.body_dark);

    // Mõm dài nhô ra
    fillEllipseGrad(-35 * s, 5 * s, 35 * s, 22 * s, COLORS.body_mid, COLORS.body_dark);

    // Vảy trên đỉnh đầu
    ctx.fillStyle = COLORS.scale_accent;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      const sx = (-15 + i * 8) * s;
      const sy = (-30 + Math.abs(i - 2) * 3) * s;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 5 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Lỗ mũi
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.ellipse(-55 * s, 0, 4 * s, 3 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-48 * s, -2 * s, 3 * s, 2.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Miệng
    if (mouthOpen > 0.1) {
      // Hàm dưới
      ctx.save();
      ctx.translate(-35 * s, 12 * s);
      ctx.rotate(mouthOpen * 0.25);
      fillEllipseGrad(0, 8 * s * mouthOpen, 30 * s, 12 * s * mouthOpen, COLORS.body_dark, COLORS.shadow);

      // Bên trong miệng (đỏ tối)
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.ellipse(0, 4 * s * mouthOpen, 22 * s, 8 * s * mouthOpen, 0, 0, Math.PI);
      ctx.fill();

      // Răng nanh trên
      ctx.fillStyle = COLORS.fang;
      for (let t = 0; t < 5; t++) {
        const tx = (-18 + t * 9) * s;
        ctx.beginPath();
        ctx.moveTo(tx - 2 * s, -2 * s);
        ctx.lineTo(tx, 8 * s * mouthOpen);
        ctx.lineTo(tx + 2 * s, -2 * s);
        ctx.fill();
      }

      // Răng nanh dưới (ngược lên)
      for (let t = 0; t < 4; t++) {
        const tx = (-14 + t * 9) * s;
        ctx.beginPath();
        ctx.moveTo(tx - 1.5 * s, 12 * s * mouthOpen);
        ctx.lineTo(tx, 4 * s * mouthOpen);
        ctx.lineTo(tx + 1.5 * s, 12 * s * mouthOpen);
        ctx.fill();
      }

      ctx.restore();
    } else {
      // Miệng khép — vẫn lộ vài răng
      ctx.strokeStyle = COLORS.shadow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-60 * s, 10 * s);
      ctx.quadraticCurveTo(-35 * s, 15 * s, -10 * s, 10 * s);
      ctx.stroke();

      // Răng lộ
      ctx.fillStyle = COLORS.fang;
      ctx.beginPath();
      ctx.moveTo(-50 * s, 10 * s);
      ctx.lineTo(-48 * s, 16 * s);
      ctx.lineTo(-46 * s, 10 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-25 * s, 12 * s);
      ctx.lineTo(-23 * s, 18 * s);
      ctx.lineTo(-21 * s, 12 * s);
      ctx.fill();
    }

    // 2 Sừng cong ngược
    drawHorn(15 * s, -35 * s, 55 * s, 20, -0.4);
    drawHorn(30 * s, -30 * s, 45 * s, 15, -0.2);

    // Mắt trái (chính)
    drawDragonEye(-20 * s, -18 * s, 9 * s, eyeColor, 0);

    // Mắt phải (xa hơn — perspective)
    drawDragonEye(10 * s, -20 * s, 6 * s, eyeColor, 0.3);

    ctx.restore();
  };

  /** Vẽ cánh dơi (bat-wing) với xương + màng */
  const drawDragonWing = (
    wx: number, wy: number, scale: number,
    flapAngle: number, isLeft: boolean, glowIntensity: number
  ) => {
    ctx.save();
    ctx.translate(wx, wy);
    if (!isLeft) ctx.scale(-1, 1);
    ctx.rotate(flapAngle);

    const s = scale;

    // 3 đốt xương cánh
    const bones = [
      { x: 0, y: 0, ex: -80 * s, ey: -60 * s },
      { x: -80 * s, y: -60 * s, ex: -160 * s, ey: -30 * s },
      { x: -160 * s, y: -30 * s, ex: -220 * s, ey: 10 * s },
    ];

    // Màng cánh (membrane) — filled polygon
    ctx.fillStyle = COLORS.wing_membrane;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-80 * s, -60 * s);
    ctx.lineTo(-160 * s, -30 * s);
    ctx.lineTo(-220 * s, 10 * s);
    ctx.lineTo(-200 * s, 60 * s);
    ctx.lineTo(-140 * s, 50 * s);
    ctx.lineTo(-60 * s, 40 * s);
    ctx.lineTo(0, 30 * s);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Gân tĩnh mạch (veins)
    ctx.strokeStyle = COLORS.wing_vein;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    // Gân dọc
    ctx.beginPath();
    ctx.moveTo(-40 * s, -10 * s);
    ctx.quadraticCurveTo(-60 * s, 10 * s, -80 * s, 45 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-120 * s, -20 * s);
    ctx.quadraticCurveTo(-130 * s, 15 * s, -150 * s, 50 * s);
    ctx.stroke();
    // Gân ngang
    ctx.beginPath();
    ctx.moveTo(-60 * s, 10 * s);
    ctx.lineTo(-140 * s, 20 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Viền rách (tattered edge)
    ctx.strokeStyle = COLORS.wing_membrane;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let t = 0; t < 4; t++) {
      const tx = (-180 + t * 30) * s;
      const ty = (55 + Math.sin(t * 2) * 8) * s;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 5 * s, ty + 12 * s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Xương cánh (bone struts)
    ctx.strokeStyle = COLORS.wing_bone;
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    bones.forEach(b => {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.ex, b.ey);
      ctx.stroke();
    });

    // Khớp xương
    ctx.fillStyle = COLORS.wing_bone;
    bones.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5 * s, 0, Math.PI * 2);
      ctx.fill();
    });

    // Wing glow (phase 3)
    if (glowIntensity > 0) {
      ctx.save();
      ctx.globalAlpha = glowIntensity * 0.3;
      ctx.shadowBlur = 25;
      ctx.shadowColor = COLORS.wing_glow;
      ctx.strokeStyle = COLORS.wing_glow;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-80 * s, -60 * s);
      ctx.lineTo(-160 * s, -30 * s);
      ctx.lineTo(-220 * s, 10 * s);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };

  /** Vẽ gai xương sống lưng */
  const drawSpine = (sx: number, sy: number, height: number, angle: number) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -height);
    grad.addColorStop(0, COLORS.body_dark);
    grad.addColorStop(0.5, COLORS.spine);
    grad.addColorStop(1, COLORS.horn);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(0, -height);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  /** Vẽ chân rồng reptile */
  const drawDragonLeg = (lx: number, ly: number, scale: number, angle: number) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);

    const s = scale;

    // Đùi
    fillEllipseGrad(0, 0, 20 * s, 35 * s, COLORS.body_mid, COLORS.body_dark);
    // Ống chân
    fillEllipseGrad(0, 40 * s, 12 * s, 25 * s, COLORS.body_dark, COLORS.shadow);
    // Bàn chân
    fillEllipseGrad(0, 65 * s, 18 * s, 10 * s, COLORS.body_dark, COLORS.shadow);

    // 3 móng vuốt
    for (let c = 0; c < 3; c++) {
      const cx = (-10 + c * 10) * s;
      ctx.fillStyle = COLORS.claw;
      ctx.beginPath();
      ctx.moveTo(cx - 3 * s, 70 * s);
      ctx.quadraticCurveTo(cx, 85 * s, cx + 3 * s, 70 * s);
      ctx.fill();
    }

    ctx.restore();
  };

  /** Vẽ đuôi rồng dài */
  const drawDragonTail = (tx: number, ty: number, scale: number, sway: number) => {
    ctx.save();

    const s = scale;
    const segments = 8;

    ctx.strokeStyle = COLORS.body_dark;
    ctx.lineCap = 'round';

    let px = tx, py = ty;
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const thickness = (1 - t) * 18 * s + 3 * s;
      const nextX = px + 25 * s;
      const nextY = py + Math.sin(sway + i * 0.8) * 15 * s * (1 - t * 0.3);

      ctx.lineWidth = thickness;
      ctx.strokeStyle = t < 0.5 ? COLORS.body_mid : COLORS.body_dark;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      px = nextX;
      py = nextY;
    }

    // Gai đuôi cuối
    ctx.fillStyle = COLORS.spine;
    ctx.beginPath();
    ctx.moveTo(px - 8 * s, py);
    ctx.lineTo(px + 20 * s, py - 5 * s);
    ctx.lineTo(px + 15 * s, py + 8 * s);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  /** Vẽ fire breath — 5 lớp particle system */
  const drawFireBreath = (
    fx: number, fy: number, scale: number,
    intensity: number, seed: number
  ) => {
    if (intensity <= 0) return;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.globalCompositeOperation = 'screen';

    const s = scale * intensity;
    const rng = (i: number) => seededRng(seed, i);

    // Layer 1: Khói (background)
    ctx.fillStyle = COLORS.fire_smoke;
    ctx.globalAlpha = 0.25 * intensity;
    for (let i = 0; i < 5; i++) {
      const px = -(80 + rng(i) * 60) * s;
      const py = (rng(i + 10) - 0.5) * 40 * s - 10 * s;
      ctx.beginPath();
      ctx.ellipse(px, py, (15 + rng(i + 20) * 15) * s, (10 + rng(i + 30) * 10) * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 2: Outer fire (đỏ)
    ctx.fillStyle = COLORS.fire_outer;
    ctx.globalAlpha = 0.5 * intensity;
    ctx.beginPath();
    ctx.ellipse(-50 * s, 0, 70 * s, 25 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layer 3: Mid fire (cam)
    ctx.fillStyle = COLORS.fire_mid;
    ctx.globalAlpha = 0.6 * intensity;
    ctx.beginPath();
    ctx.ellipse(-40 * s, 0, 50 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layer 4: Bright fire (vàng)
    ctx.fillStyle = COLORS.fire_bright;
    ctx.globalAlpha = 0.7 * intensity;
    ctx.beginPath();
    ctx.ellipse(-25 * s, 0, 35 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Layer 5: Core (trắng vàng) + glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = COLORS.fire_bright;
    ctx.fillStyle = COLORS.fire_core;
    ctx.globalAlpha = 0.9 * intensity;
    ctx.beginPath();
    ctx.ellipse(-10 * s, 0, 18 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tia lửa nhỏ bắn ra
    ctx.fillStyle = COLORS.fire_bright;
    ctx.globalAlpha = 0.4;
    for (let sp = 0; sp < 8; sp++) {
      const spx = -(20 + rng(sp * 3) * 100) * s;
      const spy = (rng(sp * 3 + 1) - 0.5) * 50 * s;
      const spr = (2 + rng(sp * 3 + 2) * 4) * s;
      ctx.beginPath();
      ctx.arc(spx, spy, spr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // ===== MAIN FRAME DRAWING =====

  const drawFrame = (frameIndex: number, rowY: number, framesCount: number, type: string, time: number) => {
    const fw = W / framesCount;
    const fh = 400;
    const ox = frameIndex * fw + fw / 2;
    const oy = rowY + fh - 25;

    ctx.save();
    ctx.translate(ox, oy);

    const seed = frameIndex * 173 + rowY;

    // Animation params
    let bodyY = 0;
    let headY = 0;
    let headX = 0;
    let wingFlap = 0;
    let mouthOpen = 0;
    let eyeColor = COLORS.eye_glow;
    let neckGlow = 0;
    let fireIntensity = 0;
    let tailSway = time * 0.5;
    let bodySquash = 1.0;
    let bodyStretch = 1.0;
    let jitter = 0;
    let globalAlpha = 1;
    const wingGlow = 0;
    let legAngle = 0;

    switch (type) {
      case 'idle': {
        const breath = Math.sin(time);
        bodyY = breath * 6;
        headY = breath * 8;
        headX = Math.sin(time * 0.3) * 3;
        wingFlap = Math.sin(time * 0.7) * 0.1;
        bodySquash = 1 + breath * 0.02;
        bodyStretch = 1 - breath * 0.015;
        tailSway = time * 0.8;
        break;
      }
      case 'fly': {
        bodyY = Math.sin(time) * 25 - 30;
        headY = Math.sin(time) * 30 - 28;
        wingFlap = Math.sin(time) * 0.5;
        legAngle = 0.3;
        tailSway = time * 1.5;
        break;
      }
      case 'attack': {
        const phase = time / Math.PI;
        if (phase < 0.3) {
          // Anticipation — ngẩng đầu, cổ phồng
          headY = -25;
          headX = 5;
          neckGlow = phase * 3;
          mouthOpen = 0.3;
          bodyY = 5;
          bodySquash = 1.05;
        } else if (phase < 0.7) {
          // Fire blast
          headY = 15;
          headX = -10;
          mouthOpen = 1.0;
          neckGlow = 0.8;
          fireIntensity = Math.sin((phase - 0.3) * Math.PI / 0.4);
          bodyY = -5;
          bodySquash = 0.95;
          bodyStretch = 1.05;
          eyeColor = COLORS.eye_rage;
          wingFlap = -0.3;
        } else {
          // Recovery
          headY = 5;
          mouthOpen = 0.1;
          neckGlow = Math.max(0, (1 - phase) * 3);
          bodyY = 3;
        }
        break;
      }
      case 'hurt': {
        jitter = Math.sin(time * 25) * 12;
        eyeColor = '#fff';
        wingFlap = -0.2;
        mouthOpen = 0.4;
        break;
      }
      case 'death': {
        const dp = time / Math.PI;
        globalAlpha = Math.max(0, 1 - dp * 0.7);
        bodyY = dp * 40;
        headY = dp * 50;
        wingFlap = dp * 0.8;
        legAngle = dp * 0.5;
        mouthOpen = dp * 0.8;
        bodySquash = 1 + dp * 0.3;
        break;
      }
    }

    ctx.globalAlpha = globalAlpha;
    ctx.translate(jitter, 0);

    // === BÓNG MẶT ĐẤT ===
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 120 * bodyStretch, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // === ĐUÔI (phía sau) ===
    drawDragonTail(70, -80 + bodyY * 0.5, 0.7, tailSway);

    // === CÁNH TRÁI (phía sau) ===
    drawDragonWing(30, -140 + bodyY * 0.3, 0.8, wingFlap + 0.15, true, wingGlow);

    ctx.save();
    ctx.scale(bodyStretch, bodySquash);

    // === CHÂN (2 chân sau) ===
    drawDragonLeg(-50, -30 + bodyY * 0.5, 0.6, legAngle);
    drawDragonLeg(40, -25 + bodyY * 0.5, 0.55, -legAngle * 0.5);

    // === THÂN CHÍNH ===
    // Lớp bóng ngoài
    fillEllipseGrad(0, -120 + bodyY, 100, 130, COLORS.body_dark, COLORS.shadow);
    // Lớp vảy chính
    fillEllipseGrad(0, -125 + bodyY, 90, 120, COLORS.body_mid, COLORS.body_dark);
    // Bụng sáng
    fillEllipseGrad(0, -105 + bodyY, 50, 80, COLORS.body_light, COLORS.body_mid);

    // Scale texture (vảy diamond pattern)
    ctx.fillStyle = COLORS.scale_accent;
    ctx.globalAlpha = 0.15;
    for (let sy = 0; sy < 8; sy++) {
      for (let sx = 0; sx < 5; sx++) {
        const px = (-40 + sx * 20 + (sy % 2) * 10);
        const py = -180 + sy * 20 + bodyY;
        ctx.beginPath();
        ctx.moveTo(px, py - 5);
        ctx.lineTo(px + 5, py);
        ctx.lineTo(px, py + 5);
        ctx.lineTo(px - 5, py);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = globalAlpha;

    // === GAI XƯƠNG SỐNG LƯNG ===
    for (let i = 0; i < 6; i++) {
      const spx = (15 + i * 12);
      const spy = -190 + i * 15 + bodyY + Math.sin(i) * 3;
      const spH = 25 - i * 2;
      drawSpine(spx, spy, spH, -0.3 + i * 0.08);
    }

    ctx.restore(); // Restore squash/stretch

    // === CÁNH PHẢI (phía trước) ===
    drawDragonWing(-30, -140 + bodyY * 0.3, 0.85, wingFlap + 0.15, false, wingGlow);

    // === ĐẦU RỒNG ===
    drawDragonHead(-50 + headX, -220 + headY + bodyY * 0.6, 1.0, mouthOpen, eyeColor, neckGlow);

    // === FIRE BREATH ===
    if (fireIntensity > 0) {
      drawFireBreath(-120 + headX, -200 + headY + bodyY * 0.6, 1.2, fireIntensity, seed);
    }

    // === HURT FLASH ===
    if (type === 'hurt') {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, -130, 150, 170, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // === DEATH PARTICLES ===
    if (type === 'death') {
      const dp = time / Math.PI;
      const pCount = Math.floor(dp * 25);
      for (let p = 0; p < pCount; p++) {
        const px = (seededRng(seed, p * 5) - 0.5) * 250;
        const py = -130 + (seededRng(seed, p * 5 + 1) - 0.5) * 250 - dp * p * 2;
        const pr = 2 + seededRng(seed, p * 5 + 2) * 3;
        const colors = [COLORS.body_mid, COLORS.scale_accent, COLORS.wing_membrane, COLORS.spine];
        ctx.fillStyle = colors[p % 4];
        ctx.globalAlpha = Math.max(0, 0.6 - dp * 0.3);
        ctx.fillRect(px - pr / 2, py - pr / 2, pr, pr);
      }
    }

    ctx.restore();
  };

  // === GENERATE ALL ROWS ===
  // Row 0: IDLE (4 frames)
  for (let i = 0; i < 4; i++) drawFrame(i, 0, 4, 'idle', i * Math.PI / 2);
  // Row 1: FLY (6 frames)
  for (let i = 0; i < 6; i++) drawFrame(i, 400, 6, 'fly', i * Math.PI / 3);
  // Row 2: ATTACK (8 frames) — fire breath
  for (let i = 0; i < 8; i++) drawFrame(i, 800, 8, 'attack', i * Math.PI / 4);
  // Row 3: HURT (3 frames)
  for (let i = 0; i < 3; i++) drawFrame(i, 1200, 3, 'hurt', i * Math.PI / 1.5);
  // Row 4: DEATH (6 frames)
  for (let i = 0; i < 6; i++) drawFrame(i, 1600, 6, 'death', i * Math.PI / 3);

  return canvas;
}
