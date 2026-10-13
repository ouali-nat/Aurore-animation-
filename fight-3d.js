/* Aurore Animation — COMBATS ÉPIQUES entre stickmen 3D, pilotés par JSON.
   Dépend de : three.js, stickmen-3d.js, stickmen-body-3d.js (chargés avant).
   API :  const f = new Fight(scene, camera, { onState(s){} });
          f.load(jsonObjetOuTexte);  // lève une Error en français si le JSON est invalide
          f.play(); f.pause(); f.reset(); f.update(dt);  // à appeler à chaque image
   Format JSON : voir l'aide de fight-3d.html. */
(function (g) {
  'use strict';
  const T = g.THREE, PI = Math.PI, V3 = T.Vector3, Y = new V3(0, 1, 0), Z = new V3(0, 0, 1);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const sm = t => t * t * (3 - 2 * t);
  const angDiff = (a, b) => { let d = (b - a) % (2 * PI); if (d > PI) d -= 2 * PI; if (d < -PI) d += 2 * PI; return d; };
  const vr = Math.random;
  const col = c => typeof c === 'string' ? parseInt(c.replace('#', ''), 16) : c;
  const INKC = 0x0b0b0d;
  const rng = seed => { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  const POWERS = {
    fire:      { kind: 'proj',   color: 0xff7a1a, core: 0xffd23a, speed: 11, dmg: 16, size: .3,  push: 3.5 },
    water:     { kind: 'proj',   color: 0x3aa0ff, core: 0xbfe6ff, speed: 13, dmg: 13, size: .26, push: 3 },
    dark:      { kind: 'proj',   color: 0x1a1a22, core: 0x7a3be0, speed: 9,  dmg: 15, size: .36, push: 3.5 },
    air:       { kind: 'ring',   color: 0x9aa0a8, core: 0xffffff, speed: 15, dmg: 11, size: .5,  push: 7 },
    lightning: { kind: 'bolt',   color: 0xffe14a, core: 0xffffff, dmg: 20, radius: 1.3, delay: .4, push: 3 },
    earth:     { kind: 'meteor', color: 0x6b5238, core: 0x3a2c1c, dmg: 22, radius: 1.7, delay: .85, push: 4 },
    beam:      { kind: 'beam',   color: 0x7ad0ff, core: 0xffffff, dmg: 24, width: .2, push: 6 },
    nova:      { kind: 'nova',   color: 0xfff2c0, core: 0xffffff, dmg: 18, radius: 3.4, push: 6 }
  };
  const POWER_BY_WEAPON = { fire: 'fire', water: 'water', air: 'air', lightning: 'lightning', earth: 'earth', monk: 'nova', staff: 'beam', scythe: 'dark', bow: 'water' };
  const ACTIONS = ['idle', 'walk', 'run', 'dash', 'jump', 'attack', 'cast', 'teleport', 'block', 'pose'];
  const GLOBAL = ['camera', 'text', 'shake', 'end'];

  const SPH = new T.SphereGeometry(1, 10, 8), CYL = new T.CylinderGeometry(1, 1, 1, 8), RING = new T.RingGeometry(.9, 1, 40), TOR = new T.TorusGeometry(1, .09, 6, 20), ICO = new T.IcosahedronGeometry(1, 0);
  const MATS = {};
  const mat = c => MATS[c] || (MATS[c] = new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
  const SHELL = new T.MeshBasicMaterial({ color: INKC, side: T.BackSide });
  const fwd = a => new V3(Math.sin(a.yaw), 0, Math.cos(a.yaw));

  class Fight {
    constructor(scene, camera, opts) {
      this.scene = scene; this.cam = camera; this.opts = opts || {};
      this.group = new T.Group(); scene.add(this.group);
      this.look = new V3(0, 1.1, 0); this.playing = false; this.script = null;
      this.clear();
    }
    clear() {
      while (this.group.children.length) this.group.remove(this.group.children[0]);
      this.actors = []; this.byId = {}; this.fx = []; this.projs = []; this.later = []; this.events = []; this.ei = 0;
      this.time = 0; this.finished = false; this.pendingOver = null; this.winner = null; this.caption = null;
      this.shake = 0; this.hitstop = 0; this.autoCam = false; this.nextCam = 0; this.camShot = { shot: 'wide' }; this.powers = {};
    }
    /* ---------- chargement + validation ---------- */
    load(src) {
      const s = typeof src === 'string' ? JSON.parse(src) : src;
      if (!s || typeof s !== 'object' || Array.isArray(s)) throw new Error('Le JSON doit être un objet { "actors": {...}, "timeline": [...] }.');
      this.clear(); this.script = s;
      this.rand = rng(s.seed || 1); this.arena = +s.arena || 8; this.duration = +s.duration || 60;
      for (const k of Object.keys(POWERS)) this.powers[k] = Object.assign({}, POWERS[k]);
      for (const k of Object.keys(s.powers || {})) {
        const d = s.powers[k] || {}, base = POWERS[d.base || k];
        if (!base) throw new Error('Pouvoir "' + k + '" : "base" inconnue (' + Object.keys(POWERS).join(', ') + ').');
        const p = Object.assign({}, base, d); if (d.color != null) p.color = col(d.color); if (d.core != null) p.core = col(d.core);
        this.powers[k] = p;
      }
      const defs = s.actors;
      if (!defs || typeof defs !== 'object' || !Object.keys(defs).length) throw new Error('Il faut au moins un personnage dans "actors".');
      const L = g.CHARACTERS_STICK || [];
      for (const id of Object.keys(defs)) {
        const d = defs[id] || {};
        const base = typeof d.char === 'string' ? L.find(c => c.id === d.char) : (d.char && typeof d.char === 'object' ? d.char : L[0]);
        if (!base) throw new Error('Personnage inconnu pour "' + id + '" : "' + d.char + '". Disponibles : ' + L.map(c => c.id).join(', ') + '.');
        const cfg = Object.assign({}, base, d.style || {});
        const o = g.buildCharacter3D(cfg); o.root.rotation.order = 'YXZ';
        const power = d.power || POWER_BY_WEAPON[cfg.weapon] || 'dark';
        if (!this.powers[power]) throw new Error('Pouvoir inconnu pour "' + id + '" : "' + power + '".');
        const a = { id, name: d.name || cfg.name || id, o, cfg, base: o.root.scale.x, pos: new V3(+d.x || 0, 0, +d.z || 0), yaw: d.face != null ? d.face * PI / 180 : null,
          hp: +d.hp || 100, max: +d.hp || 100, act: null, down: false, koT: 0, reactT: 0, vel: new V3(), blocking: false, invuln: false, power, nextThink: .4,
          ai: d.ai ? Object.assign({ aggr: .6, gap: .5, powers: null }, d.ai === true ? {} : d.ai) : null };
        this.actors.push(a); this.byId[id] = a; this.group.add(o.root);
        if (a.ai) this.autoCam = true;
      }
      for (const a of this.actors) if (a.yaw == null) { const f = this.actors.find(x => x !== a); a.yaw = f ? Math.atan2(f.pos.x - a.pos.x, f.pos.z - a.pos.z) : 0; }
      const tl = s.timeline == null ? [] : s.timeline;
      if (!Array.isArray(tl)) throw new Error('"timeline" doit être une liste.');
      tl.forEach((e, i) => {
        const n = 'timeline[' + i + ']';
        if (!e || typeof e !== 'object') throw new Error(n + ' : doit être un objet.');
        if (typeof e.do !== 'string' || (ACTIONS.indexOf(e.do) < 0 && GLOBAL.indexOf(e.do) < 0)) throw new Error(n + ' : "do" inconnu (' + e.do + '). Valeurs : ' + ACTIONS.concat(GLOBAL).join(', ') + '.');
        if (ACTIONS.indexOf(e.do) >= 0 && !this.byId[e.actor]) throw new Error(n + ' : "actor" inconnu (' + e.actor + '). Personnages : ' + Object.keys(this.byId).join(', ') + '.');
        for (const k of ['target', 'behind']) if (typeof e[k] === 'string' && !this.byId[e[k]]) throw new Error(n + ' : "' + k + '" inconnu (' + e[k] + ').');
        if (e.power != null && !this.powers[e.power]) throw new Error(n + ' : pouvoir inconnu (' + e.power + '). Pouvoirs : ' + Object.keys(this.powers).join(', ') + '.');
        if (e.to != null && typeof e.to === 'string' && !this.byId[e.to]) throw new Error(n + ' : "to" inconnu (' + e.to + ').');
      });
      this.events = tl.map((e, i) => ({ e, i })).sort((a, b) => (+a.e.t || 0) - (+b.e.t || 0) || a.i - b.i).map(x => x.e);
      if (this.events.some(e => e.do === 'camera')) this.autoCam = false;
      this.buildArena();
      this.actors.forEach(a => this.updateActor(a, 0));
      this.updateCamera(0, true); this.emit();
    }
    buildArena() {
      const R = this.arena, r = this.rand, ink = new T.MeshBasicMaterial({ color: INKC, transparent: true, opacity: .75, side: T.DoubleSide });
      const ring = new T.Mesh(new T.RingGeometry(R - .05, R, 72), ink); ring.rotation.x = -PI / 2; ring.position.y = .002; this.group.add(ring);
      for (let i = 0; i < 16; i++) {
        const w = .5 + r() * 1.4, m = new T.Mesh(new T.PlaneGeometry(w, .012 + r() * .01), ink), a = r() * 6.283, d = r() * (R - 1.2);
        m.rotation.x = -PI / 2; m.rotation.z = (r() - .5) * .25; m.position.set(Math.cos(a) * d, .003, Math.sin(a) * d); this.group.add(m);
      }
    }
    play() { this.playing = true; } pause() { this.playing = false; }
    reset(play) { if (this.script) this.load(this.script); this.playing = play !== false; }
    /* ---------- boucle ---------- */
    update(dt) {
      dt = Math.min(dt, .05);
      if (!this.playing) return;
      if (this.hitstop > 0) { this.hitstop -= dt; dt *= .08; }
      this.time += dt;
      if (!this.finished) {
        while (this.ei < this.events.length && (+this.events[this.ei].t || 0) <= this.time) this.runEvent(this.events[this.ei++]);
        for (const a of this.actors) this.think(a);
        if (this.time >= this.duration) this.finish(null);
      }
      if (this.pendingOver != null) { this.pendingOver -= dt; if (this.pendingOver <= 0) { this.pendingOver = null; const al = this.actors.filter(x => !x.down); this.finish(al.length === 1 ? al[0].id : null); } }
      for (let i = this.later.length - 1; i >= 0; i--) { const l = this.later[i]; l.t -= dt; if (l.t <= 0) { this.later.splice(i, 1); l.fn(); } }
      for (const a of this.actors) this.updateActor(a, dt);
      this.updateProjs(dt); this.updateFx(dt);
      if (this.autoCam && this.time >= this.nextCam) {
        const shots = ['wide', 'wide', 'follow', 'close', 'top'], al = this.actors.filter(x => !x.down) , pick = al[Math.floor(vr() * al.length)];
        this.camShot = { shot: shots[Math.floor(vr() * shots.length)], target: pick ? pick.id : null }; this.nextCam = this.time + 2.8 + vr() * 3;
      }
      this.updateCamera(dt, false); this.emit();
    }
    runEvent(e) {
      const d = e.do;
      if (d === 'camera') { this.camShot = { shot: e.shot || 'wide', target: e.target || e.actor || null }; return; }
      if (d === 'text') { this.caption = { text: String(e.text == null ? '' : e.text), until: this.time + (+e.dur || 2.5) }; return; }
      if (d === 'shake') { this.shake = Math.max(this.shake, +e.amount || .5); return; }
      if (d === 'end') { this.finish(e.winner || null); return; }
      const a = this.byId[e.actor]; if (!a || a.down) return;
      this.startAct(a, e);
    }
    foe(a) { return this.actors.find(x => x !== a && !x.down) || this.actors.find(x => x !== a) || null; }
    clampArena(p) { const r = Math.hypot(p.x, p.z), m = this.arena - .6; if (r > m) { p.x *= m / r; p.z *= m / r; } return p; }
    dest(a, e, tg) {
      const gap = e.gap != null ? +e.gap : 1.3, to = e.to;
      let p;
      if (Array.isArray(to)) p = new V3(+to[0] || 0, 0, +to[1] || 0);
      else if (e.behind != null) { const t = typeof e.behind === 'string' ? this.byId[e.behind] : tg; p = t ? t.pos.clone().addScaledVector(fwd(t), -gap) : a.pos.clone(); }
      else if (e.away) { const t = tg; const d = t ? a.pos.clone().sub(t.pos) : new V3(1, 0, 0); d.y = 0; if (d.lengthSq() < 1e-3) d.set(1, 0, 0); p = a.pos.clone().addScaledVector(d.normalize(), +e.distance || 4); }
      else if (e.random) { const ang = this.rand() * 6.283, r = (.3 + this.rand() * .6) * (this.arena - 1); p = new V3(Math.cos(ang) * r, 0, Math.sin(ang) * r); }
      else { const t = typeof to === 'string' ? this.byId[to] : (e.target ? tg : null); if (t) { const d = a.pos.clone().sub(t.pos); d.y = 0; if (d.lengthSq() < 1e-3) d.set(1, 0, 0); p = t.pos.clone().addScaledVector(d.normalize(), gap); } else p = a.pos.clone(); }
      p.y = 0; return this.clampArena(p);
    }
    startAct(a, e) {
      const type = e.do, tg = typeof e.target === 'string' ? this.byId[e.target] : this.foe(a);
      const act = { type, t: 0, e, tgt: tg, dur: 1, from: a.pos.clone(), to: null, fired: false };
      switch (type) {
        case 'idle': a.act = null; a.blocking = false; return;
        case 'walk': case 'run': case 'dash': {
          act.to = this.dest(a, e, tg); const sp = +e.speed || (type === 'walk' ? 2.2 : type === 'run' ? 5.5 : 13);
          act.dur = e.dur ? +e.dur : Math.max(.15, a.pos.distanceTo(act.to) / sp); break;
        }
        case 'jump': act.to = this.dest(a, e, tg); act.dur = +e.dur || 1; act.h = +e.height || 1.4; break;
        case 'attack': {
          act.dur = 1.4; act.lunge = a.pos.clone();
          if (tg && a.pos.distanceTo(tg.pos) > 1.5) { const d = a.pos.clone().sub(tg.pos); d.y = 0; act.lunge = this.clampArena(tg.pos.clone().addScaledVector(d.normalize(), 1.3)); }
          break;
        }
        case 'cast': act.dur = 1.2; act.power = e.power || a.power; break;
        case 'teleport': act.dur = .75; act.to = this.dest(a, e, tg); break;
        case 'block': act.dur = +e.dur || 1; a.blocking = true; break;
        case 'pose': act.dur = +e.dur || 2.5; break;
      }
      a.act = act;
    }
    faceTo(a, dx, dz, dt, k) { if (dx * dx + dz * dz > 1e-4) a.yaw += angDiff(a.yaw, Math.atan2(dx, dz)) * (1 - Math.exp(-k * dt)); }
    handPos(a) { const v = new V3(); a.o.root.updateMatrixWorld(true); a.o.P.handR.getWorldPosition(v); if (!isFinite(v.x)) v.copy(a.pos).setY(1.3); return v; }
    /* ---------- IA ---------- */
    think(a) {
      if (!a.ai || a.act || a.down || this.time < a.nextThink || a.reactT > 0) return;
      for (let i = this.ei; i < this.events.length; i++) { const e = this.events[i]; if ((+e.t || 0) > this.time + .35) break; if (e.actor === a.id) return; }
      const f = this.foe(a); if (!f || f.down) return;
      const d = a.pos.distanceTo(f.pos), r = this.rand(), ai = a.ai, pw = ai.powers && ai.powers.length ? ai.powers : [a.power];
      const pick = () => pw[Math.floor(this.rand() * pw.length)];
      let ev;
      if (d > 4) ev = r < .45 ? { do: 'cast', power: pick() } : r < .7 ? { do: 'run', to: f.id, gap: 2 } : r < .88 ? { do: 'teleport', behind: f.id } : { do: 'dash', to: f.id, gap: 1.6 };
      else if (d > 2.4) ev = r < .5 ? { do: 'attack' } : r < .8 ? { do: 'cast', power: pick() } : { do: 'teleport', random: true };
      else ev = r < ai.aggr * .75 ? { do: 'attack' } : r < .78 ? { do: 'block', dur: 1 } : r < .9 ? { do: 'teleport', random: true } : { do: 'cast', power: pick() };
      ev.actor = a.id; ev.target = f.id;
      this.startAct(a, ev);
      a.nextThink = this.time + (a.act ? a.act.dur : 0) + ai.gap * (.6 + this.rand() * .8);
    }
    /* ---------- dégâts ---------- */
    damage(t, src, o) {
      if (!t || t.down || t.invuln || this.finished) return false;
      let dmg = o.dmg == null ? 10 : +o.dmg, push = o.push == null ? 3 : +o.push;
      const dir = o.dir ? o.dir.clone() : (src ? t.pos.clone().sub(src.pos) : new V3());
      dir.y = 0; if (dir.lengthSq() < 1e-4) dir.set(-Math.sin(t.yaw), 0, -Math.cos(t.yaw)); dir.normalize();
      const chest = t.pos.clone(); chest.y += 1.1;
      if (t.blocking) { dmg *= .2; push *= .3; this.burst(chest, 0xdddddd, 6, 3, .05, .35, 6); }
      else {
        t.act = null; t.reactT = .45; this.burst(chest, INKC, 12, 4.2, .07, .6, 9); this.ringFx(chest, INKC, .2, 1.1, .3, 'camera');
        this.hitstop = Math.max(this.hitstop, .07);
      }
      t.hp = Math.max(0, t.hp - dmg); t.vel.addScaledVector(dir, push * 1.6);
      this.shake = Math.max(this.shake, Math.min(.9, .15 + dmg / 40));
      if (t.hp <= 0) {
        t.down = true; t.act = null; t.blocking = false; t.koT = 0; t.vel.addScaledVector(dir, 3);
        if (this.actors.filter(x => !x.down).length <= 1) this.pendingOver = 1.4;
      }
      return true;
    }
    hitArea(owner, c, radius, dmg, push) {
      for (const t of this.actors) { if (t === owner || t.down) continue; if (Math.hypot(t.pos.x - c.x, t.pos.z - c.z) <= radius) this.damage(t, null, { dmg, push, dir: t.pos.clone().sub(c) }); }
    }
    finish(winnerId) {
      if (this.finished) return; this.finished = true;
      const w = this.byId[winnerId] || (this.actors.filter(x => !x.down).length === 1 ? this.actors.find(x => !x.down) : null);
      this.winner = w ? w.id : null;
      if (w && !w.down) { w.act = { type: 'pose', t: 0, dur: 1e9, e: {}, tgt: null, from: w.pos.clone() }; w.blocking = false; }
      this.caption = w ? { text: w.name + ' remporte le combat !', until: 1e9 } : (this.caption && this.caption.until > this.time ? this.caption : null);
      this.camShot = w ? { shot: 'close', target: w.id } : this.camShot; this.autoCam = false;
    }
    /* ---------- acteurs ---------- */
    updateActor(a, dt) {
      const act = a.act, o = a.o, P = o.P, foe = this.foe(a);
      let anim = 'idle', local = this.time, ground = 0, pitch = 0, visible = true, sx = 1, sy = 1;
      if (a.reactT > 0) a.reactT -= dt;
      if (a.vel.lengthSq() > 1e-4) { a.pos.addScaledVector(a.vel, dt); a.vel.multiplyScalar(Math.exp(-6 * dt)); this.clampArena(a.pos); }
      if (a.down) { a.koT += dt; const p = clamp(a.koT / .5, 0, 1); pitch = -PI / 2 * sm(p); ground = .1 * p; }
      else if (act) {
        act.t += dt; const u = clamp(act.t / act.dur, 0, 1), e = act.e, tg = act.tgt;
        if (tg && (act.type === 'attack' || act.type === 'cast')) this.faceTo(a, tg.pos.x - a.pos.x, tg.pos.z - a.pos.z, dt, 18);
        switch (act.type) {
          case 'walk': case 'run': case 'dash':
            a.pos.lerpVectors(act.from, act.to, u); anim = act.type === 'walk' ? 'walk' : 'run';
            this.faceTo(a, act.to.x - act.from.x, act.to.z - act.from.z, dt, 14);
            if (act.type === 'dash') { act.tr = (act.tr || 0) - dt; if (act.tr <= 0) { act.tr = .03; this.burst(a.pos.clone().setY(.5 + vr()), INKC, 2, 1, .12, .35, 0); } }
            break;
          case 'jump':
            a.pos.lerpVectors(act.from, act.to, u); ground = 4 * act.h * u * (1 - u); anim = 'jump'; local = act.t;
            this.faceTo(a, act.to.x - act.from.x, act.to.z - act.from.z, dt, 10); break;
          case 'attack':
            anim = 'attack'; local = act.t; a.pos.lerpVectors(act.from, act.lunge, sm(clamp(act.t / .55, 0, 1)));
            if (!act.fired && act.t >= .78) {
              act.fired = true; const f = fwd(a); this.ringFx(a.pos.clone().addScaledVector(f, 1.1).setY(1.2), INKC, .3, 1.5, .22, 'camera');
              if (tg && !tg.down && a.pos.distanceTo(tg.pos) < 2.6) this.damage(tg, a, { dmg: e.dmg != null ? e.dmg : 12, push: e.push != null ? e.push : 4 });
            }
            break;
          case 'cast': {
            anim = 'cast'; local = act.t; const P0 = this.powers[act.power];
            if (act.t < .5) { act.ch = (act.ch || 0) - dt; if (act.ch <= 0) { act.ch = .06; this.burst(this.handPos(a), e.color != null ? col(e.color) : P0.color, 2, 1.2, .07, .3, 0); } }
            if (!act.fired && act.t >= .5) { act.fired = true; this.castPower(a, act); }
            break;
          }
          case 'teleport': {
            if (!act.fired && act.t >= .2) { act.fired = true; this.vanishFx(a.pos); a.pos.copy(act.to); }
            if (act.fired && !act.appeared && act.t >= .45) { act.appeared = true; this.vanishFx(a.pos); if (foe) a.yaw = Math.atan2(foe.pos.x - a.pos.x, foe.pos.z - a.pos.z); }
            a.invuln = act.t > .05 && act.t < .55; visible = !(act.t >= .2 && act.t < .45);
            if (act.t < .2) { const v = sm(act.t / .2); sx = 1 - v; sy = 1 + v * .6; }
            else if (act.t >= .45) { const v = sm(clamp((act.t - .45) / .25, 0, 1)); sx = Math.max(.01, v); sy = lerp(1.5, 1, v); }
            break;
          }
          case 'pose': anim = 'pose'; local = act.t; break;
        }
        if (act.t >= act.dur) { a.act = null; a.blocking = false; a.invuln = false; }
      } else if (foe && !foe.down && !this.finished) this.faceTo(a, foe.pos.x - a.pos.x, foe.pos.z - a.pos.z, dt, 6);
      o.anim = anim; g.poseCharacter3D(o, local); this.overrides(a);
      o.root.position.set(a.pos.x, ground, a.pos.z); o.root.rotation.set(pitch, a.yaw, 0); o.root.visible = visible;
      o.root.scale.set(a.base * sx, a.base * sy, a.base * sx);
    }
    overrides(a) {
      const P = a.o.P;
      if (a.down) { const p = clamp(a.koT / .5, 0, 1); P.spine.rotation.set(0, 0, 0); P.head.rotation.x = 0; P.armL.rotation.set(0, 0, -1.2 * p); P.armR.rotation.set(0, 0, 1.2 * p); P.elbowL.rotation.x = 0; P.elbowR.rotation.x = 0; return; }
      if (a.reactT > 0) { const u = clamp(a.reactT / .45, 0, 1); P.spine.rotation.x = -.5 * u; P.head.rotation.x = -.45 * u; P.armL.rotation.set(-.5 * u, 0, -(.6 + .7 * u)); P.armR.rotation.set(-.5 * u, 0, .6 + .7 * u); P.elbowL.rotation.x = -.3; P.elbowR.rotation.x = -.3; return; }
      if (a.act && a.act.type === 'block') { P.armL.rotation.set(-1.4, 0, -.25); P.armR.rotation.set(-1.4, 0, .25); P.elbowL.rotation.x = -1.6; P.elbowR.rotation.x = -1.6; P.spine.rotation.x = .15; }
    }
    /* ---------- pouvoirs ---------- */
    castPower(a, act) {
      const e = act.e, P = this.powers[act.power], tg = act.tgt;
      const color = e.color != null ? col(e.color) : P.color, dmg = e.dmg != null ? +e.dmg : P.dmg, push = e.push != null ? +e.push : P.push;
      const origin = this.handPos(a), aim = tg ? tg.pos.clone() : a.pos.clone().addScaledVector(fwd(a), 6);
      const aimC = aim.clone(); aimC.y += 1.1;
      const dir = aimC.clone().sub(origin); if (dir.lengthSq() < 1e-4) dir.copy(fwd(a)); dir.normalize();
      this.burst(origin, color, 8, 3, .09, .4, 0); this.shake = Math.max(this.shake, .12);
      switch (P.kind) {
        case 'proj': case 'ring': {
          const grp = new T.Group(), size = P.size;
          if (P.kind === 'proj') {
            const s1 = new T.Mesh(SPH, mat(color)); s1.scale.setScalar(size); const s2 = new T.Mesh(SPH, mat(P.core)); s2.scale.setScalar(size * .55); const sh = new T.Mesh(SPH, SHELL); sh.scale.setScalar(size * 1.22);
            grp.add(s1, s2, sh);
          } else for (let i = 0; i < 3; i++) { const r = new T.Mesh(TOR, mat(i ? color : P.core)); r.scale.setScalar(size * (1 - i * .2)); r.position.z = -i * size * .9; grp.add(r); const q = new T.Mesh(TOR, SHELL); q.scale.setScalar(size * (1 - i * .2) * 1.15); q.position.z = r.position.z; grp.add(q); }
          grp.quaternion.setFromUnitVectors(Z, dir); grp.position.copy(origin); this.group.add(grp);
          this.projs.push({ mesh: grp, pos: origin.clone(), vel: dir.clone().multiplyScalar(+e.speed || P.speed), owner: a, color, dmg, push, size: P.kind === 'ring' ? size * .6 : size, life: 3, tr: 0 });
          break;
        }
        case 'bolt': {
          const at = aim.clone(), r = e.radius != null ? +e.radius : P.radius;
          this.ringFx(at.clone().setY(.03), INKC, r, r * .35, P.delay, 'ground');
          this.later.push({ t: P.delay, fn: () => { this.boltFx(at, color, P.core); this.burst(at.clone().setY(.2), color, 14, 5, .09, .5, 6); this.shake = Math.max(this.shake, .5); this.hitArea(a, at, r, dmg, push); } });
          break;
        }
        case 'meteor': {
          const at = aim.clone(), r = e.radius != null ? +e.radius : P.radius, dl = P.delay;
          this.ringFx(at.clone().setY(.03), INKC, r * .3, r, dl, 'ground');
          const rock = new T.Group(), rm = new T.Mesh(ICO, mat(color)); rm.scale.setScalar(.7); const rs = new T.Mesh(ICO, SHELL); rs.scale.setScalar(.82); rock.add(rm, rs);
          this.addFx(rock, dl, (u, d, m) => { m.position.set(at.x + (1 - u) * 2, .5 + (1 - u * u) * 9, at.z); m.rotation.x += d * 6; });
          this.later.push({ t: dl, fn: () => { this.burst(at.clone().setY(.3), 0x6b5238, 18, 5, .13, .7, 9); this.ringFx(at.clone().setY(.04), INKC, .4, r * 1.4, .45, 'ground'); this.shake = Math.max(this.shake, .7); this.hitArea(a, at, r, dmg, push); } });
          break;
        }
        case 'beam': {
          const len = 16, w = P.width || .2, grp = new T.Group(), o1 = new T.Mesh(CYL, mat(color)), o2 = new T.Mesh(CYL, mat(P.core));
          o1.scale.set(w, len, w); o2.scale.set(w * .4, len, w * .4); o1.position.y = o2.position.y = len / 2; grp.add(o1, o2);
          grp.position.copy(origin); grp.quaternion.setFromUnitVectors(Y, dir);
          this.addFx(grp, .9, (u, d, m) => { const s = u < .12 ? u / .12 : 1 - (u - .12) / .88 * .6; m.scale.set(s, 1, s); });
          const end = origin.clone().addScaledVector(dir, len); this.shake = Math.max(this.shake, .4);
          this.later.push({ t: .08, fn: () => { const ln = new T.Line3(origin, end), c = new V3(); for (const t of this.actors) { if (t === a || t.down) continue; const p = t.pos.clone(); p.y += 1.1; ln.closestPointToPoint(p, true, c); if (c.distanceTo(p) < .9) this.damage(t, a, { dmg, push, dir: dir.clone() }); } } });
          break;
        }
        case 'nova': {
          const r = e.radius != null ? +e.radius : P.radius;
          this.ringFx(a.pos.clone().setY(.04), color, .3, r, .5, 'ground'); this.ringFx(a.pos.clone().setY(.05), INKC, .2, r * .8, .4, 'ground');
          this.burst(a.pos.clone().setY(.8), color, 24, 6, .1, .6, 2); this.shake = Math.max(this.shake, .5);
          this.later.push({ t: .12, fn: () => this.hitArea(a, a.pos, r, dmg, push) });
          break;
        }
      }
    }
    updateProjs(dt) {
      for (let i = this.projs.length - 1; i >= 0; i--) {
        const p = this.projs[i]; p.life -= dt; p.pos.addScaledVector(p.vel, dt); p.mesh.position.copy(p.pos); p.mesh.rotateZ(dt * 8);
        p.tr -= dt; if (p.tr <= 0) { p.tr = .04; this.burst(p.pos, p.color, 1, .8, .12, .3, 0); }
        let hit = null;
        for (const t of this.actors) { if (t === p.owner || t.down || t.invuln) continue; const c = t.pos.clone(); c.y += 1.1; if (c.distanceTo(p.pos) < .8 + p.size) { hit = t; break; } }
        if (hit) { this.damage(hit, p.owner, { dmg: p.dmg, push: p.push, dir: p.vel.clone() }); this.burst(p.pos, p.color, 16, 5, .1, .5, 5); this.ringFx(p.pos, p.color, .2, 1.5, .3, 'camera'); }
        if (hit || p.life <= 0 || Math.hypot(p.pos.x, p.pos.z) > this.arena + 4) { this.group.remove(p.mesh); this.projs.splice(i, 1); }
      }
    }
    /* ---------- effets ---------- */
    addFx(obj, life, tick, own) { this.group.add(obj); this.fx.push({ obj, life, t: 0, tick, own }); }
    updateFx(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.t += dt; const u = Math.min(1, f.t / f.life); if (f.tick) f.tick(u, dt, f.obj);
        if (u >= 1) { this.group.remove(f.obj); if (f.own && f.obj.material) f.obj.material.dispose(); this.fx.splice(i, 1); }
      }
    }
    burst(p, color, n, speed, size, life, grav) {
      for (let i = 0; i < n; i++) {
        const m = new T.Mesh(SPH, mat(color)), s = size * (.6 + vr() * .8); m.position.copy(p); m.scale.setScalar(s);
        const v = new V3(vr() - .5, vr() * .9 + .1, vr() - .5).normalize().multiplyScalar(speed * (.4 + vr() * .8));
        this.addFx(m, life * (.7 + vr() * .6), (u, d, mm) => { v.y -= grav * d; mm.position.addScaledVector(v, d); mm.scale.setScalar(s * (1 - u)); });
      }
    }
    ringFx(p, color, r0, r1, life, mode) {
      const m = new T.Mesh(RING, new T.MeshBasicMaterial({ color, transparent: true, opacity: .9, side: T.DoubleSide, depthWrite: false }));
      m.position.copy(p); if (mode === 'ground') m.rotation.x = -PI / 2; else m.lookAt(this.cam.position);
      this.addFx(m, life, (u, d, mm) => { mm.scale.setScalar(Math.max(.01, lerp(r0, r1, u))); mm.material.opacity = .9 * (1 - u * u); }, true);
    }
    vanishFx(p) { this.burst(p.clone().setY(1), INKC, 16, 4, .09, .6, -2); this.ringFx(p.clone().setY(.03), INKC, .2, 1.6, .4, 'ground'); this.ringFx(p.clone().setY(1.1), INKC, .2, 1.3, .3, 'camera'); }
    boltFx(at, color, core) {
      const grp = new T.Group(), pts = [new V3(at.x, 9, at.z)];
      for (let i = 1; i < 7; i++) pts.push(new V3(at.x + (vr() - .5) * 1.1, 9 - i * 1.5, at.z + (vr() - .5) * 1.1));
      pts.push(new V3(at.x, 0, at.z));
      for (let i = 0; i < pts.length - 1; i++) for (const [c, r] of [[color, .09], [core, .035]]) {
        const a = pts[i], b = pts[i + 1], m = new T.Mesh(CYL, mat(c)), d = b.clone().sub(a), len = d.length();
        m.scale.set(r, len, r); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(Y, d.normalize()); grp.add(m);
      }
      this.addFx(grp, .28, (u, d, m) => { m.visible = Math.sin(u * 40) > -.5; });
    }
    /* ---------- caméra ---------- */
    updateCamera(dt, snap) {
      const c = this.cam, shot = this.camShot || { shot: 'wide' }, al = this.actors.filter(a => !a.down), list = al.length ? al : this.actors;
      if (!list.length) return;
      const mid = new V3(); list.forEach(a => mid.add(a.pos)); mid.multiplyScalar(1 / list.length); mid.y = 1.1;
      const asp = c.aspect || 1, pf = Math.pow(Math.max(1, 1.15 / asp), .7), tg = shot.target ? this.byId[shot.target] : null;
      const pos = new V3(), look = mid.clone();
      if (shot.shot === 'follow' && tg) { const f = fwd(tg), r = new V3(-f.z, 0, f.x); pos.copy(tg.pos).addScaledVector(f, -3.6 * pf).addScaledVector(r, .9); pos.y = 2; look.copy(tg.pos).addScaledVector(f, 3); look.y = 1.2; }
      else if (shot.shot === 'close' && tg) { const f = fwd(tg), r = new V3(-f.z, 0, f.x); pos.copy(tg.pos).addScaledVector(f, 2.6 * pf).addScaledVector(r, 1.6); pos.y = 1.5; look.copy(tg.pos); look.y = 1.25; }
      else if (shot.shot === 'top') { pos.copy(mid); pos.y = 11 * pf; pos.z += 4; }
      else {
        let dir = new V3(1, 0, 0), sep = 0;
        if (list.length > 1) { dir = list[1].pos.clone().sub(list[0].pos); sep = dir.length(); }
        dir.y = 0; if (dir.lengthSq() < .01) dir.set(1, 0, 0); dir.normalize();
        const dist = Math.max(6.5, sep * .95 + 4.5) * pf, perp = new V3(-dir.z, 0, dir.x).applyAxisAngle(Y, Math.sin(this.time * .25) * .35);
        pos.copy(mid).addScaledVector(perp, dist); pos.y = 2.4 + dist * .12;
      }
      const k = snap ? 1 : 1 - Math.exp(-3.5 * dt);
      c.position.lerp(pos, k); this.look.lerp(look, k);
      this.shake = Math.max(0, this.shake - dt * 1.6);
      const s = this.shake * .25; if (s > 0) c.position.add(new V3((vr() - .5) * s, (vr() - .5) * s, (vr() - .5) * s));
      c.lookAt(this.look);
    }
    /* ---------- état pour l'interface ---------- */
    getState() {
      return { time: this.time, over: this.finished, winner: this.winner, name: this.script && this.script.name || '',
        caption: this.caption && this.time < this.caption.until ? this.caption.text : '',
        actors: this.actors.map(a => ({ id: a.id, name: a.name, hp: a.hp, max: a.max, down: a.down })) };
    }
    emit() { if (this.opts.onState) this.opts.onState(this.getState()); }
  }
  g.Fight = Fight; g.FIGHT_POWERS = POWERS;
})(window);
