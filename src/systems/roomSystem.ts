import { useEntityStore } from '../store/entityStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS } from '../store/mapStore';
import { useGameStore } from '../store/gameStore';
import { ENEMY_TEMPLATES, BOSS_TEMPLATE } from '../data/enemies';

let isWaitingForWave = false;

export function runRoomSystem(_delta: number) {
  const { 
    player, updatePlayer, enemies, addEnemy, clearRoomEntities, spawnRoomElements,
    addChest 
  } = useEntityStore.getState();

  const { 
    rooms, currentRoomId, setCurrentRoomId, setRoomState, setEnemiesSpawned, incrementWave 
  } = useMapStore.getState();

  const { addScore } = useGameStore.getState();

  const currentTime = performance.now();

  if (!player || player.hp <= 0) return;

  const currentRoom = rooms.find(r => r.id === currentRoomId);
  if (!currentRoom) return;

  // --- 1. CHUYỂN PHÒNG KHI PLAYER ĐI QUA CỬA ---
  let nextGridX = currentRoom.gridX;
  let nextGridY = currentRoom.gridY;
  let newPlayerX = player.x;
  let newPlayerY = player.y;
  let transitioned = false;

  // Đi qua cửa Bắc (Y < 0)
  if (player.y < -5) {
    nextGridY = currentRoom.gridY - 1;
    newPlayerY = ROOM_HEIGHT - 70;
    transitioned = true;
  }
  // Đi qua cửa Nam (Y > ROOM_HEIGHT)
  else if (player.y > ROOM_HEIGHT + 5) {
    nextGridY = currentRoom.gridY + 1;
    newPlayerY = 70;
    transitioned = true;
  }
  // Đi qua cửa Tây (X < 0)
  else if (player.x < -5) {
    nextGridX = currentRoom.gridX - 1;
    newPlayerX = ROOM_WIDTH - 70;
    transitioned = true;
  }
  // Đi qua cửa Đông (X > ROOM_WIDTH)
  else if (player.x > ROOM_WIDTH + 5) {
    nextGridX = currentRoom.gridX + 1;
    newPlayerX = 70;
    transitioned = true;
  }

  if (transitioned) {
    const nextRoomId = `room_${nextGridX}_${nextGridY}`;
    const nextRoom = rooms.find(r => r.id === nextRoomId);

    if (nextRoom) {
      // 1. Cập nhật vị trí người chơi và xoá vận tốc thừa
      updatePlayer({
        x: newPlayerX,
        y: newPlayerY,
        vx: 0,
        vy: 0
      });

      // 2. Chuyển phòng hoạt động
      setCurrentRoomId(nextRoomId);

      // 3. Xoá hết thực thể phòng cũ và sinh thực thể phòng mới
      clearRoomEntities();
      spawnRoomElements(nextRoom.type);

      // 4. Cập nhật trạng thái phòng thành đang hoạt động
      if (nextRoom.state === 'unvisited') {
        setRoomState(nextRoomId, 'active');
      }
      return; // Kết thúc tick xử lý chuyển phòng
    }
  }

  // --- 2. KÍCH HOẠT QUÁI WAVE TRONG PHÒNG CHIẾN ĐẤU / BOSS ---
  if ((currentRoom.type === 'combat' || currentRoom.type === 'boss') && currentRoom.state !== 'cleared') {
    
    // Nếu chưa từng spawn quái, khóa cửa phòng và gọi wave 1
    if (!currentRoom.enemiesSpawned) {
      setEnemiesSpawned(currentRoom.id, true);
      setRoomState(currentRoom.id, 'combat_lock');
      
      isWaitingForWave = true;
      // Spawn wave 1 sau 800ms để người chơi kịp chuẩn bị
      setTimeout(() => {
        spawnWave(currentRoom.type as 'combat' | 'boss', 1);
        incrementWave(currentRoom.id);
        isWaitingForWave = false;
      }, 800);
    } 
    
    // Nếu đang trong trạng thái khóa chiến đấu, đã bắt đầu xuất hiện wave đầu tiên, mà quái chết sạch
    else if (currentRoom.state === 'combat_lock' && currentRoom.waveCount > 0 && enemies.filter(e => e.hp > 0).length === 0 && !isWaitingForWave) {
      const nextWave = currentRoom.waveCount + 1;
      
      if (nextWave <= currentRoom.maxWaves) {
        // Vẫn còn wave quái tiếp theo
        isWaitingForWave = true;
        incrementWave(currentRoom.id);
        setTimeout(() => {
          spawnWave(currentRoom.type as 'combat' | 'boss', nextWave);
          isWaitingForWave = false;
        }, 1000);
      } else {
        // Đã quét sạch các wave quái -> Mở phòng!
        setRoomState(currentRoom.id, 'cleared');
        addScore(currentRoom.type === 'boss' ? 1000 : 100);

        if (currentRoom.type === 'boss') {
          // BOSS CHẾT -> Chuyển sang Cutscene
          useGameStore.getState().setPhase('cutscene_ending');
        } else {
          // COMBAT CLEAR -> Rơi rương kho báu phần thưởng
          addChest({
            id: `reward_chest_${currentRoom.id}`,
            x: ROOM_WIDTH / 2,
            y: ROOM_HEIGHT / 2,
            radius: 20,
            type: 'normal',
            opened: false
          });
        }
      }
    }
  }

  // --- 3. CẬP NHẬT TRẠNG THÁI BẪY GAI (SPIKE TRAPS) ---
  const { spikeTraps, setSpikeTraps } = useEntityStore.getState();
  if (spikeTraps.length > 0) {
    let changed = false;
    const newTraps = spikeTraps.map(trap => {
      if (currentTime >= trap.nextToggleTime) {
        changed = true;
        return {
          ...trap,
          active: !trap.active,
          // Nếu đang nhô lên (active), giữ 1.5s. Nếu chìm, giữ 2s.
          nextToggleTime: currentTime + (!trap.active ? 1500 : 2000)
        };
      }
      return trap;
    });
    if (changed) {
      setSpikeTraps(newTraps);
    }
  }

  // --- HÀM SPAWN WAVE QUÁI VẬT ---
  function spawnWave(type: 'combat' | 'boss', _waveNum: number) {
    if (type === 'boss') {
      // Spawn Boss
      addEnemy({
        id: BOSS_TEMPLATE.id,
        type: 'boss',
        x: ROOM_WIDTH / 2,
        y: ROOM_HEIGHT / 2 - 50,
        radius: BOSS_TEMPLATE.radius,
        vx: 0,
        vy: 0,
        hp: BOSS_TEMPLATE.maxHp,
        maxHp: BOSS_TEMPLATE.maxHp,
        speed: BOSS_TEMPLATE.speed,
        angle: 0,
        aiPattern: BOSS_TEMPLATE.aiPattern,
        templateId: BOSS_TEMPLATE.id,
        damage: BOSS_TEMPLATE.damage,
        color: BOSS_TEMPLATE.color,
        statusEffects: []
      });
      return;
    }

    // Tính toán Room Level (Độ sâu của phòng)
    // Giả sử phòng Start ở (1,1) hoặc lấy khoảng cách tuyệt đối. Tạm thời lấy gridX + gridY làm level.
    const roomLevel = currentRoom ? currentRoom.gridX + currentRoom.gridY : 0;
    const levelMultiplier = 1 + (roomLevel * 0.25); // Tăng 25% máu/sát thương mỗi ô xa Start

    // Giới hạn số lượng quái: 2 - 10 con mỗi đợt
    const count = 2 + Math.floor(Math.random() * 9);
    
    for (let i = 0; i < count; i++) {
      // Chọn ngẫu nhiên quái từ danh sách mẫu
      const template = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
      
      // Chọn vị trí xuất hiện cách xa Player tối thiểu 200px
      let spawnX = 0;
      let spawnY = 0;
      let ok = false;
      let attempts = 0;

      while (!ok && attempts < 20) {
        spawnX = WALL_THICKNESS + 50 + Math.random() * (ROOM_WIDTH - WALL_THICKNESS * 2 - 100);
        spawnY = WALL_THICKNESS + 50 + Math.random() * (ROOM_HEIGHT - WALL_THICKNESS * 2 - 100);
        
        const distToPlayer = Math.sqrt((spawnX - player!.x) ** 2 + (spawnY - player!.y) ** 2);
        if (distToPlayer > 200) {
          ok = true;
        }
        attempts++;
      }

      const isElite = Math.random() < 0.15;
      const elements: ('fire' | 'ice' | 'poison')[] = ['fire', 'ice', 'poison'];
      const element = isElite ? elements[Math.floor(Math.random() * elements.length)] : undefined;

      const eliteHpMod = isElite ? 2.5 : 1;
      const eliteDmgMod = isElite ? 1.5 : 1;
      const eliteRadMod = isElite ? 1.3 : 1;

      const scaledHp = Math.floor(template.maxHp * levelMultiplier * eliteHpMod);
      const scaledDamage = Math.floor(template.damage * levelMultiplier * eliteDmgMod);
      const scaledRadius = template.radius * eliteRadMod;
      
      // Tốc độ tỉ lệ nghịch với kích thước (bán kính) - Quái to thì chậm
      // Giả sử bán kính chuẩn (trung bình) là 15
      const scaledSpeed = template.speed * (15 / scaledRadius);

      addEnemy({
        id: `enemy_${Date.now()}_${i}_${Math.random()}`,
        type: 'enemy',
        x: spawnX,
        y: spawnY,
        radius: scaledRadius,
        vx: 0,
        vy: 0,
        hp: scaledHp,
        maxHp: scaledHp,
        speed: scaledSpeed,
        angle: 0,
        aiPattern: template.aiPattern,
        templateId: template.id,
        damage: scaledDamage,
        color: template.color,
        statusEffects: [],
        lastAttackTime: 0,
        isElite,
        element,
        lastDoTTime: 0,
        ...({ lastAIShootTime: 0 } as any)
      });

      // Tạo hiệu ứng đám bụi triệu hồi tại vị trí quái xuất hiện
      for (let k = 0; k < 6; k++) {
        useEntityStore.getState().addParticle({
          id: `spawn_dust_${Date.now()}_${i}_${k}`,
          x: spawnX,
          y: spawnY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: 3 + Math.random() * 3,
          color: 'rgba(168, 85, 247, 0.5)', // Khói tím ma mị
          alpha: 0.8,
          decay: 0.05,
          createdAt: currentTime,
          lifespan: 250
        });
      }
    }
  }
}
