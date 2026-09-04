class Background {
  constructor() {
    this.t = 0;
    this.meteors = [];
    this.meteorT = rand(3, 8);
    this.layers = [
      { f: 0.14, tile: 900,  alpha: 0.7,  stars: this.mkStars(56, 0.6, 1.4) },
      { f: 0.34, tile: 1100, alpha: 0.85, stars: this.mkStars(46, 0.9, 1.8) },
      { f: 0.64, tile: 1300, alpha: 1.0,  stars: this.mkStars(32, 1.3, 2.6) },
    ];
    this.neb = null;
    this.nebHue = -99;
    this.blobs = [
      { x: 0.22, y: 0.30, s: 760, a: 0.9 },
      { x: 0.74, y: 0.62, s: 920, a: 0.7 },
      { x: 0.5,  y: 0.05, s: 640, a: 0.55 },
    ];
  }

  mkStars(n, minR, maxR) {
    const colors = ['#ffffff', '#cfe0ff', '#ffe9c9', '#ffd7e8', '#d8fff4'];
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        x: Math.random() * 1000, y: Math.random() * 1000,
        r: rand(minR, maxR),
        ph: Math.random() * TAU,
        twS: rand(0.6, 2.4),
        c: colors[(Math.random() * colors.length) | 0],
        plus: Math.random() < 0.18,
      });
    }
    return arr;
  }

  setLowQuality() {
    this.layers[2].stars = this.layers[2].stars.slice(0, 12);
    this.blobs = this.blobs.slice(0, 2);
  }

  theme(min) {
    return 228 + 122 * clamp(min / 12, 0, 1);
  }

  update(dt) {
    this.t += dt;
    this.meteorT -= dt;
    if (!LOWFX && this.meteorT <= 0) {
      this.meteorT = rand(6, 15);
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.meteors.push({
        x: rand(0, 1600), y: rand(-100, 400),
        vx: dir * rand(340, 520), vy: rand(220, 380),
        life: rand(0.9, 1.4), maxLife: 1.4,
      });
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt;
      if (m.life <= 0) this.meteors.splice(i, 1);
    }
  }

  buildNebula(hue) {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    let grad = g.createRadialGradient(S / 2, S / 2, 8, S / 2, S / 2, S / 2);
    grad.addColorStop(0, 'hsla(' + hue + ', 75%, 58%, 0.16)');
    grad.addColorStop(0.55, 'hsla(' + hue + ', 70%, 45%, 0.07)');
    grad.addColorStop(1, 'hsla(' + hue + ', 70%, 40%, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    grad = g.createRadialGradient(S * 0.3, S * 0.35, 4, S * 0.3, S * 0.35, S * 0.45);
    grad.addColorStop(0, 'hsla(' + ((hue + 45) % 360) + ', 80%, 65%, 0.1)');
    grad.addColorStop(1, 'hsla(' + ((hue + 45) % 360) + ', 80%, 60%, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    this.neb = c;
    this.nebHue = hue;
  }

  draw(ctx, cam, timeMin) {
    const hue = this.theme(timeMin);
    ctx.fillStyle = 'hsl(' + hue + ', 45%, 7%)';
    ctx.fillRect(0, 0, cam.vw, cam.vh);

    if (Math.abs(hue - this.nebHue) > 3) this.buildNebula(hue);

    const T = 2400;
    for (const b of this.blobs) {
      const f = 0.1;
      let x = ((b.x * T - cam.x * f) % T + T) % T - 400;
      let y = ((b.y * T - cam.y * f) % T + T) % T - 400;
      for (let gx = x; gx < cam.vw + 400; gx += T) {
        for (let gy = y; gy < cam.vh + 400; gy += T) {
          ctx.globalAlpha = b.a;
          ctx.drawImage(this.neb, gx - b.s / 2, gy - b.s / 2, b.s, b.s);
        }
      }
    }
    ctx.globalAlpha = 1;

    for (const L of this.layers) {
      const f = L.f, tile = L.tile;
      const ox = ((-cam.x * f) % tile + tile) % tile;
      const oy = ((-cam.y * f) % tile + tile) % tile;
      for (let gx = ox - tile; gx < cam.vw; gx += tile) {
        for (let gy = oy - tile; gy < cam.vh; gy += tile) {
          for (const s of L.stars) {
            const x = gx + s.x % tile, y = gy + s.y % tile;
            if (x < -6 || x > cam.vw + 6 || y < -6 || y > cam.vh + 6) continue;
            const tw = 0.55 + 0.45 * Math.sin(this.t * s.twS + s.ph);
            ctx.globalAlpha = tw * L.alpha;
            ctx.fillStyle = s.c;
            if (s.plus) {
              ctx.fillRect(x - s.r, y - s.r * 0.28, s.r * 2, s.r * 0.56);
              ctx.fillRect(x - s.r * 0.28, y - s.r, s.r * 0.56, s.r * 2);
            } else {
              ctx.fillRect(x, y, s.r, s.r);
            }
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    for (const m of this.meteors) {
      const a = clamp(m.life / m.maxLife, 0, 1) * 0.8;
      ctx.strokeStyle = 'rgba(210,230,255,' + a.toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * 0.13, m.y - m.vy * 0.13);
      ctx.stroke();
    }
  }
}
