import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useEntityStore } from '../store/entityStore';

const PERKS = [
  { id: 'hp_boost', name: 'VITALITY', desc: 'Blood flows anew. Max HP +2 and heal to full.', color: '#22c55e', symbol: '🩸' },
  { id: 'dmg_boost', name: 'BLOODLUST', desc: 'The hunger grows. Permanent +2 Damage to all weapons.', color: '#ef4444', symbol: '⚔️' },
  { id: 'speed_boost', name: 'SWIFTNESS', desc: 'Lighter than shadows. +20% Movement Speed.', color: '#3b82f6', symbol: '💨' },
  { id: 'shield_boost', name: 'IRON WILL', desc: 'The mind hardens. Gain 2 temporary Shield.', color: '#a8a29e', symbol: '🛡️' }
];

export const LevelUpScreen: React.FC = () => {
  const { setPhase } = useGameStore();
  const { player, updatePlayer } = useEntityStore();

  const handleSelectPerk = (perkId: string) => {
    if (!player) return;
    if (perkId === 'hp_boost') updatePlayer({ maxHp: player.maxHp + 2, hp: player.maxHp + 2 });
    else if (perkId === 'dmg_boost') {
      if (player.weapons) updatePlayer({ weapons: player.weapons.map(w => ({ ...w, damage: w.damage + 2 })) });
    }
    else if (perkId === 'speed_boost') updatePlayer({ speed: player.speed * 1.2 });
    else if (perkId === 'shield_boost') updatePlayer({ shield: (player.shield || 0) + 2 });
    
    setPhase('playing');
  };

  const [options, setOptions] = React.useState<typeof PERKS>([]);
  React.useEffect(() => {
    setOptions([...PERKS].sort(() => 0.5 - Math.random()).slice(0, 3));
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 overflow-hidden bg-black/90 backdrop-blur-md animate-[fadeIn_0.5s_ease-out]">
      {/* Background magical runes */}
      <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center" style={{ animation: 'spin 60s linear infinite' }}>
        <div className="w-[800px] h-[800px] rounded-full border-4 border-[#fbbf24] border-dashed" />
      </div>

      <h1 className="text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-b from-[#fde68a] to-[#d97706] mb-2 tracking-[0.2em] drop-shadow-[0_0_25px_rgba(251,191,36,0.5)] z-10">
        LEVEL UP
      </h1>
      <p className="text-[#fef3c7] font-serif text-xl mb-12 tracking-widest z-10 opacity-70">
        -- Level {player?.level || 1} --
      </p>

      <div className="flex gap-8 max-w-5xl w-full px-8 justify-center z-10 perspective-1000">
        {options.map((perk, i) => (
          <button
            key={perk.id}
            onClick={() => handleSelectPerk(perk.id)}
            className="group relative flex-1 max-w-[280px] h-[400px] bg-[#0c0a09] border border-[#292524] rounded-sm p-1 text-center transition-all duration-500 hover:-translate-y-6 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.3)] animate-[slideUp_0.6s_ease-out_forwards] opacity-0"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {/* Inner Gold Border (Tarot Style) */}
            <div className="w-full h-full border-2 border-[#78350f] group-hover:border-[#fbbf24] flex flex-col items-center p-6 relative overflow-hidden transition-colors duration-500">
              
              {/* Magic glow effect inside card */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700" 
                style={{ background: `radial-gradient(circle at center, ${perk.color} 0%, transparent 70%)` }} 
              />
              
              {/* Symbol */}
              <div 
                className="text-6xl mb-8 mt-4 drop-shadow-lg group-hover:scale-125 transition-transform duration-500" 
                style={{ filter: `drop-shadow(0 0 10px ${perk.color})` }}
              >
                {perk.symbol}
              </div>
              
              {/* Title */}
              <div 
                className="text-2xl mb-6 font-serif tracking-widest font-bold z-10" 
                style={{ color: perk.color, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                {perk.name}
              </div>
              
              {/* Separator */}
              <div className="w-16 h-[1px] bg-gray-700 group-hover:bg-[#fbbf24] mb-6 transition-colors duration-500" />
              
              {/* Description */}
              <p className="text-[#a3a3a3] font-serif leading-relaxed text-sm group-hover:text-white transition-colors z-10 px-2">
                {perk.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
