const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d');
let sprites = [], scene = null, t = 0, playing = true, last = performance.now(), rec = null;
const msg = s => { $('#msg').textContent = s; };
const FALLBACK = { width: 720, height: 720, fps: 30, duration: 4, background: '#000',
  tracks: [{ sprite: 0, x: 360, y: 500, scale: 3, anims: [{ type: 'pop' }, { type: 'bounce', amp: 60 }] }] };

/* ---------- Découpe automatique de la planche ---------- */
function segment(img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;
  const m = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) { if (d[i * 4 + 1] > 50 && d[i * 4 + 1] > d[i * 4] + 15) m[i] = 1; }
  const R = Math.max(4, Math.round(W / 120)), dm = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let px = 0; px < W; px++) if (m[y * W + px]) {
    for (let dy = -R; dy <= R; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -R; dx <= R; dx++) { const xx = px + dx; if (xx >= 0 && xx < W) dm[yy * W + xx] = 1; }
    }
  }
  const lab = new Int32Array(W * H), boxes = []; let n = 0;
  for (let s = 0; s < W * H; s++) {
    if (!dm[s] || lab[s]) continue;
    n++; lab[s] = n; const st = [s];
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    while (st.length) {
      const p = st.pop(), px = p % W, py = (p / W) | 0;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      if (px > 0 && dm[p - 1] && !lab[p - 1]) { lab[p - 1] = n; st.push(p - 1); }
      if (px < W - 1 && dm[p + 1] && !lab[p + 1]) { lab[p + 1] = n; st.push(p + 1); }
      if (py > 0 && dm[p - W] && !lab[p - W]) { lab[p - W] = n; st.push(p - W); }
      if (py < H - 1 && dm[p + W] && !lab[p + W]) { lab[p + W] = n; st.push(p + W); }
    }
    boxes.push({ n, x0, y0, x1, y1 });
  }
  const out = [];
  for (const b of boxes) {
    const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1;
    if (w < 14 || h < 14) continue;
    const sc = document.createElement('canvas'); sc.width = w; sc.height = h;
    const sx = sc.getContext('2d'), id = sx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let px = 0; px < w; px++) {
      const p = (b.y0 + y) * W + b.x0 + px;
      if (lab[p] !== b.n) continue;
      const i = (y * w + px) * 4, r = d[p * 4], g = d[p * 4 + 1], bl = d[p * 4 + 2];
      id.data[i] = r; id.data[i + 1] = g; id.data[i + 2] = bl;
      id.data[i + 3] = Math.min(255, Math.max(r, g, bl) * 2);
    }
    sx.putImageData(id, 0, 0);
    out.push({ c: sc, w, h, cy: (b.y0 + b.y1) / 2, x: b.x0 });
  }
  out.sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const s of out) {
    const r = rows.find(r => Math.abs(r.cy - s.cy) < 35);
    if (r) r.items.push(s); else rows.push({ cy: s.cy, items: [s] });
  }
  return rows.flatMap(r => r.items.sort((a, b) => a.x - b.x));
}

/* ---------- Animations ---------- */
const A = {
  bounce: (t, a) => { const k = Math.abs(Math.sin(Math.PI * t * (a.freq || 1)));
    return { dy: -k * (a.amp || 40), sy: 1 - (1 - k) * 0.08, sx: 1 + (1 - k) * 0.06 }; },
  sway: (t, a) => ({ rot: Math.sin(2 * Math.PI * t * (a.freq || 1)) * (a.amp || 8) * Math.PI / 180 }),
  float: (t, a) => ({ dy: Math.sin(2 * Math.PI * t * (a.freq || 0.5)) * (a.amp || 15) }),
  squash: (t, a) => ({ sy: ((t * (a.freq || 0.4)) % 1) < 0.08 ? 0.15 : 1 }),
  spin: (t, a) => ({ rot: 2 * Math.PI * t * (a.freq || 0.5) }),
  shake: (t, a) => ({ dx: Math.sin(t * 40) * (a.amp || 6) }),
  pop: (t, a) => { const d = a.dur || 0.5, k = Math.min(1, t / d);
    const e = k < 1 ? 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2) : 1;
    return { sx: e, sy: e, alpha: Math.min(1, t / (d * 0.4)) }; }
};

function draw() {
  ctx.globalAlpha = 1;
  ctx.fillStyle = scene.background || '#000';
  ctx.fillRect(0, 0, cv.width, cv.height);
  for (const k of scene.tracks || []) {
    const lt = t - (k.start || 0);
    if (lt < 0 || (k.end != null && t > k.end)) continue;
    const sp = sprites[k.sprite]; if (!sp) continue;
    const o = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1 };
    for (const a of k.anims || []) {
      const f = A[a.type]; if (!f) continue;
      const at = lt - (a.delay || 0);
      if (at < 0) { if (a.type === 'pop') o.alpha = 0; continue; }
      const r = f(at, a);
      o.dx += r.dx || 0; o.dy += r.dy || 0; o.rot += r.rot || 0;
      o.sx *= r.sx ?? 1; o.sy *= r.sy ?? 1; o.alpha *= r.alpha ?? 1;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, o.alpha));
    ctx.translate((k.x || 0) + o.dx, (k.y || 0) + o.dy);
    ctx.rotate((k.rot || 0) * Math.PI / 180 + o.rot);
    const s = k.scale || 2;
    ctx.scale(s * o.sx, s * o.sy);
    ctx.drawImage(sp.c, -sp.w / 2, -sp.h);
    ctx.restore();
  }
}

/* ---------- Boucle de lecture ---------- */
function loop(now) {
  const dt = (now - last) / 1000; last = now;
  if (scene && sprites.length) {
    if (playing) t += dt;
    if (t > scene.duration) {
      if (rec) { if (rec.state === 'recording') rec.stop(); t = scene.duration; } else t = 0;
    }
    draw();
    $('#tm').textContent = t.toFixed(1) + ' s';
  }
  requestAnimationFrame(loop);
}

/* ---------- Export vidéo (MediaRecorder) ---------- */
function startRec() {
  if (!window.MediaRecorder || !cv.captureStream) { msg('Export vidéo non supporté par ce navigateur.'); return; }
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  const mt = types.find(x => MediaRecorder.isTypeSupported(x));
  const ch = [];
  rec = new MediaRecorder(cv.captureStream(scene.fps || 30), { mimeType: mt, videoBitsPerSecond: 4e6 });
  rec.ondataavailable = e => { if (e.data.size) ch.push(e.data); };
  rec.onstop = () => {
    const b = new Blob(ch, { type: mt.split(';')[0] });
    const u = URL.createObjectURL(b);
    const v = $('#out'); v.src = u; v.hidden = false;
    const a = $('#dl'); a.href = u; a.download = 'animation.' + (mt.includes('mp4') ? 'mp4' : 'webm'); a.hidden = false;
    rec = null; playing = true; msg('Vidéo prête (' + (mt.includes('mp4') ? 'MP4' : 'WebM') + ').');
  };
  t = 0; playing = true; rec.start(); msg('Enregistrement en cours…');
}

/* ---------- Interface ---------- */
function gallery() {
  const g = $('#gal'); g.innerHTML = '';
  sprites.forEach((s, i) => {
    const d = document.createElement('div'), im = new Image();
    im.src = s.c.toDataURL(); d.appendChild(im);
    d.appendChild(document.createTextNode(i)); g.appendChild(d);
  });
}
function setScene(s) {
  scene = s; cv.width = s.width || 720; cv.height = s.height || 720;
  t = 0; $('#json').value = JSON.stringify(s, null, 1);
}
function useImage(src) {
  const im = new Image();
  im.onload = () => { sprites = segment(im); gallery(); msg(sprites.length + ' personnages détectés.'); };
  im.onerror = () => msg('Planche introuvable : utilise le bouton « Planche » (ou ajoute assets/planche.jpg).');
  im.src = src;
}
$('#play').onclick = e => { playing = !playing; e.target.textContent = playing ? 'Pause' : 'Lecture'; };
$('#replay').onclick = () => { t = 0; playing = true; $('#play').textContent = 'Pause'; };
$('#rec').onclick = () => { if (scene && sprites.length && !rec) startRec(); else msg('Charge d\'abord la planche.'); };
$('#file').onchange = e => { const f = e.target.files[0]; if (f) useImage(URL.createObjectURL(f)); };
$('#apply').onclick = () => {
  try { setScene(JSON.parse($('#json').value)); msg('Scène appliquée.'); }
  catch (err) { msg('JSON invalide : ' + err.message); }
};

fetch('scene.json').then(r => r.json()).catch(() => FALLBACK).then(setScene);
useImage('assets/planche.jpg');
requestAnimationFrame(loop);
