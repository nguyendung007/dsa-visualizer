export class AnimationEngine {
  constructor({ steps, onStep, onDone, speed = 500 }) {
    this.steps = steps;
    this.onStep = onStep;
    this.onDone = onDone;
    this.speed = speed;
    this.index = 0;
    this.timer = null;
    this.playing = false;
  }

  play() {
    if (this.playing) return;
    this.playing = true;
    this._tick();
  }

  _tick() {
    if (!this.playing) return;
    if (this.index >= this.steps.length) {
      this.playing = false;
      this.onDone?.();
      return;
    }
    this.onStep(this.steps[this.index], this.index);
    this.index++;
    this.timer = setTimeout(() => this._tick(), this.speed);
  }

  pause() {
    this.playing = false;
    clearTimeout(this.timer);
  }

  stepForward() {
    if (this.index < this.steps.length) {
      this.onStep(this.steps[this.index], this.index);
      this.index++;
    }
  }

  stepBack() {
    if (this.index > 1) {
      this.index -= 2;
      this.onStep(this.steps[this.index], this.index);
      this.index++;
    }
  }

  reset() {
    this.pause();
    this.index = 0;
    if (this.steps.length > 0) this.onStep(this.steps[0], 0);
  }

  setSpeed(ms) { this.speed = ms; }
  get progress() { return this.steps.length ? this.index / this.steps.length : 0; }
  get total() { return this.steps.length; }
  get current() { return this.index; }
}
