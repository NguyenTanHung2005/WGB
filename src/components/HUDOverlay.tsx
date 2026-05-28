import React, { useState, useEffect } from 'react';
import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';
import { useMapStore } from '../store/mapStore';
import { Shield, Zap, Coins, Menu, Swords, Wind, Target } from 'lucide-react';

export const HUDOverlay: React.FC = () => {
  const { player, enemies } = useEntityStore();
  const { gold, setPhase, announcement, currentFloor } = useGameStore();
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
        <div className="relative w-28 h-28 rounded-full border-[3px] border-[#3f3f46] bg-[#09090b] overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9),0_0_0_5px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,1)] flex items-end">
          {/* Glass Specular Reflection - Inner Top */}
          <div className="absolute top-1 left-2 w-20 h-10 bg-gradient-to-b from-white/30 to-transparent rounded-[100%] blur-[1px] pointer-events-none z-20" style={{ transform: 'rotate(-20deg)' }} />
          
          {/* Lớp nền gai góc */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMxOTE3Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')] opacity-20" />
          
          {/* Máu lỏng */}
          <div 
            className="w-full bg-gradient-to-t from-[#450a0a] via-[#dc2626] to-[#ff6b6b] transition-all duration-500 ease-out relative shadow-[0_-5px_25px_rgba(220,38,38,0.7)] z-10"
            style={{ height: `${hpPercent}%` }}
          >
            {/* Sóng bọt trên bề mặt */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-white/40 blur-[1px] animate-[pulse_2s_infinite]" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          </div>

          {/* Vành kim loại xước bọc viền (Rim light) */}
          <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-30" />
          <div className="absolute bottom-1 right-2 w-10 h-6 bg-gradient-to-tl from-white/10 to-transparent rounded-[100%] blur-[2px] pointer-events-none z-20" />

          {/* Text HP */}
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-40 mix-blend-plus-lighter">
             <span className="text-red-200/90 text-[10px] font-black tracking-widest uppercase">HP</span>
             <span className="text-white text-lg font-black font-mono tracking-tight">{Math.floor(player.hp)}</span>
          </div>
        </div>

        {/* SANITY ORB (Chỉ hiện nếu có maxSanity) */}
        {player.maxSanity && (
          <div className="relative w-24 h-24 rounded-full border-[3px] border-[#3f3f46] bg-[#09090b] overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9),0_0_0_5px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,1)] flex items-end">
            <div className="absolute top-1 left-2 w-16 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-[100%] blur-[1px] pointer-events-none z-20" style={{ transform: 'rotate(-20deg)' }} />
            
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMxOTE3Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')] opacity-20" />
            
            <div 
              className="w-full bg-gradient-to-t from-[#2e1065] via-[#7c3aed] to-[#d8b4fe] transition-all duration-500 ease-out relative shadow-[0_-5px_25px_rgba(124,58,237,0.7)] z-10"
              style={{ height: `${sanityPercent}%` }}
            >
              <div className="absolute top-0 left-0 right-0 h-3 bg-white/40 blur-[1px] animate-[pulse_2s_infinite]" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            </div>

            <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-30" />
            <div className="absolute bottom-1 right-2 w-8 h-4 bg-gradient-to-tl from-white/10 to-transparent rounded-[100%] blur-[2px] pointer-events-none z-20" />

            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,1)] z-40 mix-blend-plus-lighter">
               <span className="text-purple-200/90 text-[10px] font-black tracking-widest uppercase">MP</span>
               <span className="text-white text-base font-black font-mono tracking-tight">{Math.floor(player.sanity || 0)}</span>
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
            <div className="hud-resources flex flex-col gap-2 pointer-events-auto">
              <div className="hud-gold flex items-center gap-2 bg-[#0c0a09] border-2 border-[#fbbf24]/30 px-3 py-1 rounded drop-shadow-md">
                <Coins size={16} className="text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <span className="text-[#fef08a] font-serif font-bold text-sm tracking-wider">{gold}</span>
              </div>
              <div className="hud-floor flex items-center gap-2 bg-[#0c0a09] border-2 border-[#a855f7]/30 px-3 py-1 rounded drop-shadow-md">
                <span className="text-[#d8b4fe] font-serif font-bold text-sm tracking-wider">FLOOR {currentFloor}</span>
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
        <div className="relative w-20 h-20 bg-[#0c0a09] border-[3px] border-[#52525b] rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.9),inset_0_0_15px_rgba(0,0,0,0.9)] mx-2">
           {/* Nền kim loại xước nhám */}
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWMxOTE3Ij48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuNSI+PC9yZWN0Pgo8L3N2Zz4=')] opacity-50" />
           <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/60 pointer-events-none" />
           
           {!isSkillReady && (
             <div 
               className="absolute bottom-0 w-full transition-all duration-100 ease-linear backdrop-blur-sm"
               style={{ 
                 height: `${100 - cooldownPercent}%`,
                 backgroundColor: player.classId === 'knight' ? 'rgba(251, 191, 36, 0.15)' : 
                                  player.classId === 'rogue' ? 'rgba(56, 189, 248, 0.15)' : 
                                  'rgba(167, 139, 250, 0.15)',
                 boxShadow: `0 -2px 10px ${
                   player.classId === 'knight' ? 'rgba(251, 191, 36, 0.5)' : 
                   player.classId === 'rogue' ? 'rgba(56, 189, 248, 0.5)' : 
                   'rgba(167, 139, 250, 0.5)'
                 }`
               }}
             >
                <div className="w-full h-1 bg-white/40 absolute top-0" />
             </div>
           )}
           <div className={`relative z-10 transition-transform duration-200 ${isSkillReady ? 'scale-110' : 'scale-90 opacity-50'}`}>
             {player.classId === 'knight' && <Shield size={44} className={`${isSkillReady ? 'text-amber-400 fill-amber-500' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 15px rgba(251,191,36,0.9))' } : {}} />}
             {player.classId === 'rogue' && <Wind size={44} className={`${isSkillReady ? 'text-sky-400 fill-sky-500' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 15px rgba(56,189,248,0.9))' } : {}} />}
             {player.classId === 'mage' && <Zap size={44} className={`${isSkillReady ? 'text-purple-400 fill-purple-500' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 15px rgba(167,139,250,0.9))' } : {}} />}
             {(!player.classId || player.classId === 'archer') && <Target size={44} className={`${isSkillReady ? 'text-emerald-400' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 15px rgba(52,211,153,0.9))' } : {}} />}
           </div>
           {/* Phím bấm E */}
           <div className="absolute bottom-1 right-2 text-white font-black text-xs drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">E</div>
           {/* Viền sáng nếu ready */}
           {isSkillReady && <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none animate-pulse" />}
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

      {/* EPIC BOSS HEALTH BAR & EFFECTS (DARK SOULS / ELDEN RING STYLE) */}
      {(() => {
        const { activeBossInstance } = useEntityStore.getState();
        if (!activeBossInstance || activeBossInstance.state === 'death' || activeBossInstance.hp <= 0) return null;
        
        const hpPercent = Math.max(0, (activeBossInstance.hp / activeBossInstance.maxHP) * 100);
        const trailingPercent = activeBossInstance.trailingHpPercent ?? hpPercent;
        const isEnraged = activeBossInstance.phase >= 2 || hpPercent < 30;
        const bossPhase = activeBossInstance.phase || 1;
        const maxPhase = activeBossInstance.maxPhase || 3;
        
        return (
          <>
            {/* Cinematic Vignette — viền tối / đỏ tùy trạng thái boss */}
            <div 
              className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${isEnraged ? 'bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(127,29,29,0.45)_100%)]' : 'bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.65)_100%)]'}`}
              style={isEnraged ? { animation: 'pulse 2.5s ease-in-out infinite' } : {}}
            />
            
            <div className="absolute bottom-[7vh] left-1/2 -translate-x-1/2 w-[82%] max-w-4xl flex flex-col items-center pointer-events-none z-50">
              
              {/* Tên Boss — Gothic Premium */}
              <h2 
                className={`text-lg md:text-xl font-black tracking-[0.6em] mb-1.5 uppercase transition-colors duration-500 ${isEnraged ? 'text-red-400' : 'text-stone-400'}`} 
                style={{ 
                  fontFamily: 'var(--font-heading, Georgia, serif)', 
                  textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 20px rgba(0,0,0,0.8)' 
                }}
              >
                {activeBossInstance.name || 'QUÁI THAI KHỔNG LỒ'}
              </h2>

              {/* Phase Indicator — 3 chấm tròn nhỏ */}
              <div className="flex gap-2 mb-2">
                {Array.from({ length: maxPhase }, (_, i) => (
                  <div 
                    key={`phase_${i}`}
                    className={`w-2.5 h-2.5 rounded-full border transition-all duration-500 ${
                      i < bossPhase 
                        ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]' 
                        : 'bg-zinc-800 border-zinc-600'
                    }`}
                  />
                ))}
              </div>
              
              {/* Thanh máu Boss — Elden Ring style */}
              <div className="w-full h-[10px] relative bg-black/90 border border-zinc-700/80 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.9),0_0_15px_rgba(220,38,38,0.15)] rounded-[2px]">
                
                {/* Nền tối sần */}
                <div className="absolute inset-0 bg-zinc-950 opacity-90 z-0" />
                
                {/* Trailing HP Bar — thanh vàng amber tụt chậm */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500/90 to-amber-400/70 z-[5]"
                  style={{ width: `${trailingPercent}%`, transition: 'none' }}
                />

                {/* HP Bar chính — đỏ gradient */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 z-10 ${
                    isEnraged 
                      ? 'bg-gradient-to-r from-red-700 via-red-500 to-orange-500' 
                      : 'bg-gradient-to-r from-red-950 via-red-800 to-red-600'
                  }`}
                  style={{ width: `${hpPercent}%`, transition: 'width 80ms ease-out' }}
                >
                  {/* Specular highlight trên cùng */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-b from-white/25 to-transparent" />
                  
                  {/* Shimmer quét ngang */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
                </div>

                {/* Vạch chia phase (25% và 50%) */}
                <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-white/10 z-20" />
                <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/10 z-20" />
                <div className="absolute top-0 bottom-0 left-3/4 w-[1px] bg-white/10 z-20" />
              </div>

              {/* HP số — nhỏ, tinh tế */}
              <div className="mt-1 text-[10px] font-mono tracking-wider text-zinc-500">
                {Math.ceil(activeBossInstance.hp)} / {activeBossInstance.maxHP}
              </div>
            </div>
          </>
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
