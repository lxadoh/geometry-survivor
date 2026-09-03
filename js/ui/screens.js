const Screens = {
  init(callbacks) {
    document.getElementById('btn-start').addEventListener('click', callbacks.start);
    document.getElementById('btn-retry').addEventListener('click', callbacks.start);
    document.getElementById('btn-home').addEventListener('click', callbacks.home);
    document.getElementById('btn-resume').addEventListener('click', callbacks.resume);
    document.getElementById('btn-lobby').addEventListener('click', callbacks.lobby);
  },

  showStart(best) {
    const line = document.getElementById('best-line');
    line.textContent = best
      ? SaveManager.format(best)
      : '尚无记录 · 来创造第一个吧';
    document.getElementById('screen-start').classList.remove('hidden');
  },

  hideStart() { document.getElementById('screen-start').classList.add('hidden'); },

  showGameOver(rec, data, isBest) {
    document.getElementById('ov-time').textContent = fmtTime(rec.time);
    document.getElementById('ov-kills').textContent = rec.kills;
    document.getElementById('ov-level').textContent = rec.level;
    document.getElementById('ov-best').textContent = isBest ? '刷新历史最高纪录！' : SaveManager.format(data.best);
    document.getElementById('new-best').classList.toggle('hidden', !isBest);

    const runsEl = document.getElementById('ov-runs');
    const recent = data.runs.slice(0, 5);
    let html = '<div class="ov-runs-title">最近战绩</div>';
    recent.forEach((r, i) => {
      html += `<div class="run-line${i === 0 ? ' current' : ''}">${'①②③④⑤'[i]} ${SaveManager.formatRun(r)}</div>`;
    });
    runsEl.innerHTML = html;

    document.getElementById('screen-over').classList.remove('hidden');
  },

  hideOver() { document.getElementById('screen-over').classList.add('hidden'); },

  showPause(info) {
    const el = document.getElementById('pause-build');
    let html = '<div class="pb-title">武器</div><div class="pb-row">';
    for (const w of info.weapons) {
      html += this.pauseChip(w.icon, w.name, 'LV' + w.lvl);
    }
    if (info.weapons.length === 0) html += '<div class="pb-empty">暂无</div>';
    html += '</div>';
    html += '<div class="pb-title">被动</div><div class="pb-row">';
    for (const p of info.passives) {
      html += this.pauseChip(p.icon, p.name, '×' + p.stacks);
    }
    if (info.passives.length === 0) html += '<div class="pb-empty">暂无</div>';
    html += '</div>';
    el.innerHTML = html;

    document.getElementById('vol-slider').value = Math.round(AudioMan.vol * 100);
    document.getElementById('screen-pause').classList.remove('hidden');
  },

  pauseChip(icon, name, val) {
    const accent = UpgradeUI.ACCENTS[icon] || '#6fd3ff';
    const svg = UpgradeUI.ICONS[icon] || '';
    return `<div class="pb-chip" style="--accent:${accent}">${svg}<span>${name}</span><b>${val}</b></div>`;
  },

  hidePause() { document.getElementById('screen-pause').classList.add('hidden'); },
};
