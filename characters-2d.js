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
      let o = '<path d="M39 190 Q30 197 28 213 L21 248 Q19 258 24 266 L27 288 L27 329 Q27 338 32 338 Q37 337 36 329 L36 291 L40 267 L46 236 L52 211 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.75" stroke-linejoin="round"/>';
      if (c.st === 'tee') {
        o += '<path d="M39 190 Q30 197 28 213 L23 234 L35 239 L43 217 L52 211 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="1.75" stroke-linejoin="round"/>';
        o += '<path d="M23 234 Q29 238 35 239" fill="none" stroke="' + K + '" stroke-width="1.1"/>';
      } else {
        o += '<path d="M39 190 Q30 197 28 213 L22 247 L24 258 L34 263 L41 230 L52 211 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="1.75" stroke-linejoin="round"/>';
        o += '<path d="M23 252 Q28 258 34 259" fill="none" stroke="' + K + '" stroke-width="1.05"/>';
        if (c.st === 'jacket') o += '<path d="M29 216 L25 236" stroke="#ffffff" stroke-opacity=".28" stroke-width=".95"/>';
      }
      o += '<path d="M27 286 L36 285" fill="none" stroke="' + K + '" stroke-opacity=".34" stroke-width=".95"/>';
      return o;
    }

    function hand() {
      // Une silhouette continue : poignet étroit, paume trapézoïdale et quatre doigts
      // à longueurs distinctes. Le pouce part du côté de la paume, sans pointe anguleuse.
      let h = '<path d="M27.4 332.4 C29.6 331.6 32 333 32.2 335.7 L32.6 342.1 C34.8 341.4 36.7 342.7 36.4 345.1 L35.7 351.6 C35.4 354 33.3 354.1 32.9 351.8 L32.8 348.7 L31.8 358.9 C31.5 361.4 29.2 361.5 29.1 358.9 L29.6 349.8 L28.2 360 C27.9 362.3 25.7 362.4 25.8 359.8 L26.8 349.9 L25.1 356.9 C24.6 359.1 22.6 358.9 22.9 356.5 L24.2 347.5 C22.2 348.5 20.4 347.1 20.8 345.1 C21.2 343.4 23 342.7 24.9 344 L24.7 335.7 C24.6 333.8 25.5 332.8 27.4 332.4 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>';
      // Quelques plis articulaires, sans multiplier les contours ni dessiner des griffes.
      h += '<path d="M32.8 345.8 L34.9 345.9 M29.2 347.1 L31.4 347.4 M26.1 347.2 L28 347.5 M23.9 347 L25.2 347.5" fill="none" stroke="' + K + '" stroke-opacity=".5" stroke-width=".85"/>';
      h += '<path d="M25.7 352.7 Q26.6 353.4 27.3 352.8 M29.1 352.2 Q30 352.9 30.7 352.2 M32.9 347.6 Q33.8 348.1 34.3 347.5" fill="none" stroke="#f6e7dc" stroke-opacity=".72" stroke-width=".8"/>';
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
    // Coupe fuselée : la jambe reste étroite du bassin à la cheville, avec de l'aisance
    // seulement aux articulations. La largeur du haut n'est pas modifiée ici.
    o += '<path d="M51 317 Q69 328 96 325 L92 368 Q89 394 86 420 L82 497 Q71 502 59 497 L57 419 Q54 376 51 317 Z" fill="' + pants + '" stroke="' + K + '" stroke-width="1.75"/>';
    o += '<path d="M104 325 Q131 328 149 317 L143 419 L141 497 Q129 502 118 497 L114 420 Q111 394 108 368 Z" fill="' + pants + '" stroke="' + K + '" stroke-width="1.75"/>';

    // Taille et braguette discrètes sous le haut.
    o += '<path d="M52 320 Q72 330 96 328 M104 328 Q128 330 148 320" fill="none" stroke="' + seam + '" stroke-opacity=".72" stroke-width="1.2"/>';
    o += '<path d="M57 324 l-1 7 M69 327 l-.5 6 M82 328 l-.5 6 M118 328 l.5 6 M131 327 l.5 6 M143 324 l1 7" fill="none" stroke="' + K + '" stroke-opacity=".5" stroke-width="1"/>';
    o += '<path d="M100 330 Q97 340 100 350" fill="none" stroke="' + K + '" stroke-opacity=".55" stroke-width="1.1"/>';
    o += '<circle cx="101" cy="333" r="1.15" fill="' + light + '"/>';

    // Poches fines et coutures latérales.
    o += '<path d="M55 331 Q61 340 76 342 L73 354 M94 332 Q86 340 76 342" fill="none" stroke="' + seam + '" stroke-opacity=".75" stroke-width="1.15"/>';
    o += '<path d="M145 331 Q139 340 124 342 L127 354 M106 332 Q114 340 124 342" fill="none" stroke="' + seam + '" stroke-opacity=".75" stroke-width="1.15"/>';
    o += '<path d="M57 343 Q61 389 62 432 L64 486 M143 343 Q139 389 138 432 L136 486" fill="none" stroke="' + seam + '" stroke-opacity=".28" stroke-width="1.05"/>';

    // Plis courts aux genoux et tombé propre au-dessus des chaussures.
    o += '<path d="M58 378 Q70 384 90 379 M110 379 Q130 384 142 378" fill="none" stroke="' + K + '" stroke-opacity=".52" stroke-width="1.05"/>';
    o += '<path d="M60 385 Q70 390 81 388 M119 388 Q130 390 140 385" fill="none" stroke="' + seam + '" stroke-opacity=".38" stroke-width="1"/>';
    o += '<path d="M70 402 L75 418 M130 402 L125 418 M78 439 L74 456 M122 439 L126 456" fill="none" stroke="' + seam + '" stroke-opacity=".22" stroke-width="1.05"/>';
    o += '<path d="M60 483 Q71 488 85 483 M115 483 Q129 488 140 483" fill="none" stroke="' + seam + '" stroke-opacity=".65" stroke-width="1.15"/>';

    // Trois finitions de pantalon tournent entre les personnages : cargo fin, surpiqûre,
    // ou pli central de pantalon habillé.
    const variant = hash(c.id) % 3;
    if (variant === 0) {
      o += '<path d="M59 350 L72 353 L71 369 L58 366 Z M141 350 L128 353 L129 369 L142 366 Z" fill="' + pants + '" stroke="' + seam + '" stroke-opacity=".7" stroke-width="1.1"/>';
      o += '<path d="M61 356 L70 358 M130 358 L139 356" fill="none" stroke="' + seam + '" stroke-opacity=".6" stroke-width=".9"/>';
    } else if (variant === 1) {
      o += '<path d="M60 360 Q67 363 74 360 M126 360 Q133 363 140 360" fill="none" stroke="' + seam + '" stroke-opacity=".65" stroke-width="1.05"/>';
    } else {
      o += '<path d="M75 350 L79 375 M125 350 L121 375" fill="none" stroke="' + seam + '" stroke-opacity=".32" stroke-width="1.05"/>';
    }

    // Chaussettes courtes et chaussures à bout arrondi, semelle visible et lacets fins.
    o += '<path d="M62 494 Q72 498 83 494 L83 508 L63 508 Z" fill="' + light + '" stroke="' + K + '" stroke-width="1.1"/>';
    o += '<path d="M117 494 Q128 498 138 494 L137 508 L117 508 Z" fill="' + light + '" stroke="' + K + '" stroke-width="1.1"/>';

    function sneaker() {
      let s = '';
      s += '<path d="M47 516 Q62 524 84 515 L90 520 Q91 525 77 529 L55 529 Q46 527 44 523 Q44 519 47 516 Z" fill="' + light + '" stroke="' + K + '" stroke-width="1.55"/>';
      s += '<path d="M51 508 Q56 504 62 506 L69 510 L79 506 Q85 506 88 513 L89 518 Q68 525 47 520 L46 516 Z" fill="' + shoe + '" stroke="' + K + '" stroke-width="1.6"/>';
      s += '<path d="M49 514 Q55 512 61 516 L57 521 L48 519 Z" fill="' + accent + '" stroke="' + K + '" stroke-width=".95"/>';
      s += '<path d="M62 506 Q69 508 76 506 L82 514 L61 519 L57 512 Z" fill="' + accent + '" stroke="' + K + '" stroke-width=".95"/>';
      s += '<path d="M64 509 L75 508 M63 512 L77 511 M62 515 L78 514" fill="none" stroke="' + light + '" stroke-width="1.25"/>';
      s += '<path d="M80 508 L85 512 L86 516" fill="none" stroke="' + accent + '" stroke-width="1.2"/>';
      s += '<path d="M48 522 Q68 527 89 520" fill="none" stroke="' + K + '" stroke-opacity=".45" stroke-width=".95"/>';
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
