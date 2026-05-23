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
      // Khởi tạo vận tốc ban đầu nếu chưa có (văng ngẫu nhiên lên trên)
      const isCrit = dn.isCrit;
      const vx = dn.vx !== undefined ? dn.vx : (Math.random() - 0.5) * (isCrit ? 6 : 3);
      let vy = dn.vy !== undefined ? dn.vy : -(3 + Math.random() * (isCrit ? 4 : 2));
      
      // Áp dụng trọng lực (Gravity)
      vy += 0.2 * tickRatio;
      
      return {
        ...dn,
        x: dn.x + vx * tickRatio,
        y: dn.y + vy * tickRatio,
        vx,
        vy
      };
    })
    .filter(dn => currentTime - dn.createdAt < dn.lifespan);

  setDamageNumbers(nextDamageNumbers);

  // 3. Cinematic Boss Death Explosions
  const { enemies, addParticle, setCameraShake } = useEntityStore.getState();
  const dyingBoss = enemies.find(e => e.type === 'boss' && e.hp <= 0 && e.hp > -9999);
  if (dyingBoss) {
    setCameraShake(3);
    // Tỉ lệ 30% mỗi frame có 1 vụ nổ
    if (Math.random() < 0.3) {
      const offsetX = (Math.random() - 0.5) * dyingBoss.radius * 2;
      const offsetY = (Math.random() - 0.5) * dyingBoss.radius * 2;
      
      for(let i=0; i<10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        addParticle({
          id: `boss_death_${Date.now()}_${i}`,
          x: dyingBoss.x + offsetX,
          y: dyingBoss.y + offsetY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 3 + Math.random() * 5,
          color: Math.random() > 0.5 ? '#f43f5e' : '#fbbf24',
          alpha: 1.0,
          decay: 0.05,
          createdAt: currentTime,
          lifespan: 600
        });
      }
    }
  }
}
