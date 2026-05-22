import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Award, Coins, RefreshCw, Trophy, Skull } from 'lucide-react';
export const GameOverScreen: React.FC = () => {
  const { phase, gold, score, selectedClassId, resetGame } = useGameStore();

  const isVictory = phase === 'victory';

  const getClassName = (classId: string | null) => {
    if (classId === 'knight') return 'Kỵ Sĩ';
    if (classId === 'rogue') return 'Sát Thủ';
    if (classId === 'mage') return 'Pháp Sư';
    return 'Hiệp Sĩ';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-[900px] text-white p-6 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
      
      {/* Background Neon Grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      {isVictory ? (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      ) : (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
      )}

      {/* Biểu tượng chính */}
      <div className="z-10 mb-6 animate-bounce">
        {isVictory ? (
          <div className="p-5 bg-emerald-950/80 border border-emerald-500 rounded-full text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Trophy className="w-16 h-16" />
          </div>
        ) : (
          <div className="p-5 bg-rose-950/80 border border-rose-500 rounded-full text-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Skull className="w-16 h-16" />
          </div>
        )}
      </div>

      {/* Tiêu đề */}
      <h1 className={`z-10 text-4xl font-extrabold tracking-wider mb-2 font-mono uppercase text-center ${
        isVictory 
          ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
          : 'text-rose-500 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]'
      }`}>
        {isVictory ? 'Chiến Thắng Vinh Quang' : 'Bị Tiêu Diệt'}
      </h1>
      
      <p className="z-10 text-slate-400 text-xs mb-8 font-semibold tracking-wide uppercase">
        {isVictory 
          ? 'Bạn đã quét sạch Boss Slime và thoát khỏi mê cung!' 
          : 'Hành trình vượt ngục đã kết thúc đáng tiếc...'}
      </p>

      {/* Bảng tổng kết kết quả */}
      <div className="z-10 flex flex-col gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl w-full max-w-[400px] backdrop-blur-md mb-8 shadow-xl">
        <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-3">
          <span className="text-slate-400 font-semibold">Nhân vật:</span>
          <span className="font-extrabold text-cyan-400">{getClassName(selectedClassId)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-3">
          <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
            <Coins className="w-4 h-4 text-amber-500 fill-amber-950" /> Vàng thu thập:
          </span>
          <span className="font-extrabold text-amber-400">{gold} Gold</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
            <Award className="w-4 h-4 text-emerald-400" /> Tổng điểm đạt được:
          </span>
          <span className="font-extrabold text-emerald-400">{score} Điểm</span>
        </div>
      </div>

      {/* Nút Chơi Lại */}
      <button 
        onClick={resetGame}
        className="z-10 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-extrabold px-8 py-3.5 rounded-xl border border-cyan-400/50 shadow-lg shadow-cyan-950/50 hover:shadow-cyan-900/40 transition-all duration-300 transform active:scale-95 cursor-pointer uppercase tracking-wider text-xs"
      >
        <RefreshCw className="w-4 h-4 animate-spin-slow" /> Trở về Menu chính
      </button>
    </div>
  );
};
