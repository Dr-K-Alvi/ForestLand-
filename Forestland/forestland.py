"""Forestland - offline focus timer. Run with run.bat (Python 3 + pywebview + psutil)."""
import os, sys, json, time, tempfile, threading, atexit, ctypes
import ctypes.wintypes
os.environ.setdefault("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS","--disable-features=CalculateNativeWinOcclusion --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows")
import webview

try:
    import psutil
except ImportError:  # blocking apps is simply unavailable without psutil
    psutil = None

DIR = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "Forestland")
FILE = os.path.join(DIR, "data.json")
PREFS = os.path.join(DIR, "prefs.json")  # window behaviour (always on top) lives here so it applies before the app page even loads
WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
HOSTS = os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), r"System32\drivers\etc\hosts")
MARK_S, MARK_E = "# >>> Forestland block", "# <<< Forestland block"
WIN = os.name == "nt"


def atomic_write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path))
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, path)  # atomic: never a half-written file


def hosts_clean():
    """Remove our block from the hosts file (safe to call any time)."""
    try:
        with open(HOSTS, encoding="utf-8") as f:
            lines = f.read().splitlines()
        if MARK_S not in lines:
            return
        out, skip = [], False
        for ln in lines:
            if ln.strip() == MARK_S: skip = True; continue
            if ln.strip() == MARK_E: skip = False; continue
            if not skip: out.append(ln)
        with open(HOSTS, "w", encoding="utf-8") as f:
            f.write("\n".join(out) + "\n")
    except Exception:
        pass


def flush_dns():
    try:
        import subprocess
        subprocess.run(["ipconfig", "/flushdns"], creationflags=0x08000000, timeout=8, capture_output=True)
    except Exception:
        pass


WIDGET_MODES = ("normal", "solid", "clear")   # normal = teal, solid = black, clear = transparent
PREF_DEFAULTS = {"mainTop": False, "widgetTop": True, "widgetMode": "normal", "widgetAlpha": 100}


def read_prefs():
    p = dict(PREF_DEFAULTS)
    try:
        with open(PREFS, encoding="utf-8") as f:
            raw = json.load(f)
        for k, d in PREF_DEFAULTS.items():
            if k not in raw: continue
            v = raw[k]
            if isinstance(d, bool): p[k] = bool(v)
            elif k == "widgetAlpha": p[k] = max(25, min(100, int(v)))
            elif v in WIDGET_MODES: p[k] = v
    except Exception:
        pass
    return p


def write_prefs(p):
    try: atomic_write(PREFS, json.dumps(p))
    except Exception: pass


def find(title):
    return ctypes.windll.user32.FindWindowW(None, title) if WIN else 0


class Api:
    def __init__(self):
        self._ui, self._cmds, self._widget, self._main = {}, [], None, None
        self._stop, self._awake = threading.Event(), threading.Event()
        self._stop.set()

    # ---- data file ----
    def load(self):
        try:
            with open(FILE, encoding="utf-8") as f:
                return f.read()
        except Exception:
            return ""

    def save(self, text):
        json.loads(text)  # refuse bad data
        atomic_write(FILE, text)
        return True

    # ---- blocking apps (close by process name) and sites (hosts file) ----
    def block_start(self, apps, allowed, sites):
        self.block_stop()
        norm = lambda a: (a.strip().lower() + ("" if "." in a else ".exe")) if a.strip() else ""
        names = {norm(a) for a in apps} - {norm(a) for a in allowed} - {""}
        self._stop.clear()
        if names and psutil:
            def loop():
                while not self._stop.wait(2):
                    for p in psutil.process_iter(["name"]):
                        try:
                            if (p.info["name"] or "").lower() in names:
                                p.terminate()
                        except Exception:
                            pass
            threading.Thread(target=loop, daemon=True).start()
        if sites:
            try:
                clean = set()
                for x in sites:
                    x = x.strip().lower().replace("https://", "").replace("http://", "").split("/")[0].split("?")[0]
                    if x.startswith("www."): x = x[4:]
                    if x: clean.update([x, "www." + x, "m." + x])
                hosts_clean()
                lines = [MARK_S] + [f"127.0.0.1 {h}\n::1 {h}" for h in sorted(clean)] + [MARK_E]
                with open(HOSTS, "a", encoding="utf-8") as f:
                    f.write("\n" + "\n".join(lines) + "\n")
                flush_dns()
                with open(HOSTS, encoding="utf-8") as f:
                    if MARK_S not in f.read(): return "reverted"  # something (e.g. antivirus) undid the change
            except PermissionError:
                return "admin"
            except Exception:
                return "failed"
        return "ok"

    def block_stop(self):
        self._stop.set()
        hosts_clean(); flush_dns()
        return True

    def is_admin(self):
        try: return bool(ctypes.windll.shell32.IsUserAnAdmin())
        except Exception: return False

    def relaunch_admin(self):
        """Restart elevated. Only called when the owner turns site blocking on."""
        try:
            ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, " ".join(f'"{a}"' for a in sys.argv), None, 1)
            os._exit(0)
        except Exception:
            return False

    # ---- keep the PC awake while a session runs ----
    def awake(self, on):
        if not WIN: return False
        if not on:
            self._awake.set(); self._awake.clear()
            return True
        if self._awake.is_set(): return True
        self._awake.set()
        def keep():  # SetThreadExecutionState must stay on one long-lived thread
            k, pace = ctypes.windll.kernel32, threading.Event()
            while self._awake.is_set():
                k.SetThreadExecutionState(0x80000003)  # CONTINUOUS | SYSTEM | DISPLAY
                pace.wait(15)
            k.SetThreadExecutionState(0x80000000)
        threading.Thread(target=keep, daemon=True).start()
        return True

    def flash(self):
        try:
            ctypes.windll.user32.FlashWindow(ctypes.windll.user32.FindWindowW(None, "Forestland"), True)
        except Exception:
            pass

    # ---- sync folder + backup ----
    def pick_folder(self):
        r = self._main.create_file_dialog(webview.FOLDER_DIALOG)
        return r[0] if r else ""

    def sync_read(self, folder):
        try:
            with open(os.path.join(folder, "forestland_sync.json"), encoding="utf-8") as f:
                return f.read()
        except Exception:
            return ""

    def sync_write(self, folder, text):
        json.loads(text)
        atomic_write(os.path.join(folder, "forestland_sync.json"), text)
        return True

    def export_data(self, text):
        r = self._main.create_file_dialog(webview.SAVE_DIALOG, save_filename="forestland_backup.json")
        if not r: return False
        atomic_write(r if isinstance(r, str) else r[0], text)
        return True

    def import_data(self):
        r = self._main.create_file_dialog(webview.OPEN_DIALOG, file_types=("JSON (*.json)",))
        if not r: return ""
        with open(r[0], encoding="utf-8") as f:
            return f.read()

    # ---- always on top: main window and widget are controlled separately and the choice is remembered ----
    def get_prefs(self): return read_prefs()

    def set_top(self, which, on):
        p = read_prefs(); key = "mainTop" if which == "main" else "widgetTop"; p[key] = bool(on)
        write_prefs(p)
        win, title = (self._main, "Forestland") if which == "main" else (self._widget, "Forestland Widget")
        try:
            if win is not None: win.on_top = bool(on)  # sets the real window flag, so it sticks
        except Exception:
            pass
        if WIN:
            h = find(title)
            if h: ctypes.windll.user32.SetWindowPos(h, -1 if on else -2, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0010)  # TOPMOST / NOTOPMOST, no move/resize/activate
        return True

    # ---- desktop widget: a second small window that talks to the main one through here ----
    def push_ui(self, ui): self._ui = ui; return True
    def widget_state(self): return self._ui
    def cmd(self, c): self._cmds.append(c); return True

    def pop_cmds(self):
        c, self._cmds = self._cmds, []
        return c

    def open_widget(self):
        if self._widget: return True
        kw = dict(js_api=self, width=250, height=330, min_size=(170, 190), resizable=True, on_top=read_prefs()["widgetTop"], frameless=False)
        try:  # transparent window so the Transparent look can really see through (needs a pywebview that supports it)
            w = webview.create_window("Forestland Widget", os.path.join(WEB, "widget.html"), transparent=True, **kw)
        except TypeError:
            w = webview.create_window("Forestland Widget", os.path.join(WEB, "widget.html"), **kw)
        self._widget = w
        def closed():
            self._widget = None
            self.show_main()  # never leave the main window stranded off-screen
        w.events.closed += closed
        try: w.events.shown += self.style_widget
        except Exception: pass
        threading.Timer(1.0, self.style_widget).start()  # (also runs when the 'shown' event is not available)
        threading.Timer(1.2, self.hide_main).start()
        return True

    # ---- widget window: no title bar, own drag + resize, look (normal / solid / transparent) and opacity ----
    def style_widget(self):
        """Remove the title bar and the minimise / close buttons but keep the thin sizing frame, so it is a widget and not a window."""
        if not WIN: return
        try:
            u, h = ctypes.windll.user32, find("Forestland Widget")
            if not h: return
            st = u.GetWindowLongW(h, -16)
            st = (st & ~0x00C00000 & ~0x00080000) | 0x00040000  # no WS_CAPTION / WS_SYSMENU, keep WS_THICKFRAME (resize from the edges)
            u.SetWindowLongW(h, -16, st)
            u.SetWindowPos(h, 0, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0004 | 0x0010 | 0x0020)  # NOMOVE NOSIZE NOZORDER NOACTIVATE FRAMECHANGED
            try: ctypes.windll.dwmapi.DwmSetWindowAttribute(h, 33, ctypes.byref(ctypes.c_int(2)), 4)  # rounded corners on Windows 11
            except Exception: pass
            p = read_prefs(); self._wmode = p["widgetMode"]; self._apply_alpha(p["widgetMode"], p["widgetAlpha"])
        except Exception:
            pass

    def _apply_alpha(self, mode, alpha):
        """Whole-window opacity, only in the Transparent look. Keeps whatever see-through colour key pywebview already set."""
        if not WIN: return
        u, h = ctypes.windll.user32, find("Forestland Widget")
        if not h: return
        a = int(255 * max(25, min(100, int(alpha))) / 100) if mode == "clear" else 255
        key, al, fl = ctypes.wintypes.DWORD(0), ctypes.wintypes.BYTE(0), ctypes.wintypes.DWORD(0)
        if u.GetLayeredWindowAttributes(h, ctypes.byref(key), ctypes.byref(al), ctypes.byref(fl)):
            u.SetLayeredWindowAttributes(h, key.value, a, fl.value | 0x2)
        elif a < 255:
            u.SetWindowLongW(h, -20, u.GetWindowLongW(h, -20) | 0x80000)
            u.SetLayeredWindowAttributes(h, 0, a, 0x2)

    def widget_mode(self, mode, alpha=100):
        mode = mode if mode in WIDGET_MODES else "normal"; alpha = max(25, min(100, int(alpha)))
        p = read_prefs(); p["widgetMode"], p["widgetAlpha"] = mode, alpha; write_prefs(p)
        self._wmode = mode; self._apply_alpha(mode, alpha)
        return True

    def widget_alpha(self, alpha):
        """Live slider movement: apply only, the value is saved when the slider is released (widget_mode)."""
        if getattr(self, "_wmode", "normal") == "clear": self._apply_alpha("clear", alpha)
        return True

    def _cursor(self):
        p = ctypes.wintypes.POINT(); ctypes.windll.user32.GetCursorPos(ctypes.byref(p)); return p.x, p.y

    def _track(self, move):
        """Run move(dx, dy) while the left mouse button stays down (dx, dy = cursor travel since the button went down)."""
        u = ctypes.windll.user32; u.GetAsyncKeyState.restype = ctypes.c_short
        if getattr(self, "_busy", False): return False
        self._busy = True; x0, y0 = self._cursor()
        def run():
            try:
                while u.GetAsyncKeyState(0x01) < 0:
                    x, y = self._cursor(); move(x - x0, y - y0); time.sleep(0.008)
            finally:
                self._busy = False
        threading.Thread(target=run, daemon=True).start(); return True

    def drag_widget(self):
        if not WIN: return False
        u, h = ctypes.windll.user32, find("Forestland Widget")
        if not h: return False
        r = ctypes.wintypes.RECT(); u.GetWindowRect(h, ctypes.byref(r)); l0, t0 = r.left, r.top
        return self._track(lambda dx, dy: u.SetWindowPos(h, 0, l0 + dx, t0 + dy, 0, 0, 0x0001 | 0x0004 | 0x0010))

    def resize_widget(self):
        if not WIN: return False
        u, h = ctypes.windll.user32, find("Forestland Widget")
        if not h: return False
        r = ctypes.wintypes.RECT(); u.GetWindowRect(h, ctypes.byref(r)); w0, h0 = r.right - r.left, r.bottom - r.top
        return self._track(lambda dx, dy: u.SetWindowPos(h, 0, 0, 0, max(150, w0 + dx), max(170, h0 + dy), 0x0002 | 0x0004 | 0x0010))

    def hide_main(self):
        """Park the main window off-screen (not minimised, so its timers keep running)."""
        if not WIN: return
        u, h = ctypes.windll.user32, find("Forestland")
        if not h: return
        r = ctypes.wintypes.RECT(); u.GetWindowRect(h, ctypes.byref(r)); self._pos = (r.left, r.top)
        u.SetWindowPos(h, 0, -32000, -32000, 0, 0, 0x0001 | 0x0004 | 0x0010)
        u.SetWindowLongW(h, -20, (u.GetWindowLongW(h, -20) | 0x80) & ~0x40000)  # tool window: no taskbar button

    def show_main(self):
        if not WIN: return True
        u, h = ctypes.windll.user32, find("Forestland")
        if h:
            x, y = getattr(self, "_pos", (100, 60))
            u.SetWindowLongW(h, -20, (u.GetWindowLongW(h, -20) & ~0x80) | 0x40000)
            u.SetWindowPos(h, 0, max(0, x), max(0, y), 0, 0, 0x0001 | 0x0004 | 0x0040)
            u.ShowWindow(h, 9); u.SetForegroundWindow(h)
        return True

    def open_main(self, page=None):
        """Widget's 'open Forestland' button: bring the app back (on the Forest page when asked) and close the widget."""
        self.show_main()
        if page == "forest": self._cmds.append("forest")
        if WIN:
            h = find("Forestland Widget")
            if h: ctypes.windll.user32.PostMessageW(h, 0x0010, 0, 0)  # WM_CLOSE
        return True



if __name__ == "__main__":
    api = Api()
    hosts_clean()  # clean at start ...
    atexit.register(hosts_clean)  # ... and at exit
    api._main = webview.create_window("Forestland", os.path.join(WEB, "index.html"), js_api=api, width=430, height=860,
                                     min_size=(340, 560), resizable=True, on_top=read_prefs()["mainTop"])
    api._main.events.closed += lambda: (api.block_stop(), os._exit(0))
    webview.start()
