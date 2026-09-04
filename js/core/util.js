const TAU = Math.PI * 2;
var LOWFX = false;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }
function rand(a, b) { return a + Math.random() * (b - a); }

function hexToRgbStr(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}

const GlowSprites = {
  _cache: new Map(),
  get(color) {
    let c = this._cache.get(color);
    if (c) return c;
    const S = 64;
    c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const rgb = hexToRgbStr(color);
    const grad = g.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2);
    grad.addColorStop(0, 'rgba(' + rgb + ',0.55)');
    grad.addColorStop(0.4, 'rgba(' + rgb + ',0.2)');
    grad.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    this._cache.set(color, c);
    return c;
  },
  draw(ctx, color, x, y, r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.get(color), x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  },
};

function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function pickEnemyType(min) {
  let mix = CONFIG.spawnMix[CONFIG.spawnMix.length - 1];
  for (const m of CONFIG.spawnMix) {
    if (min < m.until) { mix = m; break; }
  }
  let r = Math.random() * (mix.grunt + mix.fast + mix.tank);
  if ((r -= mix.grunt) < 0) return 'grunt';
  if ((r -= mix.fast) < 0) return 'fast';
  return 'tank';
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
