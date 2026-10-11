/* Aurore Animation — mains, pantalons et chaussures redessinés pour drawCharacterFull().
   Visage, coiffure et buste (characters-2d.js) ne sont pas touchés : seul le segment
   « bas du corps + bras » du SVG plein-corps est remplacé. Le catalogue 2D (drawCharacter) reste intact.
   À charger après characters-2d.js et avant characters-3d.js. */
(function (g) {
  const K = '#1a1210';
  const hash = id => { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 100000; return h + 1; };
  const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const lum = h => { const [r, gg, b] = hx(h); return (.299 * r + .587 * gg + .114 * b) / 255; };
  const f = n => Math.round(n * 100) / 100;
  // [bas, chaussures] du catalogue original
  const BOT = { aurore: ['#2e3a52', '#f2f0ea'], aicha: ['#253c6b', '#412c25'], sana: ['#5d3e72', '#343447'], mei: ['#34466a', '#30354b'], amara: ['#b65b91', '#302033'], zara: ['#c34c7a', '#422535'], ines: ['#3d4e70', '#413149'], chloe: ['#315781', '#8a4e35'], lina: ['#394052', '#30293e'], fatou: ['#26736c', '#292a32'], malik: ['#1c2639', '#171a23'], koffi: ['#233b45', '#f0e6d6'], idrissa: ['#263f31', '#f2f0e7'], noah: ['#242c44', '#4b3028'], tariq: ['#5f523c', '#382f24'], samuel: ['#344b63', '#44342c'], elias: ['#2b313b', '#42312a'], gabriel: ['#d5b46a', '#eae6db'], kwame: ['#222631', '#ece8df'], yuki: ['#202c46', '#e2e5ee'] };

  /* ---------- Mains : main gauche vue de dos, pouce côté corps (x+) ---------- */
  const FING = [
    { p: [[24.6, 345.5], [24.4, 352], [24.9, 357.6], [26.3, 361.2]], w: [4, 3.7, 3.4] },
    { p: [[29.2, 346], [29.3, 354.5], [30.2, 361.8], [31.9, 367]], w: [4.5, 4.1, 3.7] },
    { p: [[34, 346.5], [34.4, 356], [35.6, 364.5], [37.5, 370.5]], w: [4.8, 4.4, 3.9] },
    { p: [[38.8, 346], [39.4, 354.5], [40.6, 361.5], [42.4, 366.3]], w: [4.6, 4.2, 3.7] }
  ];
  const THUMB = { p: [[40, 331], [44.4, 340], [46.4, 349.5], [46.8, 356.5]], w: [5.6, 5, 4.4] };

  function digit(d, skin, kc, kl) {
    const x0 = d.p[0][0], y0 = d.p[0][1];
    const P = d.p.map(q => [f(x0 + (q[0] - x0) * kc), f(y0 + (q[1] - y0) * kl)]);
    const seg = (col, add) => P.slice(0, 3).map((p, i) => '<path d="M' + p[0] + ' ' + p[1] + 'L' + P[i + 1][0] + ' ' + P[i + 1][1] + '" stroke="' + col + '" stroke-width="' + f(d.w[i] + add) + '"/>').join('');
    const tick = P.slice(1, 3).map((p, i) => '<path d="M' + f(p[0] - d.w[i + 1] * .32) + ' ' + p[1] + 'q' + f(d.w[i + 1] * .32) + ' .7 ' + f(d.w[i + 1] * .64) + ' 0" stroke="' + K + '" stroke-opacity="' + (i ? .28 : .42) + '" stroke-width=".7" fill="none"/>').join('');
    return seg(K, 1.3) + seg(skin, 0) + tick;
  }

  function hand(c, side, r) {
    // Les deux mains n'ont pas les mêmes paramètres : courbure, longueurs, angle et pouce diffèrent.
    const kc = side ? .78 + r() * .4 : .9 + r() * .3, ang = side ? 2.6 : -1.4, th = side ? .94 : 1.04;
    let o = '<g transform="rotate(' + ang + ' 32.3 318)" stroke-linecap="round" stroke-linejoin="round">';
    FING.forEach((d, i) => { o += digit(d, c.skin, kc * (1 + (3 - i) * .06 * (side ? 1 : .6)), .92 + r() * .16); });
    o += digit(THUMB, c.skin, th, 1);
    const pm = 'M25.3 316C24.2 326 21.8 337 22.2 346Q32 349.2 41.8 346C41.6 342 43.4 337 43.3 332C42 326 40.3 321 39.3 316';
    o += '<path d="' + pm + 'Z" fill="' + c.skin + '"/>';
    o += '<path d="' + pm + '" fill="none" stroke="' + K + '" stroke-width="1.2"/>';
    o += '<path d="M40.4 334Q36.5 338 34.6 343.5" fill="none" stroke="' + K + '" stroke-opacity=".3" stroke-width=".8"/>';
    o += '<path d="M23.8 343.4q1.3 1 2.6 0M28.4 343.9q1.3 1 2.6 0M33.2 344.2q1.3 1 2.6 0M38 343.9q1.3 1 2.6 0" fill="none" stroke="' + K + '" stroke-opacity=".32" stroke-width=".7"/>';
    return o + '</g>';
  }

  function arm(c, side, r) {
    const W = '" stroke="' + K + '" stroke-width="1.3" stroke-linejoin="round"/>';
    let o = '<path d="M39 190Q30 197 28 213L22.5 248Q21 259 24 268L26 296Q26 308 25.6 321L39 321Q39.4 308 40.4 296L41.8 268L46.5 236L52 211Z" fill="' + c.skin + W;
    if (c.st === 'tee') {
      o += '<path d="M39 190Q30 197 28 213L23 234L35 239L43 217L52 211Z" fill="' + c.top + W;
      o += '<path d="M23 234Q29 238 35 239" fill="none" stroke="' + K + '" stroke-width=".81"/>';
    } else {
      o += '<path d="M39 190Q30 197 28 213L22 247L24 258L34 263L41 230L52 211Z" fill="' + c.top + W;
      o += '<path d="M23 252Q28 258 34 259" fill="none" stroke="' + K + '" stroke-width=".78"/>';
      if (c.st === 'jacket') o += '<path d="M29 216L25 236" stroke="#ffffff" stroke-opacity=".28" stroke-width=".7"/>';
    }
    return o + hand(c, side, r);
  }

  /* ---------- Pantalon fuselé : bassin ~78 de large, genou à y≈430, cheville 14–18 ---------- */
  function leg(c, p, aw, v, side) {
    const ao = f(81 - aw / 2), ai = f(81 + aw / 2), seam = mix(p, '#ffffff', .4), j = side ? 2 : 0;
    let o = '<path d="M61 305C58.5 340 61 372 64 396C66 412 67.5 422 67.5 432C67 450 67 465 ' + f(ao - 3.5) + ' 480C' + f(ao - 2) + ' 489 ' + f(ao - .5) + ' 495 ' + ao + ' 497Q81 500.5 ' + ai + ' 497C' + ai + ' 487 ' + f(ai - .5) + ' 480 ' + f(ai + .3) + ' 466C' + f(ai + 1) + ' 452 92 440 92.2 430C92.5 418 95 408 97 392C98.5 378 99.5 365 100 352L100 305Z" fill="' + p + '" stroke="' + K + '" stroke-width="1.3" stroke-linejoin="round"/>';
    o += '<path d="M64 318C62.5 345 64.5 375 67 398" fill="none" stroke="' + seam + '" stroke-opacity=".3" stroke-width=".8"/>';
    if (v === 0) o += '<path d="M63.5 356L75 358.5L74 376L62.5 373.5Z" fill="' + p + '" stroke="' + seam + '" stroke-opacity=".7" stroke-width=".8" stroke-linejoin="round"/><path d="M63 361L74.6 363.5" stroke="' + seam + '" stroke-opacity=".6" stroke-width=".7"/>';
    if (v === 1) o += '<path d="M66 314Q69 329 79.5 333" fill="none" stroke="' + seam + '" stroke-opacity=".6" stroke-width=".85"/><path d="M68 ' + (452 + j) + 'Q80 ' + (456 + j) + ' 91 ' + (452 + j) + '" fill="none" stroke="' + seam + '" stroke-opacity=".3" stroke-width=".75"/>';
    if (v === 2) o += '<path d="M81 345L80.6 498" fill="none" stroke="' + seam + '" stroke-opacity=".22" stroke-width=".8"/>';
    // entrejambe, genou, cheville : seuls endroits plissés
    o += '<path d="M96.5 358Q89 366 83 376" fill="none" stroke="' + K + '" stroke-opacity=".3" stroke-width=".8"/>';
    o += '<path d="M69.5 ' + (430 + j) + 'Q80 ' + (436 + j) + ' 91 ' + (430 + j) + '" fill="none" stroke="' + K + '" stroke-opacity=".5" stroke-width=".9"/>';
    o += '<path d="M72 ' + (438 + j) + 'Q80 ' + (442 + j) + ' 89 ' + (438 + j) + '" fill="none" stroke="' + seam + '" stroke-opacity=".35" stroke-width=".8"/>';
    o += '<path d="M' + f(ao + .5) + ' ' + (485 + j / 2) + 'Q81 ' + (489.5 + j / 2) + ' ' + f(ai - .5) + ' ' + (485 + j / 2) + '" fill="none" stroke="' + K + '" stroke-opacity=".4" stroke-width=".8"/>';
    o += '<path d="M' + f(ao + .8) + ' 491.5Q81 495 ' + f(ai - .8) + ' 491.5" fill="none" stroke="' + seam + '" stroke-opacity=".5" stroke-width=".8"/>';
    return o;
  }

  /* ---------- Chaussure : 3/4 face, bout rond, semelle, empeigne, lacets ou scratch ---------- */
  function shoe(c, sh, v) {
    const light = lum(sh) > .6, sole = light ? '#d8d2c4' : '#f1ece2', acc = c.top;
    const toe = light ? mix(sh, '#000000', .1) : mix(sh, '#ffffff', .3), lace = light ? '#8f8a80' : '#f4efe6';
    const st = v ? 520.5 : 522, sb = v ? 529.6 : 529;
    let o = '<path d="M55.6 ' + f(st - .4) + 'C54.8 ' + f(st + 4.4) + ' 58.5 ' + sb + ' 65.5 ' + sb + 'L92.5 ' + sb + 'C98 ' + sb + ' 99.5 ' + f(st + 3.5) + ' 98.4 ' + f(st - .4) + 'Z" fill="' + sole + '" stroke="' + K + '" stroke-width="1.2" stroke-linejoin="round"/>';
    o += '<path d="M72.5 500L89.5 500C93 504 97.5 511 98 ' + (st - 2) + 'L98 ' + st + 'L62.5 ' + st + 'C56.2 ' + f(st - .2) + ' 54.8 ' + f(st - 5.5) + ' 58.5 ' + f(st - 9.5) + 'C62.5 ' + f(st - 13.5) + ' 68 505 72.5 500Z" fill="' + sh + '" stroke="' + K + '" stroke-width="1.3" stroke-linejoin="round"/>';
    o += '<path d="M56.3 ' + (st - 2) + 'C55.6 ' + f(st - 6.5) + ' 57.4 ' + (st - 9) + ' 59.4 ' + f(st - 10.6) + 'C62 ' + (st - 8) + ' 63.6 ' + f(st - 4.5) + ' 63.8 ' + (st - 1) + 'Z" fill="' + toe + '" stroke="' + K + '" stroke-width=".9" stroke-linejoin="round"/>';
    if (!v) o += [[74.2, 505.6], [70, 509.2], [66, 512.8]].map(q => '<path d="M' + f(q[0] - 2.3) + ' ' + f(q[1] - 2.7) + 'L' + f(q[0] + 2.3) + ' ' + f(q[1] + 2.7) + '" stroke="' + lace + '" stroke-width="1.1"/>').join('');
    else o += '<path d="M66 515Q72 510.5 79 509.5M64 519Q71 514.5 81 513.2" fill="none" stroke="' + acc + '" stroke-width="1.5"/>';
    o += '<path d="M66 ' + f(st - 2.5) + 'C72 ' + (st - 6) + ' 80 ' + f(st - 9.5) + ' 90 ' + (st - 10) + '" fill="none" stroke="' + acc + '" stroke-width="1.5"/>';
    o += '<path d="M92.6 504.6C96.2 509 97.4 514.5 97.2 ' + (st - 1) + '" fill="none" stroke="' + acc + '" stroke-width="1.3"/>';
    o += '<path d="M56.6 ' + f(st + 1.2) + 'Q76 ' + f(st + 4.5) + ' 98 ' + f(st + 1.2) + '" fill="none" stroke="' + K + '" stroke-opacity=".3" stroke-width=".7"/>';
    return '<g transform="translate(81 530) scale(1.18) translate(-81 -530)">' + o + '</g>';
  }

  function lowerAndArms(c) {
    const h = hash(c.id), r = rnd(h * 7 + 3), b = BOT[c.id] || ['#2e3a52', '#f2f0ea'];
    let p = b[0];
    if (p.toLowerCase() === c.top.toLowerCase()) p = mix(p, '#000000', .45);
    const aw = [14.2, 16, 17.8][h % 3], v = Math.floor(h / 3) % 3, sv = Math.floor(h / 9) % 2;
    const M = '<g transform="translate(200 0) scale(-1 1)">';
    let o = '<g stroke-linecap="round" stroke-linejoin="round">';
    o += shoe(c, b[1], sv) + M + '<g transform="translate(1 0)">' + shoe(c, b[1], sv) + '</g></g>';
    o += leg(c, p, aw, v, 0) + M + leg(c, p, aw, v, 1) + '</g>';
    o += arm(c, 0, r) + M + arm(c, 1, r) + '</g></g>';
    return o;
  }

  const orig = g.drawCharacterFull;
  if (typeof orig !== 'function') return;
  g.drawCharacterFull = function (c, size) {
    const s = orig(c, size);
    // On remplace uniquement le bloc compris entre la fin des cheveux arrière et le cou.
    const a = s.indexOf('</g>', s.indexOf('<g class="sway">')), b = s.indexOf('<rect x="89" y="150"');
    if (a < 0 || b < a) return s;
    return s.slice(0, a + 4) + lowerAndArms(c) + s.slice(b);
  };
})(window);
