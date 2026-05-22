import React from 'react';
import { useEntityStore } from '../store/entityStore';
import { Swords, RefreshCw, Zap } from 'lucide-react';
import { CHARACTER_CLASSES } from '../data/classes';

export const PlayerEquip: React.FC = () => {
  const { player, updatePlayer } = useEntityStore();

  if (!player) return null;

  const activeWeapon = player.weapons?.[player.activeWeaponIndex || 0];
  const offhandWeapon = player.weapons?.[(player.activeWeaponIndex === 0 ? 1 : 0)];
  
  const charClass = CHARACTER_CLASSES.find(c => c.id === player.classId);
  const skillName = charClass ? charClass.skillName : 'Kỹ năng';

  // Tính toán thời gian hồi chiêu
  const currentTime = performance.now();
  const lastSkillTime = player.lastSkillUsedTime || 0;
  const skillCooldown = player.id === 'knight' ? 12000 : (player.id === 'rogue' ? 4000 : 10000);
  const skillElapsed = currentTime - lastSkillTime;
  const isSkillReady = skillElapsed >= skillCooldown;
  const cooldownPercent = Math.min(100, (skillElapsed / skillCooldown) * 100);

  const handleSwitchWeapon = () => {
    if (player.weapons && player.weapons.length > 1) {
      const nextIdx = ((player.activeWeaponIndex || 0) + 1) % player.weapons.length;
      updatePlayer({ activeWeaponIndex: nextIdx });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* 1. SKILL BOX */}
      <div className="glass-panel p-6 flex flex-col items-center justify-center gap-4 border-t-4 border-t-amber-500">
        <span className="text-xs font-bold text-amber-500 tracking-widest uppercase">Tuyệt Kỹ (E)</span>
        
        <div className="relative w-20 h-20 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner">
          {!isSkillReady && (
            <div 
              className="absolute inset-0 bg-amber-500/20 backdrop-blur-[2px] transition-all duration-100"
              style={{ height: `${100 - cooldownPercent}%`, top: 0 }}
            />
          )}
          <Zap 
            size={36} 
            className={`relative z-10 transition-colors duration-300 ${isSkillReady ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-slate-600'}`} 
          />
        </div>

        <div className="flex flex-col items-center">
          <span className={`text-xl font-black ${isSkillReady ? 'text-amber-400' : 'text-slate-500'}`}>
            {isSkillReady ? 'SẴN SÀNG' : `${Math.ceil((skillCooldown - skillElapsed) / 1000)}s`}
          </span>
          <span className="text-xs font-semibold text-slate-400 text-center px-2 mt-1">
            {skillName}
          </span>
        </div>
      </div>

      {/* 2. WEAPON SLOTS */}
      <div className="glass-panel p-4 flex flex-col gap-3 flex-grow border-t-4 border-t-cyan-500">
        <span className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-1">Trang Bị</span>
        
        {/* Active Weapon */}
        {activeWeapon ? (
          <div className="bg-slate-900 border-2 border-cyan-500/80 rounded-xl p-4 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold text-slate-100">{activeWeapon.name}</div>
                <div className="text-[10px] text-cyan-300 font-mono mt-1 px-2 py-0.5 bg-cyan-950/50 rounded inline-block">ĐANG CẦM</div>
              </div>
              <Swords size={20} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="text-[9px] text-slate-500 font-bold">SÁT THƯƠNG</div>
                <div className="text-sm font-black text-red-400">{activeWeapon.damage}</div>
              </div>
              <div className="bg-slate-950 rounded p-2 border border-slate-800">
                <div className="text-[9px] text-slate-500 font-bold">TIÊU HAO MP</div>
                <div className="text-sm font-black text-sky-400">{activeWeapon.energyCost}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex items-center justify-center min-h-[100px]">
            <span className="text-slate-600 text-xs italic">Trống</span>
          </div>
        )}

        {/* Offhand Weapon */}
        {offhandWeapon ? (
          <div 
            className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 mt-2 cursor-pointer hover:bg-slate-800 transition-colors flex justify-between items-center group"
            onClick={handleSwitchWeapon}
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-300 group-hover:text-slate-100 transition-colors">{offhandWeapon.name}</span>
              <span className="text-[9px] text-slate-500 mt-0.5">Nhấn Q / Khoảng Trắng để đổi</span>
            </div>
            <RefreshCw size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 mt-2 flex items-center justify-center">
            <span className="text-slate-600 text-[10px] italic">Slot dự phòng trống</span>
          </div>
        )}
      </div>
    </div>
  );
};
