import { AnimationController } from '../../systems/AnimationController';
import type { AnimConfig } from '../../systems/AnimationController';
import { InputManager } from '../../systems/InputManager';
import { basicAttack, skill1 } from './skills';

const ANIM_REZE: Record<string, AnimConfig> = {
  idle:       { row: 0, frames: 4, fps: 6,  loop: true,  pivot: { x: 0.5, y: 1 } },
  walk:       { row: 1, frames: 6, fps: 10, loop: true,  pivot: { x: 0.5, y: 1 } },
  run:        { row: 2, frames: 6, fps: 14, loop: true,  pivot: { x: 0.5, y: 1 } },
  jump:       { row: 3, frames: 5, fps: 12, loop: false, pivot: { x: 0.5, y: 1 } },
  attack:     { row: 4, frames: 6, fps: 16, loop: false, pivot: { x: 0.5, y: 1 }, hitFrame: 3 },
  hurt:       { row: 5, frames: 3, fps: 18, loop: false, pivot: { x: 0.5, y: 1 } },
  death:      { row: 6, frames: 8, fps: 10, loop: false, pivot: { x: 0.5, y: 1 } },
  victory:    { row: 7, frames: 6, fps: 8,  loop: true,  pivot: { x: 0.5, y: 1 } },
  transform:  { row: 8, frames: 6, fps: 6,  loop: false, pivot: { x: 0.5, y: 1 } }, // Biến hình
};

export class CharacterReze {
  name: string = "Reze (Quỷ Bom)";
  type: string = "Gunner";
  
  maxHP: number = 100;
  hp: number = 100;
  maxMP: number = 200;
  mp: number = 200;
  damage: number = 45;
  defense: number = 15;
  
  speed: number = 300; // Tốc chạy cơ bản
  jumpForce: number = 600;
  gravity: number = 1500;

  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  
  width: number = 125;
  height: number = 167;
  scale: number = 1.0;
  
  onGround: boolean = false;
  facingRight: boolean = true;
  state: string = 'transform'; // Bắt đầu bằng biến hình
  isAlive: boolean = true;

  level: number = 1;
  exp: number = 0;
  expToNext: number = 100;

  cooldowns = { basic_atk: 0, skill1: 0 };
  
  animController: AnimationController;
  trailFrames: { x: number, y: number, alpha: number, flip: boolean, state: string }[] = [];
  flashTimer: number = 0;
  screenShake: number = 0;

  onDeath?: () => void;
  onHit?: (dmg: number) => void;
  onLevelUp?: (lvl: number) => void;
  onAttackEmit?: (box: any) => void;

  constructor(x: number, y: number, spriteSheet: HTMLCanvasElement) {
    this.x = x;
    this.y = y;
    this.animController = new AnimationController(spriteSheet, ANIM_REZE);
    this.animController.play('transform', () => {
      this.state = 'idle';
      this.animController.play('idle');
    });
  }

  update(dt: number, input: InputManager, world: { floorY: number }) {
    this.updateCooldowns(dt);
    
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 30);
    }
    if (this.flashTimer > 0) {
      this.flashTimer = Math.max(0, this.flashTimer - dt);
    }

    if (!this.isAlive) {
      this.animController.update(dt);
      return;
    }

    if (this.state !== 'transform') {
      this.handleInput(input);
    }
    
    this.applyPhysics(dt, world);
    
    // Update Animation State logic
    if (this.state !== 'transform' && this.state !== 'attack' && this.state !== 'hurt' && this.state !== 'death') {
      if (!this.onGround) {
        this.changeState('jump');
      } else if (Math.abs(this.vx) > 0) {
        // Run if moving fast (Skill 1 speed boost maybe), else walk
        this.changeState(Math.abs(this.vx) > this.speed ? 'run' : 'walk');
      } else {
        this.changeState('idle');
      }
    }

    this.animController.update(dt);

    // Motion Trail logic when running/jumping fast
    if (Math.abs(this.vx) > this.speed * 0.8 || Math.abs(this.vy) > this.jumpForce * 0.8) {
      this.trailFrames.unshift({ x: this.x, y: this.y, alpha: 0.5, flip: !this.facingRight, state: this.state });
      if (this.trailFrames.length > 6) this.trailFrames.pop();
    }
    this.trailFrames.forEach(f => f.alpha -= dt * 2);
    this.trailFrames = this.trailFrames.filter(f => f.alpha > 0);
  }

  handleInput(input: InputManager) {
    const rawInput = input.getCharInput();

    // Horizontal Movement
    this.vx = 0;
    if (rawInput.right) {
      this.vx = this.speed;
      this.facingRight = true;
    }
    if (rawInput.left) {
      this.vx = -this.speed;
      this.facingRight = false;
    }

    // Jump
    if (rawInput.jump && this.onGround) {
      this.vy = -this.jumpForce;
      this.onGround = false;
    }

    // Attacks (Tránh ngắt skill khi đang attack/hurt)
    if (this.state !== 'attack' && this.state !== 'hurt') {
      if (rawInput.attack && this.cooldowns.basic_atk <= 0) {
        const box = basicAttack(this);
        this.changeState('attack');
        this.onAttackEmit?.(box);
      } else if (rawInput.skill1 && this.cooldowns.skill1 <= 0) {
        const box = skill1(this);
        if (box) {
          this.changeState('jump'); // Bay lên xả bom
          this.onAttackEmit?.(box);
        }
      }
    }
  }

  applyPhysics(dt: number, world: { floorY: number }) {
    // Tối ưu hóa tunneling: chia substeps nếu tốc độ cao
    const maxStep = 20; // max pixel per step
    const distanceY = Math.abs(this.vy * dt);
    const steps = Math.max(1, Math.ceil(distanceY / maxStep));
    const subDt = dt / steps;

    for (let i = 0; i < steps; i++) {
      this.vy += this.gravity * subDt;
      this.y += this.vy * subDt;

      // Floor collision
      if (this.y >= world.floorY) {
        this.y = world.floorY;
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    }

    this.x += this.vx * dt;
    
    // Giới hạn màn hình đơn giản
    if (this.x < 50) this.x = 50;
    // Tạm bỏ giới hạn phải để chạy tự do hoặc fix sau.
  }

  updateCooldowns(dt: number) {
    this.cooldowns.basic_atk = Math.max(0, this.cooldowns.basic_atk - dt);
    this.cooldowns.skill1 = Math.max(0, this.cooldowns.skill1 - dt);
  }

  changeState(newState: string) {
    if (this.state === newState || this.state === 'death' || this.state === 'transform') return;
    
    this.state = newState;
    this.animController.play(newState, () => {
      // Return to idle after non-looping animations
      if (['attack', 'hurt', 'transform'].includes(newState)) {
        this.state = 'idle';
        this.animController.play('idle');
      }
    });
  }

  takeDamage(amount: number) {
    if (!this.isAlive) return;

    const d = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - d);
    this.onHit?.(d);
    
    this.flashTimer = 0.2; // Flash trắng trong 0.2s
    this.screenShake = 10;

    if (this.hp <= 0) {
      this.isAlive = false;
      this.state = 'death';
      this.animController.play('death');
      this.onDeath?.();
    } else {
      // Đừng ngắt attack nếu đang cast chiêu
      if (this.state !== 'attack' && this.state !== 'transform') {
        this.changeState('hurt');
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, debug: boolean = false) {
    ctx.save();
    
    if (this.screenShake > 0) {
      ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
    }

    // 1. Render Trail (Bóng mờ)
    this.trailFrames.forEach(f => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.alpha);
      ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(3)'; // Bóng màu đỏ lửa xíu
      this.animController.current = f.state; // Temp switch to render correct frame shape
      this.animController.render(ctx, f.x, f.y, this.scale, f.flip);
      ctx.restore();
    });

    // Trả lại current state
    this.animController.current = this.state;

    // 2. Render Main Character with Flash
    ctx.save();
    if (this.flashTimer > 0) {
      ctx.filter = 'brightness(5) contrast(2)';
    }
    this.animController.render(ctx, this.x, this.y, this.scale, !this.facingRight);
    ctx.restore();

    // 3. Debug Hitbox
    if (debug) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
      ctx.fillStyle = 'red';
      ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }
}
