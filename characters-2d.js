/* Aurore Animation — 20 personnages 2D (SVG) style illustration : peau foncée, locks/afro/boucles, lunettes, t-shirts oversize, lèvres en cœur. */
(function (g) {
  const K = '#1a1210', GOLD = '#e0a82e';
  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hash = id => { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100000; return h + 1; };
  const strand = (x1, y1, x2, y2, w, col, cuff) => {
    let o = `<path d="M${x1} ${y1}Q${(x1 + x2) / 2 + (x2 - x1) * .2} ${(y1 + y2) / 2} ${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
    if (cuff) { const cx = x1 + (x2 - x1) * .62, cy = y1 + (y2 - y1) * .62; o += `<path d="M${cx - w / 2} ${cy}h${w}" stroke="${GOLD}" stroke-width="5" fill="none"/>`; }
    return o;
  };

  function hairBack(c, r) {
    const h = c.hair, k = c.hs; let o = '';
    if (k == 'afro' || k == 'curls') {
      const rx = k == 'afro' ? 66 : 72, ry = k == 'afro' ? 66 : 88, cy = k == 'afro' ? 92 : 122;
      o += `<ellipse cx="100" cy="${cy}" rx="${rx}" ry="${ry}" fill="${h}"/>`;
      for (let i = 0; i < 34; i++) {
        const a = i / 34 * 6.283, x = 100 + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        o += `<circle cx="${x | 0}" cy="${y | 0}" r="${(7 + r() * 3) | 0}" fill="${h}"/>`;
      }
    }
    if (k == 'puffs') o += `<circle cx="56" cy="62" r="24" fill="${h}"/><circle cx="144" cy="62" r="24" fill="${h}"/>`;
    if (k == 'locs' || k == 'braids') {
      const n = k == 'locs' ? 12 : 18, w = k == 'locs' ? 9 : 5;
      if (k == 'locs') o += `<ellipse cx="100" cy="38" rx="28" ry="22" fill="${h}"/>`;
      for (let i = 0; i < n; i++) {
        const x = 58 + i * (84 / (n - 1));
        o += strand(x, 84, x + (x - 100) * .4, 150 + r() * 45, w, h, (k == 'locs' && i % 3 == 1) || (k == 'braids' && i % 4 == 0));
      }
    }
    return o;
  }

  function hairFront(c, r) {
    const h = c.hair, k = c.hs; let o = '';
    if (k == 'afro' || k == 'curls') {
      o += `<ellipse cx="100" cy="76" rx="44" ry="24" fill="${h}"/>`;
      for (let x = 62; x <= 138; x += 8) o += strand(x, 72, x, 92 + r() * 14, 9, h);
    }
    if (k == 'curls') o += `<ellipse cx="46" cy="176" rx="20" ry="46" fill="${h}"/><ellipse cx="154" cy="176" rx="20" ry="46" fill="${h}"/>`;
    if (k == 'locs' || k == 'braids') o += `<ellipse cx="100" cy="76" rx="${k == 'locs' ? 46 : 42}" ry="${k == 'locs' ? 32 : 26}" fill="${h}"/>`;
    if (k == 'buzz') o += `<path d="M62 100Q60 64 100 62Q140 64 138 100Q130 78 100 76Q70 78 62 100Z" fill="${h}"/>`;
    if (k == 'twists' || k == 'puffs') {
      o += `<ellipse cx="100" cy="78" rx="42" ry="24" fill="${h}"/>`;
      for (let i = 0; i < 9; i++) o += `<circle cx="${64 + i * 9}" cy="${(68 - Math.sin(i / 8 * 3.14) * 10) | 0}" r="9" fill="${h}"/>`;
    }
    return o;
  }

  function body(c) {
    const t = c.top, s = c.skin;
    let o = `<rect x="88" y="150" width="24" height="20" fill="${s}"/>`;
    o += `<path d="M26 262L34 196Q56 172 88 164L112 164Q144 172 166 196L174 262Z" fill="${t}" stroke="${K}" stroke-width="2.5"/>`;
    if (c.st == 'jacket') o += `<path d="M86 164Q100 186 114 164L100 196Z" fill="#eee"/><path d="M100 196V262M86 164L100 196L114 164" fill="none" stroke="${K}" stroke-width="2.5"/>`;
    else o += `<path d="M86 164Q100 186 114 164Z" fill="${s}" stroke="${K}" stroke-width="2.5"/>`;
    if (c.st == 'hoodie') o += `<path d="M78 166Q100 198 122 166" fill="none" stroke="${K}" stroke-width="3"/><path d="M92 188v26M108 188v26" stroke="#fff" stroke-opacity=".7" stroke-width="3"/><path d="M60 242Q100 226 140 242" fill="none" stroke="${K}" stroke-width="2"/>`;
    if (c.fl.includes('n')) o += `<path d="M88 168Q100 214 112 168" fill="none" stroke="${GOLD}" stroke-width="2"/><ellipse cx="100" cy="208" rx="5" ry="7" fill="#f4efe6" stroke="${K}"/>`;
    return o;
  }

  function face(c, r) {
    const s = c.skin, open = c.fl.includes('e');
    let o = `<ellipse cx="62" cy="116" rx="6" ry="9" fill="${s}" stroke="${K}" stroke-width="2"/><ellipse cx="138" cy="116" rx="6" ry="9" fill="${s}" stroke="${K}" stroke-width="2"/>`;
    o += `<ellipse cx="100" cy="112" rx="38" ry="44" fill="${s}" stroke="${K}" stroke-width="2.5"/>`;
    o += `<ellipse cx="76" cy="128" rx="8" ry="5" fill="#d65a4a" opacity=".22"/><ellipse cx="124" cy="128" rx="8" ry="5" fill="#d65a4a" opacity=".22"/>`;
    if (c.fl.includes('f')) for (let i = 0; i < 16; i++) o += `<circle cx="${(70 + r() * 60) | 0}" cy="${(118 + r() * 14) | 0}" r="1.1" fill="#5a2f1f" opacity=".6"/>`;
    for (const x of [84, 116]) {
      o += open ? `<ellipse cx="${x}" cy="110" rx="4.5" ry="6" fill="${K}"/><circle cx="${x + 1.5}" cy="108" r="1.6" fill="#fff"/><path d="M${x - 8} 98q8-5 16 0" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`
        : `<path d="M${x - 8} 110q8 6 16 0" stroke="${K}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    o += `<path d="M98 124q2 3 4 0" stroke="${K}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    o += `<path d="M94 136q3-4 6 0q3-4 6 0q-6 7-12 0z" fill="#7a3a34" stroke="${K}" stroke-width="1.5" stroke-linejoin="round"/>`;
    if (c.gl == 'round') o += [84, 116].map(x => `<circle cx="${x}" cy="110" r="15" fill="#fff" fill-opacity=".18" stroke="${K}" stroke-width="3"/>`).join('') + `<path d="M99 109h2M69 108l-7-2M131 108l7-2" stroke="${K}" stroke-width="3"/>`;
    if (c.gl == 'square') o += [84, 116].map(x => `<rect x="${x - 15}" y="97" width="30" height="24" rx="6" fill="#fff" fill-opacity=".18" stroke="${K}" stroke-width="3"/>`).join('') + `<path d="M99 106h2M69 106l-7-2M131 106l7-2" stroke="${K}" stroke-width="3"/>`;
    return o;
  }

  function phones(c) {
    if (!c.fl.includes('h')) return '';
    return `<path d="M58 108Q58 34 100 34Q142 34 142 108" fill="none" stroke="${c.top}" stroke-width="7"/><rect x="50" y="98" width="14" height="30" rx="6" fill="${c.top}" stroke="${K}" stroke-width="2"/><rect x="136" y="98" width="14" height="30" rx="6" fill="${c.top}" stroke="${K}" stroke-width="2"/>`;
  }

  g.drawCharacter = function (c, size) {
    const r = rnd(hash(c.id));
    const hb = hairBack(c, r), b = body(c), f = face(c, r), hf = hairFront(c, r);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 262" width="${size || 200}" class="ch"><g class="bob"><g class="sway">${hb}</g>${b}${f}${hf}${phones(c)}</g></svg>`;
  };

  // [id, nom, peau, cheveux, coiffure, lunettes, haut, tenue, options: f=taches e=yeux ouverts h=casque n=collier]
  const D = [
    ['aurore', 'Aurore', '#a86a44', '#4a2c1d', 'curls', '', '#9cc4dc', 'hoodie', 'feh'],
    ['aicha', 'Aïcha', '#8b593e', '#1f1412', 'afro', 'round', '#e9b84e', 'hoodie', 'fe'],
    ['sana', 'Sana', '#f0c9a8', '#5c3024', 'curls', 'square', '#72b9c5', 'hoodie', 'fe'],
    ['mei', 'Mei', '#f5d6bd', '#3a2318', 'puffs', 'round', '#d8d9ea', 'hoodie', 'e'],
    ['amara', 'Amara', '#573725', '#150e0d', 'afro', '', '#b65b91', 'tee', 'e'],
    ['zara', 'Zara', '#79472f', '#1b1212', 'braids', '', '#e76c63', 'hoodie', 'f'],
    ['ines', 'Inès', '#c48963', '#191416', 'curls', 'square', '#d5c8ed', 'jacket', ''],
    ['chloe', 'Chloé', '#f0c9a8', '#ad7046', 'curls', '', '#f0e4ce', 'tee', 'fe'],
    ['lina', 'Lina', '#f1cbaa', '#5d2e23', 'twists', 'round', '#5366a8', 'jacket', 'e'],
    ['fatou', 'Fatou', '#a9704c', '#251714', 'afro', 'square', '#e5eee1', 'tee', ''],
    ['malik', 'Malik', '#6d422f', '#171417', 'locs', 'round', '#345b88', 'jacket', 'n'],
    ['koffi', 'Koffi', '#9d6749', '#211716', 'twists', '', '#dc764f', 'hoodie', 'h'],
    ['idrissa', 'Idrissa', '#70472e', '#211816', 'buzz', '', '#58a57c', 'tee', ''],
    ['noah', 'Noah', '#edc5a5', '#865735', 'twists', '', '#9cc4dc', 'hoodie', 'fh'],
    ['tariq', 'Tariq', '#c08a62', '#5a3424', 'locs', 'square', '#c87543', 'hoodie', 'fn'],
    ['samuel', 'Samuel', '#b67b56', '#34251d', 'buzz', 'round', '#e9dfcb', 'tee', 'n'],
    ['elias', 'Elias', '#e3b38d', '#392c27', 'twists', 'square', '#495b6b', 'jacket', 'f'],
    ['gabriel', 'Gabriel', '#f1d0b0', '#bc8558', 'curls', '', '#72a9bf', 'hoodie', 'fe'],
    ['kwame', 'Kwame', '#4b2d24', '#171112', 'locs', '', '#c64d49', 'tee', 'ne'],
    ['yuki', 'Yuki', '#f2d8c4', '#8a8790', 'buzz', 'round', '#5c759a', 'jacket', 'e']
  ];

  g.CHARACTERS_2D = D.map(d => ({ id: d[0], name: d[1], skin: d[2], hair: d[3], hs: d[4], gl: d[5], top: d[6], st: d[7], fl: d[8] }));

  // Corps complet pour l'atelier 3D : visage et cheveux originaux conservés, vêtement prolongé
  // en illustration vectorielle dans le même style de contour que le catalogue.
  function armsFull(c) {
    function oneSide() {
      let o = '<path d="M39 190 Q30 197 28 213 L21 248 Q19 258 24 266 L27 288 L27 329 Q27 338 32 338 Q37 337 36 329 L36 291 L40 267 L46 236 L52 211 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.85" stroke-linejoin="round"/>';
      if (c.st === 'tee') {
        o += '<path d="M39 190 Q30 197 28 213 L23 234 L35 239 L43 217 L52 211 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="1.85" stroke-linejoin="round"/>';
        o += '<path d="M23 234 Q29 238 35 239" fill="none" stroke="' + K + '" stroke-width="1.2"/>';
      } else {
        o += '<path d="M39 190 Q30 197 28 213 L22 247 L24 258 L34 263 L41 230 L52 211 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="1.85" stroke-linejoin="round"/>';
        o += '<path d="M23 252 Q28 258 34 259" fill="none" stroke="' + K + '" stroke-width="1.15"/>';
        if (c.st === 'jacket') o += '<path d="M29 216 L25 236" stroke="#ffffff" stroke-opacity=".3" stroke-width="1"/>';
      }
      o += '<path d="M27 286 L36 285" fill="none" stroke="' + K + '" stroke-opacity=".34" stroke-width="1"/>';
      return o;
    }

    function hand() {
      let h = '';
      // Four fingers are drawn separately first, so their rounded tips remain distinct.
      h += '<path d="M21.8 346 C19.8 346 19.2 348 19.6 351 L20.4 358 C20.7 361 23.3 361.3 24 358.4 L25 350 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.55" stroke-linejoin="round"/>';
      h += '<path d="M25.3 344 C23.4 343.5 22.8 345.5 23.2 349 L24.5 360 C24.8 363 27.6 363 28.1 360 L28.8 348 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.55" stroke-linejoin="round"/>';
      h += '<path d="M29 343 C27.2 342.5 26.5 344 27 348 L29 362 C29.4 365 32.2 365 32.7 362 L32.8 348 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.55" stroke-linejoin="round"/>';
      h += '<path d="M32.2 345 C30.6 345 30.4 347 31.1 350 L34 359 C35 362 37.4 361 37 358 L35.7 348 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.55" stroke-linejoin="round"/>';
      // Thumb angles outward from the palm instead of looking like a fifth straight finger.
      h += '<path d="M26.5 340 C24 338 21 340 20.5 343 C20 346 23 350 26.5 351 L29.7 347 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.55" stroke-linejoin="round"/>';
      // Palm connects cleanly to the narrow wrist.
      h += '<path d="M26.7 332.5 Q30.5 331 33 334.5 L35.3 342.5 Q36.5 347.5 33 351.2 Q29.5 354 25.8 350.8 L22.5 347.2 Q21 345.3 23.2 342.8 L25.4 340.5 L25.1 335.5 Q25 333 26.7 332.5 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.65" stroke-linejoin="round"/>';
      h += '<path d="M25.2 343.2 Q28.6 346.2 32.3 342.7 M27 348.5 Q29.2 350 31.5 348.3" fill="none" stroke="' + K + '" stroke-opacity=".43" stroke-width=".9"/>';
      // Small nail arcs add definition without turning the hand into a claw.
      h += '<path d="M20.9 356.3 q1.1 .8 2.2 .1 M25 358.5 q1.1 .8 2 .1 M29.5 360 q1.1 .8 2 .1 M34.5 357.7 q1 .7 1.9 .1" fill="none" stroke="#f5e6dc" stroke-opacity=".7" stroke-width=".85"/>';
      return h;
    }
    return '<g stroke-linecap="round" stroke-linejoin="round">' +
      oneSide() + hand() +
      '<g transform="translate(200 0) scale(-1 1)">' + oneSide() + hand() + '</g></g>';
  }

  function lowerBodyFull(c) {
    const palette = ['#26374c', '#34313a', '#35443e', '#43363a', '#39344a', '#3b3a35', '#283f4a'];
    const pants = palette[hash(c.id) % palette.length];
    const seam = '#b9b4ab';
    const shoe = '#252a34';
    const accent = c.top || '#c5cbd4';
    const light = '#f0e8dc';
    let o = '<g transform="translate(22 0) scale(.78 1)" stroke-linejoin="round">';
    // Tailored, tapered trouser legs with a small natural break at the inner seam.
    o += '<path d="M43 317 Q68 329 98 325 L95 369 Q93 395 91 420 L87 498 Q72 505 57 498 L54 417 Q52 378 43 317 Z" fill="' + pants + '" stroke="' + K + '" stroke-width="1.85"/>';
    o += '<path d="M102 325 Q132 329 157 317 L146 417 L143 498 Q128 505 113 498 L109 420 Q107 395 105 369 Z" fill="' + pants + '" stroke="' + K + '" stroke-width="1.85"/>';

    // Waistband, belt loops and a subtle fly seam.
    o += '<path d="M45 319 Q72 331 98 327 M102 327 Q128 331 155 319" fill="none" stroke="' + seam + '" stroke-opacity=".75" stroke-width="1.35"/>';
    o += '<path d="M51 324 l-1 8 M62 327 l-1 8 M78 329 l-1 7 M121 329 l1 7 M138 327 l1 8 M149 324 l1 8" fill="none" stroke="' + K + '" stroke-opacity=".5" stroke-width="1.15"/>';
    o += '<path d="M99 330 Q96 340 100 350" fill="none" stroke="' + K + '" stroke-opacity=".55" stroke-width="1.2"/>';
    o += '<circle cx="101" cy="333" r="1.25" fill="' + light + '"/>';

    // Front pockets, visible but fine-lined.
    o += '<path d="M49 330 Q56 339 72 341 L70 354 M92 332 Q85 340 75 342" fill="none" stroke="' + seam + '" stroke-opacity=".78" stroke-width="1.3"/>';
    o += '<path d="M151 330 Q144 339 128 341 L130 354 M108 332 Q115 340 125 342" fill="none" stroke="' + seam + '" stroke-opacity=".78" stroke-width="1.3"/>';

    // Slim side seams, shaped knee folds and restrained highlights show fabric volume.
    o += '<path d="M49 338 Q55 390 59 432 L61 488 M151 338 Q145 390 141 432 L139 488" fill="none" stroke="' + seam + '" stroke-opacity=".32" stroke-width="1.15"/>';
    o += '<path d="M56 379 Q69 385 91 379 M109 379 Q131 385 144 379" fill="none" stroke="' + K + '" stroke-opacity=".55" stroke-width="1.1"/>';
    o += '<path d="M56 386 Q69 391 82 389 M118 389 Q131 391 144 386" fill="none" stroke="' + seam + '" stroke-opacity=".42" stroke-width="1.1"/>';
    o += '<path d="M64 403 L71 424 M136 403 L129 424 M82 437 L77 458 M118 437 L123 458" fill="none" stroke="' + seam + '" stroke-opacity=".24" stroke-width="1.15"/>';
    o += '<path d="M58 483 Q72 489 88 483 M112 483 Q128 489 142 483" fill="none" stroke="' + seam + '" stroke-opacity=".72" stroke-width="1.25"/>';

    // Character-specific trouser detail: clean denim stitching, cargo pocket, or tailored crease.
    const variant = hash(c.id) % 3;
    if (variant === 0) {
      o += '<path d="M56 351 L71 354 L70 371 L55 368 Z M144 351 L129 354 L130 371 L145 368 Z" fill="' + pants + '" stroke="' + seam + '" stroke-opacity=".8" stroke-width="1.25"/>';
      o += '<path d="M58 356 L69 358 M131 358 L142 356" fill="none" stroke="' + seam + '" stroke-opacity=".65" stroke-width="1"/>';
    } else if (variant === 1) {
      o += '<path d="M58 359 Q66 363 74 360 M126 360 Q134 363 142 359" fill="none" stroke="' + seam + '" stroke-opacity=".7" stroke-width="1.2"/>';
      o += '<path d="M70 365 L74 372 M130 365 L126 372" fill="none" stroke="' + K + '" stroke-opacity=".4" stroke-width="1"/>';
    } else {
      o += '<path d="M74 350 L80 376 M126 350 L120 376" fill="none" stroke="' + seam + '" stroke-opacity=".34" stroke-width="1.2"/>';
    }

    // Socks and cuffs sit behind the shoes, not on top of the trouser silhouette.
    o += '<path d="M61 495 Q72 499 84 495 L84 510 L62 510 Z" fill="' + light + '" stroke="' + K + '" stroke-width="1.2"/>';
    o += '<path d="M116 495 Q128 499 139 495 L138 510 L116 510 Z" fill="' + light + '" stroke="' + K + '" stroke-width="1.2"/>';

    function sneaker() {
      let s = '';
      // Build the sole and rounded upper, then add a coloured panel, tongue and visible laces.
      s += '<path d="M46 516 Q63 526 89 516 L92 522 Q91 528 68 531 Q50 530 45 525 Q42 521 46 516 Z" fill="' + light + '" stroke="' + K + '" stroke-width="1.65"/>';
      s += '<path d="M51 507 Q56 503 62 506 L68 510 L79 505 Q86 506 89 513 L89 519 Q68 528 47 521 L46 516 Z" fill="' + shoe + '" stroke="' + K + '" stroke-width="1.75"/>';
      s += '<path d="M49 514 Q55 512 61 516 L57 522 L48 519 Z" fill="' + accent + '" stroke="' + K + '" stroke-width="1.05"/>';
      s += '<path d="M62 505 Q69 507 76 505 L82 515 L61 520 L57 512 Z" fill="' + accent + '" stroke="' + K + '" stroke-width="1.05"/>';
      s += '<path d="M64 509 L75 508 M63 512 L77 511 M62 515 L79 514" fill="none" stroke="' + light + '" stroke-width="1.45"/>';
      s += '<path d="M80 508 L86 512 L86 516" fill="none" stroke="' + accent + '" stroke-width="1.35"/>';
      s += '<path d="M49 523 Q68 529 90 521" fill="none" stroke="' + K + '" stroke-opacity=".55" stroke-width="1.05"/>';
      return s;
    }
    o += sneaker();
    o += '<g transform="translate(200 0) scale(-1 1)">' + sneaker() + '</g>';
    o += '</g>';
    return o;
  }

  function upperBodyFull(c) {
    const t = c.top, s = c.skin;
    let o = '<rect x="89" y="150" width="22" height="20" fill="' + s + '"/>';
    o += '<path d="M31 309 L31 263 L40 198 Q58 176 88 164 L112 164 Q142 176 160 198 L169 263 L169 309 Q100 327 31 309 Z" fill="' + t + '" stroke="' + K + '" stroke-width="2" stroke-linejoin="round"/>';
    if (c.st === 'jacket') {
      o += '<path d="M87 164 Q100 184 113 164 L101 197 Z" fill="#eee8df"/>';
      o += '<path d="M101 197 V316 M87 164 L101 197 L113 164" fill="none" stroke="' + K + '" stroke-width="1.8"/>';
      o += '<path d="M79 223 L94 238 L91 263 M122 223 L107 238 L110 263" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="1.35"/>';
      o += '<path d="M72 265 L91 270 L89 286 L70 282 Z M129 265 L110 270 L112 286 L131 282 Z" fill="none" stroke="' + K + '" stroke-opacity=".72" stroke-width="1.2"/>';
      o += '<circle cx="105" cy="238" r="1.7" fill="#f1e8d8"/><circle cx="105" cy="257" r="1.7" fill="#f1e8d8"/><circle cx="105" cy="276" r="1.7" fill="#f1e8d8"/>';
    } else {
      o += '<path d="M87 164 Q100 184 113 164 Z" fill="' + s + '" stroke="' + K + '" stroke-width="1.8"/>';
    }
    if (c.st === 'hoodie') {
      o += '<path d="M79 166 Q100 194 121 166" fill="none" stroke="' + K + '" stroke-width="2.1"/>';
      o += '<path d="M93 190 V225 M107 190 V225" stroke="#fff" stroke-opacity=".72" stroke-width="2"/>';
      o += '<path d="M61 246 Q100 231 139 246 L135 264 Q100 276 65 264 Z" fill="' + t + '" stroke="' + K + '" stroke-width="1.6"/>';
      o += '<path d="M70 249 Q100 257 130 249 M72 263 Q100 271 128 263" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.1"/>';
      o += '<path d="M42 302 Q100 318 158 302" fill="none" stroke="#ffffff" stroke-opacity=".24" stroke-width="1.1"/>';
    }
    if (c.st === 'jacket') {
      o += '<path d="M101 205 V316" fill="none" stroke="#f1e8d8" stroke-opacity=".6" stroke-width="1.2"/>';
      o += '<path d="M44 292 Q56 300 68 299 M132 299 Q144 300 156 292" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="1.1"/>';
    }
    if (c.fl.includes('n')) {
      o += '<path d="M89 168 Q100 211 111 168" fill="none" stroke="' + GOLD + '" stroke-width="1.7"/>';
      o += '<ellipse cx="100" cy="207" rx="4.5" ry="6.5" fill="#f4efe6" stroke="' + K + '" stroke-width="1.3"/>';
    }
    o += '<path d="M42 306 Q100 322 158 306" fill="none" stroke="' + K + '" stroke-opacity=".45" stroke-width="1.1"/>';
    return o;
  }

  g.drawCharacterFull = function (c, size) {
    const r = rnd(hash(c.id));
    const hb = hairBack(c, r), f = face(c, r), hf = hairFront(c, r);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 560" width="' + (size || 200) + '" class="ch">' +
      '<g class="bob"><g class="sway">' + hb + '</g>' + lowerBodyFull(c) + armsFull(c) +
      upperBodyFull(c) + f + hf + phones(c) + '</g></svg>';
    // Raffiner uniquement le trait de la version plein-corps; les SVG du catalogue 2D restent intacts.
    return svg.replace(/stroke-width="([\d.]+)"/g, function (_, width) {
      return 'stroke-width="' + (Math.round(Number(width) * 0.74 * 100) / 100) + '"';
    });
  };
})(window);
