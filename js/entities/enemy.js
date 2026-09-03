class Enemy {
  constructor() {
    this.type = 'grunt'; this.x = 0; this.y = 0;
    this.hp = 1; this.maxHp = 1; this.damage = 1;
    this.radius = 10; this.speed = 50; this.xpValue = 1;
    this.color = '#fff'; this.knockMul = 1;
    this.hitFlash = 0; this.kbx = 0; this.kby = 0;
    this.orbitCd = 0; this.angle = 0; this.dead = false;
  }

  init(type, x, y, hp, damage) {
    const c = CONFIG.enemies[type];
    this.type = type;
    this.x = x; this.y = y;
    this.hp = this.maxHp = hp;
    this.damage = damage;
    this.radius = c.radius;
    this.speed = c.speed * rand(0.9, 1.1);
    this.xpValue = c.xp;
    this.color = c.color;
    this.knockMul = c.knockMul;
    this.hitFlash = 0; this.kbx = 0; this.kby = 0;
    this.orbitCd = 0; this.angle = 0; this.dead = false;
  }

  update(dt, player) {
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    this.angle = Math.atan2(dy, dx);
    this.x += (dx / d) * this.speed * dt + this.kbx * dt;
    this.y += (dy / d) * this.speed * dt + this.kby * dt;
    const damp = Math.pow(0.002, dt);
    this.kbx *= damp;
    this.kby *= damp;
    this.x = clamp(this.x, this.radius, CONFIG.world.width - this.radius);
    this.y = clamp(this.y, this.radius, CONFIG.world.height - this.radius);
    this.hitFlash -= dt;
    this.orbitCd -= dt;
  }

  hurt(dmg, kx, ky) {
    this.hp -= dmg;
    this.hitFlash = 0.12;
    this.kbx += kx * this.knockMul;
    this.kby += ky * this.knockMul;
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx) {
    const flash = this.hitFlash > 0;
    ctx.fillStyle = flash ? '#ffffff' : this.color;

    if (this.type === 'tank') {
      const s = this.radius * 1.6;
      ctx.fillRect(this.x - s / 2, this.y - s / 2, s, s);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(this.x - s / 2 + 5, this.y - s / 2 + 5, s - 10, s - 10);
      if (this.hp < this.maxHp) {
        const w = this.radius * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(this.x - w / 2, this.y - this.radius - 13, w, 4);
        ctx.fillStyle = '#ff5b4d';
        ctx.fillRect(this.x - w / 2, this.y - this.radius - 13, w * Math.max(0, this.hp / this.maxHp), 4);
      }
    } else {
      const r = this.radius;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      if (this.type === 'fast') {
        ctx.moveTo(r * 1.6, 0);
        ctx.lineTo(-r * 0.7, r * 0.5);
        ctx.lineTo(-r * 0.7, -r * 0.5);
      } else {
        ctx.moveTo(r, 0);
        ctx.lineTo(-r * 0.75, r * 0.72);
        ctx.lineTo(-r * 0.75, -r * 0.72);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
