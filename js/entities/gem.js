class Gem {
  constructor() {
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.value = 1; this.big = false; this.pulse = 0;
  }

  init(x, y, value) {
    this.x = x; this.y = y;
    this.vx = rand(-40, 40); this.vy = rand(-40, 40);
    this.value = value;
    this.big = value >= 3;
    this.pulse = Math.random() * TAU;
  }

  update(dt, player) {
    this.pulse += dt * 4;
    const d2 = dist2(this.x, this.y, player.x, player.y);
    const pr = player.pickupR;
    if (d2 < pr * pr) {
      const d = Math.sqrt(d2) || 1;
      const pull = 900 * (1 - d / pr) + 240;
      this.vx += ((player.x - this.x) / d) * pull * dt;
      this.vy += ((player.y - this.y) / d) * pull * dt;
    }
    const damp = Math.pow(0.1, dt);
    this.vx *= damp;
    this.vy *= damp;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const cr = player.radius + 12;
    return d2 < cr * cr;
  }

  draw(ctx) {
    const s = (this.big ? 11 : 7.5) * (1 + 0.12 * Math.sin(this.pulse));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = this.big ? '#5affa8' : '#35d07f';
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const h = s * 0.4;
    ctx.fillRect(-h / 2, -h / 2, h, h);
    ctx.restore();
  }
}
