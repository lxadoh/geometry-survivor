const canvas = document.getElementById('game');
const game = new Game(canvas);

HUD.init();
UpgradeUI.init();
Screens.init({
  start: () => { AudioMan.click(); game.startRun(); },
  home: () => { AudioMan.click(); game.toMenu(); },
});

const armAudio = () => { AudioMan.init(); AudioMan.resume(); };
window.addEventListener('pointerdown', armAudio, { once: true });
window.addEventListener('keydown', armAudio, { once: true });

const muteBtn = document.getElementById('btn-mute');
const syncMuteIcon = () => { muteBtn.textContent = AudioMan.muted ? '🔇' : '🔊'; };
AudioMan.loadMuted();
syncMuteIcon();
muteBtn.addEventListener('click', () => {
  AudioMan.setMuted(!AudioMan.muted);
  syncMuteIcon();
  if (!AudioMan.muted) AudioMan.click();
});

window.addEventListener('resize', () => game.resize());
game.toMenu();

const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
let wechatPortraitOk = false;

const rotateMql = window.matchMedia('(orientation: portrait) and (pointer: coarse)');
const syncRotate = () => {
  game.paused = rotateMql.matches && !(isWeChat && wechatPortraitOk);
};
if (rotateMql.addEventListener) rotateMql.addEventListener('change', syncRotate);
syncRotate();

const fsBtn = document.getElementById('btn-fullscreen');
const fsEnabled = document.documentElement.requestFullscreen
  || document.documentElement.webkitRequestFullscreen;
if (fsBtn && fsEnabled && matchMedia('(pointer: coarse)').matches) {
  fsBtn.style.display = 'flex';
  fsBtn.addEventListener('click', () => {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    } else {
      try {
        const p = fsEnabled.call(el);
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
    }
  });
}

if (isWeChat) {
  const rp = document.getElementById('rotate-prompt');
  const sub = rp.querySelector('.rp-sub');
  if (sub) sub.innerHTML = '微信内无法横屏<br>点右上角 ··· 选「在浏览器打开」体验最佳';
  const btn = document.createElement('button');
  btn.className = 'btn btn-ghost';
  btn.textContent = '竖屏继续游玩';
  btn.style.marginTop = '8px';
  btn.addEventListener('click', () => {
    wechatPortraitOk = true;
    rp.style.display = 'none';
    syncRotate();
  });
  rp.appendChild(btn);
}

let last = performance.now();
let fpsEma = 60;
let lowT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  let dt = (t - last) / 1000;
  last = t;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  game.tick(dt);
  if (game.state === 'playing') HUD.update(game);

  if (dt > 0.001) {
    fpsEma += (1 / dt - fpsEma) * 0.04;
    if (fpsEma < 42 && game.state === 'playing' && !game.paused) {
      lowT += dt;
      if (lowT > 4) game.setLowQuality();
    } else {
      lowT = 0;
    }
  }
}
requestAnimationFrame(frame);
