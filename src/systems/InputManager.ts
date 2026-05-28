export class InputManager {
  keys: Record<string, boolean>;
  prev: Record<string, boolean>;

  constructor() {
    this.keys = {};
    this.prev = {};
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }

  update() {
    this.prev = { ...this.keys };
  }

  pressed(code: string): boolean {
    return this.keys[code] && !this.prev[code];
  }

  held(code: string): boolean {
    return !!this.keys[code];
  }

  released(code: string): boolean {
    return !this.keys[code] && this.prev[code];
  }

  getCharInput() {
    return {
      left: this.held('ArrowLeft') || this.held('KeyA'),
      right: this.held('ArrowRight') || this.held('KeyD'),
      up: this.held('ArrowUp') || this.held('KeyW'),
      down: this.held('ArrowDown') || this.held('KeyS'),
      jump: this.pressed('Space') || this.pressed('ArrowUp') || this.pressed('KeyW'),
      attack: this.pressed('KeyJ') || this.pressed('KeyZ'),
      skill1: this.pressed('KeyU') || this.pressed('KeyX'),
    };
  }
}
