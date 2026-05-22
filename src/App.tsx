import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useEntityStore } from './store/entityStore';
import { MenuScreen } from './components/MenuScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { HUDOverlay } from './components/HUDOverlay';
import { PauseMenu } from './components/PauseMenu';
import { HelpCircle } from 'lucide-react';
import './overlay.css';

function App() {
  const { phase, setPhase } = useGameStore();
  const { player } = useEntityStore();

  // Phát hiện Player hết máu -> Chuyển sang màn hình Game Over sau 1.2 giây
  useEffect(() => {
    if (player && player.hp <= 0 && phase === 'playing') {
      const timer = setTimeout(() => {
        // Double check
        const currentPhase = useGameStore.getState().phase;
        if (currentPhase === 'playing') {
          setPhase('game_over');
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [player?.hp, phase, setPhase]);

  return (
    <div className="app-fullscreen-wrapper">
      {(phase === 'playing' || phase === 'paused') && (
        <div className="game-canvas-container">
          {/* Game Canvas Toàn màn hình */}
          <GameCanvas />
          
          {/* HUD Overlay Nổi */}
          <HUDOverlay />
        </div>
      )}

      {/* Màn hình Menu / Chọn nhân vật */}
      {phase === 'menu' && <MenuScreen />}

      {/* Màn hình Tạm dừng */}
      {phase === 'paused' && <PauseMenu />}

      {/* Màn hình báo Thắng / Thua */}
      {(phase === 'game_over' || phase === 'victory') && <GameOverScreen />}

      {/* Footer bản quyền & thông tin hỗ trợ */}
      <footer className="mt-6 flex items-center gap-1.5 text-[10px] text-slate-600 font-mono tracking-wider">
        <HelpCircle className="w-3 h-3 text-slate-700" />
        <span>DUNGON SPARK V1.0.0 • DESIGNED WITH SOUL KNIGHT VIBES</span>
      </footer>
    </div>
  );
}

export default App;
