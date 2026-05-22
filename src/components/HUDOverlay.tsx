import React, { useState, useEffect } from 'react';
import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';
import { useMapStore } from '../store/mapStore';
import { Heart, Shield, Zap, Coins, Menu, Swords } from 'lucide-react';

export const HUDOverlay: React.FC = () => {
  const { player } = useEntityStore();
  const { gold, setPhase } = useGameStore();
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
  const activeWeapon = player.weapons?.[player.activeWeaponIndex || 0];
  const currentTime = performance.now();
  const lastSkillTime = player.lastSkillUsedTime || 0;
  const skillCooldown = player.id === 'knight' ? 12000 : (player.id === 'rogue' ? 4000 : 10000);
  const skillElapsed = currentTime - lastSkillTime;
  const isSkillReady = skillElapsed >= skillCooldown;
  const cooldownPercent = Math.min(100, (skillElapsed / skillCooldown) * 100);

  const renderHP = () => {
    const hearts = [];
    for (let i = 0; i < player.maxHp; i++) {
      hearts.push(
        <Heart 
          key={`hp_${i}`} 
          size={20}
          className={`transition-all duration-300 ${i < player.hp ? 'text-red-500 fill-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' : 'text-slate-700 opacity-40'}`}
        />
      );
    }
    return hearts;
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
    const mapGrid = [];
    for (let y = 0; y < 3; y++) {
      const row = [];
      for (let x = 0; x < 3; x++) {
        const roomId = `room_${x}_${y}`;
        const room = rooms.find(r => r.id === roomId);
        const isCurrent = currentRoomId === roomId;
        const isVisited = room && room.state !== 'unvisited';

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
        if (room && isVisited) {
          if (room.type === 'shop') { label = 'S'; color = '#fbbf24'; }
          else if (room.type === 'chest') { label = 'C'; color = '#34d399'; }
          else if (room.type === 'boss') { label = 'B'; color = '#f43f5e'; }
          else if (room.type === 'start') { label = 'H'; color = '#38bdf8'; }
        }

        row.push(
          <div key={`map_${x}_${y}`} className="map-cell" style={bgStyle}>
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
          {/* Vitals (HP, Shield, Mana) */}
          <div className="hud-vitals">
            {/* HP */}
            <div className="hud-vital-box">
              <span className="hud-vital-label hp">HP</span>
              <div className="hud-vital-icons">{renderHP()}</div>
            </div>
            
            {/* Shield */}
            {(player.maxShield || 0) > 0 && (
              <div className="hud-vital-box">
                <span className="hud-vital-label shd">SHD</span>
                <div className="hud-vital-icons">{renderShield()}</div>
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

          {/* HUD: Skills & Weapon */}
          <div className="hud-skills">
            {/* Skill Icon */}
            <div className="hud-skill-icon">
              {!isSkillReady && (
                <div 
                  className="hud-skill-cd"
                  style={{ height: `${100 - cooldownPercent}%` }}
                />
              )}
              <Zap size={36} className={`${isSkillReady ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} style={isSkillReady ? { filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.8))' } : {}} />
              <span className="hud-skill-key">E</span>
            </div>

            {/* Weapon Details */}
            {activeWeapon && (
              <div className="hud-weapon">
                <div className="hud-weapon-header">
                  <span>{activeWeapon.name}</span>
                  <Swords size={18} className="text-cyan-400" />
                </div>
                <div className="hud-weapon-stats">
                  <span className="hud-weapon-dmg">DMG: {activeWeapon.damage}</span>
                </div>
                <span className="hud-weapon-tip">Nhấn Q / Space đổi vũ khí</span>
              </div>
            )}
          </div>
        </div>

        {/* MENU BUTTON (TOP RIGHT) */}
        <button 
          className="hud-menu-btn"
          onClick={() => setPhase('paused')}
        >
          <Menu size={28} />
        </button>
      </div>

      {/* BOTTOM SECTION: MINIMAP */}
      <div className="hud-bottom">
        <div className="hud-minimap">
          {renderMiniMap()}
        </div>
      </div>
    </div>
  );
};
