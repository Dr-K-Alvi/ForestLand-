# Forestland for Android – v1.9.2

**Status: source complete, NOT yet compiled or tested.** The environment this was written in had no Android SDK, Gradle,
emulator or network, so `apk/` and `aab/` are empty on purpose. Nothing here is signed. Follow `BUILD.md` on a machine with
Android Studio, then run the checklist in `TESTING_REPORT.md` before treating it as stable.

```
Forestland/        original Windows/Python app – byte-identical to Forestland_v1_9_2.zip (never modified)
android/           Gradle project (Kotlin host + the shared web UI, copied from ../Forestland/web at build time)
android-release/   this folder: docs, icons, and (after you build) apk/ and aab/
```

## How it works
The desktop app is really an HTML/CSS/JS app (all timer, tree, statistics and Mindful Space logic) inside a thin pywebview
window. The Android app hosts the **same** web files in an Android WebView and replaces the Windows-only Python layer with Kotlin:

| Need | Windows (Python) | Android (Kotlin) |
|---|---|---|
| Data file | `%APPDATA%\Forestland\data.json` | `filesDir/data.json` (same JSON; atomic write + fsync + rolling `.bak`) |
| Background timer | window stays open | Foreground service + notification; state derived from saved timestamps |
| Widget | second pywebview window | Native App Widget (`ForestWidget`) |
| Export/import/sync folder | file dialogs | Storage Access Framework (no storage permission) |
| Screen awake | `SetThreadExecutionState` | `FLAG_KEEP_SCREEN_ON` |

Three tiny text patches are applied to the *copied* `app.js`/`index.html` during the Gradle build (see `android/app/build.gradle`,
task `syncWebAssets`); the desktop files are not touched:
1. `witherClosed` is ignored on Android (the OS may kill the process; that must never wither a tree).
2. A `pause` command (from the notification/widget) is accepted by the existing command queue.
3. The "Built with" text names Android instead of Python.
