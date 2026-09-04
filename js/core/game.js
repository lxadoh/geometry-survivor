class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.camera = new Camera();
    this.particles = new ParticleSystem(300);
    this.enemyPool = new Pool(() => new Enemy());
    this.bulletPool = new Pool(() => new Bullet());
    this.gemPool = new Pool(() => new Gem());
    this.enemies = [];
    this.bullets = [];
    this.gems = [];
    this.ebullets = [];
    this.lightnings = [];
    this.shocks = [];
    this.rings = [];
    this._grid = new Map();
    this.player = new Player();
    this.weapons = [];
    this.state = 'menu';
    this.time = 0;
    this.kills = 0;
    this.spawnAcc = 0;
    this.pendingLevels = 0;
    this.spawnMul = 1;
    this.lowQuality = false;
    this.userPaused = false;
    this.viewW = 0;
    this.viewH = 0;
    this.dpr = 1;
    this.paused = false;
    this.bg = new Background();
    this.activeBoss = null;
    this.nextBossTime = CONFIG.boss.schedule[0] * 60;
    this.bossIdx = 0;
    this.bossWarned = false;
    this.bossWarned2 = false;
    this.lastEliteMin = 0;
    this.pendingBossRewards = 0;
    this.slowmo = 0;
    this.whiteFlashV = 0;
    this.resize();
    this.camera.snap(this.player.x, this.player.y);
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.canvas.width = Math.round(this.viewW * this.dpr);
    this.canvas.height = Math.round(this.viewH * this.dpr);
    this.zoom = this.viewH / CONFIG.view.height;
    if (this.viewW / this.zoom > CONFIG.world.width) {
      this.zoom = this.viewW / CONFIG.world.width;
    }
    this.camera.resize(this.viewW / this.zoom, this.viewH / this.zoom);
  }

  startRun() {
    for (const e of this.enemies) { if (!e.isBoss) this.enemyPool.release(e); }
    for (const b of this.bullets) this.bulletPool.release(b);
    for (const g of this.gems) this.gemPool.release(g);
    this.enemies.length = 0;
    this.bullets.length = 0;
    this.gems.length = 0;
    this.ebullets.length = 0;
    this.lightnings.length = 0;
    this.shocks.length = 0;
    this.rings.length = 0;
    this.particles.clear();
    this.player.reset();
    this.weapons = [new WEAPON_CLASSES.blade('blade')];
    this.time = 0;
    this.kills = 0;
    this.spawnAcc = 0;
    this.pendingLevels = 0;
    this.userPaused = false;
    this.activeBoss = null;
    this.nextBossTime = CONFIG.boss.schedule[0] * 60;
    this.bossIdx = 0;
    this.bossWarned = false;
    this.bossWarned2 = false;
    this.lastEliteMin = 0;
    this.pendingBossRewards = 0;
    this.slowmo = 0;
    this.whiteFlashV = 0;
    this.camera.snap(this.player.x, this.player.y);
    this.state = 'playing';
    Screens.hideStart();
    Screens.hideOver();
    HUD.hideBossBar();
    HUD.hideWarn();
    HUD.show();
    Music.start(true);
  }

  toMenu() {
    this.state = 'menu';
    this.userPaused = false;
    HUD.hide();
    HUD.hideBossBar();
    HUD.hideWarn();
    Screens.hidePause();
    Screens.hideOver();
    Screens.showStart(SaveManager.load().best);
    Music.stop();
  }

  tick(dt) {
    if (this.slowmo > 0) {
      this.slowmo -= dt;
      dt *= 0.3;
    }
    if (this.state === 'playing' && !this.paused && !this.userPaused) this.update(dt);
    this.bg.update(dt);
    this.camera.update(dt);
    this.render();
  }

  openPause() {
    if (this.state !== 'playing') return;
    this.userPaused = true;
    AudioMan.click();
    Music.stop();
    Screens.showPause(this.buildInfo());
  }

  closePause() {
    this.userPaused = false;
    Screens.hidePause();
    Music.start();
  }

  buildInfo() {
    const weapons = this.weapons.map(w => ({
      icon: w.id,
      name: CONFIG.weapons[w.id].name,
      lvl: w.level,
    }));
    const passives = [];
    for (const id of Object.keys(this.player.passives)) {
      const n = this.player.passives[id];
      if (n > 0) passives.push({ icon: id, name: CONFIG.passives[id].name, stacks: n });
    }
    return { weapons, passives };
  }

  musicIntensity() {
    if (this.activeBoss && !this.activeBoss.dead) return 4;
    const min = this.time / 60;
    return min < 1 ? 0 : min < 3 ? 1 : min < 6 ? 2 : 3;
  }

  update(dt) {
    this.time += dt;

    this.updateSpawn(dt);
    this.updateEvents();
    Music.setIntensity(this.musicIntensity());
    this.player.update(dt, this.input);
    for (const w of this.weapons) w.update(dt, this);

    for (const b of this.bullets) {
      if (b.update(dt)) continue;
      for (const e of this.enemies) {
        if (e.dead || b.hitSet.has(e)) continue;
        const rr = e.radius + b.radius;
        if (dist2(b.x, b.y, e.x, e.y) < rr * rr) {
          b.hitSet.add(e);
          const d = Math.hypot(b.vx, b.vy) || 1;
          this.hurtEnemy(e, b.damage, b.vx / d * 95, b.vy / d * 95);
          if (b.kind === 'blade') AudioMan.bladeHit();
          if (b.bounces > 0) {
            const next = this.bounceTarget(b, e);
            if (next) {
              b.bounces--;
              b.target = next;
            }
          }
          if (b.pierce-- <= 0) { b.life = 0; break; }
        }
      }
    }

    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.update(dt, p, this);
      const rr = e.radius + p.radius;
      if (dist2(e.x, e.y, p.x, p.y) < rr * rr) {
        this.hurtPlayer(e.damage);
        if (this.state !== 'playing') return;
      }
    }
    this.separateEnemies();

    for (let i = this.ebullets.length - 1; i >= 0; i--) {
      const b = this.ebullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      const rr = b.r + p.radius;
      if (dist2(b.x, b.y, p.x, p.y) < rr * rr) {
        b.life = 0;
        this.hurtPlayer(b.damage);
        if (this.state !== 'playing') return;
      }
      if (b.life <= 0) this.ebullets.splice(i, 1);
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (this.bullets[i].life <= 0) {
        this.bulletPool.release(this.bullets.splice(i, 1)[0]);
      }
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].dead) {
        const e = this.enemies.splice(i, 1)[0];
        if (!e.isBoss) this.enemyPool.release(e);
      }
    }

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (g.update(dt, p)) {
        this.pendingLevels += p.addXp(g.value);
        AudioMan.gem();
        this.particles.burst(p.x, p.y, 3, '#7ee787', { speed: 90, life: 0.25, size: 2 });
        this.gemPool.release(this.gems.splice(i, 1)[0]);
      }
    }

    this.particles.update(dt);
    this.updateFX(dt);
    this.camera.follow(p.x, p.y, dt);

    if (this.pendingBossRewards > 0) {
      this.pendingBossRewards--;
      this.openUpgrade(true);
    } else if (this.pendingLevels > 0) this.openUpgrade();
  }

  hurtPlayer(dmg) {
    const p = this.player;
    if (!p.takeDamage(dmg)) return;
    AudioMan.hurt();
    HUD.damageFlash();
    this.camera.shake(7, 0.25);
    this.particles.burst(p.x, p.y, 10, '#ff6b6b', { speed: 170, life: 0.4, size: 3 });
    if (p.hp <= 0) this.gameOver();
  }

  updateEvents() {
    const min = this.time / 60;
    const mark = Math.floor(min);
    if (mark >= 1 && mark > this.lastEliteMin) {
      this.lastEliteMin = mark;
      if (mark % 3 !== 0) {
        const n = mark >= 4 ? 2 : 1;
        for (let i = 0; i < n; i++) this.spawnElite(pickEnemyType(min));
      }
    }

    if (!this.bossWarned && this.time >= this.nextBossTime - CONFIG.boss.warnTime) {
      this.bossWarned = true;
      const types = ['square', 'triangle', 'core'];
      HUD.showWarn(CONFIG.boss.defs[types[this.bossIdx % 3]].name);
      AudioMan.alarm();
    }
    if (!this.bossWarned2 && this.time >= this.nextBossTime - 3.5) {
      this.bossWarned2 = true;
      AudioMan.alarm();
    }
    if (this.time >= this.nextBossTime) {
      this.bossWarned = false;
      this.bossWarned2 = false;
      this.spawnBoss();
    }
  }

  spawnElite(type) {
    const pos = this.edgeSpawnPos();
    const c = CONFIG.enemies[type];
    const g = CONFIG.growth;
    const min = this.time / 60;
    const late = Math.max(0, min - g.lateStart);
    const hp = c.hp * (1 + g.hp * min + g.hpLate * late * late) * CONFIG.elite.hpMul;
    const dmg = c.damage * (1 + g.dmg * min + g.dmgLate * late * late) * CONFIG.elite.dmgMul;
    const e = this.enemyPool.obtain();
    e.init(type, pos.x, pos.y, hp, dmg, { elite: true });
    this.enemies.push(e);
    this.particles.burst(pos.x, pos.y, 8, '#ffd166', { speed: 160, life: 0.4, size: 3 });
  }

  spawnEnemyAt(type, x, y) {
    const c = CONFIG.enemies[type];
    const g = CONFIG.growth;
    const min = this.time / 60;
    const late = Math.max(0, min - g.lateStart);
    const hp = Math.round(c.hp * (1 + g.hp * min + g.hpLate * late * late));
    const dmg = Math.round(c.damage * (1 + g.dmg * min + g.dmgLate * late * late));
    x = clamp(x, 30, CONFIG.world.width - 30);
    y = clamp(y, 30, CONFIG.world.height - 30);
    const e = this.enemyPool.obtain();
    e.init(type, x, y, hp, dmg);
    this.enemies.push(e);
    this.particles.burst(x, y, 6, c.color, { speed: 130, life: 0.3, size: 2.4 });
  }

  spawnBoss() {
    const types = ['square', 'triangle', 'core'];
    const id = types[this.bossIdx % 3];
    const def = CONFIG.boss.defs[id];
    const cycleMul = Math.pow(CONFIG.boss.hpCycleMul, Math.floor(this.bossIdx / 3));
    const min = this.time / 60;
    const g = CONFIG.growth;
    const late = Math.max(0, min - g.lateStart);
    const dmg = def.damage * (1 + g.dmg * min + g.dmgLate * late * late) * 0.75;
    const pos = this.edgeSpawnPos();
    const boss = new Boss();
    boss.init(def, id, pos.x, pos.y, def.hp * cycleMul, dmg);
    this.enemies.push(boss);
    this.activeBoss = boss;
    this.bossIdx++;
    if (this.bossIdx < CONFIG.boss.schedule.length) {
      this.nextBossTime = CONFIG.boss.schedule[this.bossIdx] * 60;
    } else {
      this.nextBossTime += CONFIG.boss.repeatEvery;
    }
    HUD.showBossBar(def.name);
    HUD.hideWarn();
    this.whiteFlashV = 0.3;
    this.camera.shake(12, 0.5);
    AudioMan.bossSpawn();
    this.rings.push({ x: boss.x, y: boss.y, r: 30, maxR: 380, life: 0.5, maxLife: 0.5, color: def.color });
    this.particles.burst(boss.x, boss.y, 26, def.color, { speed: 300, life: 0.7, size: 4 });
  }

  bossDeath(e) {
    this.activeBoss = null;
    HUD.hideBossBar();
    this.slowmo = 0.75;
    this.whiteFlashV = 0.35;
    this.camera.shake(12, 0.6);
    AudioMan.bossDie();
    this.particles.burst(e.x, e.y, 36, e.color, { speed: 320, life: 0.8, size: 4.5 });
    this.particles.burst(e.x, e.y, 18, '#ffd166', { speed: 220, life: 0.9, size: 3.5 });
    this.rings.push({ x: e.x, y: e.y, r: 20, maxR: 340, life: 0.5, maxLife: 0.5, color: '#ffd166' });
    const G = CONFIG.gemRain;
    for (let i = 0; i < G.count; i++) {
      const a = Math.random() * TAU;
      const d = rand(20, 150);
      this.spawnGem(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, G.value);
    }
    this.pendingBossRewards++;
  }

  spawnEnemyBullet(x, y, angle, speed) {
    if (this.ebullets.length >= CONFIG.boss.bullet.max) return;
    const b = CONFIG.boss.bullet;
    this.ebullets.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: b.radius, life: b.life, damage: b.damage,
    });
  }

  lightningStrike(enemy, damage, radius) {
    const cam = this.camera;
    const topY = cam.y - cam.vh / 2 - 80;
    const n = 6;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push({
        x: enemy.x + (1 - t) * rand(-46, 46) + (t < 0.9 ? rand(-8, 8) : 0),
        y: topY + (enemy.y - topY) * t,
      });
    }
    const branches = [];
    const bn = 1 + ((Math.random() * 2) | 0);
    for (let k = 0; k < bn; k++) {
      const bi = 2 + ((Math.random() * 3) | 0);
      let bx = pts[bi].x, by = pts[bi].y;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const bpts = [{ x: bx, y: by }];
      for (let i = 0; i < 3; i++) {
        bx += dir * rand(16, 44);
        by += rand(20, 54);
        bpts.push({ x: bx, y: by });
      }
      branches.push(bpts);
    }
    this.lightnings.push({ pts, branches, life: 0.22, maxLife: 0.22 });
    this.rings.push({ x: enemy.x, y: enemy.y, r: 12, maxR: radius, life: 0.28, maxLife: 0.28, color: '#ffe066' });
    this.particles.burst(enemy.x, enemy.y, 12, '#ffe066', { speed: 240, life: 0.35, size: 2.6 });
    this.whiteFlashV = Math.max(this.whiteFlashV, 0.08);
    AudioMan.zap();
    const r2 = radius * radius;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (dist2(e.x, e.y, enemy.x, enemy.y) <= r2) {
        this.hurtEnemy(e, damage, 0, 0);
      }
    }
    this.camera.shake(3, 0.12);
  }

  castShockwave(maxR, damage) {
    const p = this.player;
    this.shocks.push({
      x: p.x, y: p.y, r: 18, maxR, speed: 560,
      damage, hitSet: new Set(),
    });
    this.particles.burst(p.x, p.y, 12, '#6dd0ff', { speed: 240, life: 0.35, size: 2.6 });
    AudioMan.boom();
  }

  updateFX(dt) {
    this.whiteFlashV = Math.max(0, this.whiteFlashV - dt * 1.8);
    for (let i = this.lightnings.length - 1; i >= 0; i--) {
      const l = this.lightnings[i];
      l.life -= dt;
      if (l.life <= 0) this.lightnings.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.r = 12 + (r.maxR - 12) * (1 - r.life / r.maxLife);
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    for (let i = this.shocks.length - 1; i >= 0; i--) {
      const s = this.shocks[i];
      s.r += s.speed * dt;
      for (const e of this.enemies) {
        if (e.dead || s.hitSet.has(e)) continue;
        const d = Math.hypot(e.x - s.x, e.y - s.y);
        if (Math.abs(d - s.r) < 26 + e.radius) {
          s.hitSet.add(e);
          const kx = d > 1 ? (e.x - s.x) / d : 0;
          const ky = d > 1 ? (e.y - s.y) / d : -1;
          this.hurtEnemy(e, s.damage, kx * 170, ky * 170);
        }
      }
      if (s.r >= s.maxR) this.shocks.splice(i, 1);
    }
  }

  setLowQuality() {
    if (this.lowQuality) return;
    this.lowQuality = true;
    LOWFX = true;
    this.bg.setLowQuality();
    this.particles.cap = 120;
    this.spawnMul = 0.7;
  }

  updateSpawn(dt) {
    const min = this.time / 60;
    const rate = CONFIG.spawn.baseRate + CONFIG.spawn.ratePerMin * min;
    this.spawnAcc += rate * dt;
    let cap = CONFIG.spawn.cap;
    if (min > CONFIG.spawn.capLateStart) {
      cap = Math.min(
        CONFIG.spawn.cap + (min - CONFIG.spawn.capLateStart) * CONFIG.spawn.capLateRate,
        CONFIG.spawn.capMax
      );
    }
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.enemies.length >= Math.round(cap * this.spawnMul)) break;
      this.spawnEnemy(min);
    }
  }

  spawnEnemy(min) {
    const type = pickEnemyType(min);
    const pos = this.edgeSpawnPos();
    const c = CONFIG.enemies[type];
    const g = CONFIG.growth;
    const late = Math.max(0, min - g.lateStart);
    const hp = Math.round(c.hp * (1 + g.hp * min + g.hpLate * late * late));
    const dmg = Math.round(c.damage * (1 + g.dmg * min + g.dmgLate * late * late));
    const e = this.enemyPool.obtain();
    e.init(type, pos.x, pos.y, hp, dmg);
    this.enemies.push(e);
  }

  edgeSpawnPos() {
    const m = 60;
    const cam = this.camera;
    const left = cam.x - cam.vw / 2 - m, right = cam.x + cam.vw / 2 + m;
    const top = cam.y - cam.vh / 2 - m, bottom = cam.y + cam.vh / 2 + m;
    const W = CONFIG.world.width, H = CONFIG.world.height;
    const p = this.player;
    let x = W / 2, y = 0;
    for (let tries = 0; tries < 8; tries++) {
      const side = (Math.random() * 4) | 0;
      if (side === 0) { x = rand(left, right); y = top; }
      else if (side === 1) { x = rand(left, right); y = bottom; }
      else if (side === 2) { x = left; y = rand(top, bottom); }
      else { x = right; y = rand(top, bottom); }
      x = clamp(x, 20, W - 20);
      y = clamp(y, 20, H - 20);
      if (dist2(x, y, p.x, p.y) > 280 * 280) return { x, y };
    }
    return { x, y };
  }

  separateEnemies() {
    const CS = 72, grid = this._grid;
    grid.clear();
    for (const e of this.enemies) {
      if (e.dead) continue;
      const k = ((e.x / CS) | 0) * 4096 + ((e.y / CS) | 0);
      let arr = grid.get(k);
      if (!arr) { arr = []; grid.set(k, arr); }
      arr.push(e);
    }
    for (const arr of grid.values()) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j];
          if (a.isBoss && b.isBoss) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const rr = a.radius + b.radius;
          const d2v = dx * dx + dy * dy;
          if (d2v > 0.01 && d2v < rr * rr) {
            const d = Math.sqrt(d2v);
            const push = (rr - d) / d;
            if (a.isBoss) {
              b.x += dx * push;
              b.y += dy * push;
            } else if (b.isBoss) {
              a.x -= dx * push;
              a.y -= dy * push;
            } else {
              const half = push * 0.5;
              const wA = b.radius / rr, wB = a.radius / rr;
              a.x -= dx * half * wA;
              a.y -= dy * half * wA;
              b.x += dx * half * wB;
              b.y += dy * half * wB;
            }
          } else if (d2v <= 0.01) {
            a.x -= 0.4; b.x += 0.4;
          }
        }
      }
    }
  }

  nearestEnemy(x, y) {
    let best = null, bestD = Infinity;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist2(x, y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  spawnBullet(x, y, angle, params) {
    const b = this.bulletPool.obtain();
    b.init(x, y, angle, params);
    this.bullets.push(b);
  }

  bounceTarget(b, from) {
    const R = 280;
    let best = null, bestD = R * R;
    for (const e of this.enemies) {
      if (e.dead || e === from || b.hitSet.has(e)) continue;
      const d = dist2(from.x, from.y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  spawnGem(x, y, value) {
    x = clamp(x, 24, CONFIG.world.width - 24);
    y = clamp(y, 24, CONFIG.world.height - 24);
    const g = this.gemPool.obtain();
    g.init(x, y, value);
    this.gems.push(g);
  }

  hurtEnemy(e, dmg, kx, ky) {
    e.hurt(dmg, kx, ky);
    this.particles.burst(e.x, e.y, 3, '#ffffff', { speed: 130, life: 0.22, size: 2.2 });
    if (e.isBoss) AudioMan.bossHit();
    if (e.dead) {
      this.kills++;
      AudioMan.pop();
      if (e.isBoss) {
        this.bossDeath(e);
      } else {
        this.spawnGem(e.x, e.y, e.xpValue);
        this.particles.burst(e.x, e.y, 9, e.color, { speed: 200, life: 0.45, size: 3.2 });
        if (e.elite) {
          AudioMan.eliteDie();
          this.camera.shake(4, 0.2);
          this.particles.burst(e.x, e.y, 16, '#ffd166', { speed: 260, life: 0.6, size: 3.5 });
        }
      }
    }
  }

  openUpgrade(gold) {
    this.state = 'levelup';
    AudioMan.levelup();
    const choices = this.buildChoices(gold);
    UpgradeUI.open(choices, c => {
      AudioMan.click();
      this.applyChoice(c);
      if (gold) this.applyChoice(c);
      UpgradeUI.close();
      if (!gold) this.pendingLevels--;
      if (this.pendingLevels > 0) this.openUpgrade();
      else this.state = 'playing';
    }, gold);
  }

  buildChoices(gold) {
    const pool = [];
    const owned = new Map(this.weapons.map(w => [w.id, w]));
    const pre = gold ? '✦ 战利品 · ' : '';
    for (const id of Object.keys(CONFIG.weapons)) {
      const w = owned.get(id);
      const add = gold ? 2 : 1;
      if (!w) pool.push(this.weaponChoice(id, 0, gold));
      else if (w.level + add <= w.conf.levels.length) pool.push(this.weaponChoice(id, w.level, gold));
    }
    for (const id of Object.keys(CONFIG.passives)) {
      const c = CONFIG.passives[id];
      const st = this.player.passives[id];
      const add = gold ? 2 : 1;
      if (st + add <= c.max) {
        pool.push({
          kind: 'passive', id, icon: id, name: c.name,
          tag: pre + '被动 · 叠加 ' + (st + add) + ' 层',
          desc: c.desc + '（当前 ' + st + ' 层' + (gold ? '，金卡一次 +2 层' : '') + '）',
        });
      }
    }
    shuffle(pool);
    const picks = pool.slice(0, 3);
    if (picks.length === 0) {
      picks.push({
        kind: 'heal', icon: 'heal',
        name: gold ? '完全修复' : '紧急维修',
        tag: pre + '特殊',
        desc: gold ? '立即回复 60 生命' : '立即回复 30 生命',
      });
    }
    return picks;
  }

  weaponChoice(id, curLvl, gold) {
    const w = CONFIG.weapons[id];
    const pre = gold ? '✦ 战利品 · ' : '';
    let tag, desc;
    if (curLvl === 0) {
      tag = pre + '新武器';
      desc = w.desc || '全新武器加入你的战斗';
    } else {
      const a = w.levels[curLvl - 1], b = w.levels[Math.min(curLvl + (gold ? 1 : 0), w.levels.length - 1)];
      tag = pre + '武器 LV' + curLvl + ' → LV' + Math.min(curLvl + (gold ? 2 : 1), w.levels.length);
      const parts = [];
      if (a.damage !== b.damage) parts.push('伤害 ' + a.damage + '→' + b.damage);
      if ((a.count || 0) !== (b.count || 0)) parts.push('数量 ' + a.count + '→' + b.count);
      if ((a.radius || 0) !== (b.radius || 0)) {
        parts.push((id === 'lightning' ? '范围 ' : '体积 ') + a.radius + '→' + b.radius);
      }
      if ((a.ring || 0) !== (b.ring || 0)) parts.push('环绕半径 ' + a.ring + '→' + b.ring);
      if (!a.bounces && b.bounces) parts.push('解锁弹射：命中后跳向下一个敌人');
      else if ((a.bounces || 0) < (b.bounces || 0)) parts.push('弹射 ' + a.bounces + '→' + b.bounces + ' 次');
      desc = parts.join(' · ') || '属性提升';
    }
    return { kind: 'weapon', id, icon: id, name: w.name, tag, desc };
  }

  applyChoice(c) {
    if (c.kind === 'weapon') {
      const owned = this.weapons.find(w => w.id === c.id);
      if (owned) {
        if (owned.level < owned.conf.levels.length) owned.level++;
      } else {
        this.weapons.push(new WEAPON_CLASSES[c.id](c.id));
      }
    } else if (c.kind === 'passive') {
      const cfg = CONFIG.passives[c.id];
      if (this.player.passives[c.id] < cfg.max) {
        this.player.passives[c.id]++;
        if (c.id === 'hp') {
          this.player.maxHp += cfg.per;
          this.player.heal(cfg.per);
        } else {
          this.player.recompute();
        }
      }
    } else if (c.kind === 'heal') {
      this.player.heal(30);
    }
  }

  gameOver() {
    this.state = 'gameover';
    HUD.hide();
    HUD.hideBossBar();
    HUD.hideWarn();
    Music.stop();
    AudioMan.over();
    const rec = { time: this.time, kills: this.kills, level: this.player.level };
    const res = SaveManager.submit(rec);
    Screens.showGameOver(rec, res.data, res.isBest);
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#0d1022';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    this.bg.draw(ctx, this.camera, this.state === 'menu' ? 0 : this.time / 60);
    ctx.restore();

    if (this.state === 'menu') return;

    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    this.camera.apply(ctx);

    this.drawGrid(ctx);

    ctx.strokeStyle = 'rgba(120,160,255,0.3)';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, CONFIG.world.width, CONFIG.world.height);

    for (const g of this.gems) g.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    for (const w of this.weapons) w.draw(ctx, this);
    this.player.draw(ctx);
    for (const b of this.bullets) b.draw(ctx);
    this.drawEBullets(ctx);
    this.drawShocks(ctx);
    this.particles.draw(ctx);
    this.drawLightnings(ctx);
    this.drawRings(ctx);

    ctx.restore();

    if (this.whiteFlashV > 0.01) {
      ctx.fillStyle = 'rgba(255,255,255,' + this.whiteFlashV.toFixed(3) + ')';
      ctx.fillRect(0, 0, this.viewW, this.viewH);
    }

    if (this.input.touch && this.state === 'playing') this.drawJoystick(ctx);
  }

  drawEBullets(ctx) {
    for (const b of this.ebullets) {
      GlowSprites.draw(ctx, '#ff4d6d', b.x, b.y, b.r * 2.6, 0.8);
      ctx.fillStyle = '#ff8fa3';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.35, 0, TAU);
      ctx.fill();
    }
  }

  drawLightnings(ctx) {
    for (const l of this.lightnings) {
      const a = Math.max(0, l.life / l.maxLife);
      ctx.strokeStyle = 'rgba(255,224,102,' + (0.25 * a).toFixed(3) + ')';
      ctx.lineWidth = 8;
      this.strokePts(ctx, l.pts);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * a).toFixed(3) + ')';
      ctx.lineWidth = 3;
      this.strokePts(ctx, l.pts);
      if (l.branches) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * a).toFixed(3) + ')';
        ctx.lineWidth = 2;
        for (const bpts of l.branches) this.strokePts(ctx, bpts);
      }
    }
  }

  strokePts(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  drawRings(ctx) {
    for (const r of this.rings) {
      const a = Math.max(0, r.life / r.maxLife);
      const rgb = hexToRgbStr(r.color || '#ffe066');
      ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.55 * a).toFixed(3) + ')';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
  }

  drawShocks(ctx) {
    for (const s of this.shocks) {
      const a = Math.max(0, 1 - s.r / s.maxR);
      ctx.strokeStyle = 'rgba(109,211,255,' + (0.75 * a + 0.1).toFixed(3) + ')';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(109,211,255,' + (0.25 * a + 0.05).toFixed(3) + ')';
      ctx.lineWidth = 14;
      ctx.setLineDash([26, 18]);
      ctx.lineDashOffset = -performance.now() * 0.12;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(1, s.r - 10), 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawGrid(ctx) {
    const g = CONFIG.world.grid;
    const cam = this.camera;
    const hue = this.bg.theme(this.time / 60);
    const x0 = cam.x - cam.vw / 2, x1 = cam.x + cam.vw / 2;
    const y0 = cam.y - cam.vh / 2, y1 = cam.y + cam.vh / 2;
    ctx.strokeStyle = 'hsla(' + hue + ', 55%, 75%, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.max(0, Math.floor(x0 / g) * g); x <= Math.min(CONFIG.world.width, x1); x += g) {
      ctx.moveTo(x, Math.max(0, y0));
      ctx.lineTo(x, Math.min(CONFIG.world.height, y1));
    }
    for (let y = Math.max(0, Math.floor(y0 / g) * g); y <= Math.min(CONFIG.world.height, y1); y += g) {
      ctx.moveTo(Math.max(0, x0), y);
      ctx.lineTo(Math.min(CONFIG.world.width, x1), y);
    }
    ctx.stroke();
  }

  drawJoystick(ctx) {
    const t = this.input.touch;
    const R = this.input.joyR;
    let dx = t.x - t.ox, dy = t.y - t.oy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.ox, t.oy, R, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(t.ox + dx, t.oy + dy, 26, 0, TAU);
    ctx.fill();
  }
}
