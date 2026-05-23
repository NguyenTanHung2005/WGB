import React, { useState, useEffect } from 'react';
import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';
import { useMapStore } from '../store/mapStore';
import { Shield, Zap, Coins, Menu, Swords, Wind, Target } from 'lucide-react';

export const HUDOverlay: React.FC = () => {
  const { player, enemies } = useEntityStore();
  const { gold, setPhase, announcement } = useGameStore();
  const { rooms, currentRoomId } = useMapStore();
  
  // Update time for skill cooldown smoothly
  const [, setNow] = useState(performance.now());
  useEffect(() => {
    let animId: number;
    const updateTime = () => {
      setNow(performance.now());
      animId = requestAnimationFrame(updateTime);
    };
    animId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!player) return null;

  // --- STATS CALCULATION ---
  // const activeWeapon = player.weapons?.[player.activeWeaponIndex || 0];
  const currentTime = performance.now();
  const lastSkillTime = player.lastSkillUsedTime || 0;
  const skillCooldown = player.id === 'knight' ? 12000 : (player.id === 'rogue' ? 4000 : 10000);
  const skillElapsed = currentTime - lastSkillTime;
  const isSkillReady = skillElapsed >= skillCooldown;
  const cooldownPercent = Math.min(100, (skillElapsed / skillCooldown) * 100);

  const renderOrbs = () => {
    const hpPercent = (player.hp / player.maxHp) * 100;
    const sanityPercent = player.sanity !== undefined && player.maxSanity ? (player.sanity / player.maxSanity) * 100 : 0;
    const level = player.level || 1;
    const currentExp = player.exp || 0;
    const nextExp = 100 * Math.pow(1.5, level - 1);
    const expPercent = Math.min(100, (currentExp / nextExp) * 100);

    return (
      <div className="flex flex-col gap-2 drop-shadow-2xl">
        <div className="flex gap-4 items-end">
        {/* BLOOD ORB */}
        <div className="relative w-28 h-28 rounded-full border-4 border-[#1c1917] bg-[#0c0a09] overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(0,0,0,0.9)] flex items-end">
          {/* Lớp nền gai góc */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMxOTE3Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')] opacity-30" />
          
          {/* Máu lỏng */}
          <div 
            className="w-full bg-gradient-to-t from-[#450a0a] via-[#dc2626] to-[#ef4444] transition-all duration-500 ease-out relative shadow-[0_-5px_15px_rgba(220,38,38,0.5)]"
            style={{ height: `${hpPercent}%` }}
          >
            {/* Lớp sóng trên bề mặt */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-t from-transparent to-white opacity-20 blur-[2px] animate-pulse" />
          </div>

          {/* Ánh sáng phản chiếu kính */}
          <div className="absolute inset-0 rounded-full border border-black/50 pointer-events-none" />
          <div className="absolute top-1 left-2 w-10 h-10 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-[2px] pointer-events-none" />

          {/* Text HP */}
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,1)] mix-blend-overlay">
             <span className="text-white/80 text-[10px] font-bold">HP</span>
             <span className="text-white text-base font-bold font-mono">{Math.floor(player.hp)}</span>
          </div>
        </div>

        {/* SANITY ORB (Chỉ hiện nếu có maxSanity) */}
        {player.maxSanity && (
          <div className="relative w-24 h-24 rounded-full border-4 border-[#1c1917] bg-[#0c0a09] overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8),inset_0_0_15px_rgba(0,0,0,0.9)] flex items-end">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMxOTE3Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')] opacity-30" />
            
            <div 
              className="w-full bg-gradient-to-t from-[#2e1065] via-[#7c3aed] to-[#c084fc] transition-all duration-500 ease-out relative shadow-[0_-5px_15px_rgba(124,58,237,0.5)]"
              style={{ height: `${sanityPercent}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-t from-transparent to-white opacity-20 blur-[2px] animate-pulse" />
            </div>

            <div className="absolute inset-0 rounded-full border border-black/50 pointer-events-none" />
            <div className="absolute top-1 left-2 w-8 h-8 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-[2px] pointer-events-none" />

            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none drop-shadow-[0_2px_2px_rgba(0,0,0,1)] mix-blend-overlay">
               <span className="text-white/80 text-[9px] font-bold">MP</span>
               <span className="text-white text-sm font-bold font-mono">{Math.floor(player.sanity || 0)}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* EXP BAR */}
      <div className="w-full mt-2 bg-[#1c1917] border border-[#292524] rounded-full h-3 overflow-hidden shadow-inner flex items-center relative">
        <div 
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300"
          style={{ width: `${expPercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <span className="text-[9px] font-mono text-white font-bold drop-shadow-md">
             LVL {level}
           </span>
        </div>
      </div>

      {/* RELIC TRAY */}
      {player.relics && player.relics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 max-w-[150px]">
          {player.relics.map((relicId, i) => {
            const relicColor = relicId.includes('blood') || relicId.includes('vampire') ? '#ef4444' : 
                               relicId.includes('shield') ? '#3b82f6' : 
                               relicId.includes('boots') ? '#10b981' : '#f59e0b';
            return (
              <div 
                key={i} 
                className="w-5 h-5 bg-[#0f172a] border border-[#334155] rounded-sm flex items-center justify-center relative overflow-hidden shadow-lg"
                title={relicId}
              >
                <div className="absolute inset-0 opacity-20" style={{ backgroundColor: relicColor }} />
                <span className="text-[10px] font-bold z-10" style={{ color: relicColor }}>R</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
    );
  };

  const renderShield = () => {
    const shields = [];
    for (let i = 0; i < (player.maxShield || 0); i++) {
      shields.push(
        <Shield 
          key={`shield_${i}`} 
          size={18}
          className={`transition-all duration-300 ${i < (player.shield || 0) ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'text-slate-700 opacity-40'}`}
        />
      );
    }
    return shields;
  };

  const renderMiniMap = () => {
    if (rooms.length === 0) return null;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    rooms.forEach(r => {
      if (r.gridX < minX) minX = r.gridX;
      if (r.gridX > maxX) maxX = r.gridX;
      if (r.gridY < minY) minY = r.gridY;
      if (r.gridY > maxY) maxY = r.gridY;
    });

    const mapGrid = [];
    for (let y = minY; y <= maxY; y++) {
      const row = [];
      for (let x = minX; x <= maxX; x++) {
        const roomId = `room_${x}_${y}`;
        const room = rooms.find(r => r.id === roomId);
        
        if (!room) {
          row.push(<div key={`map_${x}_${y}`} className="map-cell" style={{ opacity: 0 }} />);
          continue;
        }

        const isCurrent = currentRoomId === roomId;
        const isVisited = room.state !== 'unvisited';

        let bgStyle = {
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          borderColor: '#1e293b'
        };
        
        if (isCurrent) {
          bgStyle = { backgroundColor: 'rgba(6, 182, 212, 0.8)', borderColor: '#22d3ee' };
        } else if (isVisited) {
          if (room.state === 'cleared') bgStyle = { backgroundColor: 'rgba(71, 85, 105, 0.8)', borderColor: '#64748b' };
          else if (room.state === 'combat_lock') bgStyle = { backgroundColor: 'rgba(127, 29, 29, 0.8)', borderColor: '#ef4444' };
          else bgStyle = { backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: '#334155' };
        }

        let label = '';
        let color = '#ffffff';
        let extraClass = '';
        
        if (room.type === 'boss') { 
          label = 'B'; 
          color = '#f43f5e'; 
          if (!isVisited) {
            bgStyle.borderColor = '#f43f5e';
            extraClass = 'animate-pulse';
          }
        } else if (isVisited) {
          if (room.type === 'shop') { label = 'S'; color = '#fbbf24'; }
          else if (room.type === 'chest') { label = 'C'; color = '#34d399'; }
          else if (room.type === 'start') { label = 'H'; color = '#38bdf8'; }
          else if (room.type === 'trap') { label = 'T'; color = '#f97316'; }
          else if (room.type === 'sacrifice') { label = 'A'; color = '#991b1b'; }
        }

        row.push(
          <div key={`map_${x}_${y}`} className={`map-cell ${extraClass}`} style={bgStyle}>
            <span style={{ color }}>{label}</span>
          </div>
        );
      }
      mapGrid.push(<div key={`map_row_${y}`} className="map-row">{row}</div>);
    }
    return mapGrid;
  };

  return (
    <div className="hud-overlay">
      {/* TOP SECTION */}
      <div className="hud-top">
        
        {/* HUD: Stats Left */}
        <div className="hud-stats-group">
          {/* Vitals (Orbs, Shield) */}
          <div className="hud-vitals">
            {/* Blood & Sanity Orbs */}
            <div className="hud-vital-box">
              {renderOrbs()}
            </div>
            
            {/* Shield */}
            {(player.maxShield || 0) > 0 && (
              <div className="hud-vital-box">
                <span className="hud-vital-label shd">SHD</span>
                <div className="hud-vital-icons">{renderShield()}</div>
              </div>
            )}
            
            {/* Relics */}
            {(player.relics && player.relics.length > 0) && (
              <div className="hud-vital-box">
                <span className="hud-vital-label" style={{ color: '#f472b6' }}>RLC</span>
                <div className="hud-vital-icons flex gap-1">
                  {player.relics.map(r => {
                     let icon = '❓';
                     if (r === 'vampire_tooth') icon = '🦷';
                     else if (r === 'hermes_boots') icon = '🪽';
                     else if (r === 'berserker_ring') icon = '💍';
                     return <span key={r} className="text-sm drop-shadow-[0_0_5px_rgba(244,114,182,0.8)]" title={r.replace('_', ' ').toUpperCase()}>{icon}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Resources: Gold & Score */}
            <div className="hud-resources">
              <div className="hud-gold">
                <Coins size={16} className="fill-amber-400" />
                {gold}
              </div>
            </div>
          </div>

        </div>

        {/* MENU BUTTON (TOP RIGHT) */}
        <button 
          className="hud-menu-btn fixed top-6 right-6 pointer-events-auto"
          onClick={() => setPhase('paused')}
        >
          <Menu size={28} />
        </button>
      </div>

      {/* GOTHIC HOTBAR (BOTTOM CENTER) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-2 pointer-events-auto drop-shadow-2xl">
        {/* Potions */}
        <div className="flex gap-2 mb-2">
           <div className="w-12 h-12 bg-[#1c1917] border-2 border-[#450a0a] rounded flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_10px_#000]">
             <div className="absolute bottom-0 w-full bg-red-600 opacity-50" style={{ height: '60%' }} />
             <span className="relative text-white font-bold text-xs drop-shadow-md">HP</span>
             <span className="absolute top-0 right-1 text-[9px] text-gray-400">1</span>
           </div>
           <div className="w-12 h-12 bg-[#1c1917] border-2 border-[#1e1b4b] rounded flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_10px_#000]">
             <div className="absolute bottom-0 w-full bg-blue-600 opacity-50" style={{ height: '40%' }} />
             <span className="relative text-white font-bold text-xs drop-shadow-md">MP</span>
             <span className="absolute top-0 right-1 text-[9px] text-gray-400">2</span>
           </div>
        </div>

        {/* Main Skill */}
        <div className="relative w-20 h-20 bg-[#0c0a09] border-4 border-[#3f3f46] rounded-lg flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.8)] mx-2">
           {/* Nền kim loại xước */}
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMxOTE3Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')] opacity-50" />
           
           {!isSkillReady && (
             <div 
               className="absolute bottom-0 w-full transition-all duration-100 ease-linear"
               style={{ 
                 height: `${100 - cooldownPercent}%`,
                 backgroundColor: player.classId === 'knight' ? 'rgba(251, 191, 36, 0.2)' : 
                                  player.classId === 'rogue' ? 'rgba(56, 189, 248, 0.2)' : 
                                  'rgba(167, 139, 250, 0.2)'
               }}
             />
           )}
           <div className="relative z-10">
             {player.classId === 'knight' && <Shield size={40} className={`${isSkillReady ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.8))' } : {}} />}
             {player.classId === 'rogue' && <Wind size={40} className={`${isSkillReady ? 'text-sky-400 fill-sky-400' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.8))' } : {}} />}
             {player.classId === 'mage' && <Zap size={40} className={`${isSkillReady ? 'text-purple-400 fill-purple-400' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.8))' } : {}} />}
             {(!player.classId || player.classId === 'archer') && <Target size={40} className={`${isSkillReady ? 'text-emerald-400' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.8))' } : {}} />}
           </div>
           <div className="absolute bottom-1 right-2 text-white/50 text-xs font-bold">E</div>
        </div>

        {/* Weapons */}
        <div className="flex gap-2 mb-2">
           {player.weapons?.map((wpn, idx) => (
             <div 
               key={`wpn_${idx}`} 
               className={`w-14 h-14 bg-[#1c1917] border-2 rounded flex flex-col items-center justify-center relative transition-colors ${idx === player.activeWeaponIndex ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'border-[#292524] grayscale opacity-60'}`}
             >
               <Swords size={20} className={idx === player.activeWeaponIndex ? 'text-cyan-400' : 'text-slate-500'} />
               <span className="text-[9px] text-white/80 mt-1 truncate w-full text-center px-1 font-mono">{wpn.name.substring(0,6)}</span>
               <span className="absolute top-0 left-1 text-[9px] text-amber-500/80 font-bold drop-shadow-md">LV{wpn.upgradeLevel || 0}</span>
               <span className="absolute bottom-0 right-1 text-[9px] text-gray-500 font-bold">{idx === 0 ? 'Q' : 'SPC'}</span>
             </div>
           ))}
        </div>
      </div>

      {/* BOTTOM SECTION: MINIMAP */}
      <div className="hud-bottom">
        <div className="hud-minimap">
          {renderMiniMap()}
        </div>
      </div>

      {/* BOSS HEALTH BAR */}
      {(() => {
        const boss = enemies.find(e => e.type === 'boss');
        if (!boss) return null;
        
        const hpPercent = Math.max(0, (boss.hp / boss.maxHp) * 100);
        const isEnraged = boss.hp < boss.maxHp * 0.3; // Dưới 30% máu
        
        return (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-2/3 max-w-2xl flex flex-col items-center">
            <h2 className={`text-2xl font-black tracking-widest mb-2 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] ${isEnraged ? 'text-red-500 animate-pulse' : 'text-red-300'}`}>
              {boss.name || 'QUÁI THAI KHỔNG LỒ'}
            </h2>
            <div className="w-full h-4 bg-black/80 border-2 border-red-900 rounded-full overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <div 
                className={`h-full transition-all duration-300 ${isEnraged ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-red-900 to-red-600'}`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* COMBO METER */}
      {(player.comboCount || 0) > 2 && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center rotate-[-10deg] animate-bounce pointer-events-none">
          <div className="text-[64px] font-black text-amber-500 drop-shadow-[0_0_20px_rgba(245,158,11,1)] leading-none" style={{ fontFamily: 'var(--font-serif)' }}>
            {player.comboCount}
          </div>
          <div className="text-2xl font-bold text-amber-200 tracking-[0.2em] uppercase leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" style={{ fontFamily: 'var(--font-heading)' }}>
            Combo
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT OVERLAY */}
      {announcement && currentTime < announcement.until && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-[100] animate-[pulse_1s_ease-in-out]">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" style={{ WebkitTextStroke: '2px #451a03' }}>
            {announcement.text}
          </h1>
          {announcement.subtext && (
            <p className="mt-4 text-2xl font-bold text-amber-100/90 tracking-[0.2em] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase">
              {announcement.subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
