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
      let o = '<path d="M39 190 Q30 197 28 213 L21 248 Q19 258 24 266 L27 288 L27 329 Q27 338 32 338 Q37 337 36 329 L36 291 L40 267 L46 236 L52 211 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="2" stroke-linejoin="round"/>';
      if (c.st === 'tee') {
        o += '<path d="M39 190 Q30 197 28 213 L23 234 L35 239 L43 217 L52 211 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="2" stroke-linejoin="round"/>';
        o += '<path d="M23 234 Q29 238 35 239" fill="none" stroke="' + K + '" stroke-width="1.4"/>';
      } else {
        o += '<path d="M39 190 Q30 197 28 213 L22 247 L24 258 L34 263 L41 230 L52 211 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="2" stroke-linejoin="round"/>';
        o += '<path d="M23 252 Q28 258 34 259" fill="none" stroke="' + K + '" stroke-width="1.3"/>';
        if (c.st === 'jacket') o += '<path d="M29 216 L25 236" stroke="#ffffff" stroke-opacity=".28" stroke-width="1.1"/>';
      }
      o += '<path d="M27 286 L36 285" fill="none" stroke="' + K + '" stroke-opacity=".38" stroke-width="1.1"/>';
      return o;
    }
    return '<g stroke-linecap="round" stroke-linejoin="round">' + oneSide() +
      '<g transform="translate(200 0) scale(-1 1)">' + oneSide() + '</g></g>';
  }

  function lowerBodyFull(c) {
    const palette = ['#302a31', '#283441', '#3a302d', '#26332f', '#383346', '#30302c'];
    const pants = palette[hash(c.id) % palette.length];
    const light = '#f0e8dc';
    return '<g transform="translate(22 0) scale(.78 1)" stroke="' + K + '" stroke-width="2" stroke-linejoin="round">' +
      '<path d="M43 318 Q66 329 99 323 L96 382 L87 505 Q72 511 57 504 L53 390 Z" fill="' + pants + '"/>' +
      '<path d="M101 323 Q134 329 157 318 L147 390 L143 504 Q128 511 112 505 L104 382 Z" fill="' + pants + '"/>' +
      '<path d="M46 321 Q73 333 98 328 M102 328 Q129 333 154 321" fill="none" stroke="' + light + '" stroke-opacity=".42" stroke-width="1.25"/>' +
      '<path d="M55 375 Q72 382 94 376 M106 376 Q128 382 145 375" fill="none" stroke="' + K + '" stroke-opacity=".65" stroke-width="1.1"/>' +
      '<path d="M52 344 Q61 352 75 349 L73 366" fill="none" stroke="' + light + '" stroke-opacity=".32" stroke-width="1.15"/>' +
      '<path d="M148 344 Q139 352 125 349 L127 366" fill="none" stroke="' + light + '" stroke-opacity=".32" stroke-width="1.15"/>' +
      '<path d="M100 330 L100 363 M97 387 L91 453 M103 387 L109 453" fill="none" stroke="' + K + '" stroke-opacity=".42" stroke-width="1.15"/>' +
      '<path d="M58 480 Q72 487 88 480 M112 480 Q128 487 142 480" fill="none" stroke="' + light + '" stroke-opacity=".68" stroke-width="1.3"/>' +
      '<path d="M57 503 Q72 510 87 504 L88 518 Q82 530 65 531 L43 531 Q38 528 43 520 Z" fill="#1a1719"/>' +
      '<path d="M112 504 Q128 510 143 503 L157 520 Q162 528 154 531 L130 531 Q113 530 112 518 Z" fill="#1a1719"/>' +
      '<path d="M45 526 Q65 530 85 525 M116 525 Q135 530 155 526" fill="none" stroke="' + light + '" stroke-width="1.8"/>' +
      '<path d="M59 516 L69 516 M61 520 L72 520 M126 516 L137 516 M129 520 L140 520" fill="none" stroke="' + light + '" stroke-width="1.25"/>' +
      '</g>';
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
