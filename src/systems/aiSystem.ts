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

      // Zombie Dash: Nếu máu < 50% và ở khoảng cách trung bình, thỉnh thoảng lao tới
      if (enemy.templateId === 'melee_zombie' && enemy.hp < enemy.maxHp * 0.5) {
        const lastDashTime = (enemy as any).lastDashTime || 0;
        if (dist > 80 && dist < 200 && currentTime - lastDashTime > 3000) {
          updateEnemy(enemy.id, { 
            vx: targetVx * enemy.speed * 4, // Tốc độ x4
            vy: targetVy * enemy.speed * 4,
            lastDashTime: currentTime 
          } as any);
        }
      }

      // Quái thường: Tấn công cận chiến khi áp sát
      if (enemy.type !== 'boss') {
        const attackDist = enemy.radius + player.radius + 8;
        if (dist <= attackDist) {
          const lastAttackTime = enemy.lastAttackTime || 0;
          const cooldown = enemy.speed * 400;
          if (currentTime - lastAttackTime >= cooldown) {
            updateEnemy(enemy.id, { lastAttackTime: currentTime });
            let finalEnemyDamage = enemy.damage!;
            if (enemy.missingLimbs?.includes('arm')) {
              finalEnemyDamage = Math.max(1, Math.floor(finalEnemyDamage * 0.5));
            }
            dealDamageToPlayer(finalEnemyDamage, player, currentTime, enemy.element, enemy.x, enemy.y);
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
      const attackCooldown = enemy.templateId === 'ranged_skeleton' ? 2500 : 1500; 
      
      if (currentTime - lastAIShootTime >= attackCooldown && dist < 450) {
        updateEnemy(enemy.id, { lastAIShootTime: currentTime });
        
        let projVx = dx / dist;
        let projVy = dy / dist;

        // Ngắm bắn tiên đoán (Predictive Aiming) cho Skeleton
        if (enemy.templateId === 'ranged_skeleton') {
           const bulletSpeed = 5;
           const timeToHit = dist / bulletSpeed;
           const predictedX = player.x + player.vx * timeToHit * 0.5;
           const predictedY = player.y + player.vy * timeToHit * 0.5;
           const pdx = predictedX - enemy.x;
           const pdy = predictedY - enemy.y;
           const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
           if (pDist > 0) {
             projVx = pdx / pDist;
             projVy = pdy / pDist;
           }
        }

        // Spawn đạn đỏ hướng tới Player
        const speed = 5;
        const vx = projVx * speed;
        const vy = projVy * speed;

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
    else if (enemy.aiPattern === 'ambush') {
      // GIẢ CHẾT: Đứng im. Nếu Player đến gần 150px thì sống dậy chuyển thành 'chase'
      if (!enemy.isAmbushing) {
        targetVx = 0;
        targetVy = 0;
        if (dist <= 150) {
          updateEnemy(enemy.id, { isAmbushing: true, aiPattern: 'chase' });
          addDamageNumber({
            id: `ambush_${Date.now()}_${enemy.id}`, x: enemy.x, y: enemy.y - 20,
            value: 0, color: '#ef4444', isCrit: true, text: 'AWAKE!',
            createdAt: currentTime, lifespan: 1000
          } as any);
        }
      }
    }
    else if (enemy.aiPattern === 'dash_attack') {
      // LƯỚT TẤN CÔNG (Telegraphing)
      const state = enemy.dashState || 'cooldown';
      const lastDash = enemy.lastDashTime || 0;

      if (state === 'cooldown') {
        // Đi chậm về phía người chơi
        targetVx = (dx / dist) * 0.5;
        targetVy = (dy / dist) * 0.5;
        
        if (dist < 200 && currentTime - lastDash > 4000) {
          updateEnemy(enemy.id, { 
            dashState: 'warning', 
            lastDashTime: currentTime,
            dashTargetX: dx / dist, // Lưu trước hướng lao tới
            dashTargetY: dy / dist
          });
        }
      } else if (state === 'warning') {
        // Đứng yên nhấp nháy đỏ (Telegraphing)
        targetVx = 0;
        targetVy = 0;
        if (currentTime - lastDash > 800) { // 0.8s cảnh báo
          updateEnemy(enemy.id, { 
            dashState: 'dashing', 
            lastDashTime: currentTime
          });
        }
      } else if (state === 'dashing') {
        // Lao đi cực nhanh
        const dashDirX = enemy.dashTargetX || 0;
        const dashDirY = enemy.dashTargetY || 0;
        targetVx = dashDirX * 3.5;
        targetVy = dashDirY * 3.5;

        if (currentTime - lastDash > 600) {
          updateEnemy(enemy.id, { dashState: 'cooldown', lastDashTime: currentTime });
        }
      }

      // Tấn công cận chiến khi áp sát
      const attackDist = enemy.radius + player.radius + 8;
      if (dist <= attackDist) {
        const lastAttackTime = enemy.lastAttackTime || 0;
        const cooldown = 1000;
        if (currentTime - lastAttackTime >= cooldown) {
          updateEnemy(enemy.id, { lastAttackTime: currentTime });
          let finalEnemyDamage = enemy.damage!;
          if (enemy.missingLimbs?.includes('arm')) {
            finalEnemyDamage = Math.max(1, Math.floor(finalEnemyDamage * 0.5));
          }
          dealDamageToPlayer(finalEnemyDamage * (state === 'dashing' ? 2 : 1), player, currentTime, enemy.element, enemy.x, enemy.y);
        }
      }
    }
    else if (enemy.aiPattern === 'dragon_boss') {
      const state = enemy.dashState || 'reposition';
      const stateStartTime = enemy.lastDashTime || currentTime;
      const isEnragedPhase = enemy.hp <= (enemy.maxHp * 0.5);

      // Check transition to enraged
      if (isEnragedPhase && !enemy.isEnraged && state !== 'enraged_transition') {
        updateEnemy(enemy.id, { 
          dashState: 'enraged_transition', 
          lastDashTime: currentTime,
          isEnraged: true
        });
      }

      if (state === 'enraged_transition') {
        // Nổi điên: Đứng yên gầm rú, không di chuyển
        targetVx = 0; targetVy = 0;
        
        // Sinh ra bão lửa (Firestorm) xung quanh
        const lastSummon = enemy.lastSummonTime || 0;
        if (currentTime - lastSummon > 400) {
          updateEnemy(enemy.id, { lastSummonTime: currentTime });
          addProjectile({
            id: `enraged_storm_${Date.now()}_${enemy.id}`, owner: 'enemy',
            x: enemy.x + (Math.random() - 0.5) * 300, 
            y: enemy.y + (Math.random() - 0.5) * 300,
            vx: 0, vy: 0, radius: 25, damage: enemy.damage!, color: '#f97316',
            lifespan: 1000, createdAt: currentTime, element: 'fire'
          });
        }

        if (currentTime - stateStartTime > 2500) {
          updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
        }
      } 
      else if (state === 'reposition') {
        // Đi vòng quanh hoặc giữ khoảng cách
        const desiredDist = isEnragedPhase ? 150 : 250;
        const speedMult = isEnragedPhase ? 2.5 : 1.5;

        if (dist > desiredDist + 50) {
          targetVx = (dx / dist) * speedMult;
          targetVy = (dy / dist) * speedMult;
        } else if (dist < desiredDist - 50) {
          targetVx = -(dx / dist) * speedMult;
          targetVy = -(dy / dist) * speedMult;
        } else {
          // Bay vòng tròn (Circle strafe)
          targetVx = -(dy / dist) * speedMult;
          targetVy = (dx / dist) * speedMult;
        }

        // Sau 2-3s, chọn chiêu thức ngẫu nhiên
        const phaseDuration = isEnragedPhase ? 1500 : 2500;
        if (currentTime - stateStartTime > phaseDuration) {
          const rand = Math.random();
          if (rand < 0.4) {
            updateEnemy(enemy.id, { dashState: 'warning', lastDashTime: currentTime }); // Khạc lửa
          } else if (rand < 0.7) {
            updateEnemy(enemy.id, { 
              dashState: 'dash_warning', 
              lastDashTime: currentTime,
              dashTargetX: dx / dist,
              dashTargetY: dy / dist
            }); // Lao tới cắn
          } else {
            updateEnemy(enemy.id, { dashState: 'homing_fire', lastDashTime: currentTime }); // Bắn cầu lửa
          }
        }
      }
      else if (state === 'dash_warning') {
        // Chuẩn bị đâm bổ
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > 800) {
          updateEnemy(enemy.id, { 
            dashState: 'dash_bite', 
            lastDashTime: currentTime,
            dashTargetX: dx / dist,
            dashTargetY: dy / dist
          });
        }
      }
      else if (state === 'dash_bite') {
        // Lao đi cực mạnh
        const dashSpeed = isEnragedPhase ? 7 : 5;
        targetVx = (enemy.dashTargetX || 0) * dashSpeed;
        targetVy = (enemy.dashTargetY || 0) * dashSpeed;
        
        // Cắn nếu trúng
        if (dist <= enemy.radius + player.radius + 10) {
          const lastAttack = enemy.lastAttackTime || 0;
          if (currentTime - lastAttack >= 500) {
            updateEnemy(enemy.id, { lastAttackTime: currentTime });
            dealDamageToPlayer(enemy.damage! * 1.5, player, currentTime, undefined, enemy.x, enemy.y);
          }
        }

        if (currentTime - stateStartTime > 600) {
          updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
        }
      }
      else if (state === 'homing_fire') {
        // Đứng yên bắn Homing Fireballs
        targetVx = (dx / dist) * 0.5; // Đi rất chậm
        targetVy = (dy / dist) * 0.5;
        
        const lastAIShootTime = enemy.lastAIShootTime || 0;
        const shootRate = isEnragedPhase ? 300 : 500;
        
        if (currentTime - lastAIShootTime > shootRate) {
          updateEnemy(enemy.id, { lastAIShootTime: currentTime });
          addProjectile({
            id: `dragon_homing_${Date.now()}_${enemy.id}`, owner: 'enemy',
            x: enemy.x, y: enemy.y,
            vx: (dx/dist) * 2 + (Math.random()-0.5)*1,
            vy: (dy/dist) * 2 + (Math.random()-0.5)*1,
            radius: 8, damage: enemy.damage!, color: '#fbbf24',
            lifespan: 3000, createdAt: currentTime, element: 'fire'
          });
        }

        if (currentTime - stateStartTime > 1500) {
          updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
        }
      }
      else if (state === 'warning') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > (isEnragedPhase ? 1000 : 1500)) {
          updateEnemy(enemy.id, { dashState: 'fire_breath', lastDashTime: currentTime });
        }
      } 
      else if (state === 'fire_breath') {
        targetVx = 0; targetVy = 0;
        const lastAIShootTime = enemy.lastAIShootTime || 0;
        const breathRate = isEnragedPhase ? 100 : 200;
        
        if (currentTime - lastAIShootTime > breathRate) {
          updateEnemy(enemy.id, { lastAIShootTime: currentTime });
          const aimAngle = Math.atan2(dy, dx);
          
          if (isEnragedPhase) {
            // Nổi điên: Xoay tròn phun lửa 360 độ (Spiral Fire)
            const timeOffset = (currentTime / 100) % (Math.PI * 2);
            for (let i = 0; i < 4; i++) {
              const spreadAngle = timeOffset + (i * Math.PI / 2);
              addProjectile({
                id: `dragon_fire_${Date.now()}_${i}_${enemy.id}`, owner: 'enemy',
                x: enemy.x, y: enemy.y,
                vx: Math.cos(spreadAngle) * 5.5, vy: Math.sin(spreadAngle) * 5.5,
                radius: 7, damage: enemy.damage!, color: '#ef4444',
                lifespan: 1500, createdAt: currentTime, element: 'fire'
              });
            }
          } else {
            // Bình thường: Phun lửa hình nón (Cone)
            for (let i = -2; i <= 2; i++) {
              const spreadAngle = aimAngle + i * 0.25; 
              addProjectile({
                id: `dragon_fire_${Date.now()}_${i}_${enemy.id}`, owner: 'enemy',
                x: enemy.x + Math.cos(aimAngle) * enemy.radius * 0.8,
                y: enemy.y + Math.sin(aimAngle) * enemy.radius * 0.8,
                vx: Math.cos(spreadAngle) * 5, vy: Math.sin(spreadAngle) * 5,
                radius: 6 + Math.random() * 4, damage: enemy.damage!, color: '#f97316',
                lifespan: 1500, createdAt: currentTime, element: 'fire'
              });
            }
          }
        }

        if (currentTime - stateStartTime > (isEnragedPhase ? 3000 : 2500)) {
          updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
        }
      }
      else { 
        // Fallback
        updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      }
    }
    else if (enemy.aiPattern === 'frost_boss') {
      const state = enemy.dashState || 'reposition';
      const stateStartTime = enemy.lastDashTime || currentTime;
      const isEnragedPhase = enemy.hp <= (enemy.maxHp * 0.5);

      if (isEnragedPhase && !enemy.isEnraged && state !== 'enraged_transition') {
        updateEnemy(enemy.id, { dashState: 'enraged_transition', lastDashTime: currentTime, isEnraged: true });
      }

      if (state === 'enraged_transition') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > 2000) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      } 
      else if (state === 'reposition') {
        // Frost Lord bay xa người chơi, rải đạn từ xa
        if (dist < 200) { targetVx = -(dx / dist) * 2; targetVy = -(dy / dist) * 2; }
        else { targetVx = -(dy / dist) * 1.5; targetVy = (dx / dist) * 1.5; }

        if (currentTime - stateStartTime > (isEnragedPhase ? 1500 : 2500)) {
          const rand = Math.random();
          if (rand < 0.5) updateEnemy(enemy.id, { dashState: 'frost_spear', lastDashTime: currentTime });
          else if (isEnragedPhase && rand < 0.8) updateEnemy(enemy.id, { dashState: 'blizzard', lastDashTime: currentTime });
          else updateEnemy(enemy.id, { dashState: 'teleport', lastDashTime: currentTime });
        }
      }
      else if (state === 'frost_spear') {
        targetVx = 0; targetVy = 0;
        const lastAIShootTime = enemy.lastAIShootTime || 0;
        if (currentTime - lastAIShootTime > (isEnragedPhase ? 300 : 500)) {
          updateEnemy(enemy.id, { lastAIShootTime: currentTime });
          const aimAngle = Math.atan2(dy, dx);
          // Bắn 3 mũi giáo băng
          for (let i = -1; i <= 1; i++) {
            addProjectile({
              id: `frost_spear_${Date.now()}_${i}_${enemy.id}`, owner: 'enemy',
              x: enemy.x, y: enemy.y,
              vx: Math.cos(aimAngle + i * 0.15) * 8, vy: Math.sin(aimAngle + i * 0.15) * 8,
              radius: 5, damage: enemy.damage!, color: '#38bdf8', lifespan: 2000, createdAt: currentTime, element: 'ice'
            });
          }
        }
        if (currentTime - stateStartTime > 2000) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      }
      else if (state === 'blizzard') {
        targetVx = 0; targetVy = 0;
        const lastAIShootTime = enemy.lastAIShootTime || 0;
        if (currentTime - lastAIShootTime > 200) {
          updateEnemy(enemy.id, { lastAIShootTime: currentTime });
          addProjectile({
            id: `blizzard_${Date.now()}_${enemy.id}`, owner: 'enemy',
            x: enemy.x + (Math.random()-0.5)*400, y: enemy.y + (Math.random()-0.5)*400,
            vx: 0, vy: 0, radius: 40, damage: enemy.damage! * 0.5, color: '#e0f2fe', lifespan: 3000, createdAt: currentTime, element: 'ice'
          });
        }
        if (currentTime - stateStartTime > 3000) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      }
      else if (state === 'teleport') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime === 0) {
          // Bắt đầu dịch chuyển -> Tạo hạt
        }
        if (currentTime - stateStartTime > 500) {
          // Dịch chuyển ra phía sau người chơi
          const pAngle = Math.atan2(player.vy, player.vx) || Math.random() * Math.PI * 2;
          const nx = player.x - Math.cos(pAngle) * 150;
          const ny = player.y - Math.sin(pAngle) * 150;
          updateEnemy(enemy.id, { x: nx, y: ny, dashState: 'frost_spear', lastDashTime: currentTime });
        }
      }
      else { updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime }); }
    }
    else if (enemy.aiPattern === 'toxic_boss') {
      const state = enemy.dashState || 'reposition';
      const stateStartTime = enemy.lastDashTime || currentTime;
      const isEnragedPhase = enemy.hp <= (enemy.maxHp * 0.5);

      if (isEnragedPhase && !enemy.isEnraged && state !== 'enraged_transition') {
        updateEnemy(enemy.id, { dashState: 'enraged_transition', lastDashTime: currentTime, isEnraged: true });
      }

      if (state === 'enraged_transition') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > 2000) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      } 
      else if (state === 'reposition') {
        // Quái nhầy di chuyển rất chậm về phía người chơi
        targetVx = (dx / dist) * (isEnragedPhase ? 1.5 : 1.0);
        targetVy = (dy / dist) * (isEnragedPhase ? 1.5 : 1.0);

        if (currentTime - stateStartTime > 3000) {
          const rand = Math.random();
          if (rand < 0.4) updateEnemy(enemy.id, { dashState: 'poison_pool', lastDashTime: currentTime });
          else if (isEnragedPhase && rand < 0.7) updateEnemy(enemy.id, { dashState: 'summon_slime', lastDashTime: currentTime });
          else updateEnemy(enemy.id, { dashState: 'fire_breath', lastDashTime: currentTime }); // Mượn logic phun nón
        }
      }
      else if (state === 'poison_pool') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > 1000) {
          // Phóng bãi độc
          addProjectile({
            id: `poison_pool_${Date.now()}_${enemy.id}`, owner: 'enemy',
            x: player.x, y: player.y, // Phóng thẳng vào vị trí player
            vx: 0, vy: 0, radius: 60, damage: enemy.damage! * 0.5, color: '#22c55e', lifespan: 5000, createdAt: currentTime, element: 'poison'
          });
          updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
        }
      }
      else if (state === 'summon_slime') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > 1000) {
          // Triệu hồi 3 con slime nhỏ
          for(let i=0; i<3; i++) {
            const angle = (Math.PI*2/3)*i;
            useEntityStore.getState().addEnemy({
              id: `slime_minion_${Date.now()}_${i}`, type: 'enemy',
              x: enemy.x + Math.cos(angle)*50, y: enemy.y + Math.sin(angle)*50,
              radius: 12, hp: 30, maxHp: 30, speed: 2.5, vx: 0, vy: 0,
              damage: 3, angle: 0, color: '#4ade80', aiPattern: 'charge',
              statusEffects: []
            });
          }
          updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
        }
      }
      else if (state === 'fire_breath') { // Phun độc hình nón
        targetVx = 0; targetVy = 0;
        const lastAIShootTime = enemy.lastAIShootTime || 0;
        if (currentTime - lastAIShootTime > 200) {
          updateEnemy(enemy.id, { lastAIShootTime: currentTime });
          const aimAngle = Math.atan2(dy, dx);
          for (let i = -1; i <= 1; i++) {
            addProjectile({
              id: `toxic_breath_${Date.now()}_${i}_${enemy.id}`, owner: 'enemy',
              x: enemy.x, y: enemy.y,
              vx: Math.cos(aimAngle + i*0.2) * 6, vy: Math.sin(aimAngle + i*0.2) * 6,
              radius: 8, damage: enemy.damage!, color: '#16a34a', lifespan: 1200, createdAt: currentTime, element: 'poison'
            });
          }
        }
        if (currentTime - stateStartTime > 2000) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      }
      else { updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime }); }
    }
    else if (enemy.aiPattern === 'blood_boss') {
      const state = enemy.dashState || 'reposition';
      const stateStartTime = enemy.lastDashTime || currentTime;
      const isEnragedPhase = enemy.hp <= (enemy.maxHp * 0.5);

      if (isEnragedPhase && !enemy.isEnraged && state !== 'enraged_transition') {
        updateEnemy(enemy.id, { dashState: 'enraged_transition', lastDashTime: currentTime, isEnraged: true });
      }

      if (state === 'enraged_transition') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > 2000) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      } 
      else if (state === 'reposition') {
        // Truy đuổi cực gắt
        targetVx = (dx / dist) * (isEnragedPhase ? 3.5 : 2.5);
        targetVy = (dy / dist) * (isEnragedPhase ? 3.5 : 2.5);

        if (dist <= enemy.radius + player.radius + 20) {
          const lastAttackTime = enemy.lastAttackTime || 0;
          if (currentTime - lastAttackTime >= 800) {
            updateEnemy(enemy.id, { lastAttackTime: currentTime, hp: Math.min(enemy.maxHp, enemy.hp + enemy.damage!) }); // Lifesteal
            dealDamageToPlayer(enemy.damage!, player, currentTime, undefined, enemy.x, enemy.y);
          }
        }

        if (currentTime - stateStartTime > 2000) {
          const rand = Math.random();
          if (rand < 0.4) updateEnemy(enemy.id, { dashState: 'blood_laser', lastDashTime: currentTime });
          else if (rand < 0.8) updateEnemy(enemy.id, { dashState: 'dash_warning', lastDashTime: currentTime, dashTargetX: dx/dist, dashTargetY: dy/dist });
          else if (isEnragedPhase) updateEnemy(enemy.id, { dashState: 'blizzard', lastDashTime: currentTime }); // Xài ké skill diện rộng nhưng đổi màu
        }
      }
      else if (state === 'dash_warning') {
        targetVx = 0; targetVy = 0;
        if (currentTime - stateStartTime > 500) updateEnemy(enemy.id, { dashState: 'lifesteal_dash', lastDashTime: currentTime });
      }
      else if (state === 'lifesteal_dash') {
        targetVx = (enemy.dashTargetX || 0) * 10;
        targetVy = (enemy.dashTargetY || 0) * 10;
        if (dist <= enemy.radius + player.radius + 20) {
          const lastAttackTime = enemy.lastAttackTime || 0;
          if (currentTime - lastAttackTime >= 400) {
            updateEnemy(enemy.id, { lastAttackTime: currentTime, hp: Math.min(enemy.maxHp, enemy.hp + enemy.damage!*2) });
            dealDamageToPlayer(enemy.damage!*1.5, player, currentTime, undefined, enemy.x, enemy.y);
          }
        }
        if (currentTime - stateStartTime > 400) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      }
      else if (state === 'blood_laser') {
        targetVx = 0; targetVy = 0;
        const lastAIShootTime = enemy.lastAIShootTime || 0;
        if (currentTime - lastAIShootTime > 100) {
          updateEnemy(enemy.id, { lastAIShootTime: currentTime });
          const aimAngle = Math.atan2(dy, dx);
          // Quạt laser
          const offset = Math.sin(currentTime/150) * 0.5;
          addProjectile({
            id: `blood_laser_${Date.now()}_${enemy.id}`, owner: 'enemy',
            x: enemy.x, y: enemy.y,
            vx: Math.cos(aimAngle + offset) * 12, vy: Math.sin(aimAngle + offset) * 12,
            radius: 8, damage: enemy.damage!, color: '#9f1239', lifespan: 1000, createdAt: currentTime
          });
        }
        if (currentTime - stateStartTime > 1500) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      }
      else if (state === 'blizzard') {
        targetVx = 0; targetVy = 0;
        const lastAIShootTime = enemy.lastAIShootTime || 0;
        if (currentTime - lastAIShootTime > 200) {
          updateEnemy(enemy.id, { lastAIShootTime: currentTime });
          addProjectile({
            id: `blood_pool_${Date.now()}_${enemy.id}`, owner: 'enemy',
            x: enemy.x + (Math.random()-0.5)*500, y: enemy.y + (Math.random()-0.5)*500,
            vx: 0, vy: 0, radius: 50, damage: enemy.damage!, color: '#be123c', lifespan: 2000, createdAt: currentTime
          });
        }
        if (currentTime - stateStartTime > 2000) updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime });
      }
      else { updateEnemy(enemy.id, { dashState: 'reposition', lastDashTime: currentTime }); }
    }
    else if (enemy.aiPattern === 'teleport_attack') {
      // OÁN LINH MÁU: Dịch chuyển tức thời ra sau lưng Player
      const state = enemy.dashState || 'chase';
      const lastTeleport = enemy.lastDashTime || 0;

      if (state === 'chase') {
        // Trôi lờ đờ về phía người chơi
        targetVx = (dx / dist) * 0.4;
        targetVy = (dy / dist) * 0.4;
        
        if (dist < 300 && dist > 100 && currentTime - lastTeleport > 3500) {
          // Tính toán trước vị trí dịch chuyển để làm cảnh báo
          const backDistance = 80;
          let pAngle = Math.atan2(player.vy, player.vx);
          if (player.vx === 0 && player.vy === 0) pAngle = Math.random() * Math.PI * 2;
          
          const teleX = player.x - Math.cos(pAngle) * backDistance;
          const teleY = player.y - Math.sin(pAngle) * backDistance;

          updateEnemy(enemy.id, { 
            dashState: 'warning', 
            lastDashTime: currentTime,
            dashTargetX: teleX,
            dashTargetY: teleY
          });
        }
      } else if (state === 'warning') {
        // Đứng lại rên rỉ (Telegraphing) - biến mất dần
        targetVx = 0;
        targetVy = 0;
        if (currentTime - lastTeleport > 1000) {
          // Thực hiện dịch chuyển
          const teleX = enemy.dashTargetX || player.x;
          const teleY = enemy.dashTargetY || player.y;

          // Hạt máu tại vị trí cũ
          triggerExplosion(enemy.x, enemy.y, 0, 15, currentTime, '#9f1239');

          updateEnemy(enemy.id, { 
            dashState: 'cooldown', 
            lastDashTime: currentTime,
            x: teleX,
            y: teleY
          });

          // Hạt máu tại vị trí mới
          triggerExplosion(teleX, teleY, 0, 15, currentTime, '#9f1239');
        }
      } else if (state === 'cooldown') {
        // Lao vào cắn xé sau khi dịch chuyển
        targetVx = (dx / dist) * 1.5;
        targetVy = (dy / dist) * 1.5;
        if (currentTime - lastTeleport > 2000) {
          updateEnemy(enemy.id, { dashState: 'chase' });
        }
      }

      // Tấn công cận chiến khi áp sát
      const attackDist = enemy.radius + player.radius + 12;
      if (dist <= attackDist) {
        const lastAttackTime = enemy.lastAttackTime || 0;
        const cooldown = 1000;
        if (currentTime - lastAttackTime >= cooldown) {
          updateEnemy(enemy.id, { lastAttackTime: currentTime });
          let finalEnemyDamage = enemy.damage!;
          if (enemy.missingLimbs?.includes('arm')) {
            finalEnemyDamage = Math.max(1, Math.floor(finalEnemyDamage * 0.5));
          }
          dealDamageToPlayer(finalEnemyDamage * (state === 'cooldown' ? 1.5 : 1), player, currentTime, enemy.element, enemy.x, enemy.y);
        }
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
  function dealDamageToPlayer(damage: number, p: Entity, time: number, element?: 'fire' | 'ice' | 'poison', sourceX?: number, sourceY?: number) {
    if (isPlayerRolling) return; // Đang lộn nhào né -> vô địch

    updatePlayer(prev => {
      let finalDmg = damage;
      const shield = prev.shield || 0;
      const hp = prev.hp;

      let nextShield = shield;
      let nextHp = hp;

      if (shield > 0) {
        // Knight: Khiên phản đòn
        if (prev.id === 'knight' && sourceX !== undefined && sourceY !== undefined) {
          const dx = sourceX - prev.x;
          const dy = sourceY - prev.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            useEntityStore.getState().addProjectile({
              id: `knight_reflect_${Date.now()}`,
              owner: 'player',
              x: prev.x, y: prev.y,
              vx: (dx / len) * 8, vy: (dy / len) * 8,
              radius: 6, damage: 15, color: '#facc15', lifespan: 500,
              createdAt: performance.now()
            });
          }
        }

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

      // Trừ Sanity khi bị sát thương
      const currentSanity = prev.sanity ?? 100;
      const nextSanity = Math.max(0, currentSanity - 5);

      return {
        ...prev,
        hp: nextHp,
        shield: nextShield,
        sanity: nextSanity,
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

    // Tính hướng va chạm (nếu có sourceX, sourceY)
    let hitDx = 0;
    let hitDy = 0;
    if (sourceX !== undefined && sourceY !== undefined) {
      const angle = Math.atan2(p.y - sourceY, p.x - sourceX);
      hitDx = Math.cos(angle);
      hitDy = Math.sin(angle);
    }

    // Rung màn hình có hướng
    setCameraShake(damage * 2.5, hitDx, hitDy);

    // Hạt đỏ tóe ra (máu văng theo hướng va chạm)
    for (let k = 0; k < 8; k++) {
      const randAngle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      let vx = Math.cos(randAngle) * speed;
      let vy = Math.sin(randAngle) * speed;
      
      // Máu xịt mạnh về phía bị đẩy
      if (hitDx !== 0 || hitDy !== 0) {
        vx += hitDx * 5;
        vy += hitDy * 5;
      }

      addParticle({
        id: `player_blood_${Date.now()}_${k}`,
        x: p.x,
        y: p.y,
        vx: vx,
        vy: vy,
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
  function triggerExplosion(ex: number, ey: number, damage: number, radius: number, time: number, color?: string) {
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
        color: color || colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        createdAt: time,
        lifespan: 400 + Math.random() * 300
      });
    }

    // 1. Kiểm tra sát thương lên Player
    const playerDist = Math.sqrt((player!.x - ex) ** 2 + (player!.y - ey) ** 2);
    if (playerDist <= radius + player!.radius) {
      dealDamageToPlayer(damage, player!, time, undefined, ex, ey);
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
    const isEnraged = boss.hp < boss.maxHp * 0.3;
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
