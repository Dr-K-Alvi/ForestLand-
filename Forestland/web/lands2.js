/* lands2.js - two living landscapes for the Forest menu.
   Garden: paved roads, a fountain plaza, benches, lamps, flower beds, hedges, ponds and gazebos.
   Forest: a winding river with a bridge, boulders, logs, ferns, mushrooms, bushes and a wild lake.
   Both are generated tile by tile from absolute coordinates (centre outwards), so a bigger land never stretches:
   it simply reveals more of the same world. All sizes stay fixed; only the number of tiles changes. */
(function () {
  const HX = 24, HY = 12, f = (n) => (+n).toFixed(1);
  const hx3 = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hx3(a), B = hx3(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const dk = (c, t) => mix(c, '#000000', t), lt = (c, t) => mix(c, '#ffffff', t);
  const H = (i, j, s = 0) => { let x = Math.imul((i * 374761393 + j * 668265263 + s * 144665) | 0, 1274126177); x = (x ^ (x >>> 13)) >>> 0; x = Math.imul(x, 1103515245) >>> 0; x = (x ^ (x >>> 15)) >>> 0; return (x % 100000) / 100000; };
  const mod = (a, n) => ((a % n) + n) % n;
  const proj = (i, j) => [(i - j) * HX, (i + j) * HY];
  const poly = (l) => 'M' + l.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  const diam = (cx, cy, sx = 1, sy = 1) => poly([[cx, cy - HY * sy], [cx + HX * sx, cy], [cx, cy + HY * sy], [cx - HX * sx, cy]]);

  /* isometric box centred on (cx,cy): half sizes ai (along i) and aj (along j) in tiles, height h in px */
  function ibox(cx, cy, ai, aj, h, top, left, right) {
    const P = (a, b, z) => [cx + (a - b) * HX, cy + (a + b) * HY - z];
    const A0 = P(ai, aj, 0), B0 = P(ai, -aj, 0), C0 = P(-ai, aj, 0), A1 = P(ai, aj, h), B1 = P(ai, -aj, h), C1 = P(-ai, aj, h), D1 = P(-ai, -aj, h);
    return `<path d="${poly([C0, A0, A1, C1])}" fill="${left}"/><path d="${poly([A0, B0, B1, A1])}" fill="${right}"/><path d="${poly([D1, B1, A1, C1])}" fill="${top}"/>`;
  }
  const wood = (c, a, b, h, ai, aj) => ibox(c[0], c[1], ai, aj, h, '#c89a62', '#a87a46', '#8a6236');

  /* ---------------- sprites (drawn at the centre of a tile) ---------------- */
  const SP = {
    bench(c, dir) { const [x, y] = c, l = dir === 'x' ? [.4, .15] : [.15, .4]; return ibox(x, y + 2, l[0], l[1], 4, '#d9ac6c', '#a87a46', '#86602f') + (dir === 'x' ? ibox(x - 3, y - 4, .4, .04, 9, '#c89a5c', '#9a6e3c', '#7a5428') : ibox(x + 3, y - 4, .04, .4, 9, '#c89a5c', '#9a6e3c', '#7a5428')) + `<path d="M${f(x - 9)} ${f(y + 8)}v4M${f(x + 9)} ${f(y + 8)}v4" stroke="#3a3a3a" stroke-width="1.6"/>`; },
    lamp(c) { const [x, y] = c; return `<ellipse cx="${f(x)}" cy="${f(y + 3)}" rx="5" ry="2.4" fill="#4a4a4a"/><path d="M${f(x)} ${f(y + 3)}V${f(y - 34)}" stroke="#3c3c3c" stroke-width="2.4"/><circle cx="${f(x)}" cy="${f(y - 37)}" r="8" fill="#ffe9a0" opacity=".28"/><path d="M${f(x - 4.5)} ${f(y - 34)}h9l-1.5 -9h-6z" fill="#fff4c0" stroke="#3c3c3c" stroke-width="1.2"/><path d="M${f(x - 6)} ${f(y - 43)}h12l-6 -5z" fill="#3c3c3c"/>`; },
    fountain(c) { const [x, y] = c; return `<ellipse cx="${f(x)}" cy="${f(y + 6)}" rx="36" ry="18" fill="#b8b2a2"/><ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="36" ry="18" fill="#d8d2c2"/><ellipse cx="${f(x)}" cy="${f(y + 1)}" rx="30" ry="14.5" fill="#6cb8dc"/><ellipse cx="${f(x - 6)}" cy="${f(y - 1)}" rx="14" ry="4" fill="#9ad8f0" opacity=".7"/><path d="M${f(x - 5)} ${f(y + 2)}l1 -22h8l1 22z" fill="#cfc9b8" stroke="#a8a290" stroke-width=".8"/><ellipse cx="${f(x)}" cy="${f(y - 20)}" rx="14" ry="6" fill="#d8d2c2" stroke="#a8a290" stroke-width=".8"/><ellipse cx="${f(x)}" cy="${f(y - 21)}" rx="11" ry="4.4" fill="#78c4e4"/><path d="M${f(x)} ${f(y - 22)}q-12 -16 -22 -2M${f(x)} ${f(y - 22)}q12 -16 22 -2M${f(x)} ${f(y - 22)}q0 -22 0 -26" stroke="#bfe8f8" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/><circle cx="${f(x)}" cy="${f(y - 48)}" r="2.2" fill="#e6f8ff"/>`; },
    bed(c, s) { const [x, y] = c; let h = `<path d="${diam(x, y, .78, .78)}" fill="#7a5a3c"/><path d="${diam(x, y - 1, .66, .66)}" fill="#8e6a46"/>`; const cols = [['#f45a7a', '#ffd0dc'], ['#f7c030', '#fff0a0'], ['#9a6cf0', '#e0d0ff'], ['#ff8a3a', '#ffd0a0'], ['#ffffff', '#ffe9a0']][Math.floor(s * 5) % 5];
      for (let k = 0; k < 7; k++) { const a = H(k, s * 99, 1) * 6.283, r = H(k, s * 99, 2) * .5, px = x + Math.cos(a) * r * HX * .9, py = y + Math.sin(a) * r * HY * .9 - 2; h += `<path d="M${f(px)} ${f(py + 3)}v-3" stroke="#3a8a34" stroke-width="1.1"/><circle cx="${f(px)}" cy="${f(py - 1)}" r="2.6" fill="${cols[0]}"/><circle cx="${f(px)}" cy="${f(py - 1)}" r="1" fill="${cols[1]}"/>`; } return h; },
    bush(c, s, hedge) { const [x, y] = c, g = hedge ? ['#2f7a34', '#438c3e', '#5ca04c'] : [['#3a8a36', '#4e9e44', '#6cb458'], ['#2f7a34', '#438c3e', '#5ca04c'], ['#4a9a3c', '#62b04e', '#82c462']][Math.floor(s * 3) % 3]; return `<ellipse cx="${f(x)}" cy="${f(y + 4)}" rx="15" ry="6" fill="#00000026"/><circle cx="${f(x - 7)}" cy="${f(y - 2)}" r="8.5" fill="${g[0]}"/><circle cx="${f(x + 7)}" cy="${f(y - 2)}" r="8.5" fill="${g[0]}"/><circle cx="${f(x)}" cy="${f(y - 8)}" r="10" fill="${g[1]}"/><circle cx="${f(x - 3)}" cy="${f(y - 11)}" r="5.6" fill="${g[2]}"/>` + (hedge ? '' : `<circle cx="${f(x + 5)}" cy="${f(y - 5)}" r="1.8" fill="#f4506a"/><circle cx="${f(x - 6)}" cy="${f(y - 9)}" r="1.6" fill="#f6d040"/>`); },
    gazebo(c) { const [x, y] = c; let h = ibox(x, y + 2, .95, .95, 4, '#e0c89a', '#b89a68', '#98804e'); const P = (a, b, z) => [x + (a - b) * HX, y + 2 + (a + b) * HY - z]; const q = [[.8, .8], [.8, -.8], [-.8, .8], [-.8, -.8]].map(([a, b]) => [P(a, b, 4), P(a, b, 40)]).sort((u, v) => u[0][1] - v[0][1]);
      q.forEach(([p0, p1], k) => { h += `<path d="M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}" stroke="${k > 1 ? '#f4eadc' : '#e2d6c0'}" stroke-width="3.2"/>`; if (k === 1) h += `<path d="M${f(P(.8, .8, 28)[0])} ${f(P(.8, .8, 28)[1])}L${f(P(.8, -.8, 28)[0])} ${f(P(.8, -.8, 28)[1])}L${f(P(-.8, -.8, 28)[0])} ${f(P(-.8, -.8, 28)[1])}" stroke="#f4eadc" stroke-width="1.4" fill="none" opacity=".7"/>`; });
      const A = P(1.05, 1.05, 40), B = P(1.05, -1.05, 40), C = P(-1.05, 1.05, 40), D = P(-1.05, -1.05, 40), T = [x, y - 30]; return h + `<path d="${poly([C, A, T])}" fill="#b04a3a"/><path d="${poly([A, B, T])}" fill="#8a3428"/><path d="${poly([D, B, T])}" fill="#c25a48" opacity=".9"/><circle cx="${f(T[0])}" cy="${f(T[1] - 1)}" r="2.2" fill="#e8c860"/>`; },
    lily(c, s) { const [x, y] = c; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="3" fill="#4e9a42"/><path d="M${f(x)} ${f(y)}l5 -2" stroke="#6ab458" stroke-width=".8"/>` + (s > .55 ? `<circle cx="${f(x - 1)}" cy="${f(y - 2)}" r="2.2" fill="#ffd0e0"/><circle cx="${f(x - 1)}" cy="${f(y - 2)}" r="1" fill="#f6d040"/>` : ''); },
    rock(c, s) { const [x, y] = c, r = 7 + s * 7; return `<ellipse cx="${f(x)}" cy="${f(y + 3)}" rx="${f(r + 3)}" ry="${f(r * .42)}" fill="#00000026"/><path d="M${f(x - r)} ${f(y + 2)}L${f(x - r * .7)} ${f(y - r * .7)}L${f(x)} ${f(y - r * 1.05)}L${f(x + r * .8)} ${f(y - r * .55)}L${f(x + r)} ${f(y + 2)}Z" fill="#9a9a94"/><path d="M${f(x)} ${f(y - r * 1.05)}L${f(x + r * .8)} ${f(y - r * .55)}L${f(x + r)} ${f(y + 2)}L${f(x + r * .2)} ${f(y + 2)}Z" fill="#7e7e78"/><path d="M${f(x - r * .7)} ${f(y - r * .7)}L${f(x)} ${f(y - r * 1.05)}L${f(x - r * .1)} ${f(y - r * .4)}Z" fill="#bcbcb4"/>` + (s > .5 ? `<path d="M${f(x - r * .9)} ${f(y)}q${f(r * .3)} -4 ${f(r * .6)} -1" stroke="#5a9a44" stroke-width="2.6" fill="none"/>` : ''); },
    log(c, s) { const [x, y] = c, dir = s > .5; return ibox(x, y + 1, dir ? .42 : .14, dir ? .14 : .42, 8, '#8a5e3a', '#6e4a2c', '#5a3c22') + `<ellipse cx="${f(x + (dir ? 10 : -10))}" cy="${f(y - 3 + 5)}" rx="3" ry="2.2" fill="#d8b888" stroke="#5a3c22" stroke-width=".6"/>`; },
    stump(c) { const [x, y] = c; return `<path d="M${f(x - 7)} ${f(y + 2)}v-9h14v9q-7 4 -14 0z" fill="#6e4a2c"/><ellipse cx="${f(x)}" cy="${f(y - 7)}" rx="7" ry="3.2" fill="#d8b888"/><ellipse cx="${f(x)}" cy="${f(y - 7)}" rx="4" ry="1.7" fill="none" stroke="#b08a58" stroke-width=".7"/>`; },
    fern(c, s) { const [x, y] = c; let h = ''; for (let k = 0; k < 9; k++) { const a = -1.3 + k * .325, L = 12 + H(k, s * 50, 3) * 5; h += `<path d="M${f(x)} ${f(y + 2)}Q${f(x + Math.sin(a) * L * .6)} ${f(y - L * .8)} ${f(x + Math.sin(a) * L)} ${f(y - L * .45)}" stroke="${k % 2 ? '#3f8a38' : '#56a048'}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`; } return h; },
    mush(c, s) { const [x, y] = c; return [[-5, 2, 1], [4, 0, .75]].map(([dx, dy, k]) => `<path d="M${f(x + dx - 1.4 * k)} ${f(y + dy)}v-4h${f(2.8 * k)}v4z" fill="#f2e8d0"/><path d="M${f(x + dx - 6 * k)} ${f(y + dy - 4)}q${f(6 * k)} ${f(-9 * k)} ${f(12 * k)} 0z" fill="${s > .5 ? '#e8402c' : '#c8803a'}"/><circle cx="${f(x + dx - 1.5 * k)}" cy="${f(y + dy - 7 * k)}" r="${f(1 * k)}" fill="#fff"/>`).join(''); },
    wild(c, s) { const [x, y] = c, col = ['#fff', '#f7d44a', '#c89af0', '#ff8aa8'][Math.floor(s * 4) % 4]; return [-6, 0, 6].map((d, k) => `<path d="M${f(x + d)} ${f(y + 3 - k % 2 * 2)}v-5" stroke="#3f8a38" stroke-width="1"/><circle cx="${f(x + d)}" cy="${f(y - 3 - k % 2 * 2)}" r="2.4" fill="${col}"/><circle cx="${f(x + d)}" cy="${f(y - 3 - k % 2 * 2)}" r=".9" fill="#f6c030"/>`).join(''); },
    reeds(c, s) { const [x, y] = c; return [-5, -1, 3, 7].map((d, k) => `<path d="M${f(x + d)} ${f(y + 3)}q${f(k % 2 ? 2 : -2)} -10 ${f(k - 1.5)} -${14 + k * 3}" stroke="#7a9a3c" stroke-width="1.6" fill="none"/>` + (k % 2 ? `<ellipse cx="${f(x + d + (k - 1.5))}" cy="${f(y - 14 - k * 3)}" rx="1.6" ry="4" fill="#6a4a2a"/>` : '')).join(''); },
    bridge(c) { const [x, y] = c; let h = ibox(x, y + 3, .42, 1.15, 3, '#c89a5c', '#a87a46', '#86602f'); for (let k = -3; k <= 3; k++) h += `<path d="M${f(x + k * 5.5 + 8)} ${f(y + 3 + k * 2.7 - 1)}l-8 4" stroke="#7a5428" stroke-width=".7" opacity=".6"/>`; return h + ibox(x, y + 2, .04, 1.15, 9, '#d6aa6a', '#b08048', '#8a6030'); },
    tuft(c, s) { const [x, y] = c; return `<path d="M${f(x - 3)} ${f(y + 1)}l-2 -5M${f(x)} ${f(y + 1)}l0 -7M${f(x + 3)} ${f(y + 1)}l2 -5" stroke="${s > .5 ? '#4e9a3e' : '#6cb24c'}" stroke-width="1.2" stroke-linecap="round"/>`; },
  };

  /* ---------------- the two worlds ---------------- */
  const GARDEN = {
    name: 'garden', unit: 9,
    tile(i, j) {
      const ri = mod(i, 9), rj = mod(j, 9), bi = Math.floor(i / 9), bj = Math.floor(j / 9);
      if (Math.abs(i) <= 1 && Math.abs(j) <= 1) return { k: 'plaza', obj: i === 0 && j === 0 ? 'fountain' : null };
      if (ri === 0 || rj === 0) { const lamp = (ri === 0 && mod(j, 9) === 4 && false); return { k: 'path' }; }
      const h = H(bi, bj, 7), type = (bi === 0 && bj === 0) ? 'lawn' : h < .22 ? 'pond' : h < .42 ? 'gazebo' : 'lawn', u = ri, v = rj, s = H(i, j, 5);
      const r2 = (u - 4.5) * (u - 4.5) + (v - 4.5) * (v - 4.5);
      if (type === 'pond') { if (r2 <= 4.6) return { k: 'water', obj: null }; if (r2 <= 9.5) return { k: 'bank', obj: (u === 4 && v === 7) ? 'bench:x' : null }; }
      if (type === 'gazebo') { if (u >= 4 && u <= 5 && v >= 4 && v <= 5) return { k: 'deck', obj: (u === 4 && v === 4) ? 'gazebo' : null, occ: 1 }; }
      if (u === 1 && v === 6) return { k: 'lawn', obj: 'bench:x' }; if (v === 1 && u === 3) return { k: 'lawn', obj: 'bench:y' };
      if ((u === 1 && v === 3) || (u === 8 && v === 7) || (v === 8 && u === 2)) return { k: 'lawn', obj: 'lamp' };
      return { k: 'lawn', s, site: (u % 2 === 0 && v % 2 === 0) };
    },
  };
  const rjOf = (i) => Math.round(3.2 * Math.sin(i * .38 + .9) + 1.6 * Math.sin(i * .17 + 2)) - 2;
  const FOREST = {
    name: 'forest',
    tile(i, j) {
      const jr = rjOf(i), d = j - jr, s = H(i, j, 5), bi = Math.floor(i / 13), bj = Math.floor(j / 13);
      if (d === 0 || d === 1) { if (i === 1 && d <= 1) return { k: 'water', bridge: d === 0 ? 1 : 0, occ: 1 }; return { k: 'water', occ: 1 }; }
      if (d === -1 || d === 2) return { k: 'bank', obj: s < .12 ? 'rock' : null, s, occ: 1 };
      const cx = bi * 13 + 3 + Math.floor(H(bi, bj, 3) * 7), cy = bj * 13 + 3 + Math.floor(H(bi, bj, 4) * 7), lake = H(bi, bj, 3) < .22 && Math.abs(cy - rjOf(cx)) > 6 && (i - cx) * (i - cx) + (j - cy) * (j - cy) <= 7.5;
      if (lake) return { k: 'water', occ: 1 };
      if (H(bi, bj, 3) < .22 && Math.abs(cy - rjOf(cx)) > 6 && (i - cx) * (i - cx) + (j - cy) * (j - cy) <= 12) return { k: 'bank', occ: 1 };
      const site = (mod(i, 2) === 0 && mod(j, 2) === 0);
      if (!site) { const r = H(i, j, 11); if (r < .045) return { k: 'floor', obj: 'rock', s, occ: 1 }; if (r < .08) return { k: 'floor', obj: 'log', s, occ: 1 }; if (r < .12) return { k: 'floor', obj: 'stump', s, occ: 1 }; if (r < .16) return { k: 'floor', obj: 'mush', s, occ: 1 }; if (r < .7) return { k: 'floor', obj: 'tuft', s }; }
      return { k: 'floor', s, site };
    },
  };

  const lum = (c) => { const [r, g, b] = hx3(c); return (r * 299 + g * 587 + b * 114) / 1000; };
  /* The land style chosen in Settings colours the whole scene: ground, roads, soil sides and little ground details. */
  function palette(mode, id) {
    const L = LANDS[id] || LANDS.lime, nat = id === 'lime', b0 = nat ? '#82c85c' : L.top[0], b1 = nat ? '#76bc52' : L.top[1];
    const soil = nat ? ['#5c9a40', '#8a6444', '#6e4c32'] : [dk(b1, .14), L.l, dk(L.l, .3)];
    const road = lum(b0) > 190 ? dk(mix('#d9d2c0', b0, .35), .08) : mix('#e9dfc8', b0, .22), plaza = lum(b0) > 190 ? dk(road, -.0) : lt(road, .3);
    const water = id === 'desert' ? '#5fb4cc' : id === 'winter' ? '#9ccfe6' : id === 'night' ? '#3a5aa0' : mix('#72bcdc', b0, .12);
    if (mode === 'garden') return { lawn: [b0, b1], path: road, plaza: lt(road, .25), bed: '#8e6a46', water, bank: mix('#d6caa6', b0, .25), deck: '#d8b884', soil, joint: dk(road, .14), acc: L.acc, accC: L.accC };
    return { floor: [b0, b1, nat ? '#7aae52' : lt(b0, .06), nat ? '#5f9444' : dk(b1, .1)].map((c, k) => nat ? ['#72a84c', '#689c48', '#7aae52', '#5f9444'][k] : c), water, bank: nat ? '#b6a070' : mix('#b6a070', b0, .35), soil, joint: dk(b1, .12), acc: L.acc, accC: L.accC };
  }
  /* small ground details that belong to the land style (fallen leaves, snow specks, puddles, stars...) */
  function groundAcc(pal, cx, cy, i, j, k) {
    const a = pal.acc, h = H(i, j, 31), ox = (H(i, j, 32) - .5) * 26, oy = (H(i, j, 33) - .5) * 10, x = cx + ox, y = cy + oy;
    if (k !== 'lawn' && k !== 'floor') return '';
    if (a === 'leaves' && h < .22) return `<path d="M${f(x)} ${f(y)}q3 -4 6 0q-3 4 -6 0z" fill="${['#c8502a', '#e0902a', '#a8401e', '#d8b030'][Math.floor(h * 40) % 4]}" transform="rotate(${Math.floor(h * 600) % 180} ${f(x)} ${f(y)})"/>`;
    if (a === 'puddles' && h < .08) return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="3.6" fill="${(pal.accC && pal.accC[0]) || '#9fd0e8'}" opacity=".85"/><ellipse cx="${f(x - 2)}" cy="${f(y - 1)}" rx="4" ry="1.2" fill="#fff" opacity=".5"/>`;
    if (a === 'dots' && h < .3) return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1 + h * 3)}" fill="${(pal.accC && pal.accC[0]) || '#fff'}" opacity=".85"/>`;
    if (a === 'stars' && h < .16) return `<path d="M${f(x - 3)} ${f(y)}h6M${f(x)} ${f(y - 3)}v6" stroke="#cfd8ff" stroke-width="1" opacity=".8"/>`;
    return '';
  }

  /* ---------------- scene builder ---------------- */
  window.sceneSVG = function (trees, o = {}) {
    const mode = o.mode || (S.settings.landMode === 'forest' ? 'forest' : 'garden'), W = mode === 'forest' ? FOREST : GARDEN, landId = o.land || S.land, pal = palette(mode, landId), period = o.period || 'day', uid = 'sc' + mode[0] + (o.k || '') + (++sceneSVG.n);
    const n = trees.length, minR = { day: 3, week: 4, month: 5, year: 6, custom: 4 }[period] || 4, sites = [];
    let Rs = minR; for (;;) { sites.length = 0; for (let i = -Rs; i <= Rs; i++) for (let j = -Rs; j <= Rs; j++) { const t = W.tile(i, j); if (t.site) sites.push([i, j, Math.max(Math.abs(i), Math.abs(j)) + H(i, j, 2) * .95]); } if (sites.length >= n + 2 || Rs >= 120) break; Rs += Math.max(1, Math.ceil((n - sites.length) / (Rs * 3))); }
    sites.sort((a, b) => a[2] - b[2]); const used = sites.slice(0, n); let R = minR; used.forEach(([i, j]) => { R = Math.max(R, Math.max(Math.abs(i), Math.abs(j)) + 1); });
    const EX = (2 * R + 1) * HX, EY = (2 * R + 1) * HY, T_ = 20, groups = {}, extra = [], items = [];
    const put = (c, d) => { (groups[c] = groups[c] || []).push(d); };
    const col = (k, s, i, j) => {
      if (mode === 'garden') return k === 'lawn' ? pal.lawn[(mod(i, 2) + mod(j, 2)) % 2] : k === 'path' ? pal.path : k === 'plaza' ? pal.plaza : k === 'bed' ? pal.lawn[0] : k === 'water' ? pal.water : k === 'bank' ? pal.bank : k === 'deck' ? pal.deck : pal.lawn[0];
      return k === 'water' ? pal.water : k === 'bank' ? pal.bank : pal.floor[Math.floor(H(i >> 1, j >> 1, 5) * 4)];
    };
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
      const t = W.tile(i, j), [cx, cy] = proj(i, j), c = col(t.k, t.s, i, j); put(c, diam(cx, cy, 1.03, 1.03));
      if (t.k === 'path' || t.k === 'plaza') { if (H(i, j, 8) < .5) extra.push(`<path d="M${f(cx - 8)} ${f(cy - 1)}l8 4l8 -4" stroke="${pal.joint}" stroke-width=".8" fill="none" opacity=".7"/>`); }
      else if (t.k === 'water') extra.push(`<path d="M${f(cx - 9)} ${f(cy - 2)}q4 -2.4 8 0M${f(cx + 2)} ${f(cy + 3)}q4 -2.4 8 0" stroke="#fff" stroke-width="1" fill="none" opacity=".55"/>`);
      else if (t.obj == null && (t.k === 'lawn' || t.k === 'floor') && H(i, j, 9) < (mode === 'garden' ? .16 : .1) && landId === 'lime') extra.push(SP.tuft([cx + (H(i, j, 1) - .5) * 20, cy], H(i, j, 6)));
      if (!t.obj) extra.push(groundAcc(pal, cx, cy, i, j, t.k));
      if (t.bridge === 1) items.push({ d: i + j + .2, s: SP.bridge(proj(i, j + .5)) });
      if (t.obj) { const [kind, arg] = t.obj.split(':'), pos = [cx, cy], d = i + j; let s = '';
        if (kind === 'fountain') s = SP.fountain(pos); else if (kind === 'bench') s = SP.bench(pos, arg); else if (kind === 'lamp') s = SP.lamp(pos); else if (kind === 'bed') s = SP.bed(pos, t.s); else if (kind === 'hedge') s = SP.bush(pos, 0, true); else if (kind === 'bush') s = SP.bush(pos, t.s || 0); else if (kind === 'lily') s = SP.lily(pos, H(i, j, 4));
        else if (kind === 'gazebo') { const p2 = proj(i + .5, j + .5); s = SP.gazebo(p2); items.push({ d: i + j + 1.2, s }); continue; }
        else if (SP[kind]) s = SP[kind](pos, t.s || .5); items.push({ d: d, s }); }
    }
    // ground sides
    const L0 = [-EX, 0], B0 = [0, EY], R0 = [EX, 0], Tp = [0, -EY], sd = pal.soil;
    const side = (a, b, shade) => `<path d="${poly([a, b, [b[0], b[1] + T_], [a[0], a[1] + T_]])}" fill="${sd[1]}"/><path d="${poly([a, b, [b[0], b[1] + 5], [a[0], a[1] + 5]])}" fill="${sd[0]}"/><path d="${poly([[a[0], a[1] + 5], [b[0], b[1] + 5], [b[0], b[1] + T_], [a[0], a[1] + T_]])}" fill="${shade}" opacity=".35"/>`;
    let g = `<path d="${poly([Tp, R0, B0, L0])}" fill="${sd[2]}"/>` + side(L0, B0, '#000') + side(B0, R0, '#000').replace(new RegExp(sd[1], 'g'), dk(sd[1], .18)).replace(new RegExp(sd[0], 'g'), dk(sd[0], .15));
    if (mode === 'forest') for (let k = 0; k < R * 2; k++) { const u = k / (R * 2), px = L0[0] + (B0[0] - L0[0]) * u, py = L0[1] + (B0[1] - L0[1]) * u; g += `<rect x="${f(px)}" y="${f(py + 8 + H(k, 1, 3) * 8)}" width="${f(4 + H(k, 2, 3) * 4)}" height="3" rx="1.4" fill="#8a7a66" opacity=".7"/>`; }
    g += Object.keys(groups).map(c => `<path d="${groups[c].join('').replace(/Z/g, 'Z')}" fill="${c}" stroke="${c}" stroke-width=".7"/>`).join('') + extra.join('');
    // banks of the garden beds + pond edges keep soft look
    // trees
    const sz = 62, syms = {}, key = (t) => t.w ? 'w' : t.id + t.lvl, inner = (t) => (t.w ? witheredSVG() : treeSVG(t.id, t.lvl)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    trees.forEach((t, k) => { const [i, j] = used[k], jx = (H(i, j, 21) - .5) * .5, jy = (H(i, j, 22) - .5) * .5, [cx, cy] = proj(i + jx, j + jy); const kk = key(t); if (!syms[kk]) syms[kk] = `<symbol id="${uid}${kk}" viewBox="0 0 200 220">${inner(t)}</symbol>`;
      items.push({ d: i + j + jx + jy + .5, s: `<use href="#${uid}${kk}" x="${f(cx - sz / 2)}" y="${f(cy - sz * 1.017 + 4)}" width="${sz}" height="${f(sz * 1.103)}"/>` }); });
    items.sort((a, b) => a.d - b.d);
    const minX = -EX - 10, minY = -EY - 80, w = 2 * EX + 20, h = 2 * EY + 80 + T_ + 14;
    const svg = `<svg class="scene" viewBox="${f(minX)} ${f(minY)} ${f(w)} ${f(h)}" data-w="${f(w)}" data-h="${f(h)}" data-r="${R}" xmlns="http://www.w3.org/2000/svg"><defs>${Object.values(syms).join('')}</defs>${g}${items.map(x => x.s).join('')}</svg>`;
    return svg;
  };
  sceneSVG.n = 0;

  /* ---------------- dead tree: same footprint as a young living tree, bare and weathered ---------------- */
  witheredSVG = function (attr = '') {
    const sh = typeof groundShadow !== 'undefined' ? groundShadow : '<ellipse cx="102" cy="206" rx="46" ry="6" fill="#8f918c" opacity=".42"/>';
    const br = (d, w) => `<path d="${d}" stroke="#4e4036" stroke-width="${w}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#8a7a68" stroke-width="${w * .3}" stroke-linecap="round" fill="none" opacity=".6" transform="translate(-.8 -.6)"/>`;
    return `<svg viewBox="0 0 200 220" ${attr} xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="wdG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a8a76"/><stop offset=".55" stop-color="#6a5a4a"/><stop offset="1" stop-color="#42362c"/></linearGradient></defs>${sh}`
      + `<g transform="translate(100 206) scale(.66) translate(-100 -206)"><path d="M82 206C88 184 91 160 93 138L88 118L97 126L101 100L107 124L113 114L113 138C115 164 118 186 124 206Z" fill="url(#wdG)" stroke="#3a2e26" stroke-width="1.4" stroke-linejoin="round"/>`
      + `<ellipse cx="103" cy="168" rx="5.5" ry="10" fill="#2a2018"/><path d="M96 150l4 10l-3 12M110 146l-2 14M99 190l3 -8" stroke="#32261e" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
      + br('M95 150C86 138 76 128 62 118', 7) + br('M62 118C54 112 50 104 44 98', 4) + br('M62 118C64 108 68 100 66 90', 3.4) + br('M111 142C122 128 132 118 146 108', 7) + br('M146 108C154 102 160 94 166 88', 4) + br('M146 108C142 98 144 90 140 82', 3.2) + br('M99 112C94 98 92 86 84 74', 5.6) + br('M84 74C82 66 78 62 74 58M84 74C90 68 90 62 94 56', 3) + br('M104 110C108 96 112 86 118 76', 4.6) + br('M118 76C122 70 126 66 130 64', 2.8)
      + `<path d="M40 206q8 -3 14 0M150 207q8 -3 16 0" stroke="#6a5a48" stroke-width="2" fill="none" opacity=".6"/><path d="M70 204l-4 -3l7 -1zM136 203l5 -3l-1 5z" fill="#9a7a4a" opacity=".9"/><ellipse cx="62" cy="204" rx="3.4" ry="1.6" fill="#8a6a3c"/><ellipse cx="152" cy="205" rx="3" ry="1.5" fill="#7a5a30"/></g></svg>`;
  };
})();
