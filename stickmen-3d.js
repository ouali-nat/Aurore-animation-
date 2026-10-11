/* Aurore Animation — 20 stickmen 3D style encre (Three.js).
   API : buildCharacter3D(c) -> { root, P, c, anim } ; poseCharacter3D(o, t) ; catalogue CHARACTERS_STICK.
   Animations : idle, walk, run, attack, cast, jump, pose. */
(function (g) {
  const T = g.THREE, R = Math.PI / 180, PI = Math.PI;
  const INK = new T.MeshBasicMaterial({ color: 0x0d0d0d });
  const PAPER = new T.MeshBasicMaterial({ color: 0xf1eee8 });
  const fx = (c, o) => new T.MeshBasicMaterial({ color: c, transparent: o < 1, opacity: o == null ? 1 : o, side: T.DoubleSide, depthWrite: o == null || o >= 1 });
  const mesh = (geo, mat) => new T.Mesh(geo, mat || INK);
  const place = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); return m; };
  const cyl = (r0, r1, h, mat) => mesh(new T.CylinderGeometry(r0, r1, h, 8), mat);
  const ball = (r, mat) => mesh(new T.SphereGeometry(r, 14, 10), mat);
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

  function limb(len, r0, r1, k) {
    // Membres épais à contour noir et intérieur clair, raccords adoucis.
    const grp = new T.Group();
    const bend = len * .018;
    const curve = new T.CatmullRomCurve3([
      new T.Vector3(0, 0, 0),
      new T.Vector3(bend * .35, -len * .32, 0),
      new T.Vector3(bend, -len * .66, 0),
      new T.Vector3(0, -len, 0)
    ]);
    const outer = Math.max(r0, r1) * k * .92;
    const inner = outer * .76;
    grp.add(mesh(new T.TubeGeometry(curve, 16, outer, 10, false), INK));
    const innerTube = mesh(new T.TubeGeometry(curve, 16, inner, 10, false), PAPER);
    innerTube.position.z = (outer - inner) * 1.25;
    grp.add(innerTube);
    const start = Math.max(r0, r1) * k * .92;
    const end = Math.min(r0, r1) * k * .92;
    grp.add(ball(start, INK));
    grp.add(place(ball(end, INK), 0, -len, 0));
    const innerStart = ball(start * .76, PAPER);
    innerStart.position.z = (start - start * .76) * 1.25;
    grp.add(innerStart);
    grp.add(place(ball(end * .76, PAPER), 0, -len, (end - end * .76) * 1.25));
    return grp;
  }
  const shaft = (wp, a, b, r) => wp.add(place(cyl(r || .022, r || .022, b - a), 0, (a + b) / 2, 0));
  const tip = (wp, y, r, h, sx, sz, seg) => { const m = mesh(new T.ConeGeometry(r, h, seg || 6)); m.scale.set(sx || 1, 1, sz || 1); wp.add(place(m, 0, y + h / 2, 0)); };

  /* ---------- Armes : construites le long de +y, tenues dans le repère de la main ---------- */
  const W = {
    scythe(wp) {
      shaft(wp, -.6, 1.3, .025);
      const bg = new T.Group(), b = mesh(new T.TorusGeometry(.62, .07, 6, 30, 2.2));
      b.rotation.z = -PI / 2; bg.add(b); bg.scale.set(1, -1, .55); bg.rotation.y = -PI / 2; bg.position.set(0, 1.3 - .62, 0); wp.add(bg);
      wp.add(place(ball(.045), 0, -.6, 0));
    },
    spear(wp) {
      shaft(wp, -.8, 1.4); tip(wp, 1.4, .07, .36, 1, .6);
      for (const s of [-1, 1]) wp.add(place(mesh(new T.ConeGeometry(.03, .15, 5)), s * .07, 1.36, 0, 0, 0, -s * .8));
    },
    sword(wp) {
      shaft(wp, -.1, .12, .025); wp.add(place(mesh(new T.BoxGeometry(.26, .035, .05)), 0, .14, 0)); tip(wp, .16, .05, 1, 1, .28, 4);
    },
    katana(wp) {
      shaft(wp, -.22, .1, .024); wp.add(place(cyl(.065, .065, .015), 0, .12, 0)); tip(wp, .13, .032, 1.1, 1, .3, 4);
    },
    axe(wp) {
      shaft(wp, -.4, 1.0, .026);
      wp.add(place(mesh(new T.BoxGeometry(.34, .26, .05)), .17, .86, 0));
      wp.add(place(mesh(new T.BoxGeometry(.05, .34, .06)), .34, .86, 0));
    },
    hammer(wp) { shaft(wp, -.4, 1.0, .028); wp.add(place(mesh(new T.BoxGeometry(.36, .2, .2)), 0, 1.0, 0)); },
    bow(wp) {
      const a = mesh(new T.TorusGeometry(.6, .026, 6, 26, PI)); a.rotation.set(0, -PI / 2, -PI / 2); wp.add(a);
      wp.add(place(cyl(.008, .008, 1.2), 0, 0, 0));
    },
    dagger(wp) { shaft(wp, -.06, .08, .022); wp.add(place(mesh(new T.BoxGeometry(.14, .03, .04)), 0, .09, 0)); tip(wp, .1, .04, .42, 1, .3, 4); },
    shield(wp) {
      wp.add(place(cyl(.4, .4, .05), 0, .2, .1, PI / 2, 0, 0));
      wp.add(place(mesh(new T.TorusGeometry(.4, .03, 6, 24)), 0, .2, .12));
      wp.add(place(ball(.07), 0, .2, .16));
    },
    trident(wp) {
      shaft(wp, -.7, 1.3); tip(wp, 1.3, .045, .36, 1, 1);
      for (const s of [-1, 1]) { wp.add(place(cyl(.016, .016, .2), s * .1, 1.3, 0)); wp.add(place(mesh(new T.ConeGeometry(.035, .3, 6)), s * .1, 1.55, 0)); }
      wp.add(place(mesh(new T.BoxGeometry(.24, .03, .03)), 0, 1.2, 0));
    },
    staff(wp) {
      shaft(wp, -.8, 1.1, .028); wp.add(place(mesh(new T.TorusGeometry(.12, .02, 6, 20)), 0, 1.15, 0));
      const orb = ball(.07, fx(0x7ad0ff)); wp.add(place(orb, 0, 1.15, 0));
      return (t, k) => orb.scale.setScalar(1 + .25 * Math.sin(t * 5) * k);
    },
    glaive(wp) { shaft(wp, -1, 1.0); tip(wp, 1.0, .06, .34, 1, .5); const b = mesh(new T.ConeGeometry(.06, .34, 6)); b.scale.z = .5; wp.add(place(b, 0, -1.17, 0, PI, 0, 0)); },
    halberd(wp) {
      shaft(wp, -.6, 1.3, .026); tip(wp, 1.3, .05, .3, 1, .6);
      wp.add(place(mesh(new T.BoxGeometry(.3, .26, .05)), .15, 1.02, 0)); wp.add(place(mesh(new T.ConeGeometry(.04, .2, 5)), -.1, 1.05, 0, 0, 0, PI / 2));
    },
    rapier(wp) {
      shaft(wp, -.12, .1, .02); wp.add(place(cyl(.09, .09, .015), 0, .12, 0)); tip(wp, .13, .018, 1.15, 1, 1, 5);
    },
    /* Éléments */
    fire(wp) {
      const fl = []; for (let i = 0; i < 6; i++) { const m = mesh(new T.ConeGeometry(.07, .28, 6), fx(i % 2 ? 0xff7a1a : 0xffc23a)); wp.add(m); fl.push(m); }
      return (t, k) => fl.forEach((m, i) => { const a = i / 6 * 6.283 + t * 3; m.position.set(Math.cos(a) * .09, .12 + Math.sin(t * 9 + i) * .03, Math.sin(a) * .09); m.scale.setScalar((.8 + .5 * Math.sin(t * 11 + i * 2)) * (.7 + k * .6)); });
    },
    water(wp) {
      const s = []; for (let i = 0; i < 5; i++) { const m = ball(.05 + (i % 2) * .02, fx(0x3aa0ff, .9)); wp.add(m); s.push(m); }
      return (t, k) => s.forEach((m, i) => { const a = t * 2.5 + i * 1.26, r = .22 * (.8 + k * .4); m.position.set(Math.cos(a) * r, .05 + Math.sin(a * 2) * .1, Math.sin(a) * r); });
    },
    earth(wp) {
      const s = []; for (let i = 0; i < 4; i++) { const m = mesh(new T.IcosahedronGeometry(.07 + (i % 2) * .03, 0), fx(0x5a4632)); wp.add(m); s.push(m); }
      return (t, k) => s.forEach((m, i) => { const a = t * 1.4 + i * 1.57, r = .24 * (.8 + k * .4); m.position.set(Math.cos(a) * r, .05 + Math.sin(t * 2 + i) * .08, Math.sin(a) * r); m.rotation.set(t + i, t * .7, 0); });
    },
    lightning(wp) {
      const sg = []; for (let i = 0; i < 7; i++) { const m = cyl(.012, .012, .2, fx(0xffe14a)); wp.add(m); sg.push(m); }
      return (t, k) => sg.forEach((m, i) => { m.position.set(Math.sin(t * 40 + i * 3.1) * .08, Math.cos(t * 37 + i * 1.7) * .08, .1 + i * .17); m.rotation.set(PI / 2 + Math.sin(t * 50 + i) * .5, 0, Math.sin(t * 43 + i * 2) * .7); m.visible = Math.sin(t * 30) > -.6; });
    },
    air(wp) {
      const rings = [0, 1, 2].map(() => { const m = mesh(new T.TorusGeometry(.3, .018, 6, 28)); wp.add(m); return m; });
      const gust = mesh(new T.CylinderGeometry(.7, .06, 1.8, 20, 1, true), fx(0x8c8c8c, .28)); gust.rotation.x = PI / 2; gust.position.z = 1; wp.add(gust);
      return (t, k) => rings.forEach((m, i) => { const p = (t * .8 + i / 3) % 1; m.position.z = .35 + p * 1.7; m.scale.setScalar((.4 + p * 1.2) * (.8 + k * .3)); });
    },
    monk(wp) {
      const orb = ball(.12, fx(0xfff2c0)); wp.add(orb);
      return (t, k) => { orb.position.set(0, .05, .35 + .05 * Math.sin(t * 3)); orb.scale.setScalar((1 + .2 * Math.sin(t * 6)) * (.8 + k * .5)); };
    }
  };

  // [id, nom, arme, tête]
  const D = [['faucheur', 'Faucheur', 'scythe', 'fill'], ['lancier', 'Lancier', 'spear', 'ring'], ['air', 'Air', 'air', 'ring'], ['epeiste', 'Épéiste', 'sword', 'fill'], ['samourai', 'Samouraï', 'katana', 'ring'], ['bucheron', 'Bûcheron', 'axe', 'fill'], ['titan', 'Titan', 'hammer', 'fill'], ['archer', 'Archer', 'bow', 'ring'], ['assassin', 'Assassin', 'dual', 'fill'], ['gardien', 'Gardien', 'shield', 'ring'], ['triton', 'Triton', 'trident', 'fill'], ['mage', 'Mage', 'staff', 'ring'], ['feu', 'Feu', 'fire', 'fill'], ['eau', 'Eau', 'water', 'ring'], ['terre', 'Terre', 'earth', 'fill'], ['foudre', 'Foudre', 'lightning', 'ring'], ['glaive', 'Glaive', 'glaive', 'fill'], ['hallebardier', 'Hallebardier', 'halberd', 'ring'], ['duelliste', 'Duelliste', 'rapier', 'fill'], ['moine', 'Moine', 'monk', 'ring']];
  g.CHARACTERS_STICK = D.map((d, i) => ({ id: d[0], name: d[1], weapon: d[2], head: d[3], h: +(.94 + ((i * 7) % 5) * .03).toFixed(2), th: +(.9 + ((i * 3) % 4) * .12).toFixed(2) }));

  function headMesh(style) {
    const h = new T.Group();
    if (style === 'fill') h.add(ball(.17));
    else {
      h.add(ball(.165, PAPER));
      for (const r of [[0, 0, 0], [PI / 2, 0, 0], [0, PI / 2, 0]]) h.add(place(mesh(new T.TorusGeometry(.17, .013, 6, 28)), 0, 0, 0, r[0], r[1], r[2]));
    }
    return h;
  }

  g.buildCharacter3D = function (c) {
    const k = c.th || 1, root = new T.Group(), P = {}, upd = [];
    root.scale.setScalar(c.h || 1);
    const gnd = mesh(new T.CircleGeometry(.6, 24), fx(0x000000, .12)); gnd.rotation.x = -PI / 2; gnd.position.y = .003; root.add(gnd);
    P.hips = place(new T.Group(), 0, .95, 0); root.add(P.hips);
    for (const s of [-1, 1]) {
      // Jambes écartées en V : cuisses obliques, mollets plus verticaux.
      const hip = place(new T.Group(), s * .075, 0, 0, 0, 0, s < 0 ? -.43 : .43);
      hip.userData.baseZ = s < 0 ? -.43 : .43;
      P.hips.add(hip); hip.add(limb(.47, .068, .055, k));
      const knee = place(new T.Group(), 0, -.47, 0, 0, 0, s < 0 ? .30 : -.30);
      knee.userData.baseZ = s < 0 ? .30 : -.30;
      hip.add(knee); knee.add(limb(.47, .055, .042, k));
      const foot = place(mesh(new T.SphereGeometry(.067 * k, 16, 10), INK), s < 0 ? -.015 : .02, -.485, .075, 0, 0, s < 0 ? -.14 : .14);
      foot.scale.set(1.75, .62, 1);
      const sole = place(mesh(new T.SphereGeometry(.051 * k, 16, 10), PAPER), s < 0 ? -.015 : .02, -.478, .11, 0, 0, s < 0 ? -.14 : .14);
      sole.scale.set(1.65, .48, .78);
      knee.add(foot); knee.add(sole);
      P[s < 0 ? 'hipL' : 'hipR'] = hip; P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
    }
    P.spine = new T.Group(); P.hips.add(P.spine);
    const torsoShape = new T.Shape();
    torsoShape.moveTo(0, .565);
    torsoShape.quadraticCurveTo(.035, .545, .065, .515);
    torsoShape.bezierCurveTo(.13, .50, .225, .455, .29, .405);
    torsoShape.lineTo(.33, .345);
    torsoShape.quadraticCurveTo(.33, .30, .28, .245);
    torsoShape.lineTo(.16, .12);
    torsoShape.quadraticCurveTo(.125, .085, .12, .045);
    torsoShape.lineTo(.085, .012);
    torsoShape.lineTo(.035, -.085);
    torsoShape.quadraticCurveTo(0, -.13, -.035, -.085);
    torsoShape.lineTo(-.085, .012);
    torsoShape.lineTo(-.12, .045);
    torsoShape.quadraticCurveTo(-.125, .085, -.16, .12);
    torsoShape.lineTo(-.28, .245);
    torsoShape.quadraticCurveTo(-.33, .30, -.33, .345);
    torsoShape.lineTo(-.29, .405);
    torsoShape.bezierCurveTo(-.225, .455, -.13, .50, -.065, .515);
    torsoShape.quadraticCurveTo(-.035, .545, 0, .565);
    const torsoEdge = mesh(new T.ShapeGeometry(torsoShape), fx(0x0d0d0d));
    torsoEdge.position.z = .012;
    P.spine.add(torsoEdge);
    const torsoFill = mesh(new T.ShapeGeometry(torsoShape), fx(0xf1eee8));
    torsoFill.scale.set(.88, .955, 1);
    torsoFill.position.z = .027;
    P.spine.add(torsoFill);
    P.head = place(new T.Group(), 0, .53, 0); P.spine.add(P.head); P.head.add(place(headMesh(c.head), 0, .19, 0));
    for (const s of [-1, 1]) {
      const sh = place(new T.Group(), s * .265, .365, 0); P.spine.add(sh);
      sh.add(limb(.31, .052, .043, k));
      const el = place(new T.Group(), 0, -.31, 0); sh.add(el); el.add(limb(.29, .043, .034, k));
      const hand = place(new T.Group(), 0, -.29, 0); el.add(hand);
      hand.add(ball(.052 * k, INK));
      const handFill = ball(.038 * k, PAPER); handFill.position.z = .024; hand.add(handFill);
      P[s < 0 ? 'armL' : 'armR'] = sh; P[s < 0 ? 'elbowL' : 'elbowR'] = el; P[s < 0 ? 'handL' : 'handR'] = hand;
    }
    const attach = (H, w) => { const wp = new T.Group(); wp.rotation.x = PI / 2; H.add(wp); const u = W[w](wp); if (u) upd.push(u); };
    const w = c.weapon;
    if (w === 'dual') { attach(P.handR, 'dagger'); attach(P.handL, 'dagger'); }
    else if (w === 'shield') { attach(P.handR, 'sword'); attach(P.handL, 'shield'); }
    else if (['fire', 'water', 'earth', 'lightning'].includes(w)) { attach(P.handR, w); attach(P.handL, w); }
    else attach(P.handR, w);
    return { root, P, c, anim: 'idle', pivot: 0, fx: upd, ready: true, error: null, onReady(fn) { fn(null); } };
  };

  g.poseCharacter3D = function (o, t) {
    const P = o.P, a = o.anim || 'idle';
    const B = { aLx: 0, aLz: 22, eL: 15, aRx: -20, aRz: 22, eR: 70, hL: 3, kL: 6, hR: -3, kR: 6, lean: 0, twist: 0, hd: 0, by: 0, k: .6, rz: 0 };
    const br = Math.sin(t * 2.2) * 2;
    if (a === 'idle') { B.lean = br * .5; B.aLz = 10 + br; B.hd = Math.sin(t * 1.3) * 3; }
    if (a === 'walk' || a === 'run') {
      const run = a === 'run', s = Math.sin(t * (run ? 8 : 4));
      B.hL = s * (run ? 55 : 30); B.hR = -B.hL; B.kL = Math.max(0, s) * (run ? 80 : 35); B.kR = Math.max(0, -s) * (run ? 80 : 35);
      B.aLx = -s * (run ? 50 : 28); B.eL = run ? 80 : 20; B.aRx = -20 + s * (run ? 30 : 10); B.eR = run ? 80 : 70;
      B.lean = run ? 20 : 6; B.by = Math.abs(s) * (run ? .08 : .03);
    }
    if (a === 'attack') {
      const p = (t % 1.4) / 1.4;
      B.aRx = p < .5 ? lerp(-20, -170, p / .5) : p < .62 ? lerp(-170, 10, (p - .5) / .12) : lerp(10, -20, (p - .62) / .38);
      B.twist = p < .5 ? -.5 * (p / .5) : p < .62 ? lerp(-.5, .6, (p - .5) / .12) : lerp(.6, 0, (p - .62) / .38);
      B.eR = 20; B.lean = 12; B.hL = -30; B.kL = 20; B.hR = 25; B.kR = 8; B.aLz = 60; B.k = p > .5 && p < .65 ? 1.3 : .6;
    }
    if (a === 'cast') { B.aLx = -85; B.eL = 8; B.aRx = -85; B.eR = 8; B.aLz = 4; B.aRz = 4; B.lean = -4; B.hL = -20; B.hR = 20; B.k = 1.2; }
    if (a === 'jump') {
      B.by = Math.abs(Math.sin(t * 3)) * .5; B.hL = -45; B.kL = 70; B.hR = -30; B.kR = 60; B.aLz = 130; B.aRx = -160; B.eR = 10; B.lean = -4;
    }
    if (a === 'pose') { B.lean = 10; B.twist = .4; B.aRx = -140; B.eR = 20; B.aLz = 70; B.eL = 20; B.hL = -28; B.kL = 30; B.hR = 22; B.kR = 10; B.hd = -6; B.rz = .06; }
    P.hips.position.y = .95 + B.by; P.hips.rotation.z = B.rz;
    P.spine.rotation.set(B.lean * R, B.twist, 0); P.head.rotation.x = B.hd * R;
    P.armL.rotation.set(B.aLx * R, 0, -B.aLz * R); P.elbowL.rotation.set(-B.eL * R, 0, 45 * R);
    P.armR.rotation.set(B.aRx * R, 0, B.aRz * R); P.elbowR.rotation.set(-B.eR * R, 0, -45 * R);
    P.hipL.rotation.x = B.hL * R; P.kneeL.rotation.x = B.kL * R; P.hipR.rotation.x = B.hR * R; P.kneeR.rotation.x = B.kR * R;
    const swing = a === 'walk' ? Math.sin(t * 4) * .22 : a === 'run' ? Math.sin(t * 8) * .34 : 0;
    const bendL = a === 'walk' ? Math.max(0, Math.sin(t * 4)) * .14 : a === 'run' ? Math.max(0, Math.sin(t * 8)) * .26 : 0;
    const bendR = a === 'walk' ? Math.max(0, -Math.sin(t * 4)) * .14 : a === 'run' ? Math.max(0, -Math.sin(t * 8)) * .26 : 0;
    P.hipL.rotation.z = P.hipL.userData.baseZ - swing;
    P.hipR.rotation.z = P.hipR.userData.baseZ + swing;
    P.kneeL.rotation.z = P.kneeL.userData.baseZ + bendL;
    P.kneeR.rotation.z = P.kneeR.userData.baseZ - bendR;
    o.fx.forEach(f => f(t, B.k));
  };
})(window);
