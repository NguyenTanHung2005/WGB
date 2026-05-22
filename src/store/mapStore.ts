import { create } from 'zustand';
import type { Room, RoomGates, RoomType, RoomState } from '../types/interfaces';

interface MapState {
  rooms: Room[];
  currentRoomId: string | null;
  
  generateDungeon: () => void;
  setRoomState: (roomId: string, state: RoomState) => void;
  setEnemiesSpawned: (roomId: string, spawned: boolean) => void;
  incrementWave: (roomId: string) => void;
  setCurrentRoomId: (roomId: string | null) => void;
}

// Chiều rộng và chiều cao phòng cố định
export const ROOM_WIDTH = 900;
export const ROOM_HEIGHT = 700;
export const WALL_THICKNESS = 40;
export const GATE_WIDTH = 120;

export const useMapStore = create<MapState>((set) => ({
  rooms: [],
  currentRoomId: null,

  generateDungeon: () => {
    // 1. Tạo lưới 3x3 các phòng rỗng

    
    // DFS để tạo đường đi kết nối tất cả các phòng
    const visited = Array(3).fill(false).map(() => Array(3).fill(false));
    const connections: { [key: string]: RoomGates } = {};
    
    const directions = [
      { dx: 0, dy: -1, dir: 'north', opp: 'south' }, // Lên
      { dx: 0, dy: 1, dir: 'south', opp: 'north' },  // Xuống
      { dx: 1, dy: 0, dir: 'east', opp: 'west' },    // Phải
      { dx: -1, dy: 0, dir: 'west', opp: 'east' }    // Trái
    ];

    const getRoomId = (gx: number, gy: number) => `room_${gx}_${gy}`;

    const dfs = (x: number, y: number) => {
      visited[y][x] = true;
      const roomId = getRoomId(x, y);
      if (!connections[roomId]) {
        connections[roomId] = { north: false, south: false, east: false, west: false };
      }

      // Xáo trộn hướng để ngẫu nhiên hóa đường đi
      const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);

      for (const d of shuffledDirs) {
        const nx = x + d.dx;
        const ny = y + d.dy;

        if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3 && !visited[ny][nx]) {
          const nextRoomId = getRoomId(nx, ny);
          
          // Kích hoạt cửa kết nối 2 chiều
          connections[roomId][d.dir as keyof RoomGates] = true;
          if (!connections[nextRoomId]) {
            connections[nextRoomId] = { north: false, south: false, east: false, west: false };
          }
          connections[nextRoomId][d.opp as keyof RoomGates] = true;

          dfs(nx, ny);
        }
      }
    };

    // Bắt đầu DFS từ phòng trung tâm (1, 1)
    dfs(1, 1);

    // Xác định khoảng cách từ (1, 1) đến các phòng để chọn Boss Room (phòng xa nhất)
    let maxDist = -1;
    let bossX = 0;
    let bossY = 0;
    
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const dist = Math.abs(x - 1) + Math.abs(y - 1);
        if (dist > maxDist) {
          maxDist = dist;
          bossX = x;
          bossY = y;
        }
      }
    }

    // Nếu phòng xa nhất trùng với (1,1) (không thể xảy ra), chọn (0,0) làm mặc định
    if (bossX === 1 && bossY === 1) {
      bossX = 0;
      bossY = 0;
    }

    // Phân bổ loại phòng
    // (1, 1) -> start
    // (bossX, bossY) -> boss
    // Các phòng khác: chọn 1 phòng làm Shop, 1 phòng làm Chest, còn lại làm Combat
    const otherRoomsCoords: [number, number][] = [];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if ((x === 1 && y === 1) || (x === bossX && y === bossY)) continue;
        otherRoomsCoords.push([x, y]);
      }
    }
    
    // Trộn ngẫu nhiên các phòng còn lại
    otherRoomsCoords.sort(() => Math.random() - 0.5);
    
    const shopCoord = otherRoomsCoords.pop()!;
    const chestCoord = otherRoomsCoords.pop()!;


    const getRoomType = (x: number, y: number): RoomType => {
      if (x === 1 && y === 1) return 'start';
      if (x === bossX && y === bossY) return 'boss';
      if (x === shopCoord[0] && y === shopCoord[1]) return 'shop';
      if (x === chestCoord[0] && y === chestCoord[1]) return 'chest';
      return 'combat';
    };

    const newRooms: Room[] = [];

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const rId = getRoomId(x, y);
        const rType = getRoomType(x, y);
        
        newRooms.push({
          id: rId,
          gridX: x,
          gridY: y,
          type: rType,
          state: rType === 'start' ? 'active' : 'unvisited',
          width: ROOM_WIDTH,
          height: ROOM_HEIGHT,
          gates: connections[rId] || { north: false, south: false, east: false, west: false },
          enemiesSpawned: false,
          waveCount: 0,
          maxWaves: rType === 'combat' ? (2 + Math.floor(Math.random() * 4)) : (rType === 'boss' ? 1 : 0)
        });
      }
    }

    set({
      rooms: newRooms,
      currentRoomId: getRoomId(1, 1)
    });
  },

  setRoomState: (roomId, state) => set((s) => ({
    rooms: s.rooms.map(r => r.id === roomId ? { ...r, state } : r)
  })),

  setEnemiesSpawned: (roomId, spawned) => set((s) => ({
    rooms: s.rooms.map(r => r.id === roomId ? { ...r, enemiesSpawned: spawned } : r)
  })),

  incrementWave: (roomId) => set((s) => ({
    rooms: s.rooms.map(r => r.id === roomId ? { ...r, waveCount: r.waveCount + 1 } : r)
  })),

  setCurrentRoomId: (currentRoomId) => set({ currentRoomId })
}));
