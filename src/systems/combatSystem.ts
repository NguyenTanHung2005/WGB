import { useEntityStore } from '../store/entityStore';
import type { Entity } from '../types/interfaces';

export function runCombatSystem(_delta: number) {
  const { player, updatePlayer, enemies, updateEnemy } = useEntityStore.getState();
  const currentTime = performance.now();

  if (!player) return;

  // --- 1. HỒI PHỤC GIÁP (SHIELD REGENERATION) ---
  const lastHitTime = (player as any).lastHitTime || 0;
  const maxShield = player.maxShield || 0;
  const currentShield = player.shield || 0;

  if (currentShield < maxShield && currentTime - lastHitTime >= 3000) {
    // Mỗi 1 giây (1000ms) hồi 1 giáp
    const lastShieldRegenTime = (player as any).lastShieldRegenTime || 0;
    if (currentTime - lastShieldRegenTime >= 1000) {
      updatePlayer({
        shield: Math.min(maxShield, currentShield + 1),
        ...({ lastShieldRegenTime: currentTime } as any)
      });
    }
  }

  // --- 2. CẬP NHẬT TRẠNG THÁI SKILL HẾT HIỆU LỰC ---
  if (player.skillActiveUntil && currentTime >= player.skillActiveUntil) {
    updatePlayer({
      skillActiveUntil: undefined
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
}

// --- HÀM KÍCH HOẠT TẤN CÔNG (BẮN SÚNG / CẬN CHIẾN) ---
export function triggerPlayerAttack(mouseX: number, mouseY: number) {
  const { player, updatePlayer, addProjectile, enemies, updateEnemy, addParticle, addDamageNumber, setCameraShake, projectiles, setProjectiles } = useEntityStore.getState();
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
    const particleCount = 12;
    const startSweepAngle = baseAngle - Math.PI / 3; // -60 độ
    const sweepRange = (Math.PI * 2) / 3;            // 120 độ

    for (let i = 0; i < particleCount; i++) {
      const angle = startSweepAngle + (sweepRange * (i / particleCount));
      const px = player.x + Math.cos(angle) * arcRadius;
      const py = player.y + Math.sin(angle) * arcRadius;
      
      addParticle({
        id: `melee_spark_${Date.now()}_${i}`,
        x: px,
        y: py,
        vx: Math.cos(angle) * 1.5,
        vy: Math.sin(angle) * 1.5,
        radius: 3 + Math.random() * 3,
        color: 'rgba(56, 189, 248, 0.6)', // Xanh lam mờ
        alpha: 0.8,
        decay: 0.04,
        createdAt: currentTime,
        lifespan: 300
      });
    }

    // Camera rung nhẹ
    setCameraShake(2);

    // Tính sát thương cận chiến (Kiểm tra xem có chí mạng sau khi Rogue lộn nhào không)
    let isCrit = false;
    let finalDamage = weapon.damage;
    if (isRogueSkillActive) {
      isCrit = true;
      finalDamage = Math.floor(weapon.damage * 1.5);
      // Tắt buff chí mạng sau phát đánh đầu tiên
      updatePlayer({ skillActiveUntil: undefined });
    }

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
          const nextHp = Math.max(0, enemy.hp - finalDamage);
          updateEnemy(enemy.id, { 
            hp: nextHp,
            // Đẩy lùi quái
            vx: Math.cos(enemyAngle) * 4,
            vy: Math.sin(enemyAngle) * 4
          });

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

          // Hạt máu tóe ra
          for (let k = 0; k < 6; k++) {
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
        }
      }
    });

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
  const { player, updatePlayer, enemies, updateEnemy, addParticle, addDamageNumber, setCameraShake } = useEntityStore.getState();
  if (!player) return;

  const currentTime = performance.now();
  const lastSkillUsedTime = player.lastSkillUsedTime || 0;
  const cooldown = player.id === 'knight' ? 12000 : (player.id === 'rogue' ? 4000 : 10000); // 12s / 4s / 10s

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
    // 1. Tìm quái vật gần người chơi nhất trong phạm vi 350px
    let activeEnemies = [...enemies].filter(e => e.hp > 0);
    if (activeEnemies.length === 0) return;

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
}
