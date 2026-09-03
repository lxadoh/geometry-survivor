const AudioMan = {
  ctx: null,
  master: null,
  muted: false,
  vol: 0.7,
  KEY: 'geometry-survivor-audio',
  VOL_KEY: 'geometry-survivor-volume',
  _last: {},

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.vol;
      this.master.connect(this.ctx.destination);
    } catch (e) {}
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  loadMuted() {
    try { this.muted = localStorage.getItem(this.KEY) === '1'; } catch (e) {}
    return this.muted;
  },

  loadVol() {
    try {
      const v = parseFloat(localStorage.getItem(this.VOL_KEY));
      if (!isNaN(v) && v >= 0 && v <= 1) this.vol = v;
    } catch (e) {}
    return this.vol;
  },

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem(this.KEY, m ? '1' : '0'); } catch (e) {}
    if (this.master) this.master.gain.value = m ? 0 : this.vol;
  },

  setVol(v) {
    this.vol = Math.min(1, Math.max(0, v));
    this.muted = false;
    try { localStorage.setItem(this.VOL_KEY, String(this.vol)); } catch (e) {}
    if (this.master) this.master.gain.value = this.vol;
  },

  _ok(key, ms) {
    const now = performance.now();
    if (this._last[key] && now - this._last[key] < ms) return false;
    this._last[key] = now;
    return true;
  },

  tone(freq, dur, opt) {
    if (!this.ctx || this.muted) return;
    opt = opt || {};
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (opt.to) o.frequency.exponentialRampToValueAtTime(Math.max(30, opt.to), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(opt.vol || 0.25, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  },

  noise(dur, opt) {
    if (!this.ctx || this.muted) return;
    opt = opt || {};
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = opt.filter || 'bandpass';
    f.frequency.setValueAtTime(opt.freq || 800, t);
    if (opt.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, opt.to), t + dur);
    f.Q.value = opt.q || 1;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(opt.vol || 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
  },

  shoot() {
    if (!this._ok('shoot', 90)) return;
    this.tone(520, 0.06, { type: 'triangle', to: 300, vol: 0.04 });
  },

  zap() {
    this.noise(0.16, { freq: 2600, to: 500, q: 0.8, vol: 0.3 });
    this.tone(1500, 0.09, { type: 'sawtooth', to: 220, vol: 0.1 });
  },

  boom() {
    this.noise(0.3, { freq: 320, to: 60, q: 0.7, vol: 0.35, filter: 'lowpass' });
    this.tone(95, 0.28, { type: 'sine', to: 45, vol: 0.3 });
  },

  pop() {
    if (!this._ok('pop', 70)) return;
    this.tone(300 + Math.random() * 120, 0.05, { type: 'square', to: 110, vol: 0.045 });
  },

  gem() {
    if (!this._ok('gem', 80)) return;
    this.tone(900 + Math.random() * 160, 0.05, { type: 'sine', to: 1350, vol: 0.05 });
  },

  hurt() {
    this.noise(0.12, { freq: 260, to: 90, vol: 0.28, filter: 'lowpass' });
    this.tone(170, 0.12, { type: 'square', to: 80, vol: 0.14 });
  },

  levelup() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.13, { type: 'triangle', vol: 0.2 }), i * 75));
  },

  over() {
    [392, 330, 262, 196].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.26, { type: 'triangle', vol: 0.2 }), i * 170));
  },

  click() {
    this.tone(620, 0.04, { type: 'sine', vol: 0.1 });
  },
};
