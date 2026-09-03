class Bullet {
  constructor() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.kind = 'blade'; this.radius = 9; this.life = 1;
    this.pierce = 99; this.damage = 0; this.angle = 0;
    this.speed = 400;
    this.bounces = 0;
    this.target = null;
    this.hitSet = new Set();
  }

  init(x, y, angle, params) {
    this.x = x; this.y = y; this.angle = angle;
    this.speed = params.speed;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.kind = params.kind;
    this.radius = params.radius;
    this.life = params.life;
    this.pierce = params.pierce;
    this.damage = params.damage;
    this.bounces = params.bounces || 0;
    this.target = null;
    this.hitSet.clear();
  }

  update(dt) {
    if (this.target) {
      if (this.target.dead || this.hitSet.has(this.target)) {
        this.target = null;
      } else {
        const dx = this.target.x - this.x, dy = this.target.y - this.y;
        const d = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        this.vx = dx / d * this.speed;
        this.vy = dy / d * this.speed;
      }
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    return this.life <= 0;
  }

  draw(ctx) {
    if (this.kind === 'blade') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const s = this.radius / 9;
      ctx.scale(s, s);
      ctx.fillStyle = '#dff4ff';
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(-4, 5.5);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-4, -5.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = '#6fd3ff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, TAU);
      ctx.fill();
    }
  }
}
