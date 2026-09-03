const TAU = Math.PI * 2;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }
function rand(a, b) { return a + Math.random() * (b - a); }

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
