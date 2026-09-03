const CONFIG = {
  player: {
    hp: 100,
    speed: 180,
    radius: 15,
    pickupRadius: 90,
    iframes: 0.6,
  },
  world: { width: 2800, height: 2100, grid: 120 },
  spawn: { baseRate: 1.2, ratePerMin: 0.8, cap: 150 },
  growth: { hp: 0.45, dmg: 0.25 },
  xp: { base: 5, perLevel: 8 },

  enemies: {
    grunt: { radius: 13, speed: 72,  hp: 10, damage: 8,  xp: 1, color: '#ff5b4d', knockMul: 1 },
    fast:  { radius: 10, speed: 150, hp: 7,  damage: 5,  xp: 1, color: '#ff9a3d', knockMul: 1.4 },
    tank:  { radius: 26, speed: 38,  hp: 70, damage: 16, xp: 3, color: '#d64545', knockMul: 0.25 },
  },

  spawnMix: [
    { until: 1,  grunt: 1,   fast: 0,    tank: 0 },
    { until: 2,  grunt: 0.75, fast: 0.25, tank: 0 },
    { until: 4,  grunt: 0.6,  fast: 0.25, tank: 0.15 },
    { until: 99, grunt: 0.45, fast: 0.35, tank: 0.2 },
  ],

  weapons: {
    blade: {
      name: '飞刃',
      desc: '自动射向最近敌人的贯穿飞刀',
      levels: [
        { count: 1, damage: 10, interval: 1.1 },
        { count: 2, damage: 10, interval: 1.05 },
        { count: 2, damage: 14, interval: 1.0 },
        { count: 3, damage: 14, interval: 0.95 },
        { count: 4, damage: 18, interval: 0.9 },
      ],
    },
    orbit: {
      name: '环绕球',
      desc: '围绕你旋转的护体球，近身即伤',
      levels: [
        { count: 2, damage: 10, interval: 0.35 },
        { count: 3, damage: 10, interval: 0.32 },
        { count: 3, damage: 15, interval: 0.28 },
        { count: 4, damage: 15, interval: 0.25 },
        { count: 5, damage: 20, interval: 0.22 },
      ],
    },
    scatter: {
      name: '散射弹',
      desc: '定时向随机方向扇形发射子弹',
      levels: [
        { count: 3, damage: 6,  interval: 2.2, spread: 0.5 },
        { count: 3, damage: 8,  interval: 2.0, spread: 0.55 },
        { count: 4, damage: 8,  interval: 1.9, spread: 0.6 },
        { count: 4, damage: 10, interval: 1.8, spread: 0.65 },
        { count: 5, damage: 12, interval: 1.7, spread: 0.7 },
      ],
    },
  },

  passives: {
    attack: { name: '攻击力+', per: 0.2,  max: 5, desc: '全武器伤害 +20%' },
    haste:  { name: '攻速+',   per: 0.15, max: 5, desc: '全武器触发间隔 -15%' },
    speed:  { name: '移速+',   per: 0.1,  max: 5, desc: '移动速度 +10%' },
  },

  bullets: {
    blade:   { speed: 420, radius: 9, life: 1.5, pierce: 99 },
    scatter: { speed: 380, radius: 6, life: 1.2, pierce: 0 },
  },

  orbit: { radius: 78, ballRadius: 12, spin: 2.6 },
};
