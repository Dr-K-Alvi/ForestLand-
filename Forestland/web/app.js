/* app.js - Forestland stage 1: home, session flow, coins, store, themes, import. */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const clock = (s) => { s = Math.max(0, Math.floor(s)); const h = s / 3600 | 0, m = s % 3600 / 60 | 0; return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`; };
const hm = (min) => { min = Math.floor(min); return S.settings.hours !== false && min >= 60 ? `${min / 60 | 0}h ${pad(min % 60)}m` : `${min}m`; };
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2));
const SPEED = +new URLSearchParams(location.search).get('speed') || 1; // test only: ?speed=60 runs the clock 60x
const CANCEL_SECS = 10, WITHER_MIN = 10, APP_VERSION = '1.9.2', APP_BUILD = 'November 2026';

const DEF = () => ({ v: 1, ledger: [], owned: { trees: ['birch', 'jacaranda', 'sunflower', 'lavender', 'cosmos', 'mushroom', 'clover'], lands: ['lime'] },
  tree: 'birch', land: 'lime', sessions: [], mins: 25, title: '', settings: { theme: 'light', dayStart: '00:00', firstDay: 6, hours: true, noExpand: false, byTime: true, awake: true, witherClosed: false, countOver: true, blocked: [], allowed: [], sites: [], blockSites: false, sound: true, ringtone: 'system', reminders: [], phrases: { ok: '', bad: '' }, syncFolder: '' }, pauses: [], del: [], active: null });
/* realistic coin / gem / clock icons (inline SVG as CSS backgrounds) */
const COIN = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><defs><linearGradient id='a' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fff3a0'/><stop offset='.5' stop-color='#f6bd1c'/><stop offset='1' stop-color='#c98400'/></linearGradient><linearGradient id='b' x1='1' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#fff0a0'/><stop offset='1' stop-color='#d89200'/></linearGradient></defs><circle cx='16' cy='16' r='15' fill='url(#a)' stroke='#a86a00' stroke-width='1.4'/><circle cx='16' cy='16' r='11.6' fill='url(#b)' stroke='#fff3b0' stroke-width='1.1'/><path d='M16 6.5c4 4.6 6 7.4 6 10.4a6 6 0 0 1-12 0c0-3 2-5.800 6-10.400z' fill='#d08a00' stroke='#8e5a00' stroke-width='.8'/><path d='M13.200 15.500c.4-2 1.400-3.400 2.800-4.800' stroke='#fff0a0' stroke-width='1.300' fill='none' stroke-linecap='round'/></svg>`;
const GEM = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><polygon points='16,2 27,8 27,22 16,30 5,22 5,8' fill='#2aa6bf' stroke='#13728a' stroke-width='1.200' stroke-linejoin='round'/><polygon points='16,2 27,8 16,14 5,8' fill='#c4f6f8'/><polygon points='5,8 16,14 16,30 5,22' fill='#56c8dc'/><polygon points='27,8 16,14 16,30 27,22' fill='#1c92ae'/><polygon points='16,2 20,5 16,8 12,5' fill='#fff' opacity='.7'/></svg>`;
const CLOCK = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='15' fill='#ffd21e' stroke='#c98a00' stroke-width='1.200'/><circle cx='16' cy='16' r='11' fill='#fff'/><path d='M16 8v8l5 3' stroke='#e8a000' stroke-width='2.600' fill='none' stroke-linecap='round'/></svg>`;
const svgURL = (x) => `url("data:image/svg+xml;utf8,${encodeURIComponent(x)}")`;
document.head.insertAdjacentHTML('beforeend', `<style>.pill.cn:before,.cnI{background:${svgURL(COIN)} center/contain no-repeat!important;border-radius:0!important;box-shadow:none!important}.pill.gm:before,.gmI{background:${svgURL(GEM)} center/contain no-repeat!important;border-radius:0!important;box-shadow:none!important}.pill.clk:before{background:${svgURL(CLOCK)} center/contain no-repeat!important;border-radius:0!important;box-shadow:none!important}</style>`);
let S = DEF(), cur = null, timer = null, sortDesc = false, tab = 'plants';

/* ---------- storage: pywebview file, or localStorage when opened in a browser ---------- */
const api = () => window.pywebview && window.pywebview.api;
async function loadState() {
  for (let i = 0; i < 12 && !api(); i++) await sleep(100);
  let txt = '';
  try { txt = api() ? await api().load() : localStorage.getItem('forestland') || ''; } catch (e) { }
  try { const d = JSON.parse(txt); S = Object.assign(DEF(), d, { settings: Object.assign(DEF().settings, d.settings || {}) }); } catch (e) { }
}
let saveT;
/* saveNow writes straight away: used whenever a session starts, ends or is cancelled, so a quick close of the app can never leave an old running session in the data file. */
function saveNow() { clearTimeout(saveT); const t = JSON.stringify(S); try { api() ? api().save(t) : localStorage.setItem('forestland', t); } catch (e) { } }
addEventListener('pagehide', saveNow);
function save() { clearTimeout(saveT); saveT = setTimeout(() => { const t = JSON.stringify(S); try { api() ? api().save(t) : localStorage.setItem('forestland', t); } catch (e) { } }, 150); }

/* ---------- derived values ---------- */
const coins = () => S.ledger.reduce((a, l) => a + (l.c || 0), 0), gems = () => S.ledger.reduce((a, l) => a + (l.g || 0), 0);
function dayStart() { const [h, m] = S.settings.dayStart.split(':').map(Number), d = new Date(); d.setHours(h, m, 0, 0); if (d > new Date()) d.setDate(d.getDate() - 1); return d.getTime(); }
/* Today's focus is counted exactly like the Forest overview does: from the real focus intervals of every session that fall inside today (so a session over the day boundary, or one with pauses, is never counted wrongly). */
const todayMin = () => {
  const t0 = dayStart(), t1 = nextDay(t0); let ms = 0;
  for (const s of S.sessions) for (const [a, e] of ((s.iv && s.iv.length) ? s.iv : [[s.start, s.start + (s.focusSec || 0) * 1000]])) { const x = Math.max(a, t0), y = Math.min(e, t1); if (y > x) ms += y - x; }
  return ms / 60000;
};
function focusLine() {
  const sec = Math.round(todayMin() * 60), m = Math.floor(sec / 60), h = m / 60 | 0, r = m % 60;
  if (!sec) return 'You haven’t focused yet today.';
  if (!m) return 'You have focused for less than a minute today.';
  return 'You have focused for ' + [h && `${h} hour${h > 1 ? 's' : ''}`, r && `${r} min${r > 1 ? 's' : ''}`].filter(Boolean).join(' ') + ' today.';
}
const PTS = [[10, 3], [15, 4], [25, 9], [30, 10], [35, 11], [45, 13], [50, 14], [60, 21], [80, 25], [100, 34], [120, 43]];
function coinsFor(m) {
  if (m < 10) return 0; if (m >= 120) return Math.round(43 + .36 * (m - 120));
  for (let i = 1; i < PTS.length; i++) if (m <= PTS[i][0]) { const [x0, y0] = PTS[i - 1], [x1, y1] = PTS[i]; return Math.round(y0 + (y1 - y0) * (m - x0) / (x1 - x0)); }
}
const treeCount = (m) => m < 60 ? 1 : m < 90 ? 2 : m < 120 ? 3 : 4;

/* About page: version and live counts */
function fillAbout() {
  try { $('#abVer').textContent = APP_VERSION; $('#abBuild').textContent = ' · ' + APP_BUILD; $('.abv2').textContent = APP_VERSION;
    if (typeof TREE_IDS !== 'undefined') $('#abTrees').textContent = TREE_IDS.length; if (typeof LAND_IDS !== 'undefined') $('#abLands').textContent = LAND_IDS.length; } catch (e) { }
}

/* ---------- ui helpers ---------- */
function go(id) { $$('.screen').forEach(s => s.classList.toggle('on', s.id === id)); closeOv(); }
function closeOv() { $$('.ov').forEach(o => o.classList.remove('on')); }
function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 1800); }
function applyTheme() {
  const t = S.settings.theme, dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $$('#themeSeg button').forEach(b => b.classList.toggle('on', b.dataset.th === t));
}
function ask(title, text, yes, cb, cls) { $('#dTitle').textContent = title; $('#dText').textContent = text; $('#dYes').textContent = yes; $('#dYes').className = cls === 'ok' ? 'ok' : 'red'; $('#dialog').classList.add('on'); $('#dYes').onclick = () => { $('#dialog').classList.remove('on'); cb(); }; $('#dNo').onclick = () => $('#dialog').classList.remove('on'); }
const ISLE = `<svg class="isle" viewBox="0 0 300 90"><path d="M10 40 Q150 -10 290 40 Q290 62 150 86 Q10 62 10 40Z" fill="#9ac43a"/><ellipse cx="150" cy="36" rx="140" ry="30" fill="#fff6b0"/><ellipse cx="150" cy="34" rx="64" ry="12" fill="#d6c98a" opacity=".55"/></svg>`;

/* ---------- home ---------- */
let step = 5; // dial position: 0 = stopwatch, otherwise 5-minute steps
const ISLE3D = `<svg class="isle" viewBox="0 0 300 150" aria-hidden="true"><defs><linearGradient id="is1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbd2"/><stop offset="1" stop-color="#f6e9a2"/></linearGradient><linearGradient id="is2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e9a8"/><stop offset=".42" stop-color="#e6dc88"/><stop offset=".43" stop-color="#b8d044"/><stop offset="1" stop-color="#7ea81e"/></linearGradient><radialGradient id="is3"><stop offset="0" stop-color="#cfc590"/><stop offset="1" stop-color="#e2d9a0" stop-opacity="0"/></radialGradient></defs>
<path d="M4 60 Q4 118 150 146 Q296 118 296 60Z" fill="url(#is2)"/><ellipse cx="150" cy="58" rx="146" ry="46" fill="url(#is1)"/><ellipse cx="150" cy="56" rx="70" ry="17" fill="url(#is3)"/>
<g fill="#fff" stroke="#f3d65a" stroke-width="1.500"><circle cx="62" cy="106" r="7"/><circle cx="196" cy="124" r="7"/><circle cx="248" cy="98" r="6"/></g><g fill="#f4c21c"><circle cx="62" cy="106" r="2.500"/><circle cx="196" cy="124" r="2.500"/><circle cx="248" cy="98" r="2.200"/></g>
<g fill="#f2e08a"><path d="M24 50l5-14l5 14zM262 52l5-12l5 12zM214 22l4-10l4 10z"/></g></svg>`;
function renderHome() {
  S.mins = step * 5;
  $('#focusLine').textContent = focusLine(); $('#pillCoin').textContent = coins(); $('#pillGem').textContent = gems(); $('#pillGem').style.display = gems() ? '' : 'none';
  $('#timeBig').textContent = clock(S.mins * 60);
  $('#modeHint').textContent = S.mins ? `Countdown · ${S.mins} min · ${treeCount(S.mins)} tree${treeCount(S.mins) > 1 ? 's' : ''} · ${coinsFor(S.mins)} coins` : 'Stopwatch · drag the knob around the bubble to set a countdown';
  renderBubble();
  $('#title').value = S.title || '';
}
/* The bubble: a thin ring with a small bubble knob. Dragging the knob sets the time and the tree grows or shrinks to show what that time gives. */
let bubKey = '';
function bubLevel(m) { return !m ? 4 : m < 15 ? 1 : m < 45 ? 2 : m < 90 ? 3 : 4; }
function renderBubble() {
  const b = $('#bubble'), lvl = bubLevel(S.mins), key = S.tree + ':' + lvl, ang = step * 10 * Math.PI / 180, kx = 50 + 47 * Math.sin(ang), ky = 50 - 47 * Math.cos(ang), pct = step / 36 * 100;
  if (!b.querySelector('.twrap')) { b.innerHTML = ISLE3D + `<div class="twrap"></div><svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="knobG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#d8fbe8"/><stop offset="1" stop-color="#7fd6b4"/></radialGradient></defs><circle class="rt" cx="50" cy="50" r="47" fill="none"/><circle class="rp" cx="50" cy="50" r="47" fill="none" pathLength="100" transform="rotate(-90 50 50)"/><circle class="kn" r="3.4" fill="url(#knobG)"/><ellipse class="kh" rx="1.2" ry=".7" fill="#fff"/></svg>`; bubKey = ''; }
  if (key !== bubKey) { bubKey = key; b.querySelector('.twrap').innerHTML = treeSVG(S.tree, lvl, { noShadow: 1 }); }
  b.querySelector('.twrap').style.transform = `scale(${S.mins ? (.62 + .38 * Math.min(1, S.mins / 120)).toFixed(3) : .85})`;
  const rp = b.querySelector('.rp'), kn = b.querySelector('.kn'), kh = b.querySelector('.kh'); rp.setAttribute('stroke-dasharray', `${pct} 100`); kn.setAttribute('cx', kx.toFixed(2)); kn.setAttribute('cy', ky.toFixed(2)); kh.setAttribute('cx', (kx - 1).toFixed(2)); kh.setAttribute('cy', (ky - 1.3).toFixed(2));
}
function knobXY() { const r = $('#bubble').getBoundingClientRect(), a = step * 10 * Math.PI / 180, R_ = r.width * .5 * 1.12 * .94; return [r.left + r.width / 2 + R_ * Math.sin(a), r.top + r.height / 2 - R_ * Math.cos(a)]; }
let dragAng = null, dragMoved = false, dragStart = null;
function ptAngle(e) { const r = $('#bubble').getBoundingClientRect(), a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI; return a < 0 ? a + 360 : a; }
function dialPointer(e) {
  let raw = Math.round(ptAngle(e) / 10);
  if (step <= 6 && raw >= 30) raw = 0; else if (step >= 30 && raw <= 6) raw = 36;
  if (raw !== step) { step = Math.min(36, raw); renderHome(); }
}

/* ---------- session ---------- */
function startSession() {
  S.title = $('#title').value; save();
  cur = { id: uid(), start: Date.now(), target: S.mins * 60, tree: S.tree, land: S.land, key: '', paused: 0, pauseAt: 0, pv: [], hb: Date.now() };
  S.active = cur; saveNow(); sessionHooks(true);
  $('#sTitle').value = S.title; go('session'); clearInterval(timer); timer = setInterval(tick, 250); tick();
}
const elapsed = () => { const n = Date.now(), p = (cur.paused || 0) + (cur.pauseAt ? n - cur.pauseAt : 0); return (n - cur.start - p) / 1000 * SPEED; };
let hbN = 0;
function tick() {
  cur.hb = Date.now(); if (hbN++ % 20 === 0) { S.active = cur; save(); }
  if (cur.pauseAt && Date.now() - cur.pauseAt >= PAUSE_AUTO) resumeSession(true);
  const el = elapsed(), m = el / 60, over = cur.target && el >= cur.target;
  if (over && S.settings.countOver === false) return finish('ok');
  $('#sTimer').textContent = cur.target ? (over ? '+' + clock(el - cur.target) : clock(cur.target - el)) : clock(el);
  const ctl = $('#sCtl');
  $('#sPause').textContent = cur.pauseAt ? 'Resume' : 'Pause'; $('#sPause').style.display = el < CANCEL_SECS ? 'none' : '';
  ctl.textContent = el < CANCEL_SECS ? `Cancel (${Math.ceil(CANCEL_SECS - el)})` : over ? 'Finish' : cur.target ? 'Give up' : 'Stop';
  const lvl = Math.min(4, Math.ceil(m / 30)), sc = m < 30 ? .4 + .6 * Math.max(0, m - 2) / 28 : 1, key = m < 2 ? 's' : lvl + ':' + Math.round(sc * 25);
  pushUI(m < 2, lvl, sc);
  if (key !== cur.key) { cur.key = key; $('#sTree').innerHTML = m < 2 ? sproutSVG() : treeSVG(cur.tree, lvl, { scale: sc.toFixed(2) }); }
}
/* Plant button on Home: ask first, so a stray click never starts a session. */
function confirmStart() {
  ask('Plant now?', S.mins ? `Start a ${S.mins}-minute focus session?` : 'Start a stopwatch focus session?', 'Plant', startSession, 'ok');
}
/* A session cancelled inside the free 10 seconds is wiped completely: timer, saved "active" session, app/site blocking and PC-awake. */
function cancelSession() {
  stopTimer(); sessionHooks(false); S.active = null; cur = null; saveNow(); pushUI(); go('home'); renderHome();
}
/* stopNow = stop without asking. Used once the person has already confirmed (here or inside the widget). */
function stopNow() {
  if (!cur) return; const el = elapsed(), m = el / 60;
  if (el < CANCEL_SECS) return cancelSession();
  if ((cur.target && el >= cur.target) || (!cur.target && m >= WITHER_MIN)) return finish('ok');
  finish('withered');
}
function ctlClick() {
  if (!cur) return; const el = elapsed(), m = el / 60;
  if (el < CANCEL_SECS) return cancelSession();   // the free cancel window needs no question
  const over = cur.target && el >= cur.target;
  if (over || (!cur.target && m >= WITHER_MIN)) {   // the tree is safe: confirm before ending it
    const mm = Math.floor(m), n = treeCount(mm);
    return ask(over ? 'Finish this session?' : 'Stop focusing?', `You have focused for ${hm(mm)}. Ending now plants ${n} tree${n > 1 ? 's' : ''}.`, over ? 'Finish' : 'Stop', () => cur && finish('ok'), 'ok');
  }
  ask('Give up this session?', cur.target ? 'If you give up now, you will get a withered tree.' : `On Stopwatch Mode, if you stop within ${WITHER_MIN} minutes, you will get a withered tree.`, 'Give Up', () => cur && finish('withered'));
}
const stopTimer = () => { clearInterval(timer); timer = null; };
/* A session that crosses midnight (or the "beginning of a day" setting) is split by calendar day: each day gets its own focus time, trees and coins. */
const dOff = () => { const [h, m] = S.settings.dayStart.split(':').map(Number); return (h * 60 + m) * 60000; };
const nextDay = (t) => { const d = new Date(t - dOff()); d.setHours(24, 0, 0, 0); return d.getTime() + dOff(); };
function daySegments(c, end, ms) {
  const pv = (c.pv || []).slice(); if (c.pauseAt) pv.push([c.pauseAt, end]); else if (!pv.length && c.paused) pv.push([c.start, c.start + c.paused]);
  pv.sort((p, q) => p[0] - q[0]); const spans = []; let t = c.start;
  for (const [ps, pe] of pv) { if (ps > t) spans.push([t, Math.min(ps, end)]); t = Math.max(t, pe); }
  if (t < end) spans.push([t, end]);
  const segs = []; let left = ms;
  for (let [s, e] of spans) { if (left <= 0) break; e = Math.min(e, s + left); left -= e - s;
    while (s < e) { const b = nextDay(s), pe = Math.min(e, b), last = segs[segs.length - 1]; if (last && last.key === b) { last.ms += pe - s; last.e = pe; last.iv.push([s, pe]); } else segs.push({ key: b, s, e: pe, ms: pe - s, iv: [[s, pe]] }); s = pe; } }
  return segs.length ? segs : [{ key: 0, s: c.start, e: end, ms: 1, iv: [[c.start, end]] }];
}
function finish(status) {
  let el = elapsed(); stopTimer(); sessionHooks(false); S.active = null;
  if (cur.target && S.settings.countOver === false) el = Math.min(el, cur.target);
  const min = Math.floor(el / 60), n = status === 'ok' ? treeCount(min) : 0, c = status === 'ok' ? coinsFor(min) : 0;
  const segs = daySegments(cur, Date.now(), el * 1000 / SPEED), totMs = segs.reduce((q, g) => q + g.ms, 0) || 1;
  const share = (total) => { const raw = segs.map(g => total * g.ms / totMs), fl = raw.map(Math.floor); let rem = total - fl.reduce((q, v) => q + v, 0); raw.map((r, i) => [r - fl[i], i]).sort((p, q) => q[0] - p[0]).forEach(([, i]) => { if (rem-- > 0) fl[i]++; }); return fl; };
  const nT = share(n), nC = share(c), secs = segs.map(g => Math.round(el * g.ms / totMs)); secs[secs.length - 1] += Math.round(el) - secs.reduce((q, v) => q + v, 0);
  let lv = 0; const title = $('#sTitle').value;
  segs.forEach((g, i) => { const rec = { id: i ? cur.id + '~' + i : cur.id, start: i ? g.s : cur.start, end: g.e, focusSec: Math.max(0, secs[i]), status, tree: cur.tree, land: cur.land, iv: g.iv, trees: nT[i], lv: Array.from({ length: nT[i] }, () => ++lv), coins: nC[i], title, category: '' };
    S.sessions.push(rec); if (nC[i]) S.ledger.push({ id: uid(), src: 'session', ref: rec.id, c: nC[i], t: g.e }); });
  S.title = '';
  saveNow(); if (typeof checkNewAch === 'function') checkNewAch();
  if (status === 'ok') {
    $('#rCoin').textContent = coins();
    showLand($('#rLand'), sceneSVG(Array.from({ length: n }, (_, i) => ({ id: cur.tree, lvl: i + 1 })), { period: 'day', land: cur.land, k: 'r' }));
    $('#rMsg').textContent = (S.settings.phrases.ok || 'Nice! You’ve focused for {time} today.').replace('{time}', hm(todayMin()));
    chime(true);
    $('#rGain').innerHTML = `<span class="pill cn">+${c}</span>`; go('results'); if (c === 0) toast('Sessions under 10 minutes earn no coins');
  } else {
    $('#wMsg').textContent = S.settings.phrases.bad || 'It’s okay. Try again next time.'; chime(false); $('#wTree').innerHTML = witheredSVG(); $('#wTime').innerHTML = `<span class="pill" style="font-size:22px">${clock(el)}</span>`; go('withered');
  }
  cur = null; pushUI();
}

/* ---------- plants sheet, popups, store ---------- */
const pk = (T) => (T.gem ? 1e6 : 0) + T.price;
const byPrice = (a, b) => (sortDesc ? -1 : 1) * (pk(TREES[a]) - pk(TREES[b])) || TREES[a].n.localeCompare(TREES[b].n);
function renderPlants() {
  $('#plantGrid').innerHTML = S.owned.trees.slice().sort(byPrice).map(id => `<button class="cell ${id === S.tree ? 'sel' : ''}" data-tree="${id}">${treeSVG(id, 4)}${TREES[id].n}</button>`).join('');
}
function priceTag(own, price, can, gem) { return own ? '<span class="price own">✓</span>' : `<span class="price ${can ? '' : 'no'}"><i class="${gem ? 'gmI' : 'cnI'}"></i>${price.toLocaleString()}</span>`; }
/* Store pictures are drawn only when they scroll near the screen (84 trees is ~32,000 SVG nodes, which made scrolling lag). */
let artIO = null;
function lazyArt(root) {
  if (artIO) artIO.disconnect();
  const draw = (e) => { const [k, id] = e.dataset.a.split(':'); e.insertAdjacentHTML('afterend', k === 't' ? treeSVG(id, 4) : landSVG(id, [], { k: 's' })); e.remove(); }, els = $$('.art', root);
  if (!('IntersectionObserver' in window)) return els.forEach(draw);
  artIO = new IntersectionObserver((es) => es.forEach(en => { if (en.isIntersecting) { artIO.unobserve(en.target); draw(en.target); } }), { root, rootMargin: '500px 0px' });
  els.forEach(e => artIO.observe(e));
}
function renderStore() {
  $('#stCoin').textContent = coins().toLocaleString(); $('#stGem').textContent = gems();
  $$('.tabs [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const asc = (a, b, M) => (sortDesc ? -1 : 1) * ((M[a].gem ? 1e6 : 0) + M[a].price - (M[b].gem ? 1e6 : 0) - M[b].price);
  if (tab === 'plants') $('#storeGrid').innerHTML = TREE_IDS.slice().sort((a, b) => asc(a, b, TREES)).map(id => `<button class="cell" data-tree="${id}"><i class="art" data-a="t:${id}"></i>${TREES[id].n}${priceTag(S.owned.trees.includes(id), TREES[id].price, (TREES[id].gem ? gems() : coins()) >= TREES[id].price, TREES[id].gem)}</button>`).join('');
  else $('#storeGrid').innerHTML = LAND_IDS.slice().sort((a, b) => asc(a, b, LANDS)).map(id => `<button class="cell land" data-land="${id}"><i class="art" data-a="l:${id}"></i>${LANDS[id].n}${priceTag(S.owned.lands.includes(id), LANDS[id].price, coins() >= LANDS[id].price)}</button>`).join('');
  lazyArt($('#storeGrid'));
}
function openPopup(kind, id) {
  const T = kind === 'tree' ? TREES[id] : LANDS[id], own = (kind === 'tree' ? S.owned.trees : S.owned.lands).includes(id), can = (T.gem ? gems() : coins()) >= T.price;
  let body = kind === 'tree'
    ? `<div class="pop-tree">${treeSVG(id, 4)}</div><h3>${T.n}</h3><p>${T.q}</p><div class="stages">${[1, 2, 3, 4].map(l => `<div>${treeSVG(id, l, { noShadow: 1 })}<br>${STAGE_LABELS[l - 1]}</div>`).join('')}</div>`
    : `<div>${landSVG(id, [{ id: S.tree, lvl: 4 }], { k: 'p' })}</div><h3>${T.n}</h3><p>${T.q}</p>`;
  if (kind === 'land' && own) body += `<button class="buy" data-use="${id}">${S.land === id ? '✓ In use' : 'Use this land'}</button>`;
  else if (own) body += '<p class="ok">✓ Unlocked</p>';
  else body += `<button class="buy" data-buy="${kind}:${id}" ${can ? '' : 'disabled'}>Unlock &nbsp;<i class="${T.gem ? 'gmI' : 'cnI'}"></i>${can ? T.price.toLocaleString() : `<b>${T.price.toLocaleString()}</b>`}</button>`;
  $('#popBody').innerHTML = body; $('#popup').classList.add('on');
}
function buy(kind, id) {
  const T = kind === 'tree' ? TREES[id] : LANDS[id];
  if ((T.gem ? gems() : coins()) < T.price) return toast(T.gem ? 'Not enough gems yet' : 'Not enough coins yet');
  S.ledger.push(Object.assign({ id: uid(), src: 'buy', ref: kind + ':' + id, t: Date.now() }, T.gem ? { g: -T.price } : { c: -T.price }));
  (kind === 'tree' ? S.owned.trees : S.owned.lands).push(id); save(); renderStore(); openPopup(kind, id); toast(`${T.n} unlocked`);
}

/* ---------- import ---------- */
function openImport() {
  const imp = S.ledger.find(l => l.src === 'import') || {};
  $('#impCoin').value = imp.c || ''; $('#impGem').value = imp.g || '';
  $('#impTrees').innerHTML = TREE_IDS.map(id => `<label><input type="checkbox" value="${id}" ${S.owned.trees.includes(id) ? 'checked' : ''}>${treeSVG(id, 4, { noShadow: 1 })}${TREES[id].n}</label>`).join('');
  go('importp');
}
function saveImport() {
  S.ledger = S.ledger.filter(l => l.src !== 'import');
  S.ledger.push({ id: uid(), src: 'import', c: Math.max(0, +$('#impCoin').value || 0), g: Math.max(0, +$('#impGem').value || 0), t: Date.now() });
  const picked = $$('#impTrees input:checked').map(i => i.value);
  S.owned.trees = [...new Set([...S.owned.trees.filter(id => !TREES[id] || picked.includes(id)), ...picked])];
  if (!S.owned.trees.includes(S.tree)) S.tree = S.owned.trees[0];
  save(); go('home'); renderHome(); toast('Progress saved');
}


/* ---------- stage 3 session helpers: pause, blocking, awake, restore, widget ---------- */
const PAUSE_AUTO = 15 * 60000, PAUSE_MAX = 3;
function pauseSession() {
  if (cur.pauseAt) return resumeSession();
  const day = Date.now() - 86400000; S.pauses = (S.pauses || []).filter(t => t > day);
  if (S.pauses.length >= PAUSE_MAX) return toast('No pauses left (3 per 24 hours)');
  S.pauses.push(Date.now()); cur.pauseAt = Date.now(); S.active = cur; save(); toast('Paused. It resumes by itself after 15 minutes');
}
function resumeSession(auto) { if (!cur.pauseAt) return; const e = auto ? Math.min(Date.now(), cur.pauseAt + PAUSE_AUTO) : Date.now(); cur.paused = (cur.paused || 0) + e - cur.pauseAt; (cur.pv = cur.pv || []).push([cur.pauseAt, e]); cur.pauseAt = 0; S.active = cur; save(); }
function sessionHooks(on) {
  if (!api()) return; const st = S.settings;
  try {
    if (on) { if (st.awake) api().awake(true); api().block_start(st.blocked, st.allowed, st.blockSites ? st.sites : []).then(r => { if (r === 'admin') toast('Website blocking needs Administrator'); else if (r === 'reverted' || r === 'failed') toast('Windows or an antivirus undid the website block'); }); }
    else { api().awake(false); api().block_stop(); }
  } catch (e) { }
}
function restoreActive() {
  const a = S.active; if (!a) return; S.active = null;
  if (S.settings.witherClosed) { S.sessions.push({ id: a.id, start: a.start, end: Date.now(), focusSec: 0, status: 'withered', tree: a.tree, land: a.land, trees: 0, coins: 0, title: '', category: '' }); save(); toast('The app was closed, so that tree withered'); return; }
  a.hb = Date.now(); cur = a; S.active = cur; sessionHooks(true); go('session'); $('#sTitle').value = S.title; clearInterval(timer); timer = setInterval(tick, 250); tick();
}

/* ---------- always-on-top switches (main window and widget are separate; saved by the Windows side) ---------- */
function setTopUI(v) { $$('.topsw').forEach(b => { b.classList.toggle('on', !!v); b.setAttribute('aria-checked', !!v); b.querySelector('b').textContent = v ? 'ON' : 'OFF'; }); }
async function initTop() {
  $$('.topsw').forEach(b => b.onclick = async () => { const v = !b.classList.contains('on'); setTopUI(v); try { await api().set_top('main', v); } catch (e) { } });
  $('#sWidget').onclick = () => { if (!api()) return toast('The widget needs the Windows app'); api().open_widget(); };
  try { const p = await api().get_prefs(); setTopUI(p.mainTop); } catch (e) { }
}
function pushUI(sprout, lvl, sc) {
  if (!api()) return;
  const run = !!cur, el = run ? elapsed() : 0;
  try { api().push_ui({ running: run, time: run ? clock(cur.target ? Math.abs(cur.target - el) : el) : clock(S.mins * 60), tree: run ? cur.tree : S.tree, lvl: run ? (lvl || 1) : 4, scale: run ? +(sc || 1).toFixed(2) : 1, sprout: run ? !!sprout : false, today: hm(todayMin()), kind: !run ? 'idle' : el < CANCEL_SECS ? 'cancel' : (cur.target ? el >= cur.target : el / 60 >= WITHER_MIN) ? 'ok' : 'wither', fm: run ? hm(Math.floor(el / 60)) : '', trees: run ? treeCount(Math.floor(el / 60)) : 0, plan: S.mins ? `a ${S.mins}-minute focus session` : 'a stopwatch focus session' }); } catch (e) { }
}
function pollCmds() {
  if (!api()) return;
  setInterval(async () => { try { for (const c of await api().pop_cmds()) { if (c === 'plant' && !cur && $('#home').classList.contains('on')) startSession(); else if (c === 'plant' && !cur) { go('home'); startSession(); } else if (c === 'stop' && cur) stopNow(); else if (c === 'forest') { go('overview'); enterScreen('overview'); } } } catch (e) { } }, 800);
  setInterval(() => { if (!cur) pushUI(); }, 3000);
}
const _ac = { ctx: null };
function chime(good) {
  if (S.settings.sound === false) return; if (S.settings.ringtone === 'silent') return;
  if (S.settings.ringtone === 'vibrate') { try { api() && api().flash(); } catch (e) { } return; }
  try {
    const c = _ac.ctx = _ac.ctx || new (window.AudioContext || window.webkitAudioContext)(), now = c.currentTime;
    (good ? [523.25, 659.25, 783.99] : [392, 330]).forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, now + i * .16); g.gain.linearRampToValueAtTime(.16, now + i * .16 + .04); g.gain.exponentialRampToValueAtTime(.0008, now + i * .16 + 1.2); o.connect(g).connect(c.destination); o.start(now + i * .16); o.stop(now + i * .16 + 1.3); });
  } catch (e) { }
}

/* ---------- wiring ---------- */
function wire() {
  $('#btnStart').onclick = confirmStart; $('#sCtl').onclick = ctlClick; $('#wGo').onclick = $('#rGo').onclick = () => { go('home'); renderHome(); };
  $('#btnMenu').onclick = () => $('#menu').classList.add('on'); $('#btnAvatar').onclick = () => { go('settings'); enterScreen('settings'); };
  $('#btnMute').innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M3 3l18 18"/></svg>';
  $('#btnMute').onclick = () => { S.settings.sound = !(S.settings.sound !== false); save(); toast(S.settings.sound ? 'Sound on' : 'Sound off'); };
  $('#sPause').onclick = pauseSession;
  $('#sheet').onclick = (e) => { if (e.target.id === 'sheet') closeOv(); };
  $('#menu').onclick = (e) => { if (e.target.id === 'menu') closeOv(); };
  $('#popup').onclick = (e) => { if (e.target.id === 'popup') closeOv(); }; $('#popX').onclick = () => $('#popup').classList.remove('on');
  $('#btnPSort').onclick = () => { sortDesc = !sortDesc; renderPlants(); }; $('#btnSort').onclick = () => { sortDesc = !sortDesc; renderStore(); };
  $('#plantGrid').onclick = (e) => { const c = e.target.closest('[data-tree]'); if (!c) return; const id = c.dataset.tree; if (id === S.tree) return openPopup('tree', id); S.tree = id; save(); renderPlants(); renderHome(); };
  $('#storeGrid').onclick = (e) => { const c = e.target.closest('.cell'); if (c) openPopup(c.dataset.tree ? 'tree' : 'land', c.dataset.tree || c.dataset.land); };
  $('#popBody').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.buy) buy(...b.dataset.buy.split(':')); if (b.dataset.use) { S.land = b.dataset.use; save(); openPopup('land', S.land); renderStore(); } };
  $$('.tabs [data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; renderStore(); });
  $$('[data-close]').forEach(b => b.onclick = () => { go('home'); renderHome(); });
  $$('.menu [data-go]').forEach(b => b.onclick = () => { const g = b.dataset.go; if (g === 'x') return toast('Coming in a later stage'); if (g === 'store') { renderStore(); } if (g === 'home') return closeOv(); if (g === 'widget') { closeOv(); return openWidget(); } go(g); if (typeof enterScreen === 'function') enterScreen(g); });
  $$('#themeSeg button').forEach(b => b.onclick = () => { S.settings.theme = b.dataset.th; save(); applyTheme(); });
  $('#impSave').onclick = saveImport;
  const st = $('#stage');   // drag around the bubble to set the time; a plain click opens My Plants
  st.onpointerdown = (e) => { dragStart = [e.clientX, e.clientY]; const [kx, ky] = knobXY(); dragMoved = Math.hypot(e.clientX - kx, e.clientY - ky) < 26; if (dragMoved) dialPointer(e); st.setPointerCapture(e.pointerId); };
  st.onpointermove = (e) => { if (!dragStart) return; if (!dragMoved && Math.hypot(e.clientX - dragStart[0], e.clientY - dragStart[1]) < 8) return; dragMoved = true; dialPointer(e); };
  st.onpointerup = st.onpointercancel = () => { if (dragStart && !dragMoved) { renderPlants(); $('#sheet').classList.add('on'); } dragStart = null; };
  st.onwheel = (e) => { e.preventDefault(); step = Math.max(0, Math.min(36, step + (e.deltaY < 0 ? 1 : -1))); renderHome(); };
  $('#bubble').onkeydown = (e) => { if (e.key === 'Enter') { renderPlants(); $('#sheet').classList.add('on'); } if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { step = Math.min(36, step + 1); renderHome(); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { step = Math.max(0, step - 1); renderHome(); } };
  matchMedia('(prefers-color-scheme:dark)').addEventListener('change', applyTheme);
}

(async function init() {
  wire(); await loadState(); fillAbout(); step = Math.min(36, Math.round((S.mins || 0) / 5)); applyTheme(); renderHome();
  await sleep(700); go('home'); restoreActive(); pollCmds(); initTop();
})();
