import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useEntityStore } from '../store/entityStore';
import { useMapStore } from '../store/mapStore';
import { CHARACTER_CLASSES } from '../data/classes';
import { WEAPONS } from '../data/weapons';
import { Shield, Flame, Heart } from 'lucide-react';

export const MenuScreen: React.FC = () => {
  const { setPhase, setSelectedClassId, setTransitioning, currentFloor, setCurrentFloor } = useGameStore();
  const { setPlayer, clearRoomEntities, spawnRoomElements, addAlly } = useEntityStore();
  const { generateDungeon } = useMapStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{ x: number, y: number, vx: number, vy: number, r: number, alpha: number }> = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Khởi tạo hạt
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: Math.random() * 1.5 + 0.5,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(153, 27, 27, ${p.alpha})`; // Red ember
        ctx.fill();
        
        // Di chuyển
        p.x += p.vx;
        p.y += p.vy;
        
        // Rơi lả tả
        p.vx += (Math.random() - 0.5) * 0.1;
        if (p.vx > 1) p.vx = 1;
        if (p.vx < -1) p.vx = -1;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSelectClass = (classId: string) => {
    const chosenClass = CHARACTER_CLASSES.find(c => c.id === classId);
    if (!chosenClass) return;

    setSelectedClassId(classId);
    generateDungeon();

    let defaultWeapons = [];
    const pistol = WEAPONS.find(w => w.id === 'rusty_pistol')!;
    if (classId === 'mage') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'magic_staff')!, pistol];
    } else if (classId === 'rogue') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'dagger')!, pistol];
    } else if (classId === 'archer') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'wooden_bow')!, pistol];
    } else if (classId === 'ninja') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'kunai')!, pistol];
    } else if (classId === 'paladin') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'holy_mace')!, pistol];
    } else if (classId === 'berserker') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'heavy_axe')!, pistol];
    } else if (classId === 'summoner') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'blood_grimoire')!, pistol];
    } else if (classId === 'bomb_devil') {
      defaultWeapons = [WEAPONS.find(w => w.id === 'bomb_detonator')!, pistol];
    } else {
      defaultWeapons = [WEAPONS.find(w => w.id === 'broadsword')!, pistol];
    }

    setPlayer({
      id: chosenClass.id,
      type: 'player',
      x: 450,
      y: 350,
      radius: 18,
      vx: 0,
      vy: 0,
      hp: chosenClass.maxHp,
      maxHp: chosenClass.maxHp,
      shield: chosenClass.maxShield,
      maxShield: chosenClass.maxShield,
      sanity: 100,
      maxSanity: 100,
      speed: chosenClass.speed,
      angle: 0,
      activeWeaponIndex: 0,
      weapons: defaultWeapons,
      classId: chosenClass.id,
      statusEffects: [],
      lastAttackTime: 0,
      lastSkillUsedTime: 0
    });

    clearRoomEntities();
    spawnRoomElements('start');
    
    // Spawn Fairy Companion
    addAlly({
      id: 'fairy_companion',
      type: 'ally',
      x: 450 - 30,
      y: 350 - 30,
      radius: 6,
      vx: 0,
      vy: 0,
      hp: 9999,
      maxHp: 9999,
      speed: 4,
      angle: 0,
      aiPattern: 'follow',
      templateId: 'fairy',
      statusEffects: [],
      damage: 2,
      color: '#fef08a'
    });
    
    setTransitioning(true);
    setTimeout(() => {
      setPhase('cutscene_intro');
      setTimeout(() => setTransitioning(false), 500);
    }, 1500);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({
      x: (e.clientX / window.innerWidth) - 0.5,
      y: (e.clientY / window.innerHeight) - 0.5
    });
  };

  return (
    <div 
      className="bg-[#050505] text-[#737373]" 
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', padding: 0 }}
      onMouseMove={handleMouseMove}
    >
      {/* Lớp Parallax Background */}
      <div 
        style={{ 
          position: 'absolute', inset: -50, 
          background: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #000000 80%)',
          transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      />
      
      {/* Background Canvas for Embers */}
      <canvas 
        ref={canvasRef} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }}
      />
      
      <div style={{ 
        zIndex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', 
        height: '100%', width: '100%', overflowY: 'auto', paddingTop: '80px', paddingBottom: '80px' 
      }}>
        <div 
          className="menu-title text-[#ef4444] tracking-[0.2em] mb-4" 
          style={{ fontFamily: 'var(--font-serif)', fontSize: '72px', textShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
        >
          ELDRITCH SURVIVOR
        </div>
        
        <p className="text-xl mb-6 font-serif tracking-widest text-[#a3a3a3]" style={{ fontFamily: 'var(--font-serif)' }}>
          CHOOSE YOUR CHARACTER
        </p>

        {/* --- FLOOR SELECTION --- */}
        <div className="flex flex-col items-center mb-10 z-10">
          <p className="text-sm mb-3 font-serif tracking-[0.2em] text-[#d8b4fe]" style={{ fontFamily: 'var(--font-serif)', textShadow: '0 0 10px rgba(168,85,247,0.4)' }}>
            SELECT STARTING FLOOR
          </p>
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((floor) => (
              <button
                key={floor}
                onClick={() => setCurrentFloor(floor)}
                className={`w-12 h-12 flex items-center justify-center rounded border-2 font-serif font-bold text-lg transition-all duration-300 ${
                  currentFloor === floor 
                    ? 'border-[#c084fc] bg-[#3b0764]/80 text-[#f3e8ff] shadow-[0_0_15px_rgba(168,85,247,0.6)]' 
                    : 'border-[#4c1d95]/50 bg-[#1e1b4b]/50 text-[#a78bfa] hover:border-[#c084fc]/70'
                }`}
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {floor}
              </button>
            ))}
          </div>
          <p className="text-xs mt-3 text-gray-500 italic">
            {currentFloor === 1 && "Floor 1: Dungeon - Nơi ác mộng bắt đầu"}
            {currentFloor === 2 && "Floor 2: Volcano - Hỏa ngục dung nham"}
            {currentFloor === 3 && "Floor 3: Ice - Vực thẳm băng giá"}
            {currentFloor === 4 && "Floor 4: Moss - Khu rừng rêu độc"}
            {currentFloor === 5 && "Floor 5: Blood - Huyết hạm vĩnh hằng"}
          </p>
        </div>

      <div 
        className="flex flex-wrap justify-center gap-8 max-w-6xl w-full px-4 z-10" 
        style={{ transform: `translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`, transition: 'transform 0.1s ease-out' }}
      >
        {CHARACTER_CLASSES.map(cls => (
          <div 
            key={cls.id}
            onClick={() => handleSelectClass(cls.id)}
            className="group relative flex flex-col items-center cursor-pointer transition-transform duration-500 hover:-translate-y-4"
          >
            {/* Ánh sáng chiếu từ trên xuống khi hover */}
            <div className="absolute -top-20 w-32 h-64 bg-gradient-to-b from-white/0 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Nhân vật đứng trên bệ */}
            <div className="relative w-40 h-56 flex flex-col items-center justify-end z-10 mb-[-10px]">
               {/* Hình bóng nhân vật (Silhouette) */}
               <div className={`w-24 h-32 rounded-t-full border transition-all duration-300 relative overflow-hidden flex items-center justify-center
                  ${cls.id === 'berserker' ? 'bg-[#1c1917] border-[#000] shadow-[0_0_20px_rgba(153,27,27,0.8)] group-hover:border-[#991b1b]' :
                    cls.id === 'bomb_devil' ? 'bg-[#1c1917] border-[#000] shadow-[0_0_20px_rgba(255,255,255,0.5)] group-hover:border-[#000]' :
                    'bg-[#1c1917] border-[#292524] shadow-[0_0_20px_rgba(0,0,0,0.8)] group-hover:border-[#fbbf24]'}
               `}>
                  
                  {/* Highly Detailed Pixel Art Image (Tự động map theo ID) */}
                  <div className="absolute inset-0 w-full h-full bg-[#1c1917]">
                    <img 
                      src={`/images/${cls.id}_card.png`} 
                      alt={`${cls.name} Pixel Art`} 
                      className="w-full h-full object-cover opacity-100 group-hover:scale-110 transition-transform duration-300" 
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => {
                        // Ẩn ảnh nếu chưa có file
                        e.currentTarget.style.opacity = '0';
                      }}
                    />
                    {/* Dấu chấm hỏi mờ hiện lên khi không có ảnh (làm nền) */}
                    <div className="absolute inset-0 flex items-center justify-center -z-10">
                      <span className="text-[#52525b] group-hover:text-[#fbbf24] font-serif text-6xl opacity-30 transition-colors">?</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Bệ đá (Pedestal) */}
            <div className="relative w-48 h-16">
              {/* Mặt trên */}
              <div className="absolute top-0 w-full h-8 bg-[#292524] rounded-[50%] border-t-2 border-[#52525b] group-hover:border-[#fbbf24] shadow-[0_0_15px_rgba(0,0,0,1)] transition-colors z-20" />
              {/* Thân bệ */}
              <div className="absolute top-4 w-full h-12 bg-gradient-to-b from-[#1c1917] to-[#0c0a09] border-x border-[#292524] rounded-b-[50%] z-10" />
            </div>

            {/* Thông tin Class */}
            <div className={`mt-8 text-center bg-black/80 backdrop-blur-sm border p-4 w-64 opacity-70 group-hover:opacity-100 transition-all duration-300 relative overflow-hidden
              ${cls.id === 'berserker' ? 'border-[#991b1b] shadow-[0_5px_15px_rgba(153,27,27,0.3)]' :
                cls.id === 'bomb_devil' ? 'border-[#e5e5e5] shadow-[0_5px_15px_rgba(255,255,255,0.2)]' :
                'border-[#292524] group-hover:border-[#fbbf24]/50'}`}
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity
                ${cls.id === 'berserker' ? 'via-[#991b1b]' : cls.id === 'bomb_devil' ? 'via-[#e5e5e5]' : 'via-[#fbbf24]'}`} 
              />
              <h2 className={`font-serif tracking-[0.2em] text-lg mb-2 uppercase
                ${cls.id === 'berserker' ? 'text-[#ef4444] font-black drop-shadow-[0_0_5px_red]' : 
                  cls.id === 'bomb_devil' ? 'text-[#ffffff] font-light drop-shadow-[0_0_5px_white]' : 
                  'text-[#fbbf24]'}`}
              >
                {cls.name}
              </h2>
              
              <div className="flex justify-center gap-4 text-xs font-mono text-gray-400 mb-4">
                <span className="flex items-center gap-1"><Heart size={12} className={cls.id === 'berserker' ? 'text-[#991b1b]' : 'text-red-500'} /> {cls.maxHp}</span>
                <span className="flex items-center gap-1"><Shield size={12} className="text-cyan-500" /> {cls.maxShield}</span>
              </div>
              
              <div className={`border-t pt-2 mt-2 ${cls.id === 'berserker' ? 'border-[#991b1b]/50' : cls.id === 'bomb_devil' ? 'border-[#e5e5e5]/30' : 'border-[#292524]'}`}>
                <div className={`text-[10px] uppercase tracking-widest mb-1 flex items-center justify-center gap-1
                  ${cls.id === 'berserker' ? 'text-[#ef4444]' : cls.id === 'bomb_devil' ? 'text-[#e5e5e5]' : 'text-[#fbbf24]'}`}
                >
                   <Flame size={10} /> {cls.skillName}
                </div>
                <p className="text-xs text-gray-500 italic line-clamp-3">
                  {cls.skillDescription}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-12 z-10 gap-4 flex-wrap max-w-4xl">
        <button 
          className="px-8 py-3 bg-transparent text-[#7f1d1d] hover:text-[#ef4444] border-b border-[#7f1d1d] hover:border-[#ef4444] font-serif uppercase tracking-widest transition-all duration-300"
          onClick={() => setPhase('cutscene_ending')}
        >
          Watch Epilogue (Debug)
        </button>
        <button 
          className="px-8 py-3 bg-transparent text-[#0ea5e9] hover:text-[#38bdf8] border-b border-[#0ea5e9] hover:border-[#38bdf8] font-serif uppercase tracking-widest transition-all duration-300"
          onClick={() => setPhase('boss_preview')}
        >
          Dragon Boss Preview
        </button>
        <button 
          className="px-8 py-3 bg-transparent text-[#84cc16] hover:text-[#bef264] border-b border-[#84cc16] hover:border-[#bef264] font-serif uppercase tracking-widest transition-all duration-300"
          onClick={() => setPhase('kesanga_preview')}
        >
          Kẻ Sa Ngã Boss (2000px)
        </button>
        <button 
          className="px-8 py-3 bg-transparent text-[#fde047] hover:text-[#fef08a] border-b border-[#fde047] hover:border-[#fef08a] font-serif uppercase tracking-widest transition-all duration-300"
          onClick={() => setPhase('gausamset_preview')}
        >
          Gấu Sấm Sét (2000px)
        </button>
        <button 
          className="px-8 py-3 bg-transparent text-[#fca5a5] hover:text-[#ef4444] border-b border-[#fca5a5] hover:border-[#ef4444] font-serif uppercase tracking-widest transition-all duration-300"
          onClick={() => setPhase('reze_preview')}
        >
          Reze Quỷ Bom (Playable)
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-8 font-serif text-[10px] tracking-widest text-[#52525b] uppercase opacity-50">
        <span>WASD: Move</span>
        <span>LMB: Auto Aim</span>
        <span>RMB/E: Skill</span>
        <span>SPC/Q: Weapon</span>
        <span>F: Interact</span>
      </div>
      </div>
    </div>
  );
};
