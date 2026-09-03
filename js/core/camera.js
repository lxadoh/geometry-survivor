class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vw = 0;
    this.vh = 0;
    this.shakeA = 0;
    this.shakeT = 0;
    this.shakeD = 1;
    this.ox = 0;
    this.oy = 0;
  }

  resize(w, h) { this.vw = w; this.vh = h; }

  snap(x, y) { this.x = x; this.y = y; this.clamp(); }

  follow(x, y, dt) {
    const k = 1 - Math.pow(0.001, dt);
    this.x += (x - this.x) * k;
    this.y += (y - this.y) * k;
    this.clamp();
  }

  clamp() {
    const W = CONFIG.world.width, H = CONFIG.world.height;
    this.x = this.vw >= W ? W / 2 : clamp(this.x, this.vw / 2, W - this.vw / 2);
    this.y = this.vh >= H ? H / 2 : clamp(this.y, this.vh / 2, H - this.vh / 2);
  }

  shake(a, t) {
    this.shakeA = Math.max(this.shakeA, a);
    this.shakeD = Math.max(this.shakeD, t);
    this.shakeT = Math.max(this.shakeT, t);
  }

  update(dt) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const k = Math.max(0, this.shakeT / this.shakeD);
      this.ox = (Math.random() * 2 - 1) * this.shakeA * k;
      this.oy = (Math.random() * 2 - 1) * this.shakeA * k;
    } else {
      this.ox = 0;
      this.oy = 0;
      this.shakeA = 0;
    }
  }

  apply(ctx) {
    ctx.translate(
      Math.round(this.vw / 2 - this.x + this.ox),
      Math.round(this.vh / 2 - this.y + this.oy)
    );
  }
}
