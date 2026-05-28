export interface AnimConfig {
  row: number; // 0-based
  frames: number;
  fps: number;
  loop: boolean;
  pivot: { x: number, y: number };
  hitFrame?: number;
}

export const BOSS_ANIMATIONS: Record<string, AnimConfig> = {
  idle:       { row: 0, frames: 4, fps: 6,  loop: true,  pivot: { x: 0.5, y: 1 } },
  fly:        { row: 1, frames: 6, fps: 12, loop: true,  pivot: { x: 0.5, y: 1 } },
  attackFire: { row: 2, frames: 8, fps: 16, loop: false, pivot: { x: 0.5, y: 1 }, hitFrame: 5 },
  attackClaw: { row: 2, frames: 8, fps: 16, loop: false, pivot: { x: 0.5, y: 1 }, hitFrame: 5 }, // Fallback to attackFire
  hurt:       { row: 3, frames: 3, fps: 20, loop: false, pivot: { x: 0.5, y: 1 } },
  death:      { row: 4, frames: 6, fps: 8,  loop: false, pivot: { x: 0.5, y: 1 } },
  roar:       { row: 0, frames: 4, fps: 8,  loop: false, pivot: { x: 0.5, y: 1 } }, // Fallback to idle
};

export class AnimationController {
  sheet: HTMLCanvasElement;
  anims: Record<string, AnimConfig>;
  current: string;
  frame: number;
  elapsed: number;
  onComplete: (() => void) | null;
  sheetWidth: number;
  sheetHeight: number;

  constructor(spriteSheet: HTMLCanvasElement, animations: Record<string, AnimConfig>) {
    this.sheet = spriteSheet;
    this.anims = animations;
    this.current = 'idle';
    this.frame = 0;
    this.elapsed = 0;
    this.onComplete = null;
    this.sheetWidth = spriteSheet.width;
    this.sheetHeight = spriteSheet.height;
  }

  play(name: string, onComplete?: () => void) {
    if (this.current !== name) {
      this.current = name;
      this.frame = 0;
      this.elapsed = 0;
    }
    this.onComplete = onComplete || null;
  }

  update(deltaTime: number) {
    const anim = this.anims[this.current];
    if (!anim) return;

    this.elapsed += deltaTime;
    const frameDuration = 1 / anim.fps;

    if (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      this.frame++;

      if (this.frame >= anim.frames) {
        if (anim.loop) {
          this.frame = 0;
        } else {
          this.frame = anim.frames - 1; // pause on last frame
          if (this.onComplete) {
            const cb = this.onComplete;
            this.onComplete = null;
            cb();
          }
        }
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, flipX: boolean) {
    const anim = this.anims[this.current];
    if (!anim) return;

    // Sprite sheet has 7 rows, 1000px height -> 150px approx per row, actually it's varied based on frames.
    // In our design:
    // row 0: y=0, height=150, width=250
    // row 1: y=150, height=150, width=166.6
    // row 2: y=300, height=150, width=125
    // row 3: y=450, height=150, width=166.6
    // row 4: y=600, height=150, width=333.3
    // row 5: y=750, height=150, width=125
    // row 6: y=900, height=100, width=250
    // Dynamically calculate row height based on sprite sheet and config
    const totalRows = Math.max(...Object.values(this.anims).map(a => a.row)) + 1;
    const rowHeights = this.sheetHeight / totalRows;
    const fw = this.sheetWidth / anim.frames;
    const fh = rowHeights;
    
    const dpr = window.devicePixelRatio || 1;
    const srcX = this.frame * fw;
    const srcY = anim.row * rowHeights;

    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);

    const logicalFw = fw / dpr;
    const logicalFh = fh / dpr;

    const drawX = -logicalFw * anim.pivot.x * scale;
    const drawY = -logicalFh * anim.pivot.y * scale;

    ctx.drawImage(
      this.sheet,
      srcX, srcY, fw, fh,
      drawX, drawY, logicalFw * scale, logicalFh * scale
    );

    ctx.restore();
  }
}
