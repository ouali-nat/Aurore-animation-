/* 20 personnages 3D (Three.js) générés à partir de characters-2d.js : même identité (peau, coiffure, lunettes, tenue, casque, taches de rousseur).
   Rendu "toon" avec contours. Usage : const o = buildCharacter3D(CHARACTERS_2D[0]); scene.add(o.root); poseCharacter3D(o, t); */
(function (g) {
  const T = THREE, GOLD = 0xe0a82e, rad = d => d * Math.PI / 180;
  const BOT = { aurore: ['#2e3a52', '#f2f0ea'], aicha: ['#253c6b', '#412c25'], sana: ['#5d3e72', '#343447'], mei: ['#34466a', '#30354b'], amara: ['#b65b91', '#302033'], zara: ['#c34c7a', '#422535'], ines: ['#3d4e70', '#413149'], chloe: ['#315781', '#8a4e35'], lina: ['#394052', '#30293e'], fatou: ['#26736c', '#292a32'], malik: ['#1c2639', '#171a23'], koffi: ['#233b45', '#f0e6d6'], idrissa: ['#263f31', '#f2f0e7'], noah: ['#242c44', '#4b3028'], tariq: ['#5f523c', '#382f24'], samuel: ['#344b63', '#44342c'], elias: ['#2b313b', '#42312a'], gabriel: ['#d5b46a', '#eae6db'], kwame: ['#222631', '#ece8df'], yuki: ['#202c46', '#e2e5ee'] };
  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hash = id => { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100000; return h + 1; };
  const gm = new T.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, T.RedFormat);
  gm.minFilter = gm.magFilter = T.NearestFilter; gm.needsUpdate = true;
  const OUT = new T.MeshBasicMaterial({ color: 0x1a1210, side: T.BackSide });
  function mk(geo, color, line) {
    const m = new T.Mesh(geo, new T.MeshToonMaterial({ color, gradientMap: gm }));
    if (line !== 0) { const l = new T.Mesh(geo, OUT); l.scale.setScalar(1.06); m.add(l); }
    return m;
  }
  const put = (p, m, x, y, z) => { m.position.set(x, y, z); p.add(m); return m; };
  const cap = (r, L, c, line) => mk(new T.CapsuleGeometry(r, L, 6, 12), c, line);
  const sph = (r, c, line) => mk(new T.SphereGeometry(r, 16, 12), c, line);

  function hair(H, c, r) {
    const k = c.hs, h = c.hair;
    if (k == 'afro' || k == 'curls') {
      const long = k == 'curls', cy = long ? .08 : .27, R = long ? .34 : .31, sy = long ? 1.35 : 1;
      put(H, mk(new T.SphereGeometry(R, 24, 18), h), 0, cy, -.14).scale.y = sy;
      for (let i = 0; i < 46; i++) {
        const y = 1 - 2 * (i + .5) / 46, q = Math.sqrt(1 - y * y), a = i * 2.39996;
        const x = Math.cos(a) * q * R, yy = y * R * sy + cy, z = Math.sin(a) * q * R - .14;
        if (z > 0 && yy < .36) continue;
        put(H, sph(.07, h, 0), x, yy, z);
      }
      for (let i = 0; i < 9; i++) put(H, cap(.024, .1, h, 0), -.2 + i * .05, .38, .2).rotation.z = (r() - .5) * .3;
    }
    if (k == 'locs' || k == 'braids') {
      const locs = k == 'locs', n = locs ? 12 : 18, w = locs ? .04 : .022, len = locs ? .45 : .6;
      put(H, mk(new T.SphereGeometry(.262, 24, 12, 0, 6.2832, 0, 1.5708), h), 0, .28, -.01);
      if (locs) put(H, sph(.13, h), 0, .58, -.02);
      for (let i = 0; i < n; i++) {
        const a = -1.35 + 2.7 * i / (n - 1), x = Math.sin(a) * .25, z = -Math.cos(a) * .2 - .06, y = .27 - len / 2;
        put(H, cap(w, len, h, 0), x, y, z).rotation.z = x * .6;
        if ((locs && i % 3 == 1) || (!locs && i % 4 == 0)) put(H, mk(new T.TorusGeometry(w * 1.05, .012, 6, 10), GOLD, 0), x, y + .05, z).rotation.x = 1.5708;
      }
    }
    if (k == 'buzz') put(H, mk(new T.SphereGeometry(.24, 24, 12, 0, 6.2832, 0, 1.45), h), 0, .22, 0).scale.y = 1.12;
    if (k == 'twists' || k == 'puffs') {
      put(H, mk(new T.SphereGeometry(.25, 24, 12, 0, 6.2832, 0, 1.45), h), 0, .22, 0).scale.y = 1.12;
      if (k == 'twists') for (let i = 0; i < 9; i++) { const a = -1.2 + 2.4 * i / 8; put(H, sph(.065, h, 0), Math.sin(a) * .2, .3 + Math.cos(a) * .17, 0); }
      else for (const s of [-1, 1]) put(H, sph(.13, h), s * .25, .5, -.02);
    }
  }

  function head(H, c, r) {
    const s = c.skin, open = c.fl.includes('e');
    put(H, sph(.23, s), 0, .2, 0).scale.y = 1.12;
    for (const x of [-1, 1]) put(H, sph(.05, s), x * .23, .18, 0).scale.x = .6;
    for (const x of [-.085, .085]) {
      if (open) put(H, sph(.03, 0x1a1210, 0), x, .2, .215).scale.z = .5;
      else put(H, mk(new T.TorusGeometry(.04, .009, 6, 12, Math.PI), 0x1a1210, 0), x, .205, .222).rotation.z = Math.PI;
    }
    put(H, sph(.02, s, 0), 0, .16, .235);
    put(H, mk(new T.TorusGeometry(.022, .011, 8, 12), 0x7a3a34, 0), 0, .09, .215).scale.y = .75;
    if (c.fl.includes('f')) for (let i = 0; i < 12; i++) put(H, sph(.006, 0x5a2f1f, 0), (r() - .5) * .28, .12 + r() * .06, .222);
    if (c.gl) for (const x of [-.085, .085]) {
      const sq = c.gl == 'square';
      const f = put(H, mk(new T.TorusGeometry(.075, .008, 6, sq ? 4 : 20), 0x1a1210, 0), x, .205, .228);
      if (sq) { f.rotation.z = Math.PI / 4; f.scale.set(1, .8, 1); }
      const l = new T.Mesh(new T.CircleGeometry(.07, 16), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .15 }));
      put(H, l, x, .205, .226);
    }
    if (c.gl) put(H, mk(new T.BoxGeometry(.04, .01, .01), 0x1a1210, 0), 0, .21, .23);
    hair(H, c, r);
    if (c.fl.includes('h')) {
      put(H, mk(new T.TorusGeometry(.27, .02, 8, 24, Math.PI), c.top), 0, .2, 0);
      for (const x of [-1, 1]) put(H, mk(new T.CylinderGeometry(.075, .075, .05, 16), c.top), x * .27, .2, 0).rotation.z = Math.PI / 2;
    }
  }

  g.buildCharacter3D = function (c) {
    const r = rnd(hash(c.id)), root = new T.Group(), P = {}, bt = BOT[c.id] || ['#333', '#eee'];
    for (const s of [-1, 1]) {
      const hip = put(root, new T.Group(), s * .13, .92, 0);
      put(hip, cap(.085, .6, bt[0]), 0, -.4, 0);
      put(hip, sph(.1, bt[1]), 0, -.86, .06).scale.set(1, .6, 1.5);
      P[s < 0 ? 'legL' : 'legR'] = hip;
    }
    P.torso = put(root, cap(.24, .26, c.top), 0, 1.27, 0); P.torso.scale.set(1.18, 1, .8);
    put(root, mk(new T.CylinderGeometry(.06, .07, .12, 12), c.skin, 0), 0, 1.64, 0);
    if (c.st == 'hoodie') put(root, mk(new T.TorusGeometry(.12, .035, 8, 16), c.top), 0, 1.6, 0).rotation.x = 1.5708;
    if (c.st == 'jacket') put(root, mk(new T.BoxGeometry(.012, .6, .012), 0x1a1210, 0), 0, 1.25, .2);
    if (c.fl.includes('n')) {
      put(root, mk(new T.TorusGeometry(.13, .006, 6, 20), GOLD, 0), 0, 1.56, .07).rotation.x = 1.2;
      put(root, sph(.03, 0xf4efe6), 0, 1.38, .19).scale.y = 1.3;
    }
    for (const s of [-1, 1]) {
      const A = put(root, new T.Group(), s * .34, 1.52, 0);
      put(A, cap(.065, .2, c.top), 0, -.17, 0);
      put(A, cap(.055, .2, c.st == 'tee' ? c.skin : c.top), 0, -.46, 0);
      put(A, sph(.06, c.skin), 0, -.66, 0);
      P[s < 0 ? 'armL' : 'armR'] = A;
    }
    P.head = put(root, new T.Group(), 0, 1.65, 0);
    head(P.head, c, r);
    return { root, P, c, anim: 'idle' };
  };

  /* Animations : idle, walk, run, wave, dance, talk, jump, pose */
  g.poseCharacter3D = function (o, t) {
    const P = o.P, a = o.anim || 'idle', run = a == 'run';
    const s = Math.sin(t * (run ? 7 : a == 'dance' ? 5 : 3.2));
    let aL = 6, aR = 6, sL = 0, sR = 0, lL = 0, lR = 0, hd = 0, by = 0, ry = 0;
    if (a == 'walk' || run) { const k = run ? 1.6 : 1; lL = s * 28 * k; lR = -s * 28 * k; sL = -s * 30 * k; sR = s * 30 * k; by = Math.abs(s) * .03 * k; }
    if (a == 'wave') { aR = 150 + Math.sin(t * 9) * 20; hd = 4; }
    if (a == 'dance') { aL = 100 + s * 45; aR = 100 - s * 45; hd = s * 8; by = Math.abs(s) * .05; ry = s * .25; lL = Math.max(0, s) * 18; lR = Math.max(0, -s) * 18; }
    if (a == 'talk') { aR = 30 + Math.sin(t * 3) * 12; aL = 12; hd = Math.sin(t * 2.3) * 4; }
    if (a == 'jump') { by = Math.abs(Math.sin(t * 3)) * .3; aL = aR = 140; }
    if (a == 'pose') { aL = aR = 28; hd = -5; }
    P.legL.rotation.x = rad(lL); P.legR.rotation.x = rad(lR);
    P.armL.rotation.set(rad(sL), 0, -rad(aL)); P.armR.rotation.set(rad(sR), 0, rad(aR));
    P.head.rotation.z = rad(hd); P.head.rotation.x = Math.sin(t * 1.3) * .03;
    P.torso.scale.y = 1 + Math.sin(t * 2.2) * .012;
    o.root.position.y = by;
    o.pivot = ry;
  };
})(window);
