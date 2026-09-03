class Bullet {
  constructor() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.kind = 'blade'; this.radius = 9; this.life = 1;
    this.pierce = 99; this.damage = 0; this.angle = 0;
    this.speed = 400;
    this.boomerang = false;
    this.out = 0;
    this.phase = 0;
    this.traveled = 0;
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
    this.boomerang = !!params.boomerang;
    this.out = params.out || 0;
    this.phase = 0;
    this.traveled = 0;
    this.hitSet.clear();
  }

  update(dt, player) {
    if (this.boomerang && this.phase === 0) {
      this.traveled += this.speed * dt;
      if (this.traveled >= this.out) {
        this.phase = 1;
        this.hitSet.clear();
      }
    }
    if (this.phase === 1 && player) {
      const dx = player.x - this.x, dy = player.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      this.angle = Math.atan2(dy, dx);
      this.vx = dx / d * this.speed;
      this.vy = dy / d * this.speed;
      if (d < 26) this.life = 0;
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
