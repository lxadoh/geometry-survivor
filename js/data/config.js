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
  growth: { hp: 0.34, dmg: 0.17, lateStart: 5, hpLate: 0.27, dmgLate: 0.06 },
  xp: { base: 5, perLevel: 7 },

  enemies: {
    grunt: { radius: 13, speed: 72,  hp: 10, damage: 8,  xp: 1, color: '#ff5b4d', knockMul: 1 },
    fast:  { radius: 10, speed: 140, hp: 7,  damage: 5,  xp: 1, color: '#ff9a3d', knockMul: 1.4 },
    tank:  { radius: 26, speed: 38,  hp: 70, damage: 16, xp: 3, color: '#d64545', knockMul: 0.25 },
  },

  elite: { hpMul: 6, dmgMul: 1.3, speedMul: 0.92, radiusMul: 1.28, xpMul: 8 },

  boss: {
    warnTime: 8,
    schedule: [3, 6, 9],
    repeatEvery: 180,
    hpCycleMul: 1.8,
    bullet: { speed: 150, life: 7, radius: 7, damage: 12, max: 60 },
    defs: {
      square:   { name: '巨盾方阵',   radius: 46, hp: 620,  damage: 15, speed: 55, color: '#ff4d6d' },
      triangle: { name: '三角军团之首', radius: 42, hp: 1400, damage: 17, speed: 92, color: '#ff7a3d' },
      core:     { name: '混沌之核',   radius: 50, hp: 2600, damage: 19, speed: 40, color: '#c44dff' },
    },
  },

  gemRain: { count: 42, value: 2 },

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
      desc: '自动射向最近敌人；2 级起命中后弹射链打下一个敌人',
      interval: 1.1,
      levels: [
        { count: 1, damage: 10, speed: 420, radius: 9,  bounces: 0 },
        { count: 1, damage: 13, speed: 430, radius: 10, bounces: 1 },
        { count: 1, damage: 16, speed: 440, radius: 10, bounces: 2 },
        { count: 1, damage: 20, speed: 460, radius: 11, bounces: 3 },
        { count: 1, damage: 26, speed: 480, radius: 14, bounces: 4 },
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
        { count: 4, damage: 6,  spread: 0.5,  radius: 6 },
        { count: 4, damage: 9,  spread: 0.55, radius: 6 },
        { count: 5, damage: 9,  spread: 0.6,  radius: 7 },
        { count: 5, damage: 13, spread: 0.65, radius: 8 },
        { count: 6, damage: 16, spread: 0.7,  radius: 9 },
      ],
    },
    lightning: {
      name: '闪电',
      desc: '从天而降劈中屏幕内随机敌人，并波及周围的敌人',
      interval: 3.2,
      levels: [
        { count: 1, damage: 24, radius: 95 },
        { count: 1, damage: 32, radius: 105 },
        { count: 2, damage: 32, radius: 115 },
        { count: 2, damage: 42, radius: 125 },
        { count: 3, damage: 52, radius: 140 },
      ],
    },
    shock: {
      name: '冲击波',
      desc: '周期性以你为中心释放一圈范围冲击，击退敌人',
      interval: 3.6,
      levels: [
        { radius: 150, damage: 22 },
        { radius: 170, damage: 30 },
        { radius: 200, damage: 38 },
        { radius: 235, damage: 48 },
        { radius: 275, damage: 62 },
      ],
    },
  },

  passives: {
    attack: { name: '攻击力+', per: 0.2,  max: 5, desc: '全武器伤害 +20%' },
    haste:  { name: '攻速+',   per: 0.15, max: 5, desc: '全武器触发间隔 -15%' },
    speed:  { name: '移速+',   per: 0.1,  max: 5, desc: '移动速度 +10%' },
    hp:     { name: '最大生命+', per: 20, max: 5, desc: '最大生命 +20 并回复该数值' },
    pickup: { name: '拾取范围+', per: 0.3, max: 5, desc: '经验宝石吸取范围 +30%' },
  },

  bullets: {
    scatter: { speed: 380, life: 1.3 },
  },

  orbit: { ballRadius: 12, spin: 2.6, hitCd: 0.4 },
};
