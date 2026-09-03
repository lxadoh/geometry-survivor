class Weapon {
  constructor(id) {
    this.id = id;
    this.level = 1;
    this.cd = 0.4;
  }
  get conf() { return CONFIG.weapons[this.id]; }
  get stats() { return this.conf.levels[this.level - 1]; }
  get maxed() { return this.level >= this.conf.levels.length; }

  update(dt, game) {
    this.cd -= dt;
    if (this.cd <= 0) {
      this.cd = this.fire(game)
        ? this.stats.interval * game.player.intervalMul
        : 0.2;
    }
  }

  fire(game) { return false; }
  draw(ctx, game) {}
}

class BladeWeapon extends Weapon {
  fire(game) {
    const p = game.player;
    const target = game.nearestEnemy(p.x, p.y);
    if (!target) return false;
    const s = this.stats;
    const base = Math.atan2(target.y - p.y, target.x - p.x);
    for (let i = 0; i < s.count; i++) {
      const a = base + (i - (s.count - 1) / 2) * 0.14;
      game.spawnBullet(p.x, p.y, a, 'blade', Math.round(s.damage * p.damageMul));
    }
    return true;
  }
}

class OrbitWeapon extends Weapon {
  constructor(id) {
    super(id);
    this.angle = 0;
  }

  update(dt, game) {
    this.angle += dt * CONFIG.orbit.spin;
    const s = this.stats, p = game.player;
    const R = CONFIG.orbit.radius, r = CONFIG.orbit.ballRadius;
    for (let i = 0; i < s.count; i++) {
      const a = this.angle + i * TAU / s.count;
      const bx = p.x + Math.cos(a) * R;
      const by = p.y + Math.sin(a) * R;
      for (const e of game.enemies) {
        if (e.dead || e.orbitCd > 0) continue;
        const rr = e.radius + r;
        if (dist2(bx, by, e.x, e.y) < rr * rr) {
          const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
          game.hurtEnemy(e, Math.round(s.damage * p.damageMul),
            (e.x - p.x) / d * 130, (e.y - p.y) / d * 130);
          e.orbitCd = s.interval * p.intervalMul;
        }
      }
    }
  }

  draw(ctx, game) {
    const p = game.player;
    const s = this.stats;
    const R = CONFIG.orbit.radius, r = CONFIG.orbit.ballRadius;
    ctx.strokeStyle = 'rgba(157,140,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < s.count; i++) {
      const a = this.angle + i * TAU / s.count;
      const bx = p.x + Math.cos(a) * R;
      const by = p.y + Math.sin(a) * R;
      ctx.fillStyle = 'rgba(157,140,255,0.25)';
      ctx.beginPath();
      ctx.arc(bx, by, r + 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#b7a8ff';
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, TAU);
      ctx.fill();
    }
  }
}

class ScatterWeapon extends Weapon {
  fire(game) {
    const p = game.player;
    const s = this.stats;
    const base = Math.random() * TAU;
    for (let i = 0; i < s.count; i++) {
      const a = base + (i - (s.count - 1) / 2) * s.spread;
      game.spawnBullet(p.x, p.y, a, 'scatter', Math.round(s.damage * p.damageMul));
    }
    return true;
  }
}

const WEAPON_CLASSES = {
  blade: BladeWeapon,
  orbit: OrbitWeapon,
  scatter: ScatterWeapon,
};
