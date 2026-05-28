import React, { useEffect, useRef, useState, useMemo } from 'react';
import { generateRezeSpriteSheet } from './PixelDesign';
import { CharacterReze } from './CharacterReze';
import { InputManager } from '../../systems/InputManager';
import { useGameLoop } from '../../hooks/useGameLoop';

export const RezePreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charRef = useRef<CharacterReze | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  
  const [debug, setDebug] = useState(false);
  const [hp, setHp] = useState(100);
  const [mp, setMp] = useState(200);
  const [stateName, setStateName] = useState('transform');
  const [cdBasic, setCdBasic] = useState(0);
  const [cdSkill1, setCdSkill1] = useState(0);

  const spriteSheet = useMemo(() => generateRezeSpriteSheet(), []);

  useEffect(() => {
    inputRef.current = new InputManager();
    if (canvasRef.current) {
      charRef.current = new CharacterReze(400, 700, spriteSheet);
    }
  }, [spriteSheet]);

  useGameLoop((dt) => {
    if (!canvasRef.current || !charRef.current || !inputRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    inputRef.current.update();
    
    // World info (Floor is at Y = 700)
    charRef.current.update(dt, inputRef.current, { floorY: 700 });
    
    // Sync React State (Throttled for performance in real app, but fine here)
    if (charRef.current.state !== stateName) setStateName(charRef.current.state);
    setHp(charRef.current.hp);
    setMp(charRef.current.mp);
    setCdBasic(charRef.current.cooldowns.basic_atk);
    setCdSkill1(charRef.current.cooldowns.skill1);

    const dpr = window.devicePixelRatio || 1;
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (canvasRef.current.width !== rect.width * dpr || canvasRef.current.height !== rect.height * dpr) {
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    
    // 1. Draw Background (Training Facility)
    ctx.fillStyle = '#0f172a'; // Tối mờ
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Lưới Background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    for (let i = 0; i < rect.width; i += 100) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 700); ctx.stroke();
    }
    for (let j = 0; j < 700; j += 100) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(rect.width, j); ctx.stroke();
    }

    // Floor
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 700, rect.width, rect.height - 700);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 700); ctx.lineTo(rect.width, 700); ctx.stroke();

    // 2. Render Player
    charRef.current.render(ctx, debug);

    // 3. Render Particles/Projectiles (Nếu có, ở đây là demo tĩnh từ logic)
    // (Trong hệ thống thật sẽ có lớp ParticleManager)

    ctx.restore();
  });

  const handleTakeDamage = () => {
    if (charRef.current) charRef.current.takeDamage(20);
  };

  const hpPercent = Math.max(0, (hp / 100) * 100);
  const mpPercent = Math.max(0, (mp / 200) * 100);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#020617', color: 'white', fontFamily: 'sans-serif' }}>
      
      {/* Canvas Fullscreen */}
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }} 
      />

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        {/* Header - Player Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'auto' }}>
          
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '15px', borderRadius: '10px', border: '2px solid #334155', minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <div style={{ width: '50px', height: '50px', background: '#b91c1c', borderRadius: '50%', border: '2px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>REZE</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', color: '#fca5a5' }}>Quỷ Bom (Lvl 1)</h2>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>EXP: 0 / 100</div>
              </div>
            </div>

            {/* HP */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#fca5a5' }}>HP</span><span>{hp} / 100</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: '#3f3f46', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${hpPercent}%`, height: '100%', background: '#ef4444', transition: 'width 0.2s' }} />
              </div>
            </div>

            {/* MP */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#93c5fd' }}>MP</span><span>{mp} / 200</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: '#3f3f46', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${mpPercent}%`, height: '100%', background: '#3b82f6', transition: 'width 0.2s' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '15px', borderRadius: '10px', border: '2px solid #334155' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px' }}>Hướng dẫn điều khiển (Bấm vào màn hình trước)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#e2e8f0' }}>
              <div>Di chuyển: <strong style={{ color: '#fde047' }}>W A S D</strong></div>
              <div>Đánh thường: <strong style={{ color: '#fde047' }}>J</strong> hoặc <strong style={{ color: '#fde047' }}>Z</strong></div>
              <div>Nhảy: <strong style={{ color: '#fde047' }}>SPACE</strong> / <strong style={{ color: '#fde047' }}>W</strong></div>
              <div>Kỹ năng 1: <strong style={{ color: '#fde047' }}>U</strong> hoặc <strong style={{ color: '#fde047' }}>X</strong></div>
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={debug} onChange={e => setDebug(e.target.checked)} /> Hiện Hitbox
              </label>
              <button onClick={handleTakeDamage} style={{ marginTop: '10px', background: '#7f1d1d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Nhận 20 Dmg</button>
            </div>
          </div>

        </div>

        {/* Bottom Panel - Skills & State */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'auto' }}>
          <div style={{ fontSize: '18px', color: '#cbd5e1', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px' }}>
            Trạng thái: <strong style={{ color: '#fde047', textTransform: 'uppercase' }}>{stateName}</strong>
          </div>

          {/* Skill Cooldowns UI */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ position: 'relative', width: '60px', height: '60px', background: '#1e293b', border: '2px solid #64748b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#fca5a5', fontWeight: 'bold' }}>ATK (J)</div>
              {cdBasic > 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{cdBasic.toFixed(1)}</div>}
            </div>

            <div style={{ position: 'relative', width: '60px', height: '60px', background: '#1e293b', border: '2px solid #ca8a04', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#fde047', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }}>BAY LÊN<br/>(U)</div>
              {cdSkill1 > 0 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{cdSkill1.toFixed(1)}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
