class Particle {
  constructor() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.life = 0; this.maxLife = 1; this.size = 2; this.color = '#fff';
  }
  init(x, y, vx, vy, life, size, color) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = this.maxLife = life; this.size = size; this.color = color;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.1, dt);
    this.vy *= Math.pow(0.1, dt);
    this.life -= dt;
  }
}

class ParticleSystem {
  constructor(max) {
    this.cap = max;
    this.pool = new Pool(() => new Particle());
    this.list = [];
  }

  burst(x, y, count, color, opt) {
    opt = opt || {};
    for (let i = 0; i < count; i++) {
      if (this.list.length >= this.cap) return;
      const p = this.pool.obtain();
      const a = Math.random() * TAU;
      const sp = rand(40, opt.speed || 160);
      p.init(x, y, Math.cos(a) * sp, Math.sin(a) * sp, rand(0.2, opt.life || 0.45), rand(1.5, opt.size || 3.2), color);
      this.list.push(p);
    }
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.update(dt);
      if (p.life <= 0) {
        this.list.splice(i, 1);
        this.pool.release(p);
      }
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    for (const p of this.list) this.pool.release(p);
    this.list.length = 0;
  }
}
