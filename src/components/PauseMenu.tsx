import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Play, RotateCcw, Info } from 'lucide-react';

export const PauseMenu: React.FC = () => {
  const { setPhase, resetGame } = useGameStore();

  const handleResume = () => {
    setPhase('playing');
  };

  const handleRestart = () => {
    resetGame();
  };

  return (
    <div className="pause-overlay">
      <div className="pause-box">
        <h2 className="pause-title">Tạm Dừng</h2>

        <div className="pause-guide">
          <div className="pause-guide-title">
            <Info size={20} />
            Hướng dẫn điều khiển
          </div>
          <div className="pause-guide-grid">
            <div><span className="pause-key">W A S D</span> Di chuyển</div>
            <div><span className="pause-key">Chuột</span> Tự động nhắm đánh</div>
            <div><span className="pause-key">E / Chuột Phải</span> Dùng Skill</div>
            <div><span className="pause-key">Q / Space</span> Đổi vũ khí</div>
            <div className="full-width"><span className="pause-key">F</span> Tương tác (Mở rương, nhặt đồ)</div>
          </div>
        </div>

        <div className="pause-buttons">
          <button className="btn-resume" onClick={handleResume}>
            <Play size={20} />
            TIẾP TỤC
          </button>
          
          <button className="btn-restart" onClick={handleRestart}>
            <RotateCcw size={20} />
            VỀ MENU CHÍNH
          </button>

          <button className="btn-exit" onClick={handleRestart} style={{ marginTop: '8px', backgroundColor: '#7f1d1d', color: '#fca5a5' }}>
            THOÁT GAME
          </button>
        </div>
      </div>
    </div>
  );
};
