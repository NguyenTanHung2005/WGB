import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const GameOverScreen: React.FC = () => {
  const { phase, score, resetGame } = useGameStore();
  const [showButtons, setShowButtons] = useState(false);

  const isVictory = phase === 'victory';

  // Chờ 3 giây trước khi hiện nút
  useEffect(() => {
    const t = setTimeout(() => setShowButtons(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 pointer-events-auto" style={{ animation: 'fadeIn 2s ease-in' }}>
      
      {/* Background Gradient Máu (khi chết) hoặc Sáng (khi thắng) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-50" 
        style={{ 
          background: isVictory 
            ? 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(0,0,0,1) 70%)'
            : 'radial-gradient(circle, rgba(153,27,27,0.3) 0%, rgba(0,0,0,1) 70%)' 
        }} 
      />

      {/* Dải ngang đen cắt giữa màn hình */}
      <div className="absolute w-full h-48 bg-black/80 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,1)]">
        {/* TEXT CHÍNH */}
        <h1 
          className="text-7xl md:text-9xl font-serif tracking-[0.2em] font-normal"
          style={{ 
            fontFamily: 'var(--font-serif)',
            color: isVictory ? '#fbbf24' : '#991b1b', // Vàng hoặc Đỏ sẫm máu
            textShadow: isVictory ? '0 0 20px rgba(251,191,36,0.6)' : '0 0 20px rgba(153,27,27,0.8), 2px 2px 0px #000',
            animation: 'scaleFadeIn 3s ease-out forwards',
            opacity: 0,
            transform: 'scale(0.9)'
          }}
        >
          {isVictory ? 'VICTORY ACHIEVED' : 'YOU DIED'}
        </h1>
      </div>

      {/* Score */}
      {showButtons && (
        <div className="absolute top-[60%] flex flex-col items-center animate-fade-in-slow z-10 w-full max-w-md">
           <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-gray-400 font-serif tracking-widest text-sm" style={{ fontFamily: 'var(--font-serif)' }}>
              <div className="text-right">SOULS RECOVERED:</div>
              <div className="text-white font-bold">{score}</div>
           </div>

           <button 
             onClick={resetGame}
             className="text-gray-400 hover:text-white font-serif tracking-[0.3em] uppercase text-lg border-b border-transparent hover:border-white transition-all duration-300 pb-1"
             style={{ fontFamily: 'var(--font-serif)' }}
           >
             Continue
           </button>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes scaleFadeIn {
          0% { opacity: 0; transform: scale(0.85); filter: blur(5px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-fade-in-slow {
          animation: fadeIn 2s ease-in forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
