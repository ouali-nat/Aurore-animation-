/* Branche les 20 personnages 2D (characters-2d.js) sur le moteur d'animation.
   Usage dans la scène : "char": { "id": "aurore" }  (ids : aurore, aicha, sana, mei, amara, zara, ines, chloe, lina, fatou, malik, koffi, idrissa, noah, tariq, samuel, elias, gabriel, kwame, yuki)
   Toutes les animations existantes (walk, jump, wave, dance, say, sway, bounce…) fonctionnent. */
(function () {
  const IMG = {}, H = 140, W = H * 200 / 262;
  M.human = { leg: 30, legW: 10, bw: 60, bh: 60, body: 'rect', arm: { L: 30, w: 10 }, ax: .5, ay: .8, head: { w: 50, h: 50, shape: 'rect' } };
  for (const ch of CHARACTERS_2D) {
    const im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawCharacter(ch, 400));
    IMG[ch.id] = im;
  }
  const _rig = drawRig;
  drawRig = function (c, sp, st) {
    const im = IMG[sp.id];
    if (!im) return _rig(c, sp, st);
    const B = st.bones, lift = Math.max(B.legL, B.legR) * .25;
    c.save();
    c.rotate(rad(B.body + B.head * .6 + (B.legL - B.legR) * .1));
    c.scale(1, 1 + (B.breath || 0) + (st.mouth === 'talk' ? Math.sin(st.t * 14) * .012 : 0));
    c.drawImage(im, -W / 2, -H - lift, W, H);
    c.restore();
  };
  const _dt = drawTrack;
  drawTrack = function (c, k, p, cam) {
    if (k.char && k.char.id && !k.char.model && IMG[k.char.id]) k.char.model = 'human';
    _dt(c, k, p, cam);
  };

  /* Catalogue animé */
  const h = document.createElement('h2'); h.textContent = 'Personnages humains 2D (champ "id")';
  const g = document.createElement('div');
  g.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px';
  const cs = CHARACTERS_2D.map(ch => {
    const d = document.createElement('div'), k = document.createElement('canvas');
    k.width = 90; k.height = 120;
    d.style.cssText = 'border:1px solid #1d3a2c;border-radius:6px;text-align:center;font-size:11px;padding:3px';
    d.appendChild(k); d.append(ch.id); g.appendChild(d);
    return { id: ch.id, c: k.getContext('2d') };
  });
  document.body.append(h, g);
  (function pv(now) {
    const tt = now / 1000;
    for (const { id, c } of cs) {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 90, 120);
      c.translate(45, 112); c.scale(.75, .75);
      drawRig(c, { model: 'human', id }, { t: tt, bones: { head: Math.sin(tt * 2) * 5, body: 0, armL: 0, armR: 0, legL: Math.max(0, Math.sin(tt * 3)) * 20, legR: 0, breath: Math.sin(tt * 2.2) * .012 } });
    }
    requestAnimationFrame(pv);
  })(performance.now());
})();
