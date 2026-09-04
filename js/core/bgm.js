const Music = {
  ctx: null,
  bus: null,
  playing: false,
  intensity: 0,
  bpm: 92,
  step: 0,
  nextT: 0,
  timer: null,
  chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],

  mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); },

  ensure() {
    if (!AudioMan.ctx || this.bus) return;
    this.ctx = AudioMan.ctx;
    this.bus = this.ctx.createGain();
    this.bus.gain.value = 0.4;
    this.bus.connect(AudioMan.master);
  },

  start(reset) {
    this.ensure();
    if (!this.bus) return;
    if (this.playing) return;
    if (reset) this.step = 0;
    this.playing = true;
    this.nextT = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this.sched(), 25);
  },

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.playing = false;
  },

  setIntensity(i) {
    if (this.intensity === i) return;
    this.intensity = i;
    this.bpm = 92 + i * 8;
  },

  sched() {
    if (!this.playing) return;
    while (this.nextT < this.ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextT);
      this.nextT += 60 / this.bpm / 4;
      this.step++;
    }
  },

  playStep(step, t) {
    const I = this.intensity;
    const pos = step % 16;
    const bar = (step / 16) | 0;
    const chord = this.chords[bar % this.chords.length];

    if (I >= 1 && pos % 4 === 0) this.kick(t);
    if (I >= 2 && (pos === 4 || pos === 12)) this.snare(t);
    if (I >= 2 && pos % 2 === 1) this.hat(t, 0.05);
    if (I >= 3 && pos % 4 === 2) this.hat(t, 0.028);
    if (I >= 1 && pos % 2 === 0) {
      const pat = [0, 0, 7, 0, 10, 0, 7, 5];
      const off = I >= 3 ? pat[(pos / 2) | 0] : 0;
      this.bass(t, this.mtof(chord[0] - 24 + off));
    }
    if (pos === 0) this.pad(t, chord);
    if (I === 0 ? pos % 4 === 0 : I === 1 ? pos % 2 === 0 : true) {
      this.arp(t, this.mtof(chord[step % 3] + 12), I);
    }
    if (I >= 4 && pos % 4 === 2) this.alarmTone(t, ((step / 4) | 0) % 2 ? 932 : 880);
  },

  env(t, vol, a, d) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    g.connect(this.bus);
    return g;
  },

  osc(type, freq, t, d) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.start(t);
    o.stop(t + d + 0.03);
    return o;
  },

  kick(t) {
    const o = this.osc('sine', 130, t, 0.13);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    o.connect(this.env(t, 0.55, 0.003, 0.13));
  },

  snare(t) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf();
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.9;
    n.connect(f);
    f.connect(this.env(t, 0.16, 0.002, 0.1));
    n.start(t);
    n.stop(t + 0.12);
  },

  hat(t, vol) {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noiseBuf();
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 7200;
    n.connect(f);
    f.connect(this.env(t, vol, 0.001, 0.035));
    n.start(t);
    n.stop(t + 0.05);
  },

  bass(t, freq) {
    const o = this.osc('sawtooth', freq, t, 0.15);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 260;
    o.connect(f);
    f.connect(this.env(t, 0.17, 0.006, 0.15));
  },

  pad(t, chord) {
    const barLen = 60 / this.bpm * 4;
    for (let i = 0; i < 3; i++) {
      const o = this.osc('triangle', this.mtof(chord[i] + 12), t, barLen);
      o.detune.value = (i - 1) * 4;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.5);
      g.gain.setValueAtTime(0.035, t + barLen - 0.4);
      g.gain.linearRampToValueAtTime(0, t + barLen);
      g.connect(this.bus);
      o.connect(g);
    }
  },

  arp(t, freq, I) {
    const o = this.osc('square', freq, t, 0.12);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1400 + I * 500;
    o.connect(f);
    f.connect(this.env(t, 0.045 + I * 0.006, 0.004, 0.12));
  },

  alarmTone(t, freq) {
    const o = this.osc('square', freq, t, 0.09);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 2400;
    o.connect(f);
    f.connect(this.env(t, 0.05, 0.003, 0.09));
  },

  _noiseBuf: null,
  noiseBuf() {
    if (this._noiseBuf) return this._noiseBuf;
    const len = this.ctx.sampleRate * 0.3;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return buf;
  },
};
