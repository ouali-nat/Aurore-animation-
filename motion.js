/* Aurore Motion — moteur JSON → animation (Web Animations API, sans dépendance) */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), wrap = $('#wrap'), ed = $('#ed'), seek = $('#seek');
  const EASE = {
    spring: 'cubic-bezier(.34,1.56,.64,1)', bounce: 'cubic-bezier(.68,-.55,.27,1.55)',
    easeOutExpo: 'cubic-bezier(.16,1,.3,1)', easeInExpo: 'cubic-bezier(.7,0,.84,0)', easeInOutExpo: 'cubic-bezier(.87,0,.13,1)',
    easeOutBack: 'cubic-bezier(.34,1.56,.64,1)', easeInOutCubic: 'cubic-bezier(.65,0,.35,1)',
    easeOutCubic: 'cubic-bezier(.33,1,.68,1)', easeInCubic: 'cubic-bezier(.32,0,.67,0)',
    easeOutElastic: 'cubic-bezier(.3,1.8,.5,1)'
  };
  const ease = e => EASE[e] || e || 'ease-in-out';

  const EX = {
    'Boule à 4 trous': { width: 360, height: 360, background: '#0d0b1f', duration: 1400,
      layers: [{ shape: 'ball', size: 120, easing: 'linear',
        keyframes: [{ t: 0, rotate: 0, scale: 1 }, { t: 0.5, scale: 1.12 }, { t: 1, rotate: 360, scale: 1 }] }] },
    'Rebond': { width: 360, height: 360, background: '#0d0b1f', duration: 1600,
      layers: [
        { shape: 'ring', size: 40, color: '#8b5cf6', x: 180, y: 300, easing: 'ease-out',
          keyframes: [{ t: 0, scale: 0.4, opacity: 0.9 }, { t: 0.5, scale: 0.4, opacity: 0.9 }, { t: 1, scale: 3, opacity: 0 }] },
        { shape: 'circle', size: 60, color: '#38bdf8', x: 180,
          keyframes: [{ t: 0, y: 80, scaleX: 1, scaleY: 1, easing: 'ease-in' },
            { t: 0.5, y: 290, scaleX: 1.25, scaleY: 0.75, easing: 'ease-out' },
            { t: 1, y: 80, scaleX: 1, scaleY: 1 }] }] },
    'Texte': { width: 360, height: 360, background: '#090812', duration: 2400,
      layers: [{ shape: 'text', text: 'Aurore 🌱', size: 60, color: '#f4f2ff',
        keyframes: [{ t: 0, y: 220, opacity: 0, blur: 12 },
          { t: 0.35, y: 180, opacity: 1, blur: 0, easing: 'spring' },
          { t: 0.8, y: 180, opacity: 1 },
          { t: 1, y: 140, opacity: 0, blur: 8 }] }] },
    'Logo (image)': { width: 360, height: 360, background: '#ffffff', duration: 3000,
      layers: [{ shape: 'image', src: 'logo.png', blend: 'multiply', size: 280,
        keyframes: [{ t: 0, scale: 0.6, opacity: 0, blur: 10 },
          { t: 0.3, scale: 1, opacity: 1, blur: 0, easing: 'spring' },
          { t: 0.8, scale: 1.04, opacity: 1 },
          { t: 1, scale: 1, opacity: 1 }] }] },
    'Explosion (burst)': { width: 360, height: 360, background: '#090812', duration: 2600, loop: false,
      layers: [
        { shape: 'burst', count: 40, x: 180, y: 180, distance: [60, 170], pSize: [4, 10], colors: ['#8b5cf6', '#38bdf8', '#f472b6'], life: [900, 1800], spread: 120, seed: 4 },
        { shape: 'text', text: 'BOOM', split: true, stagger: 70, fontSize: 80, weight: 900, gradient: ['#8b5cf6', '#38bdf8'], width: 360, size: 100, x: 180, y: 180, glow: 18, glowColor: '#8b5cf6', delay: 200, duration: 2000, loop: false,
          keyframes: [{ t: 0, y: 260, opacity: 0, scale: 0.4, easing: 'easeOutBack' }, { t: 0.25, y: 180, opacity: 1, scale: 1 }, { t: 0.85, opacity: 1 }, { t: 1, opacity: 0 }] }] }
  };
  /* Exemples chargés depuis un fichier du dépôt. */
  const FILES = { 'ChatGPT 45 s ⚡ (fichier)': 'examples/chatgpt-45s.json' };

  let anims = [], clock = null, dur = 2000, rate = 1, dragging = false, timer = 0, looping = true;

  function validate(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return 'Le JSON doit être un objet { ... }';
    if (!Array.isArray(o.layers)) return '"layers" doit être une liste';
    for (const [i, l] of o.layers.entries()) {
      if (!l || typeof l !== 'object') return 'layers[' + i + '] doit être un objet';
      if (l.group && !(o.groups && o.groups[l.group])) return 'layers[' + i + '] : le groupe "' + l.group + '" n\'existe pas dans "groups"';
      if (l.keyframes !== undefined && !Array.isArray(l.keyframes)) return 'layers[' + i + '].keyframes doit être une liste';
      for (const [j, k] of (l.keyframes || []).entries())
        if (!k || typeof k.t !== 'number' || k.t < 0 || k.t > 1)
          return 'layers[' + i + '].keyframes[' + j + '].t doit être un nombre entre 0 et 1';
    }
  }

  /* ---------- Générateurs : burst, wordburst, texte découpé (split) ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (v, r) => Array.isArray(v) ? v[0] + (v[1] - v[0]) * r() : (v == null ? 0 : v);
  const mctx = () => document.createElement('canvas').getContext('2d');
  const OUT = 'cubic-bezier(.16,1,.3,1)';

  function expand(list, W, H) {
    const out = [];
    for (const l of list) {
      if (l && l.shape === 'burst') {
        /* Gerbe de particules : count, x, y, distance [min,max], pSize [min,max], colors, life [ms], spread (ms), gravity, delay, seed */
        const r = rng(l.seed || 1), n = Math.min(l.count || 40, 300), cols = l.colors || ['#8b5cf6', '#38bdf8', '#f472b6'];
        const x0 = l.x ?? W / 2, y0 = l.y ?? H / 2;
        for (let i = 0; i < n; i++) {
          const a = r() * Math.PI * 2, d = pick(l.distance || [200, 700], r);
          out.push({ shape: 'circle', size: pick(l.pSize || [6, 18], r), color: cols[i % cols.length], group: l.group,
            delay: (l.delay || 0) + r() * (l.spread || 0), duration: pick(l.life || [800, 1600], r), loop: false, easing: OUT,
            keyframes: [{ t: 0, x: x0, y: y0, scale: 1, opacity: 0 }, { t: 0.05, opacity: 1 },
              { t: 1, x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d + (l.gravity || 0), scale: 0.2, opacity: 0 }] });
        }
      } else if (l && l.shape === 'wordburst') {
        /* Mots projetés en étoile : words, x, y, distance [min,max], fontSize [min,max], colors, stagger, life, rotate, delay, seed */
        const r = rng(l.seed || 7), ws = l.words || [], n = ws.length || 1, cols = l.colors || ['#ffffff'], c = mctx();
        const x0 = l.x ?? W / 2, y0 = l.y ?? H / 2;
        ws.forEach((word, i) => {
          const px = pick(l.fontSize || [70, 120], r), a = (i / n) * Math.PI * 2 + r() * 0.6, d = pick(l.distance || [260, 480], r);
          c.font = '800 ' + px + 'px system-ui';
          const w = Math.ceil(c.measureText(word).width) + 24;
          const x1 = x0 + Math.cos(a) * d * 0.65, y1 = y0 + Math.sin(a) * d * 0.9, rot = (r() - 0.5) * (l.rotate ?? 40);
          out.push({ shape: 'text', text: word, width: w, height: Math.round(px * 1.3), fontSize: px, weight: 800, color: cols[i % cols.length],
            group: l.group, glow: l.glow, glowColor: l.glowColor,
            delay: (l.delay || 0) + i * (l.stagger || 80), duration: l.life || 3500, loop: false,
            keyframes: [{ t: 0, x: x0, y: y0, scale: 0, rotate: rot * 6, opacity: 0, easing: OUT },
              { t: 0.2, x: x1, y: y1, scale: 1, rotate: rot, opacity: 1, easing: 'linear' },
              { t: 0.85, x: x1 + (r() - 0.5) * 40, y: y1 + (r() - 0.5) * 40, scale: 1.06, rotate: rot },
              { t: 1, scale: 0.7, opacity: 0 }] });
        });
      } else if (l && l.shape === 'text' && l.split) {
        /* Texte lettre par lettre : split:true, stagger (ms entre lettres). Évite "x" dans les keyframes. */
        const px = l.fontSize || (l.height || l.size || 80) * 0.7, txt = [...String(l.text || '')], c = mctx();
        c.font = (l.weight || 700) + ' ' + px + 'px ' + (l.font || 'system-ui');
        const ws = txt.map(ch => c.measureText(ch).width), total = ws.reduce((a, b) => a + b, 0);
        const bx = l.x ?? W / 2;
        let cx = bx - total / 2;
        txt.forEach((ch, i) => {
          const x = cx + ws[i] / 2; cx += ws[i];
          if (ch === ' ') return;
          out.push(Object.assign({}, l, { split: false, text: ch, width: Math.ceil(ws[i]) + 2, x, delay: (l.delay || 0) + i * (l.stagger ?? 60),
            keyframes: (l.keyframes || []).map(k => (k.x == null ? k : Object.assign({}, k, { x: k.x - bx + x }))) }));
        });
      } else out.push(l);
    }
    return out;
  }

  function layerEl(l) {
    const s = l.shape || 'circle', c = l.color || '#8b5cf6';
    const w = l.width || l.size || (s === 'text' ? 300 : 80), h = l.height || l.size || 80;
    const e = document.createElement('div');
    Object.assign(e.style, { position: 'absolute', left: 0, top: 0, width: w + 'px', height: h + 'px', transformOrigin: l.origin || '50% 50%' });
    if (l.clip) e.style.clipPath = l.clip;
    let key = 'backgroundColor';
    if (s === 'circle') e.style.borderRadius = '50%';
    else if (s === 'rect') e.style.borderRadius = (l.radius || 0) + 'px';
    else if (s === 'triangle') e.style.clipPath = l.clip || 'polygon(50% 0,100% 100%,0 100%)';
    else if (s === 'ring') { key = 'borderColor'; Object.assign(e.style, { border: (l.stroke || 6) + 'px solid ' + c, borderRadius: '50%' }); }
    else if (s === 'image') {
      /* "src" : fichier du dépôt ou lien https. "blend":"multiply" retire un fond blanc.
         "clip" découpe une zone (clip-path), "origin" fixe le pivot, en % de l'image. */
      key = 'outlineColor';
      const src = String(l.src || '').replace(/"/g, '%22');
      Object.assign(e.style, { backgroundImage: 'url("' + src + '")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' });
      if (l.blend) e.style.mixBlendMode = l.blend;
      if (l.radius) e.style.borderRadius = l.radius + 'px';
      const probe = new Image();
      probe.onerror = () => err('Image introuvable : "' + l.src + '". Vérifie que le fichier est dans le dépôt, avec ce nom exact.');
      probe.src = l.src || '';
    }
    else if (s === 'text') {
      key = 'color';
      e.textContent = l.text || 'Aurore';
      Object.assign(e.style, { font: (l.weight || 700) + ' ' + (l.fontSize || h * 0.7) + 'px ' + (l.font || 'system-ui'), lineHeight: h + 'px', textAlign: 'center', whiteSpace: 'nowrap' });
    } else if (s === 'ball') {
      e.style.borderRadius = '50%';
      e.style.backgroundImage = 'radial-gradient(circle at 34% 30%,rgba(255,255,255,.55),transparent 55%),radial-gradient(circle at 70% 75%,rgba(0,0,0,.35),transparent 60%)';
      e.style.boxShadow = '0 0 ' + h * 0.25 + 'px rgba(139,92,246,.45)';
      [['top:4%;left:43%'], ['right:4%;top:43%'], ['bottom:4%;left:43%'], ['left:4%;top:43%']].forEach(p => {
        const d = document.createElement('i');
        d.style.cssText = 'position:absolute;width:14%;height:14%;border-radius:50%;background:#0d0b1f;box-shadow:inset 0 2px 3px rgba(0,0,0,.7);' + p[0];
        e.append(d);
      });
    }
    else err('Forme inconnue : "' + s + '". Formes : circle, rect, triangle, ring, ball, text, image (+ générateurs : burst, wordburst).');
    /* "gradient": ["#c1","#c2",...] + "angle" : dégradé sur circle, rect, triangle, text. */
    if (Array.isArray(l.gradient) && l.gradient.length > 1 && s !== 'ring' && s !== 'image' && s !== 'ball') {
      e.style.backgroundImage = 'linear-gradient(' + (l.angle ?? 135) + 'deg,' + l.gradient.join(',') + ')';
      if (s === 'text') Object.assign(e.style, { webkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', webkitTextFillColor: 'transparent' });
      key = null;
    }
    return { e, w, h, key, c };
  }

  /* Construit les keyframes complets (chaque image clé hérite de la précédente). */
  function mk(list, S, tf, key, ez, glow) {
    const ks = [...(list || [])].sort((a, b) => a.t - b.t);
    if (!ks.length || ks[0].t > 0) ks.unshift({ t: 0 });
    if (ks[ks.length - 1].t < 1) ks.push({ t: 1 });
    return ks.map(k => {
      S = Object.assign({}, S, k);
      const f = { offset: k.t, easing: ease(k.easing || ez), transform: tf(S), opacity: S.opacity,
        filter: 'blur(' + S.blur + 'px)' + (glow ? ' drop-shadow(0 0 ' + (S.glow || 0) + 'px ' + (S.glowColor || S.color || '#7cffd4') + ')' : '') };
      if (key) f[key] = S.color;
      if (S.clip) f.clipPath = S.clip;
      return f;
    });
  }
  const hasGlow = l => l.glow != null || (l.keyframes || []).some(k => k.glow != null);

  function clearAll() {
    anims.forEach(a => a.cancel());
    anims = []; clock = null;
    stage.replaceChildren();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    $('#play').textContent = '▶';
    seek.value = 0;
  }

  function build(o) {
    const W = o.width || 360, H = o.height || 360;
    looping = o.loop !== false;
    const loop = looping;
    dur = o.duration || 2000;
    anims.forEach(a => a.cancel());
    anims = [];
    stage.replaceChildren();
    Object.assign(stage.style, { width: W + 'px', height: H + 'px', background: o.background || '#0d0b1f' });
    const opt = l => ({ duration: l.duration || dur, delay: l.delay || 0, direction: l.direction || 'normal', fill: 'both', easing: 'linear',
      iterations: typeof l.loop === 'number' ? l.loop : (l.loop === false || !loop ? 1 : Infinity) });

    /* Groupes : plusieurs calques qui se déplacent ensemble (ex. toute la plante, ou une "caméra"). */
    const G = {};
    for (const [n, g] of Object.entries(o.groups || {})) {
      const ge = document.createElement('div');
      Object.assign(ge.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', transformOrigin: g.origin || '50% 50%' });
      stage.append(ge); G[n] = ge;
      const fr = mk(g.keyframes, { x: g.x || 0, y: g.y || 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, blur: 0 },
        S => 'translate(' + S.x + 'px,' + S.y + 'px) rotate(' + S.rotate + 'deg) scale(' + S.scale * S.scaleX + ',' + S.scale * S.scaleY + ')', null, g.easing);
      anims.push(ge.animate(fr, opt(g)));
    }

    for (const l of expand(o.layers, W, H)) {
      const { e, w, h, key, c } = layerEl(l);
      const fr = mk(l.keyframes, { x: l.x ?? W / 2, y: l.y ?? H / 2, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, blur: 0, color: c, clip: l.clip, glow: l.glow || 0, glowColor: l.glowColor },
        S => 'translate(' + (S.x - w / 2) + 'px,' + (S.y - h / 2) + 'px) rotate(' + S.rotate + 'deg) scale(' + S.scale * S.scaleX + ',' + S.scale * S.scaleY + ')', key, l.easing, hasGlow(l));
      (G[l.group] || stage).append(e);
      anims.push(e.animate(fr, opt(l)));
    }
    clock = new Animation(new KeyframeEffect(null, [], { duration: dur, iterations: loop ? Infinity : 1, fill: 'both' }));
    clock.play();
    anims.push(clock);
    anims.forEach(a => (a.playbackRate = rate));
    $('#play').textContent = '⏸';
    fit();
  }

  function fit() {
    const W = parseInt(stage.style.width) || 360, H = parseInt(stage.style.height) || 360;
    const k = Math.min(1, wrap.clientWidth / W);
    stage.style.transform = 'translateX(-50%) scale(' + k + ')';
    wrap.style.height = H * k + 'px';
  }

  function err(m) { const n = $('#err'); n.textContent = m || '✓ JSON valide'; n.className = m ? '' : 'ok'; }

  function apply() {
    if (!ed.value.trim()) { clearAll(); return err('Éditeur vide : rien à afficher'); }
    let o;
    try { o = JSON.parse(ed.value); } catch (e) { return err(e.message); }
    const m = validate(o);
    if (m) return err(m);
    err('');
    build(o);
    /* Le lien de partage ne contient le JSON que s'il est court. */
    try {
      if (ed.value.length < 6000) history.replaceState(null, '', '#' + btoa(unescape(encodeURIComponent(ed.value))));
      else history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {}
  }

  function load(txt) { ed.value = txt; apply(); }
  function fromObj(o) { return JSON.stringify(o, null, 1); }

  /* UI */
  const exSel = $('#ex');
  Object.keys(EX).forEach(k => exSel.add(new Option(k, k)));
  Object.entries(FILES).forEach(([k, p]) => exSel.add(new Option(k, 'file:' + p)));
  exSel.onchange = () => {
    const v = exSel.value;
    if (v.indexOf('file:') === 0) {
      err('Chargement…');
      fetch(v.slice(5)).then(r => { if (!r.ok) throw new Error('Fichier introuvable : ' + v.slice(5)); return r.text(); })
        .then(load).catch(e => err(e.message));
    } else load(fromObj(EX[v]));
  };
  ed.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 350); });
  $('#play').onclick = () => {
    if (!clock) return;
    if (clock.playState === 'finished') { anims.forEach(a => { a.currentTime = 0; a.play(); }); $('#play').textContent = '⏸'; return; }
    const run = clock.playState === 'running';
    anims.forEach(a => (run ? a.pause() : a.play()));
    $('#play').textContent = run ? '▶' : '⏸';
  };
  seek.addEventListener('input', () => { dragging = true; anims.forEach(a => { a.pause(); a.currentTime = seek.value * dur; }); $('#play').textContent = '▶'; });
  seek.addEventListener('change', () => (dragging = false));
  $('#speed').onchange = e => { rate = +e.target.value; anims.forEach(a => (a.playbackRate = rate)); };
  $('#fmt').onclick = () => { try { ed.value = fromObj(JSON.parse(ed.value)); } catch (e) {} };
  $('#copy').onclick = () => navigator.clipboard.writeText(ed.value).then(() => err('') || ($('#err').textContent = '✓ JSON copié'));
  $('#share').onclick = () => navigator.clipboard.writeText(location.href).then(() => ($('#err').textContent = '✓ Lien copié'));

  const clr = document.createElement('button');
  clr.textContent = 'Vider';
  clr.onclick = () => { ed.value = ''; apply(); ed.focus(); };
  $('#fmt').after(clr);

  window.addEventListener('resize', fit);
  (function tick() {
    if (clock && !dragging && clock.currentTime != null) seek.value = looping ? (clock.currentTime % dur) / dur : Math.min(clock.currentTime / dur, 1);
    requestAnimationFrame(tick);
  })();

  let start = fromObj(EX['Boule à 4 trous']);
  if (location.hash.length > 1) { try { start = decodeURIComponent(escape(atob(location.hash.slice(1)))); } catch (e) {} }
  load(start);
})();
