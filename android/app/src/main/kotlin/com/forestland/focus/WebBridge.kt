package com.forestland.focus

import android.content.Context
import android.net.Uri
import android.webkit.JavascriptInterface
import androidx.documentfile.provider.DocumentFile
import org.json.JSONObject

/**
 * Android replacement for the pywebview `Api` class in forestland.py. bridge.js exposes it to the page as
 * window.pywebview.api with the same method names, so the shared JavaScript is unchanged.
 * Only the bundled local page can reach it (navigation to other origins is blocked in MainActivity).
 */
class WebBridge(private val a: MainActivity) {
    private val c: Context = a.applicationContext

    // ---- data file (same JSON as desktop data.json) ----
    @JavascriptInterface fun load(): String = Store.load(c)
    @JavascriptInterface fun save(text: String): Boolean = try { Store.save(c, text) } catch (e: Exception) { false }

    // ---- commands queued by notification / widget buttons ----
    @JavascriptInterface fun popCmds(): String = Store.popCmds(c)

    // ---- device behaviour ----
    @JavascriptInterface fun keepAwake(on: Boolean) = a.runOnUiThread { a.setKeepScreenOn(on) }
    @JavascriptInterface fun vibrate() = a.vibrateOnce()
    @JavascriptInterface fun setBars(dark: Boolean) = a.runOnUiThread { a.applyBars(dark) }
    @JavascriptInterface fun audioFocus() = a.runOnUiThread { a.requestAudioFocusBriefly() }
    @JavascriptInterface fun pinWidget(): String = a.pinWidget()

    // ---- files: results come back asynchronously through window.__flResolve(id, value) ----
    @JavascriptInterface fun pickFolder(id: Int) = a.runOnUiThread { a.launchFolder(id) }
    @JavascriptInterface fun exportData(id: Int, text: String) = a.runOnUiThread { a.launchExport(id, text) }
    @JavascriptInterface fun importData(id: Int) = a.runOnUiThread { a.launchImport(id) }

    // ---- sync folder (Storage Access Framework tree chosen by the user) ----
    @JavascriptInterface fun syncRead(folder: String): String = try {
        val d = DocumentFile.fromTreeUri(c, Uri.parse(folder))?.findFile(SYNC)
        if (d == null) "" else c.contentResolver.openInputStream(d.uri)!!.use { it.readBytes().toString(Charsets.UTF_8) }
    } catch (e: Exception) { "" }

    @JavascriptInterface fun syncWrite(folder: String, text: String): Boolean = try {
        JSONObject(text)                                         // refuse bad data
        val dir = DocumentFile.fromTreeUri(c, Uri.parse(folder))!!
        val f = dir.findFile(SYNC) ?: dir.createFile("application/json", SYNC)!!
        c.contentResolver.openOutputStream(f.uri, "wt")!!.use { it.write(text.toByteArray(Charsets.UTF_8)) }
        true
    } catch (e: Exception) { false }

    private companion object { const val SYNC = "forestland_sync.json" }
}
