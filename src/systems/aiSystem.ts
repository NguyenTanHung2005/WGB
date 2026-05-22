import { useEntityStore } from '../store/entityStore';
import type { Entity } from '../types/interfaces';

export function runAISystem(_delta: number) {
  const { 
    player, updatePlayer, enemies, updateEnemy, 
    addProjectile, addParticle, addDamageNumber, setCameraShake,
    destructibleBarrels, removeDestructibleBarrel,
    explosiveBarrels, removeExplosiveBarrel
  } = useEntityStore.getState();
  
  const currentTime = performance.now();

  if (!player || player.hp <= 0) {
    // Nếu người chơi chết, quái đứng yên
    enemies.forEach(enemy => {
      updateEnemy(enemy.id, { vx: 0, vy: 0 });
    });
    return;
  }

  const isPlayerRolling = player.skillActiveUntil && currentTime < player.skillActiveUntil && (player as any).isRolling;

  enemies.forEach(enemy => {
    if (enemy.hp <= 0) return;

    // 1. KIỂM TRA HIỆU ỨNG CHOÁNG (STUNNED)
    if (enemy.statusEffects.includes('stunned')) {
      // Khi bị choáng, trượt chậm dần về vận tốc 0
      updateEnemy(enemy.id, {
        vx: enemy.vx * 0.8,
        vy: enemy.vy * 0.8
      });
      return;
    }

    // 2. TÍNH VECTƠ ĐẾN PLAYER
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= 0) return;

    const angle = Math.atan2(dy, dx);
    updateEnemy(enemy.id, { angle }); // Xoay hướng mặt về phía player

    // 3. THỰC THI AI THEO HÌNH MẪU (AI PATTERN)
    
    // --- LÀM MƯỢT VẬN TỐC HIỆN TẠI (KNOCKBACK DECAY) ---
    // Quái bị giật lùi sau khi bị chém, ta giảm dần lực đẩy lùi đó về vận tốc di chuyển mặc định
    let targetVx = 0;
    let targetVy = 0;

    if (enemy.aiPattern === 'chase' || enemy.type === 'boss') {
      // CẬN CHIẾN: Đuổi bám sát nút
      targetVx = dx / dist;
      targetVy = dy / dist;

      // Va chạm/Tấn công Player khi áp sát
      const attackDist = enemy.radius + player.radius + 8;
      if (dist <= attackDist) {
        // Tấn công cận chiến
        const lastAttackTime = enemy.lastAttackTime || 0;
        const cooldown = enemy.type === 'boss' ? 1200 : enemy.speed * 400; // Cooldown dựa trên chỉ số
        
        if (currentTime - lastAttackTime >= cooldown) {
          updateEnemy(enemy.id, { lastAttackTime: currentTime });
          
          if (enemy.type === 'boss') {
            // BOSS ATTACK: Tỏa đạn chùm 360 độ hoặc dậm nhảy
            triggerBossSpecialAttack(enemy, player, currentTime);
          } else {
            // Quái thường chém player
            dealDamageToPlayer(enemy.damage!, player, currentTime);
          }
        }
      }
    } 
    else if (enemy.aiPattern === 'shoot') {
      // BẮN XA: Giữ khoảng cách
      if (dist > 280) {
        // Ở quá xa -> đi lại gần
        targetVx = dx / dist;
        targetVy = dy / dist;
      } else if (dist < 180) {
        // Ở quá gần -> lùi ra xa
        targetVx = -dx / dist;
        targetVy = -dy / dist;
      } else {
        // Trong khoảng an toàn -> đứng yên bắn
        targetVx = 0;
        targetVy = 0;
      }

      // Tấn công bắn đạn từ xa
      const lastAIShootTime = enemy.lastAIShootTime || 0;
      const cooldown = 1500; // 1.5 giây bắn 1 lần
      if (currentTime - lastAIShootTime >= cooldown && dist < 450) {
        updateEnemy(enemy.id, { lastAIShootTime: currentTime });
        
        // Spawn đạn đỏ hướng tới Player
        const speed = 5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        addProjectile({
          id: `enemy_bullet_${Date.now()}_${enemy.id}`,
          owner: 'enemy',
          x: enemy.x + Math.cos(angle) * (enemy.radius + 5),
          y: enemy.y + Math.sin(angle) * (enemy.radius + 5),
          vx,
          vy,
          radius: 4,
          damage: enemy.damage!,
          color: '#f43f5e', // Màu đỏ hồng nguy hiểm
          lifespan: 2000,
          createdAt: currentTime
        });
      }
    } 
    else if (enemy.aiPattern === 'charge') {
      // DƠI TỰ SÁT: Lao cực nhanh vào người chơi
      targetVx = dx / dist;
      targetVy = dy / dist;

      // Nổ tung khi chạm Player
      const explodeDist = enemy.radius + player.radius + 12;
      if (dist <= explodeDist) {
        // Kích nổ tự sát
        updateEnemy(enemy.id, { hp: 0 }); // Quái chết ngay lập tức
        triggerExplosion(enemy.x, enemy.y, enemy.damage!, 90, currentTime);
      }
    }

    // Áp dụng lực ma sát để giảm lực đẩy lùi (Knockback) và chuyển hướng dần theo di chuyển
    const lerpFactor = 0.15; // Phản hồi di chuyển mượt mà
    const nextVx = enemy.vx * (1 - lerpFactor) + targetVx * lerpFactor;
    const nextVy = enemy.vy * (1 - lerpFactor) + targetVy * lerpFactor;

    updateEnemy(enemy.id, {
      vx: nextVx,
      vy: nextVy
    });
  });

  // --- HÀM GÂY SÁT THƯƠNG LÊN PLAYER ---
  function dealDamageToPlayer(damage: number, p: Entity, time: number) {
    if (isPlayerRolling) return; // Đang lộn nhào né -> vô địch

    let finalDmg = damage;
    const shield = p.shield || 0;
    const hp = p.hp;

    let nextShield = shield;
    let nextHp = hp;

    if (shield > 0) {
      if (shield >= finalDmg) {
        nextShield = shield - finalDmg;
        finalDmg = 0;
      } else {
        finalDmg -= shield;
        nextShield = 0;
      }
    }

    if (finalDmg > 0) {
      nextHp = Math.max(0, hp - finalDmg);
    }

    updatePlayer({
      hp: nextHp,
      shield: nextShield,
      ...({ 
        lastHitTime: time, // Cập nhật thời điểm nhận sát thương để hoãn hồi giáp
        hitFlashActive: true,
        hitFlashStart: time
      } as any)
    });

    // Tạo số sát thương nổi lên trên đầu Player (màu đỏ giáp hoặc đỏ máu)
    addDamageNumber({
      id: `player_dmg_${Date.now()}`,
      x: p.x,
      y: p.y - 15,
      value: damage,
      color: shield > 0 ? '#94a3b8' : '#ef4444', // Màu giáp bạc hoặc đỏ máu
      isCrit: false,
      createdAt: time,
      lifespan: 600
    });

    // Rung màn hình
    setCameraShake(damage * 2.5);

    // Hạt đỏ tóe ra
    for (let k = 0; k < 8; k++) {
      addParticle({
        id: `player_blood_${Date.now()}_${k}`,
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        radius: 2 + Math.random() * 2,
        color: '#f87171',
        alpha: 0.9,
        decay: 0.05,
        createdAt: time,
        lifespan: 250
      });
    }
  }

  // --- HÀM PHÁT NỔ (TNT HOẶC DƠI TỰ SÁT) ---
  function triggerExplosion(ex: number, ey: number, damage: number, radius: number, time: number) {
    setCameraShake(6);
    
    // Tạo 30 hạt hiệu ứng nổ rực rỡ (Cam - Đỏ - Vàng)
    for (let k = 0; k < 25; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      const colors = ['#f97316', '#ef4444', '#f59e0b', '#78716c'];
      addParticle({
        id: `expl_${Date.now()}_${k}`,
        x: ex,
        y: ey,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        createdAt: time,
        lifespan: 400 + Math.random() * 300
      });
    }

    // 1. Kiểm tra sát thương lên Player
    const playerDist = Math.sqrt((player!.x - ex) ** 2 + (player!.y - ey) ** 2);
    if (playerDist <= radius + player!.radius) {
      dealDamageToPlayer(damage, player!, time);
    }

    // 2. Sát thương lan lên quái vật xung quanh (Friendly fire!)
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      const edist = Math.sqrt((e.x - ex) ** 2 + (e.y - ey) ** 2);
      if (edist <= radius + e.radius && edist > 0) {
        const dmgRatio = 1 - (edist / radius); // Sát thương giảm dần từ tâm vụ nổ
        const finalDmg = Math.max(1, Math.floor(damage * 1.5 * dmgRatio));
        const nextHp = Math.max(0, e.hp - finalDmg);
        
        // Lực đẩy nổ
        const forceAngle = Math.atan2(e.y - ey, e.x - ex);
        updateEnemy(e.id, {
          hp: nextHp,
          vx: Math.cos(forceAngle) * 6,
          vy: Math.sin(forceAngle) * 6
        });

        addDamageNumber({
          id: `expl_dmg_${Date.now()}_${e.id}`,
          x: e.x,
          y: e.y - 15,
          value: finalDmg,
          color: '#f97316',
          isCrit: true,
          createdAt: time,
          lifespan: 600
        });
      }
    });

    // 3. Sát thương lên các thùng gỗ / thùng thuốc nổ lân cận để tạo chuỗi nổ (Chain reaction!)
    destructibleBarrels.forEach(b => {
      const bdist = Math.sqrt((b.x - ex) ** 2 + (b.y - ey) ** 2);
      if (bdist <= radius + b.radius) {
        removeDestructibleBarrel(b.id);
      }
    });

    explosiveBarrels.forEach(b => {
      const bdist = Math.sqrt((b.x - ex) ** 2 + (b.y - ey) ** 2);
      if (bdist <= radius + b.radius && bdist > 0) {
        // Kích nổ thùng này sau 100ms
        setTimeout(() => {
          const freshExplosives = useEntityStore.getState().explosiveBarrels;
          const stillExists = freshExplosives.find(exp => exp.id === b.id);
          if (stillExists) {
            removeExplosiveBarrel(b.id);
            triggerExplosion(b.x, b.y, 10, 100, performance.now());
          }
        }, 120);
      }
    });
  }

  // --- HÀM TẤN CÔNG ĐẶC BIỆT CỦA BOSS (GRAND SLIME) ---
  function triggerBossSpecialAttack(boss: Entity, p: Entity, time: number) {
    const randomAction = Math.random();

    if (randomAction < 0.65) {
      // 1. TỎA ĐẠN 360 ĐỘ (Ring of Fire)
      setCameraShake(3);
      const bulletCount = boss.hp < boss.maxHp * 0.5 ? 16 : 10; // Bắn nhiều đạn hơn khi dưới 50% máu
      const speed = 4;

      for (let i = 0; i < bulletCount; i++) {
        const bulletAngle = (i / bulletCount) * Math.PI * 2;
        const vx = Math.cos(bulletAngle) * speed;
        const vy = Math.sin(bulletAngle) * speed;

        addProjectile({
          id: `boss_bullet_${Date.now()}_${i}`,
          owner: 'enemy',
          x: boss.x + Math.cos(bulletAngle) * (boss.radius + 10),
          y: boss.y + Math.sin(bulletAngle) * (boss.radius + 10),
          vx,
          vy,
          radius: 6,
          damage: boss.damage!,
          color: '#f43f5e',
          lifespan: 2500,
          createdAt: time
        });
      }
    } 
    else {
      // 2. NHẢY DẬM ĐẤT (SLAM ATTACK)
      // Boss nhảy xổ về hướng Player
      const jumpAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
      const bdx = p.x - boss.x;
      const bdy = p.y - boss.y;
      const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
      const jumpDist = Math.min(bdist, 200); // Nhảy tối đa 200px
      
      updateEnemy(boss.id, {
        vx: Math.cos(jumpAngle) * 8,
        vy: Math.sin(jumpAngle) * 8,
        // Đánh dấu boss đang nhảy
        ...({ isJumping: true, jumpTargetX: boss.x + Math.cos(jumpAngle) * jumpDist, jumpTargetY: boss.y + Math.sin(jumpAngle) * jumpDist } as any)
      });

      // Tạo bóng mờ boss nhảy
      for (let k = 0; k < 5; k++) {
        addParticle({
          id: `boss_jump_dust_${Date.now()}_${k}`,
          x: boss.x,
          y: boss.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: 5 + Math.random() * 5,
          color: 'rgba(6, 182, 212, 0.4)',
          alpha: 0.7,
          decay: 0.05,
          createdAt: time,
          lifespan: 300
        });
      }
    }
  }
}
