import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useMapStore } from '../store/mapStore';

export const PauseMenu: React.FC = () => {
  const { setPhase, resetGame } = useGameStore();
  const { rooms, currentRoomId } = useMapStore();

  const renderFullMap = () => {
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
          row.push(<div key={`map_${x}_${y}`} className="w-8 h-8 md:w-10 md:h-10" style={{ opacity: 0 }} />);
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
          <div 
            key={`map_${x}_${y}`} 
            className={`w-8 h-8 md:w-10 md:h-10 border-2 rounded-sm flex items-center justify-center font-bold text-sm md:text-base ${extraClass}`} 
            style={bgStyle}
          >
            <span style={{ color }}>{label}</span>
          </div>
        );
      }
      mapGrid.push(<div key={`map_row_${y}`} className="flex gap-1">{row}</div>);
    }
    return mapGrid;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500 overflow-y-auto">
      <div className="relative w-full max-w-5xl p-8 border-y-2 border-[#450a0a] bg-gradient-to-b from-[#0c0a09]/90 to-[#1c1917]/90 shadow-[0_0_50px_rgba(0,0,0,1)] text-center my-8">
        
        <h2 className="text-4xl font-serif tracking-[0.3em] text-[#fbbf24] mb-8" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          PAUSED
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* TRÁI: ĐIỀU KHIỂN */}
          <div className="flex flex-col h-full">
            <h3 className="text-[#fbbf24] font-serif tracking-widest text-lg mb-4 text-center border-b border-[#450a0a] pb-2">CONTROLS</h3>
            <div className="text-left bg-black/40 p-6 border border-[#292524] mb-8 mx-auto font-serif text-gray-400 text-sm tracking-widest w-full max-w-sm">
              <ul className="space-y-4">
                <li className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#fbbf24]">W A S D</span>
                  <span>Move</span>
                </li>
                <li className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#fbbf24]">MOUSE LEFT</span>
                  <span>Attack</span>
                </li>
                <li className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#fbbf24]">MOUSE RIGHT / E</span>
                  <span>Skill</span>
                </li>
                <li className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#fbbf24]">R</span>
                  <span>Ultimate Attack (Requires 50 MP)</span>
                </li>
                <li className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#fbbf24]">SPACE / Q</span>
                  <span>Switch Weapon</span>
                </li>
                <li className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#fbbf24]">F</span>
                  <span>Interact</span>
                </li>
                <li className="flex justify-between border-b border-[#292524] pb-1">
                  <span className="text-[#fbbf24]">ESC / TAB</span>
                  <span>Pause & Map</span>
                </li>
              </ul>
            </div>

            {/* Các nút */}
            <div className="flex flex-col gap-4 items-center mt-auto">
              <button 
                className="w-64 py-3 font-serif tracking-[0.2em] text-[#e4e4e7] hover:text-[#fbbf24] hover:bg-white/5 border border-transparent hover:border-[#fbbf24]/50 transition-all duration-300"
                onClick={() => setPhase('playing')}
              >
                CONTINUE
              </button>
              <button 
                className="w-64 py-3 font-serif tracking-[0.2em] text-[#a1a1aa] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/50 transition-all duration-300"
                onClick={resetGame}
              >
                ABANDON RUN
              </button>
            </div>
          </div>

          {/* PHẢI: BẢN ĐỒ TOÀN MÀN HÌNH */}
          <div className="flex flex-col h-full items-center border-l-0 lg:border-l-2 border-[#450a0a] pt-8 lg:pt-0 lg:pl-8">
            <h3 className="text-[#fbbf24] font-serif tracking-widest text-lg mb-4 text-center border-b border-[#450a0a] pb-2">DUNGEON MAP</h3>
            <div className="bg-black/80 p-4 border-2 border-[#292524] shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-auto max-w-full max-h-[50vh] lg:max-h-[600px]">
              <div className="flex flex-col gap-1 w-max mx-auto">
                {renderFullMap()}
              </div>
            </div>
            
            <div className="flex gap-4 mt-6 text-[10px] font-mono tracking-widest text-gray-500">
               <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#38bdf8] inline-block"/> Start</span>
               <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#f43f5e] inline-block"/> Boss</span>
               <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#fbbf24] inline-block"/> Shop</span>
               <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[#34d399] inline-block"/> Chest</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
