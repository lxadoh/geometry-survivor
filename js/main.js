const canvas = document.getElementById('game');
const game = new Game(canvas);

HUD.init();
UpgradeUI.init();
Screens.init({
  start: () => game.startRun(),
  home: () => game.toMenu(),
});

window.addEventListener('resize', () => game.resize());
game.toMenu();

let last = performance.now();
function frame(t) {
  requestAnimationFrame(frame);
  let dt = (t - last) / 1000;
  last = t;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  game.tick(dt);
  if (game.state === 'playing') HUD.update(game);
}
requestAnimationFrame(frame);
