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
    this._grid = new Map();
    this.player = new Player();
    this.weapons = [];
    this.state = 'menu';
    this.time = 0;
    this.kills = 0;
    this.spawnAcc = 0;
    this.pendingLevels = 0;
    this.viewW = 0;
    this.viewH = 0;
    this.dpr = 1;
    this.paused = false;
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
    for (const e of this.enemies) this.enemyPool.release(e);
    for (const b of this.bullets) this.bulletPool.release(b);
    for (const g of this.gems) this.gemPool.release(g);
    this.enemies.length = 0;
    this.bullets.length = 0;
    this.gems.length = 0;
    this.particles.clear();
    this.player.reset();
    this.weapons = [new WEAPON_CLASSES.blade('blade')];
    this.time = 0;
    this.kills = 0;
    this.spawnAcc = 0;
    this.pendingLevels = 0;
    this.camera.snap(this.player.x, this.player.y);
    this.state = 'playing';
    Screens.hideStart();
    Screens.hideOver();
    HUD.show();
  }

  toMenu() {
    this.state = 'menu';
    HUD.hide();
    Screens.hideOver();
    Screens.showStart(SaveManager.load());
  }

  tick(dt) {
    if (this.state === 'playing' && !this.paused) this.update(dt);
    this.camera.update(dt);
    this.render();
  }

  update(dt) {
    this.time += dt;

    this.updateSpawn(dt);
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
      e.update(dt, p);
      const rr = e.radius + p.radius;
      if (dist2(e.x, e.y, p.x, p.y) < rr * rr && p.takeDamage(e.damage)) {
        HUD.damageFlash();
        this.camera.shake(7, 0.25);
        this.particles.burst(p.x, p.y, 10, '#ff6b6b', { speed: 170, life: 0.4, size: 3 });
        if (p.hp <= 0) { this.gameOver(); return; }
      }
    }
    this.separateEnemies();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (this.bullets[i].life <= 0) {
        this.bulletPool.release(this.bullets.splice(i, 1)[0]);
      }
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].dead) {
        this.enemyPool.release(this.enemies.splice(i, 1)[0]);
      }
    }

    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      if (g.update(dt, p)) {
        this.pendingLevels += p.addXp(g.value);
        this.particles.burst(p.x, p.y, 3, '#7ee787', { speed: 90, life: 0.25, size: 2 });
        this.gemPool.release(this.gems.splice(i, 1)[0]);
      }
    }

    this.particles.update(dt);
    this.camera.follow(p.x, p.y, dt);

    if (this.pendingLevels > 0) this.openUpgrade();
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
      if (this.enemies.length >= cap) break;
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
          const dx = b.x - a.x, dy = b.y - a.y;
          const rr = a.radius + b.radius;
          const d2v = dx * dx + dy * dy;
          if (d2v > 0.01 && d2v < rr * rr) {
            const d = Math.sqrt(d2v);
            const push = (rr - d) / d * 0.5;
            const wA = b.radius / rr, wB = a.radius / rr;
            a.x -= dx * push * wA;
            a.y -= dy * push * wA;
            b.x += dx * push * wB;
            b.y += dy * push * wB;
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
    const g = this.gemPool.obtain();
    g.init(x, y, value);
    this.gems.push(g);
  }

  hurtEnemy(e, dmg, kx, ky) {
    e.hurt(dmg, kx, ky);
    this.particles.burst(e.x, e.y, 3, '#ffffff', { speed: 130, life: 0.22, size: 2.2 });
    if (e.dead) {
      this.kills++;
      this.spawnGem(e.x, e.y, e.xpValue);
      this.particles.burst(e.x, e.y, 9, e.color, { speed: 200, life: 0.45, size: 3.2 });
    }
  }

  openUpgrade() {
    this.state = 'levelup';
    const choices = this.buildChoices();
    UpgradeUI.open(choices, c => {
      this.applyChoice(c);
      UpgradeUI.close();
      this.pendingLevels--;
      if (this.pendingLevels > 0) this.openUpgrade();
      else this.state = 'playing';
    });
  }

  buildChoices() {
    const pool = [];
    const owned = new Map(this.weapons.map(w => [w.id, w]));
    for (const id of Object.keys(CONFIG.weapons)) {
      const w = owned.get(id);
      if (!w) pool.push(this.weaponChoice(id, 0));
      else if (!w.maxed) pool.push(this.weaponChoice(id, w.level));
    }
    for (const id of Object.keys(CONFIG.passives)) {
      const c = CONFIG.passives[id];
      const st = this.player.passives[id];
      if (st < c.max) {
        pool.push({
          kind: 'passive', id, icon: id, name: c.name,
          tag: '被动 · 叠加 ' + (st + 1) + ' 层',
          desc: c.desc + '（当前 ' + st + ' 层）',
        });
      }
    }
    shuffle(pool);
    const picks = pool.slice(0, 3);
    if (picks.length === 0) {
      picks.push({ kind: 'heal', icon: 'heal', name: '紧急维修', tag: '特殊', desc: '立即回复 30 生命' });
    }
    return picks;
  }

  weaponChoice(id, curLvl) {
    const w = CONFIG.weapons[id];
    let tag, desc;
    if (curLvl === 0) {
      tag = '新武器';
      desc = w.desc || '全新武器加入你的战斗';
    } else {
      const a = w.levels[curLvl - 1], b = w.levels[curLvl];
      tag = '武器 LV' + curLvl + ' → LV' + (curLvl + 1);
      const parts = [];
      if (a.damage !== b.damage) parts.push('伤害 ' + a.damage + '→' + b.damage);
      if ((a.count || 0) !== (b.count || 0)) parts.push('数量 ' + a.count + '→' + b.count);
      if ((a.radius || 0) !== (b.radius || 0)) parts.push('体积 ' + a.radius + '→' + b.radius);
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
      if (owned) owned.level++;
      else this.weapons.push(new WEAPON_CLASSES[c.id](c.id));
    } else if (c.kind === 'passive') {
      this.player.passives[c.id]++;
      if (c.id === 'hp') {
        this.player.maxHp += CONFIG.passives.hp.per;
        this.player.heal(CONFIG.passives.hp.per);
      } else {
        this.player.recompute();
      }
    } else if (c.kind === 'heal') {
      this.player.heal(30);
    }
  }

  gameOver() {
    this.state = 'gameover';
    HUD.hide();
    const rec = { time: this.time, kills: this.kills, level: this.player.level };
    const isBest = SaveManager.submit(rec);
    Screens.showGameOver(rec, SaveManager.load(), isBest);
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#0d1022';
    ctx.fillRect(0, 0, this.viewW, this.viewH);

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
    this.particles.draw(ctx);

    ctx.restore();

    if (this.input.touch && this.state === 'playing') this.drawJoystick(ctx);
  }

  drawGrid(ctx) {
    const g = CONFIG.world.grid;
    const cam = this.camera;
    const x0 = cam.x - cam.vw / 2, x1 = cam.x + cam.vw / 2;
    const y0 = cam.y - cam.vh / 2, y1 = cam.y + cam.vh / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
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
