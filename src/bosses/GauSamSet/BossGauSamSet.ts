import { AnimationController } from '../../systems/AnimationController';
import type { AnimConfig } from '../../systems/AnimationController';

export const ANIM_GAU_SAM_SET: Record<string, AnimConfig> = {
  idle:    { row: 0, frames: 4,  fps: 6,  loop: true,  pivot: { x: 0.5, y: 1 } },
  attack:  { row: 1, frames: 8,  fps: 16, loop: false, pivot: { x: 0.5, y: 1 }, hitFrame: 5 },
  hurt:    { row: 2, frames: 3,  fps: 20, loop: false, pivot: { x: 0.5, y: 1 } },
  death:   { row: 3, frames: 8,  fps: 6,  loop: false, pivot: { x: 0.5, y: 1 } },
  special: { row: 4, frames: 10, fps: 16, loop: false, pivot: { x: 0.5, y: 1 }, hitFrame: 7 },
  roar:    { row: 0, frames: 4,  fps: 12, loop: false, pivot: { x: 0.5, y: 1 } }
};

export type GauSamSetState = 'idle' | 'attack' | 'hurt' | 'death' | 'special' | 'roar';

export interface LightningStrike {
  x: number;
  y: number;
  radius: number;
  delay: number;     // Thời gian chờ trước khi sét đánh (telegraph)
  active: boolean;   // Đã giật sét chưa
  duration: number;  // Thời gian tồn tại hiệu ứng giật sét
}

export class BossGauSamSet {
  name: string = "Gấu sấm sét";
  type: string = "Gấu trắng";
  
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

  state: GauSamSetState;
  phase: number;
  maxPhase: number = 3;
  
  animController: AnimationController;
  
  screenShake: number = 0;
  trailingHpPercent: number = 100; // Trailing HP bar (delayed damage display)
  
  // Biến đếm thời gian triệu hồi sấm sét
  summonTimer: number = 0;
  lightningStrikes: LightningStrike[] = [];
  moveSpeed: number = 60; // Tốc độ di chuyển base

  onDeath?: () => void;
  onPhaseChange?: (newPhase: number) => void;
  onAttack?: (attackType: string) => void;

  constructor(x: number, y: number, spriteSheet: HTMLCanvasElement) {
    this.x = x;
    this.y = y;
    this.width = 400;
    this.height = 333;
    this.scale = 1.0;
    this.flipX = false;

    this.maxHP = 8000;
    this.hp = 8000;
    this.damage = 80;
    this.defense = 10;
    this.speed = { x: 0, y: 0 };

    this.state = 'idle';
    this.phase = 1;

    this.animController = new AnimationController(spriteSheet, ANIM_GAU_SAM_SET);
    this.animController.play('idle');
  }

  changeState(newState: GauSamSetState) {
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
    
    this.screenShake = 10;

    if (this.hp <= 0) {
      this.changeState('death');
      this.onDeath?.();
    } else {
      if (Math.random() > 0.8 && this.state !== 'attack' && this.state !== 'special') {
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

      // Buff phase
      if (this.phase === 2) {
        this.damage += 20;
      } else if (this.phase === 3) {
        this.damage += 40;
        this.defense += 20;
      }
    }
  }

  update(deltaTime: number, playerPos?: { x: number, y: number }) {
    this.animController.update(deltaTime);

    if (this.screenShake > 0) {
      this.screenShake -= deltaTime * 40;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Trailing HP bar - tụt chậm theo sau HP thật
    const actualPercent = Math.max(0, (this.hp / this.maxHP) * 100);
    if (this.trailingHpPercent > actualPercent) {
      this.trailingHpPercent -= deltaTime * 25; // Tốc độ tụt trailing bar
      if (this.trailingHpPercent < actualPercent) this.trailingHpPercent = actualPercent;
    }

    if (this.state === 'death') return;

    this.updateMovement(deltaTime, playerPos);
    this.updateAI(playerPos);
    this.applySpecialBehavior(deltaTime, playerPos);
  }

  updateMovement(deltaTime: number, playerPos?: { x: number, y: number }) {
    if (!playerPos || this.state === 'attack' || this.state === 'special' || this.state === 'hurt') return;
    
    const dx = playerPos.x - this.x;
    const dy = playerPos.y - this.y;
    const dist = Math.hypot(dx, dy);
    
    // Chỉ di chuyển khi cách xa quá 200px
    if (dist > 200) {
      const speed = this.moveSpeed * (1 + (this.phase - 1) * 0.3); // Nhanh hơn theo phase
      this.x += (dx / dist) * speed * deltaTime;
      this.y += (dy / dist) * speed * deltaTime;
    }
  }

  updateAI(playerPos?: { x: number, y: number }) {
    if (!playerPos) return;

    this.flipX = playerPos.x > this.x;

    if (this.state === 'idle') {
      const dist = Math.hypot(playerPos.x - this.x, playerPos.y - this.y);
      if (Math.random() < 0.02) {
        if (dist > 300) {
          this.changeState('special'); // Triệu hồi sấm sét
        } else {
          this.changeState('attack');  // Đánh cận chiến
        }
      }
    }
  }

  applySpecialBehavior(deltaTime: number, playerPos?: { x: number, y: number }) {
    // 1. Tự động gọi sét mỗi 10 giây (Auto-cast)
    this.summonTimer += deltaTime;
    if (this.summonTimer >= 10.0) {
      this.summonTimer = 0;
      if (this.state === 'idle') this.changeState('special');
    }

    // 2. Xử lý các tia sét (Lightning strikes)
    for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
      const strike = this.lightningStrikes[i];
      
      if (!strike.active) {
        strike.delay -= deltaTime;
        if (strike.delay <= 0) {
          strike.active = true; // Kích hoạt giật sét!
          this.screenShake = 20; // Rung màn hình cực mạnh
        }
      } else {
        strike.duration -= deltaTime;
        if (strike.duration <= 0) {
          this.lightningStrikes.splice(i, 1);
        }
      }
    }

    // Hit frame logic cho Animation
    const anim = ANIM_GAU_SAM_SET[this.state];
    if (anim && anim.hitFrame === this.animController.frame && this.animController.elapsed < 0.05) {
      if (this.state === 'special' && playerPos) {
        // Gọi sấm sét ngay dưới chân player (hoặc ngẫu nhiên xung quanh)
        this.spawnLightning(playerPos.x, playerPos.y);
        
        // Phase 2, 3 gọi thêm sét ngẫu nhiên
        if (this.phase >= 2) this.spawnLightning(playerPos.x + 150, playerPos.y + 100);
        if (this.phase === 3) this.spawnLightning(playerPos.x - 150, playerPos.y - 100);
      }
    }
  }

  spawnLightning(targetX: number, targetY: number) {
    this.lightningStrikes.push({
      x: targetX,
      y: targetY,
      radius: 100,
      delay: 1.2,    // Cảnh báo đỏ 1.2 giây
      active: false,
      duration: 0.5  // Sét lưu lại 0.5 giây
    });
  }

  getHitboxes() {
    const offsetX = 20;
    const bodyW = 300 * this.scale;
    const bodyH = 250 * this.scale;
    
    const hbX = this.flipX ? this.x - bodyW + offsetX : this.x - offsetX;
    
    return {
      bodyBox: { x: hbX, y: this.y - bodyH, width: bodyW, height: bodyH }
    };
  }

  render(ctx: CanvasRenderingContext2D, debug: boolean = false) {
    ctx.save();
    
    // Rung màn hình
    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    // Render Sấm Sét (Dưới đất)
    this.lightningStrikes.forEach(s => {
      ctx.save();
      if (!s.active) {
        // Telegraph - Cảnh báo đỏ
        ctx.fillStyle = `rgba(220, 38, 38, ${0.1 + (1.2 - s.delay)})`; // Đậm dần
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.radius, s.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Đã giật sét - Hình ảnh vụ nổ sét
        ctx.fillStyle = 'rgba(253, 224, 71, 0.6)';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, s.radius * 1.2, s.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Vẽ tia chớp giáng xuống
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 15;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#fde047';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - 1000); // Sét từ trời đánh xuống
        ctx.lineTo(s.x + (Math.random()-0.5)*50, s.y - 500);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Render Boss
    this.animController.render(ctx, this.x, this.y, this.scale, this.flipX);

    // Hitbox Debug
    if (debug) {
      const hb = this.getHitboxes();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.bodyBox.x, hb.bodyBox.y, hb.bodyBox.width, hb.bodyBox.height);
      
      ctx.fillStyle = 'yellow';
      ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }
}
