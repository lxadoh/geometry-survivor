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
      bossWrap: document.getElementById('boss-bar-wrap'),
      bossName: document.getElementById('boss-name'),
      bossFill: document.getElementById('boss-fill'),
      warn: document.getElementById('boss-warn'),
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

    if (game.activeBoss) {
      const b = game.activeBoss;
      const pct = clamp(b.hp / b.maxHp, 0, 1) * 100;
      if (this.set('bossPct', Math.round(pct)) !== undefined) {
        this.el.bossFill.style.width = pct + '%';
      }
    }
  },

  showBossBar(name) {
    this.el.bossName.textContent = name;
    this.el.bossFill.style.width = '100%';
    this.el.bossWrap.classList.remove('hidden');
    this.last.bossPct = 100;
  },

  hideBossBar() {
    this.el.bossWrap.classList.add('hidden');
  },

  showWarn(name) {
    this.el.warn.textContent = '⚠ 警告：' + name + ' 即将降临 ⚠';
    this.el.warn.classList.remove('hidden');
    this.el.warn.classList.remove('on');
    void this.el.warn.offsetWidth;
    this.el.warn.classList.add('on');
  },

  hideWarn() {
    this.el.warn.classList.add('hidden');
    this.el.warn.classList.remove('on');
  },

  damageFlash() {
    const f = this.el.flash;
    f.classList.remove('on');
    void f.offsetWidth;
    f.classList.add('on');
  }
};
