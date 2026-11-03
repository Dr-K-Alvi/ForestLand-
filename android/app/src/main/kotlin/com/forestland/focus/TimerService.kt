package com.forestland.focus

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat

/**
 * Foreground service that exists only while a focus session is persisted. It owns NO timer state: every refresh
 * re-derives everything from the saved session timestamps, so a killed/restarted service is always correct.
 */
class TimerService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private val tick = Runnable { refresh() }

    override fun onBind(i: Intent?): IBinder? = null
    override fun onStartCommand(i: Intent?, f: Int, id: Int): Int { refresh(); return START_STICKY }
    override fun onDestroy() { handler.removeCallbacks(tick); super.onDestroy() }

    private fun end() {
        stopForeground(STOP_FOREGROUND_REMOVE); Scheduler.cancel(this); ForestWidget.update(this); stopSelf()
    }

    private fun refresh() {
        handler.removeCallbacks(tick)
        val s = Store.active(this) ?: return end()
        val now = System.currentTimeMillis()
        Notifs.ensureChannels(this)
        val over = s.isOver(now)
        if (over && !Store.doneNotified(this, s.id)) { Store.markDone(this, s.id); Notifs.complete(this, s) }
        if (over && !s.countOver) return end()        // the app finishes it (capped at target) when opened
        val n = Notifs.ongoing(this, s, now)
        try {
            val type = if (Build.VERSION.SDK_INT >= 29) ServiceInfo.FOREGROUND_SERVICE_TYPE_MANIFEST else 0
            ServiceCompat.startForeground(this, Notifs.ID_SESSION, n, type)
        } catch (e: Exception) {   // background-start restriction: still show the notification, just not as foreground
            try { NotificationManagerCompat.from(this).notify(Notifs.ID_SESSION, n) } catch (_: SecurityException) { }
        }
        val next = s.nextEvent(now)
        Scheduler.scheduleService(this, next)
        if (next > 0) handler.postDelayed(tick, maxOf(1000L, next - now))
        ForestWidget.update(this)
    }

    companion object {
        /** Start the service for a running session, or tear everything down when none is persisted. */
        fun sync(c: Context, running: Boolean) {
            val i = Intent(c, TimerService::class.java)
            if (running) {
                try { androidx.core.content.ContextCompat.startForegroundService(c, i) } catch (_: Exception) { }
            } else {
                c.stopService(i); Scheduler.cancel(c)
                val nm = NotificationManagerCompat.from(c); nm.cancel(Notifs.ID_SESSION); nm.cancel(Notifs.ID_DONE)
                ForestWidget.update(c)
            }
        }
    }
}
