/* Moteur v2 : monde, caméra, parallaxe (effet 3D), marche, saut, émotions, bulles */
const hash = (i, s) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const sstep = u => u * u * (3 - 2 * u);
const clamp01 = v => Math.max(0, Math.min(1, v));

/* Position d'un élément : trajet 'path' (temps absolus) ou x/y fixes */
function pos(k, tt) {
  const p = k.path;
  if (!p || !p.length) return { x: k.x || 0, y: k.y || 0 };
  const Y = q => q.y ?? k.y ?? 0;
  if (tt <= p[0].t) return { x: p[0].x, y: Y(p[0]) };
  for (let i = 1; i < p.length; i++) {
    if (tt <= p[i].t) {
      const a = p[i - 1], b = p[i], u = sstep((tt - a.t) / ((b.t - a.t) || 1));
      return { x: a.x + (b.x - a.x) * u, y: Y(a) + (Y(b) - Y(a)) * u };
    }
  }
  const l = p[p.length - 1];
  return { x: l.x, y: Y(l) };
}

/* Mouvements supplémentaires */
Object.assign(A, {
  walk: (t, a) => { const ph = 2 * Math.PI * t * (a.freq || 2.5), amp = a.amp || 10;
    return { dy: -Math.abs(Math.sin(ph)) * amp, rot: Math.sin(ph) * 0.06, sy: 1 - 0.03 * Math.abs(Math.cos(ph)) }; },
  jump: (t, a) => { const d = a.dur || 0.8; if (t > d) return {}; const k = t / d;
    return { dy: -(a.h || 100) * 4 * k * (1 - k), sy: 1 + 0.1 * Math.sin(Math.PI * k), sx: 1 - 0.06 * Math.sin(Math.PI * k) }; },
  cry: t => ({ rot: Math.sin(t * 5) * 0.03 - 0.04, sy: 0.96 + Math.sin(t * 9) * 0.015 }),
  laugh: t => ({ dy: -Math.abs(Math.sin(t * 14)) * 14, rot: Math.sin(t * 14) * 0.08 })
});

/* Effets dessinés autour du personnage : larmes, rires, bulles */
const E = {
  cry: (c, t, a, x, y, w, h) => {
    c.fillStyle = 'rgba(120,200,255,.9)';
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const ph = (t * 1.1 + i / 3 + (sd > 0 ? 0.17 : 0)) % 1;
      c.globalAlpha = 1 - ph; c.beginPath();
      c.arc(x + sd * w * 0.14, y - h * 0.6 + ph * h * 0.55, 3.5 * (1 - ph * 0.4), 0, 6.3); c.fill();
    }
    c.globalAlpha = 1;
  },
  laugh: (c, t, a, x, y, w, h) => {
    c.fillStyle = '#ffe66d'; c.font = 'bold 26px system-ui'; c.textAlign = 'center';
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.4 + i / 3) % 1; c.globalAlpha = 1 - ph;
      c.fillText(i % 2 ? 'HA HA' : 'HA!', x + (i - 1) * 55, y - h - 10 - ph * 55);
    }
    c.globalAlpha = 1;
  },
  say: (c, t, a, x, y, w, h) => {
    c.font = 'bold 20px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const tw = c.measureText(a.text || '').width, bw = tw + 24, bh = 34, W = cv.width;
    const bx = Math.max(8, Math.min(W - bw - 8, x - bw / 2)), by = y - h - 58;
    c.globalAlpha = clamp01(t / 0.15); c.fillStyle = '#fff'; c.beginPath();
    (c.roundRect || c.rect).call(c, bx, by, bw, bh, 10); c.fill();
    const tx = Math.max(bx + 14, Math.min(bx + bw - 14, x));
    c.beginPath(); c.moveTo(tx - 8, by + bh - 1); c.lineTo(tx, by + bh + 12); c.lineTo(tx + 8, by + bh - 1); c.fill();
    c.fillStyle = '#0b1a14'; c.fillText(a.text || '', bx + bw / 2, by + bh / 2 + 1);
    c.globalAlpha = 1; c.textBaseline = 'alphabetic';
  }
};

/* Décor procédural : arbres en contours néon */
function tree(c, x, y, s, kind, h, al) {
  c.strokeStyle = `rgba(45,224,143,${al})`; c.fillStyle = 'rgba(8,22,16,.92)';
  c.lineWidth = Math.max(1.2, 2.2 * s);
  const th = (kind === 'pine' ? 130 : 100) * s * (0.8 + 0.4 * h);
  c.fillRect(x - 4 * s, y - 18 * s, 8 * s, 18 * s); c.strokeRect(x - 4 * s, y - 18 * s, 8 * s, 18 * s);
  c.beginPath();
  if (kind === 'pine') {
    for (let i = 0; i < 3; i++) {
      const by = y - 18 * s - i * th * 0.28, w = (40 - i * 10) * s * (0.8 + 0.4 * h);
      c.moveTo(x - w, by); c.lineTo(x, by - th * 0.42); c.lineTo(x + w, by); c.closePath();
    }
  } else {
    const r = 36 * s * (0.8 + 0.4 * h);
    c.arc(x, y - 18 * s - r * 0.9, r, 0, 6.3);
    c.moveTo(x + r * 1.05, y - 18 * s - r * 1.5); c.arc(x + r * 0.55, y - 18 * s - r * 1.5, r * 0.5, 0, 6.3);
  }
  c.fill(); c.stroke();
}

function lay(c, W, H, cam, pred) {
  for (const l of scene.layers || []) {
    if (!pred(l)) continue;
    const p = l.parallax ?? 1, off = cam * p;
    if (l.type === 'hills') {
      c.fillStyle = l.color || '#150f33'; c.strokeStyle = `rgba(45,224,143,${(l.alpha ?? 0.4) * 0.5})`; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(0, H);
      for (let sx = 0; sx <= W + 20; sx += 20) {
        const wx = sx + off;
        c.lineTo(sx, l.y - (Math.sin(wx * 0.004) + Math.sin(wx * 0.011 + 2) * 0.5) * (l.amp || 40));
      }
      c.lineTo(W, H); c.closePath(); c.fill(); c.stroke();
    } else {
      const sp = l.spacing || 150, sc = l.scale || 1;
      const i0 = Math.floor((off - 200 * sc) / sp), i1 = Math.ceil((off + W + 200 * sc) / sp);
      for (let i = i0; i <= i1; i++) {
        const hs = hash(i, l.seed || p * 10); if (hs > 0.88) continue;
        tree(c, i * sp + (hash(i, 7) - 0.5) * sp * 0.6 - off, l.y, sc, l.kind || 'pine', hs, l.alpha ?? 0.6);
      }
    }
  }
}

function bg(c, W, H, cam) {
  const sk = scene.sky;
  if (sk) { const g = c.createLinearGradient(0, 0, 0, H * 0.7); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]); c.fillStyle = g; }
  else c.fillStyle = scene.background || '#000';
  c.fillRect(0, 0, W, H);
  if (sk) {
    c.fillStyle = '#fff';
    for (let i = 0; i < 70; i++) { c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.5 + i)); c.fillRect(hash(i, 3) * W, hash(i, 5) * H * 0.5, 1.6, 1.6); }
    c.globalAlpha = 1; c.fillStyle = '#e8fff3'; c.beginPath(); c.arc(W * 0.82, 70, 26, 0, 6.3); c.fill();
  }
  lay(c, W, H, cam, l => l.type === 'hills' && !l.front);
  const g = scene.ground;
  if (g) {
    const hz = g.horizon || H * 0.66, gg = c.createLinearGradient(0, hz, 0, H);
    gg.addColorStop(0, g.color || '#10261b'); gg.addColorStop(1, '#050d09');
    c.fillStyle = gg; c.fillRect(0, hz, W, H - hz);
    c.strokeStyle = 'rgba(45,224,143,.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, hz); c.lineTo(W, hz); c.stroke();
    c.strokeStyle = 'rgba(45,224,143,.25)'; c.lineWidth = 1.5;
    for (let i = 0; i < 60; i++) {
      const wx = hash(i, 9) * W * 3, sx = (((wx - cam) % (W * 3)) + W * 3) % (W * 3);
      if (sx > W) continue;
      const y = hz + 10 + hash(i, 11) * (H - hz - 14);
      c.beginPath(); c.moveTo(sx, y); c.lineTo(sx + 3, y - 7); c.stroke();
    }
  }
  lay(c, W, H, cam, l => l.type !== 'hills' && !l.front);
}

function drawTrack(c, k, p, cam) {
  const lt = t - (k.start || 0);
  if (lt < 0 || (k.end != null && t > k.end)) return;
  const sp = sprites[k.sprite]; if (!sp) return;
  const o = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1 }, fx = [];
  for (const a of k.anims || []) {
    const f = A[a.type], e = E[a.type]; let at;
    if (a.from != null) { at = t - a.from; if (at < 0 || (a.to != null && t > a.to)) continue; }
    else { at = lt - (a.delay || 0); if (at < 0) { if (a.type === 'pop') o.alpha = 0; continue; } }
    if (f) {
      const r = f(at, a);
      o.dx += r.dx || 0; o.dy += r.dy || 0; o.rot += r.rot || 0;
      o.sx *= r.sx ?? 1; o.sy *= r.sy ?? 1; o.alpha *= r.alpha ?? 1;
    }
    if (e) fx.push([e, at, a]);
  }
  const s = k.scale || 2, x = p.x - cam + o.dx, y = p.y;
  c.save();
  c.globalAlpha = 0.35 * Math.max(0, 1 - (-o.dy) / 160) * clamp01(o.alpha);
  c.fillStyle = '#000'; c.beginPath(); c.ellipse(p.x - cam, y + 4, sp.w * s * 0.4, 7, 0, 0, 6.3); c.fill();
  c.restore();
  c.save();
  c.globalAlpha = clamp01(o.alpha);
  c.translate(x, y + o.dy); c.rotate((k.rot || 0) * Math.PI / 180 + o.rot); c.scale(s * o.sx, s * o.sy);
  c.drawImage(sp.c, -sp.w / 2, -sp.h);
  c.restore();
  for (const [e, at, a] of fx) e(c, at, a, x, y + o.dy, sp.w * s, sp.h * s * o.sy);
}

/* Remplace le rendu simple de app.js */
function draw() {
  const c = ctx, W = cv.width, H = cv.height, trs = scene.tracks || [];
  c.globalAlpha = 1;
  const P = trs.map(k => pos(k, t));
  let cam = 0;
  if (scene.camera) {
    const i = trs.findIndex(k => k.id === scene.camera.follow);
    if (i >= 0) cam = Math.max(0, Math.min((scene.worldWidth || W) - W, P[i].x - W * (scene.camera.lead ?? 0.4)));
  }
  bg(c, W, H, cam);
  trs.map((k, i) => i).sort((a, b) => P[a].y - P[b].y).forEach(i => drawTrack(c, trs[i], P[i], cam));
  lay(c, W, H, cam, l => !!l.front);
}
