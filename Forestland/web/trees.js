/* trees.js - every tree is a parameter set; treeSVG() draws any of its 4 levels. All art original. */
const R = (seed) => { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => ((s = s * 16807 % 2147483647) - 1) / 2147483646; };
const hash = (str) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// t = drawing type, pal = [fill, shade] per level 1..4, price in coins (0 = free starter)
const TREES = {
  birch:     { n: 'White Birch', t: 'round', price: 0, trunk: ['#ece8e0', '#bdb7ac'], marks: 1,
               pal: [['#62b25c', '#3f9148'], ['#58a853', '#3b8a47'], ['#cdc65e', '#a9a444'], ['#f6a83c', '#e07b2b']],
               q: 'Grows on through the cold, like focus taking root in every moment you give it.' },
  jacaranda: { n: 'Jacaranda', t: 'round', price: 0, trunk: ['#8a6a4a', '#5e452e'], blossom: '#fff', hat: 1,
               pal: [['#b9a2e8', '#8f72cf'], ['#b197e6', '#8566c9'], ['#a68ae0', '#7a58c2'], ['#9d7fdc', '#6f4cbc']],
               q: 'Purple blossoms gather slowly, one calm session at a time.' },
  sunflower: { n: 'Sunflower', t: 'bloom', kind: 'sun', price: 0, pal: [['#f6c21c', '#8a5a1c']],
               q: 'Turn toward your task the way it turns toward the light.' },
  lavender:  { n: 'Lavender', t: 'bloom', kind: 'spike', price: 0, pal: [['#9a78d6', '#6c4cae']],
               q: 'A quiet scent of calm for a long, steady stretch of work.' },
  cosmos:    { n: 'Cosmos', t: 'bloom', kind: 'daisy', price: 0, pal: [['#fff4f6', '#f08aa6']],
               q: 'Light petals, steady stems: small efforts add up.' },
  mushroom:  { n: 'Mushroom', t: 'mush', price: 0, pal: [['#e8453c', '#fff']],
               q: 'Good things grow in quiet corners.' },
  clover:    { n: 'Four-Leaf Clover', t: 'clover', price: 0, pal: [['#4cae4c', '#2e8a3c']],
               q: 'Luck favours the ones who stay put and keep going.' },
  cactus:    { n: 'Ball Cactus', t: 'cactus', price: 300, pal: [['#3f9a3f', '#2a7a2e']],
               q: 'Round, patient and tough. Needs very little to thrive.' },
  flowertree:{ n: 'Flower Tree', t: 'round', price: 300, trunk: ['#8a6a4a', '#5e452e'], blossom: '#fff', polygon: 1,
               pal: [['#62b25c', '#3f9148'], ['#5aae5a', '#3a8a46'], ['#52a858', '#348243'], ['#4aa056', '#2e7a40']],
               q: 'Every minute you finish opens another small bloom.' },
  lemon:     { n: 'Lemon Tree', t: 'round', price: 600, trunk: ['#8a6a4a', '#5e452e'], fruit: '#f3dc3a',
               pal: [['#74b83c', '#559a2c'], ['#6cb238', '#4f9428'], ['#64ac34', '#478a24'], ['#5ca630', '#3f8420']],
               q: 'Sharp focus makes the sweetest results.' },
  tangerine: { n: 'Tangerine Tree', t: 'round', price: 1200, trunk: ['#8a6a4a', '#5e452e'], fruit: '#f58a1f',
               pal: [['#3f9a50', '#2a7a3c'], ['#3a9449', '#277236'], ['#348e44', '#226a32'], ['#2e883e', '#1e642e']],
               q: 'A bright reward hangs from every finished hour.' },
  cherry:    { n: 'Cherry Blossom', t: 'round', price: 1200, trunk: ['#6a4838', '#47302a'], blossom: '#fff3f7',
               pal: [['#f8c6d6', '#ee9db8'], ['#f6b6cb', '#ea8aab'], ['#f4a6c0', '#e67a9f'], ['#f294b4', '#e06a92']],
               q: 'Spring comes to those who keep showing up.' },
  rose:      { n: 'Rose', t: 'bloom', kind: 'rose', price: 1200, pal: [['#e8384f', '#a81e34']],
               q: 'Beautiful work has thorns. Keep going anyway.' },
  persimmon: { n: 'Persimmon Tree', t: 'round', price: 2000, trunk: ['#5a4a2c', '#3a2e1a'], fruit: '#f0561c', bend: 1,
               pal: [['#4f9a7a', '#337a5e'], ['#4a9475', '#2f7459'], ['#448e70', '#2b6e54'], ['#3e886a', '#276850']],
               q: 'Ripens in its own time, and so does good work.' },
  maple:     { n: 'Maple', t: 'round', price: 2000, trunk: ['#6a4a34', '#44301f'], bench: 1,
               pal: [['#6db04a', '#4d9034'], ['#e6a73a', '#cc7f26'], ['#ef7a2c', '#d0551c'], ['#e8412a', '#b92a1c']],
               q: 'Even the changing of seasons is a kind of focus.' },
  ginkgo:    { n: 'Ginkgo', t: 'round', price: 2000, trunk: ['#4a4038', '#2e2822'], stone: 1,
               pal: [['#8cc04a', '#6aa034'], ['#c8cc3e', '#a4aa2a'], ['#f2c42a', '#d8a018'], ['#fbb81a', '#e08a0c']],
               q: 'Golden and unhurried. It has seen many seasons.' },
  wisteria:  { n: 'Wisteria', t: 'round', price: 2000, trunk: ['#6a5040', '#46342a'], strands: 1,
               pal: [['#9dd08a', '#6fae60'], ['#a9a0e4', '#8678cc'], ['#a08ae0', '#7a62c8'], ['#9478dc', '#6c52c0']],
               q: 'Hanging gardens grow from patient hours.' },
};
const TREE_IDS = Object.keys(TREES);
const STAGE_LABELS = ['≤55', '60–85', '90–115', '≥120 m'];

const circ = (x, y, r, f, extra = '') => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${f}" ${extra}/>`;
const groundShadow = '<ellipse cx="100" cy="205" rx="48" ry="7" fill="rgba(60,50,30,.18)"/>';

function bloomAt(kind, x, y, r, pal) {
  if (kind === 'sun') {
    let s = '';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += `<ellipse cx="${(x + Math.cos(a) * r * .8).toFixed(1)}" cy="${(y + Math.sin(a) * r * .8).toFixed(1)}" rx="${r * .38}" ry="${r * .2}" transform="rotate(${i * 30} ${(x + Math.cos(a) * r * .8).toFixed(1)} ${(y + Math.sin(a) * r * .8).toFixed(1)})" fill="${pal[0]}"/>`; }
    return s + circ(x, y, r * .5, pal[1]) + circ(x, y, r * .28, '#5a3a14');
  }
  if (kind === 'daisy') {
    let s = '';
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += circ(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, r * .42, i % 3 === 0 ? pal[1] : pal[0], 'opacity=".95"'); }
    return s + circ(x, y, r * .3, '#f6b21c');
  }
  if (kind === 'rose') return circ(x, y, r, pal[1]) + circ(x, y, r * .75, pal[0]) + circ(x - r * .1, y - r * .1, r * .45, pal[1]) + circ(x, y, r * .2, pal[0]);
  return '';
}

function drawBloom(def, lvl, rand) {
  const n = lvl + 1; let s = '';
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 100 : 100 - 34 + i * (68 / (n - 1)) + (rand() - .5) * 8;
    const h = 70 + lvl * 14 + rand() * 30 - Math.abs(i - (n - 1) / 2) * 6;
    const top = 205 - h;
    s += `<path d="M${x} 205 Q${x + (rand() - .5) * 14} ${205 - h / 2} ${x} ${top}" stroke="#3d9a46" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="${x + 9}" cy="${205 - h * .35}" rx="10" ry="4.5" fill="#4cae52" transform="rotate(-25 ${x + 9} ${205 - h * .35})"/>`;
    if (def.kind === 'spike') {
      for (let k = 0; k < 6 + lvl * 2; k++) { const yy = top + k * 6; s += `<ellipse cx="${x + (k % 2 ? 3 : -3)}" cy="${yy}" rx="4" ry="3.4" fill="${k % 3 ? def.pal[0][0] : def.pal[0][1]}"/>`; }
    } else s += bloomAt(def.kind, x, top, 11 + lvl * 2.6, def.pal[0]);
  }
  return s;
}

function drawMush(def, lvl, rand) {
  let s = '';
  for (let i = 0; i < lvl; i++) {
    const x = [100, 66, 134, 100][i], y = [205, 200, 202, 214 - 0][i] - (i === 3 ? 6 : 0), sc = [1.5, 1, 1.1, .8][i] * (1 + lvl * .05);
    s += `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M-7 0 Q-5 -26 -6 -30 L6 -30 Q5 -26 7 0Z" fill="#f2e6c8"/><path d="M-30 -28 Q-28 -62 0 -64 Q28 -62 30 -28 Q0 -22 -30 -28Z" fill="${def.pal[0][0]}"/>${circ(-12, -46, 5, '#fff')}${circ(10, -52, 4.5, '#fff')}${circ(14, -38, 3.5, '#fff')}${circ(-4, -34, 3, '#fff')}</g>`;
  }
  return s;
}

function drawClover(def, lvl, rand) {
  let s = '';
  const spots = [[100, 150], [66, 172], [134, 170], [100, 190], [84, 130]];
  for (let i = 0; i < lvl + 1; i++) {
    const [x, y] = spots[i];
    s += `<path d="M${x} 205 Q${x + 2} ${y + 20} ${x} ${y}" stroke="#2e8a3c" stroke-width="3" fill="none"/>`;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; s += circ(x + Math.cos(a) * 9, y + Math.sin(a) * 9 - 4, 9.5, k % 2 ? def.pal[0][0] : def.pal[0][1]); }
  }
  if (lvl >= 4) s += circ(100, 120, 6, '#f6d23a') + circ(86, 130, 4.5, '#f6d23a');
  return s;
}

function drawCactus(def, lvl) {
  const r = 26 + lvl * 4;
  let s = `<ellipse cx="100" cy="${205 - r * .8}" rx="${r}" ry="${r * .88}" fill="${def.pal[0][0]}"/>`;
  for (let i = -2; i <= 2; i++) s += `<path d="M${100 + i * r * .34} ${205 - r * 1.6} Q${100 + i * r * .5} ${205 - r * .8} ${100 + i * r * .34} 203" stroke="${def.pal[0][1]}" stroke-width="2.4" fill="none"/>`;
  for (let i = 0; i < 6 + lvl * 3; i++) { const x = 100 + ((i * 37) % 100 - 50) / 50 * r * .8, y = 205 - r * .8 + ((i * 53) % 100 - 50) / 50 * r * .7; s += `<path d="M${x - 3} ${y} L${x + 3} ${y} M${x} ${y - 3} L${x} ${y + 3}" stroke="#fff" stroke-width="1.3"/>`; }
  if (lvl >= 3) s += circ(100, 205 - r * 1.55, 9, '#f58ab0') + circ(100, 205 - r * 1.55, 4, '#ffd34a');
  if (lvl >= 4) s += `<ellipse cx="${100 + r + 8}" cy="198" rx="10" ry="9" fill="${def.pal[0][0]}"/>`;
  return s;
}

function drawRound(def, lvl, rand) {
  const [c1, c2] = def.pal[lvl - 1];
  let s = '';
  // trunk
  const bend = def.bend ? 12 : 0, tw = def.trunk;
  s += `<path d="M90 206 C${92 + bend} 176 ${94 - bend} 140 ${100 + bend} 100 L${110 + bend} 100 C${108 - bend} 140 ${110 + bend * 1.2} 176 112 206Z" fill="${tw[0]}"/>`;
  s += `<path d="M104 206 C105 176 106 140 ${108 + bend} 100 L${110 + bend} 100 C${108 - bend} 140 ${110 + bend * 1.2} 176 112 206Z" fill="${tw[1]}" opacity=".55"/>`;
  if (def.marks) for (let i = 0; i < 5; i++) s += `<rect x="${95 + (i % 2) * 3}" y="${118 + i * 16}" width="${8 + (i % 3) * 2}" height="2.4" rx="1.2" fill="#3a3630" opacity=".7"/>`;
  if (def.stone && lvl >= 3) s += `<rect x="128" y="186" width="14" height="18" rx="6" fill="#8a8a88"/>` + circ(135, 184, 5, '#9a9a98');
  if (def.bench && lvl >= 4) s += `<rect x="40" y="188" width="30" height="5" fill="#b88a58"/><rect x="42" y="176" width="26" height="4" fill="#b88a58"/><rect x="43" y="193" width="3" height="12" fill="#6a4a30"/><rect x="64" y="193" width="3" height="12" fill="#6a4a30"/>`;
  // canopy
  const n = 6 + lvl * 4, spread = 34 + lvl * 8, blobs = [];
  for (let i = 0; i < n; i++) {
    const a = rand() * 6.283, d = Math.sqrt(rand());
    blobs.push([100 + bend + Math.cos(a) * d * spread, 88 - lvl * 2 + Math.sin(a) * d * spread * .72, 15 + rand() * 9 + lvl * 2.2]);
  }
  blobs.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of blobs) s += def.polygon
    ? `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => (x + Math.cos(k * 1.047 + .3) * r * 1.1).toFixed(1) + ',' + (y + Math.sin(k * 1.047 + .3) * r * 1.1).toFixed(1)).join(' ')}" fill="${c2}"/>`
    : circ(x, y, r, c2);
  for (const [x, y, r] of blobs) s += def.polygon
    ? `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => (x - 2 + Math.cos(k * 1.047 + .3) * r * .8).toFixed(1) + ',' + (y - 2 + Math.sin(k * 1.047 + .3) * r * .8).toFixed(1)).join(' ')}" fill="${c1}"/>`
    : circ(x - 2.5, y - 2.5, r * .78, c1);
  const pick = () => blobs[Math.floor(rand() * blobs.length)];
  if (def.fruit) for (let i = 0; i < lvl * 2 + 1; i++) { const [x, y, r] = pick(); const fx = x + (rand() - .5) * r, fy = y + r * .5; s += circ(fx, fy, 6.5, def.fruit) + circ(fx - 2, fy - 2, 2.2, 'rgba(255,255,255,.4)') + `<path d="M${fx - 3} ${fy - 6} l3 -2 l3 2" stroke="#3a7a2e" stroke-width="1.6" fill="none"/>`; }
  if (def.blossom) for (let i = 0; i < lvl * 5; i++) { const [x, y, r] = pick(); s += circ(x + (rand() - .5) * r * 1.4, y + (rand() - .5) * r * 1.4, 2.6 + rand() * 1.4, def.blossom, 'opacity=".9"'); }
  if (def.strands) for (let i = 0; i < lvl * 3; i++) { const [x, y, r] = pick(); const L = 14 + rand() * 18; s += `<path d="M${x.toFixed(1)} ${(y + r * .6).toFixed(1)} l0 ${L.toFixed(1)}" stroke="${i % 2 ? '#b4a2ee' : '#8e78d8'}" stroke-width="4" stroke-linecap="round" stroke-dasharray="4 3"/>`; }
  if (def.hat && lvl >= 4) s += `<ellipse cx="146" cy="203" rx="14" ry="4.5" fill="#e8c878"/><ellipse cx="146" cy="199" rx="7" ry="5" fill="#f0d68c"/><rect x="139" y="198" width="14" height="2.4" fill="#c0584a"/>`;
  if (def.hat || def.blossom) for (let i = 0; i < lvl * 3; i++) s += `<ellipse cx="${60 + rand() * 80}" cy="${203 + rand() * 4}" rx="3" ry="1.4" fill="${def.pal[3][0]}" opacity=".8"/>`;
  return s;
}

/** Draw tree `id` at level 1-4. opts.scale shrinks it toward the ground (growth). opts.attr adds svg attributes. */
function treeSVG(id, lvl = 4, opts = {}) {
  const d = TREES[id]; lvl = Math.max(1, Math.min(4, lvl));
  if (typeof CUSTOM !== 'undefined' && CUSTOM[id]) { const c = CUSTOM[id](lvl), sc2 = opts.scale || 1; return `<svg viewBox="0 0 200 220" ${opts.attr || ''} xmlns="http://www.w3.org/2000/svg">${opts.noShadow ? '' : c.ground}<g transform="translate(100 205) scale(${sc2}) translate(-100 -205)">${c.body}</g></svg>`; }
  const rand = R(hash(id) + lvl * 7);
  const body = { round: drawRound, bloom: drawBloom, mush: drawMush, clover: drawClover, cactus: drawCactus }[d.t](d, lvl, R(hash(id)));
  const sc = opts.scale || 1;
  return `<svg viewBox="0 0 200 220" ${opts.attr || ''} xmlns="http://www.w3.org/2000/svg">${opts.noShadow ? '' : groundShadow}<g transform="translate(100 205) scale(${sc}) translate(-100 -205)">${body}</g></svg>`;
}

function sproutSVG(attr = '') {
  return `<svg viewBox="0 0 200 220" ${attr} xmlns="http://www.w3.org/2000/svg">${groundShadow}<path d="M100 206 Q102 180 100 150" stroke="#3d8a6e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M100 160 Q80 158 74 140 Q92 138 100 156Z" fill="#2f7a5e"/><path d="M101 150 Q124 150 132 130 Q108 128 101 146Z" fill="#4fae8e"/><path d="M100 176 Q116 176 122 164 Q104 160 100 172Z" fill="#3a9a7c"/></svg>`;
}

function witheredSVG(attr = '') {
  return `<svg viewBox="0 0 200 220" ${attr} xmlns="http://www.w3.org/2000/svg">${groundShadow}<path d="M92 206 C96 170 94 140 100 112 L110 112 C108 140 112 176 114 206Z" fill="#4a3f28"/><g stroke="#4a3f28" stroke-width="6" stroke-linecap="round" fill="none"><path d="M102 130 L70 98"/><path d="M106 124 L132 90"/><path d="M104 112 L96 70"/><path d="M110 150 L140 134"/></g><ellipse cx="75" cy="102" rx="5" ry="9" fill="#5a8a6a" transform="rotate(-40 75 102)"/>${circ(150, 200, 8, '#e2531c')}${circ(147, 197, 2.5, 'rgba(255,255,255,.35)')}</svg>`;
}
