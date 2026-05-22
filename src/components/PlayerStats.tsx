import React from 'react';
import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';
import { useMapStore } from '../store/mapStore';
import { Heart, Shield, Zap, Award, Coins } from 'lucide-react';

export const PlayerStats: React.FC = () => {
  const { player } = useEntityStore();
  const { gold, score } = useGameStore();
  const { rooms, currentRoomId } = useMapStore();

  if (!player) return null;

  const renderHP = () => {
    const hearts = [];
    const maxHp = player.maxHp;
    const hp = player.hp;
    
    for (let i = 0; i < maxHp; i++) {
      hearts.push(
        <Heart 
          key={`hp_${i}`} 
          style={{
            width: '18px',
            height: '18px',
            marginRight: '3px',
            marginBottom: '3px',
            transition: 'all 0.3s',
            color: i < hp ? '#ef4444' : '#475569',
            fill: i < hp ? '#ef4444' : 'transparent',
            filter: i < hp ? 'drop-shadow(0 0 4px rgba(239,68,68,0.6))' : 'none',
            opacity: i < hp ? 1.0 : 0.4
          }}
        />
      );
    }
    return hearts;
  };

  const renderShield = () => {
    const shields = [];
    const maxShield = player.maxShield || 0;
    const shield = player.shield || 0;

    for (let i = 0; i < maxShield; i++) {
      shields.push(
        <Shield 
          key={`shield_${i}`} 
          style={{
            width: '18px',
            height: '18px',
            marginRight: '3px',
            marginBottom: '3px',
            transition: 'all 0.3s',
            color: i < shield ? '#22d3ee' : '#475569',
            fill: i < shield ? '#22d3ee' : 'transparent',
            filter: i < shield ? 'drop-shadow(0 0 4px rgba(34,211,238,0.6))' : 'none',
            opacity: i < shield ? 1.0 : 0.4
          }}
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

        let styles: React.CSSProperties = {
          width: '32px',
          height: '28px',
          border: '1px solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          fontSize: '9px',
          fontWeight: 'bold',
          transition: 'all 0.3s'
        };

        if (isCurrent) {
          styles.backgroundColor = 'rgba(34, 211, 238, 0.8)';
          styles.borderColor = '#22d3ee';
          styles.boxShadow = '0 0 10px #22d3ee';
        } else if (isVisited) {
          if (room.state === 'cleared') {
            styles.backgroundColor = 'rgba(71, 85, 105, 0.8)';
            styles.borderColor = '#475569';
          } else if (room.state === 'combat_lock') {
            styles.backgroundColor = 'rgba(127, 29, 29, 0.8)';
            styles.borderColor = '#ef4444';
          } else {
            styles.backgroundColor = 'rgba(30, 41, 59, 0.8)';
            styles.borderColor = '#1e293b';
          }
        } else {
          styles.backgroundColor = 'rgba(15, 23, 42, 0.4)';
          styles.borderColor = '#0f172a';
        }

        let label = '';
        let labelColor = '#fff';
        if (room && isVisited) {
          if (room.type === 'shop') { label = 'Shop'; labelColor = '#fbbf24'; }
          else if (room.type === 'chest') { label = 'Loot'; labelColor = '#34d399'; }
          else if (room.type === 'boss') { label = 'BOSS'; labelColor = '#f43f5e'; }
          else if (room.type === 'start') { label = 'Home'; labelColor = '#38bdf8'; }
        }

        row.push(
          <div key={`map_${x}_${y}`} style={styles}>
            <span style={{ color: labelColor }}>{label}</span>
          </div>
        );
      }
      mapGrid.push(
        <div key={`map_row_${y}`} style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
          {row}
        </div>
      );
    }
    return mapGrid;
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* 1. HEALTH & SHIELD & MANA */}
      <div className="glass-panel p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-red-400 tracking-wider">HP</span>
          <div className="flex flex-wrap gap-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50 min-h-[44px]">
            {renderHP()}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-cyan-400 tracking-wider">GIÁP</span>
          <div className="flex flex-wrap gap-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50 min-h-[44px]">
            {renderShield()}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-sky-400 tracking-wider">MANA</span>
          <div className="relative h-10 bg-slate-950/70 rounded-lg border border-slate-800/50 overflow-hidden flex items-center px-3">
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-sky-600 to-sky-400 border-r-2 border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.6)] transition-all duration-300"
              style={{ width: `${((player.mana || 0) / (player.maxMana || 200)) * 100}%` }}
            />
            <div className="relative z-10 flex justify-between w-full text-sky-100 font-bold text-sm">
              <Zap size={16} className="text-sky-300 fill-sky-300" />
              <span>{player.mana} / {player.maxMana}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RESOURCES & MINIMAP */}
      <div className="glass-panel p-4 flex flex-col gap-5 flex-grow">
        <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-lg">
            <Coins size={20} className="fill-amber-400" />
            <span>{gold}G</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-lg">
            <Award size={20} />
            <span>{score}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 shadow-inner">
            {renderMiniMap()}
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-3">Map Mê Cung</span>
        </div>
      </div>
    </div>
  );
};
