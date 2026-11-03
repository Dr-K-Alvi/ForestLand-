/* mindful.js - Mindful Space: round pod mascot, multiple breathing techniques, soft synthesised sound. */
let mM = { st: 'main', secs: 300, mute: false, tm: null, hold: null, run: null };
const audio = { ctx: null, noise: null };
function podSVG() {
  return `<svg viewBox="0 0 240 240" class="pod" aria-hidden="true"><defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset=".45" stop-color="#ffc84a"/><stop offset="1" stop-color="#6a6a3a"/></linearGradient><linearGradient id="pc" x1="0" x2="1"><stop offset="0" stop-color="#c8ff1a"/><stop offset=".55" stop-color="#9ee000"/><stop offset="1" stop-color="#56803a"/></linearGradient></defs>
<ellipse cx="130" cy="130" rx="86" ry="96" fill="#0b3a2a" opacity=".6"/>
<ellipse cx="62" cy="122" rx="20" ry="13" fill="url(#pg)"/><ellipse cx="178" cy="122" rx="20" ry="13" fill="#6d6a3c"/>
<ellipse cx="92" cy="208" rx="22" ry="14" fill="#ffc038"/><ellipse cx="148" cy="208" rx="22" ry="14" fill="#6d6a3c"/>
<ellipse cx="120" cy="120" rx="84" ry="92" fill="url(#pg)"/>
<path d="M36 112 Q40 40 120 30 Q200 40 204 112 Q186 134 168 112 Q144 138 120 112 Q96 138 72 112 Q54 134 36 112Z" fill="url(#pc)"/>
<path d="M104 34 Q96 8 74 8 Q78 30 104 34Z" fill="#7fe000"/><path d="M122 34 Q132 8 156 10 Q150 32 122 34Z" fill="#4aa800"/>
<path d="M82 82 Q92 92 102 82 M138 82 Q148 92 158 82" stroke="#1d6a20" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M110 100 Q120 106 130 100" stroke="#1d6a20" stroke-width="5" fill="none" stroke-linecap="round"/>
<g transform="translate(206 168)"><circle r="11" fill="#7a3a2a"/><path d="M0 -11 V11" stroke="#2a1410" stroke-width="2"/><circle cx="-4" cy="-3" r="2" fill="#2a1410"/><circle cx="4" cy="4" r="2" fill="#2a1410"/></g></svg>`;
}

/* ---------- breathing techniques ----------
   Each technique builds its own phase list: {k: in|out|hold|rest, d: seconds, s: ring scale at the end of the phase, t: label, sub: cue}.
   Adjustments (adj) only change timing; the defining pattern/ratio stays. */
const fmt = (n) => String(Math.round(n * 100) / 100);
const HI = 1.28, LO = 1;
const TECH = [
  { id: 'box', name: 'Box Breathing', pat: '4-4-4-4', why: 'Focus and steady calm under pressure.', adj: { label: 'Seconds per side', min: 3, max: 6, step: 1, def: 4 },
    build: v => [{ k: 'in', d: v, s: HI }, { k: 'hold', d: v }, { k: 'out', d: v, s: LO }, { k: 'hold', d: v }] },
  { id: 'coherent', name: 'Coherent Breathing', pat: '5.5-5.5', why: 'About 5–6 breaths a minute for balance and relaxation (Dr Alan Watkins).', adj: { label: 'Seconds per breath phase', min: 4, max: 7, step: .5, def: 5.5, note: v => `${fmt(60 / (2 * v))} breaths per minute` },
    build: v => [{ k: 'in', d: v, s: HI }, { k: 'out', d: v, s: LO }] },
  { id: '478', name: '4-7-8 Breathing', pat: '4-7-8', why: 'Winding down, easing stress and preparing for sleep.', adj: { label: 'Pace (keeps the 4-7-8 ratio)', min: .5, max: 1.25, step: .25, def: 1, note: v => `${fmt(4 * v)} in · ${fmt(7 * v)} hold · ${fmt(8 * v)} out` },
    build: v => [{ k: 'in', d: 4 * v, s: HI }, { k: 'hold', d: 7 * v }, { k: 'out', d: 8 * v, s: LO }] },
  { id: '5555', name: '5-5-5-5 Breathing', pat: '5-5-5-5', why: 'A slower square pattern for deeper calm and mental clarity.', adj: { label: 'Seconds per side', min: 3, max: 7, step: 1, def: 5 },
    build: v => [{ k: 'in', d: v, s: HI }, { k: 'hold', d: v }, { k: 'out', d: v, s: LO }, { k: 'hold', d: v }] },
  { id: 'sigh', name: 'Physiological Sigh', pat: '2-1-6', why: 'Two quick inhales, one long exhale. The fastest way to settle stress.', adj: { label: 'Long exhale (seconds)', min: 5, max: 8, step: 1, def: 6 }, viz: 'sigh',
    build: v => [{ k: 'in', d: 2, s: 1.18, t: 'Breathe in', sub: 'Long, gentle breath through the nose' }, { k: 'in', d: 1, s: HI, t: 'Sip in more', sub: 'A second short top-up inhale' }, { k: 'out', d: v, s: LO, t: 'Long breath out', sub: 'Slow and extended, through the mouth' }, { k: 'rest', d: 2, t: 'Rest', sub: 'Breathe naturally' }] },
  { id: 'belly', name: 'Diaphragmatic Breathing', pat: '4-5', why: 'Slow belly breathing to relax the body and ease tension.', adj: { label: 'Inhale seconds (exhale is 1 s longer)', min: 3, max: 6, step: 1, def: 4 }, viz: 'belly',
    build: v => [{ k: 'in', d: v, s: HI, sub: 'Let your belly rise, chest stays still' }, { k: 'out', d: v + 1, s: LO, sub: 'Let your belly gently fall' }] },
  { id: '46', name: 'Extended Exhale (4-6)', pat: '4-6', why: 'A longer out-breath activates the body’s calming response.', adj: { label: 'Inhale seconds (exhale is 1.5×)', min: 3, max: 5, step: 1, def: 4, note: v => `${fmt(v)} in · ${fmt(v * 1.5)} out` },
    build: v => [{ k: 'in', d: v, s: HI }, { k: 'out', d: v * 1.5, s: LO }] },
  { id: 'nadi', name: 'Alternate Nostril (Nadi Shodhana)', pat: '4-4-4-4', why: 'Balancing and centring before focus or meditation.', adj: { label: 'Seconds per phase', min: 3, max: 6, step: 1, def: 4 }, viz: 'nadi',
    build: v => [{ k: 'in', d: v, s: HI, t: 'Breathe in', side: 'L', sub: 'Left nostril · close the right with your thumb' }, { k: 'out', d: v, s: LO, t: 'Breathe out', side: 'R', sub: 'Right nostril · close the left with your ring finger' }, { k: 'in', d: v, s: HI, t: 'Breathe in', side: 'R', sub: 'Right nostril' }, { k: 'out', d: v, s: LO, t: 'Breathe out', side: 'L', sub: 'Left nostril' }] }
];
const DEFT = { in: 'Breathe in', out: 'Breathe out', hold: 'Hold', rest: 'Rest' }, TONE = { in: 523, out: 330, hold: 392, rest: 262 };
const techOf = (id) => TECH.find(t => t.id === id) || TECH[0];
function mPref() { S.mind = S.mind || {}; S.mind.adj = S.mind.adj || {}; S.mind.holds = S.mind.holds || 'full'; if (!TECH.some(t => t.id === S.mind.tech)) S.mind.tech = 'box'; return S.mind; }
const adjVal = (t) => { const p = mPref(), v = +p.adj[t.id]; return t.adj && v >= t.adj.min && v <= t.adj.max ? v : t.adj ? t.adj.def : 1; };
// Phases for the current choice; the hold setting (full / shorter / skipped) only ever touches hold phases
function mPhases(t = techOf(mPref().tech)) {
  const hm = mPref().holds;
  return t.build(adjVal(t)).map(p => ({ ...p, t: p.t || DEFT[p.k], sub: p.sub || '' }))
    .filter(p => !(p.k === 'hold' && hm === 'none'))
    .map(p => p.k === 'hold' && hm === 'short' ? { ...p, d: Math.max(1, Math.round(p.d / 2 * 2) / 2) } : p);
}
function mPattern(t = techOf(mPref().tech)) {
  if (t.id === 'nadi') return fmt(adjVal(t)) + ' × 4';
  if (t.id === 'sigh') return `2-1-${fmt(adjVal(t))}`;
  return mPhases(t).filter(p => p.k !== 'rest').map(p => fmt(p.d)).join('-');
}
const mClock = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
const SAFE = 'Breathe gently and naturally. If you feel dizzy, uncomfortable or breathless, stop and breathe normally.';
const SAFE_HOLD = ' You can shorten or skip any hold.';

function mDraw() {
  const m = mM, t = `${m.secs / 60 | 0} : ${pad(m.secs % 60)}`, tc = techOf(mPref().tech), hasHold = mPhases(tc).some(p => p.k === 'hold') || tc.build(adjVal(tc)).some(p => p.k === 'hold');
  if (m.st === 'main') $('#mindful').innerHTML = `<div class="mpill" id="mPill">${t}</div>
<div class="mtrow"><button class="mtech" id="mTech" aria-label="Choose breathing technique"><b>${esc(tc.name)}</b><span>${mPattern(tc)}</span><i>▾</i></button><button class="mgear" id="mAdj" aria-label="Adjust breathing">Adjust</button></div>
<p class="mwhy">${esc(tc.why)}</p>
<div class="mpod">${podSVG()}<i class="lfs l1"></i><i class="lfs l2"></i><i class="lfs l3"></i></div><button class="wind" id="mGo" aria-label="Start breathing"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7"/></svg></button><p class="msafe">${SAFE}${hasHold ? SAFE_HOLD : ''}</p><div class="mbar"><button data-m="mute">${m.mute ? 'Unmute' : 'Mute'}</button><button data-m="leave" id="mLeave">Leave</button><button data-m="timer">Timer</button></div><p class="mhold" id="mHold"></p>`;
  else if (m.st === 'breathe') $('#mindful').innerHTML = `<div class="mpill" id="mPill">${t}</div><h2 id="mTxt">Get ready</h2><p class="msub" id="mSub">&nbsp;</p><div class="mcnt" id="mCnt"></div><div class="mprog"><div id="mProg"></div></div><div class="mring ${tc.viz || ''}" id="mRing"><div class="mcircle">${podSVG()}</div></div><div class="mnos" id="mNos" ${tc.viz === 'nadi' ? '' : 'hidden'}><span data-s="L">Left</span><span data-s="R">Right</span></div><p class="mstat" id="mStat"></p><p class="msafe" id="mSafe">${SAFE}${hasHold ? SAFE_HOLD : ''}</p><div class="mbar mctl"><button id="mPause" data-m="pause">Pause</button><button id="mSkip" data-m="skip" hidden>Skip hold</button><button data-m="end">End</button><button data-m="leave" id="mLeave">Leave</button></div><p class="mhold" id="mHold"></p>`;
  else $('#mindful').innerHTML = `<div class="mdone"><div class="mpod sm">${podSVG()}</div><h2>Mindfulness Complete</h2><p>Do you feel your mind is calmer? What’s next?</p>${m.sum ? `<p class="msum">${esc(m.sum)}</p>` : ''}<button class="cta" id="mFocus">Start Focusing</button><button class="cta ghost" id="mHome">Home</button></div>`;
}
function mSound(on) {
  try {
    const c = audio.ctx = audio.ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (!on) { if (audio.noise) { audio.noise.g.gain.linearRampToValueAtTime(0, c.currentTime + .6); const n = audio.noise; setTimeout(() => n.s.stop(), 800); audio.noise = null; } return; }
    if (audio.noise || mM.mute) return;
    const b = c.createBuffer(1, c.sampleRate * 4, c.sampleRate), d = b.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }   // soft brown noise
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0; g.gain.linearRampToValueAtTime(.35, c.currentTime + 1.2);
    s.connect(f).connect(g).connect(c.destination); s.start(); audio.noise = { s, g };
  } catch (e) { }
}
function mPing(f) {
  if (mM.mute) return;
  try { const c = audio.ctx = audio.ctx || new AudioContext(), o = c.createOscillator(), g = c.createGain(), n = c.currentTime; o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, n); g.gain.linearRampToValueAtTime(.12, n + .05); g.gain.exponentialRampToValueAtTime(.001, n + 1.6); o.connect(g).connect(c.destination); o.start(n); o.stop(n + 1.7); } catch (e) { }
}

/* ---------- breathing engine ----------
   One clock of "active" seconds (frozen while paused) drives text, countdown, progress, ring and counters,
   so everything stays in step. The ring is moved by one CSS transition per phase, with the phase's own duration. */
function mRing(ph, left) {
  const r = $('#mRing'); if (!r) return;
  const tc = techOf(mPref().tech), to = ph.s == null ? mM.run.sc : ph.s;
  const tf = (s) => tc.viz === 'belly' ? `scale(${1 + (s - 1) * .55},${s})` : `scale(${s})`;
  r.style.transition = 'none'; r.style.transform = tf(mM.run.sc); void r.offsetWidth;
  if (ph.k === 'in' || ph.k === 'out') { r.style.transition = `transform ${Math.max(.05, left / SPEED)}s ${ph.k === 'in' ? 'cubic-bezier(.35,0,.35,1)' : 'cubic-bezier(.3,0,.4,1)'}`; r.style.transform = tf(to); mM.run.sc = to; }
}
function mShowPhase(ph, left) {
  mM.run.sc = mM.run.sc || LO;
  if ($('#mTxt')) $('#mTxt').textContent = ph.t; if ($('#mSub')) $('#mSub').innerHTML = esc(ph.sub) || '&nbsp;';
  const sk = $('#mSkip'); if (sk) sk.hidden = !(ph.k === 'hold' || ph.k === 'rest');
  const ns = $('#mNos'); if (ns) $$('#mNos span').forEach(s => s.classList.toggle('on', s.dataset.s === ph.side));
  mRing(ph, left);
}
function mStart() {
  const r = { ph: mPhases(), i: 0, pe: 0, act: 0, cyc: 0, sc: LO, paused: false, last: Date.now(), tech: mPref().tech };
  mM.run = r; mM.st = 'breathe'; mDraw(); mSound(true);
  mShowPhase(r.ph[0], r.ph[0].d); mPing(TONE[r.ph[0].k]);
  clearInterval(mM.tm); mM.tm = setInterval(mTick, 50);
}
function mTick() {
  const r = mM.run; if (!r || mM.st !== 'breathe') return clearInterval(mM.tm);
  const now = Date.now(), dt = (now - r.last) / 1000; r.last = now; if (r.paused) return;
  if (dt > 2) return mPause(true);                     // tab was asleep/hidden: stop rather than jump ahead
  const d = dt * SPEED; r.act += d; r.pe += d;
  let ph = r.ph[r.i], moved = false;
  while (r.pe >= ph.d) {                              // carry any overshoot into the next phase
    r.pe -= ph.d; r.i++; if (r.i >= r.ph.length) { r.i = 0; r.cyc++; } ph = r.ph[r.i]; moved = true;
  }
  const left = Math.max(0, mM.secs - r.act);
  if (left <= 0) { clearInterval(mM.tm); mSound(false); mM.sum = `${r.cyc} cycle${r.cyc === 1 ? '' : 's'} of ${techOf(r.tech).name} · ${mClock(r.act)}`; mM.st = 'done'; mM.run = null; mDraw(); chime(true); return; }
  if (moved) { mShowPhase(ph, ph.d - r.pe); mPing(TONE[ph.k]); }
  const ls = Math.ceil(left - 1e-9); $('#mPill').textContent = `${ls / 60 | 0} : ${pad(ls % 60)}`;
  $('#mCnt').textContent = Math.max(1, Math.ceil(ph.d - r.pe - 1e-9));
  $('#mProg').style.width = (r.pe / ph.d * 100) + '%';
  $('#mStat').textContent = `Cycle ${r.cyc + 1} · ${mClock(r.act)} elapsed · ${r.cyc} completed`;
}
function mPause(auto) {
  const r = mM.run; if (!r || mM.st !== 'breathe') return;
  r.paused = !r.paused; r.last = Date.now();
  const ring = $('#mRing'), b = $('#mPause');
  if (r.paused) {                                      // freeze the ring exactly where it is
    if (ring) { const cs = getComputedStyle(ring).transform; ring.style.transition = 'none'; ring.style.transform = cs; }
    mSound(false); if (b) b.textContent = 'Resume'; if ($('#mSub')) $('#mSub').textContent = auto === true ? 'Paused automatically. Resume when ready.' : 'Paused. Breathe naturally.';
  } else {
    const ph = r.ph[r.i]; mSound(true); if (b) b.textContent = 'Pause';
    if (ring) { const cur = getComputedStyle(ring).transform; ring.style.transition = 'none'; ring.style.transform = cur; void ring.offsetWidth; r.sc = ph.k === 'hold' || ph.k === 'rest' ? r.sc : (ph.s == null ? r.sc : ph.s); const tc = techOf(r.tech); const tf = (s) => tc.viz === 'belly' ? `scale(${1 + (s - 1) * .55},${s})` : `scale(${s})`; if (ph.k === 'in' || ph.k === 'out') { ring.style.transition = `transform ${Math.max(.05, (ph.d - r.pe) / SPEED)}s ease-in-out`; ring.style.transform = tf(ph.s); } }
    if ($('#mSub')) $('#mSub').innerHTML = esc(ph.sub) || '&nbsp;';
  }
}
function mSkip() {                                       // jump straight past a hold / rest
  const r = mM.run; if (!r || r.paused) return; const ph = r.ph[r.i]; if (ph.k !== 'hold' && ph.k !== 'rest') return;
  r.act += Math.max(0, ph.d - r.pe); r.pe = 0; r.i++; if (r.i >= r.ph.length) { r.i = 0; r.cyc++; }
  const n = r.ph[r.i]; mShowPhase(n, n.d); mPing(TONE[n.k]);
}
function mEnd() { clearInterval(mM.tm); mM.run = null; mSound(false); mM.st = 'main'; mDraw(); }
function mLeave() { clearInterval(mM.tm); mM.run = null; mSound(false); mM.st = 'main'; go('home'); renderHome(); }
function enterMindful() { clearInterval(mM.tm); mM.run = null; mM.st = 'main'; mPref(); mDraw(); }

/* ---------- technique picker + adjustments ---------- */
function mPickDlg() {
  const cur = mPref().tech;
  dlg(`<h3>Breathing technique</h3><div class="mtl">${TECH.map(t => `<button class="mt ${t.id === cur ? 'on' : ''}" data-tech="${t.id}" aria-pressed="${t.id === cur}"><span class="mt1"><b>${esc(t.name)}</b><em>${t.id === cur ? mPattern(t) : t.pat}</em></span><span class="mt2">${esc(t.why)}</span></button>`).join('')}</div>`);
}
function mAdjDlg() {
  const p = mPref(), t = techOf(p.tech), a = t.adj, v = adjVal(t), hasHold = t.build(v).some(x => x.k === 'hold');
  dlg(`<h3>${esc(t.name)}</h3><p class="note">Changes keep the pattern’s shape; only the pace changes.</p>
  ${a ? `<label class="madj">${esc(a.label)}<b id="mAV">${fmt(v)}</b><input type="range" id="mAR" min="${a.min}" max="${a.max}" step="${a.step}" value="${v}"></label><p class="note" id="mAN">${a.note ? a.note(v) : ''}</p>` : ''}
  ${hasHold ? `<div class="madj">Breath holds</div><div class="seg mini" id="mHSeg">${[['full', 'Full'], ['short', 'Shorter'], ['none', 'Skip']].map(([k, l]) => `<button data-mhold="${k}" class="${p.holds === k ? 'on' : ''}">${l}</button>`).join('')}</div><p class="note">Never hold longer than is comfortable. Use Shorter or Skip any time.</p>` : ''}
  <button class="buy" data-mdone="1">Done</button>`);
}
document.addEventListener('input', (e) => {
  if (e.target.id !== 'mAR') return; const p = mPref(), t = techOf(p.tech); p.adj[t.id] = +e.target.value; save();
  $('#mAV').textContent = fmt(+e.target.value); const n = $('#mAN'); if (n && t.adj.note) n.textContent = t.adj.note(+e.target.value);
});
document.addEventListener('click', (e) => {
  const mindOn = $('#mindful').classList.contains('on');
  if (!mindOn) { const mt = e.target.closest('[data-mt]'); if (mt) { mM.secs = +mt.dataset.mt * 60; closePop(); if ($('#mPill')) mDraw(); } return; }
  const mt = e.target.closest('[data-mt]'); if (mt) { mM.secs = +mt.dataset.mt * 60; closePop(); mDraw(); return; }
  const tk = e.target.closest('[data-tech]'); if (tk) { if (mM.st === 'main') { mPref().tech = tk.dataset.tech; save(); closePop(); mDraw(); } return; }
  const mh = e.target.closest('[data-mhold]'); if (mh) { mPref().holds = mh.dataset.mhold; save(); mAdjDlg(); if (mM.st === 'main') mDraw(); return; }
  if (e.target.closest('[data-mdone]')) { closePop(); if (mM.st === 'main') mDraw(); return; }
  if (e.target.closest('#mTech')) return mPickDlg(); if (e.target.closest('#mAdj')) return mAdjDlg();
  if (e.target.closest('#mGo')) return mStart();
  if (e.target.closest('#mFocus')) { mLeave(); return; } if (e.target.closest('#mHome')) return mLeave();
  const b = e.target.closest('[data-m]'); if (!b) return;
  if (b.dataset.m === 'mute') { mM.mute = !mM.mute; if (mM.mute) mSound(false); mDraw(); }
  if (b.dataset.m === 'pause') mPause(); if (b.dataset.m === 'skip') mSkip(); if (b.dataset.m === 'end') mEnd();
  if (b.dataset.m === 'timer') dlg(`<h3>Timer</h3><div class="opts">${[1, 3, 5, 10, 15, 20].map(n => `<button class="opt ${n * 60 === mM.secs ? 'on' : ''}" data-mt="${n}">${n} min</button>`).join('')}</div>`);
});
// Leave needs a press-and-hold (1.2 s) so it is never hit by accident
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('#mLeave')) return; $('#mHold').textContent = 'Keep holding to leave'; clearTimeout(mM.hold); mM.hold = setTimeout(mLeave, 1200);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => document.addEventListener(ev, () => { clearTimeout(mM.hold); const h = $('#mHold'); if (h) h.textContent = ''; }));
const _es4 = enterScreen; enterScreen = function (id) { if (id === 'mindful') enterMindful(); else _es4(id); };
