import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useEntityStore } from '../store/entityStore';

const PERKS = [
  { id: 'hp_boost', name: 'Vitality', desc: 'Tăng 2 Máu tối đa và hồi đầy Máu.', color: '#22c55e' },
  { id: 'dmg_boost', name: 'Bloodlust', desc: 'Tăng vĩnh viễn 2 Sát thương cho tất cả vũ khí.', color: '#ef4444' },
  { id: 'speed_boost', name: 'Swiftness', desc: 'Tăng 20% Tốc độ di chuyển.', color: '#3b82f6' },
  { id: 'shield_boost', name: 'Iron Will', desc: 'Nhận 2 Giáp ảo.', color: '#a8a29e' }
];

export const LevelUpScreen: React.FC = () => {
  const { setPhase } = useGameStore();
  const { player, updatePlayer } = useEntityStore();

  const handleSelectPerk = (perkId: string) => {
    if (!player) return;

    if (perkId === 'hp_boost') {
      updatePlayer({ maxHp: player.maxHp + 2, hp: player.maxHp + 2 });
    } else if (perkId === 'dmg_boost') {
      if (player.weapons) {
        const upgradedWeapons = player.weapons.map(w => ({ ...w, damage: w.damage + 2 }));
        updatePlayer({ weapons: upgradedWeapons });
      }
    } else if (perkId === 'speed_boost') {
      updatePlayer({ speed: player.speed * 1.2 });
    } else if (perkId === 'shield_boost') {
      updatePlayer({ shield: (player.shield || 0) + 2 });
    }

    setPhase('playing');
  };

  // Lấy 3 lựa chọn ngẫu nhiên
  const shuffled = [...PERKS].sort(() => 0.5 - Math.random());
  const options = shuffled.slice(0, 3);

  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-[fadeIn_0.5s_ease-out]">
      <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-2 tracking-widest drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">
        LEVEL UP!
      </h1>
      <p className="text-amber-100/70 font-mono text-xl mb-12">Level {player?.level || 1}</p>

      <div className="flex gap-6 max-w-4xl w-full px-8">
        {options.map((perk, i) => (
          <button
            key={perk.id}
            onClick={() => handleSelectPerk(perk.id)}
            className="flex-1 bg-[#1c1917] hover:bg-[#292524] border-2 border-[#292524] hover:border-amber-500 rounded-lg p-6 text-left transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(245,158,11,0.2)] group animate-[slideUp_0.5s_ease-out]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="text-3xl mb-4 font-bold tracking-wider" style={{ color: perk.color }}>
              {perk.name}
            </div>
            <p className="text-gray-400 font-serif leading-relaxed text-sm group-hover:text-gray-300 transition-colors">
              {perk.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
