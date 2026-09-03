const CONFIG = {
  player: {
    hp: 100,
    speed: 180,
    radius: 15,
    pickupRadius: 90,
    iframes: 0.85,
  },
  view: { height: 800 },
  world: { width: 2800, height: 2100, grid: 120 },
  spawn: { baseRate: 1.0, ratePerMin: 0.55, cap: 150, capLateStart: 3, capLateRate: 8, capMax: 240 },
  growth: { hp: 0.32, dmg: 0.17, lateStart: 5, hpLate: 0.25, dmgLate: 0.06 },
  xp: { base: 5, perLevel: 7 },

  enemies: {
    grunt: { radius: 13, speed: 72,  hp: 10, damage: 8,  xp: 1, color: '#ff5b4d', knockMul: 1 },
    fast:  { radius: 10, speed: 140, hp: 7,  damage: 5,  xp: 1, color: '#ff9a3d', knockMul: 1.4 },
    tank:  { radius: 26, speed: 38,  hp: 70, damage: 16, xp: 3, color: '#d64545', knockMul: 0.25 },
  },

  spawnMix: [
    { until: 1,  grunt: 1,    fast: 0,     tank: 0 },
    { until: 2,  grunt: 0.75, fast: 0.25,  tank: 0 },
    { until: 4,  grunt: 0.62, fast: 0.26,  tank: 0.12 },
    { until: 8,  grunt: 0.52, fast: 0.33,  tank: 0.15 },
    { until: 99, grunt: 0.38, fast: 0.42,  tank: 0.2 },
  ],

  weapons: {
    blade: {
      name: '飞刃',
      desc: '自动射向最近敌人的贯穿飞刃，3 级起可回旋往返',
      interval: 1.1,
      levels: [
        { count: 1, damage: 10, speed: 420, radius: 9 },
        { count: 1, damage: 15, speed: 440, radius: 11 },
        { count: 1, damage: 15, speed: 460, radius: 11, boomerang: true, out: 260 },
        { count: 1, damage: 24, speed: 480, radius: 13, boomerang: true, out: 300 },
        { count: 2, damage: 30, speed: 520, radius: 15, boomerang: true, out: 340 },
      ],
    },
    orbit: {
      name: '环绕球',
      desc: '围绕你旋转的护体球，升级增加球数与环绕半径',
      levels: [
        { count: 2, damage: 10, ring: 78 },
        { count: 3, damage: 10, ring: 78 },
        { count: 3, damage: 15, ring: 95 },
        { count: 4, damage: 15, ring: 95 },
        { count: 5, damage: 22, ring: 112 },
      ],
    },
    scatter: {
      name: '散射弹',
      desc: '定时向随机方向扇形发射子弹',
      interval: 2.2,
      levels: [
        { count: 3, damage: 6,  spread: 0.5,  radius: 6 },
        { count: 3, damage: 9,  spread: 0.55, radius: 6 },
        { count: 4, damage: 9,  spread: 0.6,  radius: 7 },
        { count: 4, damage: 13, spread: 0.65, radius: 8 },
        { count: 5, damage: 16, spread: 0.7,  radius: 9 },
      ],
    },
  },

  passives: {
    attack: { name: '攻击力+', per: 0.2,  max: 5, desc: '全武器伤害 +20%' },
    haste:  { name: '攻速+',   per: 0.15, max: 5, desc: '全武器触发间隔 -15%' },
    speed:  { name: '移速+',   per: 0.1,  max: 5, desc: '移动速度 +10%' },
    hp:     { name: '最大生命+', per: 20, max: 5, desc: '最大生命 +20 并回复该数值' },
  },

  bullets: {
    scatter: { speed: 380, life: 1.3 },
  },

  orbit: { ballRadius: 12, spin: 2.6, hitCd: 0.4 },
};
