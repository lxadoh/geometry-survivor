class Player {
  constructor() {
    this.passives = { attack: 0, haste: 0, speed: 0, hp: 0, pickup: 0 };
    this.reset();
  }

  reset() {
    const c = CONFIG.player;
    this.x = CONFIG.world.width / 2;
    this.y = CONFIG.world.height / 2;
    this.maxHp = c.hp;
    this.hp = c.hp;
    this.radius = c.radius;
    this.iframes = c.iframes;
    this.level = 1;
    this.xp = 0;
    this.xpNeed = CONFIG.xp.base;
    this.passives.attack = 0;
    this.passives.haste = 0;
    this.passives.speed = 0;
    this.passives.hp = 0;
    this.passives.pickup = 0;
    this.invuln = 0;
    this.faceX = 1;
    this.faceY = 0;
    this.recompute();
  }

  recompute() {
    this.damageMul = 1 + CONFIG.passives.attack.per * this.passives.attack;
    this.intervalMul = Math.pow(1 - CONFIG.passives.haste.per, this.passives.haste);
    this.moveSpeed = CONFIG.player.speed * (1 + CONFIG.passives.speed.per * this.passives.speed);
    this.pickupR = CONFIG.player.pickupRadius * (1 + CONFIG.passives.pickup.per * this.passives.pickup);
  }

  update(dt, input) {
    const mv = input.moveVector();
    if (Math.abs(mv.x) > 0.01 || Math.abs(mv.y) > 0.01) {
      const l = Math.hypot(mv.x, mv.y);
      this.faceX = mv.x / l;
      this.faceY = mv.y / l;
    }
    this.x = clamp(this.x + mv.x * this.moveSpeed * dt, this.radius, CONFIG.world.width - this.radius);
    this.y = clamp(this.y + mv.y * this.moveSpeed * dt, this.radius, CONFIG.world.height - this.radius);
    this.invuln -= dt;
  }

  addXp(v) {
    this.xp += v;
    let levels = 0;
    while (this.xp >= this.xpNeed) {
      this.xp -= this.xpNeed;
      this.level++;
      levels++;
      this.xpNeed = CONFIG.xp.base + CONFIG.xp.perLevel * (this.level - 1);
    }
    return levels;
  }

  takeDamage(d) {
    if (this.invuln > 0) return false;
    this.hp -= d;
    this.invuln = this.iframes;
    return true;
  }

  heal(v) { this.hp = Math.min(this.maxHp, this.hp + v); }

  draw(ctx) {
    if (this.passives.pickup > 0) {
      ctx.strokeStyle = 'rgba(53,208,127,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.pickupR, 0, TAU);
      ctx.stroke();
    }

    ctx.globalAlpha = this.invuln > 0
      ? 0.5 + 0.4 * Math.sin(performance.now() * 0.03)
      : 1;

    ctx.fillStyle = 'rgba(120,170,255,0.16)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 30, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#1b2a4a';
    ctx.beginPath();
    ctx.arc(this.x + this.faceX * 6, this.y + this.faceY * 6, 4, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
