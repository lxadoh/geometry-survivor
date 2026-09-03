class Bullet {
  constructor() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.kind = 'blade'; this.radius = 9; this.life = 1;
    this.pierce = 99; this.damage = 0; this.angle = 0;
    this.hitSet = new Set();
  }

  init(x, y, angle, kind, damage) {
    const cfg = CONFIG.bullets[kind];
    this.x = x; this.y = y; this.angle = angle;
    this.vx = Math.cos(angle) * cfg.speed;
    this.vy = Math.sin(angle) * cfg.speed;
    this.kind = kind;
    this.radius = cfg.radius;
    this.life = cfg.life;
    this.pierce = cfg.pierce;
    this.damage = damage;
    this.hitSet.clear();
  }

  update(dt) {
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
