import { useEntityStore } from '../store/entityStore';

export function runVFXSystem(delta: number) {
  const { particles, setParticles, damageNumbers, setDamageNumbers } = useEntityStore.getState();
  const currentTime = performance.now();
  const tickRatio = delta / 16.67;

  // 1. Cập nhật Hạt hiệu ứng (Particles)
  const nextParticles = particles
    .map(p => {
      const nextAlpha = Math.max(0, p.alpha - p.decay * tickRatio);
      return {
        ...p,
        x: p.x + p.vx * tickRatio,
        y: p.y + p.vy * tickRatio,
        alpha: nextAlpha
      };
    })
    // Giữ lại các hạt chưa hết hạn và alpha > 0
    .filter(p => currentTime - p.createdAt < p.lifespan && p.alpha > 0);

  setParticles(nextParticles);

  // 2. Cập nhật Số sát thương nổi (Damage Numbers)
  const nextDamageNumbers = damageNumbers
    .map(dn => {
      // Bay ngược lên trên nhẹ nhàng
      return {
        ...dn,
        y: dn.y - 0.7 * tickRatio
      };
    })
    .filter(dn => currentTime - dn.createdAt < dn.lifespan);

  setDamageNumbers(nextDamageNumbers);
}
