/* realtree.js - procedural realistic trees: recursive branching + individual leaves, lit from the upper left.
   Each species has its own trunk, branching angle, crown shape, leaf shape and seasonal palette. */
window.CUSTOM = window.CUSTOM || {};
(function () {
  const f = (n) => n.toFixed(1), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const LEAF = {
    oval: 'M0 0C.55-.2 .6-.78 0-1C-.6-.78-.55-.2 0 0Z', lance: 'M0 0C.3-.3 .24-.78 0-1C-.24-.78-.3-.3 0 0Z', round: 'M0 0C.75-.1 .75-.95 0-1C-.75-.95-.75-.1 0 0Z',
    tri: 'M0 0C.5-.12 .56-.62 0-1C-.56-.62-.5-.12 0 0Z', petal: 'M0 0C.55-.3 .5-.9 .12-1L0-.86L-.12-1C-.5-.9-.55-.3 0 0Z', fan: 'M0 0L.8-.58Q.52-1.02 .07-.88L0-.95L-.07-.88Q-.52-1.02-.8-.58Z',
    maple: 'M0 0L.12-.2L.6-.2L.36-.44L.64-.68L.3-.64L.22-1L0-.78L-.22-1L-.3-.64L-.64-.68L-.36-.44L-.6-.2L-.12-.2Z',
    lobe: 'M0 0L.18-.14L.5-.1L.36-.34L.6-.5L.3-.56L.38-.84L.12-.74L0-1L-.12-.74L-.38-.84L-.3-.56L-.6-.5L-.36-.34L-.5-.1L-.18-.14Z',
  };
  const defs = '<defs>' + Object.entries(LEAF).map(([k, d]) => `<path id="lf-${k}" d="${d}"/>`).join('') + '</defs>';

  const hx6 = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lt = (c, t) => '#' + hx6(c).map(v => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join('');
  const star = (x, y, r, col) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .42 : r; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * q) + ' ' + f(y + Math.sin(a) * q); } return `<path d="${d}Z" fill="${col}"/>`; };
  const glow = (x, y, r, col) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 2.4)}" fill="${col}" opacity=".16"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 1.5)}" fill="${col}" opacity=".3"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fffbe6"/>`;
  const crane = (x, y) => `<g transform="translate(${f(x)} ${f(y)})"><ellipse cx="0" cy="0" rx="8" ry="4.2" fill="#fbfbf6" stroke="#cfcfc4" stroke-width=".5"/><path d="M5 -2Q11 -9 9 -15" stroke="#fbfbf6" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="9.4" cy="-15.5" r="2" fill="#fbfbf6"/><circle cx="9.8" cy="-17" r="1.1" fill="#d8282c"/><path d="M11 -15.5l5 1.2" stroke="#caa56a" stroke-width="1"/><path d="M-7 0l-8 5l5 -1z" fill="#2a2a2a"/><path d="M-3 4l-1 8M1 4l0 8" stroke="#444" stroke-width=".9"/></g>`;
  const sweets = (o) => { let q = ''; for (let i = 0; i < o.lvl * 3; i++) { const [x, y] = o.pick(), px = x + (o.rand() - .5) * 20, py = y + (o.rand() - .5) * 14, t = i % 3, cols = [['#e8344c', '#fff'], ['#2fb0d8', '#fff'], ['#f6c01c', '#fff'], ['#8a4cd0', '#fff']][i % 4];
    if (t === 0) q += `<path d="M${f(px)} ${f(py + 5)}L${f(px)} ${f(py + 14)}" stroke="#f4eadc" stroke-width="1.6"/><circle cx="${f(px)}" cy="${f(py)}" r="6" fill="${cols[0]}"/><path d="M${f(px)} ${f(py)}m0 -1.5a1.5 1.5 0 1 1 -1.5 1.5a3 3 0 1 1 3 -3a4.5 4.5 0 1 1 -4.5 4.5" stroke="${cols[1]}" stroke-width="1.2" fill="none"/>`;
    else if (t === 1) q += `<path d="M${f(px - 9)} ${f(py - 4)}l5 4l-5 4zM${f(px + 9)} ${f(py - 4)}l-5 4l5 4z" fill="${cols[0]}"/><ellipse cx="${f(px)}" cy="${f(py)}" rx="6" ry="4.4" fill="${cols[0]}" stroke="${cols[1]}" stroke-width=".9" stroke-dasharray="2 2"/>`;
    else q += `<path d="M${f(px)} ${f(py + 10)}L${f(px)} ${f(py - 2)}Q${f(px)} ${f(py - 9)} ${f(px + 5)} ${f(py - 6)}" stroke="#fff" stroke-width="2.6" fill="none"/><path d="M${f(px)} ${f(py + 8)}L${f(px)} ${f(py + 5)}M${f(px)} ${f(py + 1)}L${f(px)} ${f(py - 2)}M${f(px + 1)} ${f(py - 8.5)}L${f(px + 3)} ${f(py - 8)}" stroke="#e8344c" stroke-width="2.6" fill="none"/>`; } return q; };
  const sknob = (lvl) => '';
  const G = (a) => a;  // palettes dark -> light, one per level
  const SP = {
    birch: { h: 56, w: 8.5, bl: 36, depth: 4, n: 2, n0: 3, spread: 30, ratio: .74, up: .7, lean: 2, bark: ['#f2eee4', '#c8c2b4'], mark: 1, leaf: 'tri', size: 9.5, dens: 8, sp: 14,
      pal: [['#2f7d44', '#46a055', '#69bd68', '#92d880'], ['#3a8a46', '#5aa850', '#86c466', '#b0d878'], ['#8c8a30', '#b4ae3c', '#d6c64e', '#f0de78'], ['#a8501c', '#d4701e', '#f0982e', '#fcc862']], fall: 1 },
    maple: { h: 44, w: 13, bl: 34, depth: 3, n: 3, n0: 4, spread: 38, ratio: .76, up: .45, lean: -1, bark: ['#8a6a4c', '#4e382a'], rough: 1, leaf: 'maple', size: 14, dens: 6, sp: 17,
      pal: [['#2f7a2e', '#4a9a38', '#6cb848', '#9ad064'], ['#5a8a2c', '#8aa832', '#c6a830', '#e8c456'], ['#b04a1a', '#d86a22', '#f09030', '#fbbb4c'], ['#7e1816', '#b02a1c', '#dc4624', '#f27a3a']], fall: 1 },
    ginkgo: { h: 62, w: 9.5, bl: 38, depth: 4, n: 2, n0: 3, spread: 30, ratio: .74, up: .8, lean: 0, bark: ['#948c80', '#5c564c'], rough: 1, leaf: 'fan', size: 12.5, dens: 8, sp: 15,
      pal: [['#4a8a30', '#6aa83a', '#8cc44a', '#b4de6a'], ['#8ca832', '#b0c43c', '#d4d848', '#eee676'], ['#d6a418', '#eec028', '#f8d440', '#fde678'], ['#d48a0a', '#f0aa14', '#fbc82a', '#fee26a']], fall: 1, stone: 1 },
    cherry: { h: 38, w: 12, bl: 32, depth: 3, n: 3, n0: 3, spread: 46, ratio: .78, up: .3, lean: 4, bark: ['#6a4a40', '#33231e'], rough: 1, leaf: 'petal', size: 8, dens: 12, sp: 16,
      pal: [['#c8628a', '#e386a8', '#f4aec6', '#fddbe6'], ['#c8628a', '#e386a8', '#f4aec6', '#fddbe6'], ['#c8628a', '#e386a8', '#f4aec6', '#fddbe6'], ['#c8628a', '#e386a8', '#f4aec6', '#fddbe6']], greens: ['#4a8a3a', '#6aa84a'], fall: 3, fallc: ['#f4aec6', '#fddbe6'] },
    lemon: { h: 30, w: 11, bl: 30, depth: 3, n: 3, n0: 4, spread: 50, ratio: .76, up: .35, lean: 0, bark: ['#8a6a48', '#54402a'], rough: 1, leaf: 'oval', size: 12.5, dens: 8, sp: 17, fill: 1, fruit: ['#f6e24a', '#e4c420'], fr: 5.2,
      pal: [['#2e661e', '#468a26', '#68ac34', '#92cc4c']].concat([0, 0, 0].map(() => ['#2a601c', '#428426', '#62a632', '#8cc648'])) },
    tangerine: { h: 30, w: 11, bl: 30, depth: 3, n: 3, n0: 4, spread: 50, ratio: .76, up: .35, lean: 0, bark: ['#8a6a48', '#54402a'], rough: 1, leaf: 'oval', size: 12.5, dens: 8, sp: 17, fill: 1, fruit: ['#fa9a2a', '#e06a10'], fr: 5.8,
      pal: [0, 0, 0, 0].map(() => ['#1e5a30', '#2e7a3c', '#489a4c', '#6cba62']) },
    persimmon: { h: 42, w: 12, bl: 32, depth: 3, n: 2, n0: 3, spread: 54, ratio: .74, up: .1, lean: 20, bark: ['#6a5832', '#33291a'], rough: 1, leaf: 'oval', size: 16, dens: 5, sp: 20, fruit: ['#f66a22', '#d44010'], fr: 8.5, calyx: 1,
      pal: [0, 0, 0, 0].map(() => ['#245a4c', '#34806a', '#52a086', '#80c4a8']) },
    flowertree: { h: 36, w: 11, bl: 32, depth: 3, n: 3, n0: 4, spread: 48, ratio: .76, up: .35, lean: 0, bark: ['#8a6a48', '#54402a'], rough: 1, leaf: 'oval', size: 11, dens: 7, sp: 17, fill: 1, bloom: ['#ffffff', '#fff0f4'],
      pal: [0, 0, 0, 0].map(() => ['#2f7a3a', '#48a04a', '#6cc05c', '#98d880']) },
    wisteria: { h: 34, w: 12, bl: 34, depth: 3, n: 3, n0: 3, spread: 56, ratio: .8, up: .1, lean: 9, bark: ['#7a6050', '#3e2e26'], rough: 1, leaf: 'lance', size: 11, dens: 6, sp: 18, hang: 1,
      pal: [0, 0, 0, 0].map(() => ['#3a7a3a', '#58a048', '#80c062', '#a8d884']) },
    jacaranda: { h: 38, w: 12, bl: 34, depth: 3, n: 3, n0: 3, spread: 54, ratio: .8, up: .05, lean: 2, bark: ['#8a6c52', '#46322a'], rough: 1, leaf: 'round', size: 6.2, dens: 15, sp: 17, fill: 1, hat: 1,
      pal: [0, 0, 0, 0].map(() => ['#7a5cc4', '#9a80dc', '#bba6ee', '#e0d4fa']), greens: ['#4a8a58', '#6aa874'], fall: 4, fallc: ['#c7b6f2', '#a58fe6'] },

    apple: { h: 34, w: 12, bl: 30, depth: 3, n: 3, n0: 4, spread: 50, ratio: .76, up: .35, lean: 0, bark: ['#8a6a48', '#54402a'], rough: 1, leaf: 'oval', size: 12, dens: 8, sp: 17, fill: 1, fruit: ['#ee4a30', '#a82216'], fr: 5.6,
      pal: [0, 0, 0, 0].map(() => ['#2e6a24', '#47902f', '#6cb246', '#9ad26c']),
      deco: (o) => o.lvl >= 4 ? `<path d="M122 196h26l-3 10h-20z" fill="#a67c4a" stroke="#6a4a2a" stroke-width=".8"/><circle cx="129" cy="195" r="4.8" fill="#e03a28"/><circle cx="137" cy="193.5" r="4.8" fill="#f0503a"/><circle cx="145" cy="195" r="4.8" fill="#d82e22"/><path d="M122 199h26M123 202h24" stroke="#7a5a34" stroke-width=".8"/><circle cx="158" cy="205" r="4.4" fill="#e8402c"/>` : '' },
    osmanthus: { h: 34, w: 11, bl: 30, depth: 3, n: 3, n0: 4, spread: 50, ratio: .76, up: .35, lean: 3, bark: ['#8a6e50', '#4e3a2a'], rough: 1, leaf: 'lance', size: 10.5, dens: 9, sp: 17, fill: 1, bloom: ['#f9c850', '#fde7a0'], bc: '#e8962a', bn: 16, bs: 1.5,
      pal: [0, 0, 0, 0].map(() => ['#26602a', '#3e8a3c', '#62ae52', '#94cf78']) },
    camellia: { h: 24, w: 10, bl: 24, depth: 3, n: 3, n0: 4, spread: 56, ratio: .78, up: .25, lean: -2, bark: ['#7e6046', '#463426'], rough: 1, leaf: 'oval', size: 11, dens: 9, sp: 16, fill: 1, bloom: ['#d8203a', '#f4e8d2'], bcols: ['#d4203a', '#f6efe0', '#e0405a', '#fbf4e6'], bn: 6, bs: 4.2, bc: '#f4c020',
      pal: [0, 0, 0, 0].map(() => ['#1c4a28', '#2c6a3a', '#46904c', '#72b46c']) },
    plum: { h: 30, w: 12, bl: 26, depth: 4, n: 2, n0: 3, spread: 54, ratio: .82, up: .08, lean: 14, bark: ['#6a4a40', '#2a1a16'], rough: 1, leaf: 'petal', size: 5, dens: 8, sp: 15, bloom: ['#fff', '#fde8ee'], bcols: ['#f08aa6', '#f9c4d2', '#ffffff', '#e66c8e'], bn: 12, bs: 2.8, bc: '#f2c24a', fall: 3, fallc: ['#f9c4d2', '#fde8ee'], greens: ['#4a8a3a', '#6aa84a'],
      pal: [0, 0, 0, 0].map(() => ['#d0607e', '#e88aa2', '#f4b0c2', '#fde2e8']) },
    gtrumpet: { h: 38, w: 12, bl: 32, depth: 3, n: 3, n0: 3, spread: 54, ratio: .8, up: .05, lean: 3, bark: ['#8a6c52', '#46322a'], rough: 1, leaf: 'round', size: 6.2, dens: 15, sp: 17, fill: 1, fall: 4, fallc: ['#f6cc3a', '#e0a418'],
      pal: [['#3a7a30', '#5a9a40', '#8cbe4c', '#c8d85a'], ['#7a9a24', '#a6b82c', '#d0c42c', '#ecd648'], ['#c08c0e', '#e0aa18', '#f4c830', '#fcdf6a'], ['#d49a0e', '#f0b920', '#f8d444', '#fee78a']] },
    yoak: { h: 40, w: 15, bl: 32, depth: 3, n: 3, n0: 4, spread: 44, ratio: .78, up: .35, lean: 0, bark: ['#7a6046', '#3e2e22'], rough: 1, leaf: 'lobe', size: 13, dens: 8, sp: 18, fall: 4,
      pal: [['#2e6a26', '#4a8e34', '#72b048', '#a0d06a'], ['#7a9a2a', '#a8b432', '#cdc03a', '#e8d462'], ['#b88a14', '#d8a824', '#eec23e', '#f8dc74'], ['#c07a0a', '#e0a01a', '#f4c030', '#fcdc6c']] },
    willow: { h: 40, w: 14, bl: 30, depth: 3, n: 3, n0: 3, spread: 40, ratio: .8, up: .35, lean: 6, bark: ['#7a5e44', '#3a2a1e'], rough: 1, weep: 1, sp: 14, size: 7, dens: 1,
      pal: [['#4c7a28', '#6c9e34', '#98c248', '#c4de70'], ['#3e7a2a', '#5e9e3a', '#88c258', '#b4de80'], ['#2e6a2a', '#4a9038', '#74b450', '#a2d278'], ['#26602a', '#3e8636', '#66aa4c', '#94cc72']],
      under: (lvl) => lvl >= 3 ? `<ellipse cx="128" cy="204" rx="34" ry="7" fill="#6fb0c4"/><ellipse cx="124" cy="203" rx="22" ry="4" fill="#9ed4e0" opacity=".7"/><ellipse cx="150" cy="201" rx="5" ry="3" fill="#8d8d8a"/><ellipse cx="108" cy="205" rx="6" ry="3" fill="#a1a19c"/>` : '' },
    baobab: { h: 34, w: 28, bl: 28, depth: 2, n: 4, n0: 5, spread: 58, ratio: .78, up: .1, lean: 0, bark: ['#b9a58b', '#6b5a46'], rough: 1, leaf: 'oval', size: 9, dens: 8, sp: 15, fill: 1, bloom: ['#ffffff', '#fff6f6'], bn: 4, bs: 2.4,
      pal: [0, 0, 0, 0].map(() => ['#3a7a30', '#58a042', '#82c25c', '#aadc7c']),
      under: () => `<ellipse cx="62" cy="205" rx="6" ry="3" fill="#5a3e2a"/><ellipse cx="72" cy="207" rx="5" ry="2.6" fill="#6a4a34"/><path d="M134 196h18l-2 10h-14z" fill="#a67c4a" stroke="#6a4a2a" stroke-width=".7"/>` },
    cpine: { h: 28, w: 10, bl: 22, depth: 3, n: 2, n0: 2, spread: 58, ratio: .82, up: 0, lean: 20, bark: ['#b27a50', '#4e3224'], rough: 1, pad: 1, needle: 1, sp: 15, size: 8, dens: 1,
      pal: [0, 0, 0, 0].map(() => ['#1c4a2a', '#2c6a38', '#46904a', '#78b86a']),
      under: (lvl) => lvl >= 2 ? `<rect x="46" y="190" width="8" height="15" rx="1" fill="#8d8d88"/><path d="M42 190h16l-3 -6h-10z" fill="#a4a49e"/><rect x="48" y="184" width="4" height="6" fill="#7a7a76"/><path d="M44 205h12" stroke="#6e6e6a" stroke-width="2"/>` : '' },
    celestial: { h: 30, w: 13, bl: 26, depth: 3, n: 2, n0: 3, spread: 54, ratio: .8, up: .1, lean: 12, bark: ['#a98260', '#5a3e2c'], rough: 1, pad: 1, cloud: 1, sp: 14, size: 8, dens: 1,
      pal: [0, 0, 0, 0].map(() => ['#e8c4b8', '#f4dccf', '#fcece2', '#ffffff']),
      deco: (o) => { const t = o.tips.reduce((a, p) => p[1] < a[1] ? p : a, o.tips[0]); return o.lvl >= 4 ? crane(t[0] + 4, t[1] - 4) : ''; } },
    candy: { h: 34, w: 12, bl: 28, depth: 3, n: 3, n0: 3, spread: 50, ratio: .78, up: .2, lean: 0, bark: ['#e8c9a0', '#9a6c48'], pad: 1, cloud: 1, sp: 14, size: 8, dens: 1,
      pal: [0, 0, 0, 0].map(() => ['#ea78a4', '#f49cbc', '#fbc2d6', '#ffe4ee']), deco: sweets },
    starry: { h: 32, w: 11, bl: 28, depth: 3, n: 3, n0: 3, spread: 52, ratio: .78, up: .15, lean: 4, bark: ['#9a7658', '#4a3426'], rough: 1, pad: 1, cloud: 1, sp: 14, size: 8, dens: 1,
      pal: [0, 0, 0, 0].map(() => ['#1e2a7c', '#3048b0', '#4f70d6', '#86a2f2']),
      deco: (o) => { let q = ''; for (let i = 0; i < o.lvl * 3 + 1; i++) { const [x, y] = o.pick(); q += star(x + (o.rand() - .5) * 16, y + (o.rand() - .5) * 12, 3.6 + o.rand() * 3, i % 3 ? '#fbd23a' : '#fff0a0'); }
        if (o.lvl >= 4) q += `<g transform="translate(140 198)"><ellipse cx="0" cy="3" rx="15" ry="4.4" fill="#c85a9c"/><ellipse cx="0" cy="0" rx="15" ry="4.4" fill="#e482ba"/><path d="M-8 -1a8 7 0 0 1 16 0z" fill="#9ed8f2" stroke="#6ab4d8" stroke-width=".6"/><circle cx="-8" cy="1" r="1.2" fill="#fff6a0"/><circle cx="0" cy="1.8" r="1.2" fill="#fff6a0"/><circle cx="8" cy="1" r="1.2" fill="#fff6a0"/></g>`; return q; } },
    wishtree: { h: 38, w: 12, bl: 30, depth: 3, n: 3, n0: 3, spread: 52, ratio: .8, up: .1, lean: 3, bark: ['#8a7a68', '#463a30'], rough: 1, leaf: 'round', size: 6.4, dens: 14, sp: 17, fill: 1,
      pal: [0, 0, 0, 0].map(() => ['#8cc2e8', '#a8dcd0', '#f0b4cc', '#d0bef2']),
      deco: (o) => { let q = ''; for (let i = 0; i < o.lvl * 4 + 2; i++) { const [x, y] = o.pick(); q += glow(x + (o.rand() - .5) * 26, y + (o.rand() - .5) * 22, 1.4 + o.rand(), i % 2 ? '#ffd86a' : '#ffb0d0'); } return q; } },
    starburst: { h: 36, w: 12, bl: 30, depth: 3, n: 3, n0: 3, spread: 50, ratio: .78, up: .3, lean: 0, bark: ['#b49a74', '#5e4a34'], rough: 1, leaf: 'oval', size: 11, dens: 8, sp: 17, fill: 1,
      pal: [0, 0, 0, 0].map(() => ['#12484e', '#1c6c70', '#2e9090', '#58b8b0']),
      deco: (o) => { let q = ''; for (let i = 0; i < o.lvl * 3 + 1; i++) { const [x, y] = o.pick(), px = x + (o.rand() - .5) * 22, py = y + (o.rand() - .5) * 18, r = 6 + o.rand() * 4, c = i % 2 ? '#f4a08a' : '#bfeee8';
        for (let j = 0; j < 12; j++) { const a = j * Math.PI / 6; q += `<path d="M${f(px)} ${f(py)}L${f(px + Math.cos(a) * r)} ${f(py + Math.sin(a) * r)}" stroke="${c}" stroke-width="${j % 2 ? .9 : 1.5}" stroke-linecap="round"/>`; } q += `<circle cx="${f(px)}" cy="${f(py)}" r="1.8" fill="#fff4d8"/>`; } return q; } },
    spirit: { h: 34, w: 15, bl: 28, depth: 3, n: 3, n0: 3, spread: 50, ratio: .78, up: .15, lean: 22, bark: ['#b2a08c', '#5a4c3e'], rough: 1, leaf: 'round', size: 7, dens: 12, sp: 17, fill: 1,
      pal: [0, 0, 0, 0].map(() => ['#0e5a6a', '#1a8a96', '#3cb6b4', '#82dcd0']),
      deco: (o) => { let q = glow(98 + o.lean * .4, 206 - o.th * .55, 3 + o.lvl * 1.2, '#7ae8f0'); for (let i = 0; i < o.lvl * 3; i++) { const [x, y] = o.pick(); q += glow(x + (o.rand() - .5) * 30, y + (o.rand() - .5) * 26, 1 + o.rand() * .8, '#9af2f2'); } return q; } },
    unicorn: { h: 34, w: 12, bl: 28, depth: 3, n: 3, n0: 3, spread: 52, ratio: .8, up: .1, lean: 3, bark: ['#cdbfd8', '#7a6a8a'], pad: 1, cloud: 1, sp: 14, size: 8, dens: 1,
      pal: [0, 0, 0, 0].map(() => ['#c9a8e8', '#e0c4f2', '#f6dcf0', '#ffffff']),
      deco: (o) => { let q = ''; for (let i = 0; i < o.lvl * 3; i++) { const [x, y] = o.pick(), px = x + (o.rand() - .5) * 20, py = y + (o.rand() - .5) * 14, c = ['#f48ab8', '#8ab8f4', '#f4d86a', '#9ae0c0'][i % 4]; q += [0, 1, 2, 3, 4].map(j => `<circle cx="${f(px + Math.cos(j * 1.257) * 2.6)}" cy="${f(py + Math.sin(j * 1.257) * 2.6)}" r="2.2" fill="${c}"/>`).join('') + `<circle cx="${f(px)}" cy="${f(py)}" r="1.2" fill="#fff4b0"/>`; }
        if (o.lvl >= 3) { const t = o.tips.reduce((a, p) => p[1] < a[1] ? p : a, o.tips[0]), x = t[0] + 2, y = t[1] - 2; q += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="7" fill="#fffafc" stroke="#e6d8ee" stroke-width=".6"/><path d="M${f(x + 3)} ${f(y - 5)}l3 -10l2 11z" fill="#f4d86a"/><path d="M${f(x - 5)} ${f(y - 5)}l-2 -6l6 3z" fill="#fffafc"/><path d="M${f(x - 7)} ${f(y - 2)}q-5 3 -3 9q5 -2 7 -6z" fill="#f48ab8"/><path d="M${f(x - 1)} ${f(y - 1)}q2 1.6 4 0" stroke="#7a5a8a" stroke-width="1" fill="none"/>`; } return q; } },
    treehouse: { h: 42, w: 14, bl: 30, depth: 3, n: 3, n0: 3, spread: 50, ratio: .78, up: .3, lean: 0, bark: ['#8a6a48', '#54402a'], rough: 1, leaf: 'oval', size: 12, dens: 8, sp: 17, fill: 1,
      pal: [0, 0, 0, 0].map(() => ['#2e6a24', '#47902f', '#6cb246', '#9ad26c']),
      deco: (o) => { const y = 206 - o.th * .82, s = .6 + .4 * o.k; return `<g transform="translate(112 ${f(y)}) scale(${f(s)})"><rect x="-16" y="3" width="32" height="3.4" fill="#6a4a2a"/><rect x="-12" y="-14" width="24" height="17" fill="#c9965a" stroke="#6a4a2a" stroke-width=".8"/><path d="M-12 -8h24M-12 -3h24" stroke="#a87a44" stroke-width=".6"/><path d="M-15 -13L0 -26L15 -13z" fill="#b8503c" stroke="#7a2e22" stroke-width=".8"/><rect x="-4" y="-9" width="8" height="12" rx="4" fill="#4a3220"/><rect x="5" y="-11" width="5" height="5" fill="#bfe4f0" stroke="#6a4a2a" stroke-width=".6"/></g>` + (o.lvl >= 2 ? `<path d="M126 ${f(y + 5)}L128 205M132 ${f(y + 5)}L134 205" stroke="#8a6a3a" stroke-width="1.1"/>` + [0, 1, 2, 3, 4, 5].map(i => `<path d="M${f(126.3 + i * .4)} ${f(y + 9 + i * ((196 - y) / 6))}h6" stroke="#a88a50" stroke-width="1.4"/>`).join('') : ''); } },
    cuckoo: { h: 42, w: 15, bl: 30, depth: 3, n: 3, n0: 3, spread: 50, ratio: .78, up: .3, lean: 0, bark: ['#9a7650', '#54402a'], rough: 1, leaf: 'oval', size: 12, dens: 8, sp: 17, fill: 1,
      pal: [0, 0, 0, 0].map(() => ['#2e6a24', '#47902f', '#6cb246', '#9ad26c']),
      deco: (o) => { const y = 206 - o.th * .42, r = 7 + o.lvl * 1.2; return `<path d="M${f(100 - r - 3)} ${f(y - r)}L100 ${f(y - r - 8)}L${f(100 + r + 3)} ${f(y - r)}z" fill="#8a4a2a" stroke="#4e2a18" stroke-width=".8"/><circle cx="100" cy="${f(y)}" r="${f(r + 2.4)}" fill="#c9965a" stroke="#5a3a1e" stroke-width="1"/><circle cx="100" cy="${f(y)}" r="${f(r)}" fill="#fbf6e6" stroke="#8a6a3a" stroke-width=".7"/>` + [0, 1, 2, 3].map(i => `<path d="M${f(100 + Math.cos(i * 1.571) * r * .8)} ${f(y + Math.sin(i * 1.571) * r * .8)}L${f(100 + Math.cos(i * 1.571) * r * .62)} ${f(y + Math.sin(i * 1.571) * r * .62)}" stroke="#4a3220" stroke-width="1"/>`).join('') + `<path d="M100 ${f(y)}L100 ${f(y - r * .65)}M100 ${f(y)}L${f(100 + r * .42)} ${f(y + r * .15)}" stroke="#2a1c10" stroke-width="1.2" stroke-linecap="round"/><path d="M96 ${f(y + r + 2)}L96 ${f(y + r + 12)}M104 ${f(y + r + 2)}L104 ${f(y + r + 9)}" stroke="#7a6a3a" stroke-width=".8"/><ellipse cx="96" cy="${f(y + r + 15)}" rx="2.6" ry="4" fill="#8a5a2c"/><ellipse cx="104" cy="${f(y + r + 12)}" rx="2.6" ry="4" fill="#8a5a2c"/>` + (o.lvl >= 3 ? `<ellipse cx="100" cy="${f(y - r - 11)}" rx="4" ry="2.8" fill="#4a86c4"/><path d="M103 ${f(y - r - 12)}l4 .6l-4 1z" fill="#f2a22a"/>` : ''); } },
    nest: { h: 36, w: 12, bl: 30, depth: 3, n: 3, n0: 4, spread: 50, ratio: .76, up: .35, lean: 0, bark: ['#8a6a48', '#54402a'], rough: 1, leaf: 'oval', size: 12, dens: 8, sp: 17, fill: 1,
      pal: [0, 0, 0, 0].map(() => ['#2e6a24', '#47902f', '#6cb246', '#9ad26c']),
      deco: (o) => { if (o.lvl < 2) return ''; const x = o.mx + 8, y = o.my + 6; let q = `<ellipse cx="${f(x)}" cy="${f(y + 3)}" rx="13" ry="6" fill="#6a4a2a"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="13" ry="5.4" fill="#a8844a"/>`; for (let i = 0; i < 12; i++) q += `<path d="M${f(x - 12 + i * 2.2)} ${f(y + 1)}q${f(3 + o.rand() * 4)} ${f(-4 + o.rand() * 2)} ${f(8)} ${f(-1 + o.rand() * 3)}" stroke="${i % 2 ? '#7a5a30' : '#c4a064'}" stroke-width="1" fill="none"/>`;
        q += `<ellipse cx="${f(x)}" cy="${f(y - .6)}" rx="9" ry="3.3" fill="#7a5a34"/><ellipse cx="${f(x - 3)}" cy="${f(y - 2)}" rx="3.4" ry="2.6" fill="#a8d8e8"/><ellipse cx="${f(x + 3)}" cy="${f(y - 2)}" rx="3.4" ry="2.6" fill="#9ccfe0"/>`;
        if (o.lvl >= 4) q += `<ellipse cx="${f(x + 1)}" cy="${f(y - 7)}" rx="6.4" ry="5" fill="#4a86c4"/><circle cx="${f(x - 3)}" cy="${f(y - 11)}" r="3.6" fill="#5a98d6"/><path d="M${f(x - 6.4)} ${f(y - 11)}l-4 1l4 1.2z" fill="#f2a22a"/><circle cx="${f(x - 4)}" cy="${f(y - 11.6)}" r=".8" fill="#222"/><ellipse cx="${f(x + 3)}" cy="${f(y - 6)}" rx="3.6" ry="2" fill="#2e66a0"/>`; return q; } },
  };

  function build(id, lvl) {
    const S = SP[id], rand = R(hash(id) * 7 + lvl * 101), k = [.56, .72, .87, 1][lvl - 1], dk = [.4, .62, .84, 1][lvl - 1], depth = S.depth - (lvl < 3 ? 1 : 0), br = [], tips = [];
    const pal = S.pal[lvl - 1];
    function grow(x, y, ang, len, w, d, trunk) {
      const x2 = x + Math.sin(ang) * len, y2 = y - Math.cos(ang) * len, cx = (x + x2) / 2 + (rand() - .5) * len * (trunk ? .12 : .3), cy = (y + y2) / 2;
      br.push([x, y, cx, cy, x2, y2, w]);
      if (d === 0) { tips.push([x2, y2]); return; }
      const n = trunk ? S.n0 : S.n + (rand() < .35 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        let a = ang * .5 + S.spread * Math.PI / 180 * (n === 1 ? 0 : (i / (n - 1)) * 2 - 1) + (rand() - .5) * .45;
        a *= 1 - S.up * .18;
        grow(x2, y2, a, trunk ? S.bl * k * (.85 + rand() * .3) : len * S.ratio * (.82 + rand() * .36), w * .6, d - 1, false);
      }
    }
    grow(100, 206, S.lean * Math.PI / 180 * (.5 + k * .5), S.h * Math.pow(k, .7), S.w * (.55 + .45 * k), depth, true);
    let b = `<ellipse cx="100" cy="206" rx="${f(S.w * 1.5)}" ry="3.2" fill="${S.bark[1]}"/>`;
    if (S.under) b = S.under(lvl, k) + b;
    br.forEach(([x, y, cx, cy, x2, y2, w]) => {
      b += `<path d="M${f(x)} ${f(y)}Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}" stroke="${S.bark[1]}" stroke-width="${f(Math.max(.9, w))}" fill="none" stroke-linecap="round"/>`;
      if (w > 3.2) b += `<path d="M${f(x - w * .22)} ${f(y)}Q${f(cx - w * .22)} ${f(cy)} ${f(x2 - w * .2)} ${f(y2)}" stroke="${S.bark[0]}" stroke-width="${f(w * .42)}" fill="none" stroke-linecap="round" opacity=".9"/>`;
    });
    const t = br[0];
    for (let i = 0; i < 9; i++) { const u = .1 + i * .1, x = t[0] + (t[4] - t[0]) * u + (rand() - .5) * t[6] * .6, y = t[1] + (t[5] - t[1]) * u;
      b += S.mark ? `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(t[6] * (.14 + rand() * .26))}" ry="1.1" fill="#3b3833" opacity=".78"/>` : S.rough ? `<path d="M${f(x)} ${f(y)}l${f((rand() - .5) * 1.6)} ${f(5 + rand() * 5)}" stroke="${S.bark[1]}" stroke-width="1.2" opacity=".6"/>` : ''; }
    // canopy
    const mx = tips.reduce((a, p) => a + p[0], 0) / tips.length, my = tips.reduce((a, p) => a + p[1], 0) / tips.length;
    const hw = Math.max(...tips.map(p => Math.abs(p[0] - mx))) + S.sp, hh = Math.max(...tips.map(p => Math.abs(p[1] - my))) + S.sp;
    let c = '', leaves = [];
    const pc = (tx, ty) => {
      const pr = S.sp * (.8 + .45 * k); let q = '';
      if (S.cloud) { const bp = [[-.85, .12], [0, -.3], [.85, .12], [.05, .34]]; [[1.05, 0, 0], [.92, -.1, -.1], [.66, -.26, -.2], [.3, -.4, -.34]].forEach(([rr, ox, oy], pass) => bp.forEach(([bx, by]) => { q += `<circle cx="${f(tx + bx * pr * .9 + ox * pr * .4)}" cy="${f(ty + by * pr * .7 + oy * pr * .4)}" r="${f(pr * .78 * rr)}" fill="${pal[pass]}"/>`; })); }
      else { [[1.45, .8, .25, 0, 0], [1.28, .68, 0, -.12, 1], [.98, .5, -.12, -.25, 2], [.5, .26, -.22, -.38, 3]].forEach(([rx, ry, oy, ox, ci]) => { q += `<ellipse cx="${f(tx + ox * pr)}" cy="${f(ty + oy * pr)}" rx="${f(pr * rx)}" ry="${f(pr * ry)}" fill="${pal[ci]}"/>`; });
        if (S.needle) for (let i = 0; i < 16; i++) { const a = rand() * 6.283, rr = rand() * pr * 1.1; q += `<path d="M${f(tx + Math.cos(a) * rr)} ${f(ty + Math.sin(a) * rr * .5)}l${f((rand() - .5) * 6)} ${f(-2 - rand() * 2.5)}" stroke="${pal[i % 2 ? 0 : 3]}" stroke-width=".9" opacity=".8"/>`; } }
      return q;
    };
    const wp = (tx, ty) => { let q = ''; for (let j = 0; j < 3; j++) { const x0 = tx + (j - 1) * 6 + (rand() - .5) * 4, L = (22 + lvl * 8) * (.7 + rand() * .5), dx = (rand() - .5) * 7, col = pal[1 + (j % 2)];
        q += `<path d="M${f(x0)} ${f(ty)}C${f(x0 + dx * .3)} ${f(ty + L * .3)} ${f(x0 + dx)} ${f(ty + L * .7)} ${f(x0 + dx * .6)} ${f(ty + L)}" stroke="${pal[0]}" stroke-width="1" fill="none"/>`;
        for (let u = 3; u < L; u += 4.6) { const px = x0 + dx * (u / L) * .7 + (u % 9 < 4.6 ? 1.4 : -1.4); q += `<use href="#lf-lance" transform="translate(${f(px)} ${f(ty + u)}) rotate(${f(180 + (u % 9 < 4.6 ? 32 : -32))}) scale(${f(S.size * (.7 + rand() * .4))})" fill="${col}"/>`; } } return q; };
    tips.forEach(([tx, ty]) => {
      if (S.pad) { c += pc(tx, ty); return; }
      if (S.weep) { c += wp(tx, ty); return; }
      if (S.fill) c += `<circle cx="${f(tx)}" cy="${f(ty)}" r="${f(S.sp * .95 * (.6 + .4 * k))}" fill="${pal[0]}" opacity=".95"/>`;
      const m = Math.max(2, Math.round(S.dens * dk * (.7 + rand() * .7)));
      for (let i = 0; i < m; i++) {
        const dx = (rand() - .5) * 2 * S.sp, dy = (rand() - .5) * 1.6 * S.sp, x = tx + dx, y = ty + dy, outward = Math.atan2(x - mx, -(y - my));
        const li = clamp(.5 - (x - mx) / hw * .3 - (y - my) / hh * .4 + (rand() - .5) * .4, 0, .999);
        leaves.push([x, y, outward + (rand() - .5) * 1.7, S.size * (.72 + rand() * .55) * (lvl < 3 ? .88 : 1), li]);
      }
    });
    leaves.sort((p, q) => p[4] - q[4]);
    leaves.forEach(([x, y, a, s, li], i) => {
      let col = pal[Math.floor(li * pal.length)];
      if (S.greens && lvl === 1 && i % 3 === 0) col = S.greens[i % 2];
      if (S.greens && i % 11 === 0) col = S.greens[i % 2];
      c += `<use href="#lf-${S.leaf}" transform="translate(${f(x)} ${f(y)}) rotate(${f(a * 57.3)}) scale(${f(s)})" fill="${col}"/>`;
    });
    const pick = () => tips[Math.floor(rand() * tips.length)];
    if (S.fruit) for (let i = 0; i < lvl * 2 + 1; i++) { const [x, y] = pick(), fx = x + (rand() - .5) * 12, fy = y + 3 + rand() * 7;
      c += `<circle cx="${f(fx)}" cy="${f(fy)}" r="${S.fr}" fill="${S.fruit[1]}"/><circle cx="${f(fx - 1)}" cy="${f(fy - 1.2)}" r="${f(S.fr * .82)}" fill="${S.fruit[0]}"/><circle cx="${f(fx - S.fr * .35)}" cy="${f(fy - S.fr * .4)}" r="${f(S.fr * .22)}" fill="#fff" opacity=".55"/>` + (S.calyx ? `<path d="M${f(fx - 4)} ${f(fy - S.fr * .8)}l4 3l4-3l-2 4l-4 0z" fill="#3a7a3a"/>` : ''); }
    if (S.bloom) for (let i = 0; i < lvl * (S.bn || 9); i++) { const [x, y] = pick(), fx = x + (rand() - .5) * 26, fy = y + (rand() - .5) * 22, bs = S.bs || 2.1, cc = S.bcols ? S.bcols[i % S.bcols.length] : 0;
      c += [0, 1, 2, 3, 4].map(q => `<ellipse cx="${f(fx + Math.cos(q * 1.257) * bs * 1.1)}" cy="${f(fy + Math.sin(q * 1.257) * bs * 1.1)}" rx="${f(bs)}" ry="${f(bs)}" fill="${cc ? (q % 2 ? lt(cc, .35) : cc) : S.bloom[q % 2]}"/>`).join('') + `<circle cx="${f(fx)}" cy="${f(fy)}" r="${f(bs * .55)}" fill="${S.bc || '#f4c020'}"/>`; }
    if (S.hang) for (let i = 0; i < lvl * 4; i++) { const [x, y] = pick(), hx = x + (rand() - .5) * 14;
      for (let q = 0; q < 8; q++) c += `<circle cx="${f(hx + Math.sin(q) * .8)}" cy="${f(y + 4 + q * 4.6)}" r="${f(3.6 - q * .28)}" fill="${['#b7a0f2', '#9a80e4', '#c9b6fa'][q % 3]}"/>`; }
    if (S.deco) c += S.deco({ tips, lvl, k, rand, pick, mx, my, lean: S.lean, th: S.h * Math.pow(k, .7) });
    let g = `<ellipse cx="102" cy="206" rx="52" ry="6.5" fill="#8f918c" opacity=".45"/>`;
    for (let i = 0; i < (S.fall || 0) * lvl * 2; i++) g += `<ellipse cx="${f(54 + rand() * 96)}" cy="${f(203 + rand() * 6)}" rx="3.4" ry="1.7" fill="${(S.fallc || [pal[2], pal[1]])[i % 2]}" transform="rotate(${f(rand() * 60 - 30)} 100 205)"/>`;
    if (S.stone && lvl >= 3) c += `<rect x="130" y="188" width="13" height="17" rx="6" fill="#8a8a88"/><circle cx="136.5" cy="186" r="5" fill="#9a9a98"/>`;
    if (S.hat && lvl >= 4) g += `<ellipse cx="62" cy="204" rx="16" ry="4.6" fill="#d9b25c"/><ellipse cx="62" cy="199.5" rx="8" ry="5.6" fill="#ecc872"/><rect x="54" y="198" width="16" height="2.6" fill="#c4584a"/>`;
    const ext = Math.max(...tips.map(q => Math.abs(q[0] - 100))) + S.sp * 1.1, top = Math.min(...tips.map(q => q[1])) - S.sp, fit = Math.min(1, 96 / ext, 200 / (206 - top));
    return { ground: g, body: defs + `<g transform="translate(100 206) scale(${f(fit)}) translate(-100 -206)">${b}${c}</g>` };
  }
  Object.keys(SP).forEach(id => { window.CUSTOM[id] = (lvl) => build(id, lvl); });
})();
