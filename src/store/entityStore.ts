import { create } from 'zustand';
import type { 
  Entity, Projectile, VFXParticle, DamageNumber, 
  Chest, Shrine, ShopItem, GoldPickup, HealthPickup, RelicPickup, ExpPickup,
  DestructibleBarrel, ExplosiveBarrel, Portal, GroundWeapon, SpikeTrap, Anvil, BloodSplat
} from '../types/interfaces';
import { WEAPONS } from '../data/weapons';
import { ROOM_WIDTH, ROOM_HEIGHT, useMapStore } from './mapStore';

interface EntityState {
  player: Entity | null;
  enemies: Entity[];
  allies: Entity[];
  projectiles: Projectile[];
  particles: VFXParticle[];
  damageNumbers: DamageNumber[];
  bloodSplats: BloodSplat[];
  chests: Chest[];
  shrines: Shrine[];
  shopItems: ShopItem[];
  anvils: Anvil[];

  goldPickups: GoldPickup[];
  healthPickups: HealthPickup[];
  expPickups: ExpPickup[];
  relicPickups: RelicPickup[];
  destructibleBarrels: DestructibleBarrel[];
  explosiveBarrels: ExplosiveBarrel[];
  groundWeapons: GroundWeapon[];
  spikeTraps: SpikeTrap[];
  portal: Portal | null;
  cameraShake: number; // Cường độ rung camera hiện tại
  cameraShakeDx: number; // Hướng rung X
  cameraShakeDy: number; // Hướng rung Y
  activeBossInstance: any | null; // Instance của Siêu Boss

  setPlayer: (player: Entity | null) => void;
  updatePlayer: (updater: Partial<Entity> | ((p: Entity) => Entity)) => void;
  setEnemies: (enemies: Entity[]) => void;
  addEnemy: (enemy: Entity) => void;
  updateEnemy: (id: string, updater: Partial<Entity> | ((e: Entity) => Entity)) => void;
  removeEnemy: (id: string) => void;
  
  addAlly: (ally: Entity) => void;
  updateAlly: (id: string, updater: Partial<Entity> | ((e: Entity) => Entity)) => void;
  removeAlly: (id: string) => void;
  setAllies: (allies: Entity[]) => void;
  addProjectile: (p: Projectile) => void;
  setProjectiles: (p: Projectile[]) => void;
  addParticle: (p: VFXParticle) => void;
  setParticles: (p: VFXParticle[]) => void;
  addDamageNumber: (dn: DamageNumber) => void;
  setDamageNumbers: (dn: DamageNumber[]) => void;
  addBloodSplat: (bs: BloodSplat) => void;
  clearBloodSplats: () => void;
  
  addGoldPickup: (g: GoldPickup) => void;
  removeGoldPickup: (id: string) => void;
  setGoldPickups: (goldPickups: GoldPickup[]) => void;
  
  addHealthPickup: (h: HealthPickup) => void;
  removeHealthPickup: (id: string) => void;
  setHealthPickups: (healthPickups: HealthPickup[]) => void;
  
  addExpPickup: (e: ExpPickup) => void;
  removeExpPickup: (id: string) => void;
  setExpPickups: (expPickups: ExpPickup[]) => void;
  
  addRelicPickup: (r: RelicPickup) => void;
  removeRelicPickup: (id: string) => void;
  setRelicPickups: (relicPickups: RelicPickup[]) => void;
  
  addGroundWeapon: (w: GroundWeapon) => void;
  removeGroundWeapon: (id: string) => void;
  setGroundWeapons: (groundWeapons: GroundWeapon[]) => void;
  
  addDestructibleBarrel: (b: DestructibleBarrel) => void;
  removeDestructibleBarrel: (id: string) => void;
  addExplosiveBarrel: (b: ExplosiveBarrel) => void;
  removeExplosiveBarrel: (id: string) => void;
  
  addSpikeTrap: (t: SpikeTrap) => void;
  setSpikeTraps: (t: SpikeTrap[]) => void;
  
  addChest: (c: Chest) => void;
  openChest: (id: string) => void;
  addShrine: (s: Shrine) => void;
  useShrine: (id: string) => void;
  addShopItem: (s: ShopItem) => void;
  purchaseShopItem: (id: string) => void;
  addAnvil: (a: Anvil) => void;
  useAnvil: (id: string) => void;
  setPortal: (portal: Portal | null) => void;
  setCameraShake: (intensity: number, dx?: number, dy?: number) => void;
  
  clearRoomEntities: () => void;
  spawnRoomElements: (roomType: string) => void;
  setActiveBossInstance: (boss: any | null) => void;
}

export const useEntityStore = create<EntityState>((set) => ({
  player: null,
  enemies: [],
  allies: [],
  projectiles: [],
  particles: [],
  damageNumbers: [],
  bloodSplats: [],
  chests: [],
  shrines: [],
  shopItems: [],
  anvils: [],

  goldPickups: [],
  healthPickups: [],
  expPickups: [],
  relicPickups: [],
  destructibleBarrels: [],
  explosiveBarrels: [],
  groundWeapons: [],
  spikeTraps: [],
  portal: null,
  cameraShake: 0,
  cameraShakeDx: 0,
  cameraShakeDy: 0,
  activeBossInstance: null,

  setPlayer: (player) => set({ player }),
  
  updatePlayer: (updater) => set((state) => {
    if (!state.player) return {};
    const nextPlayer = typeof updater === 'function' ? updater(state.player) : { ...state.player, ...updater };
    return { player: nextPlayer };
  }),

  setEnemies: (enemies) => set({ enemies }),
  
  addEnemy: (enemy) => set((state) => ({ enemies: [...state.enemies, enemy] })),
  
  updateEnemy: (id, updater) => set((state) => ({
    enemies: state.enemies.map(e => {
      if (e.id !== id) return e;
      return typeof updater === 'function' ? updater(e) : { ...e, ...updater };
    })
  })),

  removeEnemy: (id) => set((state) => ({
    enemies: state.enemies.filter(e => e.id !== id)
  })),

  addAlly: (ally) => set((state) => ({ allies: [...state.allies, ally] })),
  
  updateAlly: (id, updater) => set((state) => ({
    allies: state.allies.map(a => {
      if (a.id === id) {
        return typeof updater === 'function' ? updater(a) : { ...a, ...updater };
      }
      return a;
    })
  })),
  
  removeAlly: (id) => set((state) => ({
    allies: state.allies.filter(a => a.id !== id)
  })),

  setAllies: (allies) => set({ allies }),

  addProjectile: (p) => set((state) => ({ projectiles: [...state.projectiles, p] })),
  
  setProjectiles: (projectiles) => set({ projectiles }),

  addParticle: (p) => set((state) => ({ particles: [...state.particles, p] })),
  
  setParticles: (particles) => set({ particles }),

  addDamageNumber: (dn) => set((state) => ({ damageNumbers: [...state.damageNumbers, dn] })),
  
  setDamageNumbers: (damageNumbers) => set({ damageNumbers }),
  
  addBloodSplat: (bs) => set((state) => {
    const newSplats = [...state.bloodSplats, bs];
    if (newSplats.length > 500) newSplats.shift(); // Giới hạn 500 vết máu mỗi phòng
    return { bloodSplats: newSplats };
  }),
  clearBloodSplats: () => set({ bloodSplats: [] }),

  addGoldPickup: (g) => set((state) => ({ goldPickups: [...state.goldPickups, g] })),
  removeGoldPickup: (id) => set((state) => ({
    goldPickups: state.goldPickups.filter(g => g.id !== id)
  })),
  setGoldPickups: (goldPickups) => set({ goldPickups }),

  addHealthPickup: (h) => set((state) => ({ healthPickups: [...state.healthPickups, h] })),
  removeHealthPickup: (id) => set((state) => ({
    healthPickups: state.healthPickups.filter(h => h.id !== id)
  })),
  setHealthPickups: (healthPickups) => set({ healthPickups }),

  addExpPickup: (e) => set((state) => ({ expPickups: [...state.expPickups, e] })),
  removeExpPickup: (id) => set((state) => ({
    expPickups: state.expPickups.filter(e => e.id !== id)
  })),
  setExpPickups: (expPickups) => set({ expPickups }),

  addRelicPickup: (r) => set((state) => ({ relicPickups: [...state.relicPickups, r] })),
  removeRelicPickup: (id) => set((state) => ({
    relicPickups: state.relicPickups.filter(i => i.id !== id)
  })),
  setRelicPickups: (relicPickups) => set({ relicPickups }),

  addDestructibleBarrel: (b) => set((state) => ({ destructibleBarrels: [...state.destructibleBarrels, b] })),
  
  removeDestructibleBarrel: (id) => set((state) => ({
    destructibleBarrels: state.destructibleBarrels.filter(b => b.id !== id)
  })),

  addExplosiveBarrel: (b) => set((state) => ({ explosiveBarrels: [...state.explosiveBarrels, b] })),
  
  removeExplosiveBarrel: (id) => set((state) => ({
    explosiveBarrels: state.explosiveBarrels.filter(b => b.id !== id)
  })),

  addGroundWeapon: (w) => set((state) => ({ groundWeapons: [...state.groundWeapons, w] })),
  removeGroundWeapon: (id) => set((state) => ({
    groundWeapons: state.groundWeapons.filter(w => w.id !== id)
  })),
  setGroundWeapons: (groundWeapons) => set({ groundWeapons }),

  addSpikeTrap: (t) => set((state) => ({ spikeTraps: [...state.spikeTraps, t] })),
  setSpikeTraps: (spikeTraps) => set({ spikeTraps }),

  addChest: (c) => set((state) => ({ chests: [...state.chests, c] })),
  
  openChest: (id) => set((state) => ({
    chests: state.chests.map(c => c.id === id ? { ...c, opened: true } : c)
  })),

  addShrine: (s) => set((state) => ({ shrines: [...state.shrines, s] })),
  
  useShrine: (id) => set((state) => ({
    shrines: state.shrines.map(s => s.id === id ? { ...s, used: true } : s)
  })),

  addShopItem: (s) => set((state) => ({ shopItems: [...state.shopItems, s] })),
  
  purchaseShopItem: (id) => set(state => ({
    shopItems: state.shopItems.map(s => s.id === id ? { ...s, purchased: true } : s)
  })),

  addAnvil: (a) => set(state => ({ anvils: [...state.anvils, a] })),
  
  useAnvil: (id) => set(state => ({
    anvils: state.anvils.map(a => a.id === id ? { ...a, used: true } : a)
  })),

  setPortal: (portal) => set({ portal }),
  setActiveBossInstance: (boss) => set({ activeBossInstance: boss }),

  setCameraShake: (cameraShake, dx, dy) => set(state => ({ 
    cameraShake, 
    cameraShakeDx: dx !== undefined ? dx : state.cameraShakeDx, 
    cameraShakeDy: dy !== undefined ? dy : state.cameraShakeDy 
  })),

  clearRoomEntities: () => set({
    enemies: [],
    allies: [],
    projectiles: [],
    particles: [],
    damageNumbers: [],
    chests: [],
    shrines: [],
    shopItems: [],
    anvils: [],
    goldPickups: [],
    healthPickups: [],
    expPickups: [],
    relicPickups: [],
    destructibleBarrels: [],
    explosiveBarrels: [],
    groundWeapons: [],
    spikeTraps: [],
    portal: null,
    activeBossInstance: null
  }),

  spawnRoomElements: (roomType) => {
    const chests: Chest[] = [];
    const shrines: Shrine[] = [];
    const shopItems: ShopItem[] = [];
    const anvils: Anvil[] = [];
    const destructibleBarrels: DestructibleBarrel[] = [];
    const explosiveBarrels: ExplosiveBarrel[] = [];
    const groundWeapons: GroundWeapon[] = [];
    const spikeTraps: SpikeTrap[] = [];
    
    // Hàm sinh toạ độ ngẫu nhiên tránh rìa phòng và tâm phòng
    const getRandomCoord = (min: number, max: number) => {
      return min + Math.random() * (max - min);
    };

    if (roomType === 'start') {
      // Đặt sẵn một rương chứa vũ khí khởi đầu xịn hơn
      chests.push({
        id: 'start_chest',
        x: getRandomCoord(400, 1600),
        y: getRandomCoord(400, 1100),
        radius: 20,
        type: 'weapon',
        opened: false,
        weaponInChest: WEAPONS.find(w => w.id === 'assault_rifle')
      });
      // Đền thờ phục hồi miễn phí tại điểm bắt đầu
      shrines.push({
        id: 'start_shrine',
        x: getRandomCoord(200, 1800),
        y: getRandomCoord(200, 1300),
        radius: 20,
        type: 'health',
        used: false
      });
      // Spawn hai vũ khí Súng và Kiếm trên sàn ở phòng khởi đầu
      groundWeapons.push({
        id: 'start_gun',
        x: getRandomCoord(400, 1600),
        y: getRandomCoord(400, 1100),
        radius: 15,
        weapon: WEAPONS.find(w => w.id === 'assault_rifle')!
      });
      groundWeapons.push({
        id: 'start_sword',
        x: getRandomCoord(400, 1600),
        y: getRandomCoord(400, 1100),
        radius: 15,
        weapon: WEAPONS.find(w => w.id === 'broadsword')!
      });
    } 
    else if (roomType === 'chest') {
      // Rương vũ khí ngẫu nhiên ở giữa phòng
      const randomWeapons = WEAPONS.filter(w => w.id !== 'rusty_pistol');
      const chosenWeapon = randomWeapons[Math.floor(Math.random() * randomWeapons.length)];
      
      chests.push({
        id: 'chest_room_loot',
        x: getRandomCoord(800, 1200),
        y: getRandomCoord(600, 900),
        radius: 22,
        type: 'weapon',
        opened: false,
        weaponInChest: chosenWeapon
      });

      // Spawn vài thùng xung quanh góc phòng
      for (let i = 0; i < 4; i++) {
        destructibleBarrels.push({
          id: `barrel_chest_${i}`,
          x: getRandomCoord(200, 1800),
          y: getRandomCoord(200, 1300),
          radius: 18,
          hp: 1,
          maxHp: 1
        });
      }
    } 
    else if (roomType === 'shop') {
      // 3 Vật phẩm bán hàng ở hàng ngang
      const weaponOptions = WEAPONS.filter(w => w.id !== 'rusty_pistol');
      const shopWeapons = [...weaponOptions].sort(() => Math.random() - 0.5);

      const centerX = 1000;
      const centerY = 750;

      shopItems.push({
        id: 'shop_hp',
        x: centerX - 150,
        y: centerY,
        radius: 20,
        type: 'hp_potion',
        cost: 40,
        purchased: false
      });
      shopItems.push({
        id: 'shop_mp',
        x: centerX,
        y: centerY,
        radius: 20,
        type: 'mp_potion',
        cost: 20,
        purchased: false
      });

      // Lò rèn đặt phía trên
      anvils.push({
        id: `anvil_shop_${Date.now()}`,
        x: centerX,
        y: centerY - 150,
        radius: 25,
        cost: 50,
        used: false
      });
      shopItems.push({
        id: 'shop_weapon',
        x: centerX + 150,
        y: centerY,
        radius: 20,
        type: 'weapon',
        cost: 70,
        weaponItem: shopWeapons[0],
        purchased: false
      });
    } 
    else if (roomType === 'combat') {
      // Spawn một đền thờ ngẫu nhiên
      const shrineTypes: ('health' | 'power' | 'ammo')[] = ['health', 'power', 'ammo'];
      const randomShrine = shrineTypes[Math.floor(Math.random() * shrineTypes.length)];
      
      if (Math.random() < 0.4) {
        shrines.push({
          id: `shrine_combat_${Date.now()}`,
          x: getRandomCoord(200, 700),
          y: getRandomCoord(150, 550),
          radius: 20,
          type: randomShrine,
          used: false
        });
      }

      // Thùng gỗ & Thùng thuốc nổ ngẫu nhiên
      const barrelCount = 4 + Math.floor(Math.random() * 4);
      for (let i = 0; i < barrelCount; i++) {
        destructibleBarrels.push({
          id: `barrel_combat_${i}_${Date.now()}`,
          x: getRandomCoord(150, 750),
          y: getRandomCoord(150, 550),
          radius: 18,
          hp: 1,
          maxHp: 1
        });
      }

      const tntCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < tntCount; i++) {
        explosiveBarrels.push({
          id: `tnt_combat_${i}_${Date.now()}`,
          x: getRandomCoord(200, 700),
          y: getRandomCoord(150, 550),
          radius: 18,
          hp: 10,
          maxHp: 10
        });
      }

      // Sinh bẫy ngẫu nhiên theo biome
      const { rooms, currentRoomId } = useMapStore.getState();
      const currentBiome = rooms.find((r: any) => r.id === currentRoomId)?.biome || 'dungeon';
      
      const trapCount = 2 + Math.floor(Math.random() * 4); // 2 - 5 bẫy
      for (let i = 0; i < trapCount; i++) {
        // Offset thời gian active để các bẫy thò lên thụt xuống không cùng lúc
        const offsetTimer = Math.random() * 2000;
        
        let variant: 'spike' | 'poison' | 'lava' = 'spike';
        if (currentBiome === 'moss') variant = 'poison';
        else if (currentBiome === 'volcano' || currentBiome === 'blood') variant = 'lava';
        else if (currentBiome === 'ice') variant = Math.random() > 0.5 ? 'poison' : 'spike';
        spikeTraps.push({
          id: `spiketrap_${i}_${Date.now()}`,
          x: getRandomCoord(250, 650),
          y: getRandomCoord(200, 500),
          radius: 25,
          active: Math.random() > 0.5,
          nextToggleTime: performance.now() + 1000 + offsetTimer,
          damage: variant === 'lava' ? 3 : (variant === 'poison' ? 1 : 2),
          variant
        });
      }
    } 
    else if (roomType === 'boss') {
      // Spawn thùng nổ ở 4 góc phòng
      explosiveBarrels.push({ id: 'tnt_boss_1', x: 100, y: 100, radius: 18, hp: 10, maxHp: 10 });
      explosiveBarrels.push({ id: 'tnt_boss_2', x: 800, y: 100, radius: 18, hp: 10, maxHp: 10 });
      explosiveBarrels.push({ id: 'tnt_boss_3', x: 100, y: 600, radius: 18, hp: 10, maxHp: 10 });
      explosiveBarrels.push({ id: 'tnt_boss_4', x: 800, y: 600, radius: 18, hp: 10, maxHp: 10 });
    }
    else if (roomType === 'trap') {
      // Bẫy gai rải rác
      for (let i = 0; i < 35; i++) {
        spikeTraps.push({
          id: `trap_${Date.now()}_${i}`,
          x: getRandomCoord(200, 1800),
          y: getRandomCoord(200, 1300),
          radius: 30,
          active: Math.random() > 0.5,
          nextToggleTime: Date.now() + Math.random() * 2000,
          damage: 1
        });
      }
      // Thùng nổ nguy hiểm
      for (let i = 0; i < 15; i++) {
        explosiveBarrels.push({
          id: `barrel_exp_${Date.now()}_${i}`,
          x: getRandomCoord(200, 1800),
          y: getRandomCoord(200, 1300),
          radius: 20,
          hp: 1,
          maxHp: 1
        });
      }
    }
    else if (roomType === 'sacrifice') {
      shrines.push({
        id: `blood_altar_${Date.now()}`,
        x: ROOM_WIDTH / 2,
        y: ROOM_HEIGHT / 2,
        radius: 30,
        type: 'sacrifice',
        used: false
      });
    }

    set({ chests, shrines, shopItems, anvils, destructibleBarrels, explosiveBarrels, groundWeapons, spikeTraps, portal: null });
  }
}));
