/* Aurore Motion — moteur JSON → animation (Web Animations API, sans dépendance) */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const stage = $('#stage'), wrap = $('#wrap'), ed = $('#ed'), seek = $('#seek');
  const EASE = { spring: 'cubic-bezier(.34,1.56,.64,1)', bounce: 'cubic-bezier(.68,-.55,.27,1.55)' };
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
          { t: 1, scale: 1, opacity: 1 }] }] }
  };

  let anims = [], clock = null, dur = 2000, rate = 1, dragging = false, timer = 0;

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
      Object.assign(e.style, { font: '700 ' + (l.fontSize || h * 0.7) + 'px system-ui', lineHeight: h + 'px', textAlign: 'center', whiteSpace: 'nowrap' });
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
    else err('Forme inconnue : "' + s + '". Formes : circle, rect, triangle, ring, ball, text, image.');
    return { e, w, h, key, c };
  }

  /* Construit les keyframes complets (chaque image clé hérite de la précédente). */
  function mk(list, S, tf, key, ez) {
    const ks = [...(list || [])].sort((a, b) => a.t - b.t);
    if (!ks.length || ks[0].t > 0) ks.unshift({ t: 0 });
    if (ks[ks.length - 1].t < 1) ks.push({ t: 1 });
    return ks.map(k => {
      S = Object.assign({}, S, k);
      const f = { offset: k.t, easing: ease(k.easing || ez), transform: tf(S), opacity: S.opacity, filter: 'blur(' + S.blur + 'px)' };
      if (key) f[key] = S.color;
      if (S.clip) f.clipPath = S.clip;
      return f;
    });
  }

  function clearAll() {
    anims.forEach(a => a.cancel());
    anims = []; clock = null;
    stage.replaceChildren();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    $('#play').textContent = '▶';
    seek.value = 0;
  }

  function build(o) {
    const W = o.width || 360, H = o.height || 360, loop = o.loop !== false;
    dur = o.duration || 2000;
    anims.forEach(a => a.cancel());
    anims = [];
    stage.replaceChildren();
    Object.assign(stage.style, { width: W + 'px', height: H + 'px', background: o.background || '#0d0b1f' });
    const opt = l => ({ duration: l.duration || dur, delay: l.delay || 0, direction: l.direction || 'normal', fill: 'both', easing: 'linear',
      iterations: typeof l.loop === 'number' ? l.loop : (l.loop === false || !loop ? 1 : Infinity) });

    /* Groupes : plusieurs calques qui se déplacent ensemble (ex. toute la plante). */
    const G = {};
    for (const [n, g] of Object.entries(o.groups || {})) {
      const ge = document.createElement('div');
      Object.assign(ge.style, { position: 'absolute', left: 0, top: 0, width: W + 'px', height: H + 'px', transformOrigin: g.origin || '50% 50%' });
      stage.append(ge); G[n] = ge;
      const fr = mk(g.keyframes, { x: g.x || 0, y: g.y || 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, blur: 0 },
        S => 'translate(' + S.x + 'px,' + S.y + 'px) rotate(' + S.rotate + 'deg) scale(' + S.scale * S.scaleX + ',' + S.scale * S.scaleY + ')', null, g.easing);
      anims.push(ge.animate(fr, opt(g)));
    }

    for (const l of o.layers) {
      const { e, w, h, key, c } = layerEl(l);
      const fr = mk(l.keyframes, { x: l.x ?? W / 2, y: l.y ?? H / 2, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1, blur: 0, color: c, clip: l.clip },
        S => 'translate(' + (S.x - w / 2) + 'px,' + (S.y - h / 2) + 'px) rotate(' + S.rotate + 'deg) scale(' + S.scale * S.scaleX + ',' + S.scale * S.scaleY + ')', key, l.easing);
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
    try { history.replaceState(null, '', '#' + btoa(unescape(encodeURIComponent(ed.value)))); } catch (e) {}
  }

  function load(txt) { ed.value = txt; apply(); }
  function fromObj(o) { return JSON.stringify(o, null, 1); }

  /* UI */
  const exSel = $('#ex');
  Object.keys(EX).forEach(k => exSel.add(new Option(k, k)));
  exSel.onchange = () => load(fromObj(EX[exSel.value]));
  ed.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 350); });
  $('#play').onclick = () => {
    if (!clock) return;
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
    if (clock && !dragging && clock.currentTime != null) seek.value = (clock.currentTime % dur) / dur;
    requestAnimationFrame(tick);
  })();

  let start = fromObj(EX['Boule à 4 trous']);
  if (location.hash.length > 1) { try { start = decodeURIComponent(escape(atob(location.hash.slice(1)))); } catch (e) {} }
  load(start);
})();
