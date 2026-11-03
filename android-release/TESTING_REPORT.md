# Testing report – v1.9.2 Android

## What WAS verified (static, in the authoring sandbox)
| Check | Result |
|---|---|
| Original `Forestland/` folder byte-identical to uploaded zip | Pass (`diff -r`) |
| All 3 Gradle text patches match exactly one place in the real `app.js` / `index.html` | Pass |
| All Android XML resources are well-formed | Pass |
| `bridge.js` parses; mock run: load/save/pop_cmds/export/import/Windows-only stubs/audio suspend+resume/back | Pass |
| All 8 breathing techniques present in shared `mindful.js` | Pass |
| Kotlin compiles; unit tests (`SessionTest`) run | **NOT RUN – no Android toolchain** |

## What was NOT verified (nothing below has been executed)
Everything on a device/emulator. Status of each item from the brief: **NOT RUN**.

### Functional
- [ ] Install + launch (API 26, 30, 34, 35; 360×640, 411×891, tablet, foldable)
- [ ] Timer accuracy: 25-min session vs. stopwatch within ±1 s; Start/Pause/Resume/Stop; auto-resume after 15 min
- [ ] Tree planting/growth stages; history; Overview graphs (day/week/month/custom); consistency vs Windows with the same imported backup
- [ ] All 8 breathing techniques; pause/resume; remembered technique; animation smoothness
- [ ] Chime, mute/unmute, "vibrate"/"silent" ringtone modes
- [ ] Widget: add via Settings→Widget and long-press; idle / running / paused / over states; buttons; survives reboot
- [ ] Notification: chronometer, Pause/Resume/Stop actions, completion alert, reminders, permission denied path
- [ ] Settings persistence; Export/Import; sync folder; import of a real Windows backup

### Background / lifecycle (critical)
1. [ ] Start session → Home button → verify notification time keeps running
2. [ ] Lock phone 30 min → unlock → elapsed matches wall clock minus pauses
3. [ ] Swipe app away → reopen → session restored, correct elapsed
4. [ ] `adb shell am kill com.forestland.focus.debug` (process death) → reopen → restored; notification re-appears
5. [ ] Reboot with a running session → notification re-attached, elapsed correct; session past its target → completion handled on open
6. [ ] `adb shell dumpsys deviceidle force-idle` (Doze) + battery saver → notification time correct, alert delay measured
7. [ ] Stop session → notification & widget cleared, nothing restarts after kill/reboot (verify `active` is null in data.json)
8. [ ] Session across midnight; change of time zone / manual clock change during session
9. [ ] Duplicate prevention: double-tap Start, tap Stop from notification and in-app, rotate during start

### Stability
- [ ] 8 h session; 200 launches/closures; memory (`dumpsys meminfo`) and battery (`dumpsys batterystats`) over a day
- [ ] Phone call / other app audio during Mindful Space; headphone unplug
- [ ] Update install over previous version keeps data (`adb install -r`)
- [ ] Rotation in every screen; keyboard over inputs; display cutout; gesture vs 3-button navigation
- [ ] Release (minified) build: bridge methods not stripped (`proguard-rules.pro` keeps them)

**Verdict: unproven. Do not distribute until the lists above are complete and critical/major issues are fixed.**
