import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useMapStore } from '../store/mapStore';
import { useEntityStore } from '../store/entityStore';

export const NextFloorScreen: React.FC = () => {
  const { currentFloor, setCurrentFloor, setPhase } = useGameStore();
  const { generateDungeon } = useMapStore();
  const { updatePlayer, clearRoomEntities } = useEntityStore();
  
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButtons(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleNextFloor = () => {
    // Tăng tầng
    const nextFloor = currentFloor + 1;
    setCurrentFloor(nextFloor);
    
    // Reset Entity
    clearRoomEntities();
    
    // Tạo map mới
    generateDungeon();
    
    // Đưa player về giữa phòng (hoặc vị trí mặc định)
    updatePlayer({ x: 1000, y: 750, vx: 0, vy: 0, animState: 'idle' });
    
    // Vào lại game
    setPhase('playing');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 pointer-events-auto" style={{ animation: 'fadeIn 1.5s ease-in' }}>
      
      {/* Cổng Portal phát sáng */}
      <div className="absolute inset-0 pointer-events-none opacity-40" 
           style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(0,0,0,1) 60%)' }} />

      <div className="absolute w-full h-48 bg-black/80 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,1)]">
        <h1 
          className="text-6xl md:text-8xl font-serif tracking-[0.2em] font-normal text-purple-400"
          style={{ 
            fontFamily: 'var(--font-serif)',
            textShadow: '0 0 20px rgba(168,85,247,0.8), 2px 2px 0px #000',
            animation: 'scaleFadeIn 2.5s ease-out forwards',
            opacity: 0,
            transform: 'scale(0.9)'
          }}
        >
          FLOOR CLEARED
        </h1>
      </div>

      {showButtons && (
        <div className="absolute top-[65%] flex flex-col items-center animate-fade-in-slow z-10 w-full max-w-md">
           <div className="mb-8 text-gray-300 font-serif tracking-widest text-xl" style={{ fontFamily: 'var(--font-serif)' }}>
              ENTERING FLOOR {currentFloor + 1}...
           </div>

           <button 
             onClick={handleNextFloor}
             className="text-gray-400 hover:text-white font-serif tracking-[0.3em] uppercase text-xl border-b border-transparent hover:border-white transition-all duration-300 pb-1"
             style={{ fontFamily: 'var(--font-serif)' }}
           >
             Descend Deeper
           </button>
        </div>
      )}
    </div>
  );
};
