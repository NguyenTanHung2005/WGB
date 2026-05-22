import { useEntityStore } from '../store/entityStore';
import type { Entity } from '../types/interfaces';

export function runAISystem(_delta: number) {
  const { 
    player, updatePlayer, enemies, updateEnemy, 
    allies, updateAlly, removeAlly,
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

      // Quái thường: Tấn công cận chiến khi áp sát
      if (enemy.type !== 'boss') {
        const attackDist = enemy.radius + player.radius + 8;
        if (dist <= attackDist) {
          const lastAttackTime = enemy.lastAttackTime || 0;
          const cooldown = enemy.speed * 400;
          if (currentTime - lastAttackTime >= cooldown) {
            updateEnemy(enemy.id, { lastAttackTime: currentTime });
            dealDamageToPlayer(enemy.damage!, player, currentTime, enemy.element);
          }
        }
      } else {
        // AI Của Boss: Tấn công liên tục bất kể khoảng cách, thời gian hồi chiêu khó đoán
        const lastAttackTime = enemy.lastAttackTime || 0;
        const cooldown = (enemy as any).nextCooldown || 1500;
        if (currentTime - lastAttackTime >= cooldown) {
          const nextCd = 800 + Math.random() * 1200; // Cooldown ngẫu nhiên từ 0.8s - 2.0s
          updateEnemy(enemy.id, { lastAttackTime: currentTime, nextCooldown: nextCd } as any);
          triggerBossSpecialAttack(enemy, player, currentTime);
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
          color: enemy.element === 'fire' ? '#f97316' : (enemy.element === 'ice' ? '#38bdf8' : (enemy.element === 'poison' ? '#a855f7' : '#f43f5e')), // Màu đạn theo hệ
          lifespan: 2000,
          createdAt: currentTime,
          element: enemy.element
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
    else if (enemy.aiPattern === 'summon') {
      // TỬ LINH SƯ: Tránh xa Player, giữ khoảng cách 250-400
      if (dist > 400) {
        targetVx = dx / dist;
        targetVy = dy / dist;
      } else if (dist < 250) {
        targetVx = -dx / dist;
        targetVy = -dy / dist;
      } else {
        targetVx = 0;
        targetVy = 0;
      }

      const lastSummonTime = enemy.lastSummonTime || 0;
      const cooldown = 4000; // 4 giây
      if (currentTime - lastSummonTime >= cooldown) {
        updateEnemy(enemy.id, { lastSummonTime: currentTime });
        
        // Triệu hồi 2 minion_skeleton
        addDamageNumber({
          id: `necro_summon_${Date.now()}`,
          x: enemy.x,
          y: enemy.y - 20,
          value: 0,
          color: '#a855f7',
          isCrit: true,
          text: 'ARISE!',
          createdAt: currentTime,
          lifespan: 1500
        } as any);

        for (let i = 0; i < 2; i++) {
          const offsetAngle = Math.random() * Math.PI * 2;
          const spawnX = enemy.x + Math.cos(offsetAngle) * 40;
          const spawnY = enemy.y + Math.sin(offsetAngle) * 40;
          
          useEntityStore.getState().addEnemy({
            id: `summoned_skel_${Date.now()}_${i}`,
            x: spawnX,
            y: spawnY,
            vx: 0,
            vy: 0,
            angle: 0,
            radius: 10, // Nhỏ hơn skeleton bình thường
            hp: 1,
            maxHp: 1,
            damage: 1,
            speed: 3.5, // Chạy rất nhanh
            color: '#94a3b8',
            type: 'enemy',
            aiPattern: 'chase',
            templateId: 'melee_skeleton',
            statusEffects: []
          });

          // Hiệu ứng hạt tím
          for(let k = 0; k < 10; k++) {
            addParticle({
              id: `necro_spark_${Date.now()}_${k}_${i}`,
              x: spawnX,
              y: spawnY,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: 3,
              color: '#d8b4fe',
              alpha: 1.0,
              decay: 0.03,
              createdAt: currentTime,
              lifespan: 500
            });
          }
        }
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

  // --- XỬ LÝ ĐỒNG MINH (ALLIES) ---
  allies.forEach(ally => {
    if (ally.aiPattern === 'follow') {
      // 1. DI CHUYỂN: Lượn quanh Player (Orbiting)
      const orbitSpeed = 0.002;
      const orbitRadius = 60;
      const angleOffset = performance.now() * orbitSpeed;
      
      const targetX = player.x + Math.cos(angleOffset) * orbitRadius;
      const targetY = player.y + Math.sin(angleOffset) * orbitRadius;
      
      const dx = targetX - ally.x;
      const dy = targetY - ally.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let targetVx = 0;
      let targetVy = 0;
      
      if (dist > 5) {
        targetVx = dx / dist;
        targetVy = dy / dist;
      }
      
      // Nội suy để bay mượt mà
      const nextVx = ally.vx * 0.9 + targetVx * 0.1;
      const nextVy = ally.vy * 0.9 + targetVy * 0.1;
      
      // 2. TẤN CÔNG: Bắn đạn ma thuật vào quái vật gần nhất
      const lastShootTime = ally.lastAIShootTime || 0;
      const cooldown = 1500; // 1.5 giây bắn 1 lần
      
      if (currentTime - lastShootTime >= cooldown) {
        // Tìm quái vật gần nhất
        let nearestEnemy = null;
        let minDist = 350; // Tầm bắn 350px
        
        enemies.forEach(e => {
          if (e.hp <= 0) return;
          const edx = e.x - ally.x;
          const edy = e.y - ally.y;
          const d = Math.sqrt(edx * edx + edy * edy);
          if (d < minDist) {
            minDist = d;
            nearestEnemy = e;
          }
        });
        
        if (nearestEnemy) {
          const nearest = nearestEnemy as Entity;
          useEntityStore.getState().updateAlly(ally.id, { lastAIShootTime: currentTime });
          
          const edx = nearest.x - ally.x;
          const edy = nearest.y - ally.y;
          const shootAngle = Math.atan2(edy, edx);
          
          const pVx = Math.cos(shootAngle) * 7;
          const pVy = Math.sin(shootAngle) * 7;
          
          useEntityStore.getState().addProjectile({
            id: `fairy_bullet_${Date.now()}_${ally.id}`,
            owner: 'player', // Gây sát thương lên enemy
            x: ally.x,
            y: ally.y,
            vx: pVx,
            vy: pVy,
            radius: 5,
            damage: ally.damage || 2,
            color: '#fef08a', // Màu vàng chanh
            lifespan: 1500,
            createdAt: currentTime
          });
        }
      }
      
      useEntityStore.getState().updateAlly(ally.id, {
        vx: nextVx,
        vy: nextVy
      });
    }
  });

  // --- HÀM GÂY SÁT THƯƠNG LÊN PLAYER ---
  function dealDamageToPlayer(damage: number, p: Entity, time: number, element?: 'fire' | 'ice' | 'poison') {
    if (isPlayerRolling) return; // Đang lộn nhào né -> vô địch

    updatePlayer(prev => {
      let finalDmg = damage;
      const shield = prev.shield || 0;
      const hp = prev.hp;

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
      
      let nextStatusEffects = [...(prev.statusEffects || [])];
      if (element) {
        const effectName = element === 'fire' ? 'burning' : (element === 'ice' ? 'frozen' : 'poisoned');
        if (!nextStatusEffects.includes(effectName)) {
          nextStatusEffects.push(effectName);
        }
      }

      return {
        ...prev,
        hp: nextHp,
        shield: nextShield,
        lastHitTime: time,
        hitFlashActive: true,
        hitFlashStart: time,
        statusEffects: nextStatusEffects
      };
    });

    // Tạo số sát thương nổi lên trên đầu Player (màu đỏ giáp hoặc đỏ máu)
    addDamageNumber({
      id: `player_dmg_${Date.now()}`,
      x: p.x,
      y: p.y - 15,
      value: damage,
      color: (p.shield || 0) > 0 ? '#94a3b8' : '#ef4444', // Màu giáp bạc hoặc đỏ máu
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
    const isEnraged = boss.hp < boss.maxHp * 0.5;
    const rand = Math.random();

    if (rand < 0.4) {
      // 1. SPIRAL BULLET HELL (Mưa đạn xoáy ốc)
      setCameraShake(4);
      const bulletCount = isEnraged ? 24 : 12; 
      const speed = isEnraged ? 5 : 3.5;
      
      // Tạo đạn trễ dần để tạo hiệu ứng xoắn ốc
      for (let i = 0; i < bulletCount; i++) {
        setTimeout(() => {
          const bulletAngle = (i / bulletCount) * Math.PI * 4; // Xoay 2 vòng
          const vx = Math.cos(bulletAngle) * speed;
          const vy = Math.sin(bulletAngle) * speed;

          addProjectile({
            id: `boss_bullet_${Date.now()}_${i}`,
            owner: 'enemy',
            x: boss.x + Math.cos(bulletAngle) * (boss.radius + 10),
            y: boss.y + Math.sin(bulletAngle) * (boss.radius + 10),
            vx,
            vy,
            radius: isEnraged ? 8 : 6,
            damage: boss.damage!,
            color: isEnraged ? '#991b1b' : '#f43f5e',
            lifespan: 3000,
            createdAt: performance.now()
          });
        }, i * 60); // Bắn đạn cách nhau 60ms
      }
    } 
    else if (rand < 0.75 || !isEnraged) {
      // 2. BERSERK DASH (Lướt điên cuồng về phía Player)
      const jumpAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
      const dashSpeed = isEnraged ? 14 : 10;
      
      updateEnemy(boss.id, {
        vx: Math.cos(jumpAngle) * dashSpeed,
        vy: Math.sin(jumpAngle) * dashSpeed,
        // Đánh dấu boss đang nhảy/lướt
        ...({ isJumping: true } as any)
      });

      // Tạo bóng mờ và vệt lửa phía sau
      for (let k = 0; k < 8; k++) {
        addParticle({
          id: `boss_dash_dust_${Date.now()}_${k}`,
          x: boss.x,
          y: boss.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: 6 + Math.random() * 6,
          color: isEnraged ? '#ef4444' : 'rgba(6, 182, 212, 0.4)',
          alpha: 0.8,
          decay: 0.04,
          createdAt: time,
          lifespan: 400
        });
      }
    }
    else {
      // 3. SUMMON MINIONS (Triệu hồi Lính - Chỉ dùng khi isEnraged)
      setCameraShake(8);
      
      // Tạo chữ cảnh báo
      addDamageNumber({
        id: `boss_summon_${Date.now()}`,
        x: boss.x,
        y: boss.y - boss.radius - 20,
        value: 0,
        color: '#fbbf24',
        isCrit: true,
        text: 'RISE, MINIONS!',
        createdAt: time,
        lifespan: 1500
      } as any);

      // Triệu hồi 2 Dơi Tự Sát (Suicide Bats)
      const numMinions = 2;
      for (let i = 0; i < numMinions; i++) {
        const offsetAngle = Math.random() * Math.PI * 2;
        const spawnX = boss.x + Math.cos(offsetAngle) * 80;
        const spawnY = boss.y + Math.sin(offsetAngle) * 80;
        
        useEntityStore.getState().addEnemy({
          id: `minion_bat_${Date.now()}_${i}`,
          x: spawnX,
          y: spawnY,
          vx: 0,
          vy: 0,
          angle: 0,
          radius: 12,
          hp: 20,
          maxHp: 20,
          damage: 5,
          speed: 1.5,
          color: '#8b5cf6',
          type: 'enemy',
          aiPattern: 'charge',
          templateId: 'suicide_bat',
          statusEffects: []
        });

        // Hạt hiệu ứng triệu hồi
        for(let k = 0; k < 10; k++) {
          addParticle({
            id: `summon_spark_${Date.now()}_${k}_${i}`,
            x: spawnX,
            y: spawnY,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: 3,
            color: '#a855f7',
            alpha: 1.0,
            decay: 0.03,
            createdAt: time,
            lifespan: 500
          });
        }
      }
    }
  }
  // --- 5. XỬ LÝ ĐỒNG MINH (ALLIES) ---
  allies.forEach(ally => {
    // Kiểm tra hết hạn thời gian
    if (ally.expireTime && currentTime >= ally.expireTime) {
      // Sói tinh linh tan biến thành hạt sáng
      for (let k = 0; k < 10; k++) {
        addParticle({
          id: `ally_expire_${Date.now()}_${ally.id}_${k}`,
          x: ally.x,
          y: ally.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: 2 + Math.random() * 2,
          color: '#2dd4bf', // Cyan sẫm
          alpha: 1.0,
          decay: 0.05,
          createdAt: currentTime,
          lifespan: 300
        });
      }
      removeAlly(ally.id);
      return;
    }

    if (ally.aiPattern === 'chase') {
      // TÌM MỤC TIÊU LÀ QUÁI VẬT GẦN NHẤT
      let target: Entity | null = null;
      let minDist = 600; // Tầm nhìn sói

      const activeEnemies = enemies.filter(e => e.hp > 0);
      for (const e of activeEnemies) {
        const dx = e.x - ally.x;
        const dy = e.y - ally.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          target = e;
        }
      }

      if (target) {
        const dx = target.x - ally.x;
        const dy = target.y - ally.y;
        const angle = Math.atan2(dy, dx);

        // Đuổi theo quái
        const targetVx = Math.cos(angle) * ally.speed;
        const targetVy = Math.sin(angle) * ally.speed;

        const lerpFactor = 0.15;
        const nextVx = ally.vx * (1 - lerpFactor) + targetVx * lerpFactor;
        const nextVy = ally.vy * (1 - lerpFactor) + targetVy * lerpFactor;

        updateAlly(ally.id, { vx: nextVx, vy: nextVy, angle });

        // Cắn nếu ở gần
        const explodeDist = ally.radius + target.radius + 15;
        if (minDist <= explodeDist) {
          const lastAttackTime = ally.lastAttackTime || 0;
          if (currentTime - lastAttackTime > 800) { // Sói cắn mỗi 0.8s
            updateAlly(ally.id, { lastAttackTime: currentTime });
            
            // Gây sát thương lên quái
            const nextHp = Math.max(0, target.hp - (ally.damage || 5));
            updateEnemy(target.id, { 
              hp: nextHp,
              // Giật lùi
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3
            });

            addDamageNumber({
              id: `ally_dmg_${Date.now()}_${target.id}`,
              x: target.x,
              y: target.y - 15,
              value: ally.damage || 5,
              color: '#fcd34d', // Vàng cam
              isCrit: false,
              createdAt: currentTime,
              lifespan: 500
            });

            // Máu xịt ra từ quái bị cắn
            for (let k = 0; k < 3; k++) {
              addParticle({
                id: `wolf_bite_${Date.now()}_${target.id}_${k}`,
                x: target.x,
                y: target.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 2,
                color: '#ef4444',
                alpha: 0.8,
                decay: 0.1,
                createdAt: currentTime,
                lifespan: 150
              });
            }
          }
        }
      } else {
        // Nếu không có quái, chạy vòng quanh người chơi
        const dx = player.x - ally.x;
        const dy = player.y - ally.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetVx = 0;
        let targetVy = 0;
        let angle = ally.angle;

        if (dist > 80) { // Nếu cách xa quá 80px thì chạy lại gần
          angle = Math.atan2(dy, dx);
          targetVx = Math.cos(angle) * ally.speed * 0.8; // Chạy chậm hơn xíu khi theo chủ
          targetVy = Math.sin(angle) * ally.speed * 0.8;
        }

        const lerpFactor = 0.1;
        updateAlly(ally.id, { 
          vx: ally.vx * (1 - lerpFactor) + targetVx * lerpFactor, 
          vy: ally.vy * (1 - lerpFactor) + targetVy * lerpFactor,
          angle
        });
      }
    }
  });
}
