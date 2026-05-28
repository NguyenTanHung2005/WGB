import React, { useEffect, useRef, useState, useMemo } from 'react';
import { generateGauSamSetSpriteSheet } from './PixelDesign';
import { BossGauSamSet } from './BossGauSamSet';
import type { GauSamSetState } from './BossGauSamSet';
import { useGameLoop } from '../../hooks/useGameLoop';

// Helper to generate the Frozen Peak Map
const generateFrozenPeakMap = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const size = 4000; // Khủng hơn cho Gấu Sấm Sét
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sàn băng giá xám nhạt/xanh
  ctx.fillStyle = '#0f172a'; // Nền đậm
  ctx.fillRect(0, 0, size, size);

  // Mảng tuyết lớn
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#1e293b' : '#334155';
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 100 + Math.random()*200, 50 + Math.random()*100, Math.random()*Math.PI, 0, Math.PI*2);
    ctx.fill();
  }

  // Tinh thể băng (Ice crystals) đâm lên
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#38bdf8'; // Ice blue
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 20 - Math.random()*30, y + 40 + Math.random()*50);
    ctx.lineTo(x + 20 + Math.random()*30, y + 40 + Math.random()*50);
    ctx.fill();
    // Phản quang tinh thể
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 40 + Math.random()*50);
    ctx.lineTo(x + 20, y + 40 + Math.random()*20);
    ctx.fill();
  }

  return canvas;
};

export const GauSamSetPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bossRef = useRef<BossGauSamSet | null>(null);
  
  const [debug, setDebug] = useState(false);
  const [scale, setScale] = useState(0.8);
  const [hp, setHp] = useState(8000);
  const [phase, setPhase] = useState(1);
  const [stateName, setStateName] = useState<GauSamSetState>('idle');
  const [lightningCount, setLightningCount] = useState(0);

  const spriteSheet = useMemo(() => generateGauSamSetSpriteSheet(), []);
  const bgMap = useMemo(() => generateFrozenPeakMap(), []);

  const playerPosRef = useRef({ x: 500, y: 700 });
  const snowOffset = useRef(0);

  useEffect(() => {
    if (canvasRef.current) {
      bossRef.current = new BossGauSamSet(1000, 1000, spriteSheet);
      bossRef.current.onPhaseChange = (p) => setPhase(p);
      bossRef.current.onDeath = () => setStateName('death');
    }
  }, [spriteSheet]);

  useEffect(() => {
    if (bossRef.current) {
      bossRef.current.scale = scale;
    }
  }, [scale]);

  useGameLoop((dt) => {
    if (!canvasRef.current || !bossRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    bossRef.current.update(dt, playerPosRef.current);
    snowOffset.current += dt * 100; // Tuyết rơi
    if (snowOffset.current > 4000) snowOffset.current = 0;
    
    if (bossRef.current.state !== stateName && bossRef.current.state !== 'death') {
      setStateName(bossRef.current.state);
    }
    setHp(Math.floor(bossRef.current.hp));
    setLightningCount(bossRef.current.lightningStrikes.length);

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

    // 1. Vẽ Map nền
    ctx.drawImage(bgMap, -1500, -1500);

    // Grid tham chiếu (Nhỏ, mờ)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = -1000; i < 3000; i += 200) {
      ctx.beginPath(); ctx.moveTo(i, -1000); ctx.lineTo(i, 3000); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1000, i); ctx.lineTo(3000, i); ctx.stroke();
    }

    // 2. Vẽ Mock Player (Target của Gấu)
    ctx.fillStyle = '#60a5fa';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#60a5fa';
    ctx.beginPath(); ctx.arc(playerPosRef.current.x, playerPosRef.current.y, 15, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'white'; 
    ctx.font = 'bold 12px sans-serif'; 
    ctx.fillText('TARGET', playerPosRef.current.x - 22, playerPosRef.current.y - 25);

    // 3. Render Boss & Sấm sét
    bossRef.current.render(ctx, debug);

    // 4. Hiệu ứng Bão tuyết overlay nhẹ
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for(let i=0; i<100; i++) {
      const px = (i * 123) % rect.width - cx;
      const py = (i * 321 + snowOffset.current) % rect.height - cy;
      ctx.fillRect(px, py, 2, 8);
    }

    ctx.restore();
  });

  const handleAction = (action: GauSamSetState) => {
    if (bossRef.current) bossRef.current.changeState(action);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && bossRef.current) {
      // Tính ngược lại tọa độ thế giới từ tọa độ chuột
      const cx = rect.width/2 - bossRef.current.x;
      const cy = rect.height/2 - bossRef.current.y + 150;
      
      playerPosRef.current = {
        x: e.clientX - rect.left - cx,
        y: e.clientY - rect.top - cy
      };
    }
  };

  const maxHp = 8000;
  const hpPercent = Math.max(0, (hp / maxHp) * 100);

  return (
    <div onMouseMove={handleMouseMove} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#020617', color: 'white', fontFamily: 'sans-serif', cursor: 'crosshair' }}>
      
      {/* Canvas Fullscreen */}
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header - Boss Title & HP Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
          <h1 style={{ fontSize: '36px', color: '#fde047', textShadow: '0 0 25px rgba(253,224,71,0.8)', letterSpacing: '6px', margin: '0 0 10px 0', fontWeight: '900' }}>GẤU SẤM SÉT</h1>
          
          <div style={{ width: '80%', maxWidth: '900px', height: '28px', background: '#0f172a', border: '3px solid #1e293b', borderRadius: '14px', overflow: 'hidden', position: 'relative', boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)' }}>
            <div style={{ width: `${hpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', transition: 'width 0.2s ease-out' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 'bold', textShadow: '1px 1px 3px black' }}>
              {hp} / {maxHp} (Phase {phase})
            </div>
          </div>
          {lightningCount > 0 && <div style={{ color: '#fde047', marginTop: '15px', fontSize: '20px', animation: 'flash 0.5s infinite', textShadow: '0 0 15px #fde047', fontWeight: 'bold' }}>⚡ SẤM SÉT ĐANG GIÁNG XUỐNG! ⚡</div>}
        </div>

        {/* Controls Panel (Bottom Area) */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ background: 'rgba(2, 6, 23, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b', backdropFilter: 'blur(12px)', pointerEvents: 'auto', minWidth: '260px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#94a3b8', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>Hệ thống Quét</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '15px', color: '#e2e8f0' }}>
              <div>Trạng thái AI: <strong style={{ color: '#38bdf8', textTransform: 'uppercase' }}>{stateName}</strong></div>
              <div>Mật độ sấm sét: <strong style={{ color: '#fde047' }}>{lightningCount} tia</strong></div>
              
              <div style={{ marginTop: '10px' }}>
                <div style={{ marginBottom: '5px' }}>Khẩu độ Zoom ({scale.toFixed(1)}x)</div>
                <input type="range" min="0.2" max="2" step="0.1" value={scale} onChange={e => setScale(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#38bdf8' }} />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '5px' }}>
                <input type="checkbox" checked={debug} onChange={e => setDebug(e.target.checked)} style={{accentColor: '#38bdf8'}} /> Hiển thị Hitbox Matrix
              </label>
              
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px', fontStyle: 'italic' }}>
                * Target (Mục tiêu xanh) di chuyển theo chuột của bạn. Boss sẽ tự động quay mặt và khóa mục tiêu bằng sấm sét.
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(2, 6, 23, 0.85)', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b', backdropFilter: 'blur(12px)', pointerEvents: 'auto' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#94a3b8', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>Kích hoạt Cưỡng chế</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', maxWidth: '400px' }}>
              <button onClick={() => handleAction('idle')} className="btn-ice">Quan sát (Idle)</button>
              <button onClick={() => handleAction('attack')} className="btn-ice">Cận chiến</button>
              <button onClick={() => handleAction('special')} className="btn-ice btn-lightning">Gọi Sấm Sét Khủng</button>
              <button onClick={() => handleAction('roar')} className="btn-ice">Gầm thét</button>
              <button onClick={() => bossRef.current?.takeDamage(2000)} className="btn-ice btn-damage-ice">Sát thương 2000 HP</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .btn-ice {
          background: #0f172a; color: #bae6fd; border: 1px solid #1e293b; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.5);
        }
        .btn-ice:hover {
          background: #1e293b; border-color: #38bdf8; color: white; transform: translateY(-2px); box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
        }
        .btn-lightning { border-color: #ca8a04; color: #fde047; }
        .btn-lightning:hover { background: #422006; border-color: #facc15; color: white; box-shadow: 0 0 15px rgba(250, 204, 21, 0.5); }
        .btn-damage-ice { border-color: #991b1b; color: #fca5a5; }
        .btn-damage-ice:hover { background: #7f1d1d; border-color: #ef4444; color: white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); }
        
        @keyframes flash {
          0%, 100% { opacity: 1; text-shadow: 0 0 20px #fde047; }
          50% { opacity: 0.5; text-shadow: 0 0 5px #fde047; }
        }
      `}</style>
    </div>
  );
};
