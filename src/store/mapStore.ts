import { create } from 'zustand';
import type { Room, RoomGates, RoomType, RoomState, BloodDecal, Pillar } from '../types/interfaces';

interface MapState {
  rooms: Room[];
  currentRoomId: string | null;
  
  generateDungeon: () => void;
  setRoomState: (roomId: string, state: RoomState) => void;
  setEnemiesSpawned: (roomId: string, spawned: boolean) => void;
  incrementWave: (roomId: string) => void;
  setCurrentRoomId: (roomId: string | null) => void;
  addBloodDecal: (roomId: string, decal: BloodDecal) => void;
}

// Chiều rộng và chiều cao phòng cố định
export const ROOM_WIDTH = 2000;
export const ROOM_HEIGHT = 1500;
export const WALL_THICKNESS = 40;
export const GATE_WIDTH = 200;

export const useMapStore = create<MapState>((set) => ({
  rooms: [],
  currentRoomId: null,

  generateDungeon: () => {
    // 1. Số lượng phòng ngẫu nhiên từ 4 đến 10
    const targetRoomCount = Math.floor(Math.random() * 7) + 4; // 4 to 10
    
    // Sử dụng không gian ảo 10x10, bắt đầu từ (5, 5)
    const startX = 5;
    const startY = 5;
    
    interface RoomNode {
      x: number;
      y: number;
      gates: RoomGates;
    }
    
    const roomsMap: Map<string, RoomNode> = new Map();
    const getRoomId = (gx: number, gy: number) => `room_${gx}_${gy}`;
    
    // Khởi tạo phòng start
    roomsMap.set(getRoomId(startX, startY), {
      x: startX,
      y: startY,
      gates: { north: false, south: false, east: false, west: false }
    });
    
    const directions = [
      { dx: 0, dy: -1, dir: 'north', opp: 'south' }, // Lên
      { dx: 0, dy: 1, dir: 'south', opp: 'north' },  // Xuống
      { dx: 1, dy: 0, dir: 'east', opp: 'west' },    // Phải
      { dx: -1, dy: 0, dir: 'west', opp: 'east' }    // Trái
    ];

    // Thuật toán Random Tree Expansion để tạo các phòng
    while (roomsMap.size < targetRoomCount) {
      // Chọn ngẫu nhiên 1 phòng đã tạo để làm điểm mở rộng
      const existingRooms = Array.from(roomsMap.values());
      const baseRoom = existingRooms[Math.floor(Math.random() * existingRooms.length)];
      
      // Chọn ngẫu nhiên một hướng
      const d = directions[Math.floor(Math.random() * directions.length)];
      const nx = baseRoom.x + d.dx;
      const ny = baseRoom.y + d.dy;
      
      const newRoomId = getRoomId(nx, ny);
      
      // Nếu vị trí này chưa có phòng, tạo phòng mới và kết nối cửa
      if (!roomsMap.has(newRoomId)) {
        roomsMap.set(newRoomId, {
          x: nx,
          y: ny,
          gates: { north: false, south: false, east: false, west: false }
        });
        
        // Mở cửa 2 chiều
        baseRoom.gates[d.dir as keyof RoomGates] = true;
        roomsMap.get(newRoomId)!.gates[d.opp as keyof RoomGates] = true;
      }
    }

    // Xác định khoảng cách từ Start để chọn Boss Room (phòng xa nhất)
    let maxDist = -1;
    let bossId = '';
    
    roomsMap.forEach((room, id) => {
      if (id === getRoomId(startX, startY)) return;
      const dist = Math.abs(room.x - startX) + Math.abs(room.y - startY);
      if (dist > maxDist) {
        maxDist = dist;
        bossId = id;
      }
    });

    // Phân bổ loại phòng
    // (startX, startY) -> start
    // (bossId) -> boss
    // Các phòng khác: chọn 1 Shop, 1 Chest (nếu có đủ), còn lại Combat
    const otherRoomIds = Array.from(roomsMap.keys()).filter(id => id !== getRoomId(startX, startY) && id !== bossId);
    otherRoomIds.sort(() => Math.random() - 0.5);
    
    const shopId = otherRoomIds.length > 0 ? otherRoomIds.pop() : null;
    const chestId = otherRoomIds.length > 0 ? otherRoomIds.pop() : null;

    const getRoomType = (id: string): RoomType => {
      if (id === getRoomId(startX, startY)) return 'start';
      if (id === bossId) return 'boss';
      if (id === shopId) return 'shop';
      if (id === chestId) return 'chest';
      
      const rand = Math.random();
      if (rand < 0.10) return 'trap';
      if (rand < 0.15) return 'sacrifice';
      return 'combat';
    };

    const newRooms: Room[] = [];
    roomsMap.forEach((node, id) => {
      const rType = getRoomType(id);
      
      // Tạo Pillars cho phòng Combat và Boss
      let roomPillars: Pillar[] = [];
      if (rType === 'combat' || rType === 'boss') {
        const pRadius = 60 + Math.random() * 20; // 60-80 px
        const marginX = ROOM_WIDTH * 0.25;
        const marginY = ROOM_HEIGHT * 0.25;
        roomPillars = [
          { x: marginX, y: marginY, radius: pRadius },
          { x: ROOM_WIDTH - marginX, y: marginY, radius: pRadius },
          { x: marginX, y: ROOM_HEIGHT - marginY, radius: pRadius },
          { x: ROOM_WIDTH - marginX, y: ROOM_HEIGHT - marginY, radius: pRadius }
        ];
      }

      const biomes: import('../types/interfaces').Biome[] = ['dungeon', 'blood', 'abyss', 'moss', 'hell'];
      const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];

      newRooms.push({
        id: id,
        gridX: node.x,
        gridY: node.y,
        type: rType,
        state: rType === 'start' ? 'cleared' : 'unvisited',
        width: ROOM_WIDTH,
        height: ROOM_HEIGHT,
        gates: node.gates,
        enemiesSpawned: false,
        waveCount: 0,
        maxWaves: rType === 'combat' ? (2 + Math.floor(Math.random() * 4)) : (rType === 'boss' ? 1 : 0),
        pillars: roomPillars,
        biome: randomBiome
      });
    });

    set({
      rooms: newRooms,
      currentRoomId: getRoomId(startX, startY)
    });
  },

  setRoomState: (roomId, state) => set((s) => ({
    rooms: s.rooms.map(r => r.id === roomId ? { ...r, state } : r)
  })),

  setEnemiesSpawned: (roomId, spawned) => set((s) => ({
    rooms: s.rooms.map(r => r.id === roomId ? { ...r, enemiesSpawned: spawned } : r)
  })),

  incrementWave: (roomId) => set((state) => ({
    rooms: state.rooms.map(r => r.id === roomId ? { ...r, waveCount: r.waveCount + 1 } : r)
  })),

  setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),

  addBloodDecal: (roomId, decal) => set((state) => {
    return {
      rooms: state.rooms.map(r => {
        if (r.id === roomId) {
          const newDecals = [...(r.bloodDecals || []), decal];
          // Giới hạn 200 decals mỗi phòng để tránh lag
          if (newDecals.length > 200) {
            newDecals.shift();
          }
          return { ...r, bloodDecals: newDecals };
        }
        return r;
      })
    };
  })
}));
