/* birch.js - detailed White Birch (4 levels). Registers into CUSTOM; treeSVG() wraps it. */
window.CUSTOM = window.CUSTOM || {};
window.CUSTOM.birch = function (lvl) {
  const rand = R(311 + lvl * 17), f = (n) => n.toFixed(1);
  const P = [
    { leaf: ['#7fd07a', '#5bb765', '#9bdc86'], shade: '#2f7d46', mark: null, fall: 0 },
    { leaf: ['#78c874', '#55b061', '#a6d98a'], shade: '#2e7a45', mark: '#e49a3c', fall: 0 },
    { leaf: ['#e2d460', '#c4c850', '#f0c850'], shade: '#8c8a34', mark: '#e08a2c', fall: 1 },
    { leaf: ['#fbd066', '#f8b24c', '#fde08c'], shade: '#9a5430', mark: '#e0561c', fall: 2 },
  ][lvl - 1];
  const k = [.58, .74, .88, 1][lvl - 1], cx = 101, cy = 158 - 70 * k, rx = 58 * k, ry = 48 * k;
  // trunk: pale cream with grey patches, slight lean, flared roots
  let t = `<defs><linearGradient id="bt" x1="0" x2="1"><stop offset="0" stop-color="#d9d4c8"/><stop offset=".45" stop-color="#f7f3ea"/><stop offset="1" stop-color="#bdb6a8"/></linearGradient></defs>`;
  t += `<path d="M82 207 Q92 200 93 188 Q96 150 99 ${f(cy + 30)} L110 ${f(cy + 30)} Q109 150 112 188 Q113 200 124 207 Q104 211 82 207Z" fill="url(#bt)"/>`;
  for (let i = 0; i < 6; i++) {
    const y = 192 - i * 14 * Math.min(1.1, k + .2), w = 6 + rand() * 6, x = 95 + rand() * 6 + i * .4;
    t += `<path d="M${f(x)} ${f(y)} q${f(w / 2)} -3 ${f(w)} 0 q-2 4 ${f(-w)} 1z" fill="#5c5a54" opacity="${(.55 + rand() * .3).toFixed(2)}"/>`;
  }
  // branches into the canopy
  const br = [[-26, -8], [24, -14], [-8, -30], [14, 2]];
  for (const [dx, dy] of br) t += `<path d="M104 ${f(cy + 40)} Q${f(104 + dx * .4)} ${f(cy + 20 + dy)} ${f(104 + dx * k)} ${f(cy + dy * k)}" stroke="#e6e0d2" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M104 ${f(cy + 40)} Q${f(104 + dx * .4)} ${f(cy + 20 + dy)} ${f(104 + dx * k)} ${f(cy + dy * k)}" stroke="#7a766c" stroke-width="1" stroke-dasharray="3 6" fill="none"/>`;
  // canopy clumps, back (top) to front (bottom)
  const n = 11 + lvl * 5, cl = [];
  for (let i = 0; i < n; i++) { const a = rand() * 6.283, d = Math.sqrt(rand()); cl.push([cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, (13 + rand() * 7) * (.75 + k * .35)]); }
  cl.sort((a, b) => a[1] - b[1]);
  let c = '';
  for (const [x, y, r] of cl) {
    c += `<ellipse cx="${f(x + 1)}" cy="${f(y + r * .35)}" rx="${f(r * 1.05)}" ry="${f(r * .8)}" fill="${P.shade}"/>`;
    const m = 5 + (rand() * 2 | 0);
    for (let j = 0; j < m; j++) {
      const a = j / m * 6.283 + rand(), px = x + Math.cos(a) * r * .55, py = y - r * .12 + Math.sin(a) * r * .42;
      c += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(r * .55)}" ry="${f(r * .38)}" fill="${P.leaf[(rand() * 3) | 0]}" transform="rotate(${f(a * 57.3 + 90)} ${f(px)} ${f(py)})"/>`;
    }
    c += `<ellipse cx="${f(x - r * .15)}" cy="${f(y - r * .3)}" rx="${f(r * .5)}" ry="${f(r * .3)}" fill="${P.leaf[2]}" opacity=".85"/>`;
    if (P.mark && rand() < .55) c += `<rect x="${f(x + (rand() - .5) * r)}" y="${f(y - r * .2)}" width="2.4" height="${f(r * .5)}" rx="1.2" fill="${P.mark}" transform="rotate(${f(rand() * 40 - 20)} ${f(x)} ${f(y)})"/>`;
  }
  // ground: soft grey shadow + fallen leaves
  let g = `<ellipse cx="102" cy="206" rx="52" ry="6.5" fill="#8f918c" opacity=".45"/>`;
  for (let i = 0; i < P.fall * 7; i++) g += `<ellipse cx="${f(62 + rand() * 80)}" cy="${f(203 + rand() * 6)}" rx="${f(3 + rand() * 3)}" ry="1.8" fill="${i % 3 ? '#e07a2c' : '#e8b048'}" transform="rotate(${f(rand() * 60 - 30)} 100 205)"/>`;
  return { ground: g, body: t + c };
};
