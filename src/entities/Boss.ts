import { AnimationController, BOSS_ANIMATIONS } from '../systems/AnimationController';

export type BossState = 'idle' | 'fly' | 'attackFire' | 'attackClaw' | 'hurt' | 'death' | 'roar';

export class Boss {
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

  state: BossState;
  phase: number; // 1 (100-50%), 2 (50-25%), 3 (25-0%)
  
  animController: AnimationController;
  
  onDeath?: () => void;
  onPhaseChange?: (newPhase: number) => void;
  onAttack?: (attackType: string) => void;

  screenShake: number = 0;

  constructor(x: number, y: number, spriteSheet: HTMLCanvasElement) {
    this.x = x;
    this.y = y;
    this.width = 400;
    this.height = 300;
    this.scale = 1.0;
    this.flipX = false;

    this.maxHP = 5000;
    this.hp = 5000;
    this.damage = 80;
    this.defense = 20;
    this.speed = { x: 0, y: 0 };

    this.state = 'idle';
    this.phase = 1;

    this.animController = new AnimationController(spriteSheet, BOSS_ANIMATIONS);
    this.animController.play('idle');
  }

  changeState(newState: BossState) {
    if (this.state === 'death') return; // Cannot change state if dead
    this.state = newState;
    
    // Auto return to idle/fly after action completes
    this.animController.play(newState, () => {
      if (newState === 'death') return; // Stay dead
      this.changeState(this.phase > 2 ? 'fly' : 'idle');
    });

    if (newState === 'attackFire' || newState === 'attackClaw') {
      this.onAttack?.(newState);
    }
  }

  takeDamage(amount: number) {
    if (this.state === 'death') return;

    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    
    this.screenShake = 15; // Screen shake effect stronger for giant boss

    if (this.hp <= 0) {
      this.changeState('death');
      this.onDeath?.();
    } else {
      // Small chance to flinch/hurt
      if (Math.random() > 0.8 && this.state !== 'attackFire' && this.state !== 'attackClaw') {
        this.changeState('hurt');
      }
      this.checkPhaseTransition();
    }
  }

  checkPhaseTransition() {
    let nextPhase = 1;
    const hpRatio = this.hp / this.maxHP;
    
    if (hpRatio <= 0.25) nextPhase = 3;
    else if (hpRatio <= 0.50) nextPhase = 2;

    if (nextPhase > this.phase) {
      this.phase = nextPhase;
      this.changeState('roar');
      this.onPhaseChange?.(this.phase);
      
      // Phase buffs
      if (this.phase === 2) {
        this.speed.x += 50;
        this.damage += 20;
      } else if (this.phase === 3) {
        this.speed.x += 100;
        this.damage += 40;
      }
    }
  }

  update(deltaTime: number, playerPos?: { x: number, y: number }) {
    this.animController.update(deltaTime);

    if (this.screenShake > 0) {
      this.screenShake -= deltaTime * 30;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    if (this.state === 'death') return;

    // AI Logic placeholder
    if (playerPos) {
      // Face player
      this.flipX = playerPos.x > this.x;

      // Simple move logic
      if (this.state === 'fly' || this.state === 'idle') {
        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 300 && Math.random() < 0.02) { // Increased attack range
          this.changeState(Math.random() > 0.5 ? 'attackClaw' : 'attackFire');
        }
      }
    }
  }

  getHitboxes() {
    // Calculate hitboxes based on flipX (Much larger now)
    const bodyW = 200 * this.scale;
    const bodyH = 200 * this.scale;
    const wingW = 150 * this.scale;
    const wingH = 150 * this.scale;

    const bodyOffset = this.flipX ? -80 : -120;
    const wingOffset = this.flipX ? -200 : 50;

    return {
      bodyBox: { x: this.x + bodyOffset, y: this.y - bodyH, width: bodyW, height: bodyH },
      wingBox: { x: this.x + wingOffset, y: this.y - wingH - 50, width: wingW, height: wingH }
    };
  }

  render(ctx: CanvasRenderingContext2D, debugHitbox: boolean = false) {
    ctx.save();
    
    // Screen shake application
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    this.animController.render(ctx, this.x, this.y, this.scale, this.flipX);

    if (debugHitbox) {
      const boxes = this.getHitboxes();
      
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxes.bodyBox.x, boxes.bodyBox.y, boxes.bodyBox.width, boxes.bodyBox.height);
      
      ctx.strokeStyle = 'blue';
      ctx.strokeRect(boxes.wingBox.x, boxes.wingBox.y, boxes.wingBox.width, boxes.wingBox.height);
      
      // Pivot dot
      ctx.fillStyle = 'yellow';
      ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }
}
