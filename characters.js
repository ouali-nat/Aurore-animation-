/* Personnages par défaut articulés (rig 2D) : robo, blob, tri, bulb, cube.
   Angles en degrés, 0 = membre le long du corps, positif = écarté vers l'extérieur. */
const M = {
  robo: { leg: 26, legW: 12, bw: 58, bh: 46, body: 'rect', head: { w: 46, h: 34, shape: 'rect' }, arm: { L: 34, w: 11 }, ax: 0.5, ay: 0.78, ant: 1 },
  blob: { leg: 12, legW: 10, bw: 72, bh: 58, body: 'ellipse', arm: { L: 22, w: 10 }, ax: 0.43, ay: 0.6, face: 0.6 },
  tri:  { leg: 16, legW: 10, bw: 64, bh: 80, body: 'tri', arm: { L: 24, w: 9 }, ax: 0.26, ay: 0.5, face: 0.62 },
  bulb: { leg: 20, legW: 10, bw: 34, bh: 26, body: 'rect', head: { w: 60, h: 60, shape: 'circle' }, arm: { L: 26, w: 9 }, ax: 0.5, ay: 0.8, screw: 1 },
  cube: { leg: 14, legW: 12, bw: 66, bh: 60, body: 'rect', arm: { L: 24, w: 10 }, ax: 0.5, ay: 0.7, face: 0.55 }
};
const BONES = ['head', 'body', 'armL', 'armR', 'legL', 'legR'];
const rad = d => d * Math.PI / 180;
const rr = (c, x, y, w, h, r) => (c.roundRect || c.rect).call(c, x, y, w, h, r);
const charH = m => m.leg + m.bh + (m.head ? m.head.h : 0) + (m.ant ? 18 : 0);
function cap(c, w, L) { c.beginPath(); rr(c, -w / 2, 0, w, L, w / 2); c.fill(); c.stroke(); }

function face(c, cx, cy, fw, st, sp) {
  const eyeC = sp.eye || '#eafff4', es = fw * 0.2, er = Math.max(4, fw * 0.1);
  const e = st.eyes || ((st.t % 3.2) < 0.12 ? 'blink' : 'open');
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    const ex = cx + s * es, ey = cy;
    if (e === 'blink' || e === 'closed') { c.beginPath(); c.moveTo(ex - er, ey); c.lineTo(ex + er, ey); c.stroke(); }
    else if (e === 'happy') { c.beginPath(); c.arc(ex, ey + er * 0.5, er, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    else {
      c.fillStyle = eyeC; c.beginPath(); c.arc(ex, ey, er, 0, 6.3); c.fill();
      c.fillStyle = '#04140c'; c.beginPath();
      c.arc(ex + (st.look || 0) * er * 0.45, ey + (e === 'sad' ? er * 0.25 : 0), er * 0.5, 0, 6.3); c.fill();
      if (e === 'sad') { c.beginPath(); c.moveTo(ex + s * er * 1.4, ey - er * 1.2); c.lineTo(ex - s * er * 0.6, ey - er * 1.9); c.stroke(); }
    }
  }
  const m = st.mouth || 'smile', my = cy + fw * 0.2, mw = fw * 0.16;
  c.fillStyle = '#04140c'; c.beginPath();
  if (m === 'open') { c.ellipse(cx, my, mw * 0.8, mw * 0.9, 0, 0, 6.3); c.fill(); c.stroke(); }
  else if (m === 'talk') { const o = (Math.sin(st.t * 14) + 1) / 2; c.ellipse(cx, my, mw * 0.7, 2 + mw * 0.8 * o, 0, 0, 6.3); c.fill(); c.stroke(); }
  else if (m === 'sad') { c.arc(cx, my + mw * 0.9, mw, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  else if (m === 'o') { c.arc(cx, my, mw * 0.4, 0, 6.3); c.stroke(); }
  else if (m === 'flat') { c.moveTo(cx - mw, my); c.lineTo(cx + mw, my); c.stroke(); }
  else { c.arc(cx, my - mw * 0.5, mw, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
}

/* Dessine un personnage, origine = centre des pieds, unités = pixels du modèle */
function drawRig(c, sp, st) {
  const m = M[sp.model] || M.blob, col = sp.color || '#2de08f', B = st.bones;
  c.save();
  c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = col; c.fillStyle = sp.fill || 'rgba(8,22,16,.96)';
  if (sp.glow !== 0) { c.shadowColor = col; c.shadowBlur = sp.glow ?? 8; }
  const hx = m.bw * 0.24;
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * hx, -m.leg); c.rotate(rad(s > 0 ? -B.legR : B.legL));
    cap(c, m.legW, m.leg);
    c.beginPath(); c.ellipse(s * 3, m.leg, m.legW * 0.8, 5, 0, 0, 6.3); c.fill(); c.stroke(); c.restore();
  }
  c.save(); c.translate(0, -m.leg); c.rotate(rad(B.body)); c.scale(1, 1 + (B.breath || 0));
  for (const s of [-1, 1]) {
    c.save(); c.translate(s * m.bw * m.ax, -m.bh * m.ay); c.rotate(rad(s > 0 ? -B.armR : B.armL));
    cap(c, m.arm.w, m.arm.L); c.restore();
  }
  c.beginPath();
  if (m.body === 'ellipse') c.ellipse(0, -m.bh / 2, m.bw / 2, m.bh / 2, 0, 0, 6.3);
  else if (m.body === 'tri') { c.moveTo(-m.bw / 2, 0); c.lineTo(0, -m.bh); c.lineTo(m.bw / 2, 0); c.closePath(); }
  else rr(c, -m.bw / 2, -m.bh, m.bw, m.bh, 10);
  c.fill(); c.stroke();
  if (m.screw) for (const f of [0.3, 0.55, 0.8]) { c.beginPath(); c.moveTo(-m.bw * 0.4, -m.bh * f); c.lineTo(m.bw * 0.4, -m.bh * f); c.stroke(); }
  if (m.head) {
    const h = m.head;
    c.save(); c.translate(0, -m.bh); c.rotate(rad(B.head)); c.beginPath();
    if (h.shape === 'circle') c.arc(0, -h.h / 2, h.h / 2, 0, 6.3); else rr(c, -h.w / 2, -h.h, h.w, h.h, 12);
    c.fill(); c.stroke();
    if (m.ant) {
      c.beginPath(); c.moveTo(0, -h.h); c.lineTo(0, -h.h - 14); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(0, -h.h - 17, 4, 0, 6.3); c.fill();
    }
    face(c, 0, -h.h / 2, h.w * 0.9, st, sp); c.restore();
  } else face(c, 0, -m.bh * (m.face || 0.6), m.bw * 0.8, st, sp);
  c.restore(); c.restore();
}

/* Poses clés : track.pose = [{t, head, body, armL, armR, legL, legR, mouth, eyes}, ...] */
function applyPose(P, st) {
  if (!P || !P.length) return;
  const keys = new Set();
  P.forEach(q => Object.keys(q).forEach(n => { if (n !== 't') keys.add(n); }));
  for (const n of keys) {
    const L = P.filter(q => q[n] !== undefined).sort((a, b) => a.t - b.t);
    if (typeof L[0][n] === 'string') {
      let v = null; for (const q of L) if (q.t <= t) v = q[n];
      if (v !== null && (n === 'mouth' || n === 'eyes')) st[n] = v;
      continue;
    }
    let v = L[0][n];
    if (t >= L[L.length - 1].t) v = L[L.length - 1][n];
    else for (let i = 1; i < L.length; i++) if (t <= L[i].t) {
      const a = L[i - 1], b = L[i];
      v = t < a.t ? a[n] : a[n] + (b[n] - a[n]) * sstep((t - a.t) / ((b.t - a.t) || 1));
      break;
    }
    if (BONES.includes(n)) st.bones[n] = v;
  }
}

/* Mouvements du corps par type d'animation (s'ajoutent à la pose) */
const R = {
  walk: (t, a) => { const s = Math.sin(2 * Math.PI * t * (a.freq || 2.5));
    return { bones: { legL: Math.max(0, s) * 30, legR: Math.max(0, -s) * 30, armL: s * 14, armR: -s * 14 } }; },
  jump: (t, a) => { const d = a.dur || 0.8; if (t > d) return { bones: {} }; const k = Math.sin(Math.PI * t / d);
    return { bones: { armL: 140 * k, armR: 140 * k, legL: 12 * k, legR: 12 * k }, mouth: 'open', eyes: 'happy' }; },
  wave: (t, a) => ({ bones: { armR: (a.raise || 140) + Math.sin(t * (a.speed || 9)) * 20 }, mouth: 'smile' }),
  cry: t => ({ bones: { armL: 10, armR: 10, head: Math.sin(t * 5) * 3 }, mouth: 'sad', eyes: 'sad' }),
  laugh: t => ({ bones: { armL: 50 + Math.sin(t * 14) * 15, armR: 50 + Math.sin(t * 14) * 15 }, mouth: 'open', eyes: 'happy' }),
  say: () => ({ bones: {}, mouth: 'talk' }),
  dance: (t, a) => { const s = Math.sin(2 * Math.PI * t * (a.freq || 2));
    return { bones: { armL: 100 + s * 50, armR: 100 - s * 50, head: s * 8, legL: Math.max(0, s) * 20, legR: Math.max(0, -s) * 20 }, mouth: 'open', eyes: 'happy' }; },
  bone: (t, a) => ({ bones: { [a.bone]: (a.base || 0) + (a.amp || 30) * Math.sin(2 * Math.PI * t * (a.freq || 1)) } }),
  face: (t, a) => ({ bones: {}, mouth: a.mouth, eyes: a.eyes })
};

function drawChar(c, k, p, cam) {
  const lt = t - (k.start || 0);
  if (lt < 0 || (k.end != null && t > k.end)) return;
  const sp = k.char, m = M[sp.model] || M.blob, seed = sp.seed || 0;
  const o = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1 }, fx = [];
  const st = { t: t + seed * 1.7, mouth: null, eyes: null, look: sp.look ?? 0,
    bones: { head: 0, body: 0, armL: 6, armR: 6, legL: 0, legR: 0, breath: Math.sin(t * 2.2 + seed) * 0.012 } };
  if (k.path && sp.look === undefined) { const v = pos(k, t + 0.05).x - pos(k, t - 0.05).x; if (Math.abs(v) > 0.2) k._d = v > 0 ? 1 : -1; st.look = k._d || 0; }
  applyPose(k.pose, st);
  for (const a of k.anims || []) {
    const f = A[a.type], r = R[a.type], e = E[a.type]; let at;
    if (a.from != null) { at = t - a.from; if (at < 0 || (a.to != null && t > a.to)) continue; }
    else { at = lt - (a.delay || 0); if (at < 0) { if (a.type === 'pop') o.alpha = 0; continue; } }
    if (f) {
      const q = f(at, a);
      o.dx += q.dx || 0; o.dy += q.dy || 0; o.rot += q.rot || 0;
      o.sx *= q.sx ?? 1; o.sy *= q.sy ?? 1; o.alpha *= q.alpha ?? 1;
    }
    if (r) {
      const q = r(at, a);
      for (const b in q.bones) st.bones[b] = (st.bones[b] || 0) + q.bones[b];
      if (q.mouth) st.mouth = q.mouth; if (q.eyes) st.eyes = q.eyes;
    }
    if (e) fx.push([e, at, a]);
  }
  const s = k.scale || 1.5, x = p.x - cam + o.dx, y = p.y + o.dy;
  c.save();
  c.globalAlpha = 0.35 * Math.max(0, 1 - (-o.dy) / 160) * clamp01(o.alpha);
  c.fillStyle = '#000'; c.beginPath(); c.ellipse(p.x - cam, p.y + 4, m.bw * s * 0.45, 7, 0, 0, 6.3); c.fill();
  c.restore();
  c.save(); c.globalAlpha = clamp01(o.alpha);
  c.translate(x, y); c.rotate((k.rot || 0) * Math.PI / 180 + o.rot); c.scale(s * o.sx, s * o.sy);
  drawRig(c, sp, st);
  c.restore();
  const H = charH(m) * s * o.sy, W = m.bw * s;
  const fy = m.head ? m.leg + m.bh + m.head.h / 2 : m.leg + m.bh * (m.face || 0.6);
  const fw = m.head ? m.head.w * 0.9 : m.bw * 0.8;
  for (const [e, at, a] of fx) {
    if (e === E.cry) e(c, at, a, x, y - fy * s * o.sy + 54, fw * 0.2 * s / 0.14, 90);
    else e(c, at, a, x, y, W, H);
  }
}

/* Branchement sur le moteur v2 */
const _dt = drawTrack;
drawTrack = function (c, k, p, cam) { if (k.char) drawChar(c, k, p, cam); else _dt(c, k, p, cam); };

function loop(now) {
  const dt = (now - last) / 1000; last = now;
  if (scene) {
    if (playing) t += dt;
    if (t > scene.duration) { if (rec) { if (rec.state === 'recording') rec.stop(); t = scene.duration; } else t = 0; }
    draw();
    $('#tm').textContent = t.toFixed(1) + ' s';
  }
  requestAnimationFrame(loop);
}
$('#rec').onclick = () => { if (scene && !rec) startRec(); };
setTimeout(() => { if (!sprites.length) msg('Personnages par défaut prêts. La planche est facultative (bouton « Planche »).'); }, 1500);

/* Catalogue animé des personnages par défaut */
(function () {
  const h = document.createElement('h2'); h.textContent = 'Personnages par défaut (champ "model")';
  const g = document.createElement('div');
  g.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px';
  const cols = { robo: '#5ee1ff', blob: '#ffa94d', tri: '#ff7ad9', bulb: '#2de08f', cube: '#ffe66d' };
  const cs = Object.keys(M).map(n => {
    const d = document.createElement('div'), k = document.createElement('canvas');
    k.width = 110; k.height = 130; d.style.cssText = 'border:1px solid #1d3a2c;border-radius:6px;text-align:center;font-size:12px;padding:3px';
    d.appendChild(k); d.append(n); g.appendChild(d);
    return { n, c: k.getContext('2d') };
  });
  document.body.append(h, g);
  (function pv(now) {
    const tt = now / 1000;
    for (const { n, c } of cs) {
      const m = M[n], sc = 100 / charH(m);
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 110, 130);
      c.translate(55, 118); c.scale(sc, sc);
      drawRig(c, { model: n, color: cols[n] }, { t: tt, mouth: 'smile', look: 0,
        bones: { head: Math.sin(tt * 2) * 5, body: 0, armL: 20, armR: 140 + Math.sin(tt * 7) * 18, legL: 0, legR: 0, breath: Math.sin(tt * 2.2) * 0.012 } });
    }
    requestAnimationFrame(pv);
  })(performance.now());
})();
