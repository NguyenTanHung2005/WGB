import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, GATE_WIDTH } from '../store/mapStore';
import type { Projectile, Entity } from '../types/interfaces';

export function runCollisionSystem() {
  const { 
    player, updatePlayer, 
    enemies, updateEnemy,
    projectiles, setProjectiles, 
    addParticle,
    addDamageNumber,
    destructibleBarrels, removeDestructibleBarrel,
    explosiveBarrels, removeExplosiveBarrel,
    goldPickups, removeGoldPickup,
    expPickups, removeExpPickup,
    healthPickups, removeHealthPickup,
    relicPickups, removeRelicPickup,
    spikeTraps,
    portal, setCameraShake,
    addGoldPickup, addHealthPickup,
    activeBossInstance
  } = useEntityStore.getState();

  const { addGold, addScore, setPhase } = useGameStore.getState();
  const { currentRoomId, rooms } = useMapStore.getState();
  const currentRoom = rooms.find(r => r.id === currentRoomId);

  const currentTime = performance.now();

  if (!player || player.hp <= 0) return;

  const isRolling = player.skillActiveUntil && currentTime < player.skillActiveUntil && (player as any).isRolling;
  const isInvincible = (player.invincibleUntil && currentTime < player.invincibleUntil) || isRolling;

  // Mảng lưu danh sách đạn còn sống sau tick va chạm
  const activeProjectiles: Projectile[] = [];

  // --- HÀM KÍCH NỔ VỤ NỔ LỚN ---
  const triggerExplosionAt = (ex: number, ey: number, damage: number, radius: number) => {
    setCameraShake(6);
    
    // Hạt nổ rực lửa
    for (let k = 0; k < 20; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      const colors = ['#f97316', '#ef4444', '#f59e0b', '#78716c'];
      addParticle({
        id: `expl_coll_${Date.now()}_${k}_${Math.random()}`,
        x: ex,
        y: ey,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.04,
        createdAt: currentTime,
        lifespan: 500
      });
    }

    // 1. Gây sát thương Player
    const playerDist = Math.sqrt((player.x - ex) ** 2 + (player.y - ey) ** 2);
    if (playerDist <= radius + player.radius) {
      if (!isInvincible) {
        let finalDmg = damage;
        const shield = player.shield || 0;
        const hp = player.hp;
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
            lastHitTime: currentTime,
            hitFlashActive: true,
            hitFlashStart: currentTime
          } as any)
        });

        addDamageNumber({
          id: `player_dmg_expl_${Date.now()}`,
          x: player.x,
          y: player.y - 15,
          value: damage,
          color: shield > 0 ? '#94a3b8' : '#ef4444',
          isCrit: false,
          createdAt: currentTime,
          lifespan: 600
        });
      }
    }

    // 2. Gây sát thương Quái vật
    enemies.forEach(e => {
      if (player.hp <= 0) return;
      const edist = Math.sqrt((e.x - ex) ** 2 + (e.y - ey) ** 2);
      if (edist <= radius + e.radius && edist > 0) {
        const dmgRatio = 1 - (edist / radius);
        const finalDmg = Math.max(1, Math.floor(damage * 1.5 * dmgRatio));
        const nextHp = Math.max(0, e.hp - finalDmg);

        updateEnemy(e.id, {
          hp: nextHp,
          hitStopUntil: currentTime + 50
        });

        if (nextHp <= 0) {
          dropLoot(e.x, e.y, true);
        }

        addDamageNumber({
          id: `expl_dmg_e_${Date.now()}_${e.id}`,
          x: e.x,
          y: e.y - 15,
          value: finalDmg,
          color: '#f97316',
          isCrit: true,
          createdAt: currentTime,
          lifespan: 600
        });
      }
    });

    // 3. Chuỗi nổ thùng gỗ / thùng TNT
    destructibleBarrels.forEach(b => {
      const bdist = Math.sqrt((b.x - ex) ** 2 + (b.y - ey) ** 2);
      if (bdist <= radius + b.radius) {
        removeDestructibleBarrel(b.id);
        dropLoot(b.x, b.y);
      }
    });

    explosiveBarrels.forEach(b => {
      const bdist = Math.sqrt((b.x - ex) ** 2 + (b.y - ey) ** 2);
      if (bdist <= radius + b.radius && bdist > 0) {
        setTimeout(() => {
          const freshExps = useEntityStore.getState().explosiveBarrels;
          if (freshExps.find(x => x.id === b.id)) {
            removeExplosiveBarrel(b.id);
            triggerExplosionAt(b.x, b.y, 10, 100);
          }
        }, 100);
      }
    });
  };

  // --- HÀM RƠI ĐỒ KHI PHÁ THÙNG GỖ HOẶC QUÁI CHẾT ---
  const dropLoot = (x: number, y: number, isEnemy: boolean = false) => {
    const roll = Math.random();
    
    // Tỉ lệ rớt của Quái vật thấp hơn Thùng gỗ
    if (isEnemy) {
      // 100% rớt 1-3 viên kinh nghiệm (EXP)
      const expCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < expCount; i++) {
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        useEntityStore.getState().addExpPickup({ 
          id: `exp_${Date.now()}_${Math.random()}`, 
          x: x + offsetX, 
          y: y + offsetY, 
          z: 0,
          vz: -3 - Math.random() * 4,
          radius: 8, 
          amount: 10 // 10 exp mỗi viên
        });
      }

      if (roll < 0.15) {
        // 15% rớt vàng
        addGoldPickup({ id: `gold_${Date.now()}_${Math.random()}`, x, y, z: 0, vz: -4 - Math.random() * 3, radius: 10, amount: 2 + Math.floor(Math.random() * 4) });
      } else if (roll < 0.20) {
        // 5% rớt Máu (thay vì 10% rớt Mana)
        addHealthPickup({ id: `hp_${Date.now()}_${Math.random()}`, x, y, z: 0, vz: -4 - Math.random() * 3, radius: 10, amount: 1 });
      }
    } else {
      // Thùng gỗ
      if (roll < 0.25) {
        // 25% rớt vàng
        addGoldPickup({ id: `gold_${Date.now()}_${Math.random()}`, x, y, z: 0, vz: -4 - Math.random() * 3, radius: 10, amount: 5 + Math.floor(Math.random() * 6) });
      } else if (roll < 0.35) {
        // 10% rớt máu
        addHealthPickup({ id: `hp_${Date.now()}_${Math.random()}`, x, y, z: 0, vz: -4 - Math.random() * 3, radius: 10, amount: 1 });
      }
    }
  };

  // --- XỬ LÝ TỪNG VIÊN ĐẠN (PROJECTILES VA CHẠM) ---
  projectiles.forEach(proj => {
    let hit = false;
    const isPlayerBullet = proj.owner === 'player';

    // 1. Kiểm tra va chạm đạn của Player
    if (isPlayerBullet) {
      // 1.1 Kiểm tra va chạm đạn của Player trúng Siêu Boss
      if (activeBossInstance && activeBossInstance.hp > 0 && activeBossInstance.state !== 'death') {
        const hb = activeBossInstance.getHitboxes().bodyBox;
        const closestX = Math.max(hb.x, Math.min(proj.x, hb.x + hb.width));
        const closestY = Math.max(hb.y, Math.min(proj.y, hb.y + hb.height));
        const distanceX = proj.x - closestX;
        const distanceY = proj.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        if (distanceSquared < (proj.radius * proj.radius)) {
           if (proj.piercing && proj.piercedEntities?.includes('boss_active')) {
             // do nothing
           } else {
             hit = true;
             const isCrit = proj.isCrit !== undefined ? proj.isCrit : Math.random() < 0.1;
             let finalDmg = isCrit ? Math.floor(proj.damage * 1.5) : proj.damage;
             if (player.relics?.includes('cursed_blood_ring')) {
               finalDmg = Math.floor(finalDmg * 1.5);
             }
             activeBossInstance.takeDamage(finalDmg);
             useGameStore.getState().triggerHitStop(isCrit ? 60 : 30);
             addDamageNumber({
               id: `boss_proj_dmg_${Date.now()}_${Math.random()}`,
               x: proj.x, y: proj.y - 15,
               value: finalDmg,
               color: isCrit ? '#f97316' : '#ffffff',
               isCrit,
               createdAt: currentTime,
               lifespan: 600
             });
             for (let k = 0; k < 6; k++) {
               addParticle({
                 id: `boss_hit_spark_${Date.now()}_${k}`,
                 x: proj.x, y: proj.y,
                 vx: -proj.vx * 0.2 + (Math.random() - 0.5) * 3,
                 vy: -proj.vy * 0.2 + (Math.random() - 0.5) * 3,
                 radius: 2 + Math.random() * 2,
                 color: proj.color,
                 alpha: 0.8, decay: 0.06, createdAt: currentTime, lifespan: 200
               });
             }
             if (proj.piercing) {
               if (!proj.piercedEntities) proj.piercedEntities = [];
               proj.piercedEntities.push('boss_active');
               hit = false;
             }
           }
        }
      }

      if (!hit) {
        // Đạn Player trúng kẻ địch
        for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= proj.radius + enemy.radius) {
          // Bỏ qua nếu đạn xuyên đã từng trúng mục tiêu này
          if (proj.piercing && proj.piercedEntities?.includes(enemy.id)) continue;
          
          // CƠ CHẾ ENEMY DODGE (Né đạn)
          if (enemy.speed >= 3.0 && enemy.type !== 'boss' && Math.random() < 0.15) {
            // Kẻ địch lướt ngang để né đạn
            const dodgeAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
            updateEnemy(enemy.id, { 
              knockbackVx: Math.cos(dodgeAngle) * 15,
              knockbackVy: Math.sin(dodgeAngle) * 15 
            });
            
            addDamageNumber({
              id: `enemy_dodge_${Date.now()}_${enemy.id}`,
              x: enemy.x, y: enemy.y - 20,
              value: 0, text: 'DODGE!', color: '#94a3b8', isCrit: false,
              createdAt: currentTime, lifespan: 600
            });
            continue; // Viên đạn trượt qua
          }

          hit = true;
          
          const prevCombo = player.comboCount || 0;
          updatePlayer({
            comboCount: prevCombo + 1,
            lastComboTime: currentTime
          });
          
          // Sử dụng isCrit truyền từ Projectile (hoặc random 10% nếu chưa có)
          const isCrit = proj.isCrit !== undefined ? proj.isCrit : Math.random() < 0.1;
          let finalDmg = isCrit ? Math.floor(proj.damage * 1.5) : proj.damage;
          
          if (enemy.type === 'boss' || isCrit) {
             useGameStore.getState().triggerHitStop(isCrit ? 60 : 30); // Đạn có Hit-Stop nhẹ hơn cận chiến
          }
          
          // Cursed Blood Ring: Tăng 50% sát thương
          const hasCursedRing = player.relics?.includes('cursed_blood_ring');
          if (hasCursedRing) {
            finalDmg = Math.floor(finalDmg * 1.5);
          }
          
          const nextHp = Math.max(0, enemy.hp - finalDmg);
          
          let nextStatusEffects = [...(enemy.statusEffects || [])];
          if (proj.element) {
            const effectName = proj.element === 'fire' ? 'burning' : (proj.element === 'ice' ? 'frozen' : 'poisoned');
            if (!nextStatusEffects.includes(effectName)) {
              nextStatusEffects.push(effectName);
            }
          }
          
          const updateData: Partial<Entity> = {
            hp: nextHp,
            hitStopUntil: isCrit ? currentTime + 80 : currentTime + 30,
            statusEffects: nextStatusEffects
          };

          // Vật lý đẩy lùi (Knockback) khi trúng đạn
          if (enemy.type !== 'boss') {
            const projAngle = Math.atan2(proj.vy, proj.vx);
            const knockbackAmount = isCrit ? 10 : 5;
            updateData.knockbackVx = Math.cos(projAngle) * knockbackAmount;
            updateData.knockbackVy = Math.sin(projAngle) * knockbackAmount;
          }
          
          // Dismemberment Logic (Cơ chế chặt chém cho đạn)
          let dismembered = false;
          if (nextHp > 0 && enemy.type !== 'boss') {
            const dismemberChance = isCrit ? 0.6 : 0.2; // Sát thương xa khó đứt hơn, nhưng chí mạng thì cao
            if (Math.random() < dismemberChance) {
              const currentLimbs = enemy.missingLimbs || [];
              const possibleLimbs: ('arm' | 'legs')[] = ['arm', 'legs'].filter(l => !currentLimbs.includes(l as any)) as ('arm' | 'legs')[];
              if (possibleLimbs.length > 0) {
                const limbToLose = possibleLimbs[Math.floor(Math.random() * possibleLimbs.length)];
                updateData.missingLimbs = [...currentLimbs, limbToLose];
                dismembered = true;
                
                addDamageNumber({
                  id: `dismember_${Date.now()}_${enemy.id}`,
                  x: enemy.x,
                  y: enemy.y - 35,
                  value: 0,
                  text: limbToLose === 'arm' ? 'LOST ARM!' : 'LOST LEGS!',
                  color: '#991b1b', // Đỏ máu đậm
                  isCrit: true,
                  createdAt: currentTime,
                  lifespan: 1000
                });
              }
            }
          }

          updateEnemy(enemy.id, updateData);

          if (hasCursedRing) {
            const nextP_HP = Math.max(1, player.hp - 1);
            const nextP_San = Math.max(0, (player.sanity ?? 100) - 2);
            updatePlayer({ hp: nextP_HP, sanity: nextP_San });
            
            for(let p_blood = 0; p_blood < 5; p_blood++) {
              addParticle({
                id: `cursed_blood_shoot_${Date.now()}_${p_blood}_${Math.random()}`,
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 2,
                color: '#991b1b',
                alpha: 0.9,
                decay: 0.05,
                createdAt: currentTime,
                lifespan: 300
              });
            }
          }

          const { currentRoomId, addBloodDecal } = useMapStore.getState();

          if (nextHp <= 0) {
            if (currentRoomId) {
              // --- KẾT LIỄU TÀN KHỐC (Execution Blood Explosion) ---
              if (isCrit || finalDmg >= enemy.maxHp * 0.5) {
                setCameraShake(6);
                for (let k = 0; k < 20; k++) {
                  addParticle({
                    id: `execution_blood_proj_${Date.now()}_${k}_${Math.random()}`,
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 12,
                    vy: (Math.random() - 0.5) * 12,
                    radius: 2 + Math.random() * 5,
                    color: enemy.element === 'poison' ? '#bef264' : '#ef4444',
                    alpha: 1.0,
                    decay: 0.04,
                    createdAt: currentTime,
                    lifespan: 800
                  });
                }
                for (let k = 0; k < 3; k++) {
                  addParticle({
                    id: `execution_flesh_proj_${Date.now()}_${k}_${Math.random()}`,
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    radius: 6 + Math.random() * 4,
                    color: '#7f1d1d',
                    alpha: 1.0,
                    decay: 0.02,
                    type: 'limb_piece',
                    createdAt: currentTime,
                    lifespan: 2000
                  });
                }
              }

              addBloodDecal(currentRoomId, {
                x: enemy.x,
                y: enemy.y,
                radius: (isCrit || finalDmg >= enemy.maxHp * 0.5) ? 50 + Math.random() * 30 : 30 + Math.random() * 20,
                alpha: 0.9,
                type: 'puddle'
              });
            }
            dropLoot(enemy.x, enemy.y, true);
            // Buff Relic: Vampire Tooth (5% hồi 1 HP khi giết địch)
            if (player.relics?.includes('vampire_tooth') && Math.random() < 0.05) {
              updatePlayer({ hp: Math.min(player.maxHp, player.hp + 1) });
              addDamageNumber({
                id: `vampire_heal_${Date.now()}_${Math.random()}`,
                x: player.x,
                y: player.y - 20,
                value: 1,
                color: '#22c55e', // Xanh lá hồi máu
                isCrit: false,
                createdAt: currentTime,
                lifespan: 800
              });
            }
          }

          // Hiển thị sát thương
          addDamageNumber({
            id: `bullet_dmg_${Date.now()}_${enemy.id}_${Math.random()}`,
            x: enemy.x,
            y: enemy.y - 15,
            value: finalDmg,
            color: isCrit ? '#f97316' : '#ffffff',
            isCrit,
            createdAt: currentTime,
            lifespan: 600
          });

          // Hiệu ứng hạt tóe tia lửa / hạt máu nếu đứt chi
          const sparkCount = dismembered ? 12 : 4;
          for (let k = 0; k < sparkCount; k++) {
            addParticle({
              id: `hit_spark_${Date.now()}_${enemy.id}_${k}`,
              x: proj.x,
              y: proj.y,
              vx: -proj.vx * 0.2 + (Math.random() - 0.5) * 3,
              vy: -proj.vy * 0.2 + (Math.random() - 0.5) * 3,
              radius: 1.5 + Math.random() * 1.5,
              color: dismembered ? '#ef4444' : proj.color,
              alpha: 0.8,
              decay: 0.06,
              createdAt: currentTime,
              lifespan: 200
            });
          }
          
          if (currentRoomId && dismembered) {
            addBloodDecal(currentRoomId, {
              x: enemy.x,
              y: enemy.y,
              radius: 20 + Math.random() * 15,
              alpha: 0.8,
              type: 'puddle'
            });
          } else if (currentRoomId && Math.random() < 0.4) {
            addBloodDecal(currentRoomId, {
              x: enemy.x + (Math.random() - 0.5) * 20,
              y: enemy.y + (Math.random() - 0.5) * 20,
              radius: 8 + Math.random() * 8,
              alpha: 0.6 + Math.random() * 0.3,
              type: 'splatter'
            });
          }

          // Cầu lửa phát nổ diện rộng nếu là trượng phép (Magic Staff)
          if (proj.radius === 8) {
            triggerExplosionAt(proj.x, proj.y, 10, 80);
          }
          
          if (proj.piercing) {
            // Không break, tiếp tục bay xuyên qua, và thêm quái vào danh sách đã trúng
            if (!proj.piercedEntities) proj.piercedEntities = [];
            proj.piercedEntities.push(enemy.id);
            hit = false; // Vẫn tính là chưa hit (không xóa đạn)
          } else {
            break;
          }
        }
      }
      } // Đóng if (!hit)

      if (!hit) {
        // Đạn Player trúng thùng gỗ
        for (const b of destructibleBarrels) {
          const dist = Math.sqrt((proj.x - b.x) ** 2 + (proj.y - b.y) ** 2);
          if (dist <= proj.radius + b.radius) {
            // Nếu đạn xuyên thủng, không phá hủy thùng gỗ và không bị chặn
            if (proj.piercing) continue;

            hit = true;
            removeDestructibleBarrel(b.id);
            dropLoot(b.x, b.y);

            // Bụi gỗ tung ra
            for (let k = 0; k < 6; k++) {
              addParticle({
                id: `wood_${Date.now()}_${b.id}_${k}`,
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 2 + Math.random() * 3,
                color: '#78350f', // Màu nâu gỗ
                alpha: 0.9,
                decay: 0.05,
                createdAt: currentTime,
                lifespan: 250
              });
            }
            if (proj.radius === 8) {
              triggerExplosionAt(proj.x, proj.y, 10, 80);
            }
            break;
          }
        }
      }

      if (!hit) {
        // Đạn Player trúng thùng thuốc nổ
        for (const b of explosiveBarrels) {
          const dist = Math.sqrt((proj.x - b.x) ** 2 + (proj.y - b.y) ** 2);
          if (dist <= proj.radius + b.radius) {
            hit = true;
            
            const nextHp = Math.max(0, b.hp - proj.damage);
            if (nextHp <= 0) {
              removeExplosiveBarrel(b.id);
              triggerExplosionAt(b.x, b.y, 15, 100);
            } else {
              updateEnemy(b.id, { hp: nextHp } as any); // Thùng thuốc nổ giảm máu
              // Chớp đỏ nhẹ khi bị bắn trúng
            }
            break;
          }
        }
      }
    } 
    else {
      // 2.1 Kiểm tra đạn Enemy trúng Enemy khác (Enemy Infighting)
      if (!hit) {
        for (const enemy of enemies) {
          if (enemy.hp <= 0) continue;
          const dx = proj.x - enemy.x;
          const dy = proj.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Phải tránh đạn vừa sinh ra đã trúng ngay kẻ bắn (cần sống > 150ms)
          if (dist <= proj.radius + enemy.radius && currentTime - proj.createdAt > 150) {
            hit = true;
            const nextHp = Math.max(0, enemy.hp - proj.damage);
            updateEnemy(enemy.id, { hp: nextHp });
            
            // Tóe hạt máu
            for (let k = 0; k < 4; k++) {
              addParticle({
                id: `infight_blood_${Date.now()}_${k}_${Math.random()}`,
                x: proj.x, y: proj.y,
                vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                radius: 2, color: '#ef4444', alpha: 0.9, decay: 0.05,
                createdAt: currentTime, lifespan: 200
              });
            }
            break;
          }
        }
      }

      if (!hit) {
        // 2.2 Kiểm tra va chạm đạn của Enemy lên Player
      const dx = proj.x - player.x;
      const dy = proj.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= proj.radius + player.radius) {
        hit = true;
        
        if (!isInvincible) {
          const pushAngle = Math.atan2(player.y - proj.y, player.x - proj.x);
          updatePlayer(prev => {
            let finalDmg = proj.damage;
            const shield = prev.shield || 0;
            const hp = prev.hp;
            let nextShield = shield;
            let nextHp = hp;
            
            if (shield > 0) {
              // Knight: Khiên phản đòn
              if (prev.id === 'knight') {
                const len = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
                if (len > 0) {
                  useEntityStore.getState().addProjectile({
                    id: `knight_reflect_proj_${Date.now()}`,
                    owner: 'player',
                    x: prev.x, y: prev.y,
                    vx: -(proj.vx / len) * 8, vy: -(proj.vy / len) * 8, // Phản ngược hướng đạn bay
                    radius: 6, damage: 15, color: '#facc15', lifespan: 500,
                    createdAt: currentTime
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
            if (proj.element) {
              const effectName = proj.element === 'fire' ? 'burning' : (proj.element === 'ice' ? 'frozen' : 'poisoned');
              if (!nextStatusEffects.includes(effectName)) {
                nextStatusEffects.push(effectName);
              }
            }

            return {
              ...prev,
              hp: nextHp,
              shield: nextShield,
              knockbackVx: Math.cos(pushAngle) * 6,
              knockbackVy: Math.sin(pushAngle) * 6,
              hitStopUntil: currentTime + 50,
              lastHitTime: currentTime,
              hitFlashActive: true,
              hitFlashStart: currentTime,
              statusEffects: nextStatusEffects
            };
          });

          // Hiển thị sát thương
          addDamageNumber({
            id: `player_hit_${Date.now()}`,
            x: player.x,
            y: player.y - 15,
            value: proj.damage,
            color: (player.shield || 0) > 0 ? '#94a3b8' : '#ef4444',
            isCrit: false,
            createdAt: currentTime,
            lifespan: 600
          });

          setCameraShake(proj.damage * 2.5);

          // Tóe hạt máu
          for (let k = 0; k < 6; k++) {
            addParticle({
              id: `p_blood_${Date.now()}_${k}`,
              x: player.x,
              y: player.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: 2,
              color: '#f87171',
              alpha: 0.9,
              decay: 0.05,
              createdAt: currentTime,
              lifespan: 200
            });
          }
        }
      }
    }
    } // Đóng else (đạn Enemy)

    // 2.5. Va chạm đạn với Cột đá (Pillars)
    if (!hit && currentRoom?.pillars) {
      for (const pillar of currentRoom.pillars) {
        const dist = Math.sqrt((proj.x - pillar.x) ** 2 + (proj.y - pillar.y) ** 2);
        if (dist <= proj.radius + pillar.radius) {
          hit = true;
          // Hiệu ứng hạt bụi đá bay ra
          for (let k = 0; k < 4; k++) {
            addParticle({
              id: `pillar_spark_${Date.now()}_${Math.random()}`,
              x: proj.x,
              y: proj.y,
              vx: -proj.vx * 0.2 + (Math.random() - 0.5) * 3,
              vy: -proj.vy * 0.2 + (Math.random() - 0.5) * 3,
              radius: 1.5 + Math.random(),
              color: '#475569', // Xám đá
              alpha: 0.8,
              decay: 0.05,
              createdAt: currentTime,
              lifespan: 200
            });
          }
          if (proj.isExplosive) {
            const explodeDmg = proj.radius > 10 ? 50 : 10;
            const explodeRad = proj.radius > 10 ? 150 : 80;
            triggerExplosionAt(proj.x, proj.y, explodeDmg, explodeRad);
          } else if (proj.radius === 8 && isPlayerBullet) {
            triggerExplosionAt(proj.x, proj.y, 10, 80);
          }
          break;
        }
      }
    }

    // 3. Va chạm đạn với Tường
    const isInsideWalls = 
      proj.x >= WALL_THICKNESS && 
      proj.x <= ROOM_WIDTH - WALL_THICKNESS && 
      proj.y >= WALL_THICKNESS && 
      proj.y <= ROOM_HEIGHT - WALL_THICKNESS;

    if (!isInsideWalls && !hit) {
      // Cho phép đạn bay xuyên cửa nếu cửa đang mở (cửa không bị khoá)
      const gateMin = ROOM_WIDTH / 2 - GATE_WIDTH / 2;
      const gateMax = ROOM_WIDTH / 2 + GATE_WIDTH / 2;
      const gateMinY = ROOM_HEIGHT / 2 - GATE_WIDTH / 2;
      const gateMaxY = ROOM_HEIGHT / 2 + GATE_WIDTH / 2;

      const isLocked = currentRoom?.state === 'combat_lock';
      
      const passingNorth = !isLocked && currentRoom?.gates.north && proj.x >= gateMin && proj.x <= gateMax && proj.y < WALL_THICKNESS;
      const passingSouth = !isLocked && currentRoom?.gates.south && proj.x >= gateMin && proj.x <= gateMax && proj.y > ROOM_HEIGHT - WALL_THICKNESS;
      const passingWest = !isLocked && currentRoom?.gates.west && proj.y >= gateMinY && proj.y <= gateMaxY && proj.x < WALL_THICKNESS;
      const passingEast = !isLocked && currentRoom?.gates.east && proj.y >= gateMinY && proj.y <= gateMaxY && proj.x > ROOM_WIDTH - WALL_THICKNESS;

      if (!passingNorth && !passingSouth && !passingWest && !passingEast) {
        hit = true; // Va chạm tường cứng
        
        // Tóe hạt nổ tường nhỏ
        for (let k = 0; k < 3; k++) {
          addParticle({
            id: `wall_spark_${Date.now()}_${Math.random()}`,
            x: proj.x,
            y: proj.y,
            vx: -proj.vx * 0.2 + (Math.random() - 0.5) * 2,
            vy: -proj.vy * 0.2 + (Math.random() - 0.5) * 2,
            radius: 1.5,
            color: '#78716c', // Màu xám đá tường
            alpha: 0.7,
            decay: 0.07,
            createdAt: currentTime,
            lifespan: 150
          });
        }
        if (proj.isExplosive) {
          const explodeDmg = proj.radius > 10 ? 50 : 10;
          const explodeRad = proj.radius > 10 ? 150 : 80;
          triggerExplosionAt(proj.x, proj.y, explodeDmg, explodeRad);
        } else if (proj.radius === 8 && isPlayerBullet) {
          triggerExplosionAt(proj.x, proj.y, 10, 80);
        }
      }
    }

    // 4. Hết hạn lifespan đạn
    if (currentTime - proj.createdAt >= proj.lifespan) {
      hit = true;
      if (proj.isExplosive) {
        const explodeDmg = proj.radius > 10 ? 50 : 10;
        const explodeRad = proj.radius > 10 ? 150 : 80;
        triggerExplosionAt(proj.x, proj.y, explodeDmg, explodeRad);
      } else if (proj.radius === 8 && isPlayerBullet) {
        triggerExplosionAt(proj.x, proj.y, 10, 80);
      }
    }

    // Giữ lại đạn chưa va chạm
    if (!hit) {
      activeProjectiles.push(proj);
    }
  });

  setProjectiles(activeProjectiles);

  // --- XỬ LÝ NHẶT VÀNG & MANA & MÁU (VÀ NAM CHÂM) ---
  const MAGNET_RADIUS = 150;
  const MAGNET_SPEED = 4;

  // --- EXP PICKUPS ---
  expPickups.forEach(exp => {
    const dx = player.x - exp.x;
    const dy = player.y - exp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= MAGNET_RADIUS && dist > player.radius + exp.radius) {
      exp.x += (dx / dist) * MAGNET_SPEED;
      exp.y += (dy / dist) * MAGNET_SPEED;
    }

    if (dist <= player.radius + exp.radius) {
      // Nhặt exp
      const prevExp = player.exp || 0;
      let nextExp = prevExp + exp.amount;
      let currentLevel = player.level || 1;
      let expToNext = 100 * Math.pow(1.5, currentLevel - 1);
      
      let leveledUp = false;
      while (nextExp >= expToNext) {
        nextExp -= expToNext;
        currentLevel++;
        expToNext = 100 * Math.pow(1.5, currentLevel - 1);
        leveledUp = true;
      }

      updatePlayer({ exp: nextExp, level: currentLevel });
      
      if (leveledUp) {
        useGameStore.getState().setPhase('level_up');
        // Hồi 1 máu khi lên cấp
        updatePlayer({ hp: Math.min(player.maxHp, player.hp + 1) });
      }

      removeExpPickup(exp.id);

      // Hạt nhặt EXP màu xanh ngọc
      for (let k = 0; k < 5; k++) {
        addParticle({
          id: `exp_spark_${exp.id}_${k}`,
          x: exp.x,
          y: exp.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: 2,
          color: '#2dd4bf', // Teal/Cyan
          alpha: 1.0,
          decay: 0.05,
          createdAt: currentTime,
          lifespan: 300
        });
      }
    }
  });

  goldPickups.forEach(gold => {
    const dx = player.x - gold.x;
    const dy = player.y - gold.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Hút nam châm
    if (dist <= MAGNET_RADIUS && dist > player.radius + gold.radius) {
      gold.x += (dx / dist) * MAGNET_SPEED;
      gold.y += (dy / dist) * MAGNET_SPEED;
    }

    if (dist <= player.radius + gold.radius) {
      addGold(gold.amount);
      addScore(gold.amount * 10);
      removeGoldPickup(gold.id);
      
      // Hạt nhặt vàng sáng lấp lánh
      for (let k = 0; k < 5; k++) {
        addParticle({
          id: `gold_spark_${gold.id}_${k}`,
          x: gold.x,
          y: gold.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          radius: 2,
          color: '#fbbf24',
          alpha: 1.0,
          decay: 0.08,
          createdAt: currentTime,
          lifespan: 200
        });
      }
    }
  });

  relicPickups.forEach(item => {
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Relic hút nam châm
    if (dist <= MAGNET_RADIUS && dist > player.radius + item.radius) {
      item.x += (dx / dist) * MAGNET_SPEED;
      item.y += (dy / dist) * MAGNET_SPEED;
    }

    if (dist <= player.radius + item.radius) {
      // Nhặt Relic
      const currentRelics = player.relics || [];
      if (!currentRelics.includes(item.relicId)) {
        updatePlayer({ relics: [...currentRelics, item.relicId] });
      }

      removeRelicPickup(item.id);
      
      // Hiện thông báo Text bay lên
      addDamageNumber({
        id: `relic_buff_${item.id}_${currentTime}`,
        x: player.x,
        y: player.y - 30,
        value: 0,
        text: `+ ${item.relicId.replace('_', ' ').toUpperCase()}`,
        isCrit: false,
        color: '#f472b6', // Màu hồng cho Relic
        alpha: 1.0,
        createdAt: currentTime,
        lifespan: 1500
      });

      // Bắn particle lấp lánh khi nhặt Relic
      for (let k = 0; k < 15; k++) {
        addParticle({
          id: `relic_spark_${currentTime}_${k}`,
          x: player.x,
          y: player.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          radius: 2 + Math.random() * 2,
          color: '#f472b6',
          alpha: 1.0,
          decay: 0.05,
          createdAt: currentTime,
          lifespan: 400
        });
      }
    }
  });

  healthPickups.forEach(hp => {
    const dx = player.x - hp.x;
    const dy = player.y - hp.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const currentHp = player.hp;
    const maxHp = player.maxHp;

    // Hút nam châm (chỉ hút nếu chưa đầy máu để tránh lãng phí)
    if (currentHp < maxHp && dist <= MAGNET_RADIUS && dist > player.radius + hp.radius) {
      hp.x += (dx / dist) * MAGNET_SPEED;
      hp.y += (dy / dist) * MAGNET_SPEED;
    }

    if (dist <= player.radius + hp.radius) {
      // Chỉ nhặt máu nếu chưa đầy máu
      if (currentHp < maxHp) {
        updatePlayer(prev => ({
          ...prev,
          hp: Math.min(prev.maxHp, prev.hp + hp.amount)
        }));
        removeHealthPickup(hp.id);
        
        // Hạt nhặt máu đỏ lấp lánh
        for (let k = 0; k < 6; k++) {
          addParticle({
            id: `hp_spark_${hp.id}_${k}`,
            x: hp.x,
            y: hp.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            radius: 2.5,
            color: '#ef4444',
            alpha: 1.0,
            decay: 0.06,
            createdAt: currentTime,
            lifespan: 300
          });
        }
        
        addDamageNumber({
          id: `heal_${Date.now()}_${hp.id}`,
          x: player.x,
          y: player.y - 20,
          value: hp.amount,
          color: '#22c55e', // Màu xanh lá cây hồi máu
          isCrit: false,
          createdAt: currentTime,
          lifespan: 800
        });
      }
    }
  });

  // --- VA CHẠM DỊCH CHUYỂN QUA CỔNG PORTAL CHIẾN THẮNG/CHUYỂN TẦNG ---
  if (portal && portal.active) {
    const dx = player.x - portal.x;
    const dy = player.y - portal.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= player.radius + portal.radius) {
      // Dịch chuyển thắng game hoặc qua tầng
      const currentFloor = useGameStore.getState().currentFloor;
      if (currentFloor < 5) {
        setPhase('next_floor');
      } else {
        setPhase('victory');
      }
    }
  }
  // --- KIỂM TRA VA CHẠM VỚI BẪY GAI (SPIKE TRAPS) ---
  if (!isInvincible) {
    spikeTraps.forEach(trap => {
      if (trap.active) {
        const dx = player.x - trap.x;
        const dy = player.y - trap.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Coi như vùng an toàn sát viền bẫy để tránh phạt quá gắt
        if (dist < player.radius + trap.radius * 0.7) {
          // Chỉ bị sát thương nếu vừa hết hitStop
          const isHitStopped = player.hitStopUntil && currentTime < player.hitStopUntil;
          if (!isHitStopped) {
            const pushAngle = Math.atan2(dy, dx);
            let nextHp = player.hp;
            let nextShield = player.shield || 0;
            let finalDmg = trap.damage;
            
            if (nextShield > 0) {
              if (nextShield >= finalDmg) {
                nextShield -= finalDmg;
                finalDmg = 0;
              } else {
                finalDmg -= nextShield;
                nextShield = 0;
              }
            }
            if (finalDmg > 0) {
              nextHp = Math.max(0, nextHp - finalDmg);
            }

            let nextStatusEffects = [...(player.statusEffects || [])];
            if (trap.variant === 'poison' && !nextStatusEffects.includes('poisoned')) nextStatusEffects.push('poisoned');
            if (trap.variant === 'lava' && !nextStatusEffects.includes('burning')) nextStatusEffects.push('burning');

            updatePlayer({
              hp: nextHp,
              shield: nextShield,
              knockbackVx: Math.cos(pushAngle) * 8, // Bị văng mạnh khi đạp bẫy
              knockbackVy: Math.sin(pushAngle) * 8,
              hitStopUntil: currentTime + 500, // Immune trong 0.5s sau khi đạp bẫy
              statusEffects: nextStatusEffects,
              ...({ hitFlashActive: true, hitFlashStart: currentTime } as any)
            });

            // Camera rung mạnh hơn nếu dẫm nham thạch
            setCameraShake(trap.variant === 'lava' ? 5 : 3, Math.cos(pushAngle), Math.sin(pushAngle));

            addDamageNumber({
              id: `trap_hit_${Date.now()}`,
              x: player.x,
              y: player.y - 15,
              value: trap.damage,
              color: '#ef4444',
              isCrit: false,
              createdAt: currentTime,
              lifespan: 600
            });
            setCameraShake(4);
            
            for (let k = 0; k < 5; k++) {
              addParticle({
                id: `trap_blood_${Date.now()}_${k}`,
                x: player.x,
                y: player.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 2,
                color: '#ef4444',
                alpha: 0.9,
                decay: 0.05,
                createdAt: currentTime,
                lifespan: 200
              });
            }
          }
        }
      }
    });
  }

  // --- VA CHẠM CỦA NGƯỜI CHƠI VỚI BOSS LỚN ---
  if (activeBossInstance && activeBossInstance.hp > 0 && activeBossInstance.state !== 'death') {
    const hb = activeBossInstance.getHitboxes().bodyBox;
    const closestX = Math.max(hb.x, Math.min(player.x, hb.x + hb.width));
    const closestY = Math.max(hb.y, Math.min(player.y, hb.y + hb.height));
    const distanceX = player.x - closestX;
    const distanceY = player.y - closestY;
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

    if (distanceSquared < (player.radius * player.radius)) {
      const isInvincible = player.hitStopUntil && currentTime < player.hitStopUntil;
      if (!isInvincible) {
        const finalDmg = activeBossInstance.damage || 50;
        let shield = player.shield || 0;
        let hp = player.hp;
        let nextShield = shield;
        let nextHp = hp;
        let realDmg = finalDmg;

        if (shield > 0) {
          if (shield >= realDmg) {
            nextShield = shield - realDmg;
            realDmg = 0;
          } else {
            realDmg -= shield;
            nextShield = 0;
          }
        }
        if (realDmg > 0) {
          nextHp = Math.max(0, hp - realDmg);
        }

        const pushAngle = Math.atan2(player.y - (hb.y + hb.height/2), player.x - (hb.x + hb.width/2));
        updatePlayer({
          hp: nextHp,
          shield: nextShield,
          knockbackVx: Math.cos(pushAngle) * 15,
          knockbackVy: Math.sin(pushAngle) * 15,
          hitStopUntil: currentTime + 500,
          lastHitTime: currentTime,
          ...({ hitFlashActive: true, hitFlashStart: currentTime } as any)
        });

        addDamageNumber({
          id: `player_boss_hit_${Date.now()}`,
          x: player.x,
          y: player.y - 15,
          value: finalDmg,
          color: shield > 0 ? '#94a3b8' : '#ef4444',
          isCrit: false,
          createdAt: currentTime,
          lifespan: 600
        });
        setCameraShake(15);
      }
    }
  }

}
