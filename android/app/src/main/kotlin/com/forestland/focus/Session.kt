package com.forestland.focus

import org.json.JSONObject

/** 15 minutes: same auto-resume rule as the JS app (PAUSE_AUTO in app.js). */
const val PAUSE_AUTO = 15 * 60_000L
/** Tree growth stage boundaries in minutes (sprout < 2, then 30 / 60 like the JS levels). */
val STAGE_MIN = longArrayOf(2, 30, 60)

/**
 * Read-only mirror of the JS "active session" object (S.active). The JS app remains the only writer;
 * native code derives everything from the persisted timestamps, never from a running counter.
 */
data class Session(
    val id: String, val start: Long, val targetSec: Long,
    val pausedMs: Long, val pauseAt: Long, val tree: String, val countOver: Boolean,
) {
    val targetMs get() = targetSec * 1000

    /** Focus milliseconds at [now]: wall time minus accumulated pauses (same formula as elapsed() in app.js). */
    fun elapsedMs(now: Long): Long {
        var p = pausedMs
        if (pauseAt > 0) p += minOf(now - pauseAt, PAUSE_AUTO)   // a pause auto-resumes after 15 minutes
        return maxOf(0L, now - start - p)
    }

    fun isPaused(now: Long) = pauseAt > 0 && now - pauseAt < PAUSE_AUTO
    fun isOver(now: Long) = targetSec > 0 && elapsedMs(now) >= targetMs

    fun stage(now: Long): Int {
        val m = elapsedMs(now) / 60_000
        var s = 0
        for (b in STAGE_MIN) if (m >= b) s++
        return s
    }

    /** Wall-clock time of the next change the notification/widget must show (0 = none). */
    fun nextEvent(now: Long): Long {
        if (isPaused(now)) return pauseAt + PAUSE_AUTO
        val el = elapsedMs(now)
        var best = Long.MAX_VALUE
        if (targetSec > 0 && el < targetMs) best = now + (targetMs - el)
        for (b in STAGE_MIN) { val bm = b * 60_000; if (el < bm) { best = minOf(best, now + (bm - el)); break } }
        return if (best == Long.MAX_VALUE) 0 else best
    }

    fun signature() = "$id|$start|$targetSec|$pausedMs|$pauseAt|$countOver"

    companion object {
        fun from(o: JSONObject?, countOver: Boolean): Session? {
            if (o == null) return null
            val start = o.optLong("start", 0)
            if (start <= 0) return null
            return Session(
                o.optString("id", "s$start"), start, o.optDouble("target", 0.0).toLong(),
                o.optLong("paused", 0), o.optLong("pauseAt", 0), o.optString("tree", ""), countOver,
            )
        }
    }
}
