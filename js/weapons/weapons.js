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
        ? this.conf.interval * game.player.intervalMul
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
    AudioMan.shoot();
    const s = this.stats;
    const base = Math.atan2(target.y - p.y, target.x - p.x);
    for (let i = 0; i < s.count; i++) {
      const a = base + (i - (s.count - 1) / 2) * 0.45;
      game.spawnBullet(p.x, p.y, a, {
        kind: 'blade',
        damage: Math.round(s.damage * p.damageMul),
        speed: s.speed,
        radius: s.radius,
        life: 4,
        pierce: 99,
        bounces: s.bounces || 0,
      });
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
    const R = s.ring, r = CONFIG.orbit.ballRadius;
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
            AudioMan.orbitHit();
            if (!LOWFX) game.particles.burst(bx, by, 4, '#b7a8ff', { speed: 120, life: 0.25, size: 2 });
            e.orbitCd = CONFIG.orbit.hitCd * p.intervalMul;
          }
        }
    }
  }

  draw(ctx, game) {
    const p = game.player;
    const s = this.stats;
    const R = s.ring, r = CONFIG.orbit.ballRadius;
    ctx.strokeStyle = 'rgba(157,140,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, R, 0, TAU);
    ctx.stroke();
    if (!LOWFX) GlowSprites.draw(ctx, '#b7a8ff', p.x, p.y, R * 0.5, 0.1);
    for (let i = 0; i < s.count; i++) {
      const a = this.angle + i * TAU / s.count;
      if (!LOWFX) {
        for (let k = 1; k <= 3; k++) {
          const ga = a - k * 0.16;
          ctx.globalAlpha = 0.2 - k * 0.05;
          ctx.fillStyle = '#b7a8ff';
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(ga) * R, p.y + Math.sin(ga) * R, r * (1 - k * 0.18), 0, TAU);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      const bx = p.x + Math.cos(a) * R;
      const by = p.y + Math.sin(a) * R;
      GlowSprites.draw(ctx, '#b7a8ff', bx, by, r * 2.4, 0.55);
      ctx.fillStyle = '#b7a8ff';
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.4, 0, TAU);
      ctx.fill();
    }
  }
}

class ScatterWeapon extends Weapon {
  fire(game) {
    const p = game.player;
    const s = this.stats;
    const bc = CONFIG.bullets.scatter;
    const base = Math.random() * TAU;
    AudioMan.scatterShot();
    if (!LOWFX) {
      game.rings.push({ x: p.x, y: p.y, r: 10, maxR: 42, life: 0.14, maxLife: 0.14, color: '#ffb35c' });
      game.particles.burst(p.x, p.y, 4, '#ffb35c', { speed: 130, life: 0.18, size: 2 });
    }
    for (let i = 0; i < s.count; i++) {
      const a = base + (i - (s.count - 1) / 2) * s.spread;
      game.spawnBullet(p.x, p.y, a, {
        kind: 'scatter',
        damage: Math.round(s.damage * p.damageMul),
        speed: bc.speed,
        radius: s.radius,
        life: bc.life,
        pierce: 0,
      });
    }
    return true;
  }
}

class LightningWeapon extends Weapon {
  fire(game) {
    const cam = game.camera;
    const cands = [];
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (Math.abs(e.x - cam.x) < cam.vw / 2 + 40 && Math.abs(e.y - cam.y) < cam.vh / 2 + 40) {
        cands.push(e);
      }
    }
    if (cands.length === 0) return false;
    const s = this.stats;
    shuffle(cands);
    const n = Math.min(s.count, cands.length);
    for (let i = 0; i < n; i++) {
      game.lightningStrike(cands[i], Math.round(s.damage * game.player.damageMul), s.radius);
    }
    return true;
  }
}

class ShockwaveWeapon extends Weapon {
  fire(game) {
    const s = this.stats;
    game.castShockwave(s.radius, Math.round(s.damage * game.player.damageMul));
    return true;
  }
}

const WEAPON_CLASSES = {
  blade: BladeWeapon,
  orbit: OrbitWeapon,
  scatter: ScatterWeapon,
  lightning: LightningWeapon,
  shock: ShockwaveWeapon,
};
