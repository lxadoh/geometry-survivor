const SaveManager = {
  KEY: 'geometry-survivor-save',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      const d = raw ? JSON.parse(raw) : null;
      return {
        best: d && d.best ? d.best : null,
        runs: Array.isArray(d && d.runs) ? d.runs : [],
      };
    } catch (e) {
      return { best: null, runs: [] };
    }
  },

  submit(rec) {
    const data = this.load();
    const isBest = !data.best || rec.time > data.best.time;
    if (isBest) data.best = rec;
    data.runs.unshift(rec);
    if (data.runs.length > 10) data.runs.length = 10;
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) {}
    return { isBest, data };
  },

  format(rec) {
    if (!rec) return '';
    return `历史最高 ${fmtTime(rec.time)} · 击杀 ${rec.kills} · LV ${rec.level}`;
  },

  formatRun(rec) {
    return `${fmtTime(rec.time)} · ${rec.kills} 杀 · LV ${rec.level}`;
  }
};
