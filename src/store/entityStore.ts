import { create } from 'zustand';
import type { 
  Entity, Projectile, VFXParticle, DamageNumber, 
  Chest, Shrine, ShopItem, GoldPickup, HealthPickup, ItemPickup,
  DestructibleBarrel, ExplosiveBarrel, Portal, GroundWeapon, SpikeTrap
} from '../types/interfaces';
import { WEAPONS } from '../data/weapons';

interface EntityState {
  player: Entity | null;
  enemies: Entity[];
  allies: Entity[];
  projectiles: Projectile[];
  particles: VFXParticle[];
  damageNumbers: DamageNumber[];
  chests: Chest[];
  shrines: Shrine[];
  shopItems: ShopItem[];

  goldPickups: GoldPickup[];
  healthPickups: HealthPickup[];
  itemPickups: ItemPickup[];
  destructibleBarrels: DestructibleBarrel[];
  explosiveBarrels: ExplosiveBarrel[];
  groundWeapons: GroundWeapon[];
  spikeTraps: SpikeTrap[];
  portal: Portal | null;
  cameraShake: number; // Cường độ rung camera hiện tại

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
  
  addGoldPickup: (g: GoldPickup) => void;
  removeGoldPickup: (id: string) => void;

  addHealthPickup: (h: HealthPickup) => void;
  removeHealthPickup: (id: string) => void;

  addItemPickup: (i: ItemPickup) => void;
  removeItemPickup: (id: string) => void;
  
  addDestructibleBarrel: (b: DestructibleBarrel) => void;
  removeDestructibleBarrel: (id: string) => void;
  addExplosiveBarrel: (b: ExplosiveBarrel) => void;
  removeExplosiveBarrel: (id: string) => void;
  
  addGroundWeapon: (w: GroundWeapon) => void;
  removeGroundWeapon: (id: string) => void;
  
  addSpikeTrap: (t: SpikeTrap) => void;
  setSpikeTraps: (t: SpikeTrap[]) => void;
  
  addChest: (c: Chest) => void;
  openChest: (id: string) => void;
  addShrine: (s: Shrine) => void;
  useShrine: (id: string) => void;
  addShopItem: (s: ShopItem) => void;
  purchaseShopItem: (id: string) => void;
  setPortal: (portal: Portal | null) => void;
  setCameraShake: (intensity: number) => void;
  
  clearRoomEntities: () => void;
  spawnRoomElements: (roomType: string) => void;
}

export const useEntityStore = create<EntityState>((set) => ({
  player: null,
  enemies: [],
  allies: [],
  projectiles: [],
  particles: [],
  damageNumbers: [],
  chests: [],
  shrines: [],
  shopItems: [],

  goldPickups: [],
  healthPickups: [],
  itemPickups: [],
  destructibleBarrels: [],
  explosiveBarrels: [],
  groundWeapons: [],
  spikeTraps: [],
  portal: null,
  cameraShake: 0,

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

  addGoldPickup: (g) => set((state) => ({ goldPickups: [...state.goldPickups, g] })),
  
  removeGoldPickup: (id) => set((state) => ({
    goldPickups: state.goldPickups.filter(g => g.id !== id)
  })),


  addHealthPickup: (h) => set((state) => ({ healthPickups: [...state.healthPickups, h] })),
  
  removeHealthPickup: (id) => set((state) => ({
    healthPickups: state.healthPickups.filter(h => h.id !== id)
  })),

  addItemPickup: (i) => set((state) => ({ itemPickups: [...state.itemPickups, i] })),
  
  removeItemPickup: (id) => set((state) => ({
    itemPickups: state.itemPickups.filter(i => i.id !== id)
  })),

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
  
  purchaseShopItem: (id) => set((state) => ({
    shopItems: state.shopItems.map(si => si.id === id ? { ...si, purchased: true } : si)
  })),

  setPortal: (portal) => set({ portal }),

  setCameraShake: (cameraShake) => set({ cameraShake }),

  clearRoomEntities: () => set({
    enemies: [],
    allies: [],
    projectiles: [],
    particles: [],
    damageNumbers: [],
    chests: [],
    shrines: [],
    shopItems: [],
    goldPickups: [],
    healthPickups: [],
    itemPickups: [],
    destructibleBarrels: [],
    explosiveBarrels: [],
    groundWeapons: [],
    spikeTraps: [],
    portal: null
  }),

  spawnRoomElements: (roomType) => {
    const chests: Chest[] = [];
    const shrines: Shrine[] = [];
    const shopItems: ShopItem[] = [];
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

      // Sinh bẫy gai ngẫu nhiên
      const trapCount = 2 + Math.floor(Math.random() * 4); // 2 - 5 bẫy
      for (let i = 0; i < trapCount; i++) {
        // Offset thời gian active để các bẫy thò lên thụt xuống không cùng lúc
        const offsetTimer = Math.random() * 2000;
        spikeTraps.push({
          id: `spiketrap_${i}_${Date.now()}`,
          x: getRandomCoord(250, 650),
          y: getRandomCoord(200, 500),
          radius: 25,
          active: Math.random() > 0.5,
          nextToggleTime: performance.now() + 1000 + offsetTimer,
          damage: 1
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

    set({
      chests,
      shrines,
      shopItems,
      destructibleBarrels,
      explosiveBarrels,
      groundWeapons,
      spikeTraps,
      portal: null
    });
  }
}));
