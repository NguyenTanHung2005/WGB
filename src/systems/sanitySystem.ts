import { useEntityStore } from '../store/entityStore';
import { useMapStore, ROOM_WIDTH, ROOM_HEIGHT } from '../store/mapStore';
import type { Entity } from '../types/interfaces';

let lastPhantomSpawnTime = 0;

export function runSanitySystem(_delta: number) {
  const { player, addEnemy, enemies } = useEntityStore.getState();
  const { currentRoomId } = useMapStore.getState();

  if (!player || player.hp <= 0 || !currentRoomId) return;

  const currentSanity = player.sanity ?? 100;

  // Nếu sanity < 15%, thỉnh thoảng spawn ảo giác
  if (currentSanity < 15) {
    const now = performance.now();
    // Spawn mỗi 4-8 giây
    if (now - lastPhantomSpawnTime > 4000 + Math.random() * 4000) {
      lastPhantomSpawnTime = now;

      // Không spawn nếu đang có quá nhiều quái hoặc ảo giác
      const phantomCount = enemies.filter(e => e.id.startsWith('phantom')).length;
      if (phantomCount < 3) {
        // Spawn ngẫu nhiên quanh người chơi
        const angle = Math.random() * Math.PI * 2;
        const dist = 150 + Math.random() * 100;
        let spawnX = player.x + Math.cos(angle) * dist;
        let spawnY = player.y + Math.sin(angle) * dist;

        // Kẹp vào trong phòng
        spawnX = Math.max(50, Math.min(ROOM_WIDTH - 50, spawnX));
        spawnY = Math.max(50, Math.min(ROOM_HEIGHT - 50, spawnY));

        const phantom: Entity = {
          id: `phantom_${Date.now()}`,
          type: 'enemy', // Đổi từ phantom thành enemy để đúng type
          x: spawnX,
          y: spawnY,
          radius: 12,
          vx: 0,
          vy: 0,
          hp: 1, // 1 hit là chết
          maxHp: 1,
          speed: player.speed * 1.1, // Nhanh hơn người chơi một chút để tạo áp lực
          angle: 0,
          aiPattern: 'chase',
          templateId: 'hallucination',
          statusEffects: [],
          damage: 5 // Trừ sanity, không trừ HP (sẽ xử lý trong combatSystem)
        };

        addEnemy(phantom);
      }
    }
  }
}
