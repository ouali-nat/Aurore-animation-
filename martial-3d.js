/* Aurore Animation — COMBAT D'ARTS MARTIAUX en stickmen 3D, style « vidéo de référence » :
   fond gris, un stickman noir contre un gris, membres épais arrondis, grosse tête ronde, ombres douces,
   nuages de poussière, flashs d'impact, fissures au sol, coups de poing/pied, uppercut, balayage, coup de pied volé, combo,
   projections à travers l'arène, blocage, téléportation. Piloté par JSON, avec combat automatique (IA).
   Autonome : ne dépend que de three.js.
   API :  const f = new Martial(scene, camera, { onState(s){} }); f.load(json); f.play(); f.update(dt); f.reset(); */
(function (g) {
  'use strict';
  const T = g.THREE, PI = Math.PI, R = PI / 180, V3 = T.Vector3, Y = new V3(0, 1, 0);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, sm = t => t * t * (3 - 2 * t);
  const angDiff = (a, b) => { let d = (b - a) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; };
  const vr = Math.random;
  const rng = seed => { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const TONES = { black: 0x0a0a0a, grey: 0x7d7d7d, white: 0xf2f2f2, red: 0xb02222, blue: 0x2a49b0 };
  const toneOf = v => typeof v === 'number' ? v : (TONES[v] != null ? TONES[v] : (typeof v === 'string' && /^#?[0-9a-f]{6}$/i.test(v) ? parseInt(v.replace('#', ''), 16) : 0x0a0a0a));
  const HIP = .92;

  /* ---------- textures douces (poussière, flash, ombre) ---------- */
  const mkTex = draw => { const c = document.createElement('canvas'); c.width = c.height = 128; draw(c.getContext('2d'), 128); return new T.CanvasTexture(c); };
  const SOFT = mkTex((x, s) => { const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, s, s); });
  const STAR = mkTex((x, s) => {
    const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * .3); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, s, s);
    x.translate(s / 2, s / 2); x.fillStyle = '#fff';
    for (let i = 0; i < 12; i++) { x.rotate(PI / 6); x.beginPath(); x.moveTo(0, -s * .018); x.lineTo(s * (i % 2 ? .3 : .47), 0); x.lineTo(0, s * .018); x.fill(); }
  });
  const CYL = new T.CylinderGeometry(1, 1, 1, 10), SPH = new T.SphereGeometry(1, 12, 9), PLN = new T.PlaneGeometry(1, 1);

  /* ---------- poses (degrés) ---------- */
  const KEYS = ['lean', 'twist', 'head', 'hipY', 'aLx', 'aLz', 'eL', 'aRx', 'aRz', 'eR', 'hLf', 'hLz', 'kL', 'hRf', 'hRz', 'kR'];
  const POSES = {
    stand: { lean: 0, twist: 0, head: 0, hipY: 0, aLx: 4, aLz: 8, eL: 6, aRx: 4, aRz: 8, eR: 6, hLf: 0, hLz: 4, kL: 0, hRf: 0, hRz: 4, kR: 0 },
    guard: { lean: 10, twist: 0, head: -4, hipY: -.08, aLx: -62, aLz: 12, eL: 105, aRx: -50, aRz: 12, eR: 118, hLf: 30, hLz: 9, kL: 38, hRf: -24, hRz: 9, kR: 30 }
  };
  const P_ = o => Object.assign({}, POSES.guard, o);
  POSES.hit = P_({ lean: -22, head: -18, hipY: -.04, aLx: -30, aLz: 55, eL: 40, aRx: -20, aRz: 70, eR: 30, hLf: 18, kL: 30, hRf: -14, kR: 20, twist: 12 });
  POSES.air = P_({ lean: -6, head: -10, hipY: 0, aLx: -20, aLz: 80, eL: 20, aRx: -10, aRz: 85, eR: 15, hLf: 10, kL: 25, hRf: -8, kR: 18, hLz: 25, hRz: 25 });
  POSES.lying = P_({ lean: 0, head: -6, hipY: 0, aLx: 10, aLz: 40, eL: 10, aRx: 6, aRz: 50, eR: 15, hLf: 0, kL: 10, hRf: 0, kR: 12, hLz: 14, hRz: 18 });
  POSES.block = P_({ lean: 12, aLx: -100, aLz: -10, eL: 130, aRx: -105, aRz: -10, eR: 135, hipY: -.1 });
  POSES.victory = P_({ lean: -4, aRx: -172, aRz: 6, eR: 8, aLx: -20, aLz: 30, eL: 60, hLf: 6, kL: 6, hRf: -6, kR: 6, hipY: 0 });
  POSES.jump = P_({ lean: 6, aLx: -120, aLz: 35, eL: 40, aRx: -130, aRz: 35, eR: 40, hLf: 45, kL: 70, hRf: 25, kR: 60, hipY: .05 });
  const G = POSES.guard;
  const MOVES = {
    punch: { dur: .55, hit: .5, dmg: 8, push: 3, reach: 2.4, gap: 1.2, keys: [[0, G], [.28, P_({ twist: 28, lean: 6, aRx: 12, aRz: 14, eR: 135, hLf: 40, kL: 40, hRf: -30, kR: 30 })], [.5, P_({ twist: -30, lean: 16, aRx: -92, aRz: 4, eR: 4, aLx: -35, aLz: 30, eL: 120, hLf: 48, kL: 30, hRf: -36, kR: 20 })], [1, G]] },
    kick: { dur: .8, hit: .5, dmg: 12, push: 5, reach: 2.7, gap: 1.6, keys: [[0, G], [.3, P_({ lean: -10, hRf: 80, kR: 110, hLf: 4, kL: 25, aLx: -50, aLz: 30, eL: 60, aRx: -30, aRz: 40, eR: 60 })], [.5, P_({ lean: -24, hRf: 94, kR: 6, hLf: 4, kL: 22, aLx: -40, aLz: 50, eL: 40, aRx: -20, aRz: 55, eR: 30 })], [1, G]] },
    uppercut: { dur: .65, hit: .5, dmg: 15, push: 6, launch: 6.5, reach: 2.3, gap: 1.1, keys: [[0, G], [.3, P_({ hipY: -.24, lean: 20, aRx: 40, aRz: 10, eR: 80, hLf: 40, kL: 75, hRf: -20, kR: 50 })], [.5, P_({ hipY: .04, lean: -8, aRx: -176, aRz: 10, eR: 10, aLx: -30, aLz: 40, eL: 100, hLf: 10, kL: 6, hRf: -10, kR: 6 })], [1, G]] },
    sweep: { dur: .95, hit: .55, dmg: 10, push: 2, launch: 3, reach: 2.6, gap: 1.6, keys: [[0, G], [.3, P_({ hipY: -.5, lean: 25, hLf: 0, kL: 120, hRf: 20, kR: 60, aLx: -60, aLz: 40, eL: 40, aRx: -40, aRz: 50, eR: 40 })], [.55, P_({ hipY: -.5, lean: 8, twist: -25, hLf: 0, kL: 120, hRf: 86, kR: 0, aLx: -50, aLz: 60, eL: 30, aRx: -30, aRz: 70, eR: 30 })], [1, G]] },
    flykick: { dur: 1, hit: .55, dmg: 16, push: 8, launch: 5, reach: 2.7, gap: 1.5, fly: true, keys: [[0, G], [.25, P_({ lean: -5, hRf: 50, kR: 100, hLf: 20, kL: 90, aLx: -90, aLz: 40, eL: 60, aRx: -80, aRz: 40, eR: 60 })], [.55, P_({ lean: -38, hRf: 92, kR: 6, hLf: -35, kL: 70, aLx: -60, aLz: 70, eL: 30, aRx: -30, aRz: 80, eR: 20, hipY: .05 })], [1, G]] }
  };
  const COMBO = ['punch', 'punch', 'kick'];
  const ACTS = ['idle', 'walk', 'run', 'dash', 'jump', 'punch', 'kick', 'uppercut', 'sweep', 'flykick', 'combo', 'block', 'teleport', 'pose'];
  const GLOBAL = ['camera', 'text', 'shake', 'end'];
  const evalKeys = (keys, u) => {
    let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], k = sm(clamp((u - a[0]) / (b[0] - a[0]), 0, 1)), o = {};
    for (const key of KEYS) o[key] = lerp(a[1][key], b[1][key], k); return o;
  };

  /* ---------- construction d'un stickman épais ---------- */
  const limb = (len, r, mat) => {
    const gr = new T.Group(), m = new T.Mesh(CYL, mat); m.scale.set(r, len, r); m.position.y = -len / 2; gr.add(m);
    const c1 = new T.Mesh(SPH, mat); c1.scale.setScalar(r); gr.add(c1); const c2 = new T.Mesh(SPH, mat); c2.scale.setScalar(r); c2.position.y = -len; gr.add(c2); return gr;
  };
  function build(tone, h) {
    const mat = new T.MeshBasicMaterial({ color: tone }), root = new T.Group(), P = {};
    root.rotation.order = 'YXZ'; root.scale.setScalar(h);
    P.hips = new T.Group(); P.hips.position.y = HIP; root.add(P.hips);
    for (const s of [-1, 1]) {      // s=-1 : côté droit du personnage ; s=1 : gauche
      const hip = new T.Group(); hip.position.x = s * .05; P.hips.add(hip); hip.add(limb(.44, .062, mat));
      const knee = new T.Group(); knee.position.y = -.44; hip.add(knee); knee.add(limb(.44, .056, mat));
      const ft = new T.Mesh(CYL, mat); ft.rotation.x = PI / 2; ft.scale.set(.05, .17, .05); ft.position.set(0, -.44, .08); knee.add(ft);
      const ft2 = new T.Mesh(SPH, mat); ft2.scale.setScalar(.05); ft2.position.set(0, -.44, .165); knee.add(ft2);
      P[s < 0 ? 'hipR' : 'hipL'] = hip; P[s < 0 ? 'kneeR' : 'kneeL'] = knee;
    }
    P.spine = new T.Group(); P.hips.add(P.spine);
    const tr = new T.Mesh(CYL, mat); tr.scale.set(.075, .62, .075); tr.position.y = .31; P.spine.add(tr);
    const t1 = new T.Mesh(SPH, mat); t1.scale.setScalar(.075); P.spine.add(t1); const t2 = new T.Mesh(SPH, mat); t2.scale.setScalar(.075); t2.position.y = .62; P.spine.add(t2);
    P.head = new T.Group(); P.head.position.y = .62; P.spine.add(P.head);
    const hd = new T.Mesh(SPH, mat); hd.scale.setScalar(.2); hd.position.y = .17; P.head.add(hd);
    for (const s of [-1, 1]) {
      const sh = new T.Group(); sh.position.set(s * .03, .56, 0); P.spine.add(sh); sh.add(limb(.3, .055, mat));
      const el = new T.Group(); el.position.y = -.3; sh.add(el); el.add(limb(.3, .05, mat));
      P[s < 0 ? 'armR' : 'armL'] = sh; P[s < 0 ? 'elbowR' : 'elbowL'] = el;
    }
    return { root, P };
  }
  function applyPose(a) {
    const c = a.cur, P = a.o.P;
    P.hips.position.y = HIP + c.hipY; P.spine.rotation.set(c.lean * R, c.twist * R, 0); P.head.rotation.x = c.head * R;
    P.armL.rotation.set(c.aLx * R, 0, c.aLz * R); P.elbowL.rotation.x = -c.eL * R;
    P.armR.rotation.set(c.aRx * R, 0, -c.aRz * R); P.elbowR.rotation.x = -c.eR * R;
    P.hipL.rotation.set(-c.hLf * R, 0, c.hLz * R); P.kneeL.rotation.x = c.kL * R;
    P.hipR.rotation.set(-c.hRf * R, 0, -c.hRz * R); P.kneeR.rotation.x = c.kR * R;
  }
  const fwd = a => new V3(Math.sin(a.yaw), 0, Math.cos(a.yaw));

  class Martial {
    constructor(scene, camera, opts) {
      this.scene = scene; this.cam = camera; this.opts = opts || {}; this.group = new T.Group(); scene.add(this.group);
      this.look = new V3(0, 1, 0); this.playing = false; this.script = null; this.clear();
    }
    clear() {
      while (this.group.children.length) this.group.remove(this.group.children[0]);
      this.actors = []; this.byId = {}; this.fx = []; this.later = []; this.events = []; this.ei = 0; this.cracks = [];
      this.time = 0; this.finished = false; this.pendingOver = null; this.winner = null; this.caption = null;
      this.shake = 0; this.hitstop = 0; this.autoCam = false; this.nextCam = 0; this.camShot = { shot: 'wide' };
    }
    load(src) {
      const s = typeof src === 'string' ? JSON.parse(src) : src;
      if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error('Le JSON doit être un objet { "actors": {...}, "timeline": [...] }.');
      this.clear(); this.script = s; this.rand = rng(s.seed || 1); this.arena = +s.arena || 8; this.duration = +s.duration || 90;
      const defs = s.actors; if (!defs || typeof defs !== 'object' || !Object.keys(defs).length) throw new Error('Il faut au moins un personnage dans "actors".');
      let i = 0;
      for (const id of Object.keys(defs)) {
        const d = defs[id] || {}, o = build(toneOf(d.tone != null ? d.tone : (i === 0 ? 'black' : 'grey')), +d.h || 1);
        const sh = new T.Mesh(PLN, new T.MeshBasicMaterial({ map: SOFT, color: 0x000000, transparent: true, opacity: .4, depthWrite: false })); sh.rotation.x = -PI / 2; sh.scale.set(1.7, .8, 1); this.group.add(sh);
        const a = { id, name: d.name || id, o, sh, pos: new V3(+d.x || 0, 0, +d.z || 0), yaw: d.face != null ? d.face * PI / 180 : null, pitch: 0, y: 0, vy: 0, air: false, airT: 0, hp: +d.hp || 100, max: +d.hp || 100,
          act: null, queue: [], down: false, reactT: 0, lieT: 0, vel: new V3(), blocking: false, invuln: false, nextThink: .6, cur: Object.assign({}, POSES.stand), base: +d.h || 1,
          ai: d.ai ? Object.assign({ aggr: .6, gap: .45 }, d.ai === true ? {} : d.ai) : null };
        this.actors.push(a); this.byId[id] = a; this.group.add(o.root); if (a.ai) this.autoCam = true; i++;
      }
      for (const a of this.actors) if (a.yaw == null) { const f = this.actors.find(x => x !== a); a.yaw = f ? Math.atan2(f.pos.x - a.pos.x, f.pos.z - a.pos.z) : 0; }
      const tl = s.timeline == null ? [] : s.timeline; if (!Array.isArray(tl)) throw new Error('"timeline" doit être une liste.');
      tl.forEach((e, k) => {
        const n = 'timeline[' + k + ']';
        if (!e || typeof e !== 'object') throw new Error(n + ' : doit être un objet.');
        if (typeof e.do !== 'string' || (ACTS.indexOf(e.do) < 0 && GLOBAL.indexOf(e.do) < 0)) throw new Error(n + ' : "do" inconnu (' + e.do + '). Valeurs : ' + ACTS.concat(GLOBAL).join(', ') + '.');
        if (ACTS.indexOf(e.do) >= 0 && !this.byId[e.actor]) throw new Error(n + ' : "actor" inconnu (' + e.actor + '). Personnages : ' + Object.keys(this.byId).join(', ') + '.');
        for (const key of ['target', 'behind', 'to']) if (typeof e[key] === 'string' && !this.byId[e[key]]) throw new Error(n + ' : "' + key + '" inconnu (' + e[key] + ').');
      });
      this.events = tl.map((e, k) => ({ e, k })).sort((a, b) => (+a.e.t || 0) - (+b.e.t || 0) || a.k - b.k).map(x => x.e);
      if (this.events.some(e => e.do === 'camera')) this.autoCam = false;
      this.actors.forEach(a => { a.cur = Object.assign({}, POSES.guard); this.updateActor(a, 0); }); this.updateCamera(0, true); this.emit();
    }
    play() { this.playing = true; } pause() { this.playing = false; }
    reset(play) { if (this.script) this.load(this.script); this.playing = play !== false; }
    foe(a) { return this.actors.find(x => x !== a && !x.down) || this.actors.find(x => x !== a) || null; }
    clampArena(p) { const r = Math.hypot(p.x, p.z), m = this.arena - .6; if (r > m) { p.x *= m / r; p.z *= m / r; } return p; }
    update(dt) {
      dt = Math.min(dt, .05); if (!this.playing) return;
      if (this.hitstop > 0) { this.hitstop -= dt; dt *= .1; }
      this.time += dt;
      if (!this.finished) {
        while (this.ei < this.events.length && (+this.events[this.ei].t || 0) <= this.time) this.runEvent(this.events[this.ei++]);
        for (const a of this.actors) this.think(a);
        if (this.time >= this.duration) this.finish(null);
      }
      if (this.pendingOver != null) { this.pendingOver -= dt; if (this.pendingOver <= 0) { this.pendingOver = null; const al = this.actors.filter(x => !x.down); this.finish(al.length === 1 ? al[0].id : null); } }
      for (let i = this.later.length - 1; i >= 0; i--) { const l = this.later[i]; l.t -= dt; if (l.t <= 0) { this.later.splice(i, 1); l.fn(); } }
      for (const a of this.actors) this.updateActor(a, dt);
      this.updateFx(dt);
      if (this.autoCam && this.time >= this.nextCam) { const al = this.actors.filter(x => !x.down), p = al[Math.floor(vr() * al.length)], sh = ['wide', 'wide', 'close', 'top']; this.camShot = { shot: sh[Math.floor(vr() * sh.length)], target: p ? p.id : null }; this.nextCam = this.time + 3 + vr() * 3; }
      this.updateCamera(dt, false); this.emit();
    }
    runEvent(e) {
      const d = e.do;
      if (d === 'camera') { this.camShot = { shot: e.shot || 'wide', target: e.target || e.actor || null }; return; }
      if (d === 'text') { this.caption = { text: String(e.text == null ? '' : e.text), until: this.time + (+e.dur || 2.5) }; return; }
      if (d === 'shake') { this.shake = Math.max(this.shake, +e.amount || .5); return; }
      if (d === 'end') { this.finish(e.winner || null); return; }
      const a = this.byId[e.actor]; if (a && !a.down) this.startAct(a, e);
    }
    dest(a, e, tg) {
      const gap = e.gap != null ? +e.gap : 1.4, to = e.to; let p;
      if (Array.isArray(to)) p = new V3(+to[0] || 0, 0, +to[1] || 0);
      else if (e.behind != null) { const t = typeof e.behind === 'string' ? this.byId[e.behind] : tg; p = t ? t.pos.clone().addScaledVector(fwd(t), -gap) : a.pos.clone(); }
      else if (e.away) { const d = tg ? a.pos.clone().sub(tg.pos) : new V3(1, 0, 0); d.y = 0; if (d.lengthSq() < 1e-3) d.set(1, 0, 0); p = a.pos.clone().addScaledVector(d.normalize(), +e.distance || 4); }
      else if (e.random) { const ang = this.rand() * 6.283, r = (.3 + this.rand() * .6) * (this.arena - 1); p = new V3(Math.cos(ang) * r, 0, Math.sin(ang) * r); }
      else { const t = typeof to === 'string' ? this.byId[to] : (e.target ? tg : null); if (t) { const d = a.pos.clone().sub(t.pos); d.y = 0; if (d.lengthSq() < 1e-3) d.set(1, 0, 0); p = t.pos.clone().addScaledVector(d.normalize(), gap); } else p = a.pos.clone(); }
      p.y = 0; return this.clampArena(p);
    }
    startAct(a, e) {
      if (a.down || a.air || a.lieT > 0) return;
      const type = e.do, tg = typeof e.target === 'string' ? this.byId[e.target] : this.foe(a);
      const act = { type, t: 0, e, tgt: tg, dur: 1, from: a.pos.clone(), fired: false };
      switch (type) {
        case 'idle': a.act = null; a.queue = []; a.blocking = false; return;
        case 'walk': case 'run': case 'dash': { act.to = this.dest(a, e, tg); const sp = +e.speed || (type === 'walk' ? 2 : type === 'run' ? 5.5 : 13); act.dur = e.dur ? +e.dur : Math.max(.15, a.pos.distanceTo(act.to) / sp); break; }
        case 'jump': act.to = this.dest(a, e, tg); act.dur = +e.dur || 1; act.h = +e.height || 1.4; break;
        case 'combo': { a.queue = COMBO.slice(1).map(m => Object.assign({}, e, { do: m })); this.startAct(a, Object.assign({}, e, { do: COMBO[0] })); return; }
        case 'punch': case 'kick': case 'uppercut': case 'sweep': case 'flykick': {
          const mv = MOVES[type]; act.mv = mv; act.dur = mv.dur; act.lunge = a.pos.clone();
          if (tg) { const d = a.pos.clone().sub(tg.pos); d.y = 0; if (d.lengthSq() < 1e-3) d.set(1, 0, 0); if (d.length() > mv.gap - .1 || mv.fly) act.lunge = this.clampArena(tg.pos.clone().addScaledVector(d.normalize(), mv.gap)); }
          break;
        }
        case 'teleport': act.dur = .7; act.to = this.dest(a, e, tg); break;
        case 'block': act.dur = +e.dur || 1; a.blocking = true; break;
        case 'pose': act.dur = +e.dur || 2.5; break;
      }
      a.act = act;
    }
    think(a) {
      if (!a.ai || a.act || a.down || a.air || a.lieT > 0 || this.time < a.nextThink || a.reactT > 0) return;
      for (let i = this.ei; i < this.events.length; i++) { const e = this.events[i]; if ((+e.t || 0) > this.time + .35) break; if (e.actor === a.id) return; }
      const f = this.foe(a); if (!f || f.down) return;
      const d = a.pos.distanceTo(f.pos), r = this.rand(), ai = a.ai; let ev;
      if (d > 4.5) ev = r < .35 ? { do: 'run', to: f.id, gap: 2 } : r < .6 ? { do: 'flykick' } : r < .8 ? { do: 'dash', to: f.id, gap: 1.8 } : { do: 'teleport', behind: f.id };
      else if (d > 2.4) ev = r < .35 ? { do: 'kick' } : r < .6 ? { do: 'combo' } : r < .8 ? { do: 'flykick' } : { do: 'dash', to: f.id, gap: 1.5 };
      else ev = r < ai.aggr * .35 ? { do: 'punch' } : r < ai.aggr * .6 ? { do: 'combo' } : r < ai.aggr * .75 ? { do: 'uppercut' } : r < .8 ? { do: 'sweep' } : r < .88 ? { do: 'block', dur: .9 } : r < .94 ? { do: 'teleport', random: true } : { do: 'kick' };
      ev.actor = a.id; ev.target = f.id; this.startAct(a, ev);
      a.nextThink = this.time + (a.act ? a.act.dur + a.queue.length * .6 : 0) + ai.gap * (.6 + this.rand() * .8);
    }
    damage(t, src, o) {
      if (!t || t.down || t.invuln || this.finished) return false;
      let dmg = +o.dmg, push = o.push == null ? 3 : +o.push;
      const dir = src ? t.pos.clone().sub(src.pos) : new V3(); dir.y = 0; if (dir.lengthSq() < 1e-4) dir.set(-Math.sin(t.yaw), 0, -Math.cos(t.yaw)); dir.normalize();
      const chest = t.pos.clone(); chest.y += t.y + 1.1;
      if (t.blocking && !o.launch) { dmg *= .2; push *= .3; this.flash(chest, .5); this.dust(chest, 3, .8, .5, 0xdddddd); t.vel.addScaledVector(dir, push); }
      else {
        t.act = null; t.queue = []; t.blocking = false;
        if (o.launch) { t.air = true; t.vy = +o.launch; t.airT = 0; t.vel.addScaledVector(dir, push * 1.5); } else { t.reactT = .4; t.vel.addScaledVector(dir, push * 1.4); }
        this.flash(chest, o.launch ? 1.5 : 1); this.dust(chest, o.launch ? 8 : 4, 1, .7, 0xdadada); this.hitstop = Math.max(this.hitstop, o.launch ? .1 : .06);
      }
      t.hp = Math.max(0, t.hp - dmg); this.shake = Math.max(this.shake, Math.min(.8, .15 + dmg / 30));
      if (t.hp <= 0) {
        t.down = true; t.act = null; t.queue = []; t.blocking = false;
        if (!t.air) { t.air = true; t.vy = 3.5; t.airT = 0; t.vel.addScaledVector(dir, 3); }
        if (this.actors.filter(x => !x.down).length <= 1) this.pendingOver = 1.8;
      }
      return true;
    }
    finish(winnerId) {
      if (this.finished) return; this.finished = true;
      const w = this.byId[winnerId] || (this.actors.filter(x => !x.down).length === 1 ? this.actors.find(x => !x.down) : null); this.winner = w ? w.id : null;
      if (w && !w.down) { w.act = { type: 'pose', t: 0, dur: 1e9, e: {}, tgt: null, from: w.pos.clone() }; w.blocking = false; w.queue = []; }
      this.caption = w ? { text: w.name + ' remporte le combat !', until: 1e9 } : this.caption; this.autoCam = false; if (w) this.camShot = { shot: 'close', target: w.id };
    }
    land(a) {
      this.dust(a.pos.clone().setY(.12), 8, 1.3, .9, 0xcfcfcf); this.crack(a.pos); this.shake = Math.max(this.shake, .35); a.vel.multiplyScalar(.7); if (!a.down) a.lieT = .9;
    }
    /* ---------- boucle d'un acteur ---------- */
    updateActor(a, dt) {
      const act = a.act, foe = this.foe(a); let ground = 0, sx = 1, sy = 1, visible = true, tgtPose = POSES.guard, fast = 14;
      if (a.air) { a.vy -= 24 * dt; a.y += a.vy * dt; a.airT += dt; if (a.y <= 0) { a.y = 0; a.vy = 0; a.air = false; this.land(a); } }
      if (a.vel.lengthSq() > 1e-4) { a.pos.addScaledVector(a.vel, dt); a.vel.multiplyScalar(Math.exp((a.air ? -1.2 : -5) * dt)); this.clampArena(a.pos); if (!a.air && a.vel.lengthSq() > 9 && vr() < .5) this.dust(a.pos.clone().setY(.1), 1, .5, .5, 0xcfcfcf); }
      if (a.reactT > 0) a.reactT -= dt; if (a.lieT > 0 && !a.air) a.lieT -= dt;
      let lying = false;
      if (a.air) { tgtPose = POSES.air; lying = true; }
      else if (a.down || a.lieT > 0) { tgtPose = POSES.lying; lying = true; }
      else if (a.reactT > 0) tgtPose = POSES.hit;
      else if (act) {
        act.t += dt; const u = clamp(act.t / act.dur, 0, 1), tg = act.tgt;
        if (tg && act.mv) this.faceTo(a, tg.pos.x - a.pos.x, tg.pos.z - a.pos.z, dt, 20);
        switch (act.type) {
          case 'walk': case 'run': case 'dash': {
            a.pos.lerpVectors(act.from, act.to, u); this.faceTo(a, act.to.x - act.from.x, act.to.z - act.from.z, dt, 14);
            const run = act.type !== 'walk', s = Math.sin(this.time * (run ? 12 : 8)), amp = run ? 55 : 30;
            tgtPose = P_({ lean: run ? 24 : 12, hLf: 20 + s * amp, hRf: -10 - s * amp, kL: 30 + Math.max(0, -s) * 50, kR: 25 + Math.max(0, s) * 50, aLx: -50 + (run ? s * 40 : 0), aRx: -50 - (run ? s * 40 : 0) });
            if (act.type === 'dash') { act.tr = (act.tr || 0) - dt; if (act.tr <= 0) { act.tr = .04; this.dust(a.pos.clone().setY(.15), 1, .6, .6, 0xdadada); } }
            break;
          }
          case 'jump': a.pos.lerpVectors(act.from, act.to, u); ground = 4 * act.h * u * (1 - u); tgtPose = POSES.jump; this.faceTo(a, act.to.x - act.from.x, act.to.z - act.from.z, dt, 10); break;
          case 'punch': case 'kick': case 'uppercut': case 'sweep': case 'flykick': {
            const mv = act.mv; fast = 28; tgtPose = evalKeys(mv.keys, u);
            a.pos.lerpVectors(act.from, act.lunge, sm(clamp(act.t / (act.dur * (mv.fly ? .55 : .45)), 0, 1)));
            if (mv.fly) ground = 1.2 * Math.sin(PI * clamp(u / .85, 0, 1));
            if (!act.fired && u >= mv.hit) {
              act.fired = true; const e = act.e, f = fwd(a), at = a.pos.clone().addScaledVector(f, .9); at.y += ground + (act.type === 'sweep' ? .3 : 1.1);
              if (tg && !tg.down && !tg.invuln && a.pos.distanceTo(tg.pos) < mv.reach) this.damage(tg, a, { dmg: e.dmg != null ? e.dmg : mv.dmg, push: mv.push, launch: mv.launch });
              else this.dust(at, 2, .6, .4, 0xe6e6e6);
            }
            break;
          }
          case 'block': tgtPose = POSES.block; break;
          case 'pose': tgtPose = POSES.victory; break;
          case 'teleport': {
            if (!act.fired && act.t >= .2) { act.fired = true; this.vanish(a.pos); a.pos.copy(act.to); }
            if (act.fired && !act.appeared && act.t >= .45) { act.appeared = true; this.vanish(a.pos); if (foe) a.yaw = Math.atan2(foe.pos.x - a.pos.x, foe.pos.z - a.pos.z); }
            a.invuln = act.t > .05 && act.t < .55; visible = !(act.t >= .2 && act.t < .45);
            if (act.t < .2) { const v = sm(act.t / .2); sx = 1 - v; sy = 1 + v * .5; } else if (act.t >= .45) { const v = sm(clamp((act.t - .45) / .25, 0, 1)); sx = Math.max(.01, v); sy = lerp(1.4, 1, v); }
            break;
          }
        }
        if (act.t >= act.dur) {
          a.act = null; a.blocking = false; a.invuln = false;
          if (a.queue.length) this.startAct(a, a.queue.shift());
        }
      } else { if (foe && !foe.down && !this.finished) this.faceTo(a, foe.pos.x - a.pos.x, foe.pos.z - a.pos.z, dt, 6); tgtPose = foe && !foe.down ? Object.assign({}, POSES.guard, { hipY: POSES.guard.hipY + Math.sin(this.time * 4) * .015 }) : POSES.stand; }
      const k = 1 - Math.exp(-fast * dt); for (const key of KEYS) a.cur[key] += (tgtPose[key] - a.cur[key]) * k;
      a.pitch += ((lying ? -PI / 2 * (a.air ? .85 : 1) : 0) - a.pitch) * (1 - Math.exp(-14 * dt));
      applyPose(a);
      const lift = .1 * clamp(-a.pitch / (PI / 2), 0, 1), r = a.o.root;
      r.position.set(a.pos.x, a.y + ground + lift, a.pos.z); r.rotation.set(a.pitch, a.yaw, 0); r.visible = visible; r.scale.set(a.base * sx, a.base * sy, a.base * sx);
      a.sh.position.set(a.pos.x, .012, a.pos.z); a.sh.visible = visible; a.sh.material.opacity = .4 * clamp(1 - (a.y + ground) * .25, .15, 1);
    }
    faceTo(a, dx, dz, dt, k) { if (dx * dx + dz * dz > 1e-4) a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-k * dt)); }
    /* ---------- effets ---------- */
    addFx(obj, life, tick, own) { this.group.add(obj); this.fx.push({ obj, life, t: 0, tick, own }); }
    updateFx(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.t += dt; const u = Math.min(1, f.t / f.life); if (f.tick) f.tick(u, dt, f.obj); if (u >= 1) { this.group.remove(f.obj); if (f.own && f.obj.material) f.obj.material.dispose(); this.fx.splice(i, 1); } }
    }
    dust(p, n, spread, size, color) {
      for (let i = 0; i < n; i++) {
        const m = new T.Sprite(new T.SpriteMaterial({ map: SOFT, color, transparent: true, opacity: .6, depthWrite: false }));
        m.position.set(p.x + (vr() - .5) * spread * .6, p.y + vr() * .2, p.z + (vr() - .5) * spread * .6);
        const v = new V3((vr() - .5) * spread * 2, .3 + vr() * .9, (vr() - .5) * spread * 2), s0 = size * (.5 + vr() * .5), s1 = size * (1.5 + vr() * 1.2);
        this.addFx(m, .7 + vr() * .5, (u, d, mm) => { mm.position.addScaledVector(v, d); v.multiplyScalar(Math.exp(-2 * d)); mm.scale.setScalar(lerp(s0, s1, u)); mm.material.opacity = .6 * (1 - u) * (1 - u); }, true);
      }
    }
    flash(p, size) {
      const st = new T.Sprite(new T.SpriteMaterial({ map: STAR, color: 0xffffff, transparent: true, opacity: 1, depthTest: false, depthWrite: false })); st.material.rotation = vr() * 3; st.position.copy(p); st.renderOrder = 10;
      this.addFx(st, .22, (u, d, m) => { m.scale.setScalar(size * lerp(.5, 1.9, Math.sqrt(u))); m.material.opacity = 1 - u; }, true);
      const gl = new T.Sprite(new T.SpriteMaterial({ map: SOFT, color: 0xffffff, transparent: true, opacity: .9, depthTest: false, depthWrite: false })); gl.position.copy(p); gl.renderOrder = 10;
      this.addFx(gl, .18, (u, d, m) => { m.scale.setScalar(size * lerp(.6, 1.6, u)); m.material.opacity = .9 * (1 - u); }, true);
    }
    vanish(p) { this.dust(p.clone().setY(.8), 8, 1, .7, 0x555555); this.flash(p.clone().setY(1), .8); }
    crack(p) {
      const grp = new T.Group(), mat = new T.MeshBasicMaterial({ color: 0x2c2c2c, transparent: true, opacity: .55, depthWrite: false });
      for (let i = 0; i < 8; i++) { const a = vr() * 6.283, len = .5 + vr() * 1.2, m = new T.Mesh(PLN, mat); m.rotation.x = -PI / 2; m.rotation.z = -a; m.scale.set(len, .035, 1); m.position.set(Math.cos(a) * len / 2, 0, Math.sin(a) * len / 2); grp.add(m); }
      grp.position.set(p.x, .015, p.z); this.group.add(grp); this.cracks.push(grp); if (this.cracks.length > 30) this.group.remove(this.cracks.shift());
    }
    /* ---------- caméra ---------- */
    updateCamera(dt, snap) {
      const c = this.cam, shot = this.camShot || { shot: 'wide' }, al = this.actors.filter(a => !a.down), list = al.length ? al : this.actors; if (!list.length) return;
      const mid = new V3(); list.forEach(a => mid.add(a.pos)); mid.multiplyScalar(1 / list.length); mid.y = 1;
      const asp = c.aspect || 1, pf = Math.pow(Math.max(1, 1.15 / asp), .7), tg = shot.target ? this.byId[shot.target] : null, pos = new V3(), look = mid.clone();
      let dir = new V3(1, 0, 0), sep = 0; if (this.actors.length > 1) { dir = this.actors[1].pos.clone().sub(this.actors[0].pos); sep = dir.length(); } dir.y = 0; if (dir.lengthSq() < .01) dir.set(1, 0, 0); dir.normalize();
      const perp = new V3(-dir.z, 0, dir.x);
      if (shot.shot === 'close' && tg) { pos.copy(tg.pos).addScaledVector(perp, 4.2 * pf); pos.y = 1.5; look.copy(tg.pos); look.y = 1.1; }
      else if (shot.shot === 'top') { pos.copy(mid); pos.y = 10 * pf; pos.z += 3; }
      else { const dist = Math.max(6, sep * 1.05 + 3.8) * pf; pos.copy(mid).addScaledVector(perp.applyAxisAngle(Y, Math.sin(this.time * .2) * .12), dist); pos.y = 1.5 + dist * .08; }
      const k = snap ? 1 : 1 - Math.exp(-3.5 * dt); c.position.lerp(pos, k); this.look.lerp(look, k);
      this.shake = Math.max(0, this.shake - dt * 1.8); const s = this.shake * .22; if (s > 0) c.position.add(new V3((vr() - .5) * s, (vr() - .5) * s, (vr() - .5) * s));
      c.lookAt(this.look);
    }
    getState() { return { time: this.time, over: this.finished, winner: this.winner, name: this.script && this.script.name || '', caption: this.caption && this.time < this.caption.until ? this.caption.text : '', actors: this.actors.map(a => ({ id: a.id, name: a.name, hp: a.hp, max: a.max, down: a.down })) }; }
    emit() { if (this.opts.onState) this.opts.onState(this.getState()); }
  }
  g.Martial = Martial;
})(window);
