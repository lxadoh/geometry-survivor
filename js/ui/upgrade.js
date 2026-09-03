const UpgradeUI = {
  el: null,
  cardsEl: null,
  picked: false,

  ACCENTS: {
    blade: '#6fd3ff', orbit: '#b7a8ff', scatter: '#ffb35c',
    lightning: '#ffe066', shock: '#4dd0e1',
    attack: '#ff7a7a', haste: '#ffe066', speed: '#7ee787', hp: '#5affa8', pickup: '#7ee787', heal: '#7ee787',
  },

  ICONS: {
    blade: '<svg viewBox="0 0 32 24"><path d="M2 12 L16 5 L30 12 L16 19 Z" fill="currentColor"/></svg>',
    orbit: '<svg viewBox="0 0 32 24"><circle cx="16" cy="12" r="4" fill="currentColor"/><circle cx="27" cy="12" r="3" fill="currentColor" opacity=".55"/><circle cx="5" cy="12" r="3" fill="currentColor" opacity=".55"/></svg>',
    scatter: '<svg viewBox="0 0 32 24"><circle cx="16" cy="19" r="3.5" fill="currentColor"/><circle cx="8" cy="6" r="3.5" fill="currentColor" opacity=".7"/><circle cx="24" cy="6" r="3.5" fill="currentColor" opacity=".7"/></svg>',
    lightning: '<svg viewBox="0 0 32 24"><path d="M18 1 L8 14 H14 L12 23 L24 9 H17 Z" fill="currentColor"/></svg>',
    shock: '<svg viewBox="0 0 32 24"><circle cx="16" cy="12" r="3" fill="currentColor"/><path d="M9 5 A10 10 0 0 0 9 19" fill="none" stroke="currentColor" stroke-width="2"/><path d="M23 5 A10 10 0 0 1 23 19" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    pickup: '<svg viewBox="0 0 32 24"><circle cx="16" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="4" cy="4" r="2" fill="currentColor" opacity=".6"/><circle cx="28" cy="4" r="2" fill="currentColor" opacity=".6"/><circle cx="4" cy="20" r="2" fill="currentColor" opacity=".6"/><circle cx="28" cy="20" r="2" fill="currentColor" opacity=".6"/></svg>',
    attack: '<svg viewBox="0 0 32 24"><path d="M16 2 L24 13 H20 V22 H12 V13 H8 Z" fill="currentColor"/></svg>',
    haste: '<svg viewBox="0 0 32 24"><path d="M19 2 L9 14 H14 L12 22 L23 10 H17 Z" fill="currentColor"/></svg>',
    speed: '<svg viewBox="0 0 32 24"><path d="M4 4 L12 12 L4 20 Z" fill="currentColor"/><path d="M14 4 L22 12 L14 20 Z" fill="currentColor" opacity=".7"/></svg>',
    hp: '<svg viewBox="0 0 32 24"><path d="M13 3 H19 V9 H25 V15 H19 V21 H13 V15 H7 V9 H13 Z" fill="currentColor"/></svg>',
    heal: '<svg viewBox="0 0 32 24"><path d="M13 3 H19 V9 H25 V15 H19 V21 H13 V15 H7 V9 H13 Z" fill="currentColor"/></svg>',
  },

  init() {
    this.el = document.getElementById('screen-upgrade');
    this.cardsEl = document.getElementById('cards');
  },

  open(choices, onPick) {
    this.picked = false;
    this.cardsEl.innerHTML = '';
    choices.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'card';
      btn.style.setProperty('--accent', this.ACCENTS[c.icon] || '#6fd3ff');
      btn.style.animationDelay = (i * 0.07) + 's';
      const icon = this.ICONS[c.icon] || this.ICONS.heal;
      btn.innerHTML =
        '<div class="card-icon">' + icon + '</div>' +
        '<div class="card-body">' +
        '<div class="card-name">' + c.name + '</div>' +
        '<div class="card-tag">' + c.tag + '</div>' +
        '<div class="card-desc">' + c.desc + '</div>' +
        '</div>';
      btn.addEventListener('click', () => {
        if (this.picked) return;
        this.picked = true;
        onPick(c);
      });
      this.cardsEl.appendChild(btn);
    });
    this.el.classList.remove('hidden');
  },

  close() {
    this.el.classList.add('hidden');
    this.cardsEl.innerHTML = '';
  }
};
