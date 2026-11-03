/* records.js - Stage 2: Overview, Planting Record, Timeline, Focus Challenge, Achievements. */
const DAY = 86400000, MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], MS = MONTHS.map(m => m.slice(0, 3)), WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const OFF = () => { const [h, m] = S.settings.dayStart.split(':').map(Number); return (h * 60 + m) * 60000; };
const ld = (ts) => { const d = new Date(ts - OFF()); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };   // logical day
const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const ok = () => S.sessions.filter(s => s.status === 'ok');
const hhmm = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const longTime = (min) => { min = Math.round(min); return `${min / 60 | 0} hours ${min % 60} minutes`; };
const sdate = (d) => `${MS[d.getMonth()]} ${d.getDate()}`;

/* ================= Overview ================= */
let ovP = 'week', ovAnchor = null, ovRange = null;
function range() {
  const t = ovAnchor || ld(Date.now()); let a, b, label;
  if (ovP === 'day') { a = t; b = addDays(t, 1); label = `${sdate(t)}, ${t.getFullYear()}`; }
  else if (ovP === 'week') { a = addDays(t, -((t.getDay() - S.settings.firstDay + 7) % 7)); b = addDays(a, 7); const e = addDays(b, -1); label = `${sdate(a)} – ${sdate(e)}, ${e.getFullYear()}`; }
  else if (ovP === 'month') { a = new Date(t.getFullYear(), t.getMonth(), 1); b = new Date(t.getFullYear(), t.getMonth() + 1, 1); label = `${MONTHS[a.getMonth()]} ${a.getFullYear()}`; }
  else if (ovP === 'year') { a = new Date(t.getFullYear(), 0, 1); b = new Date(t.getFullYear() + 1, 0, 1); label = String(a.getFullYear()); }
  else { a = new Date($('#cFrom').value + 'T00:00') ; b = addDays(new Date($('#cTo').value + 'T00:00'), 1); if (isNaN(a) || isNaN(b) || b <= a) { a = addDays(ld(Date.now()), -6); b = addDays(ld(Date.now()), 1); } label = `${sdate(a)} – ${sdate(addDays(b, -1))}`; }
  return { a, b, label };
}
const inRange = (s, r) => { const d = ld(s.start); return d >= r.a && d < r.b; };

/* ================= accurate focus data + charts ================= */
/* Every session is cut into the real hours and days it covered, so a session over midnight or across an hour boundary is never counted wholly in the hour or day it started. */
const spansOf = (s) => (s.iv && s.iv.length) ? s.iv : [[s.start, s.start + (s.focusSec || 0) * 1000]];
function eachPiece(s, fn) {
  for (let [a, e] of spansOf(s)) while (a < e) { const d = new Date(a), nh = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime(), b = Math.min(e, nh, nextDay(a)); fn(ld(a), d.getHours(), (b - a) / 60000); a = b; }
}
function agg(r) {
  const day = new Map(), hour = Array(24).fill(0), wd = Array(7).fill(0); let total = 0;
  for (const s of S.sessions) { if (s.start >= +r.b + DAY || (s.end || s.start) < +r.a - DAY) continue;
    eachPiece(s, (d, h, m) => { if (d < r.a || d >= r.b) return; const k = dkey(d); day.set(k, (day.get(k) || 0) + m); hour[h] += m; wd[(d.getDay() - S.settings.firstDay + 7) % 7] += m; total += m; }); }
  return { day, hour, wd, total };
}
const weekOf = (t) => { const a = addDays(t, -((t.getDay() - S.settings.firstDay + 7) % 7)); return { a, b: addDays(a, 7) }; };
const fmtH = (v) => v >= 10 ? String(Math.round(v)) : String(+v.toFixed(2));
function niceAxis(max, maxTicks = 5) { const steps = [.05, .1, .2, .25, .5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 500, 1000], m = Math.max(max, 1e-6), step = steps.find(q => Math.ceil(m / q) <= maxTicks) || 2000; return { step, top: Math.max(step, Math.ceil(m / step - 1e-9) * step) }; }
function gridAxis(ax, Y, pl, W, pr, unit, pt, ih) {
  let g = ''; for (let v = 0; v <= ax.top + 1e-9; v += ax.step) { const y = Y(v); g += `<line class="cg" x1="${pl}" x2="${W - pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text class="ct" x="${pl - 6}" y="${(y + 3.2).toFixed(1)}" text-anchor="end">${fmtH(v)}</text>`; }
  return g + `<text class="ct cu" x="9" y="${(pt + ih / 2).toFixed(1)}" transform="rotate(-90 9 ${(pt + ih / 2).toFixed(1)})" text-anchor="middle">${unit}</text>`;
}
/** Discrete bar chart: one separate bar per item. vals are in hours (or minutes when unit = 'Minutes'). */
function barSVG(vals, labels, o = {}) {
  const n = vals.length, W = o.W || 360, H = o.H || 214, pl = 40, pr = 8, pt = 18, pb = 28, iw = W - pl - pr, ih = H - pt - pb, ax = niceAxis(Math.max(o.min || 0, ...vals)), slot = iw / n, bw = Math.max(3, Math.min(24, slot * .62)), Y = (v) => pt + (1 - v / ax.top) * ih, unit = o.unit || 'Hours';
  const stride = slot >= 15 ? 1 : slot >= 9 ? 2 : 5, mx = Math.max(...vals), pk = o.peak && mx > 0 ? vals.indexOf(mx) : -1; let g = gridAxis(ax, Y, pl, W, pr, unit, pt, ih);
  vals.forEach((v, i) => { const x = pl + slot * i + (slot - bw) / 2, cx = x + bw / 2;
    if (v > 0) { const h = Math.max(1.6, ih * v / ax.top); g += `<rect class="cb${i === pk ? ' pk' : ''}" x="${x.toFixed(1)}" y="${(pt + ih - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(3.5, bw / 2).toFixed(1)}"><title>${o.tips ? o.tips[i] : labels[i]}: ${unit === 'Minutes' ? Math.round(v) + ' min' : HMS(v * 60)}</title></rect>`;
      if (n <= 12 && h > 8) g += `<text class="ct cv" x="${cx.toFixed(1)}" y="${(pt + ih - h - 3).toFixed(1)}" text-anchor="middle">${fmtH(v)}</text>`; }
    if (i % stride === 0 || (i === n - 1 && stride > 1 && n - 1 - (n - 1) % stride > 0 && false)) g += `<text class="ct" x="${cx.toFixed(1)}" y="${H - pb + 14}" text-anchor="middle">${labels[i]}</text>`; });
  return `<svg class="chsvg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${o.aria || 'Bar chart'}">${g}<line class="ca" x1="${pl}" x2="${W - pr}" y1="${Y(0)}" y2="${Y(0)}"/></svg>`;
}
function smoothPath(p) {
  const n = p.length, dx = [], m = [], t = []; for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1][0] - p[i][0]; m[i] = (p[i + 1][1] - p[i][1]) / dx[i]; }
  t[0] = m[0]; for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2; t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; } const a = t[i] / m[i], b = t[i + 1] / m[i], q = a * a + b * b; if (q > 9) { const k = 3 / Math.sqrt(q); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; } }
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`; for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; d += `C${(p[i][0] + h).toFixed(1)} ${(p[i][1] + t[i] * h).toFixed(1)} ${(p[i + 1][0] - h).toFixed(1)} ${(p[i + 1][1] - t[i + 1] * h).toFixed(1)} ${p[i + 1][0].toFixed(1)} ${p[i + 1][1].toFixed(1)}`; } return d;
}
let LID = 0;
/** Smooth line chart over 24 hours (00-23). vals = average focus hours per hour of the day. */
function lineSVG24(vals, o = {}) {
  const n = 24, W = 380, H = 214, pl = 44, pr = 12, pt = 20, pb = 38, iw = W - pl - pr, ih = H - pt - pb, mx = Math.max(...vals), ax = niceAxis(mx), X = (i) => pl + iw * i / (n - 1), Y = (v) => pt + (1 - v / ax.top) * ih, id = 'lg' + (++LID), pk = mx > 0 ? vals.indexOf(mx) : -1;
  const pts = vals.map((v, i) => [X(i), Y(v)]), line = smoothPath(pts); let g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cbar)" stop-opacity=".32"/><stop offset="1" stop-color="var(--cbar)" stop-opacity="0"/></linearGradient></defs>` + gridAxis(ax, Y, pl, W, pr, 'Average hours', pt, ih);
  g += `<path d="${line}L${X(n - 1).toFixed(1)} ${Y(0)}L${X(0).toFixed(1)} ${Y(0)}Z" fill="url(#${id})"/><path class="cl" d="${line}" fill="none"/>`;
  if (pk >= 0) g += `<line class="cp" x1="${X(pk).toFixed(1)}" x2="${X(pk).toFixed(1)}" y1="${pt}" y2="${Y(0)}"/>`;
  vals.forEach((v, i) => { g += `<circle class="cd${i === pk ? ' pk' : ''}" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${i === pk ? 4.2 : 2.4}"><title>${pad(i)}:00 – ${pad(i)}:59: ${HMS(v * 60)} ${o.avg ? 'on average' : ''}</title></circle>`; g += `<text class="ct cx" x="${X(i).toFixed(1)}" y="${H - pb + 13}" text-anchor="middle">${pad(i)}</text>`; });
  if (pk >= 0) g += `<text class="ct cv pkt" x="${Math.min(W - pr - 14, Math.max(pl + 14, X(pk))).toFixed(1)}" y="${(Y(vals[pk]) - 8).toFixed(1)}" text-anchor="middle">${pad(pk)}:00</text>`;
  g += `<text class="ct cu" x="${(pl + iw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">Hour of the day</text>`;
  return `<svg class="chsvg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Line chart of average focus time per hour of the day">${g}<line class="ca" x1="${pl}" x2="${W - pr}" y1="${Y(0)}" y2="${Y(0)}"/></svg>`;
}
function distCfg(r, A) {
  const nd = Math.max(1, Math.round((r.b - r.a) / DAY)), dayMin = (i) => A.day.get(dkey(addDays(r.a, i))) || 0;
  if (ovP === 'day') return { vals: A.hour.slice(), labels: A.hour.map((_, i) => pad(i)), tips: A.hour.map((_, i) => pad(i) + ':00–' + pad(i) + ':59'), o: { unit: 'Minutes', min: 60, aria: 'Focus minutes for each hour of the day' } };
  if (ovP === 'year') { const v = Array(12).fill(0); for (let i = 0; i < nd; i++) v[addDays(r.a, i).getMonth()] += dayMin(i); return { vals: v.map(x => x / 60), labels: MS, tips: MONTHS, o: { aria: 'Focus hours for each month' } }; }
  if (ovP === 'custom' && nd > 62) { const nw = Math.ceil(nd / 7), v = Array(nw).fill(0); for (let i = 0; i < nd; i++) v[i / 7 | 0] += dayMin(i); return { vals: v.map(x => x / 60), labels: v.map((_, i) => sdate(addDays(r.a, i * 7)).replace(' ', '')), tips: v.map((_, i) => 'Week of ' + sdate(addDays(r.a, i * 7))), o: { aria: 'Focus hours for each week' } }; }
  const v = Array.from({ length: nd }, (_, i) => dayMin(i) / 60); return { vals: v, labels: v.map((_, i) => ovP === 'week' ? WD[addDays(r.a, i).getDay()] : addDays(r.a, i).getDate()), tips: v.map((_, i) => sdate(addDays(r.a, i))), o: { aria: 'Focus hours for each day' } };
}
function renderOverview() {
  $$('#ovTabs button').forEach(b => b.classList.toggle('on', b.dataset.p === ovP));
  $('#ovCustom').style.display = ovP === 'custom' ? 'flex' : 'none';
  $('#ovPrev').style.visibility = $('#ovNext').style.visibility = ovP === 'custom' ? 'hidden' : 'visible';
  const r = ovRange = range(); $('#ovLabel').textContent = r.label;
  $('#ovNext').disabled = ovP !== 'custom' && r.a <= ld(Date.now()) && r.b > ld(Date.now());
  const ss = S.sessions.filter(s => inRange(s, r)).sort((x, y) => x.start - y.start);
  const trees = []; let bad = 0;
  for (const s of ss) { if (s.status === 'ok') for (let i = 0; i < s.trees; i++) trees.push({ id: s.tree, lvl: (s.lv && s.lv[i]) || i + 1 }); else { bad++; trees.push({ w: 1 }); } }
  if (S.settings.byTime === false) trees.sort((p, q) => (p.id || '').localeCompare(q.id || ''));
  const lm = S.settings.landMode === 'forest' ? 'forest' : 'garden'; $$('#landMode button').forEach(b => b.classList.toggle('on', b.dataset.m === lm));
  const lk = ovP + '|' + (+r.a); if (lk !== landKey) { landKey = lk; landZ = 1; }
  showLand($('#ovLand'), sceneSVG(trees, { period: ovP, mode: lm, k: 'o' }), landZ);
  const good = trees.length - bad;
  $('#ovOk').innerHTML = `<i class="lf"></i>${good}`; $('#ovBad').innerHTML = `<i class="lf bad"></i>${bad}`;
  // distribution: separate bars, built from the real hours and days of every session
  const A = agg(r), dc = distCfg(r, A), hm = Math.floor(A.total + 1e-6);   // whole minutes, rounded down like Home's "focused today"
  $('#ovTotal').innerHTML = `Total focused time: <b>${hm / 60 | 0}</b> hours <b>${hm % 60}</b> minutes`;
  renderMore(r, ss, A);
  $('#ovChart').innerHTML = barSVG(dc.vals, dc.labels, Object.assign({ tips: dc.tips, peak: 1 }, dc.o, document.documentElement.classList.contains('wide') ? { W: 640, H: 270 } : {}));   // wider chart on a wide screen
}
/** Put a land scene into its box at a natural size. Small lands are shown larger; big lands keep their tile size and can be zoomed and dragged. */
let landZ = 1, landKey = '';
function sizeLand(el, z) { const svg = el.firstElementChild; if (!svg) return; const cw = el.clientWidth || 360, w = +svg.dataset.w, h = +svg.dataset.h, sc = Math.max(.12, Math.min(1.7, Math.max(.6, cw / w)) * z); svg.style.width = (w * sc).toFixed(0) + 'px'; svg.style.height = (h * sc).toFixed(0) + 'px'; }
function showLand(el, svgText, z = 1) {
  clearTimeout(zTimer); zOrig = null; zk = 1;
  el.innerHTML = svgText; const svg = el.firstElementChild; if (!svg) return; sizeLand(el, z);
  svg.style.animation = 'none'; void svg.getBoundingClientRect(); svg.style.animation = 'landIn .45s ease-out';
  el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2); el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
}
/** Zoom the Forest map. While zooming, only a cheap GPU transform is animated; the real (expensive) resize of the big SVG happens once, when the zooming stops. */
let zk = 1, zOrig = null, zTimer = 0;
function zoomCommit(el) {
  clearTimeout(zTimer); if (!zOrig) return; const svg = el.firstElementChild, o = zOrig; zOrig = null;
  if (!svg) return; const to = Math.max(.3, Math.min(4, landZ * zk)), w0 = parseFloat(svg.style.width) || 1;
  svg.style.transition = 'none'; svg.style.transform = ''; svg.style.transformOrigin = ''; svg.style.willChange = '';
  landZ = to; zk = 1; sizeLand(el, to); const r = (parseFloat(svg.style.width) || 1) / w0;
  el.scrollLeft = o.px * r - o.cx; el.scrollTop = o.py * r - o.cy;
}
function zoomLand(el, factor, cx = el.clientWidth / 2, cy = el.clientHeight / 2, abs) {
  const svg = el.firstElementChild; if (!svg) return;
  if (zOrig && (Math.abs(zOrig.cx - cx) > 8 || Math.abs(zOrig.cy - cy) > 8)) zoomCommit(el);   // the pointer moved: settle first
  const z = window.__z || 1, target = Math.max(.3, Math.min(4, abs != null ? abs : landZ * zk * factor)), k = target / landZ;
  if (!zOrig && Math.abs(k - 1) < .001) return;
  if (!zOrig) { const er = el.getBoundingClientRect(), sr = svg.getBoundingClientRect(); zOrig = { cx, cy, px: el.scrollLeft + cx, py: el.scrollTop + cy, ox: el.scrollLeft + (sr.left - er.left) / z, oy: el.scrollTop + (sr.top - er.top) / z }; }
  zk = k; svg.style.transformOrigin = `${zOrig.px - zOrig.ox}px ${zOrig.py - zOrig.oy}px`;
  svg.style.willChange = 'transform'; svg.style.transition = 'transform .12s ease-out'; svg.style.transform = `scale(${k})`;
  clearTimeout(zTimer); zTimer = setTimeout(() => zoomCommit(el), 170);
}
function enablePan(el, onTap, onZoom) {
  const ptrs = new Map(); let d = null, pd = 0; const zf = () => window.__z || 1;
  el.addEventListener('pointerdown', (e) => { ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 1) d = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop, moved: false }; else if (d) { d.moved = true; pd = 0; } });
  el.addEventListener('pointermove', (e) => { if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size === 2 && onZoom) { const [a, b] = [...ptrs.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]), r = el.getBoundingClientRect(); if (pd) onZoom(dist / pd, ((a[0] + b[0]) / 2 - r.left) / zf(), ((a[1] + b[1]) / 2 - r.top) / zf()); pd = dist; return; }
    if (!d) return; const dx = (e.clientX - d.x) / zf(), dy = (e.clientY - d.y) / zf(); if (!d.moved && Math.hypot(dx, dy) * zf() < 7) return; d.moved = true; try { el.setPointerCapture(e.pointerId); } catch (x) { } el.scrollLeft = d.sl - dx; el.scrollTop = d.st - dy; });
  const up = (e, tap) => { ptrs.delete(e.pointerId); pd = 0; if (ptrs.size === 0) { if (tap && d && !d.moved && onTap) onTap(); d = null; } };
  el.addEventListener('pointerup', (e) => up(e, true)); el.addEventListener('pointercancel', (e) => up(e, false));
  el.addEventListener('wheel', (e) => { if (!onZoom || !(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const r = el.getBoundingClientRect(); onZoom(e.deltaY < 0 ? 1.18 : 1 / 1.18, (e.clientX - r.left) / zf(), (e.clientY - r.top) / zf()); }, { passive: false });
  el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && onTap) { e.preventDefault(); onTap(); } if (onZoom && (e.key === '+' || e.key === '=')) onZoom(1.25); if (onZoom && (e.key === '-' || e.key === '_')) onZoom(.8); });
}
function ovMove(n) {
  const t = ovAnchor || ld(Date.now());
  ovAnchor = ovP === 'day' ? addDays(t, n) : ovP === 'week' ? addDays(t, 7 * n) : ovP === 'month' ? new Date(t.getFullYear(), t.getMonth() + n, 1) : new Date(t.getFullYear() + n, 0, 1);
  if (ovAnchor > ld(Date.now())) ovAnchor = null; renderOverview();
}


/* ================= extra Overview charts ================= */
const HMS = (min) => { min = Math.round(min); return `${min / 60 | 0} H ${min % 60} M`; };
function niceTop(max) { const raw = Math.max(max, 3) / 3, mag = Math.pow(10, Math.floor(Math.log10(raw))), m = [1, 2, 2.5, 5, 10].find(x => x * mag >= raw); return m * mag * 3; }
function lineSVG(vals, xl, peak) {
  const W = 360, H = 190, pl = 42, pr = 12, pt = 10, pb = 28, top = niceTop(Math.max(...vals)), X = (i) => pl + i * (W - pl - pr) / (vals.length - 1), Y = (v) => pt + (1 - v / top) * (H - pt - pb);
  let g = ''; for (let i = 0; i <= 3; i++) { const v = top * i / 3, y = Y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#e6e6e2"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#889">${Math.round(v)}${i ? '' : ' M'}</text>`; }
  const pts = vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const lab = xl.map(([i, t]) => `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#889">${t}</text>`).join('');
  const pk = peak >= 0 ? `<line x1="${X(peak)}" x2="${X(peak)}" y1="${pt}" y2="${H - pb}" stroke="#bbb" stroke-dasharray="3 3"/><circle cx="${X(peak)}" cy="${Y(vals[peak])}" r="5" fill="#fff" stroke="#4f9f86" stroke-width="3"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Line chart">${g}<polyline points="${pts}" fill="none" stroke="#4f9f86" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>${pk}${lab}</svg>`;
}
function shiftRange(r, n) {
  const a = r.a, b = r.b;
  if (ovP === 'month') return { a: new Date(a.getFullYear(), a.getMonth() - n, 1), b: new Date(a.getFullYear(), a.getMonth() - n + 1, 1) };
  if (ovP === 'year') return { a: new Date(a.getFullYear() - n, 0, 1), b: new Date(a.getFullYear() - n + 1, 0, 1) };
  const len = Math.round((b - a) / DAY); return { a: addDays(a, -len * n), b: addDays(b, -len * n) };
}
function renderMore(r, oks, A) {
  const card = (t, body) => `<div class="dcard"><h3>${t}</h3>${body}</div>`, none = '<p>Nothing recorded in this period yet.</p>';
  const days = Math.max(1, Math.round((r.b - r.a) / DAY)), first = S.settings.firstDay; let h = '';
  // most focused day of the week: total hours on each weekday (Sat..Fri by default); the day view uses its whole week
  const wr = ovP === 'day' ? weekOf(r.a) : r, Aw = ovP === 'day' ? agg(wr) : A, wv = Aw.wd.map(v => v / 60), wmax = Math.max(...wv), wp = wmax > 0 ? wv.indexOf(wmax) : -1;
  h += card('Most Focused Day of The Week', (wp >= 0 ? `<p>Most focused on <b>${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(first + wp) % 7]}</b>${ovP === 'day' ? ' this week' : ' in this period'}</p>` : none) + barSVG(wv, wv.map((_, i) => WD[(first + i) % 7]), { peak: 1, tips: wv.map((_, i) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][(first + i) % 7]), aria: 'Total focus hours for each day of the week' }));
  // most focused period of the day: average focus hours in each clock hour across the days of the period
  const tdy = ld(Date.now()), el = Math.max(1, Math.min(days, Math.round((addDays(tdy, 1) - r.a) / DAY))), hv = A.hour.map(v => v / 60 / (ovP === 'day' ? 1 : el)), hp = Math.max(...hv) > 0 ? hv.indexOf(Math.max(...hv)) : -1;
  h += card('Most Focused Period of The Day', (hp >= 0 ? `<p>Most focused at <b>${pad(hp)}:00</b>${ovP === 'day' ? ' on this day' : ' on average'}</p>` : none) + lineSVG24(hv, { avg: ovP !== 'day' }));
  // focus trend (this period vs the two before, up to the same point)
  const today = ld(Date.now()), cutDays = Math.max(1, Math.min(days, Math.round((addDays(today, 1) - r.a) / DAY))), live = r.a <= today && r.b > addDays(today, 0);
  const tot = (a, b) => S.sessions.filter(x => ld(x.start) >= a && ld(x.start) < b).reduce((q, x) => q + x.focusSec / 60, 0);
  const rs = [r, shiftRange(r, 1), shiftRange(r, 2)].map((q, i) => { const e = live ? new Date(Math.min(+q.b, +addDays(q.a, cutDays))) : q.b; return { v: tot(q.a, e), d: addDays(e, -1) }; });
  const NM = { day: ['Today', 'Yesterday', 'The Day Before'], week: ['This Week', 'Last Week', 'The Week Before Last'], month: ['This Month', 'Last Month', 'The Month Before Last'], year: ['This Year', 'Last Year', 'The Year Before Last'], custom: ['This Period', 'Previous Period', 'The Period Before'] }[ovP], mx = Math.max(1, ...rs.map(q => q.v));
  const cmp = (i) => { const d = rs[0].v - rs[i].v; return `${NM[0]} compared with same time ${NM[i]}: <b>${Math.abs(d) < 1 ? 'the same' : HMS(Math.abs(d)) + (d < 0 ? ' shorter' : ' longer')}</b>`; };
  h += card('Focus Trend', `<p>${cmp(1)}<br>${cmp(2)}</p>` + rs.map((q, i) => `<div class="tr"><span>${NM[i]}${i === 0 && live ? ' (to this day)' : ''}</span><div class="trk"><i style="width:${q.v / mx * 100}%"></i></div><em>${HMS(q.v)}</em><small style="left:calc(${q.v / mx * 100}% * .72)">${q.d.getMonth() + 1}/${q.d.getDate()}</small></div>`).join(''));
  // favourite tree species
  const fc = {}; oks.filter(x => x.status === 'ok').forEach(x => { fc[x.tree] = (fc[x.tree] || 0) + 1; }); const fav = Object.entries(fc).sort((a, b) => b[1] - a[1]).slice(0, 3), fm = fav.length ? fav[0][1] : 1;
  h += card('Favorite tree species', fav.length ? fav.map(([id, n], i) => `<div class="fav"><b>${i + 1}.</b><div class="thumb">${TREES[id] ? treeSVG(id, 4, { noShadow: 1 }) : ''}</div><div class="favm"><span>${TREES[id] ? TREES[id].n : id}</span><div class="trk"><i style="width:${n / fm * 100}%"></i></div></div><em>${n} times</em></div>`).join('') : none);
  $('#ovMore').innerHTML = h;
}

/* ================= Planting Record + Timeline ================= */
function delSession(id) {
  ask('Delete this record?', 'The tree and the coins it earned will be removed.', 'Delete', () => {
    S.del = (S.del || []).concat(id); S.sessions = S.sessions.filter(s => s.id !== id); S.ledger = S.ledger.filter(l => !(l.src === 'session' && l.ref === id)); save();
    renderRecord(); renderTimeline(); renderOverview();
  });
}
function renderRecord() {
  const r = ovRange || range(), ss = S.sessions.filter(s => inRange(s, r)).sort((a, b) => b.start - a.start);
  let h = '', day = '';
  if (!ss.length) h = '<p class="note" style="text-align:center;padding:30px">No plantings in this period.</p>';
  for (const s of ss) {
    const dk = dkey(ld(s.start)); if (dk !== day) { day = dk; const d = ld(s.start); h += `<h4>${sdate(d)}, ${d.getFullYear()}</h4>`; }
    const leaves = s.status === 'ok' ? Array.from({ length: s.trees }, () => '<i class="lf"></i>').join('') : '<i class="lf bad"></i>';
    h += `<div class="rcard"><div class="thumb">${s.status === 'ok' ? treeSVG(s.tree, Math.min(4, s.trees), { noShadow: 1 }) : witheredSVG()}</div><div class="rmid"><b>${hhmm(s.start)} – ${hhmm(s.end)}</b><span>${leaves}</span>${s.title ? `<small>${esc(s.title)}</small>` : ''}</div><div class="rmin">${Math.round(s.focusSec / 60)}<small>min</small></div><button class="ic sm" data-del="${s.id}" aria-label="Delete record">•••</button></div>`;
  }
  $('#recList').innerHTML = h;
}
const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function renderTimeline() {
  const ss = S.sessions.slice().sort((a, b) => b.start - a.start).slice(0, 120); let h = '', day = '';
  const todayK = dkey(ld(Date.now()));
  if (!ss.length) h = '<p class="note" style="text-align:center;padding:40px;color:#bfe0cc">Your plantings will appear here.</p>';
  for (const s of ss) {
    const d = ld(s.start), dk = dkey(d);
    if (dk !== day) { day = dk; h += `<div class="tday"><span>${dk === todayK ? 'Today' : WD[d.getDay()]} / ${sdate(d)}</span></div>`; }
    h += `<div class="tevt"><i class="dot ${s.status === 'ok' ? '' : 'bad'}"></i><div><b>${hhmm(s.start)} Tree planted.</b><p>${s.status === 'ok' ? `Successfully planted a ${Math.round(s.focusSec / 60)}-minute Tree.` : 'You gave up and failed to grow a Tree.'}</p>
      <div class="tcard"><div class="thumb">${s.status === 'ok' ? treeSVG(s.tree, Math.min(4, s.trees), { noShadow: 1 }) : witheredSVG()}</div><div class="rmid"><b>${hhmm(s.start)} – ${hhmm(s.end)}</b><small>${Math.round(s.focusSec / 60)} min${s.title ? ' · ' + esc(s.title) : ''}</small></div><button class="ic sm" data-del="${s.id}" aria-label="Delete record">•••</button></div></div></div>`;
  }
  $('#tlList').innerHTML = `<div class="tlin">${h}</div>`;
}

/* ================= Focus Challenge ================= */
const CHK_GAP = 8 * 3600000;
function untilReset() { const m = Math.max(0, Math.floor((new Date(ld(Date.now()).getFullYear(), ld(Date.now()).getMonth(), ld(Date.now()).getDate() + 1).getTime() + OFF() - Date.now()) / 60000)); return `${m / 60 | 0}h ${m % 60}m`; }
function genChallenges(key) {
  const r = R(hash(key)), pick = (a) => a[Math.floor(r() * a.length)], own = S.owned.trees;
  const t3 = pick(own), t4 = pick(own);
  return [
    { type: 'mins', n: pick([30, 45, 60]), c: 50 },
    { type: 'count', n: pick([2, 3]), c: 100 },
    { type: 'treeCount', tree: t3, n: pick([2, 3, 4]), c: 150 },
    { type: 'treeMins', tree: t4, n: pick([60, 90]), g: 5 },
  ].map((x, i) => ({ ...x, claimed: false, id: `${key}:${i}` }));
}
function dayStats(key) {
  const ss = ok().filter(s => dkey(ld(s.start)) === key), by = {};
  for (const s of ss) { by[s.tree] = by[s.tree] || { c: 0, m: 0 }; by[s.tree].c++; by[s.tree].m += s.focusSec / 60; }
  return { mins: ss.reduce((a, s) => a + s.focusSec / 60, 0), count: ss.length, by };
}
const chTitle = (c) => c.type === 'mins' ? `Plant any tree for ${c.n} mins` : c.type === 'count' ? `Plant any tree ${c.n} times` : c.type === 'treeCount' ? `Plant ${TREES[c.tree].n} ${c.n} times` : `Plant ${TREES[c.tree].n} for ${c.n} mins`;
function chProg(c, st) { const v = { mins: st.mins, count: st.count, treeCount: (st.by[c.tree] || {}).c || 0, treeMins: (st.by[c.tree] || {}).m || 0 }[c.type]; return Math.min(c.n, Math.floor(v)); }
function ensureDay() {
  const key = dkey(ld(Date.now()));
  if (!S.chal || S.chal.key !== key) S.chal = { key, items: genChallenges(key) };
  if (!S.chk || S.chk.key !== key) S.chk = { key, times: [] };
}
function renderChallenge() {
  ensureDay(); const st = dayStats(S.chal.key);
  $('#chCoin').textContent = coins(); $('#chGem').textContent = gems();
  const tm = S.chk.times, wait = tm.length ? Math.max(0, CHK_GAP - (Date.now() - tm[tm.length - 1])) : 0, fmt = (ms) => { const m = Math.ceil(ms / 60000); return `${m / 60 | 0}h ${m % 60}m`; };
  const slots = [0, 1, 2].map(i => { const done = i < tm.length, ready = i === tm.length && wait === 0, w = i === tm.length ? wait : wait + CHK_GAP * (i - tm.length);
    return `<button class="slot ${done ? 'done' : ready ? 'ready' : 'locked'}" data-slot="${i}" aria-label="Check-in ${i + 1}: ${done ? 'claimed' : ready ? 'ready' : 'locked'}"><i class="cnI"></i><span class="lock">${done ? '✓' : ready ? '' : '🔒'}</span><b>×20</b><small>${done ? 'Claimed' : ready ? 'Tap to claim' : 'Opens in ' + fmt(w)}</small></button>`; }).join('');
  let h = `<div class="cc"><div class="chd"><h3>Daily Check-in</h3><span class="rf">Refresh in ${untilReset()}</span></div><div class="slots">${slots}</div></div><div class="cc"><div class="chd"><h3>Daily Challenges</h3><span class="rf">Refresh in ${untilReset()}</span></div>`;
  S.chal.items.forEach((c, i) => {
    const p = chProg(c, st), done = p >= c.n, rew = c.g ? `${c.g} gems` : `${c.c} coins`;
    h += `<div class="ch ${done ? 'done' : ''}"><div class="cht">${chTitle(c)}</div><div class="prog"><div style="width:${p / c.n * 100}%"></div><span>${c.claimed ? 'Completed' : done ? 'Completed · tap gift to claim' : `${p}/${c.n}`}</span></div><button class="gift ${done && !c.claimed ? 'ready' : ''}" data-gift="${i}" aria-label="Claim ${rew}">${c.claimed ? '✓' : '🎁'}<small>${rew}</small></button></div>`;
  });
  $('#chBody').innerHTML = h + '</div>';
}
function claimSlot(i) {
  ensureDay(); const t = S.chk.times;
  if (i < t.length) return toast('Already claimed');
  if (i > t.length) return toast('Claim the earlier check-in first');
  if (t.length && Date.now() - t[t.length - 1] < CHK_GAP) { const m = Math.ceil((CHK_GAP - (Date.now() - t[t.length - 1])) / 60000); return toast(`Next check-in in ${m / 60 | 0}h ${m % 60}m`); }
  t.push(Date.now()); S.ledger.push({ id: uid(), src: 'checkin', ref: `chk:${S.chk.key}:${i}`, c: 20, t: Date.now() }); save(); renderChallenge(); toast('+20 coins');
}
function claimGift(i) {
  ensureDay(); const c = S.chal.items[i], st = dayStats(S.chal.key);
  if (c.claimed) return; if (chProg(c, st) < c.n) return toast('Keep focusing to finish this challenge');
  c.claimed = true; S.ledger.push({ id: uid(), src: 'challenge', ref: 'ch:' + c.id, c: c.c || 0, g: c.g || 0, t: Date.now() });
  if (S.chal.items.every(x => x.claimed)) { S.perfect = S.perfect || []; if (!S.perfect.includes(S.chal.key)) S.perfect.push(S.chal.key); }
  save(); renderChallenge(); toast(c.g ? `+${c.g} gems` : `+${c.c} coins`);
}

/* ================= Achievements ================= */
function streaks() {
  const days = [...new Set(ok().map(s => dkey(ld(s.start))))].sort(); let best = 0, run = 0, prev = null;
  for (const k of days) { const d = new Date(k + 'T00:00'); run = prev && Math.round((d - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return best;
}
function metrics() {
  const o = ok(), mins = S.sessions.reduce((a, s) => a + (s.focusSec || 0) / 60, 0), perDay = {};
  o.forEach(s => { const k = dkey(ld(s.start)); perDay[k] = (perDay[k] || 0) + 1; });
  return { hours: mins / 60, days: mins / 1440, trees: o.reduce((a, s) => a + s.trees, 0), longest: Math.max(0, ...o.map(s => s.focusSec / 60)), sessions: o.length, perDay: Math.max(0, ...Object.values(perDay)), streak: streaks(), treesOwned: S.owned.trees.length, lands: S.owned.lands.length, allTrees: S.owned.trees.length >= TREE_IDS.length ? 1 : 0, perfect: (S.perfect || []).length };
}
const A = (id, name, goal, m, n, c, tier, g = 'leaf') => ({ id, name, goal, m, n, c, tier, g });
const ACH = [
  A('h4', 'Novice Planter', 'Focus for a total of 4 hours', 'hours', 4, 200, 0), A('d3', 'Apprentice Planter', 'Focus for a total of 3 days', 'days', 3, 400, 1), A('d7', 'Adept Planter', 'Focus for a total of 7 days', 'days', 7, 700, 1),
  A('d15', 'Expert Planter', 'Focus for a total of 15 days', 'days', 15, 1200, 2), A('d30', 'Green Thumb', 'Focus for a total of 30 days', 'days', 30, 2000, 3),
  A('s3', '3 Days in a Row', 'Grow a healthy tree 3 days in a row', 'streak', 3, 300, 0, 'flame'), A('s7', '7 Days in a Row', 'Grow a healthy tree 7 days in a row', 'streak', 7, 600, 1, 'flame'), A('s30', '30 Days in a Row', 'Grow a healthy tree 30 days in a row', 'streak', 30, 2000, 3, 'flame'),
  A('bot', 'Botanist', 'Unlock 6 or more trees', 'treesOwned', 6, 200, 0, 'sprout'),
  A('first', 'First Seed', 'Finish your first session', 'sessions', 1, 200, 0), A('m25', 'Quarter Hour Plus', 'Finish a 25-minute session', 'longest', 25, 200, 0, 'clock'), A('t10', 'Ten Trees', 'Plant 10 healthy trees', 'trees', 10, 250, 0),
  A('m60', 'Full Hour', 'Finish a 60-minute session', 'longest', 60, 400, 1, 'clock'), A('t50', 'Small Grove', 'Plant 50 healthy trees', 'trees', 50, 500, 1), A('d3s', 'Triple Day', 'Finish 3 sessions in one day', 'perDay', 3, 400, 1), A('o15', 'Collector', 'Unlock 15 trees', 'treesOwned', 15, 600, 1, 'sprout'),
  A('m120', 'Deep Work', 'Finish a 2-hour session', 'longest', 120, 900, 2, 'clock'), A('t100', 'Hundred Trees', 'Plant 100 healthy trees', 'trees', 100, 1000, 2), A('s14', 'Fortnight Streak', 'Grow a healthy tree 14 days in a row', 'streak', 14, 1000, 2, 'flame'), A('l5', 'Landlord', 'Own 5 lands', 'lands', 5, 800, 2, 'land'), A('h100', 'Centurion', 'Focus for a total of 100 hours', 'hours', 100, 1200, 2, 'clock'),
  A('m240', 'Marathon', 'Finish a 4-hour session', 'longest', 240, 1500, 3, 'clock'), A('t500', 'Forest Keeper', 'Plant 500 healthy trees', 'trees', 500, 1800, 3), A('s60', '60 Days in a Row', 'Grow a healthy tree 60 days in a row', 'streak', 60, 2000, 3, 'flame'), A('s100', '100 Days in a Row', 'Grow a healthy tree 100 days in a row', 'streak', 100, 2000, 3, 'flame'),
  A('all', 'Complete Collection', 'Unlock every tree', 'allTrees', 1, 2000, 3, 'sprout'), A('h1000', 'Thousand Hours', 'Focus for a total of 1,000 hours', 'hours', 1000, 2000, 3, 'clock'), A('pf30', 'Challenge Master', 'Finish all 4 daily challenges for 30 days', 'perfect', 30, 2000, 3, 'gift'),
];
const TIERC = ['#7ccf6a', '#4fb3d8', '#b07ae0', '#f0b030'];
function badge(a) {
  const col = TIERC[a.tier], gl = { leaf: '<path d="M16 34 Q16 16 34 14 Q34 32 16 34Z" fill="#fff"/><path d="M16 34 L28 22" stroke="' + col + '" stroke-width="2"/>', flame: '<path d="M25 12 Q36 24 32 32 Q25 40 18 32 Q15 24 25 12Z" fill="#fff"/>', sprout: '<path d="M25 36 V24 M25 26 Q16 26 15 16 Q25 16 25 26 M25 28 Q34 28 36 19 Q26 18 25 28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>', clock: '<circle cx="25" cy="25" r="11" fill="none" stroke="#fff" stroke-width="3"/><path d="M25 18 V25 L30 28" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>', land: '<path d="M25 14 L40 24 L25 34 L10 24Z" fill="#fff"/>', gift: '<rect x="14" y="22" width="22" height="14" fill="#fff"/><rect x="12" y="18" width="26" height="6" fill="#fff"/><path d="M25 18 V36" stroke="' + col + '" stroke-width="3"/>' }[a.g];
  return `<svg viewBox="0 0 50 50" width="54" height="54"><circle cx="25" cy="25" r="24" fill="${col}"/><circle cx="25" cy="25" r="20" fill="none" stroke="#fff6" stroke-width="2"/>${gl}</svg>`;
}
const achDone = (a, m) => m[a.m] >= a.n;
function renderAch() {
  const m = metrics(); S.ach = S.ach || {};
  const rows = ACH.slice().sort((a, b) => (S.ach[a.id] ? 1 : 0) - (S.ach[b.id] ? 1 : 0) || (achDone(b, m) - achDone(a, m)) || a.tier - b.tier);
  $('#achList').innerHTML = rows.map(a => {
    const d = achDone(a, m), cl = S.ach[a.id], v = Math.min(a.n, a.m === 'hours' || a.m === 'days' || a.m === 'longest' ? Math.floor(m[a.m]) : m[a.m]);
    return `<div class="arow ${cl ? 'got' : ''}">${badge(a)}<div class="amid"><b>${a.name}</b><span>${a.goal} (${v.toLocaleString()}/${a.n.toLocaleString()})</span></div>${cl ? '<em>✓</em>' : d ? `<button class="claim" data-claim="${a.id}">Claim ${a.c}</button>` : `<em>${a.c}</em>`}</div>`;
  }).join('');
}
function claimAch(id) {
  const a = ACH.find(x => x.id === id); S.ach = S.ach || {}; if (!a || S.ach[id] || !achDone(a, metrics())) return;
  S.ach[id] = Date.now(); S.ledger.push({ id: uid(), src: 'achievement', ref: 'ach:' + id, c: a.c, t: Date.now() }); save(); renderAch(); toast(`+${a.c} coins`);
}
let lastReady = -1;
function readyCount() { const m = metrics(); S.ach = S.ach || {}; return ACH.filter(a => achDone(a, m) && !S.ach[a.id]).length; }
function checkNewAch() { const n = readyCount(); if (lastReady >= 0 && n > lastReady) setTimeout(() => toast('Achievement ready to claim!'), 900); lastReady = n; }

/* ================= wiring ================= */
function enterScreen(id) {
  if (id === 'overview') { ovAnchor = null; renderOverview(); } else if (id === 'timeline') renderTimeline(); else if (id === 'challenge') renderChallenge(); else if (id === 'achievements') renderAch();
}
/* keep the Overview land and charts right when the window is resized */
(function () {
  let t = 0, was = document.documentElement.classList.contains('wide');
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { const w = document.documentElement.classList.contains('wide'), on = $('#overview').classList.contains('on');
    if (!on) { was = w; return; } if (w !== was) { was = w; renderOverview(); } else sizeLand($('#ovLand'), landZ); }, 120); });
})();
(function wireRecords() {
  $$('#ovTabs button').forEach(b => b.onclick = () => { ovP = b.dataset.p; ovAnchor = null; if (ovP === 'custom' && !$('#cFrom').value) { $('#cTo').value = dkey(ld(Date.now())); $('#cFrom').value = dkey(addDays(ld(Date.now()), -6)); } renderOverview(); });
  $('#ovPrev').onclick = () => ovMove(-1); $('#ovNext').onclick = () => ovMove(1);
  $('#cFrom').onchange = $('#cTo').onchange = renderOverview;
  const ol = $('#ovLand'); enablePan(ol, () => { renderRecord(); $('#record').classList.add('on'); }, (f, cx, cy) => zoomLand(ol, f, cx, cy));
  $('#zIn').onclick = () => zoomLand(ol, 1.35); $('#zOut').onclick = () => zoomLand(ol, 1 / 1.35); $('#zFit').onclick = () => zoomLand(ol, 1, undefined, undefined, 1);
  $$('#landMode button').forEach(b => b.onclick = () => { S.settings.landMode = b.dataset.m; save(); renderOverview(); });
  $('#record').onclick = (e) => { if (e.target.id === 'record') closeOv(); };
  $('#ovShare').onclick = () => toast('Sharing stays offline: take a screenshot instead');
  document.addEventListener('click', (e) => {
    const d = e.target.closest('[data-del]'), sl = e.target.closest('[data-slot]'), gf = e.target.closest('[data-gift]'), cm = e.target.closest('[data-claim]');
    if (d) delSession(d.dataset.del); else if (sl) claimSlot(+sl.dataset.slot); else if (gf) claimGift(+gf.dataset.gift); else if (cm) claimAch(cm.dataset.claim);
  });
  setTimeout(() => { try { checkNewAch(); } catch (e) { } }, 1200);
})();
