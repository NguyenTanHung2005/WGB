import { useEntityStore } from '../store/entityStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS, GATE_WIDTH } from '../store/mapStore';

export function runMovementSystem(delta: number) {
  const { 
    player, updatePlayer, enemies, updateEnemy, 
    allies, updateAlly,
    destructibleBarrels, explosiveBarrels, chests, shrines, shopItems,
    cameraShake, setCameraShake,
    projectiles, setProjectiles
  } = useEntityStore.getState();
  
  const { rooms, currentRoomId } = useMapStore.getState();
  const currentRoom = rooms.find(r => r.id === currentRoomId);
  const currentTime = performance.now();
  
  if (!currentRoom) return;

  const isLocked = currentRoom.state === 'combat_lock';

  // --- 1. CẬP NHẬT CAMERA SHAKE ---
  if (cameraShake > 0) {
    const nextShake = Math.max(0, cameraShake - 0.2 * (delta / 16.67));
    setCameraShake(nextShake);
  }

  // --- HÀM GIỚI HẠN DI CHUYỂN BỞI TƯỜNG PHÒNG ---
  const constrainToRoom = (x: number, y: number, r: number, isPlayer: boolean = false) => {
    let nextX = x;
    let nextY = y;
    
    const minX = WALL_THICKNESS + r;
    const maxX = ROOM_WIDTH - WALL_THICKNESS - r;
    const minY = WALL_THICKNESS + r;
    const maxY = ROOM_HEIGHT - WALL_THICKNESS - r;

    // Chi tiết cửa môn
    const gateMinX = ROOM_WIDTH / 2 - GATE_WIDTH / 2;
    const gateMaxX = ROOM_WIDTH / 2 + GATE_WIDTH / 2;
    const gateMinY = ROOM_HEIGHT / 2 - GATE_WIDTH / 2;
    const gateMaxY = ROOM_HEIGHT / 2 + GATE_WIDTH / 2;

    // Kiểm tra cửa Bắc (North)
    const inNorthGateX = x >= gateMinX + r && x <= gateMaxX - r;
    const canPassNorth = isPlayer && !isLocked && currentRoom.gates.north && inNorthGateX;

    // Kiểm tra cửa Nam (South)
    const inSouthGateX = x >= gateMinX + r && x <= gateMaxX - r;
    const canPassSouth = isPlayer && !isLocked && currentRoom.gates.south && inSouthGateX;

    // Kiểm tra cửa Tây (West)
    const inWestGateY = y >= gateMinY + r && y <= gateMaxY - r;
    const canPassWest = isPlayer && !isLocked && currentRoom.gates.west && inWestGateY;

    // Kiểm tra cửa Đông (East)
    const inEastGateY = y >= gateMinY + r && y <= gateMaxY - r;
    const canPassEast = isPlayer && !isLocked && currentRoom.gates.east && inEastGateY;

    // Giới hạn X
    if (nextX < minX) {
      if (!canPassWest || nextY < gateMinY || nextY > gateMaxY) {
        nextX = minX;
      }
    } else if (nextX > maxX) {
      if (!canPassEast || nextY < gateMinY || nextY > gateMaxY) {
        nextX = maxX;
      }
    }

    // Giới hạn Y
    if (nextY < minY) {
      if (!canPassNorth || nextX < gateMinX || nextX > gateMaxX) {
        nextY = minY;
      }
    } else if (nextY > maxY) {
      if (!canPassSouth || nextX < gateMinX || nextX > gateMaxX) {
        nextY = maxY;
      }
    }

    return { x: nextX, y: nextY };
  };

  // --- HÀM GIẢI QUYẾT VA CHẠM TRÒN-TRÒN GIỮA VẬT THỂ DI ĐỘNG & VẬT CẢN TĨNH ---
  const handleStaticCollision = (x: number, y: number, r: number, staticObstacles: Array<{ x: number, y: number, radius: number }>) => {
    let newX = x;
    let newY = y;
    
    for (const obs of staticObstacles) {
      const dx = newX - obs.x;
      const dy = newY - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = r + obs.radius;
      
      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        // Đẩy vật thể di động ra ngoài vật cản tĩnh
        newX += (dx / dist) * overlap;
        newY += (dy / dist) * overlap;
      }
    }
    
    return { x: newX, y: newY };
  };

  // Gom tất cả các vật cản tĩnh trong phòng
  const staticObstacles = [
    ...destructibleBarrels,
    ...explosiveBarrels,
    ...chests,
    ...shrines,
    ...shopItems.filter(item => !item.purchased)
  ];

  // --- 2. DI CHUYỂN PLAYER ---
  if (player && player.hp > 0) {
    if (player.hitStopUntil && currentTime < player.hitStopUntil) {
      // Đang khựng hình (Hit Stop), không di chuyển
    } else {
      // Tốc độ thực tế dựa vào chỉ số tốc độ và delta time
      const speedMultiplier = player.statusEffects.includes('slowed') ? 0.5 : 1.0;
      const finalSpeed = player.speed * speedMultiplier * (delta / 16.67);
      
      let kx = player.knockbackVx || 0;
      let ky = player.knockbackVy || 0;

      // Tính toạ độ tạm thời dựa trên vận tốc + knockback
      let px = player.x + player.vx * finalSpeed + kx * (delta / 16.67);
      let py = player.y + player.vy * finalSpeed + ky * (delta / 16.67);

      // Ma sát giảm knockback
      kx *= 0.85;
      ky *= 0.85;
      if (Math.abs(kx) < 0.1) kx = 0;
      if (Math.abs(ky) < 0.1) ky = 0;

      // Hướng nhìn
      let facing = player.facingDirection || 1;
      if (player.vx < 0) facing = -1;
      else if (player.vx > 0) facing = 1;

      // Animation State
      let nextAnimState = player.animState || 'idle';
      const isRolling = player.skillActiveUntil && currentTime < player.skillActiveUntil && (player as any).isRolling;
      if (isRolling) {
        nextAnimState = 'roll';
      } else if (nextAnimState !== 'attack') {
        if (player.vx !== 0 || player.vy !== 0) nextAnimState = 'walk';
        else nextAnimState = 'idle';
      }

      // Va chạm với tường phòng
      let constrained = constrainToRoom(px, py, player.radius, true);
      
      // Va chạm với vật cản tĩnh
      constrained = handleStaticCollision(constrained.x, constrained.y, player.radius, staticObstacles);
      
      updatePlayer({
        x: constrained.x,
        y: constrained.y,
        knockbackVx: kx,
        knockbackVy: ky,
        facingDirection: facing as 1 | -1,
        animState: nextAnimState
      });
    }
  } else if (player && player.hp <= 0 && player.animState !== 'dead') {
    updatePlayer({ animState: 'dead' });
  }

  // --- 3. DI CHUYỂN KẺ ĐỊCH ---
  enemies.forEach(enemy => {
    if (enemy.hp <= 0) {
      if (enemy.animState !== 'dead') updateEnemy(enemy.id, { animState: 'dead' });
      return;
    }

    if (enemy.hitStopUntil && currentTime < enemy.hitStopUntil) {
      return;
    }

    // Quái di chuyển dựa trên vận tốc vx, vy do AI chỉ định
    const finalSpeed = enemy.speed * (delta / 16.67);
    let kx = enemy.knockbackVx || 0;
    let ky = enemy.knockbackVy || 0;

    let ex = enemy.x + enemy.vx * finalSpeed + kx * (delta / 16.67);
    let ey = enemy.y + enemy.vy * finalSpeed + ky * (delta / 16.67);

    kx *= 0.85;
    ky *= 0.85;
    if (Math.abs(kx) < 0.1) kx = 0;
    if (Math.abs(ky) < 0.1) ky = 0;

    let facing = enemy.facingDirection || 1;
    if (enemy.vx < 0) facing = -1;
    else if (enemy.vx > 0) facing = 1;

    let nextAnimState = enemy.animState || 'idle';
    if (nextAnimState !== 'attack') {
      if (enemy.vx !== 0 || enemy.vy !== 0) nextAnimState = 'walk';
      else nextAnimState = 'idle';
    }

    // Giới hạn trong phòng (Quái không thể đi qua cửa)
    let constrained = constrainToRoom(ex, ey, enemy.radius, false);

    // Va chạm vật cản tĩnh
    constrained = handleStaticCollision(constrained.x, constrained.y, enemy.radius, staticObstacles);

    // Va chạm giữa các quái với nhau (tránh tụ lại một điểm)
    for (const other of enemies) {
      if (other.id === enemy.id || other.hp <= 0) continue;
      const dx = constrained.x - other.x;
      const dy = constrained.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = enemy.radius + other.radius;
      if (dist < minDist && dist > 0) {
        const overlap = (minDist - dist) * 0.5; // Mỗi con dạt ra một nửa
        constrained.x += (dx / dist) * overlap;
        constrained.y += (dy / dist) * overlap;
      }
    }

    updateEnemy(enemy.id, {
      x: constrained.x,
      y: constrained.y,
      knockbackVx: kx,
      knockbackVy: ky,
      facingDirection: facing as 1 | -1,
      animState: nextAnimState
    });
  });

  // --- 4. DI CHUYỂN ĐỒNG MINH (ALLIES) ---
  allies.forEach(ally => {
    if (ally.hitStopUntil && currentTime < ally.hitStopUntil) return;

    const finalSpeed = ally.speed * (delta / 16.67);
    let kx = ally.knockbackVx || 0;
    let ky = ally.knockbackVy || 0;

    let ax = ally.x + ally.vx * finalSpeed + kx * (delta / 16.67);
    let ay = ally.y + ally.vy * finalSpeed + ky * (delta / 16.67);

    kx *= 0.85;
    ky *= 0.85;
    if (Math.abs(kx) < 0.1) kx = 0;
    if (Math.abs(ky) < 0.1) ky = 0;

    let facing = ally.facingDirection || 1;
    if (ally.vx < 0) facing = -1;
    else if (ally.vx > 0) facing = 1;

    let nextAnimState = ally.animState || 'idle';
    if (nextAnimState !== 'attack') {
      if (ally.vx !== 0 || ally.vy !== 0) nextAnimState = 'walk';
      else nextAnimState = 'idle';
    }

    // Giới hạn trong phòng (Sói không đi xuyên tường)
    let constrained = constrainToRoom(ax, ay, ally.radius, false);

    // Va chạm với vật cản tĩnh (Thùng, rương...)
    constrained = handleStaticCollision(constrained.x, constrained.y, ally.radius, staticObstacles);

    updateAlly(ally.id, {
      x: constrained.x,
      y: constrained.y,
      knockbackVx: kx,
      knockbackVy: ky,
      facingDirection: facing as 1 | -1,
      animState: nextAnimState
    });
  });

  // --- 5. DI CHUYỂN ĐẠN (PROJECTILES) ---
  const nextProjectiles = projectiles.map(p => ({
    ...p,
    x: p.x + p.vx * (delta / 16.67),
    y: p.y + p.vy * (delta / 16.67)
  }));
  setProjectiles(nextProjectiles);
}
