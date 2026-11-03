# Limitations and unresolved issues
1. **Not built, not signed, not tested.** No APK/AAB exists yet. Kotlin was written without compiler access: expect to fix a small number of compile errors on first build (the most likely spots: `MainActivity.vibrateOnce`, annotation placement, Gradle `filter` closure syntax). `TESTING_REPORT.md` lists everything still to verify.
2. Completion of a session is recorded only when the app is next opened (see DIFFERENCES.md). The alert time can slip by minutes in deep Doze on Android 13+ (inexact alarm); the on-screen Chronometer is always exact.
3. Notification/widget buttons open the app (Android 12+ forbids a background app from silently executing JS logic). Pausing without opening the app would require re-implementing the pause rules natively.
4. App/website blocking is unavailable (see DIFFERENCES.md).
5. Foreground service type `specialUse` needs a Play Console declaration; there is no "timer" service type.
6. Widget tree art is simplified. Widget does not show "today" totals.
7. Status/navigation bar icon colours follow the app's light/dark theme, but the area behind them uses two fixed colours (light `#EEF4F0`, dark `#101A17`) rather than each screen's gradient.
8. Landscape uses the app's existing "wide" layout from `fit.js`; it has not been visually checked on a phone.
9. The package id `com.forestland.focus` is a placeholder.
10. The sync folder file is overwritten in place (SAF cannot rename atomically); the main `data.json` is always written atomically.
