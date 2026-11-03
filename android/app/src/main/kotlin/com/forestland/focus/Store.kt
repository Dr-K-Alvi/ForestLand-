package com.forestland.focus

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream

/**
 * All persistence. data.json has exactly the same JSON as the Windows app's data.json (so desktop backups import
 * unchanged). Writes are atomic: temp file + fsync + rename, with a rolling .bak used if the main file is ever unreadable.
 */
object Store {
    private val lock = Any()
    private fun prefs(c: Context) = c.getSharedPreferences("forestland_native", Context.MODE_PRIVATE)
    private fun dir(c: Context) = c.filesDir
    private fun main(c: Context) = File(dir(c), "data.json")
    private fun bak(c: Context) = File(dir(c), "data.json.bak")

    private fun readValid(f: File): String? = try {
        if (!f.exists()) null else f.readText(Charsets.UTF_8).also { JSONObject(it) }
    } catch (e: Exception) { null }

    fun load(c: Context): String = synchronized(lock) { readValid(main(c)) ?: readValid(bak(c)) ?: "" }

    /** Returns true when written. Throws on invalid JSON (same contract as the desktop save()). */
    fun save(c: Context, text: String): Boolean {
        val root = JSONObject(text)                         // refuse bad data
        synchronized(lock) {
            val tmp = File(dir(c), "data.json.tmp")
            FileOutputStream(tmp).use { it.write(text.toByteArray(Charsets.UTF_8)); it.fd.sync() }
            val m = main(c)
            if (m.exists() && System.currentTimeMillis() - bak(c).lastModified() > 60_000) {
                try { m.copyTo(bak(c), overwrite = true) } catch (_: Exception) { }
            }
            if (!tmp.renameTo(m)) { m.delete(); if (!tmp.renameTo(m)) return false }
        }
        afterSave(c, root)
        return true
    }

    /** Session currently persisted by the app, or null. */
    fun active(c: Context): Session? = try {
        val t = load(c); if (t.isEmpty()) null else parseActive(JSONObject(t))
    } catch (e: Exception) { null }

    private fun parseActive(root: JSONObject): Session? =
        Session.from(root.optJSONObject("active"), root.optJSONObject("settings")?.optBoolean("countOver", true) ?: true)

    private fun afterSave(c: Context, root: JSONObject) {
        val st = root.optJSONObject("settings")
        val mode = when {
            st?.optBoolean("sound", true) == false -> "silent"
            st?.optString("ringtone") == "silent" -> "silent"
            st?.optString("ringtone") == "vibrate" -> "vibrate"
            else -> "sound"
        }
        val rem = (st?.optJSONArray("reminders") ?: JSONArray()).toString()
        val p = prefs(c)
        val remChanged = p.getString("reminders", "[]") != rem
        val s = parseActive(root)
        val sig = s?.signature() ?: ""
        val sigChanged = p.getString("sig", "") != sig
        p.edit().putString("alertMode", mode).putString("reminders", rem).putString("sig", sig).apply()
        if (remChanged) Reminders.reschedule(c)
        if (sigChanged) TimerService.sync(c, s != null)
    }

    fun alertMode(c: Context) = prefs(c).getString("alertMode", "sound") ?: "sound"
    fun reminders(c: Context) = prefs(c).getString("reminders", "[]") ?: "[]"

    // ---- "done" de-duplication: one completion alert per session id ----
    fun doneNotified(c: Context, id: String) = prefs(c).getString("doneId", "") == id
    fun markDone(c: Context, id: String) { prefs(c).edit().putString("doneId", id).apply() }

    // ---- commands from the notification / widget, picked up by the page (pop_cmds) ----
    fun pushCmd(c: Context, cmd: String) = synchronized(lock) {
        val a = JSONArray(prefs(c).getString("cmds", "[]")); a.put(cmd)
        prefs(c).edit().putString("cmds", a.toString()).apply()
    }
    fun popCmds(c: Context): String = synchronized(lock) {
        val s = prefs(c).getString("cmds", "[]") ?: "[]"
        if (s != "[]") prefs(c).edit().putString("cmds", "[]").apply()
        s
    }
}
