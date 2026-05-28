export const REZE_PALETTE = {
  head: '#18181b',      // Đen vỏ bom
  teeth: '#e4e4e7',     // Răng sắc
  apron: '#b91c1c',     // Tạp dề thuốc nổ (Đỏ)
  apronStrap: '#4b5563',// Dây buộc tạp dề
  skin: '#fde047',      // Da người (tay/chân nếu có)
  boots: '#27272a',     // Ủng đen
  spark: '#f97316',     // Tia lửa cháy
  flame: '#facc15',     // Lõi lửa
  shadow: '#09090b',    // Đổ bóng
};

export function generateRezeSpriteSheet(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  const W = 1000;
  const H = 1000;
  
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const drawPart = (ox: number, oy: number, design: string[], scale: number = 3) => {
    for (let y = 0; y < design.length; y++) {
      const row = design[y];
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        if (char !== '.') {
          let color = '#000';
          if (char === 'h') color = REZE_PALETTE.head;
          else if (char === 't') color = REZE_PALETTE.teeth;
          else if (char === 'a') color = REZE_PALETTE.apron;
          else if (char === 's') color = REZE_PALETTE.skin;
          else if (char === 'b') color = REZE_PALETTE.boots;
          else if (char === 'f') color = REZE_PALETTE.flame;
          else if (char === 'k') color = REZE_PALETTE.spark;
          else if (char === 'x') color = REZE_PALETTE.apronStrap;
          
          ctx.fillStyle = color;
          ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
        }
      }
    }
  };

  // --- THIẾT KẾ REZE (BOMB GIRL) ---
  const bombHead = [
    "....fkf.......", // Ngòi nổ cháy
    "....fkk.......",
    "...kfk........",
    "....hx........", // Cổ ngòi nổ
    "..hhhhhh......",
    ".hhhhhhhhh....",
    ".hhttttthhh...", // Răng nanh cười
    ".hhttttthhh...",
    "hhhhhhhhhhh...",
    ".hhhhhhhhh....",
    "..hhhhhhh....."
  ];

  const dynamiteApron = [
    "....x..x....",
    "...aaaaaa...", // Thỏi thuốc nổ
    "...a..a.a...",
    "...aaaaaa...",
    "...aaaaaa...",
    "....x..x...."
  ];

  const leg = [
    ".s.",
    ".s.",
    ".b.",
    ".b.",
    "bb." // Mũi giày
  ];

  const arm = [
    "ss",
    "ss",
    "ss",
    "ss"
  ];

  const bombProjectile = [
    ".f.",
    "hxh",
    "hhh"
  ];

  // 9 Rows Animation
  // 0: Idle (4), 1: Walk (6), 2: Run (6), 3: Jump (5), 4: Attack (6), 5: Hurt (3), 6: Death (8), 7: Victory (6), 8: Transform (6)
  
  const drawFrame = (frameIndex: number, rowY: number, _framesCount: number, type: string, time: number) => {
    const fw = W / 8; // Max 8 frames
    const fh = H / 9; // 9 rows
    const ox = frameIndex * fw + fw / 2;
    const oy = rowY * fh + fh - 20; // pivot at bottom

    ctx.save();
    ctx.translate(ox, oy);

    let bodyY = -40;
    let headY = -75;
    let legL_Y = -15; let legL_R = 0;
    let legR_Y = -15; let legR_R = 0;
    let armL_Y = -40; let armL_R = 0;
    let armR_Y = -40; let armR_R = 0;
    let fuseScale = 1;

    // --- ANIMATION LOGIC ---
    if (type === 'idle') {
      bodyY += Math.sin(time) * 2;
      headY += Math.sin(time) * 2;
      fuseScale = 1 + Math.sin(time*2)*0.2;
    } else if (type === 'walk' || type === 'run') {
      const speedMult = type === 'run' ? 2 : 1;
      bodyY += Math.abs(Math.sin(time * speedMult)) * 5;
      headY += Math.abs(Math.sin(time * speedMult)) * 5;
      legL_R = Math.sin(time * speedMult) * 0.5;
      legR_R = -Math.sin(time * speedMult) * 0.5;
      armL_R = -Math.sin(time * speedMult) * 0.5;
      armR_R = Math.sin(time * speedMult) * 0.5;
    } else if (type === 'jump') {
      bodyY -= 15;
      headY -= 15;
      legL_R = -0.2; legL_Y -= 5;
      legR_R = 0.5;  legR_Y -= 10;
      armL_R = 0.8;
      armR_R = -0.8;
    } else if (type === 'attack') {
      // Ném bom
      if (time < Math.PI / 2) {
        armR_R = -1.5; // Giơ tay lên
      } else {
        armR_R = 1.0; // Ném xuống
        // Vẽ thêm trái bom đang bay đi
        drawPart(20 + time * 20, -60 + time * 10, bombProjectile, 2);
      }
    } else if (type === 'transform') {
      // Kéo chốt cổ
      if (time < Math.PI / 2) {
        armR_R = -2.0; armR_Y -= 10; // Đưa tay lên cổ
        headY += (Math.random()-0.5)*2; // Rung đầu
      } else {
        armR_R = 0.5; // Giật chốt
        ctx.fillStyle = 'white';
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(0, headY, time*20, 0, Math.PI*2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    } else if (type === 'hurt') {
      bodyY += 5; headY += 10;
      armL_R = 0.5; armR_R = 0.5;
    } else if (type === 'death') {
      bodyY += 30; headY += 40; headY += time*5;
      armL_R = 1.5; armR_R = 1.5;
      legL_R = -1.5; legR_R = 1.5;
      ctx.globalAlpha = Math.max(0, 1 - time/Math.PI);
    } else if (type === 'victory') {
      armL_R = -1.0; armL_Y -= 5;
      armR_R = -1.5; armR_Y -= 10;
      headY -= Math.abs(Math.sin(time*2))*5;
    }

    // Vẽ chân
    ctx.save(); ctx.translate(-10, legL_Y); ctx.rotate(legL_R); drawPart(-5, 0, leg); ctx.restore();
    ctx.save(); ctx.translate(5, legR_Y); ctx.rotate(legR_R); drawPart(-5, 0, leg); ctx.restore();

    // Tay sau (Trái)
    ctx.save(); ctx.translate(-15, armL_Y); ctx.rotate(armL_R); drawPart(-3, 0, arm); ctx.restore();

    // Thân
    drawPart(-20, bodyY, dynamiteApron);

    // Đầu
    ctx.save(); ctx.translate(-22, headY); 
    // Ngòi nổ giật giật
    if(fuseScale !== 1) {
      ctx.save();
      ctx.translate(15, -10);
      ctx.scale(fuseScale, fuseScale);
      ctx.translate(-15, 10);
      drawPart(0, 0, bombHead.slice(0,3));
      ctx.restore();
      drawPart(0, 0, ["...", "...", "...", ...bombHead.slice(3)]);
    } else {
      drawPart(0, 0, bombHead);
    }
    ctx.restore();

    // Tay trước (Phải)
    ctx.save(); ctx.translate(10, armR_Y); ctx.rotate(armR_R); drawPart(-3, 0, arm); ctx.restore();

    ctx.restore();
  };

  // Row 0: IDLE (4 frames)
  for(let i=0; i<4; i++) drawFrame(i, 0, 4, 'idle', i * Math.PI / 2);
  // Row 1: WALK (6 frames)
  for(let i=0; i<6; i++) drawFrame(i, 1, 6, 'walk', i * Math.PI / 3);
  // Row 2: RUN (6 frames)
  for(let i=0; i<6; i++) drawFrame(i, 2, 6, 'run', i * Math.PI / 3);
  // Row 3: JUMP (5 frames)
  for(let i=0; i<5; i++) drawFrame(i, 3, 5, 'jump', i * Math.PI / 2.5);
  // Row 4: ATTACK (6 frames)
  for(let i=0; i<6; i++) drawFrame(i, 4, 6, 'attack', i * Math.PI / 3);
  // Row 5: HURT (3 frames)
  for(let i=0; i<3; i++) drawFrame(i, 5, 3, 'hurt', i * Math.PI / 1.5);
  // Row 6: DEATH (8 frames)
  for(let i=0; i<8; i++) drawFrame(i, 6, 8, 'death', i * Math.PI / 4);
  // Row 7: VICTORY (6 frames)
  for(let i=0; i<6; i++) drawFrame(i, 7, 6, 'victory', i * Math.PI / 3);
  // Row 8: TRANSFORM (6 frames)
  for(let i=0; i<6; i++) drawFrame(i, 8, 6, 'transform', i * Math.PI / 3);

  return canvas;
}
