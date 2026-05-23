import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useEntityStore } from '../store/entityStore';
import { runMovementSystem } from '../systems/movementSystem';
import { runCombatSystem } from '../systems/combatSystem';
import { runAISystem } from '../systems/aiSystem';
import { runCollisionSystem } from '../systems/collisionSystem';
import { runRoomSystem } from '../systems/roomSystem';
import { runVFXSystem } from '../systems/vfxSystem';
import { runStatusEffectsSystem } from '../systems/statusEffectSystem';
import { runSanitySystem } from '../systems/sanitySystem';

const TICK_MS = 1000 / 60; // 60 FPS (~16.67ms)

export function useGameLoop() {
  const rafRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const lastSanityDrainRef = useRef<number>(0);

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      if (lastSanityDrainRef.current === 0) lastSanityDrainRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      
      if (delta >= TICK_MS) {
        // Giới hạn tối đa delta để tránh lỗi dịch chuyển xuyên tường khi lag
        const clampedDelta = Math.min(delta, 100);
        lastTimeRef.current = timestamp;
        
        const { phase, hitStopUntil } = useGameStore.getState();
        if (phase === 'playing') {
          // --- HIT STOP ---
          // Nếu đang trong thời gian hit-stop (chém trúng quái lớn), bỏ qua vòng lặp logic
          if (timestamp < hitStopUntil) {
             rafRef.current = requestAnimationFrame(tick);
             return;
          }

          // Các hệ thống chạy tuần tự
          runRoomSystem(clampedDelta);
          runAISystem(clampedDelta);
          runMovementSystem(clampedDelta);
          runCollisionSystem();
          runCombatSystem(clampedDelta);
          runStatusEffectsSystem(clampedDelta);
          runSanitySystem(clampedDelta);
          runVFXSystem(clampedDelta);
          
          // Trừ Sanity mỗi 5 giây (5000ms)
          if (timestamp - lastSanityDrainRef.current >= 5000) {
            lastSanityDrainRef.current = timestamp;
            const updatePlayer = useEntityStore.getState().updatePlayer;
            const player = useEntityStore.getState().player;
            if (player) {
              const currentSanity = player.sanity ?? 100;
              updatePlayer({ sanity: Math.max(0, currentSanity - 1) });
            }
          }
        } else if (phase === 'cutscene_ending') {
          // Khi đang ở cutscene, chỉ chạy VFX để hiệu ứng vẫn mượt mà
          runVFXSystem(clampedDelta);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    
    rafRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);
}
