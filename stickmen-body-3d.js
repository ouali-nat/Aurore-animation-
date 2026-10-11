/* Aurore Animation — corpulence des stickmen d'après la référence (jeu de stickmen) :
   membres épais et arrondis, torse fin, jambes en triangle (A) qui finissent parallèles, bras courts en diagonale,
   grosse tête casquée légère et SUSPENDUE (pas de cou), couleur 1 (corps) / couleur 2 (bras), contour blanc ou noir.
   Les armes et effets viennent de stickmen-3d.js (chargé avant) ; ce module reconstruit seulement le corps.

   Contour : tous les contours (coques inversées) sont dessinés AVANT les remplissages, sans test de profondeur.
   Résultat : seul le contour extérieur de la silhouette reste visible — plus de ronds ni d'arcs blancs
   au bassin, aux épaules, aux coudes ou aux genoux. */
(function (g) {
  const T = g.THREE, PI = Math.PI, R = PI / 180, O = .014;
  const HIP = .845;          // hauteur du bassin : les pieds posent exactement sur le sol
  const SPREAD = .42;        // écartement des cuisses (triangle) ; les mollets le compensent → verticaux et parallèles
  const HEAD_Y = .79;        // la tête flotte au-dessus des épaules, sans cou
  const hex = h => parseInt(h.slice(1), 16);
  const lum = h => { const n = hex(h); return (.299 * (n >> 16 & 255) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255; };
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  const place = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); return m; };
  // [couleur 1, couleur 2, tête, casque]  (« crest » = ancienne couronne : supprimée, tête nue)
  const PAL = [['#16161c', '#2e2e3a', '#23232b', 'horns'], ['#ffffff', '#111111', '#e9eef7', 'horns'], ['#1f3fff', '#1b2f8a', '#3b8fe0', 'crest'], ['#d62f3a', '#7d1822', '#f0f0f0', 'plain'], ['#f4f1ea', '#b3202a', '#f4f1ea', 'horns'], ['#2f8f46', '#1c5a2c', '#3aa356', 'plain'], ['#f08a1c', '#8d4a0a', '#ffb347', 'crest'], ['#19a7a0', '#0e6a66', '#4bd1c8', 'horns'], ['#8a2be2', '#4a1580', '#b57af0', 'plain'], ['#e8c030', '#8a6f10', '#ffe063', 'crest'], ['#1c7ed6', '#0a3f7a', '#74c0fc', 'horns'], ['#7048e8', '#3b1fa0', '#b197fc', 'crest'], ['#ff5a1f', '#a82a00', '#ffa94d', 'horns'], ['#2ec4ff', '#0b6f99', '#a5e8ff', 'plain'], ['#8b5a2b', '#4a2e12', '#c9955c', 'crest'], ['#ffd400', '#8a7000', '#fff27a', 'horns'], ['#12b886', '#0a6b50', '#63e6be', 'plain'], ['#868e96', '#343a40', '#ced4da', 'crest'], ['#e64980', '#8f1d4b', '#faa2c1', 'horns'], ['#f59f00', '#b34700', '#ffe066', 'plain']];
  (g.CHARACTERS_STICK || []).forEach((c, i) => { const p = PAL[i % PAL.length]; c.c1 = p[0]; c.c2 = p[1]; c.hc = p[2]; c.helm = p[3]; });

  const origBuild = g.buildCharacter3D;
  g.buildCharacter3D = function (c) {
    const old = origBuild(c);                                  // armes + effets déjà construits
    const wps = { R: old.P.handR.children.filter(n => n.isGroup), L: old.P.handL.children.filter(n => n.isGroup) };
    const f = h => new T.MeshBasicMaterial({ color: hex(h) });
    const M = { a: f(c.c1), b: f(c.c2), h: f(c.hc), white: f('#ffffff'), dark: f('#1b2a55'), yel: f('#ffd34a'),
      // contour : coque inversée, dessinée en premier et sans profondeur → uniquement la silhouette extérieure
      o: new T.MeshBasicMaterial({ color: lum(c.c1) > .6 ? 0x151515 : 0xffffff, side: T.BackSide, depthTest: false, depthWrite: false }) };
    const ol = geo => { const m = new T.Mesh(geo, M.o); m.renderOrder = -1; return m; };
    const k = c.th || 1, root = new T.Group(), P = {};
    root.scale.setScalar(c.h || 1);
    const gnd = new T.Mesh(new T.CircleGeometry(.6, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .15 })); gnd.rotation.x = -PI / 2; gnd.position.y = .003; root.add(gnd);
    const ball = (r, mat, x, y, z) => { const grp = new T.Group(); grp.add(new T.Mesh(new T.SphereGeometry(r, 20, 14), mat)); grp.add(ol(new T.SphereGeometry(r + O, 20, 14))); return place(grp, x || 0, y || 0, z || 0); };
    const tube = (r0, r1, len, mat) => {                      // origine en haut, s'étend vers -y, bouts arrondis, contour
      const grp = new T.Group();
      grp.add(place(new T.Mesh(new T.CylinderGeometry(r0, r1, len, 20), mat), 0, -len / 2, 0));
      grp.add(place(ol(new T.CylinderGeometry(r0 + O, r1 + O, len, 20)), 0, -len / 2, 0));
      grp.add(ball(r0, mat), ball(r1, mat, 0, -len, 0));
      return grp;
    };
    const LIMB = .058 * k;                                    // même épaisseur partout → jonctions lisses (pas de « boules »)
    P.hips = place(new T.Group(), 0, HIP, 0); root.add(P.hips);
    for (const s of [-1, 1]) {                                // jambes : triangle (cuisses écartées) → mollets verticaux parallèles → pieds à plat
      const hip = place(new T.Group(), s * .02, 0, 0, 0, 0, -s * SPREAD); P.hips.add(hip); hip.add(tube(LIMB, LIMB, .42, M.a));
      const knee = place(new T.Group(), 0, -.42, 0, 0, 0, s * SPREAD); knee.rotation.order = 'ZXY';   // Z d'abord : annule exactement l'écart, même en marche
      hip.add(knee); knee.add(tube(LIMB, .054 * k, .4, M.a));
      knee.add(place(tube(.054 * k, .05 * k, .13, M.a), 0, -.4, 0, -PI / 2, 0, 0));                   // pied : capsule horizontale vers l'avant
      P[s < 0 ? 'hipL' : 'hipR'] = hip; P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
    }
    P.spine = new T.Group(); P.hips.add(P.spine);
    P.spine.add(place(tube(LIMB, .056 * k, .66, M.a), 0, .66, 0));                                   // le torse s'arrête aux épaules : pas de cou
    P.spine.add(place(tube(LIMB, LIMB, .3, M.a), -.15, .66, 0, 0, 0, PI / 2));                       // épaules : une seule capsule continue
    P.head = place(new T.Group(), 0, HEAD_Y, 0); P.spine.add(P.head);                                // tête suspendue, petit vide sous le menton
    const H = place(new T.Group(), 0, .19, 0); P.head.add(H);
    H.add(ball(.19, M.h));
    if (c.helm !== 'crest') {                                 // « crest » (couronne) supprimé : tête nue
      for (const s of [-1, 1]) H.add(place(new T.Mesh(new T.ConeGeometry(.035, .2, 5), M.white), s * .13, .2, 0, 0, 0, -s * .5));
      const v = new T.Mesh(new T.BoxGeometry(.3, .09, .08), M.dark); H.add(place(v, 0, .02, .16));
      for (const s of [-1, 1]) H.add(place(new T.Mesh(new T.SphereGeometry(.028, 10, 8), M.yel), s * .07, .02, .205));
    }
    for (const s of [-1, 1]) {                                // bras courts en diagonale, partent du bout de la capsule des épaules
      const sh = place(new T.Group(), s * .15, .66, 0); P.spine.add(sh); sh.add(tube(LIMB, .056 * k, .28, M.b));
      const el = place(new T.Group(), 0, -.28, 0); sh.add(el); el.add(tube(.056 * k, .054 * k, .28, M.b));
      const hand = place(new T.Group(), 0, -.28, 0); el.add(hand); hand.add(ball(.06 * k, M.b));
      P[s < 0 ? 'armL' : 'armR'] = sh; P[s < 0 ? 'elbowL' : 'elbowR'] = el; P[s < 0 ? 'handL' : 'handR'] = hand;
    }
    wps.R.forEach(w => P.handR.add(w)); wps.L.forEach(w => P.handL.add(w));
    return { root, P, c, anim: 'idle', pivot: 0, fx: old.fx, ready: true, error: null, onReady(fn) { fn(null); } };
  };

  g.poseCharacter3D = function (o, t) {
    const P = o.P, a = o.anim || 'idle', s4 = Math.sin(t * 4), s8 = Math.sin(t * 8);
    const B = { aL: 34, aR: 34, aLx: 0, aRx: -20, eL: 10, eR: 60, hL: 0, hR: 0, kL: 0, kR: 0, lean: 0, twist: 0, hd: 0, by: 0, k: .6, rz: 0 };
    const br = Math.sin(t * 2.2) * 2;
    if (a === 'idle') { B.lean = br * .5; B.aL = 34 + br; B.aR = 30 + br; B.hd = Math.sin(t * 1.3) * 3; }
    if (a === 'walk' || a === 'run') {
      const run = a === 'run', s = run ? s8 : s4;
      B.hL = s * (run ? 55 : 30); B.hR = -B.hL; B.kL = Math.max(0, s) * (run ? 80 : 35); B.kR = Math.max(0, -s) * (run ? 80 : 35);
      B.aLx = -s * (run ? 50 : 28); B.eL = run ? 80 : 20; B.aRx = -20 + s * (run ? 30 : 10); B.eR = run ? 80 : 60; B.aL = B.aR = 20;
      B.lean = run ? 20 : 6; B.by = Math.abs(s) * (run ? .08 : .03);
    }
    if (a === 'attack') {
      const p = (t % 1.4) / 1.4;
      B.aRx = p < .5 ? lerp(-20, -170, p / .5) : p < .62 ? lerp(-170, 10, (p - .5) / .12) : lerp(10, -20, (p - .62) / .38);
      B.twist = p < .5 ? -.5 * (p / .5) : p < .62 ? lerp(-.5, .6, (p - .5) / .12) : lerp(.6, 0, (p - .62) / .38);
      B.eR = 20; B.aR = 10; B.lean = 12; B.hL = -30; B.kL = 20; B.hR = 25; B.kR = 8; B.aL = 60; B.k = p > .5 && p < .65 ? 1.3 : .6;
    }
    if (a === 'cast') { B.aLx = -85; B.eL = 8; B.aRx = -85; B.eR = 8; B.aL = B.aR = 4; B.lean = -4; B.hL = -20; B.hR = 20; B.k = 1.2; }
    if (a === 'jump') { B.by = Math.abs(Math.sin(t * 3)) * .5; B.hL = -45; B.kL = 70; B.hR = -30; B.kR = 60; B.aL = 130; B.aRx = -160; B.eR = 10; B.lean = -4; }
    if (a === 'pose') { B.lean = 10; B.twist = .4; B.aRx = -140; B.eR = 20; B.aL = 70; B.eL = 20; B.hL = -28; B.kL = 30; B.hR = 22; B.kR = 10; B.hd = -6; B.rz = .06; }
    P.hips.position.y = HIP + B.by; P.hips.rotation.z = B.rz;
    P.spine.rotation.set(B.lean * R, B.twist, 0); P.head.rotation.x = B.hd * R;
    P.head.position.y = HEAD_Y + Math.sin(t * 2.2) * .008;     // la tête flotte très légèrement
    P.armL.rotation.set(B.aLx * R, 0, -B.aL * R); P.elbowL.rotation.set(-B.eL * R, 0, 0);
    P.armR.rotation.set(B.aRx * R, 0, B.aR * R); P.elbowR.rotation.set(-B.eR * R, 0, 0);
    P.hipL.rotation.x = B.hL * R; P.kneeL.rotation.x = B.kL * R; P.hipR.rotation.x = B.hR * R; P.kneeR.rotation.x = B.kR * R;
    o.fx.forEach(fn => fn(t, B.k));
  };
})(window);
