import React, { useEffect, useRef, useState, useMemo } from 'react';
import { generateKeSaNgaSpriteSheet } from './PixelDesign';
import { BossKeSaNga } from './BossKeSaNga';
import type { KeSaNgaState } from './BossKeSaNga';
import { useGameLoop } from '../../hooks/useGameLoop';

// Helper to generate the Blood Abyss Map
const generateBloodAbyssMap = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const size = 3000; // Big map
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sàn đất xám đen (Graveyard soil)
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, size, size);

  // Noise texture thô sơ
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#27272a' : '#09090b';
    ctx.fillRect(Math.random() * size, Math.random() * size, 10 + Math.random()*20, 10 + Math.random()*20);
  }

  // Vũng máu (Blood pools)
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = 'rgba(153, 27, 27, 0.4)'; // Đỏ sẫm
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 50 + Math.random()*150, 30 + Math.random()*80, Math.random()*Math.PI, 0, Math.PI*2);
    ctx.fill();
    // Phần lõi máu đậm hơn
    ctx.fillStyle = 'rgba(127, 29, 29, 0.6)';
    ctx.fill();
  }

  // Bia mộ rải rác
  ctx.fillStyle = '#52525b';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillRect(x, y, 40, 60);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(x+5, y+5, 30, 50); // Chi tiết trong mộ
    ctx.fillStyle = '#52525b';
  }

  return canvas;
};

export const KeSaNgaPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bossRef = useRef<BossKeSaNga | null>(null);
  
  const [debug, setDebug] = useState(false);
  const [flip, setFlip] = useState(false);
  const [scale, setScale] = useState(0.8);
  const [hp, setHp] = useState(3000);
  const [phase, setPhase] = useState(1);
  const [stateName, setStateName] = useState<KeSaNgaState>('idle');
  const [isNight, setIsNight] = useState(false);
  const [minionCount, setMinionCount] = useState(0);

  const spriteSheet = useMemo(() => generateKeSaNgaSpriteSheet(), []);
  const bgMap = useMemo(() => generateBloodAbyssMap(), []);

  // Sương mù tĩnh (Fog overlay)
  const fogOffset = useRef(0);

  useEffect(() => {
    if (canvasRef.current) {
      bossRef.current = new BossKeSaNga(1000, 1000, spriteSheet);
      bossRef.current.onPhaseChange = (p) => setPhase(p);
      bossRef.current.onDeath = () => setStateName('death');
    }
  }, [spriteSheet]);

  useEffect(() => {
    if (bossRef.current) {
      bossRef.current.scale = scale;
      bossRef.current.flipX = flip;
    }
  }, [scale, flip]);

  useGameLoop((dt) => {
    if (!canvasRef.current || !bossRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    bossRef.current.update(dt);
    fogOffset.current += dt * 50; // Sương mù trôi nhẹ
    if (fogOffset.current > 3000) fogOffset.current = 0;
    
    if (bossRef.current.state !== stateName && bossRef.current.state !== 'death') {
      setStateName(bossRef.current.state);
    }
    setHp(Math.floor(bossRef.current.hp));
    setIsNight(bossRef.current.isNight);
    setMinionCount(bossRef.current.minions.length);

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (canvasRef.current.width !== rect.width * dpr || canvasRef.current.height !== rect.height * dpr) {
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    
    // Camera follow the boss center roughly
    const cx = rect.width/2 - bossRef.current.x;
    const cy = rect.height/2 - bossRef.current.y + 200; // Offset Y for better view
    ctx.translate(cx, cy);

    // 1. Vẽ Map nền
    ctx.drawImage(bgMap, -1000, -1000);

    // 2. Render Boss & Minions
    bossRef.current.render(ctx, debug);

    // 3. Hiệu ứng sương mù & Màn đêm
    if (bossRef.current.isNight) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Tối đen hơn
      ctx.fillRect(-1000, -1000, 4000, 4000);
    }

    ctx.restore();
  });

  const handleAction = (action: KeSaNgaState) => {
    if (bossRef.current) bossRef.current.changeState(action);
  };

  const maxHp = 3000;
  const hpPercent = Math.max(0, (hp / maxHp) * 100);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', color: 'white', fontFamily: 'serif' }}>
      
      {/* Canvas Fullscreen */}
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header - Boss Title & HP Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
          <h1 style={{ fontSize: '32px', color: '#fca5a5', textShadow: '0 0 20px #dc2626', letterSpacing: '4px', margin: '0 0 10px 0' }}>KẺ SA NGÃ</h1>
          
          <div style={{ width: '80%', maxWidth: '800px', height: '24px', background: '#18181b', border: '2px solid #52525b', borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 0 15px rgba(220, 38, 38, 0.5)' }}>
            <div style={{ width: `${hpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #991b1b, #ef4444)', transition: 'width 0.2s ease-out' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', textShadow: '1px 1px 2px black' }}>
              {hp} / {maxHp} (Phase {phase})
            </div>
          </div>
          {isNight && <div style={{ color: '#c084fc', marginTop: '10px', fontSize: '18px', animation: 'pulse 1.5s infinite', textShadow: '0 0 10px #c084fc' }}>† MÀN ĐÊM BUÔNG XUỐNG - HỒI MÁU †</div>}
        </div>

        {/* Controls Panel (Bottom Left) */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ background: 'rgba(9, 9, 11, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #3f3f46', backdropFilter: 'blur(10px)', pointerEvents: 'auto', minWidth: '250px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#a1a1aa', fontSize: '14px', letterSpacing: '2px' }}>TRẠNG THÁI & THÔNG SỐ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#d4d4d8' }}>
              <div>State: <strong style={{ color: '#fca5a5' }}>{stateName.toUpperCase()}</strong></div>
              <div>Minions Đang Tồn Tại: <strong style={{ color: '#4ade80' }}>{minionCount}</strong></div>
              
              <div style={{ marginTop: '10px' }}>
                <div style={{ marginBottom: '5px' }}>Kích cỡ (Scale: {scale.toFixed(1)}x)</div>
                <input type="range" min="0.2" max="2" step="0.1" value={scale} onChange={e => setScale(parseFloat(e.target.value))} style={{ width: '100%' }} />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={debug} onChange={e => setDebug(e.target.checked)} /> Hiện Hitbox
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={flip} onChange={e => setFlip(e.target.checked)} /> Đảo chiều (Flip)
              </label>
            </div>
          </div>

          <div style={{ background: 'rgba(9, 9, 11, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #3f3f46', backdropFilter: 'blur(10px)', pointerEvents: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#a1a1aa', fontSize: '14px', letterSpacing: '2px' }}>BẢNG KỸ NĂNG</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '400px' }}>
              <button onClick={() => handleAction('idle')} className="btn-fantasy">Nghỉ ngơi (Idle)</button>
              <button onClick={() => handleAction('attack')} className="btn-fantasy">Tấn công</button>
              <button onClick={() => handleAction('special')} className="btn-fantasy btn-poison">Vũng Độc / Triệu hồi</button>
              <button onClick={() => handleAction('roar')} className="btn-fantasy">Gầm thét</button>
              <button onClick={() => bossRef.current?.takeDamage(800)} className="btn-fantasy btn-damage">Nhận 800 ST</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .btn-fantasy {
          background: #18181b; color: #d4d4d8; border: 1px solid #52525b; padding: 8px 16px; border-radius: 6px; font-family: serif; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        }
        .btn-fantasy:hover {
          background: #27272a; border-color: #a1a1aa; color: white; transform: translateY(-2px);
        }
        .btn-poison { border-color: #166534; color: #4ade80; }
        .btn-poison:hover { background: #14532d; border-color: #22c55e; color: white; box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
        .btn-damage { border-color: #7f1d1d; color: #fca5a5; }
        .btn-damage:hover { background: #7f1d1d; border-color: #ef4444; color: white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
      `}</style>
    </div>
  );
};
