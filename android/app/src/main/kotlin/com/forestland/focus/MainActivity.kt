package com.forestland.focus

import android.Manifest
import android.app.AlertDialog
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject

/** Hosts the shared HTML/JS app (served from local assets over https://appassets.androidplatform.net, no network). */
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var root: FrameLayout
    private val handler = Handler(Looper.getMainLooper())
    private var pendingId = 0
    private var pendingText = ""

    // ---------- file pickers (Storage Access Framework: no storage permission needed) ----------
    private val exportL = registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        var ok = "0"
        if (uri != null) try { contentResolver.openOutputStream(uri, "wt")!!.use { it.write(pendingText.toByteArray(Charsets.UTF_8)) }; ok = "1" } catch (_: Exception) { }
        resolve(pendingId, ok)
    }
    private val importL = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        var t = ""
        if (uri != null) try { t = contentResolver.openInputStream(uri)!!.use { it.readBytes().toString(Charsets.UTF_8) } } catch (_: Exception) { }
        resolve(pendingId, t)
    }
    private val folderL = registerForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        var r = ""
        if (uri != null) try {
            contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            r = uri.toString()
        } catch (_: Exception) { }
        resolve(pendingId, r)
    }
    private val notifL = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    fun launchExport(id: Int, text: String) { pendingId = id; pendingText = text; exportL.launch("forestland_backup.json") }
    fun launchImport(id: Int) { pendingId = id; importL.launch(arrayOf("application/json", "text/*", "application/octet-stream")) }
    fun launchFolder(id: Int) { pendingId = id; folderL.launch(null) }

    private fun resolve(id: Int, value: String) =
        js("window.__flResolve&&window.__flResolve($id,${JSONObject.quote(value)})")
    private fun js(code: String) { if (::web.isInitialized) web.post { web.evaluateJavascript(code, null) } }

    // ---------- lifecycle ----------
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        if (Build.VERSION.SDK_INT >= 29) window.isNavigationBarContrastEnforced = false

        val night = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        root = FrameLayout(this).apply { setBackgroundColor(if (night) 0xFF101A17.toInt() else 0xFFEEF4F0.toInt()) }
        web = WebView(this).apply { setBackgroundColor(Color.TRANSPARENT) }
        root.addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        setContentView(root)
        // Keep content clear of status bar, navigation bar, display cutout and keyboard in any orientation.
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, ins ->
            val i = ins.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime())
            v.setPadding(i.left, i.top, i.right, i.bottom); WindowInsetsCompat.CONSUMED
        }
        applyBars(night)

        setupWebView()
        handleIntent(intent)
        web.loadUrl(START_URL)
        askNotificationPermission()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.__flBack?window.__flBack():false") { r ->
                    if (r != "true") { if (Store.active(this@MainActivity) != null) moveTaskToBack(true) else finish() }
                }
            }
        })
    }

    private fun setupWebView() {
        val loader = WebViewAssetLoader.Builder().addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        web.settings.apply {
            javaScriptEnabled = true; domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false      // chimes / Mindful Space sounds
            allowFileAccess = false; allowContentAccess = false
            setSupportZoom(false); builtInZoomControls = false; textZoom = 100   // the app scales its own UI (fit.js)
            cacheMode = WebSettings.LOAD_NO_CACHE; mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        }
        web.overScrollMode = WebView.OVER_SCROLL_NEVER
        web.addJavascriptInterface(WebBridge(this), "Android")
        val shim = assets.open("android/bridge.js").bufferedReader().use { it.readText() }
        val shimInjected = WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)
        if (shimInjected) WebViewCompat.addDocumentStartJavaScript(web, shim, setOf(ORIGIN))
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(v: WebView, r: WebResourceRequest): WebResourceResponse? = loader.shouldInterceptRequest(r.url)
            override fun shouldOverrideUrlLoading(v: WebView, r: WebResourceRequest) = !r.url.toString().startsWith(ORIGIN)  // never leave the app
            override fun onPageStarted(v: WebView, url: String, f: android.graphics.Bitmap?) { if (!shimInjected) v.evaluateJavascript(shim, null) }
        }
    }

    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); setIntent(intent); handleIntent(intent) }

    private fun handleIntent(i: Intent?) {
        if (i?.action == Notifs.ACTION_CMD) i.getStringExtra(Notifs.EXTRA_CMD)?.let { Store.pushCmd(this, it) }
        i?.action = null
    }

    override fun onResume() {
        super.onResume(); web.onResume()
        ContextCompat.registerReceiver(this, noisy, IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY), ContextCompat.RECEIVER_NOT_EXPORTED)
    }

    override fun onPause() {
        try { unregisterReceiver(noisy) } catch (_: Exception) { }
        abandonFocus()
        web.onPause()          // stops page timers and audio; the timer is timestamp-based so nothing is lost
        super.onPause()
    }

    override fun onDestroy() { web.destroy(); super.onDestroy() }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
        val p = getSharedPreferences("forestland_native", MODE_PRIVATE)
        if (p.getBoolean("askedNotif", false)) return
        p.edit().putBoolean("askedNotif", true).apply()
        AlertDialog.Builder(this).setTitle("Notifications")
            .setMessage("Forestland shows your running timer, the session-complete alert and your planting reminders as notifications. Allow them on the next screen.")
            .setPositiveButton("Continue") { _, _ -> notifL.launch(Manifest.permission.POST_NOTIFICATIONS) }
            .setNegativeButton("Not now", null).show()
    }

    // ---------- device helpers used by the bridge ----------
    fun setKeepScreenOn(on: Boolean) { if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }

    fun vibrateOnce() {
        val v = if (Build.VERSION.SDK_INT >= 31) (getSystemService(VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
                else @Suppress("DEPRECATION") getSystemService(VIBRATOR_SERVICE) as Vibrator
        v.vibrate(VibrationEffect.createOneShot(300, VibrationEffect.DEFAULT_AMPLITUDE))
    }

    /** Match status/navigation bar icons to the app's current theme (page reports light/dark via bridge.js). */
    fun applyBars(dark: Boolean) {
        root.setBackgroundColor(if (dark) 0xFF101A17.toInt() else 0xFFEEF4F0.toInt())
        WindowCompat.getInsetsController(window, root).apply { isAppearanceLightStatusBars = !dark; isAppearanceLightNavigationBars = !dark }
    }

    fun pinWidget(): String {
        val m = AppWidgetManager.getInstance(this)
        return if (Build.VERSION.SDK_INT >= 26 && m.isRequestPinAppWidgetSupported) {
            m.requestPinAppWidget(ComponentName(this, ForestWidget::class.java), null, null); "Choose where to place the widget."
        } else "Long-press the home screen, open Widgets and pick Forestland."
    }

    // ---------- audio: duck/pause on calls and other apps, stop on headphone unplug, no focus held when silent ----------
    private val audioMgr by lazy { getSystemService(AUDIO_SERVICE) as AudioManager }
    private var focusReq: AudioFocusRequest? = null
    private val abandonRun = Runnable { abandonFocus() }
    private val focusL = AudioManager.OnAudioFocusChangeListener { ch ->
        when (ch) {
            AudioManager.AUDIOFOCUS_LOSS, AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> js("window.__flAudio&&window.__flAudio(false)")
            AudioManager.AUDIOFOCUS_GAIN -> js("window.__flAudio&&window.__flAudio(true)")
        }
    }
    private val noisy = object : BroadcastReceiver() {
        override fun onReceive(c: Context, i: Intent) { js("window.__flAudio&&window.__flAudio(false)") }
    }

    /** Called while the page is making sound; focus is dropped 8 s after the last call so we never hold it while silent. */
    fun requestAudioFocusBriefly() {
        if (focusReq == null) {
            focusReq = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                .setOnAudioFocusChangeListener(focusL).build()
            audioMgr.requestAudioFocus(focusReq!!)
        }
        handler.removeCallbacks(abandonRun); handler.postDelayed(abandonRun, 8000)
    }

    private fun abandonFocus() {
        handler.removeCallbacks(abandonRun)
        focusReq?.let { audioMgr.abandonAudioFocusRequest(it) }; focusReq = null
    }

    companion object {
        const val ORIGIN = "https://appassets.androidplatform.net"
        const val START_URL = "$ORIGIN/assets/web/index.html"
    }
}
