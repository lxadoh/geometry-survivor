const HUD = {
  el: {},
  last: {},

  init() {
    this.el = {
      root: document.getElementById('hud'),
      hpFill: document.getElementById('hp-fill'),
      hpText: document.getElementById('hp-text'),
      time: document.getElementById('hud-time'),
      kills: document.getElementById('hud-kills'),
      xpFill: document.getElementById('xp-fill'),
      level: document.getElementById('level-badge'),
      flash: document.getElementById('damage-flash'),
    };
    this.last = {};
  },

  show() { this.el.root.classList.remove('hidden'); },
  hide() { this.el.root.classList.add('hidden'); },

  set(key, val) {
    if (this.last[key] === val) return;
    this.last[key] = val;
    return val;
  },

  update(game) {
    const p = game.player;
    const hpPct = clamp(p.hp / p.maxHp, 0, 1) * 100;
    if (this.set('hpPct', Math.round(hpPct)) !== undefined) {
      this.el.hpFill.style.width = hpPct + '%';
      this.el.hpFill.style.background =
        hpPct > 50 ? '#3ddc84' : hpPct > 25 ? '#ffb35c' : '#ff5b4d';
    }
    const hpText = Math.max(0, Math.ceil(p.hp)) + ' / ' + p.maxHp;
    if (this.set('hpText', hpText)) this.el.hpText.textContent = hpText;

    const xpPct = clamp(p.xp / p.xpNeed, 0, 1) * 100;
    if (this.set('xpPct', Math.round(xpPct)) !== undefined) {
      this.el.xpFill.style.width = xpPct + '%';
    }

    const lvText = 'LV ' + p.level;
    if (this.set('lv', lvText)) this.el.level.textContent = lvText;

    const timeText = fmtTime(game.time);
    if (this.set('time', timeText)) this.el.time.textContent = timeText;

    const killText = '击杀 ' + game.kills;
    if (this.set('kills', killText)) this.el.kills.textContent = killText;
  },

  damageFlash() {
    const f = this.el.flash;
    f.classList.remove('on');
    void f.offsetWidth;
    f.classList.add('on');
  }
};
