/* flora.js - detailed Jacaranda, Sunflower, Cosmos and Lavender (4 levels each). Registered in CUSTOM. */
window.CUSTOM = window.CUSTOM || {};
(function () {
  const f = (n) => n.toFixed(1), K = [.6, .76, .9, 1];
  const shadow = (extra = '') => `<ellipse cx="102" cy="206" rx="50" ry="6.5" fill="#8f918c" opacity=".42"/>${extra}`;
  const flower = (x, y, r, n, c1, c2, mid, rot = 0) => {
    let s = '';
    for (let i = 0; i < n; i++) s += `<ellipse cx="${f(x)}" cy="${f(y - r * (n > 9 ? .58 : .55))}" rx="${f(r * (n > 9 ? .2 : .47))}" ry="${f(r * (n > 9 ? .6 : .46))}" fill="${i % 2 ? c2 : c1}" transform="rotate(${f(rot + i * 360 / n)} ${f(x)} ${f(y)})"/>`;
    return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .3)}" fill="${mid}"/>`;
  };
  const leaf = (x, y, w, ang, c = '#4aa84f', d = '#2f8a3e') => `<path d="M${f(x)} ${f(y)} q${f(w * .5)} ${f(-w * .5)} ${f(w)} 0 q${f(-w * .5)} ${f(w * .42)} ${f(-w)} 0z" fill="${c}" transform="rotate(${ang} ${f(x)} ${f(y)})"/><path d="M${f(x)} ${f(y)} l${f(w * .9)} -1" stroke="${d}" stroke-width="1" transform="rotate(${ang} ${f(x)} ${f(y)})"/>`;

  window.CUSTOM.jacaranda = function (lvl) {
    const r = R(900 + lvl * 13), k = K[lvl - 1], cy = 150 - 62 * k, rx = 70 * k, ry = 42 * k;
    let t = `<defs><linearGradient id="jt" x1="0" x2="1"><stop offset="0" stop-color="#9a7a5c"/><stop offset="1" stop-color="#4e362a"/></linearGradient></defs>`;
    t += `<path d="M86 207 Q96 198 96 184 Q96 150 94 ${f(cy + 40)} L110 ${f(cy + 40)} Q108 150 110 184 Q112 198 124 207 Q104 211 86 207Z" fill="url(#jt)"/>`;
    for (const [dx, dy, w] of [[-36, -6, 6], [34, -10, 6], [-12, -30, 5], [14, -26, 5], [0, -4, 5]]) t += `<path d="M102 ${f(cy + 48)} Q${f(102 + dx * .35)} ${f(cy + 30 + dy * .3)} ${f(102 + dx * k)} ${f(cy + dy * k)}" stroke="#6a4c38" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    let c = '';
    const masses = [];
    for (let i = 0; i < 10 + lvl * 5; i++) { const a = r() * 6.283, d = Math.sqrt(r()); masses.push([100 + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, (13 + r() * 9) * (.7 + k * .4)]); }
    masses.sort((a, b) => a[1] - b[1]);
    masses.forEach(([x, y, m], i) => { c += `<ellipse cx="${f(x)}" cy="${f(y + 2)}" rx="${f(m)}" ry="${f(m * .78)}" fill="${['#8a72d2', '#9a82dc', '#7c64c8'][i % 3]}"/>`; });
    for (let i = 0; i < 6; i++) c += leaf(100 + (r() - .5) * rx * 1.4, cy + (r() * .6 + .1) * ry, 9, r() * 360, '#5fa89a', '#3a7a70');
    for (let i = 0; i < 55 + lvl * 38; i++) {
      const a = r() * 6.283, d = Math.sqrt(r()), x = 100 + Math.cos(a) * d * rx * 1.02, y = cy + Math.sin(a) * d * ry * 1.02 - (r() * 3);
      const col = ['#cdbdf6', '#e4dafc', '#b8a2f0', '#a38aea', '#f2ecff'][(r() * 5) | 0], s = 2 + r() * 2.1;
      c += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${col}"/>` + (r() < .3 ? `<circle cx="${f(x + .6)}" cy="${f(y + .4)}" r="${f(s * .35)}" fill="#7e66c6"/>` : '');
    }
    let g = shadow();
    for (let i = 0; i < lvl * 5 + 3; i++) g += `<ellipse cx="${f(50 + r() * 100)}" cy="${f(203 + r() * 6)}" rx="3.2" ry="1.6" fill="${i % 2 ? '#c7b6f2' : '#a58fe6'}" transform="rotate(${f(r() * 60 - 30)} 100 205)"/>`;
    if (lvl >= 4) g += `<ellipse cx="62" cy="204" rx="16" ry="4.6" fill="#d9b25c"/><ellipse cx="62" cy="199.5" rx="8" ry="5.6" fill="#ecc872"/><rect x="54" y="198" width="16" height="2.6" fill="#c4584a"/>`;
    return { ground: g, body: t + c };
  };

  window.CUSTOM.sunflower = function (lvl) {
    const r = R(500 + lvl), plan = [[100, 74, 17], [66, 114, 12], [136, 108, 11.5]].slice(0, Math.min(3, lvl + (lvl > 1 ? 0 : 0))), k = [.7, .85, .95, 1][lvl - 1];
    let s = `<defs><radialGradient id="sf"><stop offset="0" stop-color="#ffe43a"/><stop offset="1" stop-color="#f4a200"/></radialGradient></defs>`;
    const list = lvl === 1 ? [[100, 104, 14]] : lvl === 2 ? [[100, 84, 17], [70, 120, 11]] : [[100, 68, 20], [64, 116, 13.5], [138, 108, 13]];
    list.forEach(([x, y, rad], i) => {
      const rr = rad * (lvl === 4 ? 1.08 : 1);
      s += `<path d="M${i ? (i === 1 ? 92 : 108) : 100} 206 Q${f(x + (i - 1) * 6)} ${f((206 + y) / 2)} ${x} ${y}" stroke="#3d9a46" stroke-width="${i ? 3.4 : 4.4}" fill="none" stroke-linecap="round"/>`;
      s += leaf(x, (206 + y) / 2 + 8, 22 - i * 3, i % 2 ? -150 : -30) + leaf(x, (206 + y) / 2 + 24, 20 - i * 3, i % 2 ? -30 : -150);
    });
    list.forEach(([x, y, rad], i) => {
      const rr = rad * (lvl === 4 ? 1.08 : 1);
      s += flower(x, y, rr * 1.9, 14, 'url(#sf)', '#f8b800', '#6a3a12', i * 10) + flower(x, y, rr * 1.45, 12, '#ffd21e', '#ffc000', '#6a3a12', 15);
      s += `<circle cx="${x}" cy="${y}" r="${f(rr * .56)}" fill="#7a4a16"/><circle cx="${x}" cy="${y}" r="${f(rr * .4)}" fill="#4e2a0c"/>`;
      for (let d = 0; d < 9; d++) { const a = d * 2.4, q = rr * .06 * d + 1; s += `<circle cx="${f(x + Math.cos(a) * q * 1.9)}" cy="${f(y + Math.sin(a) * q * 1.9)}" r="1.3" fill="#a8742a"/>`; }
    });
    return { ground: shadow(), body: s };
  };

  window.CUSTOM.cosmos = function (lvl) {
    const r = R(700 + lvl), n = lvl + 2, cols = [['#fffdf8', '#f6e6ec'], ['#fff6f0', '#ffd6dc'], ['#ffffff', '#f7c4cf'], ['#fff2e6', '#f6a6a0']];
    let s = '';
    const xs = [100, 66, 134, 82, 120, 52];
    for (let i = 0; i < n; i++) {
      const x = xs[i], y = [92, 112, 106, 138, 130, 150][i] - lvl * 2, top = y;
      s += `<path d="M${100 + (x - 100) * .4} 206 Q${f(x + (r() - .5) * 8)} ${f((206 + top) / 2)} ${x} ${top}" stroke="#4aa24e" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${f(x - 2)} ${f((206 + top) / 2 + 14)} q-8 -4 -14 2 M${f(x + 2)} ${f((206 + top) / 2 + 24)} q8 -4 14 2" stroke="#4aa24e" stroke-width="1.6" fill="none"/>`;
    }
    for (let i = n - 1; i >= 0; i--) {
      const x = xs[i], y = [92, 112, 106, 138, 130, 150][i] - lvl * 2, rad = [17, 14, 14, 11, 11, 10][i] * (.85 + lvl * .06), c = cols[(i + lvl) % 4];
      s += flower(x, y, rad * 1.5, 8, c[0], c[1], '#f4b01c', i * 18) + `<circle cx="${x}" cy="${y}" r="${f(rad * .26)}" fill="#f4b01c"/><circle cx="${x - 1}" cy="${y - 1}" r="${f(rad * .12)}" fill="#e08a10"/>`;
    }
    if (lvl >= 3) s += `<circle cx="${xs[n - 1] + 18}" cy="170" r="5" fill="#fff2b0"/><circle cx="76" cy="176" r="4" fill="#fbd0d6"/>`;
    return { ground: shadow(), body: s };
  };

  window.CUSTOM.lavender = function (lvl) {
    const r = R(300 + lvl), n = 4 + lvl * 4;
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = 100 + (i - (n - 1) / 2) * (110 / n) * 1.25 + (r() - .5) * 6, h = 66 + r() * 34 + lvl * 8 - Math.abs(i - n / 2) * 2, top = 206 - h, lean = (x - 100) * .22;
      s += `<path d="M${f(100 + (x - 100) * .35)} 206 Q${f(x + lean)} ${f(206 - h * .5)} ${f(x + lean * 1.3)} ${f(top)}" stroke="${i % 2 ? '#6aa060' : '#7ab070'}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      const bx = x + lean * 1.3, m = 7 + ((r() * 3) | 0) + lvl;
      for (let k = 0; k < m; k++) {
        const yy = top + k * 4.7, w = 2.7 + (k < 2 ? -.9 : 0), c = ['#9b79d8', '#8a66cc', '#b494ea', '#7a58bc'][(k + i) % 4];
        s += `<ellipse cx="${f(bx - 2.4)}" cy="${f(yy)}" rx="${f(w)}" ry="2.7" fill="${c}"/><ellipse cx="${f(bx + 2.4)}" cy="${f(yy + 2)}" rx="${f(w)}" ry="2.7" fill="${c}"/>`;
      }
    }
    for (let i = 0; i < 6 + lvl * 3; i++) s += `<path d="M${f(100 + (r() - .5) * 60)} 206 q${f((r() - .5) * 20)} -16 ${f((r() - .5) * 36)} -${f(22 + r() * 16)}" stroke="#8fb88a" stroke-width="1.6" fill="none"/>`;
    let g = shadow();
    for (let i = 0; i < lvl * 4; i++) g += `<ellipse cx="${f(54 + r() * 92)}" cy="${f(203 + r() * 6)}" rx="2.4" ry="1.3" fill="${i % 2 ? '#a688e0' : '#8566cc'}"/>`;
    return { ground: g, body: s };
  };
})();
