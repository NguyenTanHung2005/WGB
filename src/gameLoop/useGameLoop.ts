import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { runMovementSystem } from '../systems/movementSystem';
import { runCombatSystem } from '../systems/combatSystem';
import { runAISystem } from '../systems/aiSystem';
import { runCollisionSystem } from '../systems/collisionSystem';
import { runRoomSystem } from '../systems/roomSystem';
import { runVFXSystem } from '../systems/vfxSystem';

const TICK_MS = 1000 / 60; // 60 FPS (~16.67ms)

export function useGameLoop() {
  const rafRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const tick = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      
      if (delta >= TICK_MS) {
        // Giới hạn tối đa delta để tránh lỗi dịch chuyển xuyên tường khi lag
        const clampedDelta = Math.min(delta, 100);
        lastTimeRef.current = timestamp;
        
        const phase = useGameStore.getState().phase;
        if (phase === 'playing') {
          // Các hệ thống chạy tuần tự
          runRoomSystem(clampedDelta);
          runAISystem(clampedDelta);
          runMovementSystem(clampedDelta);
          runCollisionSystem();
          runCombatSystem(clampedDelta);
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
