/* settings.js - Settings screen, dialogs, sync, backup, reminders, widget launcher. */
const setS = (k, v) => { S.settings[k] = v; S.settingsT = Date.now(); save(); };
const DAYN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const RING = { normal: 'Normal', vibrate: 'Vibrate (flash taskbar)', silent: 'Silent', system: 'System Default' };
const DELAYS = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'];
const onoff = (id, label, v) => `<div class="srow"><span>${label}</span><button class="tg ${v ? 'on' : ''}" data-tg="${id}" role="switch" aria-checked="${!!v}" aria-label="${label}"></button></div>`;
const val = (id, label, v) => `<button class="srow" data-sel="${id}"><span>${label}</span><em>${v || ''}</em></button>`;
function renderSettings() {
  const st = S.settings, ago = S.lastSync ? Math.max(1, Math.round((Date.now() - S.lastSync) / 60000)) + ' min. ago' : 'never';
  $('#setBody').innerHTML = `<div class="setin">
  <div class="scard"><div class="who"><b>Forestland</b><small>Everything stays on this PC</small></div>${val('sync', 'Sync', '⟳ ' + ago)}${val('export', 'Export backup', '')}${val('import', 'Import backup', '')}${val('prog', 'Import my progress', '')}</div>
  <div class="scard"><h3>Planting and Timer</h3>${val('allowed', 'Always-allowed apps', st.allowed.length || 'Off')}${val('blocked', 'Blocked apps', st.blocked.length || 'Off')}${onoff('blockSites', 'Block websites (needs Administrator)', st.blockSites)}${val('sites', 'Blocked websites', st.sites.length || 'Off')}${val('phrases', 'Custom Phrases', '')}${onoff('awake', 'Keep PC awake during sessions', st.awake)}${onoff('witherClosed', 'Wither the tree when Forestland is closed', st.witherClosed)}${onoff('countOver', 'Count exceeded time', st.countOver)}</div>
  <div class="scard"><h3>Forest Overview</h3>${val('firstDay', 'First Day of the Week', DAYN[st.firstDay])}${val('dayStart', 'The beginning time of a day', st.dayStart === '00:00' ? '00:00 (Default)' : 'Delay at ' + st.dayStart)}${onoff('hours', 'Display Focused Time in Hours', st.hours)}${onoff('noExpand', 'Don’t Expand Forest Land Unless it’s Full', st.noExpand)}${onoff('byTime', 'Arrange Trees by Planting Time', st.byTime)}</div>
  <div class="scard"><h3>Sound and Notification</h3>${val('reminders', 'Planting Reminder', st.reminders.length || 'Off')}${val('ringtone', 'Ringtone mode during planting', RING[st.ringtone])}${onoff('sound', 'Sound Effect', st.sound !== false)}</div>
  <div class="scard"><h3>Other</h3>${val('lang', 'Change Language', 'English')}${val('land', 'Land Style', '')}<div class="srow"><span>Theme</span><div class="seg mini" id="themeSeg">${['light', 'dark', 'auto'].map(t => `<button data-th="${t}" class="${st.theme === t ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>${val('widget', 'Desktop Widget', 'Open')}${val('about', 'About Forestland', 'v' + APP_VERSION)}</div></div>`;
}
function dlg(html) { $('#popBody').innerHTML = html; $('#popup').classList.add('on'); }
const closePop = () => $('#popup').classList.remove('on');
const choose = (title, opts, cur, key) => dlg(`<h3>${title}</h3><div class="opts">${opts.map(([v, l]) => `<button class="opt ${v === cur ? 'on' : ''}" data-set="${key}" data-v="${v}">${l}</button>`).join('')}</div>`);
const listEditor = (title, key, hint) => dlg(`<h3>${title}</h3><p class="note">${hint}</p><textarea id="lst" rows="7">${esc(S.settings[key].join('\n'))}</textarea><button class="buy" data-savelist="${key}">Save</button>`);

/* ---------- merge + sync ---------- */
function mergeState(r) {
  const byId = (a, b) => [...new Map([...a, ...b].map(x => [x.id, x])).values()];
  S.del = [...new Set([...(S.del || []), ...(r.del || [])])];
  S.sessions = byId(S.sessions, r.sessions || []).filter(x => !S.del.includes(x.id));
  let led = byId(S.ledger, r.ledger || []).filter(l => !(l.src === 'session' && S.del.includes(l.ref)));
  const imps = led.filter(l => l.src === 'import').sort((a, b) => (b.t || 0) - (a.t || 0)); led = led.filter(l => l.src !== 'import').concat(imps.slice(0, 1)); S.ledger = led;
  const ro = r.owned || {}; S.owned.trees = [...new Set([...S.owned.trees, ...(ro.trees || [])])]; S.owned.lands = [...new Set([...S.owned.lands, ...(ro.lands || [])])];
  S.ach = Object.assign({}, r.ach || {}, S.ach || {}); S.perfect = [...new Set([...(S.perfect || []), ...(r.perfect || [])])]; S.pauses = [...new Set([...(S.pauses || []), ...(r.pauses || [])])];
  if (r.chal && (!S.chal || r.chal.key > S.chal.key)) S.chal = r.chal; else if (r.chal && S.chal && r.chal.key === S.chal.key) S.chal.items.forEach((c, i) => { if (r.chal.items[i] && r.chal.items[i].claimed) c.claimed = true; });
  if (r.chk && (!S.chk || r.chk.key > S.chk.key)) S.chk = r.chk; else if (r.chk && S.chk && r.chk.key === S.chk.key && (r.chk.times || []).length > S.chk.times.length) S.chk.times = r.chk.times;
  if ((r.settingsT || 0) > (S.settingsT || 0)) { const keep = S.settings.syncFolder; S.settings = Object.assign({}, S.settings, r.settings, { syncFolder: keep }); S.settingsT = r.settingsT; }
}
async function doSync() {
  if (!api()) return toast('Sync works in the Windows app');
  try {
    if (!S.settings.syncFolder) { const f = await api().pick_folder(); if (!f) return; S.settings.syncFolder = f; }
    const t = await api().sync_read(S.settings.syncFolder); let r = null; try { r = JSON.parse(t); } catch (e) { }
    if (r) mergeState(r); S.lastSync = Date.now(); const out = JSON.stringify(S);
    await api().sync_write(S.settings.syncFolder, out); await api().save(out);
    applyTheme(); renderHome(); toast('Synced'); if ($('#settings').classList.contains('on')) renderSettings();
  } catch (e) { toast('Sync failed: check the folder'); }
}

/* ---------- reminders ---------- */
function checkReminders() {
  const d = new Date(), hhmmNow = `${pad(d.getHours())}:${pad(d.getMinutes())}`, key = dkey(d) + hhmmNow;
  for (const r of S.settings.reminders) if (r.on !== false && r.time === hhmmNow && r.days.includes(d.getDay()) && S._rem !== key) {
    S._rem = key; toast('Time to plant a tree'); chime(true);
    try { if (window.Notification && Notification.permission === 'granted') new Notification('Forestland', { body: 'Time to plant a tree' }); } catch (e) { }
  }
}
setInterval(checkReminders, 20000);

function openWidget() { if (!api()) return toast('The widget needs the Windows app'); api().open_widget(); }

/* ---------- events ---------- */
document.addEventListener('click', async (e) => {
  const t = e.target, sel = t.closest('[data-sel]'), tg = t.closest('[data-tg]'), set = t.closest('[data-set]'), sv = t.closest('[data-savelist]'), th = t.closest('#themeSeg [data-th]');
  if (tg) { const k = tg.dataset.tg, v = !(k === 'sound' ? S.settings.sound !== false : S.settings[k]);
    if (k === 'blockSites' && v && api()) { const adm = await api().is_admin(); if (!adm) return ask('Administrator needed', 'Blocking websites edits the Windows hosts file. Restart Forestland as Administrator?', 'Restart', () => api().relaunch_admin()); }
    setS(k, v); renderSettings(); return; }
  if (th) { setS('theme', th.dataset.th); applyTheme(); renderSettings(); return; }
  if (set) { const k = set.dataset.set, v = set.dataset.v; setS(k, /^\d+$/.test(v) ? +v : v); closePop(); renderSettings(); if (k === 'firstDay' || k === 'dayStart') renderHome(); return; }
  if (sv) { setS(sv.dataset.savelist, $('#lst').value.split('\n').map(x => x.trim()).filter(Boolean)); closePop(); renderSettings(); return; }
  if (t.closest('#btnSync')) return doSync();
  if (t.closest('[data-rdel]')) { const r = S.settings.reminders; r.splice(+t.closest('[data-rdel]').dataset.rdel, 1); setS('reminders', r); return remDialog(); }
  if (t.closest('#remAdd')) { const days = $$('#remDays input:checked').map(i => +i.value); if (!$('#remTime').value || !days.length) return toast('Pick a time and at least one weekday'); const r = S.settings.reminders; r.push({ time: $('#remTime').value, days, on: true }); setS('reminders', r); if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); return remDialog(); }
  if (t.closest('#phSave')) { setS('phrases', { ok: $('#phOk').value.trim(), bad: $('#phBad').value.trim() }); closePop(); return toast('Saved'); }
  if (!sel) return;
  const id = sel.dataset.sel;
  if (id === 'sync') return doSync();
  if (id === 'export') { if (!api()) return toast('Export works in the Windows app'); return toast(await api().export_data(JSON.stringify(S)) ? 'Backup saved' : 'Cancelled'); }
  if (id === 'import') { if (!api()) return; const txt = await api().import_data(); if (!txt) return; try { mergeState(JSON.parse(txt)); save(); renderHome(); renderSettings(); toast('Backup merged in'); } catch (er) { toast('That file is not a Forestland backup'); } return; }
  if (id === 'prog') return openImport();
  if (id === 'about') return go('about');
  if (id === 'land') { tab = 'lands'; renderStore(); return go('store'); }
  if (id === 'widget') return openWidget();
  if (id === 'lang') return toast('English only for now');
  if (id === 'firstDay') return choose('First Day of the Week', [1, 2, 3, 4, 5, 6, 0].map(d => [d, DAYN[d]]), S.settings.firstDay, 'firstDay');
  if (id === 'dayStart') return choose('The beginning time of a day', DELAYS.map(v => [v, v === '00:00' ? '00:00 (Default)' : 'Delay at ' + v]), S.settings.dayStart, 'dayStart');
  if (id === 'ringtone') return choose('Ringtone mode during planting', Object.entries(RING), S.settings.ringtone, 'ringtone');
  if (id === 'allowed') return listEditor('Always-allowed apps', 'allowed', 'One process name per line (for example chrome.exe). These are never closed.');
  if (id === 'blocked') return listEditor('Blocked apps', 'blocked', 'One process name per line (for example steam.exe). They are closed during a session; your tree stays healthy.');
  if (id === 'sites') return listEditor('Blocked websites', 'sites', 'One domain per line (for example youtube.com). Needs Administrator.');
  if (id === 'phrases') return dlg(`<h3>Custom Phrases</h3><p class="note">Use {time} for today’s focus time. Leave blank for the default.</p><label class="fld">Result message<input id="phOk" value="${esc(S.settings.phrases.ok)}"></label><label class="fld">Withered message<input id="phBad" value="${esc(S.settings.phrases.bad)}"></label><button class="buy" id="phSave">Save</button>`);
  if (id === 'reminders') return remDialog();
});
function remDialog() {
  const rs = S.settings.reminders;
  dlg(`<h3>Planting Reminder</h3>${rs.map((r, i) => `<div class="rrow"><b>${r.time}</b><span>${r.days.map(d => DAYN[d].slice(0, 3)).join(' ')}</span><button class="ic sm" data-rdel="${i}" aria-label="Delete reminder">✕</button></div>`).join('') || '<p class="note">No reminders yet.</p>'}<label class="fld">Time<input type="time" id="remTime" value="09:00"></label><div id="remDays" class="days">${DAYN.map((n, i) => `<label><input type="checkbox" value="${i}" ${i > 0 && i < 6 ? 'checked' : ''}>${n.slice(0, 2)}</label>`).join('')}</div><button class="buy" id="remAdd">Add reminder</button>`);
}
$('#btnSync').style.display = '';
const _es3 = enterScreen; enterScreen = function (id) { if (id === 'settings') renderSettings(); else _es3(id); };
