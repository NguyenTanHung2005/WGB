import { useEntityStore } from '../store/entityStore';
import { useGameStore } from '../store/gameStore';
import { useMapStore } from '../store/mapStore';
import type { Entity } from '../types/interfaces';
import { CHARACTER_CLASSES } from '../data/classes';

export function runCombatSystem(_delta: number) {
  const { player, updatePlayer, enemies, updateEnemy, addDamageNumber, addParticle, activeBossInstance } = useEntityStore.getState();
  const currentTime = performance.now();

  if (!player) return;

  // --- 1. HỒI PHỤC GIÁP (SHIELD REGENERATION) ---
  const lastHitTime = (player as any).lastHitTime || 0;
  const maxShield = player.maxShield || 0;
  const currentShield = player.shield || 0;

  if (currentShield < maxShield && currentTime - lastHitTime >= 6000) {
    // Mỗi 3 giây (3000ms) hồi 1 giáp (Hardcore Dark Fantasy)
    const lastShieldRegenTime = (player as any).lastShieldRegenTime || 0;
    if (currentTime - lastShieldRegenTime >= 3000) {
      updatePlayer({
        shield: Math.min(maxShield, currentShield + 1),
        ...({ lastShieldRegenTime: currentTime } as any)
      });
    }
  }

  // --- 1.5. HỒI PHỤC MANA (SANITY) ---
  if (player.sanity !== undefined && player.maxSanity !== undefined && player.sanity < player.maxSanity) {
    const lastMpRegenTime = (player as any).lastMpRegenTime || 0;
    if (currentTime - lastMpRegenTime >= 100) { // Hồi 10 MP mỗi giây
      updatePlayer({
        sanity: Math.min(player.maxSanity, player.sanity + 1),
        ...({ lastMpRegenTime: currentTime } as any)
      });
    }
  }

  // --- COMBO DECAY ---
  if (player.comboCount && player.comboCount > 0) {
    const lastCombo = player.lastComboTime || 0;
    if (currentTime - lastCombo > 2000) { // 2 giây không đánh trúng -> mất combo
      updatePlayer({ comboCount: 0 });
    }
  }

  // --- 2. CẬP NHẬT TRẠNG THÁI SKILL HẾT HIỆU LỰC ---
  if (player.skillActiveUntil && currentTime >= player.skillActiveUntil) {
    updatePlayer({
      skillActiveUntil: undefined,
      ...({ isWhirlwind: false, isRolling: false } as any)
    });
  }

  // --- QUẢN LÝ ANIMATION STATE TẤN CÔNG ---
  if (player.animState === 'attack') {
     const lastAttackTime = player.lastAttackTime || 0;
     const weapons = player.weapons || [];
     const activeIdx = player.activeWeaponIndex || 0;
     const weapon = weapons[activeIdx];
     const attackAnimDuration = weapon ? Math.min(200, weapon.fireRate) : 200;
     if (currentTime - lastAttackTime >= attackAnimDuration) {
        const nextState = (player.vx !== 0 || player.vy !== 0) ? 'walk' : 'idle';
        updatePlayer({ animState: nextState });
     }
  }

  // --- 3. ĐIỀU KHIỂN CÁC HIỆU ỨNG TRẠNG THÁI (STATUS EFFECTS) CỦA KẺ ĐỊCH ---
  enemies.forEach(enemy => {
    // Nếu quái bị choáng (stunned) hoặc bị thiêu đốt (burning), ta cập nhật ở đây
    if (enemy.statusEffects.includes('stunned')) {
      const stunUntil = (enemy as any).stunUntil || 0;
      if (currentTime >= stunUntil) {
        updateEnemy(enemy.id, {
          statusEffects: enemy.statusEffects.filter(eff => eff !== 'stunned')
        });
      }
    }
  });

  // --- 4. KỸ NĂNG BERSERKER (WHIRLWIND) ---
  if ((player as any).isWhirlwind && player.skillActiveUntil && currentTime < player.skillActiveUntil) {
    const lastWhirlwindTick = (player as any).lastWhirlwindTick || 0;
    if (currentTime - lastWhirlwindTick >= 150) { // Mỗi 150ms gây sát thương
      updatePlayer({ ...({ lastWhirlwindTick: currentTime } as any) });
      
      const wwRadius = player.radius + 40; // Phạm vi xoay kiếm

      enemies.forEach(e => {
        if (e.hp <= 0) return;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= wwRadius + e.radius) {
          const wwDmg = 8;
          const nextHp = Math.max(0, e.hp - wwDmg);
          const pushAngle = Math.atan2(dy, dx);
          
          updateEnemy(e.id, {
            hp: nextHp,
            knockbackVx: Math.cos(pushAngle) * 5,
            knockbackVy: Math.sin(pushAngle) * 5
          });

          const prevCombo = player.comboCount || 0;
          updatePlayer({
            comboCount: prevCombo + 1,
            lastComboTime: currentTime
          });

          addDamageNumber({
            id: `ww_dmg_${Date.now()}_${e.id}_${Math.random()}`,
            x: e.x,
            y: e.y - 15,
            value: wwDmg,
            color: '#ef4444',
            isCrit: true,
            createdAt: currentTime,
            lifespan: 500
          });

          // Tia máu
          for (let k = 0; k < 3; k++) {
            addParticle({
              id: `ww_blood_${Date.now()}_${e.id}_${k}`,
              x: e.x,
              y: e.y,
              vx: Math.cos(pushAngle) * 3 + (Math.random() - 0.5) * 2,
              vy: Math.sin(pushAngle) * 3 + (Math.random() - 0.5) * 2,
              radius: 2,
              color: '#dc2626',
              alpha: 0.8,
              decay: 0.05,
              createdAt: currentTime,
              lifespan: 200
            });
          }
        }
      });

      // Tạo vết chém xoáy tròn (Visual effect) xung quanh player
      for (let k = 0; k < 5; k++) {
        const randAngle = Math.random() * Math.PI * 2;
        const distFromCenter = Math.random() * wwRadius;
        addParticle({
          id: `ww_slash_${Date.now()}_${k}`,
          x: player.x + Math.cos(randAngle) * distFromCenter,
          y: player.y + Math.sin(randAngle) * distFromCenter,
          vx: Math.cos(randAngle + Math.PI / 2) * 2, // Vận tốc xoay tròn
          vy: Math.sin(randAngle + Math.PI / 2) * 2,
          radius: 3 + Math.random() * 2,
          color: '#f87171',
          alpha: 0.7,
          decay: 0.1,
          createdAt: currentTime,
          lifespan: 150
        });
      }

      // --- Sát thương Whirlwind cho Boss ---
      if (activeBossInstance && activeBossInstance.hp > 0 && activeBossInstance.state !== 'death') {
        const hb = activeBossInstance.getHitboxes().bodyBox;
        const closestX = Math.max(hb.x, Math.min(player.x, hb.x + hb.width));
        const closestY = Math.max(hb.y, Math.min(player.y, hb.y + hb.height));
        const distanceX = player.x - closestX;
        const distanceY = player.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        if (distanceSquared <= wwRadius * wwRadius) {
           activeBossInstance.takeDamage(8);
           const prevCombo = player.comboCount || 0;
           updatePlayer({ comboCount: prevCombo + 1, lastComboTime: currentTime });
           addDamageNumber({
             id: `ww_boss_dmg_${Date.now()}_${Math.random()}`,
             x: player.x, y: player.y - 15, value: 8, color: '#ef4444', isCrit: true, createdAt: currentTime, lifespan: 500
           });
           for (let k = 0; k < 3; k++) {
             addParticle({
               id: `ww_boss_blood_${Date.now()}_${k}`, x: player.x, y: player.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, radius: 2, color: '#dc2626', alpha: 0.8, decay: 0.05, createdAt: currentTime, lifespan: 200
             });
           }
        }
      }
    }
  }
}

// --- HÀM KÍCH HOẠT CHIÊU CUỐI (ULTIMATE ATTACK) ---
export function triggerPlayerUltimate() {
  const { player, updatePlayer, addParticle, addDamageNumber, setCameraShake, enemies, updateEnemy, activeBossInstance } = useEntityStore.getState();
  if (!player || player.hp <= 0) return;

  // Cần ít nhất 50 MP (Sanity) để dùng Ultimate
  if ((player.sanity || 0) < 50) {
    addDamageNumber({
      id: `ult_fail_${Date.now()}`, x: player.x, y: player.y - 30,
      value: 0, text: 'NOT ENOUGH MP!', color: '#94a3b8', isCrit: false, createdAt: performance.now(), lifespan: 1000
    });
    return;
  }

  // Trừ 50 MP
  updatePlayer({ sanity: (player.sanity || 0) - 50 });
  const currentTime = performance.now();
  
  // Dừng hình toàn bộ màn hình
  useGameStore.getState().triggerHitStop(500); 
  setCameraShake(20);

  // Vụ nổ toàn bản đồ
  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 15;
    addParticle({
      id: `ult_${Date.now()}_${i}`,
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4 + Math.random() * 6,
      color: Math.random() > 0.5 ? '#f43f5e' : '#fbbf24',
      alpha: 1.0,
      decay: 0.02,
      createdAt: currentTime,
      lifespan: 1000
    });
  }

  // Gây sát thương cực mạnh lên toàn bộ kẻ địch trên màn hình
  enemies.forEach(e => {
    if (e.hp > 0) {
      const dist = Math.hypot(e.x - player.x, e.y - player.y);
      if (dist < 800) { // Tầm đánh toàn màn hình
        const dmg = 150 + Math.floor(Math.random() * 100);
        updateEnemy(e.id, { hp: Math.max(0, e.hp - dmg) });
        addDamageNumber({
          id: `ult_dmg_${Date.now()}_${e.id}`, x: e.x, y: e.y - 20,
          value: dmg, text: 'OBLITERATED', color: '#f43f5e', isCrit: true, createdAt: currentTime, lifespan: 1500
        });
      }
    }
  });

  // Gây sát thương chiêu cuối lên Boss
  if (activeBossInstance && activeBossInstance.hp > 0 && activeBossInstance.state !== 'death') {
     const hb = activeBossInstance.getHitboxes().bodyBox;
     const bx = hb.x + hb.width/2;
     const by = hb.y + hb.height/2;
     const dist = Math.hypot(bx - player.x, by - player.y);
     if (dist < 1000) {
       const dmg = 300 + Math.floor(Math.random() * 200);
       activeBossInstance.takeDamage(dmg);
       addDamageNumber({
         id: `ult_boss_dmg_${Date.now()}`, x: bx, y: by - 50, value: dmg, text: 'OBLITERATED', color: '#f43f5e', isCrit: true, createdAt: currentTime, lifespan: 1500
       });
     }
  }
}

// --- HÀM KÍCH HOẠT TẤN CÔNG (BẮN SÚNG / CẬN CHIẾN) ---
export function triggerPlayerAttack(mouseX: number, mouseY: number) {
  const { player, updatePlayer, addProjectile, enemies, updateEnemy, addParticle, addDamageNumber, setCameraShake, projectiles, setProjectiles, activeBossInstance } = useEntityStore.getState();
  const { currentRoomId, addBloodDecal } = useMapStore.getState();
  if (!player) return;

  const weapons = player.weapons || [];
  const activeIdx = player.activeWeaponIndex || 0;
  const weapon = weapons[activeIdx];
  if (!weapon) return;

  const currentTime = performance.now();
  const lastAttackTime = player.lastAttackTime || 0;

  // Kiểm tra Tốc độ đánh (Cooldown)
  if (currentTime - lastAttackTime < weapon.fireRate) return;

  // Lớp nhân vật đang dùng
  const isKnightSkillActive = player.classId === 'knight' && player.skillActiveUntil && currentTime < player.skillActiveUntil;
  const isRogueSkillActive = player.classId === 'rogue' && player.skillActiveUntil && currentTime < player.skillActiveUntil;



  // Tính hướng bắn/vung kiếm dựa vào toạ độ chuột
  const dx = mouseX - player.x;
  const dy = mouseY - player.y;
  const baseAngle = Math.atan2(dy, dx);
  let facing = player.facingDirection || 1;
  if (dx < 0) facing = -1;
  else if (dx > 0) facing = 1;

  // Lưu thời điểm tấn công và Cập nhật góc nhìn
  updatePlayer({ 
    lastAttackTime: currentTime,
    angle: baseAngle,
    animState: 'attack',
    facingDirection: facing as 1 | -1
  });

  // Phát nhạc chém/bắn (Giả lập SFX qua AudioContext hoặc nổ hạt)
  
  if (weapon.type === 'melee') {
    // --- TẤN CÔNG CẬN CHIẾN (BROADSWORD) ---
    // Tạo hiệu ứng hạt bụi chém hình vòng cung
    const arcRadius = weapon.range || 80;
    // Thay thế hiệu ứng hạt bằng vệt chém ngang (Slash Trail)
    addParticle({
      id: `melee_slash_${Date.now()}`,
      type: 'slash_trail',
      angle: baseAngle,
      x: player.x,
      y: player.y,
      vx: 0,
      vy: 0,
      radius: arcRadius, // Chiều dài vệt chém
      color: 'rgba(255, 255, 255, 0.9)', // Trắng sáng
      alpha: 1.0,
      decay: 0.1, // Biến mất rất nhanh
      createdAt: currentTime,
      lifespan: 150
    });

    // Camera rung nhẹ
    setCameraShake(2);

    // Tính sát thương cận chiến (Kiểm tra xem có chí mạng sau khi Rogue lộn nhào không, hoặc chí mạng ngẫu nhiên 10%)
    let isCrit = Math.random() < 0.1;
    let finalDamage = isCrit ? Math.floor(weapon.damage * 1.5) : weapon.damage;
    if (isRogueSkillActive) {
      isCrit = true;
      finalDamage = Math.floor(weapon.damage * 2.0); // X2 sát thương chí mạng sau lướt
      // Tắt buff chí mạng sau phát đánh đầu tiên
      updatePlayer({ skillActiveUntil: undefined });
    }

    // Buff Relic: Berserker Ring (+50% sát thương khi HP < 30%)
    if (player.relics?.includes('berserker_ring') && player.hp < player.maxHp * 0.3) {
      finalDamage = Math.floor(finalDamage * 1.5);
    }

    // Class Berserker: Tăng tới 100% sát thương theo % máu đã mất (Max khi máu < 30%)
    if (player.id === 'berserker') {
      const hpPercent = player.hp / player.maxHp;
      if (hpPercent <= 0.3) {
        finalDamage = Math.floor(finalDamage * 2.0); // 100% bonus
      } else {
        const bonus = 1 + (1 - hpPercent); // VD 50% máu -> 1.5x
        finalDamage = Math.floor(finalDamage * bonus);
      }
    }
    
    // Cursed Blood Ring: Luôn tăng 50% sát thương
    const hasCursedRing = player.relics?.includes('cursed_blood_ring');
    if (hasCursedRing) {
      finalDamage = Math.floor(finalDamage * 1.5);
    }
    
    // Phạt Sanity: Nếu Sanity < 30, giảm 30% sát thương do hoảng sợ
    if ((player.sanity ?? 100) < 30) {
      finalDamage = Math.max(1, Math.floor(finalDamage * 0.7));
    }

    let cursedRingTriggered = false;

    // 1. Quét kẻ địch bị chém trúng
    enemies.forEach(enemy => {
      const ex = enemy.x - player.x;
      const ey = enemy.y - player.y;
      const dist = Math.sqrt(ex * ex + ey * ey);

      if (dist <= arcRadius + enemy.radius) {
        // Kiểm tra góc chém
        const enemyAngle = Math.atan2(ey, ex);
        let angleDiff = enemyAngle - baseAngle;
        
        // Bình thường hoá góc về khoảng -PI -> PI
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        if (Math.abs(angleDiff) <= Math.PI / 3) {
          // Trúng đòn!
          const prevCombo = player.comboCount || 0;
          updatePlayer({
            comboCount: prevCombo + 1,
            lastComboTime: currentTime
          });
          
          // Hit-Stop: Cảm giác đánh nặng nề
          if (enemy.type === 'boss' || isCrit) {
             useGameStore.getState().triggerHitStop(isCrit ? 80 : 50); // Khựng 80ms nếu crit, 50ms nếu boss
          }

          const nextHp = Math.max(0, enemy.hp - finalDamage);
          const updateData: Partial<Entity> = { hp: nextHp };
          if (enemy.type !== 'boss') {
            updateData.knockbackVx = Math.cos(enemyAngle) * (isCrit ? 12 : 8);
            updateData.knockbackVy = Math.sin(enemyAngle) * (isCrit ? 12 : 8);
          }

          // Máu văng tung tóe theo hướng chém
          for (let p = 0; p < (isCrit ? 10 : 5); p++) {
            addParticle({
              id: `blood_splatter_${Date.now()}_${enemy.id}_${p}`,
              x: enemy.x,
              y: enemy.y,
              vx: Math.cos(enemyAngle + (Math.random() - 0.5)) * (2 + Math.random() * 4),
              vy: Math.sin(enemyAngle + (Math.random() - 0.5)) * (2 + Math.random() * 4),
              radius: 1 + Math.random() * 3,
              color: enemy.element === 'poison' ? '#a3e635' : '#b91c1c', // Máu xanh nếu là độc, đỏ nếu thường
              alpha: 0.9,
              decay: 0.03,
              createdAt: currentTime,
              lifespan: 500
            });
          }
          
          // Dismemberment Logic (Cơ chế chặt chém)
          let dismembered = false;
          if (nextHp > 0 && enemy.type !== 'boss') {
            // Xác suất 30% bị đứt tay chân (50% nếu chí mạng)
            const dismemberChance = isCrit ? 0.5 : 0.3;
            if (Math.random() < dismemberChance) {
              const currentLimbs = enemy.missingLimbs || [];
              const possibleLimbs: ('arm' | 'legs')[] = ['arm', 'legs'].filter(l => !currentLimbs.includes(l as any)) as ('arm' | 'legs')[];
              if (possibleLimbs.length > 0) {
                const limbToLose = possibleLimbs[Math.floor(Math.random() * possibleLimbs.length)];
                updateData.missingLimbs = [...currentLimbs, limbToLose];
                dismembered = true;
                
                // Báo chữ Dismember
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

                // Rơi ra một khúc tay chân (Particle)
                addParticle({
                  id: `limb_${Date.now()}_${enemy.id}`,
                  type: 'limb_piece',
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  radius: limbToLose === 'arm' ? 4 : 6,
                  color: enemy.color || '#450a0a',
                  alpha: 1.0,
                  decay: 0.005, // Lâu biến mất
                  createdAt: currentTime,
                  lifespan: 5000,
                  angle: Math.random() * Math.PI * 2
                });
                
                // Decal vũng máu dài
                if (currentRoomId) {
                  addBloodDecal(currentRoomId, {
                    x: enemy.x + Math.cos(enemyAngle) * 15 + (Math.random() - 0.5) * 15,
                    y: enemy.y + Math.sin(enemyAngle) * 15 + (Math.random() - 0.5) * 15,
                    radius: 12 + Math.random() * 10,
                    alpha: 0.7 + Math.random() * 0.3,
                    type: 'puddle',
                    color: enemy.element === 'poison' ? '#4d7c0f' : '#450a0a'
                  });
                }
              }
            }
          }

          updateEnemy(enemy.id, updateData);
          
          if (hasCursedRing && !cursedRingTriggered) {
            cursedRingTriggered = true;
            const nextP_HP = Math.max(1, player.hp - 1);
            const nextP_San = Math.max(0, (player.sanity ?? 100) - 2);
            updatePlayer({ hp: nextP_HP, sanity: nextP_San });
            
            // Player văng máu vì lời nguyền
            for(let p_blood = 0; p_blood < 5; p_blood++) {
              addParticle({
                id: `cursed_blood_${Date.now()}_${p_blood}`,
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

          if (nextHp <= 0 && currentRoomId) {
            // --- KẾT LIỄU TÀN KHỐC (Execution Blood Explosion) ---
            if (isCrit || finalDamage >= enemy.maxHp * 0.5) {
              setCameraShake(6);
              // Rung tung toé máu văng tứ phía
              for (let k = 0; k < 20; k++) {
                addParticle({
                  id: `execution_blood_${Date.now()}_${k}`,
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
              // Mảnh thịt văng
              for (let k = 0; k < 3; k++) {
                addParticle({
                  id: `execution_flesh_${Date.now()}_${k}`,
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

            // Vũng máu cực lớn khi chết
            addBloodDecal(currentRoomId, {
              x: enemy.x,
              y: enemy.y,
              radius: (isCrit || finalDamage >= enemy.maxHp * 0.5) ? 50 + Math.random() * 30 : 30 + Math.random() * 20,
              alpha: 0.9,
              type: 'puddle'
            });

            // Chain Explosions (Nếu quái bị burning hoặc chết bởi Bomb Devil)
            if (enemy.statusEffects.includes('burning') || player.id === 'bomb_devil') {
              // Gây nổ lan bằng cách tạo một Projectile nổ tức thì
              useEntityStore.getState().addProjectile({
                id: `chain_explode_${Date.now()}_${Math.random()}`,
                x: enemy.x,
                y: enemy.y,
                vx: 0, vy: 0,
                radius: 12,
                damage: 0,
                owner: 'player',
                color: '#ef4444',
                createdAt: performance.now(),
                lifespan: 0, // Nổ ngay lập tức trong frame tiếp theo
                isExplosive: true
              });
            }
          }

          if (nextHp <= 0) {
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

          // Hiển thị số sát thương
          addDamageNumber({
            id: `dmg_${Date.now()}_${enemy.id}`,
            x: enemy.x,
            y: enemy.y - 15,
            value: finalDamage,
            color: isCrit ? '#f97316' : '#ffffff', // Cam chí mạng / Trắng thường
            isCrit,
            createdAt: currentTime,
            lifespan: 600
          });

          // Hạt máu tóe ra (nhiều hơn nếu bị chặt chém)
          const bloodCount = dismembered ? 15 : 6;
          for (let k = 0; k < bloodCount; k++) {
            addParticle({
              id: `blood_${Date.now()}_${enemy.id}_${k}`,
              x: enemy.x,
              y: enemy.y,
              vx: (Math.random() - 0.5) * 4 + Math.cos(enemyAngle) * 2,
              vy: (Math.random() - 0.5) * 4 + Math.sin(enemyAngle) * 2,
              radius: 2 + Math.random() * 2,
              color: '#ef4444',
              alpha: 0.9,
              decay: 0.05,
              createdAt: currentTime,
              lifespan: 200
            });
          }
          
          // Thêm splatter decal
          if (currentRoomId && Math.random() < 0.4) {
            addBloodDecal(currentRoomId, {
              x: enemy.x + Math.cos(enemyAngle) * 10 + (Math.random() - 0.5) * 20,
              y: enemy.y + Math.sin(enemyAngle) * 10 + (Math.random() - 0.5) * 20,
              radius: 8 + Math.random() * 8,
              alpha: 0.6 + Math.random() * 0.3,
              type: 'splatter'
            });
          }
        }
      }
    });

    // 1.5. Quét Siêu Boss bị chém trúng
    if (activeBossInstance && activeBossInstance.hp > 0 && activeBossInstance.state !== 'death') {
       const hb = activeBossInstance.getHitboxes().bodyBox;
       const closestX = Math.max(hb.x, Math.min(player.x, hb.x + hb.width));
       const closestY = Math.max(hb.y, Math.min(player.y, hb.y + hb.height));
       const dx = closestX - player.x;
       const dy = closestY - player.y;
       const dist = Math.sqrt(dx * dx + dy * dy);
       
       if (dist <= arcRadius) {
         const enemyAngle = Math.atan2(dy, dx);
         let angleDiff = enemyAngle - baseAngle;
         while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
         while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

         if (Math.abs(angleDiff) <= Math.PI / 3) {
            const prevCombo = player.comboCount || 0;
            updatePlayer({ comboCount: prevCombo + 1, lastComboTime: currentTime });
            useGameStore.getState().triggerHitStop(isCrit ? 80 : 50);

            activeBossInstance.takeDamage(finalDamage);

            if (hasCursedRing && !cursedRingTriggered) {
              cursedRingTriggered = true;
              updatePlayer({ hp: Math.max(1, player.hp - 1), sanity: Math.max(0, (player.sanity ?? 100) - 2) });
              for(let p_blood = 0; p_blood < 5; p_blood++) {
                addParticle({ id: `cursed_blood_${Date.now()}_${p_blood}`, x: player.x, y: player.y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, radius: 2, color: '#991b1b', alpha: 0.9, decay: 0.05, createdAt: currentTime, lifespan: 300 });
              }
            }

            addDamageNumber({ id: `dmg_boss_${Date.now()}_${Math.random()}`, x: closestX, y: closestY - 20, value: finalDamage, color: isCrit ? '#f97316' : '#ffffff', isCrit, createdAt: currentTime, lifespan: 600 });
            
            for (let k = 0; k < (isCrit ? 10 : 5); k++) {
              addParticle({ id: `blood_boss_${Date.now()}_${k}`, x: closestX, y: closestY, vx: Math.cos(enemyAngle)*3 + (Math.random()-0.5)*2, vy: Math.sin(enemyAngle)*3 + (Math.random()-0.5)*2, radius: 2+Math.random()*2, color: '#b91c1c', alpha: 0.9, decay: 0.05, createdAt: currentTime, lifespan: 250 });
            }
         }
       }
    }

    // 2. Phản xạ/Xoá đạn của quái vật trong vòng quét kiếm (Rất quan trọng!)
    const remainingProjectiles = projectiles.filter(proj => {
      if (proj.owner === 'player') return true;
      const ex = proj.x - player.x;
      const ey = proj.y - player.y;
      const dist = Math.sqrt(ex * ex + ey * ey);

      if (dist <= arcRadius + proj.radius) {
        const projAngle = Math.atan2(ey, ex);
        let angleDiff = projAngle - baseAngle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        if (Math.abs(angleDiff) <= Math.PI / 3) {
          // Bụi va đạn bắn ra
          for (let k = 0; k < 3; k++) {
            addParticle({
              id: `deflect_${Date.now()}_${proj.id}_${k}`,
              x: proj.x,
              y: proj.y,
              vx: -proj.vx * 0.3 + (Math.random() - 0.5) * 3,
              vy: -proj.vy * 0.3 + (Math.random() - 0.5) * 3,
              radius: 1.5,
              color: '#38bdf8',
              alpha: 0.8,
              decay: 0.06,
              createdAt: currentTime,
              lifespan: 150
            });
          }
          return false; // Xoá viên đạn này
        }
      }
      return true;
    });
    setProjectiles(remainingProjectiles);

    // Kích hoạt chém kiếm vẽ visual
    updatePlayer({
      ...({
        meleeSwingActive: true,
        meleeSwingAngle: baseAngle,
        meleeSwingStart: currentTime
      } as any)
    });
  } 
  else {
    // --- TẤN CÔNG BẮN ĐẠN (RANGED/MAGIC) ---
    const projSpeed = weapon.projectileSpeed || 12;
    const projRadius = weapon.id === 'magic_staff' ? 8 : 4;
    const projColor = weapon.color || '#f59e0b';
    
    // Tính sát thương
    let finalDamage = weapon.damage;
    if (isRogueSkillActive) {
      finalDamage = Math.floor(weapon.damage * 1.5);
      updatePlayer({ skillActiveUntil: undefined });
    }

    // Buff Relic: Berserker Ring (+50% sát thương khi HP < 30%)
    if (player.relics?.includes('berserker_ring') && player.hp < player.maxHp * 0.3) {
      finalDamage = Math.floor(finalDamage * 1.5);
    }

    // Class Berserker: Tăng tới 100% sát thương theo % máu đã mất
    if (player.id === 'berserker') {
      const hpPercent = player.hp / player.maxHp;
      if (hpPercent <= 0.3) {
        finalDamage = Math.floor(finalDamage * 2.0); // 100% bonus
      } else {
        const bonus = 1 + (1 - hpPercent);
        finalDamage = Math.floor(finalDamage * bonus);
      }
    }
    
    // Phạt Sanity: Nếu Sanity < 30, giảm 30% sát thương do tay run
    if ((player.sanity ?? 100) < 30) {
      finalDamage = Math.max(1, Math.floor(finalDamage * 0.7));
    }

    const spawnBullet = (angleOffset: number, positionOffsetSide: number = 0) => {
      const finalAngle = baseAngle + angleOffset;
      // Dịch chuyển đạn ra rìa người chơi
      const spawnDist = player.radius + 5;
      
      // Tính toán toạ độ spawn song song cho Knight
      const offsetAngle = finalAngle + Math.PI / 2;
      const sx = player.x + Math.cos(finalAngle) * spawnDist + Math.cos(offsetAngle) * positionOffsetSide;
      const sy = player.y + Math.sin(finalAngle) * spawnDist + Math.sin(offsetAngle) * positionOffsetSide;
      
      const vx = Math.cos(finalAngle) * projSpeed;
      const vy = Math.sin(finalAngle) * projSpeed;

      addProjectile({
        id: `bullet_${Date.now()}_${Math.random()}`,
        owner: 'player',
        x: sx,
        y: sy,
        vx,
        vy,
        radius: projRadius,
        damage: finalDamage,
        color: projColor,
        lifespan: weapon.range ? (weapon.range / projSpeed) * 16.67 : 1500,
        createdAt: currentTime
      });
    };

    // Spawn tia bắn
    if (weapon.id === 'laser_shotgun') {
      // Shotgun bắn 3 tia chùm quạt
      const angles = [-0.2, 0, 0.2];
      angles.forEach(ang => {
        if (isKnightSkillActive) {
          // Kỵ sĩ Dual Wield bắn 2 chùm song song
          spawnBullet(ang, -12);
          spawnBullet(ang, 12);
        } else {
          spawnBullet(ang, 0);
        }
      });
    } else {
      // Các súng khác bắn thẳng
      if (isKnightSkillActive) {
        spawnBullet(0, -10);
        spawnBullet(0, 10);
      } else {
        spawnBullet(0, 0);
      }
    }

    // Hiệu ứng giật màn hình và khói nòng súng
    setCameraShake(weapon.id === 'magic_staff' ? 4 : 1);
    
    // Tạo khói nòng súng
    const muzzleX = player.x + Math.cos(baseAngle) * (player.radius + 8);
    const muzzleY = player.y + Math.sin(baseAngle) * (player.radius + 8);
    for (let k = 0; k < 3; k++) {
      addParticle({
        id: `muzzle_${Date.now()}_${k}`,
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(baseAngle) * 2 + (Math.random() - 0.5) * 1.5,
        vy: Math.sin(baseAngle) * 2 + (Math.random() - 0.5) * 1.5,
        radius: 2 + Math.random() * 2,
        color: 'rgba(251, 191, 36, 0.7)',
        alpha: 0.9,
        decay: 0.08,
        createdAt: currentTime,
        lifespan: 120
      });
    }
  }
}

// --- HÀM KÍCH HOẠT KỸ NĂNG ĐẶC BIỆT CỦA NHÂN VẬT (CLASS SKILL) ---
export function triggerPlayerSkill() {
  const { player, updatePlayer, enemies, updateEnemy, addParticle, addDamageNumber, setCameraShake, addProjectile } = useEntityStore.getState();
  if (!player) return;

  const currentTime = performance.now();
  const lastSkillUsedTime = player.lastSkillUsedTime || 0;
  
  const classDef = CHARACTER_CLASSES.find(c => c.id === player.id);
  const cooldown = classDef ? classDef.skillCooldown : 10000;

  if (currentTime - lastSkillUsedTime < cooldown) return;

  // LƯU THỜI GIAN COOLDOWN
  updatePlayer({ lastSkillUsedTime: currentTime });

  if (player.id === 'knight') {
    // --- SKILL KNIGHT: DUAL WIELD (Song kiếm/Song súng) ---
    updatePlayer({
      skillActiveUntil: currentTime + 5000 // Kéo dài 5 giây
    });
    
    // VFX kích hoạt
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      addParticle({
        id: `knight_skill_${Date.now()}_${i}`,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        radius: 3,
        color: '#f59e0b', // Vàng cam rực rỡ
        alpha: 1.0,
        decay: 0.05,
        createdAt: currentTime,
        lifespan: 400
      });
    }
    setCameraShake(4);
  } 
  else if (player.id === 'bomb_devil') {
    // --- SKILL BOMB DEVIL: EXPLOSIVE CHAIN ---
    // Ném 1 quả mìn (projectile) phát nổ siêu to
    const angle = player.angle || 0;
    addProjectile({
      id: `bomb_skill_${Date.now()}`,
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * 8, // Ném khá nhanh
      vy: Math.sin(angle) * 8,
      radius: 12, // Đầu nổ to
      damage: 0, // Sát thương do nổ, không phải do chạm
      owner: 'player',
      color: '#ef4444', // Đỏ
      createdAt: currentTime,
      lifespan: 1000, // Phát nổ sau 1 giây
      isExplosive: true // Cần logic riêng trong update loop hoặc khi hết lifespan
    });
    
    // Tự lùi về sau 1 chút do lực ném
    updatePlayer({
      knockbackVx: -Math.cos(angle) * 6,
      knockbackVy: -Math.sin(angle) * 6
    });
  }
  else if (player.id === 'rogue') {
    // --- SKILL ROGUE: DODGE ROLL (Nhào lộn né đạn) ---
    // Lấy hướng di chuyển của player để nhào lộn
    const vx = player.vx;
    const vy = player.vy;
    
    // Nếu player không di chuyển, lộn về hướng nhìn chuột
    let rollVx = vx;
    let rollVy = vy;
    if (vx === 0 && vy === 0) {
      rollVx = Math.cos(player.angle);
      rollVy = Math.sin(player.angle);
    }
    
    // Chuẩn hoá vector hướng di chuyển
    const len = Math.sqrt(rollVx * rollVx + rollVy * rollVy);
    const finalVx = len > 0 ? (rollVx / len) * 2.0 : 0;
    const finalVy = len > 0 ? (rollVy / len) * 2.0 : 0;

    updatePlayer({
      vx: finalVx,
      vy: finalVy,
      skillActiveUntil: currentTime + 400, // Invulnerable trong 400ms
      ...({ isRolling: true } as any)
    });

    // Tạo bóng mờ phía sau khi lộn (Visual echo)
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const p = useEntityStore.getState().player;
        if (!p) return;
        addParticle({
          id: `rogue_shadow_${Date.now()}_${i}`,
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          radius: p.radius,
          color: 'rgba(148, 163, 184, 0.4)', // Bóng mờ xám xanh
          alpha: 0.6,
          decay: 0.08,
          createdAt: performance.now(),
          lifespan: 150
        });
      }, i * 60);
    }
  } 
  else if (player.id === 'mage') {
    // --- SKILL MAGE: LIGHTNING CHAIN (Sét liên hoàn) ---
    // Tiêu hao 30 MP (sanity)
    if (player.sanity === undefined || player.sanity < 30) return;

    // 1. Tìm quái vật gần người chơi nhất trong phạm vi 350px
    let activeEnemies = [...enemies].filter(e => e.hp > 0);
    if (activeEnemies.length === 0) return;

    // Trừ Mana
    updatePlayer({ sanity: player.sanity - 30 });

    const maxTargets = 5;
    const chainTargets: Entity[] = [];
    let currentSource = player;

    for (let h = 0; h < maxTargets; h++) {
      let closestEnemy: Entity | null = null;
      let minDist = 350;

      activeEnemies.forEach(e => {
        const dx = e.x - currentSource.x;
        const dy = e.y - currentSource.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && !chainTargets.find(t => t.id === e.id)) {
          minDist = dist;
          closestEnemy = e;
        }
      });

      if (closestEnemy) {
        chainTargets.push(closestEnemy);
        currentSource = closestEnemy;
      } else {
        break; // Không tìm thấy quái tiếp theo trong tầm
      }
    }

    if (chainTargets.length === 0) return; // Không có mục tiêu nào trong tầm sét

    // 2. Giật sét các mục tiêu
    setCameraShake(5);
    
    // Lưu trữ đường vẽ sét để render Canvas trong frame tiếp theo
    const lightningNodes: Array<{x: number, y: number}> = [
      { x: player.x, y: player.y },
      ...chainTargets.map(t => ({ x: t.x, y: t.y }))
    ];
    
    updatePlayer({
      ...({
        lightningChainActive: true,
        lightningChainNodes: lightningNodes,
        lightningChainStart: currentTime
      } as any)
    });

    // Cập nhật sát thương và choáng
    chainTargets.forEach(target => {
      const nextHp = Math.max(0, target.hp - 15);
      updateEnemy(target.id, {
        hp: nextHp,
        statusEffects: [...target.statusEffects.filter(eff => eff !== 'stunned'), 'stunned'],
        ...({
          stunUntil: currentTime + 1500, // Choáng trong 1.5s
          // Đẩy nhẹ lùi
          vx: (target.x - player.x) / 50,
          vy: (target.y - player.y) / 50
        } as any)
      });

      // Hiển thị số sát thương sấm sét màu vàng xanh sáng
      addDamageNumber({
        id: `lightning_dmg_${Date.now()}_${target.id}`,
        x: target.x,
        y: target.y - 20,
        value: 15,
        color: '#67e8f9', // Cyan
        isCrit: false,
        createdAt: currentTime,
        lifespan: 700
      });

      // Hạt điện tóe ra quanh quái
      for (let k = 0; k < 5; k++) {
        addParticle({
          id: `spark_elec_${Date.now()}_${target.id}_${k}`,
          x: target.x,
          y: target.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          radius: 2 + Math.random() * 2,
          color: '#67e8f9',
          alpha: 1.0,
          decay: 0.08,
          createdAt: currentTime,
          lifespan: 200
        });
      }
    });
  }
  else if (player.id === 'summoner') {
    // --- SKILL SUMMONER: Gọi Sói Tinh Linh ---
    const { addAlly } = useEntityStore.getState();
    setCameraShake(3);

    for (let i = 0; i < 2; i++) {
      const offsetAngle = Math.PI + (i === 0 ? -Math.PI / 4 : Math.PI / 4);
      const spawnX = player.x + Math.cos(offsetAngle) * 30;
      const spawnY = player.y + Math.sin(offsetAngle) * 30;

      addAlly({
        id: `spirit_wolf_${Date.now()}_${i}`,
        type: 'ally',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        radius: 12,
        hp: 1, // Sói tinh linh không có máu, hoặc vô địch (dùng thời gian tồn tại)
        maxHp: 1,
        speed: 3.5,
        angle: 0,
        aiPattern: 'chase',
        templateId: 'spirit_wolf',
        damage: 5,
        color: 'rgba(45, 212, 191, 0.6)', // Teal transparent
        statusEffects: [],
        expireTime: currentTime + 15000 // Tồn tại 15 giây
      });

      // Hiệu ứng triệu hồi
      for (let k = 0; k < 10; k++) {
        addParticle({
          id: `summon_spark_${Date.now()}_${i}_${k}`,
          x: spawnX,
          y: spawnY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: 2 + Math.random() * 2,
          color: '#2dd4bf', // Teal 400
          alpha: 1.0,
          decay: 0.05,
          createdAt: currentTime,
          lifespan: 400
        });
      }
    }
  }
  else if (player.id === 'archer') {
    // --- SKILL ARCHER: Piercing Arrow ---
    setCameraShake(3);
    const angle = player.angle;
    const speed = 12; // Tốc độ rất nhanh
    
    addProjectile({
      id: `piercing_arrow_${Date.now()}`,
      owner: 'player',
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6,
      damage: 15,
      color: '#38bdf8', // Xanh dương sáng
      lifespan: 1500,
      createdAt: currentTime,
      piercing: true,
      piercedEntities: []
    });

    for (let k = 0; k < 8; k++) {
      addParticle({
        id: `arrow_spark_${Date.now()}_${k}`,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 5 + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * 5 + (Math.random() - 0.5) * 2,
        radius: 3,
        color: '#7dd3fc',
        alpha: 1.0,
        decay: 0.05,
        createdAt: currentTime,
        lifespan: 300
      });
    }
  }
  else if (player.id === 'paladin') {
    // --- SKILL PALADIN: Holy Nova ---
    setCameraShake(6);
    
    // 1. Hồi máu và giáp
    const nextHp = Math.min(player.maxHp, player.hp + 2);
    const nextShield = Math.min(player.maxShield || 0, (player.shield || 0) + 2);
    updatePlayer({ hp: nextHp, shield: nextShield });

    addDamageNumber({
      id: `pala_heal_${Date.now()}`,
      x: player.x,
      y: player.y - 30,
      value: 0,
      text: '+2 HP/SHIELD',
      color: '#fbbf24',
      isCrit: true,
      createdAt: currentTime,
      lifespan: 1500
    } as any);

    // 2. Sát thương AoE và đẩy lùi
    const radius = 150;
    enemies.forEach(e => {
      if (e.hp <= 0) return;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius + e.radius) {
        const nextHpEnemy = Math.max(0, e.hp - 15);
        const angle = Math.atan2(dy, dx);
        
        updateEnemy(e.id, {
          hp: nextHpEnemy,
          vx: Math.cos(angle) * 8, // Đẩy lùi rất mạnh
          vy: Math.sin(angle) * 8,
          statusEffects: [...e.statusEffects.filter(eff => eff !== 'stunned'), 'stunned'],
          ...({ stunUntil: currentTime + 1000 } as any)
        });

        addDamageNumber({
          id: `holy_dmg_${Date.now()}_${e.id}`,
          x: e.x,
          y: e.y - 15,
          value: 15,
          color: '#fef3c7',
          isCrit: false,
          createdAt: currentTime,
          lifespan: 600
        });
      }
    });

    // 3. Hiệu ứng hạt ánh sáng nổ tung
    for (let k = 0; k < 30; k++) {
      const angle = (k / 30) * Math.PI * 2;
      addParticle({
        id: `holy_nova_${Date.now()}_${k}`,
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        radius: 4,
        color: '#fbbf24',
        alpha: 1.0,
        decay: 0.03,
        createdAt: currentTime,
        lifespan: 600
      });
    }
  }
  else if (player.id === 'berserker') {
    // --- SKILL BERSERKER: Whirlwind ---
    setCameraShake(2);
    
    updatePlayer({
      skillActiveUntil: currentTime + 4000, // 4 giây xoay
      ...({ isWhirlwind: true } as any)
    });

    // Bụi và hạt máu nổi giận
    for (let k = 0; k < 15; k++) {
      addParticle({
        id: `rage_spark_${Date.now()}_${k}`,
        x: player.x,
        y: player.y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: 3,
        color: '#ef4444',
        alpha: 1.0,
        decay: 0.04,
        createdAt: currentTime,
        lifespan: 500
      });
    }
  }
  else if (player.id === 'ninja') {
    // --- SKILL NINJA: Shuriken Nova ---
    setCameraShake(3);
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 10;
      
      addProjectile({
        id: `shuriken_${Date.now()}_${i}`,
        owner: 'player',
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5,
        damage: 12,
        color: '#94a3b8', // Xám kim loại
        lifespan: 800,
        createdAt: currentTime,
        piercing: true,
        piercedEntities: []
      });

      // Hiệu ứng phóng phi tiêu
      addParticle({
        id: `shuriken_spark_${Date.now()}_${i}`,
        x: player.x + Math.cos(angle) * 10,
        y: player.y + Math.sin(angle) * 10,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        radius: 2,
        color: '#cbd5e1',
        alpha: 1.0,
        decay: 0.05,
        createdAt: currentTime,
        lifespan: 200
      });
    }
  }
}
