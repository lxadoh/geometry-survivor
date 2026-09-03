class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = Object.create(null);
    this.touch = null;
    this.joyR = 70;

    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = Object.create(null); });

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      if (!this.touch) {
        const t = e.changedTouches[0];
        this.touch = { id: t.identifier, ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY };
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!this.touch) return;
      for (const t of e.changedTouches) {
        if (t.identifier === this.touch.id) { this.touch.x = t.clientX; this.touch.y = t.clientY; }
      }
    }, { passive: false });

    const end = e => {
      if (!this.touch) return;
      for (const t of e.changedTouches) {
        if (t.identifier === this.touch.id) this.touch = null;
      }
    };
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);
  }

  moveVector() {
    let x = 0, y = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;

    if (this.touch) {
      const dx = this.touch.x - this.touch.ox, dy = this.touch.y - this.touch.oy;
      const d = Math.hypot(dx, dy);
      if (d > 8) {
        const m = Math.min(1, d / (this.joyR * 0.6));
        x = dx / d * m;
        y = dy / d * m;
      }
    }

    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }
}
