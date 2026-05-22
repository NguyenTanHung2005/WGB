import React from 'react';
import { MousePointer2, Settings2, Replace, Hand, Move } from 'lucide-react';

export const ActionBar: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full bg-slate-900/80 border border-slate-700/50 rounded-xl p-3 mt-2 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
        <Move size={14} className="text-slate-400" />
        <div className="flex gap-1">
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">W</kbd>
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">A</kbd>
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">S</kbd>
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">D</kbd>
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">Di chuyển</span>
      </div>

      <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
        <MousePointer2 size={14} className="text-red-400" />
        <div className="flex gap-1">
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-red-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">LMB</kbd>
        </div>
        <span className="text-[10px] font-bold text-red-500 uppercase ml-1">Tấn công</span>
      </div>

      <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
        <Settings2 size={14} className="text-amber-400" />
        <div className="flex gap-1">
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-amber-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">E</kbd>
          <span className="text-slate-600 text-[10px]">/</span>
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-amber-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">RMB</kbd>
        </div>
        <span className="text-[10px] font-bold text-amber-500 uppercase ml-1">Kỹ năng</span>
      </div>

      <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
        <Replace size={14} className="text-cyan-400" />
        <div className="flex gap-1">
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-cyan-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">Q</kbd>
        </div>
        <span className="text-[10px] font-bold text-cyan-500 uppercase ml-1">Đổi vũ khí</span>
      </div>

      <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
        <Hand size={14} className="text-emerald-400" />
        <div className="flex gap-1">
          <kbd className="bg-slate-800 border-b-2 border-slate-700 text-emerald-300 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold">F</kbd>
        </div>
        <span className="text-[10px] font-bold text-emerald-500 uppercase ml-1">Tương tác</span>
      </div>
    </div>
  );
};
