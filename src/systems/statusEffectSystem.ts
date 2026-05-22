import { useEntityStore } from '../store/entityStore';
import type { Entity } from '../types/interfaces';

export function runStatusEffectsSystem(_delta: number) {
  const { player, updatePlayer, enemies, updateEnemy, allies, updateAlly, addDamageNumber, addParticle } = useEntityStore.getState();
  const currentTime = performance.now();

  const processEntity = (entity: Entity, updateFn: (updater: Partial<Entity>) => void) => {
    if (!entity || entity.hp <= 0) return;
    
    const { statusEffects, lastDoTTime = 0 } = entity;
    
    // Xử lý Sát thương theo thời gian (Damage Over Time - DoT)
    const isBurning = statusEffects.includes('burning');
    const isPoisoned = statusEffects.includes('poisoned');
    
    if ((isBurning || isPoisoned) && currentTime - lastDoTTime >= 1000) {
      let damage = 0;
      let color = '';
      
      if (isBurning) {
        damage += 5; // 5 sát thương mỗi giây
        color = '#ef4444'; // Đỏ lửa
        
        // Particle lửa
        for (let i = 0; i < 3; i++) {
          addParticle({
            id: `burn_${Date.now()}_${i}`,
            x: entity.x + (Math.random() - 0.5) * entity.radius,
            y: entity.y + (Math.random() - 0.5) * entity.radius,
            vx: 0,
            vy: -1 - Math.random(),
            radius: 2 + Math.random() * 2,
            color: '#f97316',
            alpha: 0.8,
            decay: 0.05,
            createdAt: currentTime,
            lifespan: 300
          });
        }
      }
      
      if (isPoisoned) {
        damage += 3; // 3 sát thương mỗi giây
        color = '#a855f7'; // Tím độc
        
        // Particle độc
        for (let i = 0; i < 2; i++) {
          addParticle({
            id: `poison_${Date.now()}_${i}`,
            x: entity.x + (Math.random() - 0.5) * entity.radius,
            y: entity.y - entity.radius / 2,
            vx: (Math.random() - 0.5),
            vy: -0.5 - Math.random(),
            radius: 1 + Math.random() * 2,
            color: '#c084fc',
            alpha: 0.7,
            decay: 0.03,
            createdAt: currentTime,
            lifespan: 400
          });
        }
      }
      
      const newHp = Math.max(0, entity.hp - damage);
      updateFn({ hp: newHp, lastDoTTime: currentTime });
      
      addDamageNumber({
        id: `dot_${Date.now()}_${entity.id}`,
        x: entity.x,
        y: entity.y - entity.radius,
        value: damage,
        color: color,
        createdAt: currentTime,
        lifespan: 800,
        isCrit: false
      });
      
      // Nếu là player, rung nhẹ
      if (entity.type === 'player' && damage > 0) {
         useEntityStore.setState({ cameraShake: 2 });
      }
    }
    
    // Particle băng (chỉ visual, không sát thương DoT)
    if (statusEffects.includes('frozen') && Math.random() < 0.1) {
      addParticle({
        id: `ice_${Date.now()}_${entity.id}`,
        x: entity.x + (Math.random() - 0.5) * entity.radius,
        y: entity.y + (Math.random() - 0.5) * entity.radius,
        vx: 0,
        vy: Math.random() * 0.5,
        radius: 1 + Math.random() * 2,
        color: '#7dd3fc',
        alpha: 0.8,
        decay: 0.02,
        createdAt: currentTime,
        lifespan: 500
      });
    }
  };

  if (player) {
    processEntity(player, (updates) => updatePlayer(updates));
  }
  
  enemies.forEach(enemy => {
    processEntity(enemy, (updates) => updateEnemy(enemy.id, updates));
  });
  
  allies.forEach(ally => {
    processEntity(ally, (updates) => updateAlly(ally.id, updates));
  });
}
