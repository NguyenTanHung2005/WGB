import { useEffect, useRef } from 'react';

/**
 * useGameLoop Hook
 * 
 * Sets up a requestAnimationFrame loop that calculates deltaTime
 * and provides it to an update callback. Caps deltaTime at 50ms
 * to prevent massive physics/logic jumps if the tab is backgrounded.
 * 
 * @param callback Function to run every frame, receives deltaTime in seconds
 * @param isActive Boolean to pause/resume the loop
 */
export function useGameLoop(callback: (deltaTime: number) => void, isActive: boolean = true) {
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // Keep callback ref updated so we don't need to re-bind the RAF
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    const loop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      
      // Calculate delta time in seconds, cap at 50ms (0.05s) to avoid huge skips
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      callbackRef.current(dt);

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive]);
}
