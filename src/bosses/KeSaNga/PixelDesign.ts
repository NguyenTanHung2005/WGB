export const KE_SA_NGA_PALETTE = {
  // Thân thịt thối — kinh dị
  flesh_dark: '#1a1a2e',     // Thịt tối nền
  flesh_mid: '#2d2d44',      // Thịt trung
  flesh_rot: '#4a3728',      // Thịt thối nâu
  flesh_raw: '#6b3a3a',      // Thịt đỏ lộ ra

  // Xương
  bone_bright: '#e8e4df',    // Xương sáng
  bone_mid: '#c4beb5',       // Xương trung
  bone_dark: '#8a847a',      // Xương tối / rỉ

  // Máu & Tĩnh mạch
  blood_bright: '#dc2626',   // Máu tươi
  blood_dark: '#7f1d1d',     // Máu khô
  vein: '#581c87',           // Tĩnh mạch tím

  // Phát sáng
  eye_glow: '#ef4444',       // Mắt đỏ quỷ
  eye_inner: '#fbbf24',      // Lõi mắt vàng
  poison_glow: '#22c55e',    // Độc xanh lá
  soul_glow: '#a78bfa',      // Hồn tím nhạt

  // Áo choàng / Vải rách
  cloak_dark: '#1c1917',     // Áo choàng đen
  cloak_mid: '#292524',      // Áo choàng xám tối
  cloak_edge: '#44403c',     // Viền rách

  // Kiếm
  sword_blade: '#78716c',    // Lưỡi kiếm rỉ sét
  sword_edge: '#a8a29e',     // Cạnh kiếm
  sword_rust: '#92400e',     // Rỉ sét cam

  highlight: '#ffffff',
  shadow: '#000000',
};

/**
 * Tạo Offscreen Canvas 2000x2000 cho Boss "Kẻ Sa Ngã"
 * Quái vật Amalgamation ghép từ nhiều xác thịt — cực kỳ kinh dị
 * Row 0: IDLE (4 frames) — rung rẩy, mắt nhấp nháy
 * Row 1: ATTACK (8 frames) — vung kiếm + tay xương vươn ra
 * Row 2: HURT (3 frames) — co rúm + máu bắn
 * Row 3: DEATH (8 frames) — từng bộ phận rơi rụng
 * Row 4: SPECIAL (10 frames) — triệu hồi skeleton, sáng xanh độc
 */
export function generateKeSaNgaSpriteSheet(): HTMLCanvasElement {
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

  /** Radial gradient ellipse */
  const fillEllipseGrad = (
    cx: number, cy: number, rx: number, ry: number,
    inner: string, outer: string, rot = 0
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const g = ctx.createRadialGradient(0, -ry * 0.15, 0, 0, 0, Math.max(rx, ry));
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /** Vẽ tĩnh mạch kinh dị */
  const drawVeins = (cx: number, cy: number, count: number, maxLen: number, seed: number) => {
    const rng = (i: number) => {
      const x = Math.sin(seed * 7919 + i * 104729) * 104729;
      return x - Math.floor(x);
    };
    ctx.save();
    ctx.strokeStyle = KE_SA_NGA_PALETTE.vein;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    for (let v = 0; v < count; v++) {
      const startAngle = rng(v) * Math.PI * 2;
      const len = maxLen * 0.4 + rng(v + 50) * maxLen * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let px = cx, py = cy;
      for (let s = 0; s < 5; s++) {
        px += Math.cos(startAngle + (rng(v * 10 + s) - 0.5) * 1.5) * (len / 5);
        py += Math.sin(startAngle + (rng(v * 10 + s + 5) - 0.5) * 1.5) * (len / 5);
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Nhánh phụ
      if (rng(v + 100) > 0.5) {
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(
          px + Math.cos(startAngle + 0.8) * len * 0.3,
          py + Math.sin(startAngle + 0.8) * len * 0.3
        );
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
      }
    }
    ctx.restore();
  };

  /** Vẽ đầu lâu kinh dị (skull) */
  const drawSkull = (
    sx: number, sy: number, scale: number,
    eyeGlowIntensity: number, jawOpen: number, angle: number
  ) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const s = scale;

    // Hộp sọ chính
    fillEllipseGrad(0, -15 * s, 30 * s, 35 * s, KE_SA_NGA_PALETTE.bone_bright, KE_SA_NGA_PALETTE.bone_dark);

    // Gò má
    fillEllipseGrad(-18 * s, 5 * s, 12 * s, 10 * s, KE_SA_NGA_PALETTE.bone_mid, KE_SA_NGA_PALETTE.bone_dark);
    fillEllipseGrad(18 * s, 5 * s, 12 * s, 10 * s, KE_SA_NGA_PALETTE.bone_mid, KE_SA_NGA_PALETTE.bone_dark);

    // Hốc mắt trái — tối sâu
    ctx.fillStyle = KE_SA_NGA_PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(-12 * s, -18 * s, 9 * s, 11 * s, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Hốc mắt phải
    ctx.beginPath();
    ctx.ellipse(12 * s, -18 * s, 9 * s, 11 * s, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Ánh sáng mắt (glow đỏ)
    if (eyeGlowIntensity > 0) {
      ctx.save();
      ctx.shadowBlur = 15 * eyeGlowIntensity;
      ctx.shadowColor = KE_SA_NGA_PALETTE.eye_glow;
      ctx.fillStyle = KE_SA_NGA_PALETTE.eye_glow;
      ctx.globalAlpha = eyeGlowIntensity;
      ctx.beginPath();
      ctx.ellipse(-12 * s, -18 * s, 5 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12 * s, -18 * s, 5 * s, 6 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // Lõi sáng
      ctx.fillStyle = KE_SA_NGA_PALETTE.eye_inner;
      ctx.beginPath();
      ctx.arc(-12 * s, -18 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12 * s, -18 * s, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Mũi (lỗ đen tam giác)
    ctx.fillStyle = KE_SA_NGA_PALETTE.shadow;
    ctx.beginPath();
    ctx.moveTo(-4 * s, -2 * s);
    ctx.lineTo(0, 5 * s);
    ctx.lineTo(4 * s, -2 * s);
    ctx.fill();

    // Hàm dưới (mở / khép)
    ctx.save();
    ctx.translate(0, 12 * s);
    ctx.rotate(jawOpen * 0.3);
    fillEllipseGrad(0, 5 * s * jawOpen, 22 * s, 12 * s, KE_SA_NGA_PALETTE.bone_mid, KE_SA_NGA_PALETTE.bone_dark);

    // Răng (hàm trên)
    ctx.fillStyle = KE_SA_NGA_PALETTE.bone_bright;
    for (let t = 0; t < 6; t++) {
      const tx = (-12 + t * 5) * s;
      ctx.fillRect(tx, -3 * s, 3 * s, 6 * s + jawOpen * 3 * s);
    }
    ctx.restore();

    // Vết nứt trên sọ
    ctx.strokeStyle = KE_SA_NGA_PALETTE.bone_dark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-5 * s, -35 * s);
    ctx.lineTo(-2 * s, -20 * s);
    ctx.lineTo(3 * s, -15 * s);
    ctx.stroke();

    ctx.restore();
  };

  /** Vẽ cánh tay xương */
  const drawSkeletalArm = (
    ax: number, ay: number, scale: number,
    angle: number, fingerSpread: number
  ) => {
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);

    const s = scale;

    // Xương cánh tay trên (humerus)
    ctx.strokeStyle = KE_SA_NGA_PALETTE.bone_mid;
    ctx.lineWidth = 8 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 60 * s);
    ctx.stroke();

    // Khớp khuỷu tay
    fillEllipseGrad(0, 60 * s, 8 * s, 8 * s, KE_SA_NGA_PALETTE.bone_bright, KE_SA_NGA_PALETTE.bone_dark);

    // Xương cẳng tay (2 xương: radius + ulna)
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.moveTo(-3 * s, 60 * s);
    ctx.lineTo(-5 * s, 115 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3 * s, 60 * s);
    ctx.lineTo(5 * s, 115 * s);
    ctx.stroke();

    // Bàn tay xương
    fillEllipseGrad(0, 120 * s, 12 * s, 8 * s, KE_SA_NGA_PALETTE.bone_mid, KE_SA_NGA_PALETTE.bone_dark);

    // 5 ngón xương
    for (let f = 0; f < 5; f++) {
      const fAngle = (-0.5 + f * 0.25) * fingerSpread;
      const fLen = (25 + Math.sin(f * 1.5) * 8) * s;
      ctx.save();
      ctx.translate((-8 + f * 4) * s, 125 * s);
      ctx.rotate(fAngle);
      ctx.strokeStyle = KE_SA_NGA_PALETTE.bone_mid;
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, fLen * 0.5);
      ctx.lineTo(Math.sin(fAngle) * 3, fLen);
      ctx.stroke();
      // Đốt ngón
      ctx.fillStyle = KE_SA_NGA_PALETTE.bone_dark;
      ctx.beginPath();
      ctx.arc(0, fLen * 0.5, 2 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  };

  /** Vẽ kiếm rỉ sét khổng lồ */
  const drawRustySword = (sx: number, sy: number, scale: number, angle: number) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const s = scale;
    const bladeLen = 200 * s;
    const bladeW = 25 * s;

    // Lưỡi kiếm gradient rỉ sét
    const bladeGrad = ctx.createLinearGradient(0, 0, 0, -bladeLen);
    bladeGrad.addColorStop(0, KE_SA_NGA_PALETTE.sword_rust);
    bladeGrad.addColorStop(0.3, KE_SA_NGA_PALETTE.sword_blade);
    bladeGrad.addColorStop(0.7, KE_SA_NGA_PALETTE.sword_blade);
    bladeGrad.addColorStop(1, KE_SA_NGA_PALETTE.sword_edge);

    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-bladeW / 2, 0);
    ctx.lineTo(-bladeW / 2, -bladeLen * 0.85);
    ctx.lineTo(0, -bladeLen);
    ctx.lineTo(bladeW / 2, -bladeLen * 0.85);
    ctx.lineTo(bladeW / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Cạnh kiếm highlight
    ctx.strokeStyle = KE_SA_NGA_PALETTE.sword_edge;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-bladeW * 0.3, -bladeLen * 0.1);
    ctx.lineTo(0, -bladeLen * 0.95);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Vết rỉ sét (patches)
    ctx.fillStyle = KE_SA_NGA_PALETTE.sword_rust;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(-5 * s, -bladeLen * 0.3, 8 * s, 12 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4 * s, -bladeLen * 0.6, 6 * s, 10 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Guard (thanh chắn kiếm)
    ctx.fillStyle = KE_SA_NGA_PALETTE.bone_dark;
    ctx.fillRect(-bladeW, 0, bladeW * 2, 8 * s);

    // Chuôi kiếm
    ctx.fillStyle = KE_SA_NGA_PALETTE.cloak_dark;
    ctx.fillRect(-6 * s, 8 * s, 12 * s, 40 * s);
    // Dây quấn
    ctx.strokeStyle = KE_SA_NGA_PALETTE.blood_dark;
    ctx.lineWidth = 3;
    for (let w = 0; w < 5; w++) {
      ctx.beginPath();
      ctx.moveTo(-6 * s, (12 + w * 7) * s);
      ctx.lineTo(6 * s, (15 + w * 7) * s);
      ctx.stroke();
    }

    // Máu nhỏ giọt
    ctx.fillStyle = KE_SA_NGA_PALETTE.blood_bright;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(-bladeW * 0.3, -bladeLen * 0.5, 2 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-bladeW * 0.3, -bladeLen * 0.5 + 12 * s, 4 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  };

  /** Vẽ mắt kinh dị trên thân */
  const drawFleshEye = (
    ex: number, ey: number, size: number,
    lookAngle: number, blinkAmount: number
  ) => {
    ctx.save();
    ctx.translate(ex, ey);

    const openHeight = size * (1 - blinkAmount);
    if (openHeight < 1) { ctx.restore(); return; }

    // Lòng trắng
    ctx.fillStyle = '#d4d4d8';
    ctx.beginPath();
    ctx.ellipse(0, 0, size, openHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mống mắt (đỏ / vàng)
    const irisX = Math.cos(lookAngle) * size * 0.2;
    const irisY = Math.sin(lookAngle) * openHeight * 0.2;
    ctx.fillStyle = KE_SA_NGA_PALETTE.eye_glow;
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, size * 0.55, openHeight * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đồng tử (slit vertical — mèo/quỷ)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, size * 0.15, openHeight * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = KE_SA_NGA_PALETTE.eye_glow;
    ctx.fillStyle = KE_SA_NGA_PALETTE.eye_inner;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, size * 0.3, openHeight * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Viền mí mắt (thịt)
    ctx.strokeStyle = KE_SA_NGA_PALETTE.flesh_raw;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, size + 1, openHeight + 1, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  /** Vẽ mảnh áo choàng rách */
  const drawCloakTatter = (
    cx: number, cy: number, width: number, length: number, sway: number
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = KE_SA_NGA_PALETTE.cloak_dark;

    ctx.beginPath();
    ctx.moveTo(-width / 2, 0);
    ctx.quadraticCurveTo(-width / 2 + sway * 10, length * 0.5, -width / 2 + sway * 20 - 5, length);
    ctx.lineTo(width / 2 + sway * 20 + 5, length * 0.9);
    ctx.quadraticCurveTo(width / 2 + sway * 5, length * 0.4, width / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Viền rách
    ctx.strokeStyle = KE_SA_NGA_PALETTE.cloak_edge;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(-width / 2 + sway * 20 - 5, length);
    for (let r = 0; r < 5; r++) {
      ctx.lineTo(
        -width / 2 + sway * 20 + r * (width / 4) + Math.sin(r * 2) * 5,
        length + 3 + Math.sin(r * 3) * 5
      );
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  // ===== MAIN FRAME DRAWING =====

  const drawFrame = (frameIndex: number, rowY: number, framesCount: number, type: string, time: number) => {
    const fw = W / framesCount;
    const fh = 400;
    const ox = frameIndex * fw + fw / 2;
    const oy = rowY + fh - 15;

    ctx.save();
    ctx.translate(ox, oy);

    const seed = frameIndex * 199 + rowY;
    const rng = (i: number) => {
      const x = Math.sin(seed * 7919 + i * 104729) * 104729;
      return x - Math.floor(x);
    };

    // Animation parameters
    let floatY = 0;
    let jitter = 0;
    let swordAngle = -0.4;
    let swordY = 0;
    let leftArmAngle = Math.PI * 0.25;
    let rightArmAngle = -Math.PI * 0.15;
    let fingerSpread = 1.0;
    let globalAlpha = 1;
    let eyeGlow = 0.7;
    let jawOpen = 0;
    let bodyShear = 0;

    switch (type) {
      case 'idle': {
        floatY = Math.sin(time) * 8;
        const headBob = Math.sin(time * 1.3) * 3;
        swordAngle = -0.4 + Math.sin(time * 0.5) * 0.05;
        leftArmAngle = Math.PI * 0.25 + Math.sin(time * 0.7) * 0.08;
        rightArmAngle = -Math.PI * 0.15 + Math.cos(time * 0.6) * 0.06;
        eyeGlow = 0.5 + Math.sin(time * 2) * 0.3;
        jawOpen = 0.1 + Math.sin(time * 0.8) * 0.05;
        bodyShear = headBob * 0.003;
        break;
      }
      case 'attack': {
        const phase = time / Math.PI;
        if (phase < 0.35) {
          // Windup — kéo kiếm lại
          swordAngle = -1.2;
          swordY = -30;
          bodyShear = -0.05;
          floatY = 10;
          leftArmAngle = Math.PI * 0.6;
          jawOpen = 0.3;
        } else if (phase < 0.65) {
          // Strike — chém mạnh
          swordAngle = 0.8;
          swordY = 20;
          bodyShear = 0.08;
          floatY = -15;
          leftArmAngle = -Math.PI * 0.3;
          rightArmAngle = -Math.PI * 0.5;
          fingerSpread = 2.0;
          jawOpen = 1.0;
          eyeGlow = 1.0;
        } else {
          // Recovery
          swordAngle = 0.2;
          swordY = 5;
          bodyShear = 0;
          leftArmAngle = Math.PI * 0.2;
          jawOpen = 0.2;
        }
        break;
      }
      case 'hurt': {
        jitter = Math.sin(time * 25) * 15;
        eyeGlow = 1.0;
        jawOpen = 0.7;
        break;
      }
      case 'death': {
        const dp = time / Math.PI;
        globalAlpha = Math.max(0, 1 - dp * 0.8);
        floatY = dp * 35;
        bodyShear = dp * 0.15;
        jawOpen = dp * 1.5;
        break;
      }
      case 'special': {
        floatY = -20 + Math.sin(time * 2) * 10;
        leftArmAngle = -Math.PI * 0.7 - Math.sin(time * 3) * 0.2;
        rightArmAngle = Math.PI * 0.3 + Math.cos(time * 3) * 0.15;
        fingerSpread = 2.5;
        eyeGlow = 1.0;
        jawOpen = 0.5 + Math.sin(time * 4) * 0.3;
        break;
      }
    }

    ctx.globalAlpha = globalAlpha;
    ctx.translate(jitter, floatY);

    // === BÓNG MẶT ĐẤT ===
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 8, 140, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // === ÁO CHOÀNG RÁCH (phía sau) ===
    for (let c = 0; c < 5; c++) {
      const cx = -80 + c * 40;
      const cSway = Math.sin(time + c * 0.7);
      drawCloakTatter(cx, -40, 35, 80 + rng(c) * 40, cSway);
    }

    // === THÂN CHÍNH (Amalgamation mass) ===
    ctx.save();
    ctx.transform(1, bodyShear, 0, 1, 0, 0);

    // Khối thịt chính — hình dáng méo mó kinh dị
    ctx.fillStyle = KE_SA_NGA_PALETTE.flesh_dark;
    ctx.beginPath();
    ctx.moveTo(-140, 0);
    ctx.quadraticCurveTo(-180, -80, -130, -180);
    ctx.bezierCurveTo(-80, -280, -20, -320, 0, -310);
    ctx.bezierCurveTo(20, -320, 80, -280, 130, -180);
    ctx.quadraticCurveTo(180, -80, 140, 0);
    ctx.closePath();
    ctx.fill();

    // Lớp thịt thối trung
    fillEllipseGrad(0, -160, 110, 140, KE_SA_NGA_PALETTE.flesh_mid, KE_SA_NGA_PALETTE.flesh_dark);

    // Patches thịt lộ ra (đỏ)
    const fleshPatches = [
      { x: -50, y: -180, rx: 35, ry: 25 },
      { x: 60, y: -200, rx: 30, ry: 20 },
      { x: -20, y: -120, rx: 40, ry: 30 },
      { x: 40, y: -140, rx: 25, ry: 35 },
    ];
    fleshPatches.forEach(p => {
      fillEllipseGrad(p.x, p.y, p.rx, p.ry, KE_SA_NGA_PALETTE.flesh_raw, KE_SA_NGA_PALETTE.flesh_rot);
    });

    // Tĩnh mạch tím chạy khắp thân
    drawVeins(0, -180, 8, 80, seed);
    drawVeins(-40, -130, 5, 60, seed + 100);
    drawVeins(50, -200, 4, 50, seed + 200);

    ctx.restore(); // Restore shear

    // === NHIỀU MẮT KINH DỊ TRÊN THÂN (5-7 mắt) ===
    const eyes = [
      { x: -60, y: -190, size: 10, look: time * 0.5 },
      { x: 70, y: -210, size: 8, look: time * 0.3 + 1 },
      { x: -30, y: -130, size: 12, look: time * 0.7 },
      { x: 45, y: -155, size: 7, look: -time * 0.4 },
      { x: -80, y: -145, size: 9, look: time * 0.6 + 2 },
      { x: 20, y: -240, size: 6, look: -time * 0.8 },
      { x: -15, y: -95, size: 8, look: time * 0.9 + 3 },
    ];
    eyes.forEach((e, i) => {
      // Blink nhấp nháy riêng biệt từng mắt
      const blinkCycle = Math.sin(time * (1.2 + i * 0.3) + i * 2);
      const blink = blinkCycle > 0.85 ? (blinkCycle - 0.85) * 6.67 : 0;
      drawFleshEye(e.x, e.y + floatY * 0.3, e.size, e.look, blink);
    });

    // === ĐẦU LÂU GẮN VÀO THÂN (3-4 skulls) ===
    drawSkull(-100, -190, 0.8, eyeGlow, jawOpen * 0.5, -0.3);
    drawSkull(80, -230, 0.7, eyeGlow * 0.8, jawOpen * 0.3, 0.2);
    drawSkull(-20, -110, 0.6, eyeGlow * 0.6, jawOpen * 0.8, 0.1);
    drawSkull(50, -100, 0.5, eyeGlow * 0.5, jawOpen * 0.4, -0.15);

    // === ĐẦU CHÍNH (TRÊN CÙNG) ===
    drawSkull(0, -310 + Math.sin(time * 1.5) * 5 + floatY * 0.5, 1.3, eyeGlow, jawOpen, 0);

    // === TAY XƯƠNG (4-5 cánh tay thò ra) ===
    drawSkeletalArm(-170, -100, 0.8, leftArmAngle, fingerSpread);
    drawSkeletalArm(170, -120, 0.75, rightArmAngle, fingerSpread);
    drawSkeletalArm(-150, -200, 0.55, leftArmAngle + 0.5, fingerSpread * 0.7);
    drawSkeletalArm(140, -220, 0.5, rightArmAngle - 0.3, fingerSpread * 0.8);

    // === ĐẠI KIẾM RỈ SÉT ===
    drawRustySword(160, -60 + swordY, 0.85, swordAngle);

    // === HIỆU ỨNG ĐẶC BIỆT ===
    if (type === 'special') {
      // Hào quang triệu hồi xanh độc
      ctx.save();
      ctx.shadowBlur = 40;
      ctx.shadowColor = KE_SA_NGA_PALETTE.poison_glow;
      ctx.strokeStyle = KE_SA_NGA_PALETTE.poison_glow;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.4 + Math.sin(time * 3) * 0.2;
      ctx.beginPath();
      ctx.ellipse(0, -150, 160 + Math.sin(time * 2) * 20, 180 + Math.cos(time * 2) * 20, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Linh hồn tím bay quanh
      if (time > 1) {
        ctx.fillStyle = KE_SA_NGA_PALETTE.soul_glow;
        ctx.globalAlpha = 0.5;
        for (let sp = 0; sp < 6; sp++) {
          const angle = time * 2 + sp * (Math.PI * 2 / 6);
          const dist = 120 + Math.sin(time + sp) * 30;
          const spx = Math.cos(angle) * dist;
          const spy = -150 + Math.sin(angle) * dist * 0.6;
          ctx.save();
          ctx.shadowBlur = 12;
          ctx.shadowColor = KE_SA_NGA_PALETTE.soul_glow;
          ctx.beginPath();
          ctx.arc(spx, spy, 5 + Math.sin(sp + time) * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
    }

    // === HURT FLASH ===
    if (type === 'hurt') {
      // Máu bắn
      ctx.fillStyle = KE_SA_NGA_PALETTE.blood_bright;
      ctx.globalAlpha = 0.7;
      for (let b = 0; b < 8; b++) {
        const bx = (rng(b * 10) - 0.5) * 250;
        const by = -100 - rng(b * 10 + 1) * 200;
        const br = 3 + rng(b * 10 + 2) * 5;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Flash overlay
      ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, -150, 180, 200, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // === DEATH DISINTEGRATION ===
    if (type === 'death') {
      const dp = time / Math.PI;
      const pCount = Math.floor(dp * 40);
      for (let p = 0; p < pCount; p++) {
        const px = (rng(p * 7) - 0.5) * 300;
        const py = -150 + (rng(p * 7 + 1) - 0.5) * 300 - dp * p * 2;
        const pr = 2 + rng(p * 7 + 2) * 4;
        const colors = [
          KE_SA_NGA_PALETTE.bone_mid,
          KE_SA_NGA_PALETTE.flesh_rot,
          KE_SA_NGA_PALETTE.blood_dark,
          KE_SA_NGA_PALETTE.cloak_mid
        ];
        ctx.fillStyle = colors[p % 4];
        ctx.globalAlpha = Math.max(0, 0.7 - dp * 0.4);
        ctx.fillRect(px - pr / 2, py - pr / 2, pr, pr);
      }
    }

    ctx.restore();
  };

  // === GENERATE ALL ROWS ===
  for (let i = 0; i < 4; i++) drawFrame(i, 0, 4, 'idle', i * Math.PI / 2);
  for (let i = 0; i < 8; i++) drawFrame(i, 400, 8, 'attack', i * Math.PI / 4);
  for (let i = 0; i < 3; i++) drawFrame(i, 800, 3, 'hurt', i * Math.PI / 1.5);
  for (let i = 0; i < 8; i++) drawFrame(i, 1200, 8, 'death', i * Math.PI / 4);
  for (let i = 0; i < 10; i++) drawFrame(i, 1600, 10, 'special', i * Math.PI / 5);

  return canvas;
}
