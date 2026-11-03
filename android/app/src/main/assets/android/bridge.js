/* bridge.js - Android adapter. Injected at document start by MainActivity; does nothing outside the Android app.
   It recreates the small part of the pywebview API that the shared web UI calls, so the web code stays the same. */
(function () {
  'use strict';
  var A = window.Android;
  if (!A) return;
  window.FL_ANDROID = true;

  /* ---- promise helpers for calls that finish later (file pickers) ---- */
  var pend = {}, n = 0;
  window.__flResolve = function (id, v) { var f = pend[id]; if (f) { delete pend[id]; f(v); } };
  var later = function (fn) { return new Promise(function (res) { var id = ++n; pend[id] = res; try { fn(id); } catch (e) { res(''); } }); };

  var yes = function () { return Promise.resolve(true); };
  window.pywebview = { api: {
    load: function () { return Promise.resolve(A.load()); },
    save: function (t) { return Promise.resolve(A.save(t)); },
    pop_cmds: function () { try { return Promise.resolve(JSON.parse(A.popCmds())); } catch (e) { return Promise.resolve([]); } },
    export_data: function (t) { return later(function (id) { A.exportData(id, t); }).then(function (v) { return v === '1'; }); },
    import_data: function () { return later(function (id) { A.importData(id); }); },
    pick_folder: function () { return later(function (id) { A.pickFolder(id); }); },
    sync_read: function (f) { return Promise.resolve(A.syncRead(f)); },
    sync_write: function (f, t) { return Promise.resolve(A.syncWrite(f, t)); },
    awake: function (on) { A.keepAwake(!!on); return yes(); },
    flash: function () { A.vibrate(); return yes(); },
    /* Windows-only features: reported as unavailable / harmless */
    block_start: function () { return Promise.resolve('ok'); },
    block_stop: yes, is_admin: function () { return Promise.resolve(false); }, relaunch_admin: function () { return Promise.resolve(false); },
    get_prefs: function () { return Promise.resolve({ mainTop: false, widgetTop: false, widgetMode: 'normal', widgetAlpha: 100 }); },
    set_top: yes, widget_mode: yes, widget_alpha: yes, drag_widget: yes, resize_widget: yes,
    push_ui: yes, widget_state: function () { return Promise.resolve({}); }, cmd: yes, open_main: yes,
    open_widget: function () { var m = A.pinWidget(); try { window.toast(m); } catch (e) { } return yes(); }
  } };
  document.addEventListener('DOMContentLoaded', function () {
    window.dispatchEvent(new Event('pywebviewready'));
    var st = document.createElement('style');           // "always on top" does not exist on phones
    st.textContent = '.topsw{display:none!important}';
    document.head.appendChild(st);
  });

  /* ---- Android Back button: close overlay -> back to Home -> (native decides: leave / keep session running) ---- */
  window.__flBack = function () {
    try {
      if (typeof cur !== 'undefined' && cur) return false;                      // a session is on screen: Back leaves the app, session keeps running
      if (document.querySelector('.ov.on')) { closeOv(); return true; }
      var h = document.getElementById('home');
      if (h && !h.classList.contains('on')) { go('home'); renderHome(); return true; }
    } catch (e) { }
    return false;
  };

  /* ---- status/navigation bar icons follow the app theme ---- */
  var bt;
  var bars = function () { clearTimeout(bt); bt = setTimeout(function () { try { A.setBars(document.documentElement.dataset.theme === 'dark'); } catch (e) { } }, 100); };
  document.addEventListener('DOMContentLoaded', function () { bars(); new MutationObserver(bars).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); });

  /* ---- audio: take audio focus while sound plays, pause on interruptions / headphone unplug ---- */
  var ctxs = [], held = [];
  var AC = window.AudioContext || window.webkitAudioContext;
  if (AC) {
    var W = function () {
      var c = new (Function.prototype.bind.apply(AC, [null].concat([].slice.call(arguments))))();
      ctxs.push(c);
      c.addEventListener('statechange', function () { if (c.state === 'running') try { A.audioFocus(); } catch (e) { } });
      return c;
    };
    W.prototype = AC.prototype; window.AudioContext = W; window.webkitAudioContext = W;
    setInterval(function () {                                    // keep focus only while a Mindful Space exercise is running
      try { if (typeof mM !== 'undefined' && mM.run && !document.hidden && ctxs.some(function (c) { return c.state === 'running'; })) A.audioFocus(); } catch (e) { }
    }, 5000);
  }
  window.__flAudio = function (on) {
    if (!on) { held = ctxs.filter(function (c) { return c.state === 'running'; }); held.forEach(function (c) { try { c.suspend(); } catch (e) { } }); }
    else { held.forEach(function (c) { try { c.resume(); } catch (e) { } }); held = []; }
  };
})();
