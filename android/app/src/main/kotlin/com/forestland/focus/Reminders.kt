package com.forestland.focus

import android.content.Context
import org.json.JSONArray
import java.util.Calendar

/** Planting reminders (settings.reminders: [{time:"HH:mm", days:[0..6 Sun=0], on}]) delivered natively, so they work with the app closed. */
object Reminders {
    fun nextTime(json: String, now: Long): Long {
        val arr = try { JSONArray(json) } catch (_: Exception) { return 0 }
        var best = Long.MAX_VALUE
        for (i in 0 until arr.length()) {
            val r = arr.optJSONObject(i) ?: continue
            if (!r.optBoolean("on", true)) continue
            val t = r.optString("time").split(":"); if (t.size != 2) continue
            val h = t[0].toIntOrNull() ?: continue; val m = t[1].toIntOrNull() ?: continue
            val days = r.optJSONArray("days") ?: continue
            val set = (0 until days.length()).map { days.optInt(it) }.toSet()
            for (off in 0..7) {
                val cal = Calendar.getInstance().apply {
                    timeInMillis = now; add(Calendar.DAY_OF_YEAR, off)
                    set(Calendar.HOUR_OF_DAY, h); set(Calendar.MINUTE, m); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
                }
                if (cal.timeInMillis > now && (cal.get(Calendar.DAY_OF_WEEK) - 1) in set) { best = minOf(best, cal.timeInMillis); break }
            }
        }
        return if (best == Long.MAX_VALUE) 0 else best
    }

    fun reschedule(c: Context) = Scheduler.scheduleReminder(c, nextTime(Store.reminders(c), System.currentTimeMillis()))
}
