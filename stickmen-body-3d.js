/* Aurore Animation — stickmen 3D d'après le dessin de référence à la main :
   corps fin, UNE seule couleur pour le corps, les bras et les mains, mains très simples (bout du bras arrondi),
   jambes fines en haut qui s'élargissent vers le bas comme un trait de pinceau (pieds évasés),
   jambes droites en triangle (A), grosse tête légère SUSPENDUE (pas de cou), contour blanc ou noir.
   Les armes et effets viennent de stickmen-3d.js (chargé avant) ; ce module reconstruit seulement le corps.

   Contour : tous les contours (coques inversées) sont dessinés AVANT les remplissages, sans test de profondeur.
   Résultat : seul le contour extérieur de la silhouette reste visible — plus d'arcs blancs internes. */
(function (g) {
  const T = g.THREE, PI = Math.PI, R = PI / 180, O = .014;
  const SPREAD = .30;        // demi-angle du triangle : cuisse ET mollet restent écartés
  const HIP = .85;           // hauteur du bassin : les pieds posent sur le sol
  const HEAD_Y = .79;        // la tête flotte au-dessus du torse, sans cou
  const hex = h => parseInt(h.slice(1), 16);
  const lum = h => { const n = hex(h); return (.299 * (n >> 16 & 255) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255; };
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  const place = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); return m; };
  // [couleur 1 (corps + bras + mains), couleur 2 (inutilisée), tête, casque]  (« crest » = ancienne couronne : supprimée)
  const PAL = [['#16161c', '#2e2e3a', '#23232b', 'horns'], ['#ffffff', '#111111', '#e9eef7', 'horns'], ['#1f3fff', '#1b2f8a', '#3b8fe0', 'crest'], ['#d62f3a', '#7d1822', '#f0f0f0', 'plain'], ['#f4f1ea', '#b3202a', '#f4f1ea', 'horns'], ['#2f8f46', '#1c5a2c', '#3aa356', 'plain'], ['#f08a1c', '#8d4a0a', '#ffb347', 'crest'], ['#19a7a0', '#0e6a66', '#4bd1c8', 'horns'], ['#8a2be2', '#4a1580', '#b57af0', 'plain'], ['#e8c030', '#8a6f10', '#ffe063', 'crest'], ['#1c7ed6', '#0a3f7a', '#74c0fc', 'horns'], ['#7048e8', '#3b1fa0', '#b197fc', 'crest'], ['#ff5a1f', '#a82a00', '#ffa94d', 'horns'], ['#2ec4ff', '#0b6f99', '#a5e8ff', 'plain'], ['#8b5a2b', '#4a2e12', '#c9955c', 'crest'], ['#ffd400', '#8a7000', '#fff27a', 'horns'], ['#12b886', '#0a6b50', '#63e6be', 'plain'], ['#868e96', '#343a40', '#ced4da', 'crest'], ['#e64980', '#8f1d4b', '#faa2c1', 'horns'], ['#f59f00', '#b34700', '#ffe066', 'plain']];
  (g.CHARACTERS_STICK || []).forEach((c, i) => { const p = PAL[i % PAL.length]; c.c1 = p[0]; c.c2 = p[1]; c.hc = p[2]; c.helm = p[3]; });

  const origBuild = g.buildCharacter3D;
  g.buildCharacter3D = function (c) {
    const old = origBuild(c);                                  // armes + effets déjà construits
    const wps = { R: old.P.handR.children.filter(n => n.isGroup), L: old.P.handL.children.filter(n => n.isGroup) };
    const f = h => new T.MeshBasicMaterial({ color: hex(h) });
    const M = { a: f(c.c1), h: f(c.hc), white: f('#ffffff'), dark: f('#1b2a55'), yel: f('#ffd34a'),
      // contour : coque inversée, dessinée en premier et sans profondeur → uniquement la silhouette extérieure
      o: new T.MeshBasicMaterial({ color: lum(c.c1) > .6 ? 0x151515 : 0xffffff, side: T.BackSide, depthTest: false, depthWrite: false }) };
    const ol = geo => { const m = new T.Mesh(geo, M.o); m.renderOrder = -1; return m; };
    const k = c.th || 1, root = new T.Group(), P = {};
    root.scale.setScalar(c.h || 1);
    const gnd = new T.Mesh(new T.CircleGeometry(.6, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .15 })); gnd.rotation.x = -PI / 2; gnd.position.y = .003; root.add(gnd);
    const ball = (r, mat, x, y, z) => { const grp = new T.Group(); grp.add(new T.Mesh(new T.SphereGeometry(r, 20, 14), mat)); grp.add(ol(new T.SphereGeometry(r + O, 20, 14))); return place(grp, x || 0, y || 0, z || 0); };
    const tube = (r0, r1, len, mat) => {                      // origine en haut, s'étend vers -y, bouts arrondis, contour ; r1 > r0 = s'évase vers le bas
      const grp = new T.Group();
      grp.add(place(new T.Mesh(new T.CylinderGeometry(r0, r1, len, 20), mat), 0, -len / 2, 0));
      grp.add(place(ol(new T.CylinderGeometry(r0 + O, r1 + O, len, 20)), 0, -len / 2, 0));
      grp.add(ball(r0, mat), ball(r1, mat, 0, -len, 0));
      return grp;
    };
    const TOR = .044 * k;                                     // torse fin, comme sur le dessin
    const ARM = .038 * k;                                     // bras fins, une seule couleur
    const THIGH = .044 * k, FOOT = .068 * k;                  // jambe fine en haut → pied large (trait de pinceau)
    P.hips = place(new T.Group(), 0, HIP, 0); root.add(P.hips);
    for (const s of [-1, 1]) {                                // jambes droites en A, évasées vers le pied
      const hip = place(new T.Group(), 0, 0, 0, 0, 0, -s * SPREAD); P.hips.add(hip); hip.add(tube(THIGH, .05 * k, .42, M.a));
      const knee = place(new T.Group(), 0, -.42, 0); hip.add(knee); knee.add(tube(.05 * k, FOOT, .4, M.a));   // le mollet s'élargit jusqu'au pied
      const ankle = place(new T.Group(), 0, -.4, 0, 0, 0, s * SPREAD); knee.add(ankle);                       // annule l'écart → pied horizontal
      ankle.add(place(tube(FOOT, FOOT * .85, .1, M.a), 0, 0, 0, -PI / 2, 0, 0));                            // bout du pied large, vers l'avant
      P[s < 0 ? 'hipL' : 'hipR'] = hip; P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
    }
    P.spine = new T.Group(); P.hips.add(P.spine);
    P.spine.add(place(tube(TOR, TOR, .66, M.a), 0, .66, 0));                                    // torse : sommet arrondi, pas de barre plate, pas de cou
    P.head = place(new T.Group(), 0, HEAD_Y, 0); P.spine.add(P.head);                                // tête suspendue, petit vide sous le menton
    const H = place(new T.Group(), 0, .19, 0); P.head.add(H);
    H.add(ball(.19, M.h));
    if (c.helm !== 'crest') {                                 // « crest » (couronne) supprimé : tête nue
      for (const s of [-1, 1]) H.add(place(new T.Mesh(new T.ConeGeometry(.035, .2, 5), M.white), s * .13, .2, 0, 0, 0, -s * .5));
      const v = new T.Mesh(new T.BoxGeometry(.3, .09, .08), M.dark); H.add(place(v, 0, .02, .16));
      for (const s of [-1, 1]) H.add(place(new T.Mesh(new T.SphereGeometry(.028, 10, 8), M.yel), s * .07, .02, .205));
    }
    for (const s of [-1, 1]) {                                // bras fins en diagonale, même couleur que le corps ; main = simple bout du bras
      const sh = place(new T.Group(), s * .03, .65, 0); P.spine.add(sh); sh.add(tube(ARM, ARM, .3, M.a));
      const el = place(new T.Group(), 0, -.3, 0); sh.add(el); el.add(tube(ARM, ARM * .9, .28, M.a));
      const hand = place(new T.Group(), 0, -.28, 0); el.add(hand);                                    // point d'accroche de l'arme, aucune forme ajoutée
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
