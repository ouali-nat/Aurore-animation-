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
      let o = '<path d="M37 190 Q27 194 23 211 L13 247 Q10 257 17 264 L17 279 Q16 294 20 306 Q22 313 28 311 Q33 309 30 302 L29 288 L31 265 L39 235 L49 209 Z" fill="' + c.skin + '" stroke="' + K + '" stroke-width="2.5" stroke-linejoin="round"/>';
      if (c.st === 'tee') {
        o += '<path d="M37 190 Q27 194 24 211 L20 230 L31 235 L40 216 L49 207 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="2.5" stroke-linejoin="round"/>';
        o += '<path d="M20 230 Q25 234 32 235" fill="none" stroke="' + K + '" stroke-width="2.2"/>';
      } else {
        o += '<path d="M37 190 Q27 194 23 211 L14 245 Q12 257 20 263 L30 258 L40 226 L49 207 Z" fill="' + c.top + '" stroke="' + K + '" stroke-width="2.5" stroke-linejoin="round"/>';
        o += '<path d="M16 255 Q23 261 30 257" fill="none" stroke="' + K + '" stroke-width="2.2"/>';
      }
      return o;
    }
    return '<g stroke-linecap="round" stroke-linejoin="round">' + oneSide() +
      '<g transform="translate(200 0) scale(-1 1)">' + oneSide() + '</g></g>';
  }

  function lowerBodyFull(c) {
    const palette = ['#302a31', '#283441', '#3a302d', '#26332f', '#383346', '#30302c'];
    const pants = palette[hash(c.id) % palette.length];
    return '<g stroke="' + K + '" stroke-width="2.5" stroke-linejoin="round">' +
      '<path d="M43 286 Q67 298 99 294 L96 337 L88 400 Q70 406 51 400 Z" fill="' + pants + '"/>' +
      '<path d="M101 294 Q133 298 157 286 L149 400 Q130 406 112 400 L104 337 Z" fill="' + pants + '"/>' +
      '<path d="M100 302 L100 336" fill="none" stroke-width="1.8"/>' +
      '<path d="M51 396 Q67 403 88 397 L87 410 Q80 417 67 417 L48 417 Q43 415 46 407 Z" fill="#1a1719"/>' +
      '<path d="M112 397 Q132 403 149 396 L154 407 Q158 415 152 418 L123 418 Q114 416 113 410 Z" fill="#1a1719"/>' +
      '<path d="M47 414 Q66 418 86 414 M116 414 Q135 419 153 414" fill="none" stroke="#e6ded1" stroke-width="2.5"/>' +
      '</g>';
  }

  function upperBodyFull(c) {
    const t = c.top, s = c.skin;
    let o = '<rect x="88" y="150" width="24" height="20" fill="' + s + '"/>';
    o += '<path d="M26 286 L26 262 L34 196 Q56 172 88 164 L112 164 Q144 172 166 196 L174 262 L174 286 Q100 303 26 286 Z" fill="' + t + '" stroke="' + K + '" stroke-width="2.5" stroke-linejoin="round"/>';
    if (c.st === 'jacket') {
      o += '<path d="M86 164 Q100 186 114 164 L100 196 Z" fill="#eee"/>';
      o += '<path d="M100 196 V292 M86 164 L100 196 L114 164" fill="none" stroke="' + K + '" stroke-width="2.5"/>';
      o += '<path d="M79 222 L95 235 L91 260 M121 222 L105 235 L109 260" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="2"/>';
    } else {
      o += '<path d="M86 164 Q100 186 114 164 Z" fill="' + s + '" stroke="' + K + '" stroke-width="2.5"/>';
    }
    if (c.st === 'hoodie') {
      o += '<path d="M78 166 Q100 198 122 166" fill="none" stroke="' + K + '" stroke-width="3"/>';
      o += '<path d="M92 188 V224 M108 188 V224" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>';
      o += '<path d="M60 242 Q100 226 140 242 L136 260 Q100 273 64 260 Z" fill="' + t + '" stroke="' + K + '" stroke-width="2"/>';
      o += '<path d="M70 247 Q100 255 130 247" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.5"/>';
    }
    if (c.st === 'jacket') {
      o += '<path d="M100 202 V290" fill="none" stroke="#f1e8d8" stroke-opacity=".65" stroke-width="1.5"/>';
      o += '<circle cx="104" cy="235" r="2" fill="#f1e8d8"/><circle cx="104" cy="251" r="2" fill="#f1e8d8"/>';
    }
    if (c.fl.includes('n')) {
      o += '<path d="M88 168 Q100 214 112 168" fill="none" stroke="' + GOLD + '" stroke-width="2"/>';
      o += '<ellipse cx="100" cy="208" rx="5" ry="7" fill="#f4efe6" stroke="' + K + '"/>';
    }
    o += '<path d="M42 281 Q100 297 158 281" fill="none" stroke="' + K + '" stroke-opacity=".55" stroke-width="1.8"/>';
    return o;
  }

  g.drawCharacterFull = function (c, size) {
    const r = rnd(hash(c.id));
    const hb = hairBack(c, r), f = face(c, r), hf = hairFront(c, r);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 450" width="' + (size || 200) + '" class="ch">' +
      '<g class="bob"><g class="sway">' + hb + '</g>' + lowerBodyFull(c) + armsFull(c) +
      upperBodyFull(c) + f + hf + phones(c) + '</g></svg>';
  };
})(window);
