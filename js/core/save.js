const SaveManager = {
  KEY: 'geometry-survivor-best',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const rec = raw ? JSON.parse(raw) : null;
      return rec && typeof rec.time === 'number' ? rec : null;
    } catch (e) { return null; }
  },

  submit(rec) {
    const best = this.load();
    if (!best || rec.time > best.time) {
      try { localStorage.setItem(this.KEY, JSON.stringify(rec)); } catch (e) {}
      return true;
    }
    return false;
  },

  format(rec) {
    if (!rec) return '';
    return `历史最高 ${fmtTime(rec.time)} · 击杀 ${rec.kills} · LV ${rec.level}`;
  }
};
