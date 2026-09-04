class Enemy {
  constructor() {
    this.type = 'grunt'; this.x = 0; this.y = 0;
    this.hp = 1; this.maxHp = 1; this.damage = 1;
    this.radius = 10; this.speed = 50; this.xpValue = 1;
    this.color = '#fff'; this.knockMul = 1;
    this.hitFlash = 0; this.kbx = 0; this.kby = 0;
    this.orbitCd = 0; this.angle = 0; this.dead = false;
    this.elite = false; this.isBoss = false;
    this.spin = Math.random() * TAU;
    this.pulse = Math.random() * TAU;
    this.trail = []; this.trailAcc = 0;
  }

  init(type, x, y, hp, damage, opts) {
    const c = CONFIG.enemies[type];
    opts = opts || {};
    this.type = type;
    this.x = x; this.y = y;
    this.hp = this.maxHp = Math.round(hp);
    this.damage = Math.round(damage);
    this.elite = !!opts.elite;
    this.radius = c.radius * (this.elite ? CONFIG.elite.radiusMul : 1);
    this.speed = c.speed * rand(0.9, 1.1) * (this.elite ? CONFIG.elite.speedMul : 1);
    this.xpValue = Math.round(c.xp * (this.elite ? CONFIG.elite.xpMul : 1));
    this.color = c.color;
    this.knockMul = c.knockMul * (this.elite ? 0.5 : 1);
    this.hitFlash = 0; this.kbx = 0; this.kby = 0;
    this.orbitCd = 0; this.angle = 0; this.dead = false;
    this.spin = Math.random() * TAU;
    this.pulse = Math.random() * TAU;
    this.trail.length = 0; this.trailAcc = 0;
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
    this.pulse += dt * 3;
    this.spin += dt * (this.type === 'fast' ? 9 : this.type === 'tank' ? 0.8 : 2.2);

    if (this.type === 'fast' && !LOWFX) {
      this.trailAcc += dt;
      if (this.trailAcc > 0.028) {
        this.trailAcc = 0;
        this.trail.push({ x: this.x, y: this.y, a: this.angle });
        if (this.trail.length > 4) this.trail.shift();
      }
    }
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

    if (!LOWFX) {
      const glowA = 0.45 + 0.2 * Math.sin(this.pulse);
      GlowSprites.draw(ctx, this.color, this.x, this.y, this.radius * 3, glowA);
    }
    if (this.elite) {
      GlowSprites.draw(ctx, '#ffd166', this.x, this.y, this.radius * 2.6, 0.5);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.spin * 0.7);
      ctx.strokeStyle = 'rgba(255,209,102,0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 1.65, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.fillStyle = flash ? '#ffffff' : this.color;

    if (this.type === 'tank') {
      const s = this.radius * 1.6;
      ctx.save();
      ctx.translate(this.x, this.y);
      if (!LOWFX) {
        ctx.save();
        ctx.rotate(this.spin * 0.35);
        ctx.strokeStyle = 'rgba(255,120,110,0.3)';
        ctx.lineWidth = 3;
        ctx.setLineDash([14, 10]);
        ctx.strokeRect(-s * 0.82, -s * 0.82, s * 1.64, s * 1.64);
        ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(-s / 2 + 6, -s / 2 + 6, s - 12, s - 12);
      ctx.fillStyle = flash ? '#ffffff' : '#e86a5e';
      const b = 5;
      ctx.fillRect(-s / 2 + 2, -s / 2 + 2, s * 0.22, b);
      ctx.fillRect(-s / 2 + 2, -s / 2 + 2, b, s * 0.22);
      ctx.fillRect(s / 2 - 2 - s * 0.22, -s / 2 + 2, s * 0.22, b);
      ctx.fillRect(s / 2 - 2 - b, -s / 2 + 2, b, s * 0.22);
      ctx.fillRect(-s / 2 + 2, s / 2 - 2 - b, s * 0.22, b);
      ctx.fillRect(s / 2 - 2 - s * 0.22, s / 2 - 2 - b, s * 0.22, b);
      if (this.hp < this.maxHp * 0.5) {
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.35, -s * 0.2); ctx.lineTo(s * 0.1, s * 0.05); ctx.lineTo(-s * 0.05, s * 0.38);
        ctx.moveTo(s * 0.32, -s * 0.4); ctx.lineTo(s * 0.05, s * 0.1);
        ctx.stroke();
      }
      ctx.restore();
      if (this.hp < this.maxHp) {
        const w = this.radius * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(this.x - w / 2, this.y - this.radius - 15, w, 4);
        ctx.fillStyle = '#ff5b4d';
        ctx.fillRect(this.x - w / 2, this.y - this.radius - 15, w * Math.max(0, this.hp / this.maxHp), 4);
      }
    } else {
      const r = this.radius;
      if (this.type === 'fast' && !LOWFX) {
        for (let i = 0; i < this.trail.length; i++) {
          const tr = this.trail[i];
          const ta = 0.06 + i * 0.055;
          const ts = 1 - (this.trail.length - i) * 0.14;
          ctx.save();
          ctx.translate(tr.x, tr.y);
          ctx.rotate(tr.a);
          ctx.globalAlpha = ta;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.moveTo(r * 1.6 * ts, 0);
          ctx.lineTo(-r * 0.7 * ts, r * 0.5 * ts);
          ctx.lineTo(-r * 0.7 * ts, -r * 0.5 * ts);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.type === 'grunt' && !LOWFX) {
        ctx.save();
        ctx.rotate(this.spin);
        ctx.strokeStyle = 'rgba(255,110,95,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 1.42, 0);
        ctx.lineTo(-r * 1.05, r * 0.82);
        ctx.lineTo(-r * 1.05, -r * 0.82);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
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
