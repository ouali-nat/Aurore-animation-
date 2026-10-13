/* Aurore Animation — stickmen 3D style ENCRE (d'après les dessins de référence : stylo/pinceau noir sur papier).
   - Une seule couleur : noir encre. Corps = trait fin ; membres = coups de pinceau qui gonflent puis s'effilent.
   - Jambes en A, épaisses vers le pied ; bras fins ; tête pleine (« fill ») ou cercle vide (« ring »).
   - Hachures d'encre au sol au lieu d'une ombre.
   - Animation « à deux » (12 images/s) avec un léger tremblement du trait (« boil »), comme un dessin animé à la main.
     Réglages : window.STICK_INK = { fps: 12, boil: .018 } AVANT le chargement de ce fichier (boil: 0 = trait immobile).
   Les armes, effets et animations (idle, walk, run, attack, cast, jump, pose) viennent de stickmen-3d.js (chargé avant).
   API inchangée : buildCharacter3D(c) -> { root, P, c, anim, fx } ; poseCharacter3D(o, t). */
(function (g) {
  const T = g.THREE, PI = Math.PI, R = PI / 180;
  const CFG = g.STICK_INK = Object.assign({ fps: 12, boil: .018 }, g.STICK_INK || {});
  const SPREAD = .30;        // demi-angle du A des jambes
  const HIP = .85;           // hauteur du bassin
  const TORSO = .66;         // longueur du trait du corps
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  const sm = t => t * t * (3 - 2 * t);
  const place = (m, x, y, z, rx, ry, rz) => { m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); return m; };
  const INK = new T.MeshBasicMaterial({ color: 0x0b0b0d, side: T.DoubleSide });
  const PAPER = new T.MeshBasicMaterial({ color: 0xece8e0 });
  const SHELL = new T.MeshBasicMaterial({ color: 0x0b0b0d, side: T.BackSide });

  // Profil de coup de pinceau : rayon r0 en haut -> rMax (à la position « peak ») -> rEnd en bas.
  function brushGeo(len, r0, rMax, rEnd, peak) {
    const pts = [], n = 16;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const r = u < peak ? lerp(r0, rMax, sm(u / peak)) : lerp(rMax, rEnd, sm((u - peak) / (1 - peak)));
      pts.push(new T.Vector2(Math.max(r, .002), -len * u));
    }
    return new T.LatheGeometry(pts, 14);
  }
  // Origine en haut, s'étend vers -y, bouts arrondis.
  function stroke(len, r0, rMax, rEnd, peak) {
    const grp = new T.Group();
    grp.add(new T.Mesh(brushGeo(len, r0, rMax, rEnd, peak == null ? .5 : peak), INK));
    grp.add(new T.Mesh(new T.SphereGeometry(r0, 10, 8), INK));
    grp.add(place(new T.Mesh(new T.SphereGeometry(rEnd, 10, 8), INK), 0, -len, 0));
    return grp;
  }

  const origBuild = g.buildCharacter3D;
  g.buildCharacter3D = function (c) {
    const old = origBuild(c);   // armes + effets déjà construits par stickmen-3d.js
    const wps = { R: old.P.handR.children.filter(n => n.isGroup), L: old.P.handL.children.filter(n => n.isGroup) };
    const k = c.th || 1, root = new T.Group(), P = {};
    root.scale.setScalar(c.h || 1);

    // Hachures d'encre au sol (comme sur le dessin) au lieu d'une ombre.
    const hatch = new T.Group();
    for (let i = 0; i < 9; i++) {
      const w = .95 - Math.abs(i - 4) * .13 - ((i * 37) % 5) * .02;
      const m = new T.Mesh(new T.PlaneGeometry(w, .011 + (i % 3) * .004), new T.MeshBasicMaterial({ color: 0x0b0b0d, transparent: true, opacity: .8 - Math.abs(i - 4) * .1 }));
      m.rotation.x = -PI / 2; m.position.set(((i * 53) % 7 - 3) * .03, .004, (i - 4) * .065);
      hatch.add(m);
    }
    root.add(hatch);

    P.hips = place(new T.Group(), 0, HIP, 0); root.add(P.hips);
    for (const s of [-1, 1]) {   // jambes en A : fines en haut, le mollet gonfle vers le pied (trait de pinceau)
      const hip = place(new T.Group(), 0, 0, 0, 0, 0, -s * SPREAD); P.hips.add(hip);
      hip.add(stroke(.42, .016 * k, .03 * k, .026 * k, .6));
      const knee = place(new T.Group(), 0, -.42, 0); hip.add(knee);
      knee.add(stroke(.40, .026 * k, .064 * k, .036 * k, .82));
      const ankle = place(new T.Group(), 0, -.4, 0, 0, 0, s * SPREAD); knee.add(ankle);   // annule l'écart : pied à plat
      ankle.add(place(stroke(.15, .042 * k, .04 * k, .014 * k, .3), 0, 0, 0, -PI / 2, 0, 0));
      P[s < 0 ? 'hipL' : 'hipR'] = hip; P[s < 0 ? 'kneeL' : 'kneeR'] = knee;
    }
    P.spine = new T.Group(); P.hips.add(P.spine);
    P.spine.add(place(stroke(TORSO, .016 * k, .024 * k, .015 * k, .45), 0, TORSO, 0));   // trait fin du corps
    P.head = place(new T.Group(), 0, TORSO, 0); P.spine.add(P.head);
    const H = place(new T.Group(), 0, .19, 0); P.head.add(H);
    if (c.head === 'ring') {     // cercle vide : papier + contour d'encre (coque inversée), lisible sous tous les angles
      H.add(new T.Mesh(new T.SphereGeometry(.17, 20, 14), PAPER));
      H.add(new T.Mesh(new T.SphereGeometry(.186, 20, 14), SHELL));
    } else {                     // tête pleine, noire
      H.add(new T.Mesh(new T.SphereGeometry(.18, 20, 14), INK));
    }
    for (const s of [-1, 1]) {   // bras fins, bout de la main = petit point d'encre
      const sh = place(new T.Group(), s * .02, TORSO - .04, 0); P.spine.add(sh);
      sh.add(stroke(.3, .014 * k, .022 * k, .02 * k, .5));
      const el = place(new T.Group(), 0, -.3, 0); sh.add(el);
      el.add(stroke(.28, .02 * k, .03 * k, .012 * k, .6));
      const hand = place(new T.Group(), 0, -.28, 0); el.add(hand);
      hand.add(new T.Mesh(new T.SphereGeometry(.03 * k, 10, 8), INK));
      P[s < 0 ? 'armL' : 'armR'] = sh; P[s < 0 ? 'elbowL' : 'elbowR'] = el; P[s < 0 ? 'handL' : 'handR'] = hand;
    }
    wps.R.forEach(w => P.handR.add(w)); wps.L.forEach(w => P.handL.add(w));
    return { root, P, c, anim: 'idle', pivot: 0, fx: old.fx, ready: true, error: null, onReady(fn) { fn(null); } };
  };

  const rnd = (f, seed) => { const x = Math.sin(f * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); };
  const JOINTS = ['spine', 'head', 'armL', 'armR', 'elbowL', 'elbowR', 'hipL', 'hipR', 'kneeL', 'kneeR'];

  g.poseCharacter3D = function (o, t) {
    const P = o.P, a = o.anim || 'idle';
    const fr = Math.floor(t * CFG.fps); t = fr / CFG.fps;   // animation « à deux » : images fixes, comme un flipbook
    const s4 = Math.sin(t * 4), s8 = Math.sin(t * 8);
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
    P.armL.rotation.set(B.aLx * R, 0, -B.aL * R); P.elbowL.rotation.set(-B.eL * R, 0, 0);
    P.armR.rotation.set(B.aRx * R, 0, B.aR * R); P.elbowR.rotation.set(-B.eR * R, 0, 0);
    P.hipL.rotation.x = B.hL * R; P.kneeL.rotation.x = B.kL * R; P.hipR.rotation.x = B.hR * R; P.kneeR.rotation.x = B.kR * R;
    P.hipL.rotation.z = SPREAD; P.hipR.rotation.z = -SPREAD;
    if (CFG.boil) JOINTS.forEach((j, i) => { P[j].rotation.z += (rnd(fr, i + 1) - .5) * CFG.boil; });   // le trait « bouillonne » à chaque image
    o.fx.forEach(fn => fn(t, B.k));
  };

  // Fond « papier » pour l'atelier 3D (le canvas est transparent).
  if (g.document) {
    const cv = g.document.getElementById('cv');
    if (cv) {
      const grain = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .33  0 0 0 0 .3  0 0 0 .22 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
      cv.style.background = grain + ', #ece8e0';
    }
  }
})(window);
