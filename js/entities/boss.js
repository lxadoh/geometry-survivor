class Boss extends Enemy {
  init(def, id, x, y, hp, damage) {
    this.def = def;
    this.bossId = id;
    this.type = 'boss';
    this.x = x; this.y = y;
    this.hp = this.maxHp = Math.round(hp);
    this.damage = Math.round(damage);
    this.radius = def.radius;
    this.speed = def.speed;
    this.xpValue = 0;
    this.color = def.color;
    this.knockMul = 0.04;
    this.hitFlash = 0; this.kbx = 0; this.kby = 0;
    this.orbitCd = 0; this.angle = 0; this.dead = false;
    this.elite = false; this.isBoss = true;
    this.spin = 0; this.pulse = 0;
    this.trail = []; this.trailAcc = 0;

    this.state = 'chase';
    this.stTime = 0;
    this.aimX = x; this.aimY = y;
    this.dashCount = 0;
    this.summonT = 3;
    this.atkT = 2.2;
    this.atkCount = 0;
    this.born = 0.5;
  }

  update(dt, player, game) {
    this.pulse += dt * 2.5;
    this.spin += dt;
    this.hitFlash -= dt;
    this.orbitCd -= dt;
    if (this.born > 0) this.born -= dt;

    this.stTime += dt;
    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    this.angle = Math.atan2(dy, dx);
    this.x += this.kbx * dt;
    this.y += this.kby * dt;
    const damp = Math.pow(0.002, dt);
    this.kbx *= damp;
    this.kby *= damp;

    if (this.bossId === 'square') this.updateSquare(dt, player, dx / d, dy / d);
    else if (this.bossId === 'triangle') this.updateTriangle(dt, player, game, dx / d, dy / d);
    else this.updateCore(dt, player, game, dx / d, dy / d);

    this.x = clamp(this.x, this.radius, CONFIG.world.width - this.radius);
    this.y = clamp(this.y, this.radius, CONFIG.world.height - this.radius);
  }

  move(nx, ny, sp, dt) {
    this.x += nx * sp * dt;
    this.y += ny * sp * dt;
  }

  updateSquare(dt, player, nx, ny) {
    switch (this.state) {
      case 'chase':
        this.move(nx, ny, this.speed, dt);
        if (this.stTime > 2.4) this.setState('windup');
        break;
      case 'windup':
        this.x += rand(-1, 1) * 60 * dt;
        this.y += rand(-1, 1) * 60 * dt;
        if (this.stTime > 0.4 && this.stTime < 0.7) {
          this.aimX = player.x; this.aimY = player.y;
        }
        if (this.stTime > 0.9) {
          const d = Math.hypot(this.aimX - this.x, this.aimY - this.y) || 1;
          this.cvx = (this.aimX - this.x) / d;
          this.cvy = (this.aimY - this.y) / d;
          this.setState('charge');
        }
        break;
      case 'charge':
        this.x += this.cvx * 560 * dt;
        this.y += this.cvy * 560 * dt;
        if (this.stTime > 0.55) this.setState('recover');
        break;
      case 'recover':
        this.move(nx, ny, this.speed * 0.4, dt);
        if (this.stTime > 0.8) this.setState('chase');
        break;
    }
  }

  updateTriangle(dt, player, game, nx, ny) {
    this.summonT -= dt;
    if (this.summonT <= 0) {
      this.summonT = 5;
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * TAU;
        game.spawnEnemyAt('fast', this.x + Math.cos(a) * 90, this.y + Math.sin(a) * 90);
      }
    }
    switch (this.state) {
      case 'chase':
        this.move(nx, ny, this.speed, dt);
        if (this.stTime > 2.1) { this.dashCount = 0; this.setState('windup'); }
        break;
      case 'windup':
        this.x += rand(-1, 1) * 70 * dt;
        this.y += rand(-1, 1) * 70 * dt;
        if (this.stTime > 0.45) {
          const d = Math.hypot(player.x - this.x, player.y - this.y) || 1;
          this.cvx = (player.x - this.x) / d;
          this.cvy = (player.y - this.y) / d;
          this.setState('dash');
        }
        break;
      case 'dash':
        this.x += this.cvx * 640 * dt;
        this.y += this.cvy * 640 * dt;
        if (this.stTime > 0.26) {
          this.dashCount++;
          if (this.dashCount >= 3) this.setState('recover');
          else this.setState('windup');
        }
        break;
      case 'recover':
        this.move(nx, ny, this.speed * 0.5, dt);
        if (this.stTime > 0.7) this.setState('chase');
        break;
    }
  }

  updateCore(dt, player, game, nx, ny) {
    this.move(nx, ny, this.speed, dt);
    this.atkT -= dt;
    if (this.atkT <= 0 && this.state === 'chase') {
      this.setState('telegraph');
      this.stTime = 0;
    }
    if (this.state === 'telegraph' && this.stTime > 0.85) {
      const n = this.atkCount % 2 === 1 ? 20 : 14;
      const off = this.atkCount * 0.35;
      for (let i = 0; i < n; i++) {
        const a = off + i * TAU / n;
        game.spawnEnemyBullet(this.x, this.y, a, CONFIG.boss.bullet.speed * rand(0.92, 1.1));
      }
      game.camera.shake(4, 0.15);
      AudioMan.boom();
      this.atkCount++;
      this.atkT = 3.4;
      this.setState('chase');
    }
  }

  setState(s) {
    this.state = s;
    this.stTime = 0;
  }

  draw(ctx) {
    const flash = this.hitFlash > 0;
    const r = this.radius;
    const bornS = this.born > 0 ? 1 - this.born * 0.6 : 1;
    const col = flash ? '#ffffff' : this.color;

    GlowSprites.draw(ctx, this.color, this.x, this.y, r * 3.4, 0.6 + 0.15 * Math.sin(this.pulse));
    GlowSprites.draw(ctx, '#ffd166', this.x, this.y, r * 2.4, 0.4);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(bornS, bornS);

    if (this.bossId === 'square') {
      const s = r * 1.6;
      ctx.save();
      ctx.rotate(-this.spin * 0.5);
      ctx.strokeStyle = 'rgba(255,209,102,0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 12]);
      ctx.strokeRect(-s * 0.78, -s * 0.78, s * 1.56, s * 1.56);
      ctx.setLineDash([]);
      ctx.restore();
      ctx.fillStyle = col;
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-s / 2 + 8, -s / 2 + 8, s - 16, s - 16);
      ctx.save();
      ctx.rotate(this.spin * 0.8);
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      const i = s * 0.34;
      ctx.strokeRect(-i / 2, -i / 2, i, i);
      ctx.restore();
      if (this.state === 'windup') {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(this.stTime * 25)).toFixed(2) + ')';
        ctx.lineWidth = 4;
        ctx.strokeRect(-s / 2 - 6, -s / 2 - 6, s + 12, s + 12);
      }
    } else if (this.bossId === 'triangle') {
      ctx.save();
      ctx.rotate(this.spin);
      for (let k = 0; k < 2; k++) {
        const wr = r * 1.9, wa = this.spin * (k ? -1.6 : 1.6) + k * Math.PI;
        ctx.save();
        ctx.rotate(wa);
        ctx.strokeStyle = 'rgba(255,150,80,0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wr * 0.6, 0);
        ctx.lineTo(wr * 0.95, wr * 0.4);
        ctx.lineTo(wr * 0.95, -wr * 0.4);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      ctx.save();
      ctx.rotate(this.angle);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(r * 1.15, 0);
      ctx.lineTo(-r * 0.8, r * 0.85);
      ctx.lineTo(-r * 0.8, -r * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.moveTo(r * 0.55, 0);
      ctx.lineTo(-r * 0.5, r * 0.45);
      ctx.lineTo(-r * 0.5, -r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (this.state === 'windup') {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(this.stTime * 25)).toFixed(2) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.4, 0, TAU);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.rotate(this.spin * 0.9);
      ctx.strokeStyle = '#e2a6ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        const px = Math.cos(a) * r * 0.42, py = Math.sin(a) * r * 0.42;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.rotate(-this.spin * 0.6);
      ctx.strokeStyle = 'rgba(255,209,102,0.6)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.35, i * TAU / 3, i * TAU / 3 + 1.2);
        ctx.stroke();
      }
      ctx.restore();
      if (this.state === 'telegraph') {
        const p = clamp(this.stTime / 0.85, 0, 1);
        ctx.strokeStyle = 'rgba(255,80,110,' + (0.25 + 0.5 * p).toFixed(2) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 40 + p * 300, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
