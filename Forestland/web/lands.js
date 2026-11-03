/* lands.js - isometric land styles. landSVG() draws a land with optional planted trees. */
const LANDS = {
  lime:     { n: 'Lime Carpet',      price: 0,    top: ['#fffbb8', '#fcf48e'], l: '#8fb832', r: '#a9cc44', acc: 'flowers', accC: ['#f6a43a', '#fff4c0'],
              q: 'Step into vibrant greenery and brighten your forest with a splash of sunshine.' },
  blossom:  { n: 'Blossoming Turf',  price: 2000,  top: ['#8ad05a', '#6cba46'], l: '#d8c08a', r: '#ead4a0', acc: 'flowers', accC: ['#ffffff', '#f7d94a', '#f59ac0'],
              q: 'Fresh green grass dotted with tiny flowers.' },
  cotton:   { n: 'Cotton Puddles',   price: 2500,  top: ['#fdebc6', '#f8dfae'], l: '#1f6a3a', r: '#2e8a4a', acc: 'puddles',
              q: 'Soft, fluffy ground welcomes every new sprout.' },
  spring:   { n: 'Spring Meadow',    price: 3000,  top: ['#a8e07a', '#8ccc62'], l: '#5aa83c', r: '#72c04c', acc: 'flowers', accC: ['#f7a8c8', '#ffffff', '#c8a8f0'],
              q: 'A meadow in the first warm days of the year.' },
  autumn:   { n: 'Autumn Leaves',    price: 3500,  top: ['#eab060', '#dc9a48'], l: '#9a5a2a', r: '#b8743a', acc: 'leaves',
              q: 'A crunchy carpet for slow, golden afternoons.' },
  winter:   { n: 'Winter Snow',      price: 4000, top: ['#fafdff', '#e4eef6'], l: '#a9c4d8', r: '#c4dae9', acc: 'dots', accC: ['#d6e6f2'],
              q: 'Quiet white ground. Perfect for deep, still focus.' },
  wetland:  { n: 'Wetland',          price: 4500, top: ['#9cc884', '#82b46c'], l: '#4a7a58', r: '#5e9468', acc: 'puddles', accC: ['#78bde0'],
              q: 'Shallow pools and soft reeds.' },
  desert:   { n: 'Desert Dunes',     price: 5000, top: ['#f6d896', '#eac37a'], l: '#c08a48', r: '#d6a05c', acc: 'dots', accC: ['#e2b266'],
              q: 'Warm sand rippling toward the horizon.' },
  hills:    { n: 'Rolling Hills',    price: 6000, top: ['#7cc462', '#68b050'], l: '#3f8a3a', r: '#52a448', acc: 'mounds',
              q: 'Gentle slopes that make every tree look taller.' },
  night:    { n: 'Night Sky',        price: 8000, top: ['#34447a', '#283568'], l: '#161e44', r: '#1f2a58', acc: 'stars',
              q: 'Plant under the stars.' },
};
const LAND_IDS = Object.keys(LANDS);
// base positions (iso, in a 400x300 box) used for planted trees, in planting order
const SPOTS = [[200, 124], [150, 152], [250, 152], [200, 180]];

function landSVG(id, trees = [], o = {}) {
  const L = LANDS[id], rnd = R(hash(id) + 3), uid = 'g' + id + (o.k || '');
  const P = (u, v) => [200 + 180 * (u - v), 50 + 90 * (u + v)];
  let acc = '';
  const count = L.acc === 'stars' ? 26 : L.acc === 'dots' ? 30 : L.acc === 'mounds' ? 6 : 16;
  for (let i = 0; i < count; i++) {
    const [x, y] = P(.08 + rnd() * .84, .08 + rnd() * .84);
    if (L.acc === 'flowers') acc += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${L.accC[i % L.accC.length]}"/>`;
    else if (L.acc === 'puddles') acc += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${14 + rnd() * 8}" ry="${4.5 + rnd() * 2}" fill="${(L.accC || ['#a8d8f0'])[0]}" opacity=".85"/>`;
    else if (L.acc === 'leaves') acc += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="2.4" fill="${['#c8402a', '#e8802a', '#f2b030'][i % 3]}" transform="rotate(${rnd() * 180 | 0} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    else if (L.acc === 'stars') acc += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${1 + rnd() * 1.6}" fill="#fff6c0"/>`;
    else if (L.acc === 'mounds') acc += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="22" ry="8" fill="#5aa448" opacity=".55"/>`;
    else acc += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${3 + rnd() * 5}" ry="1.6" fill="${L.accC[0]}" opacity=".7"/>`;
  }
  const spots = o.spots || SPOTS, sz = o.size || 116, sorted = trees.map((t, i) => ({ ...t, p: spots[i % spots.length] })).sort((a, b) => a.p[1] - b.p[1]);
  const big = sorted.length > 40, sym = {};
  const key = (t) => t.w ? 'w' : t.id + t.lvl, inner = (t) => (t.w ? witheredSVG() : treeSVG(t.id, t.lvl)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  if (big) sorted.forEach(t => { if (!sym[key(t)]) sym[key(t)] = `<symbol id="s${uid}${key(t)}" viewBox="0 0 200 220">${inner(t)}</symbol>`; });
  const tr = (big ? `<defs>${Object.values(sym).join('')}</defs>` : '') + sorted.map(t => { if (big) return `<use href="#s${uid}${key(t)}" x="${(t.p[0] - sz / 2).toFixed(1)}" y="${(t.p[1] - sz * 1.017).toFixed(1)}" width="${sz}" height="${(sz * 1.103).toFixed(1)}"/>`; const at = `x="${(t.p[0] - sz / 2).toFixed(1)}" y="${(t.p[1] - sz * 1.017).toFixed(1)}" width="${sz}" height="${(sz * 1.103).toFixed(1)}"`; return t.w ? witheredSVG(at) : treeSVG(t.id, t.lvl, { attr: at }); }).join('');
  return `<svg viewBox="0 0 400 300" ${o.attr || ''} xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.top[0]}"/><stop offset="1" stop-color="${L.top[1]}"/></linearGradient></defs>
<polygon points="20,140 200,230 200,278 20,188" fill="${L.l}"/><polygon points="200,230 380,140 380,188 200,278" fill="${L.r}"/>
<polygon points="200,50 380,140 200,230 20,140" fill="url(#${uid})" stroke="${L.top[1]}" stroke-width="6" stroke-linejoin="round"/>${acc}${tr}</svg>`;
}

/** Iso grid of base positions for n trees (used by Overview). Returns {spots,size}. */
function gridSpots(n, minSide = 2) {
  const side = Math.max(minSide, Math.ceil(Math.sqrt(n))), spots = [];
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) { const u = .1 + .8 * (i + .5) / side, v = .1 + .8 * (j + .5) / side; spots.push([200 + 180 * (u - v), 50 + 90 * (u + v) + 6]); }
  return { spots, size: Math.max(22, Math.min(116, 330 / side)) };
}
