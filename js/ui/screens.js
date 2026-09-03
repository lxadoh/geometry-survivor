const Screens = {
  init(callbacks) {
    document.getElementById('btn-start').addEventListener('click', callbacks.start);
    document.getElementById('btn-retry').addEventListener('click', callbacks.start);
    document.getElementById('btn-home').addEventListener('click', callbacks.home);
  },

  showStart(best) {
    const line = document.getElementById('best-line');
    line.textContent = best
      ? SaveManager.format(best)
      : '尚无记录 · 来创造第一个吧';
    document.getElementById('screen-start').classList.remove('hidden');
  },

  hideStart() { document.getElementById('screen-start').classList.add('hidden'); },

  showGameOver(rec, best, isBest) {
    document.getElementById('ov-time').textContent = fmtTime(rec.time);
    document.getElementById('ov-kills').textContent = rec.kills;
    document.getElementById('ov-level').textContent = rec.level;
    document.getElementById('ov-best').textContent = isBest ? '刷新历史最高纪录！' : SaveManager.format(best);
    document.getElementById('new-best').classList.toggle('hidden', !isBest);
    document.getElementById('screen-over').classList.remove('hidden');
  },

  hideOver() { document.getElementById('screen-over').classList.add('hidden'); },
};
