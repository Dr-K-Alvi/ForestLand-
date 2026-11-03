# Build, sign and release

## Requirements
Android Studio (Ladybug or newer) or: JDK 17, Android SDK Platform 35 + Build-Tools, Gradle 8.9+. Network access for the first
build (Gradle/AndroidX downloads). Layout must stay as shipped: `Forestland/` and `android/` side by side.

## One-time setup
1. Open the `android/` folder in Android Studio (it creates the Gradle wrapper and `local.properties`). CLI alternative:
   `cd android && gradle wrapper --gradle-version 8.9`.
2. **Package name:** `applicationId` in `app/build.gradle` is `com.forestland.focus`. Change it to a reverse-domain you own
   *before* the first Play upload – it can never change afterwards.
3. **Create your signing key (keep it private, back it up):**
   ```
   keytool -genkeypair -v -keystore forestland-release.jks -alias forestland -keyalg RSA -keysize 4096 -validity 10000
   ```
   Copy `keystore.properties.example` to `keystore.properties` and fill it in (or export `FORESTLAND_STOREFILE`,
   `FORESTLAND_STOREPASSWORD`, `FORESTLAND_KEYALIAS`, `FORESTLAND_KEYPASSWORD`). Both the file and `*.jks` are git-ignored.
   Losing the key means you cannot update the app outside Play App Signing – store a backup offline.

## Build
```
cd android
./gradlew testDebugUnitTest      # session/timer maths + reminder scheduling
./gradlew assembleDebug          # quick install: app/build/outputs/apk/debug
./gradlew assembleRelease        # signed APK: app/build/outputs/apk/release/app-release.apk
./gradlew bundleRelease          # signed AAB: app/build/outputs/bundle/release/app-release.aab
```
Without a configured key, `release` builds are **unsigned** (they will not install). Verify the signature:
`apksigner verify --print-certs app-release.apk`. Copy the results into `android-release/apk/` and `android-release/aab/`.

## Updating
1. Change the Windows version in `Forestland/web/app.js` (`APP_VERSION`) **and** `verName`/`verCode` in `app/build.gradle`.
2. `verCode` must grow every release (scheme: major×10000 + minor×100 + patch → 1.9.2 = 10902).
3. Build with the **same keystore**. Installing over the old version keeps `data.json` (private app storage is never touched by updates).
4. Shared web changes: edit `Forestland/web/*` once; both platforms pick them up. Re-check the three patches in `syncWebAssets`
   (a build that silently stops matching them would restore the old behaviour).

## Play Store notes
- The foreground service uses type `specialUse` (subtype `focus_session_timer`). Play Console asks you to declare and justify
  it: "Keeps a user-started focus timer visible and running; stopped by the user or when the session ends".
- Data safety form: no data collected or shared; no INTERNET permission; cloud backup disabled.
- Raise `targetSdk` to whatever Play currently requires (and re-test) – this project targets 35.

## Migrating data from Windows
Windows → Settings → Backup/Export → `forestland_backup.json`. Android → Settings → Import and choose the file. The JSON is identical, so
sessions, ledger, trees and settings arrive unchanged. Future schema changes continue to rely on the app's existing
`Object.assign(DEF(), saved)` default-merge in `loadState()`, which fills new fields without discarding old ones.

## Permissions and why
| Permission | Reason |
|---|---|
| POST_NOTIFICATIONS (Android 13+) | Running-timer notification, completion alert, planting reminders. Asked once with an explanation. |
| FOREGROUND_SERVICE, FOREGROUND_SERVICE_SPECIAL_USE | Keeps the focus notification/session recoverable while the app is not on screen. |
| RECEIVE_BOOT_COMPLETED | Re-attach a still-valid session and re-arm reminders after reboot/app update. |
| VIBRATE | "Vibrate" ringtone mode. |
| SCHEDULE_EXACT_ALARM (≤ Android 12L only) | Exact end-of-session alert; on newer versions an inexact alarm is used instead. |
Not requested: internet, storage, contacts, location, camera, microphone, phone state, "ignore battery optimisations".

## Battery
No polling anywhere. The notification and widget timers are drawn by the system `Chronometer`. The service wakes only at real
events (target reached, pause auto-resume, growth stage change) via one alarm. The page itself is paused (`WebView.onPause`) when
the app is not visible.
