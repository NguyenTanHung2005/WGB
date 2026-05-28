import React, { useEffect, useRef, useState, useMemo } from 'react';
import { generateBossSpriteSheet } from '../graphics/PixelBossDesign';
import { Boss } from '../entities/Boss';
import { useGameLoop } from '../hooks/useGameLoop';

// Helper to generate the Lava Dungeon Map
const generateLavaDungeonMap = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const size = 3000;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sàn đá núi lửa đen/nâu
  ctx.fillStyle = '#1c1917'; // Đá
  ctx.fillRect(0, 0, size, size);

  // Vân đá nứt nẻ
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#292524' : '#0c0a09';
    ctx.fillRect(Math.random() * size, Math.random() * size, 15 + Math.random()*25, 15 + Math.random()*25);
  }

  // Sông dung nham / Vũng dung nham
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = '#b91c1c'; // Đỏ cam
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 60 + Math.random()*200, 40 + Math.random()*100, Math.random()*Math.PI, 0, Math.PI*2);
    ctx.fill();
    // Lõi dung nham sáng hơn
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 20 + Math.random()*80, 15 + Math.random()*40, Math.random()*Math.PI, 0, Math.PI*2);
    ctx.fill();
  }

  return canvas;
};

export const BossPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bossRef = useRef<Boss | null>(null);
  
  const [debug, setDebug] = useState(false);
  const [flip, setFlip] = useState(false);
  const [scale, setScale] = useState(0.8);
  const [hp, setHp] = useState(5000);
  const [phase, setPhase] = useState(1);
  const [stateName, setStateName] = useState('idle');

  // Generate sprite sheet & Map once
  const spriteSheet = useMemo(() => generateBossSpriteSheet(), []);
  const bgMap = useMemo(() => generateLavaDungeonMap(), []);

  // Bụi tro (Ash particles)
  const ashOffset = useRef(0);

  useEffect(() => {
    if (canvasRef.current) {
      bossRef.current = new Boss(1000, 800, spriteSheet);
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
    ashOffset.current -= dt * 40; // Tro bay lên
    if (ashOffset.current < -3000) ashOffset.current = 0;
    
    if (bossRef.current.state !== stateName && bossRef.current.state !== 'death') {
      setStateName(bossRef.current.state);
    }
    setHp(Math.floor(bossRef.current.hp));

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (canvasRef.current.width !== rect.width * dpr || canvasRef.current.height !== rect.height * dpr) {
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    
    // Camera follow the boss roughly
    const cx = rect.width/2 - bossRef.current.x;
    const cy = rect.height/2 - bossRef.current.y + 150;
    ctx.translate(cx, cy);

    // 1. Vẽ nền Lava Dungeon
    ctx.drawImage(bgMap, -1000, -1000);

    // 2. Vẽ Boss
    bossRef.current.render(ctx, debug);

    // 3. Hiệu ứng tro bụi bay (Ash particles) lơ lửng
    ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
    for(let i=0; i<80; i++) {
      const px = (i * 123) % rect.width - cx;
      const py = Math.abs((i * 321 + ashOffset.current) % rect.height) - cy;
      ctx.beginPath();
      ctx.arc(px, py, 1.5 + (i%2), 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  });

  const handleAction = (action: 'attackFire' | 'attackClaw' | 'roar' | 'fly' | 'idle') => {
    if (bossRef.current) bossRef.current.changeState(action);
  };

  const maxHp = 5000;
  const hpPercent = Math.max(0, (hp / maxHp) * 100);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0c0a09', color: 'white', fontFamily: 'serif' }}>
      
      {/* Canvas Fullscreen */}
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header - Boss Title & HP Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
          <h1 style={{ fontSize: '32px', color: '#fca5a5', textShadow: '0 0 20px #dc2626', letterSpacing: '4px', margin: '0 0 10px 0' }}>BẠO LONG RỰC LỬA</h1>
          
          <div style={{ width: '80%', maxWidth: '800px', height: '24px', background: '#1c1917', border: '2px solid #44403c', borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)' }}>
            <div style={{ width: `${hpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #9a3412, #ea580c)', transition: 'width 0.2s ease-out' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', textShadow: '1px 1px 2px black', fontFamily: 'sans-serif' }}>
              {hp} / {maxHp} (Phase {phase})
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ background: 'rgba(12, 10, 9, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #44403c', backdropFilter: 'blur(10px)', pointerEvents: 'auto', minWidth: '250px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#a8a29e', fontSize: '14px', letterSpacing: '2px', fontFamily: 'sans-serif' }}>TRẠNG THÁI & THÔNG SỐ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#d6d3d1', fontFamily: 'sans-serif' }}>
              <div>Trạng thái: <strong style={{ color: '#fdba74', textTransform: 'uppercase' }}>{stateName}</strong></div>
              
              <div style={{ marginTop: '10px' }}>
                <div style={{ marginBottom: '5px' }}>Khung ảnh (Scale: {scale.toFixed(1)}x)</div>
                <input type="range" min="0.5" max="3" step="0.1" value={scale} onChange={e => setScale(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#ea580c' }} />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={debug} onChange={e => setDebug(e.target.checked)} style={{accentColor: '#ea580c'}} /> Khung va chạm
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={flip} onChange={e => setFlip(e.target.checked)} style={{accentColor: '#ea580c'}} /> Đảo chiều
              </label>
            </div>
          </div>

          <div style={{ background: 'rgba(12, 10, 9, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #44403c', backdropFilter: 'blur(10px)', pointerEvents: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#a8a29e', fontSize: '14px', letterSpacing: '2px', fontFamily: 'sans-serif' }}>BẢNG KỸ NĂNG</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '400px' }}>
              <button onClick={() => handleAction('idle')} className="btn-fire">Nghỉ ngơi (Idle)</button>
              <button onClick={() => handleAction('fly')} className="btn-fire">Bay lên</button>
              <button onClick={() => handleAction('attackFire')} className="btn-fire btn-flame">Phun Lửa</button>
              <button onClick={() => handleAction('attackClaw')} className="btn-fire">Vồ Mồi</button>
              <button onClick={() => handleAction('roar')} className="btn-fire">Gầm thét</button>
              <button onClick={() => bossRef.current?.takeDamage(1000)} className="btn-fire btn-damage-fire">Sát thương 1000 HP</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .btn-fire {
          background: #1c1917; color: #d6d3d1; border: 1px solid #44403c; padding: 8px 16px; border-radius: 6px; font-family: serif; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        }
        .btn-fire:hover {
          background: #292524; border-color: #a8a29e; color: white; transform: translateY(-2px);
        }
        .btn-flame { border-color: #9a3412; color: #fdba74; }
        .btn-flame:hover { background: #7c2d12; border-color: #ea580c; color: white; box-shadow: 0 0 10px rgba(234, 88, 12, 0.5); }
        .btn-damage-fire { border-color: #7f1d1d; color: #fca5a5; }
        .btn-damage-fire:hover { background: #7f1d1d; border-color: #ef4444; color: white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
      `}</style>
    </div>
  );
};
