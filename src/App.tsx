import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useEntityStore } from './store/entityStore';
import { MenuScreen } from './components/MenuScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { HUDOverlay } from './components/HUDOverlay';
import { PauseMenu } from './components/PauseMenu';
import { LevelUpScreen } from './components/LevelUpScreen';
import { NextFloorScreen } from './components/NextFloorScreen';
import { EndingCutscene } from './components/EndingCutscene';
import { StoryCutscene } from './components/StoryCutscene';
import { BossPreview } from './components/BossPreview';
import { KeSaNgaPreview } from './bosses/KeSaNga/KeSaNgaPreview';
import { GauSamSetPreview } from './bosses/GauSamSet/GauSamSetPreview';
import { RezePreview } from './characters/Reze/RezePreview';
import { HelpCircle } from 'lucide-react';
import './overlay.css';

function App() {
  const { phase, setPhase, isTransitioning, setTransitioning } = useGameStore();
  const { player } = useEntityStore();

  // Phát hiện Player hết máu -> Chuyển sang màn hình Game Over sau 1.2 giây
  useEffect(() => {
    if (player && player.hp <= 0 && phase === 'playing') {
      const timer = setTimeout(() => {
        // Double check
        const currentPhase = useGameStore.getState().phase;
        if (currentPhase === 'playing') {
          setTransitioning(true);
          setTimeout(() => {
            setPhase('game_over');
            setTimeout(() => setTransitioning(false), 500);
          }, 1500);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [player?.hp, phase, setPhase]);

  return (
    <div className="app-fullscreen-wrapper">
      {(phase === 'playing' || phase === 'paused' || phase === 'cutscene_ending') && (
        <div className={`game-canvas-container ${player && player.sanity !== undefined && player.sanity < 30 ? 'sanity-distortion' : ''}`}>
          {/* Game Canvas Toàn màn hình */}
          <GameCanvas />
          
          {/* HUD Overlay Nổi */}
          {phase !== 'cutscene_ending' && <HUDOverlay />}

          {/* Cutscene Overlay */}
          {phase === 'cutscene_ending' && <EndingCutscene />}
        </div>
      )}

      {/* Màn hình Menu / Chọn nhân vật */}
      {phase === 'menu' && <MenuScreen />}

      {/* Cốt truyện */}
      {phase === 'cutscene_intro' && <StoryCutscene type="intro" />}
      {phase === 'cutscene_boss' && <StoryCutscene type="boss" />}

      {/* Màn hình Tạm dừng */}
      {phase === 'paused' && <PauseMenu />}
      {phase === 'level_up' && <LevelUpScreen />}
      {phase === 'next_floor' && <NextFloorScreen />}
      
      {/* Pixel Boss Preview System */}
      {phase === 'boss_preview' && <BossPreview />}
      {phase === 'kesanga_preview' && <KeSaNgaPreview />}
      {phase === 'gausamset_preview' && <GauSamSetPreview />}
      {phase === 'reze_preview' && <RezePreview />}

      {/* Màn hình báo Thắng / Thua */}
      {(phase === 'game_over' || phase === 'victory') && <GameOverScreen />}

      {/* Footer bản quyền & thông tin hỗ trợ */}
      <footer className="mt-6 flex items-center gap-1.5 text-[10px] text-slate-600 font-mono tracking-wider">
        <HelpCircle className="w-3 h-3 text-slate-700" />
        <span>DUNGEON OF DECAY V1.0.0 • DESIGNED WITH DARK FANTASY VIBES</span>
      </footer>

      {/* TRANSITION OVERLAY */}
      <div 
        className={isTransitioning ? 'fade-enter' : 'fade-leave'}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#000', zIndex: 9999, pointerEvents: 'none'
        }}
      />
    </div>
  );
}

export default App;
