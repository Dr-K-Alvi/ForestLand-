/* fit.js - makes the whole app scale with its window (v1.9).
   The UI is laid out in a "layout box" (window size / scale) and that box is scaled to fill the window, so text, buttons, icons, cards and graphs
   all grow and shrink together. Two layouts exist: compact (phone-shaped) and wide (full screen / landscape). CSS reads:
     --vw / --vh  = 1% of the layout box in px (use instead of the vw / vh units, which would ignore the scale)
     html.wide / html.compact, html.short (layout box 700 px or less tall)
   window.__z = the scale, for code that mixes pointer positions (screen px) with layout px. */
(function () {
  var root = document.documentElement;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fit() {
    var W = window.innerWidth || 400, H = window.innerHeight || 760;
    var zc = clamp(Math.min(W / 400, H / 760), .62, 1.3);           // compact scale: the phone layout is designed around 400 x 760
    var wide = W / zc >= 860, z = zc;                                  // enough room for the wide layout at that scale?
    if (wide) z = clamp(Math.max(zc, Math.min(W / 1180, H / 700)), .62, 2);   // full screen: scale up with the screen, the wide layout is designed around 1180 x 700
    var lw = W / z, lh = H / z, app = document.getElementById('app');
    window.__z = z;
    root.style.setProperty('--vw', (lw / 100).toFixed(3) + 'px');
    root.style.setProperty('--vh', (lh / 100).toFixed(3) + 'px');
    root.classList.toggle('wide', wide); root.classList.toggle('compact', !wide); root.classList.toggle('short', lh <= 700);
    if (app) { app.style.width = lw.toFixed(2) + 'px'; app.style.height = lh.toFixed(2) + 'px'; app.style.transform = 'scale(' + z.toFixed(4) + ')'; }
  }
  window.__fit = fit; fit();
  window.addEventListener('resize', fit);
  document.addEventListener('DOMContentLoaded', fit);
})();
