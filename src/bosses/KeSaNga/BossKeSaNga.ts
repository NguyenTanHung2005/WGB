import { AnimationController } from '../../systems/AnimationController';
import type { AnimConfig } from '../../systems/AnimationController';

export const ANIM_KE_SA_NGA: Record<string, AnimConfig> = {
  idle:    { row: 0, frames: 4,  fps: 6,  loop: true,  pivot: { x: 0.5, y: 1 } },
  attack:  { row: 1, frames: 8,  fps: 16, loop: false, pivot: { x: 0.5, y: 1 }, hitFrame: 5 },
  hurt:    { row: 2, frames: 3,  fps: 20, loop: false, pivot: { x: 0.5, y: 1 } },
  death:   { row: 3, frames: 8,  fps: 6,  loop: false, pivot: { x: 0.5, y: 1 } },
  special: { row: 4, frames: 10, fps: 16, loop: false, pivot: { x: 0.5, y: 1 }, hitFrame: 7 },
  roar:    { row: 0, frames: 4,  fps: 12, loop: false, pivot: { x: 0.5, y: 1 } } // Reuse idle but faster
};

export type KeSaNgaState = 'idle' | 'attack' | 'hurt' | 'death' | 'special' | 'roar';

export interface Minion {
  x: number;
  y: number;
  hp: number;
  speed: number;
  active: boolean;
}

export interface PoisonPool {
  x: number;
  y: number;
  radius: number;
  duration: number;
}

export class BossKeSaNga {
  name: string = "Kẻ Sa Ngã";
  type: string = "undead";
  
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  flipX: boolean;

  maxHP: number;
  hp: number;
  damage: number;
  defense: number;
  speed: { x: number, y: number };

  state: KeSaNgaState;
  phase: number;
  maxPhase: number = 3;
  
  animController: AnimationController;
  
  screenShake: number = 0;
  trailingHpPercent: number = 100; // Trailing HP bar
  isNight: boolean = false;
  nightTimer: number = 0;
  moveSpeed: number = 40; // Chậm hơn gấu vì là Undead khổng lồ

  minions: Minion[] = [];
  poisonPools: PoisonPool[] = [];

  onDeath?: () => void;
  onPhaseChange?: (newPhase: number) => void;
  onAttack?: (attackType: string) => void;

  constructor(x: number, y: number, spriteSheet: HTMLCanvasElement) {
    this.x = x;
    this.y = y;
    this.width = 400;  // 2000px scaled down if needed, but logic box is 400
    this.height = 333;
    this.scale = 1.0;
    this.flipX = false;

    this.maxHP = 3000;
    this.hp = 3000;
    this.damage = 50;
    this.defense = 10;
    this.speed = { x: 0, y: 0 };

    this.state = 'idle';
    this.phase = 1;

    this.animController = new AnimationController(spriteSheet, ANIM_KE_SA_NGA);
    this.animController.play('idle');
  }

  changeState(newState: KeSaNgaState) {
    if (this.state === 'death') return;
    this.state = newState;
    
    this.animController.play(newState, () => {
      if (newState === 'death') return;
      this.changeState('idle');
    });

    if (newState === 'special' || newState === 'attack') {
      this.onAttack?.(newState);
    }
  }

  takeDamage(amount: number) {
    if (this.state === 'death') return;
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    
    this.screenShake = 15;

    if (this.hp <= 0) {
      this.changeState('death');
      this.onDeath?.();
    } else {
      if (Math.random() > 0.7 && this.state !== 'attack' && this.state !== 'special') {
        this.changeState('hurt');
      }
      this.checkPhaseTransition();
    }
  }

  checkPhaseTransition() {
    const pct = this.hp / this.maxHP;
    const newPhase = pct > 0.5 ? 1 : pct > 0.25 ? 2 : 3;
    
    if (newPhase !== this.phase && this.state !== 'death') {
      this.phase = newPhase;
      this.changeState('roar');
      this.onPhaseChange?.(newPhase);

      // Tăng sức mạnh theo phase
      if (this.phase === 2) {
        this.damage += 20;
        this.defense += 10;
      } else if (this.phase === 3) {
        this.damage += 30;
        this.isNight = true; // Phase cuối tự động kéo màn đêm vĩnh viễn
      }
    }
  }

  update(deltaTime: number, playerPos?: { x: number, y: number }) {
    this.animController.update(deltaTime);

    if (this.screenShake > 0) {
      this.screenShake -= deltaTime * 40;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Trailing HP bar
    const actualPercent = Math.max(0, (this.hp / this.maxHP) * 100);
    if (this.trailingHpPercent > actualPercent) {
      this.trailingHpPercent -= deltaTime * 20;
      if (this.trailingHpPercent < actualPercent) this.trailingHpPercent = actualPercent;
    }

    if (this.state === 'death') return;

    this.updateMovement(deltaTime, playerPos);
    this.updateAI(playerPos);
    this.applySpecialBehavior(deltaTime);
  }

  updateMovement(deltaTime: number, playerPos?: { x: number, y: number }) {
    if (!playerPos || this.state === 'attack' || this.state === 'special' || this.state === 'hurt') return;
    
    const dx = playerPos.x - this.x;
    const dy = playerPos.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 180) {
      const speed = this.moveSpeed * (1 + (this.phase - 1) * 0.25);
      this.x += (dx / dist) * speed * deltaTime;
      this.y += (dy / dist) * speed * deltaTime;
    }
  }

  updateAI(playerPos?: { x: number, y: number }) {
    if (!playerPos) return;

    this.flipX = playerPos.x > this.x;

    if (this.state === 'idle') {
      const dist = Math.hypot(playerPos.x - this.x, playerPos.y - this.y);
      if (Math.random() < 0.01 + (this.phase * 0.01)) {
        if (dist > 300) {
          this.changeState('special'); // Dùng skill từ xa (triệu hồi/độc)
        } else {
          this.changeState('attack');  // Chém cận chiến
        }
      }
    }
  }

  applySpecialBehavior(deltaTime: number) {
    // 1. Logic hồi máu ban đêm
    if (this.isNight) {
      this.nightTimer += deltaTime;
      if (this.nightTimer > 1.0) { // Mỗi giây hồi 1 ít
        this.hp = Math.min(this.maxHP, this.hp + 5 * this.phase);
        this.nightTimer = 0;
      }
    }

    // 2. Logic cập nhật Minion
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const m = this.minions[i];
      if (m.hp <= 0) {
        this.minions.splice(i, 1);
      } else {
        // Cập nhật vị trí minion (giả lập)
        // m.x += m.speed * deltaTime; ...
      }
    }

    // 3. Logic Vũng độc (Poison pool)
    for (let i = this.poisonPools.length - 1; i >= 0; i--) {
      this.poisonPools[i].duration -= deltaTime;
      if (this.poisonPools[i].duration <= 0) {
        this.poisonPools.splice(i, 1);
      }
    }

    // Hit frame logic
    const anim = ANIM_KE_SA_NGA[this.state];
    if (anim && anim.hitFrame === this.animController.frame && this.animController.elapsed < 0.05) {
      if (this.state === 'special') {
        this.spawnMinion();
        this.spawnPoisonPool();
        if (this.phase >= 2) this.isNight = true; // Kéo màn đêm tạm thời
      }
    }
  }

  spawnMinion() {
    this.minions.push({
      x: this.x + (Math.random() - 0.5) * 200,
      y: this.y + (Math.random() - 0.5) * 100,
      hp: 100,
      speed: 100,
      active: true
    });
  }

  spawnPoisonPool() {
    this.poisonPools.push({
      x: this.x + (this.flipX ? 150 : -150),
      y: this.y,
      radius: 80,
      duration: 5.0
    });
  }

  getHitboxes() {
    const offsetX = 20;
    const bodyW = 360 * this.scale;
    const bodyH = 313 * this.scale;
    
    // Khi flipX, hitbox cần được dời lại
    const hbX = this.flipX ? this.x - bodyW + offsetX : this.x - offsetX;
    
    return {
      bodyBox: { x: hbX, y: this.y - bodyH, width: bodyW, height: bodyH }
    };
  }

  render(ctx: CanvasRenderingContext2D, debug: boolean = false) {
    ctx.save();
    
    // Màn đêm (Night mode) overlay
    if (this.isNight && this.state !== 'death') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(-5000, -5000, 10000, 10000); // Lấp toàn màn hình
    }

    // Vẽ Vũng độc
    this.poisonPools.forEach(p => {
      ctx.fillStyle = `rgba(34, 197, 94, ${p.duration > 1 ? 0.4 : p.duration * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 20, p.radius, p.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    this.animController.render(ctx, this.x, this.y, this.scale, this.flipX);

    // Vẽ Minions (Skeleton đơn giản đại diện bằng chấm đỏ)
    this.minions.forEach(m => {
      ctx.fillStyle = '#d4d4d8';
      ctx.fillRect(m.x - 10, m.y - 20, 20, 30);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(m.x - 5, m.y - 15, 4, 4);
      ctx.fillRect(m.x + 1, m.y - 15, 4, 4);
    });

    if (debug) {
      const hb = this.getHitboxes();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.bodyBox.x, hb.bodyBox.y, hb.bodyBox.width, hb.bodyBox.height);
      
      // Vẽ Tâm pivot
      ctx.fillStyle = 'yellow';
      ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }
}
