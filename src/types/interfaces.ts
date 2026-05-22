// --- WEAPON ---
export type WeaponType = 'ranged' | 'melee' | 'magic';

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number;       // ms giữa 2 lần bắn/chém
  projectileSpeed?: number; // Cho súng
  range?: number;         // Cho melee hoặc giới hạn tầm đạn
  color?: string;         // Vẽ tạm
}

// --- CHARACTER CLASS ---
export interface CharacterClass {
  id: string;
  name: string;
  maxHp: number;
  maxShield: number;
  speed: number;
  skillName: string;
  skillCooldown: number;  // ms
  skillDescription: string;
}

// --- ENTITY ---
export type EntityType = 'player' | 'enemy' | 'boss' | 'ally';
export type AIPattern = 'chase' | 'shoot' | 'charge' | 'summon';
export type AnimationState = 'idle' | 'walk' | 'attack' | 'roll' | 'dead';

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  shield?: number;        // Chỉ player mới có
  maxShield?: number;
  speed: number;
  angle: number;          // Hướng nhìn (radian)
  activeWeaponIndex?: number;
  weapons?: Weapon[];     // Chỉ player mang nhiều vũ khí
  lastAttackTime?: number; // timestamp ms
  lastSkillUsedTime?: number; // timestamp ms
  skillActiveUntil?: number;  // timestamp ms khi skill hết hiệu lực
  classId?: string;       // Chỉ player
  aiPattern?: AIPattern;  // Chỉ enemy/ally
  templateId?: string;    // Dùng cho enemy/ally để vẽ hình
  lastAIShootTime?: number; // Cho quái bắn xa
  damage?: number;        // Chỉ enemy/boss/ally mới có, hoặc sát thương va chạm
  color?: string;         // Vẽ tạm hoặc màu quái
  statusEffects: string[];
  expireTime?: number;    // timestamp ms khi entity này tự biến mất (vd: Sói tinh linh)
  
  // Animation & Physics
  animState?: AnimationState;
  facingDirection?: 1 | -1;
  knockbackVx?: number;
  knockbackVy?: number;
  hitStopUntil?: number;
  invincibleUntil?: number; // Cho cơ chế né/roll
  lastRollTime?: number;    // Thời điểm roll gần nhất
  rollTargetX?: number;
  rollTargetY?: number;
}

// --- PROJECTILE ---
export interface Projectile {
  id: string;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  lifespan: number;       // Thời gian tồn tại (ms)
  createdAt: number;
  piercing?: boolean;     // Có xuyên thấu không?
  piercedEntities?: string[]; // Danh sách các ID đã xuyên qua
}

// --- ROOM ---
export type RoomType = 'start' | 'combat' | 'chest' | 'shop' | 'boss';
export type RoomState = 'unvisited' | 'active' | 'combat_lock' | 'cleared';

export interface RoomGates {
  north: boolean;       // Có cửa hướng Bắc không
  south: boolean;
  east: boolean;
  west: boolean;
}

export interface Room {
  id: string;
  gridX: number;          // Vị trí trong lưới maze (cột: 0-2)
  gridY: number;          // Vị trí trong lưới maze (dòng: 0-2)
  type: RoomType;
  state: RoomState;
  width: number;          // Kích thước trong pixel
  height: number;
  gates: RoomGates;
  enemiesSpawned: boolean;
  waveCount: number;      // Đã spawn bao nhiêu wave
  maxWaves: number;       // Tổng số wave trong phòng này
}

// --- DUNGEON MAP ---
export interface DungeonMap {
  rooms: Room[];
  currentRoomId: string;
}

// --- VFX / PARTICLE ---
export interface VFXParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;          // Tốc độ giảm alpha mỗi frame
  createdAt: number;
  lifespan: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  isCrit: boolean;
  createdAt: number;
  lifespan: number;
  text?: string;
}

export interface ExplosiveBarrel {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
}

export interface DestructibleBarrel {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
}

export interface Chest {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'normal' | 'weapon';
  opened: boolean;
  weaponInChest?: Weapon;
}

export interface Portal {
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

export interface Shrine {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'health' | 'power' | 'ammo';
  used: boolean;
}

export interface ShopItem {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'hp_potion' | 'mp_potion' | 'weapon';
  cost: number;
  weaponItem?: Weapon;
  purchased: boolean;
}


export interface HealthPickup {
  id: string;
  x: number;
  y: number;
  radius: number;
  amount: number;
}

export interface GoldPickup {
  id: string;
  x: number;
  y: number;
  radius: number;
  amount: number;
}

export type ItemType = 'golden_apple' | 'wind_boots' | 'ring_of_power' | 'energy_shield';

export interface ItemPickup {
  id: string;
  x: number;
  y: number;
  radius: number;
  itemType: ItemType;
}

// --- GROUND WEAPON ---
export interface GroundWeapon {
  id: string;
  x: number;
  y: number;
  radius: number;
  weapon: Weapon;
}

// --- TRAPS ---
export interface SpikeTrap {
  id: string;
  x: number;
  y: number;
  radius: number;       // Vùng chịu sát thương
  active: boolean;      // Đang nhô lên hay không
  nextToggleTime: number; // Thời điểm đảo trạng thái
  damage: number;
}
