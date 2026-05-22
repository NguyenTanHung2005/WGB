import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, GATE_WIDTH } from '../store/mapStore';
import type { Projectile } from '../types/interfaces';

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
    healthPickups, removeHealthPickup,
    relicPickups, removeRelicPickup,
    spikeTraps,
    portal, setCameraShake,
    addGoldPickup, addHealthPickup
  } = useEntityStore.getState();

  const { addGold, addScore, setPhase } = useGameStore.getState();
  const { currentRoomId, rooms } = useMapStore.getState();
  const currentRoom = rooms.find(r => r.id === currentRoomId);

  const currentTime = performance.now();

  if (!player || player.hp <= 0) return;

  const isInvincible = player.invincibleUntil && currentTime < player.invincibleUntil;

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
      if (roll < 0.15) {
        // 15% rớt vàng
        addGoldPickup({ id: `gold_${Date.now()}_${Math.random()}`, x, y, radius: 10, amount: 2 + Math.floor(Math.random() * 4) });
      } else if (roll < 0.20) {
        // 5% rớt Máu (thay vì 10% rớt Mana)
        addHealthPickup({ id: `hp_${Date.now()}_${Math.random()}`, x, y, radius: 10, amount: 1 });
      }
    } else {
      // Thùng gỗ
      if (roll < 0.25) {
        // 25% rớt vàng
        addGoldPickup({ id: `gold_${Date.now()}_${Math.random()}`, x, y, radius: 10, amount: 5 + Math.floor(Math.random() * 6) });
      } else if (roll < 0.35) {
        // 10% rớt máu
        addHealthPickup({ id: `hp_${Date.now()}_${Math.random()}`, x, y, radius: 10, amount: 1 });
      }
    }
  };

  // --- XỬ LÝ TỪNG VIÊN ĐẠN (PROJECTILES VA CHẠM) ---
  projectiles.forEach(proj => {
    let hit = false;
    const isPlayerBullet = proj.owner === 'player';

    // 1. Kiểm tra va chạm đạn của Player
    if (isPlayerBullet) {
      // Đạn Player trúng kẻ địch
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= proj.radius + enemy.radius) {
          // Bỏ qua nếu đạn xuyên đã từng trúng mục tiêu này
          if (proj.piercing && proj.piercedEntities?.includes(enemy.id)) continue;
          hit = true;
          
          // Tính toán chí mạng từ Rogue lộn nhào hoặc mặc định
          const isCrit = proj.color === '#f59e0b' && Math.random() < 0.15; // 15% chí mạng ngẫu nhiên
          const finalDmg = isCrit ? Math.floor(proj.damage * 1.5) : proj.damage;
          
          const nextHp = Math.max(0, enemy.hp - finalDmg);
          
          let nextStatusEffects = [...(enemy.statusEffects || [])];
          if (proj.element) {
            const effectName = proj.element === 'fire' ? 'burning' : (proj.element === 'ice' ? 'frozen' : 'poisoned');
            if (!nextStatusEffects.includes(effectName)) {
              nextStatusEffects.push(effectName);
            }
          }
          
          updateEnemy(enemy.id, {
            hp: nextHp,
            hitStopUntil: isCrit ? currentTime + 80 : currentTime + 30,
            statusEffects: nextStatusEffects
          });

          if (nextHp <= 0) {
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

          // Hiệu ứng hạt tóe tia lửa
          for (let k = 0; k < 4; k++) {
            addParticle({
              id: `hit_spark_${Date.now()}_${enemy.id}_${k}`,
              x: proj.x,
              y: proj.y,
              vx: -proj.vx * 0.2 + (Math.random() - 0.5) * 3,
              vy: -proj.vy * 0.2 + (Math.random() - 0.5) * 3,
              radius: 1.5 + Math.random() * 1.5,
              color: proj.color,
              alpha: 0.8,
              decay: 0.06,
              createdAt: currentTime,
              lifespan: 200
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
      // 2. Kiểm tra va chạm đạn của Enemy lên Player
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
        if (proj.radius === 8 && isPlayerBullet) {
          triggerExplosionAt(proj.x, proj.y, 10, 80);
        }
      }
    }

    // 4. Hết hạn lifespan đạn
    if (currentTime - proj.createdAt >= proj.lifespan) {
      hit = true;
      if (proj.radius === 8 && isPlayerBullet) {
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

  // --- VA CHẠM DỊCH CHUYỂN QUA CỔNG PORTAL CHIẾN THẮNG ---
  if (portal && portal.active) {
    const dx = player.x - portal.x;
    const dy = player.y - portal.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= player.radius + portal.radius) {
      // Dịch chuyển thắng game!
      setPhase('victory');
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

            updatePlayer({
              hp: nextHp,
              shield: nextShield,
              knockbackVx: Math.cos(pushAngle) * 8, // Bị văng mạnh khi đạp bẫy
              knockbackVy: Math.sin(pushAngle) * 8,
              hitStopUntil: currentTime + 500, // Immune trong 0.5s sau khi đạp bẫy
              ...({ hitFlashActive: true, hitFlashStart: currentTime } as any)
            });

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
}
