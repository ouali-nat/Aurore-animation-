/* Branche les 20 personnages 2D (characters-2d.js) sur le moteur d'animation, avec corps complet
   (buste illustré + bras + jambes articulés).
   Usage dans la scène : "char": { "id": "aurore" }
   Ids : aurore, aicha, sana, mei, amara, zara, ines, chloe, lina, fatou, malik, koffi, idrissa, noah, tariq, samuel, elias, gabriel, kwame, yuki
   Os : head, body, armL, armR, legL, legR — toutes les animations (walk, jump, wave, dance, say, sway, bounce…) fonctionnent. */
(function () {
  const K = '#1a1210', HB = 110, S = HB / 262, W = 200 * S, HIP = 62, LEG = 58;
  const IMG = {}, CH = {};
  // [pantalon/bas, chaussures]
  const BOT = { aurore: ['#2e3a52', '#f2f0ea'], aicha: ['#253c6b', '#412c25'], sana: ['#5d3e72', '#343447'], mei: ['#34466a', '#30354b'], amara: ['#b65b91', '#302033'], zara: ['#c34c7a', '#422535'], ines: ['#3d4e70', '#413149'], chloe: ['#315781', '#8a4e35'], lina: ['#394052', '#30293e'], fatou: ['#26736c', '#292a32'], malik: ['#1c2639', '#171a23'], koffi: ['#233b45', '#f0e6d6'], idrissa: ['#263f31', '#f2f0e7'], noah: ['#242c44', '#4b3028'], tariq: ['#5f523c', '#382f24'], samuel: ['#344b63', '#44342c'], elias: ['#2b313b', '#42312a'], gabriel: ['#d5b46a', '#eae6db'], kwame: ['#222631', '#ece8df'], yuki: ['#202c46', '#e2e5ee'] };
  M.human = { leg: 60, legW: 15, bw: 62, bh: 60, body: 'rect', arm: { L: 44, w: 11 }, ax: .5, ay: .8, head: { w: 50, h: 52, shape: 'rect' } };
  for (const ch of CHARACTERS_2D) {
    CH[ch.id] = ch;
    const im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawCharacter(ch, 400));
    IMG[ch.id] = im;
  }
  const limb = (c, w, L, col) => {
    c.fillStyle = col; c.beginPath(); (c.roundRect || c.rect).call(c, -w / 2, 0, w, L, w / 2); c.fill(); c.stroke();
  };
  const _rig = drawRig;
  drawRig = function (c, sp, st) {
    const ch = CH[sp.id], im = IMG[sp.id];
    if (!im) return _rig(c, sp, st);
    const B = st.bones, bt = BOT[sp.id] || ['#333', '#eee'];
    c.save(); c.lineWidth = 1.8; c.strokeStyle = K; c.lineJoin = 'round';
    for (const s of [-1, 1]) {            // jambes + chaussures
      c.save(); c.translate(s * 12, -HIP); c.rotate(rad(s > 0 ? -B.legR : B.legL));
      limb(c, 16, LEG, bt[0]);
      c.fillStyle = bt[1]; c.beginPath(); c.ellipse(s * 3, LEG, 11, 5.5, 0, 0, 6.3); c.fill(); c.stroke();
      c.restore();
    }
    c.fillStyle = bt[0]; c.fillRect(-20, -HIP - 4, 40, 12);
    c.save();                              // buste + bras
    c.translate(0, -HIP - Math.max(B.legL, B.legR) * .1);
    c.rotate(rad(B.body + B.head * .6));
    c.scale(1, 1 + (B.breath || 0) + (st.mouth === 'talk' ? Math.sin(st.t * 14) * .012 : 0));
    c.drawImage(im, -W / 2, -HB, W, HB);
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * 31, -HB + 196 * S); c.rotate(rad(s > 0 ? -B.armR : B.armL));
      limb(c, 11, 42, ch.st == 'tee' ? ch.skin : ch.top);
      c.fillStyle = ch.skin; c.beginPath(); c.arc(0, 45, 5.5, 0, 6.3); c.fill(); c.stroke();
      limb(c, 13, 16, ch.top);
      c.restore();
    }
    c.restore(); c.restore();
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
    k.width = 90; k.height = 130;
    d.style.cssText = 'border:1px solid #1d3a2c;border-radius:6px;text-align:center;font-size:11px;padding:3px';
    d.appendChild(k); d.append(ch.id); g.appendChild(d);
    return { id: ch.id, c: k.getContext('2d') };
  });
  document.body.append(h, g);
  (function pv(now) {
    const tt = now / 1000, s = Math.sin(tt * 3);
    for (const { id, c } of cs) {
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 90, 130);
      c.translate(45, 122); c.scale(.66, .66);
      drawRig(c, { model: 'human', id }, { t: tt, bones: { head: Math.sin(tt * 2) * 5, body: 0, armL: 6 + s * 18, armR: 6 - s * 18, legL: Math.max(0, s) * 25, legR: Math.max(0, -s) * 25, breath: Math.sin(tt * 2.2) * .012 } });
    }
    requestAnimationFrame(pv);
  })(performance.now());
})();
