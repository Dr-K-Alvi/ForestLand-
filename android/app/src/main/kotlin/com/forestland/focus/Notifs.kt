package com.forestland.focus

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object Notifs {
    const val CH_SESSION = "session"; const val CH_DONE = "done_sound"; const val CH_DONE_VIB = "done_vibrate"
    const val CH_DONE_QUIET = "done_quiet"; const val CH_REMIND = "reminder"
    const val ID_SESSION = 1; const val ID_DONE = 2; const val ID_REMIND = 3
    const val ACTION_CMD = "com.forestland.focus.CMD"; const val EXTRA_CMD = "cmd"

    fun ensureChannels(c: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val nm = c.getSystemService(NotificationManager::class.java)
        fun ch(id: String, name: String, imp: Int, f: NotificationChannel.() -> Unit = {}) =
            NotificationChannel(id, name, imp).apply { setShowBadge(false); f() }
        nm.createNotificationChannels(listOf(
            ch(CH_SESSION, "Focus session (running)", NotificationManager.IMPORTANCE_LOW) { description = "Shows the running focus timer." },
            ch(CH_DONE, "Session complete", NotificationManager.IMPORTANCE_DEFAULT),
            ch(CH_DONE_VIB, "Session complete (vibrate only)", NotificationManager.IMPORTANCE_DEFAULT) { setSound(null, null); enableVibration(true) },
            ch(CH_DONE_QUIET, "Session complete (silent)", NotificationManager.IMPORTANCE_LOW) { enableVibration(false) },
            ch(CH_REMIND, "Planting reminders", NotificationManager.IMPORTANCE_DEFAULT) {
                description = "Reminders you set in Settings."
                setSound(android.provider.Settings.System.DEFAULT_NOTIFICATION_URI,
                    AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).build())
            },
        ))
    }

    fun pi(c: Context, rc: Int, cmd: String?): PendingIntent {
        val i = Intent(c, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        if (cmd != null) { i.action = ACTION_CMD; i.putExtra(EXTRA_CMD, cmd) }
        return PendingIntent.getActivity(c, rc, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun clock(ms: Long): String {
        val s = maxOf(0, ms) / 1000; val h = s / 3600; val m = s % 3600 / 60; val ss = s % 60
        return if (h > 0) "%d:%02d:%02d".format(h, m, ss) else "%02d:%02d".format(m, ss)
    }

    /** Ongoing notification. The running time is drawn by the system Chronometer, so the app never wakes up to tick. */
    fun ongoing(c: Context, s: Session, now: Long): android.app.Notification {
        val el = s.elapsedMs(now); val paused = s.isPaused(now); val over = s.isOver(now)
        val b = NotificationCompat.Builder(c, CH_SESSION)
            .setSmallIcon(R.drawable.ic_stat_tree).setOngoing(true).setOnlyAlertOnce(true).setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS).setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(pi(c, 10, null))
        when {
            paused -> {
                b.setContentTitle("Paused").setShowWhen(false)
                b.setContentText(if (s.targetSec > 0) "${clock(s.targetMs - el)} left · resumes automatically" else "${clock(el)} focused")
            }
            s.targetSec > 0 && !over -> {
                b.setContentTitle("Growing your tree").setContentText("Time remaining")
                    .setUsesChronometer(true).setChronometerCountDown(true).setWhen(now + (s.targetMs - el))
            }
            else -> {
                b.setContentTitle(if (over) "Session complete" else "Growing your tree")
                    .setContentText(if (over) "Extra time is counted. Open Forestland to finish." else "Focus time")
                    .setUsesChronometer(true).setChronometerCountDown(false).setWhen(now - (if (over) el - s.targetMs else el))
            }
        }
        if (el >= 10_000) {      // first 10 s is the free-cancel window inside the app; pause/stop appear after it
            b.addAction(0, if (s.pauseAt > 0 && paused) "Resume" else "Pause", pi(c, 11, "pause"))
            b.addAction(0, if (over) "Finish" else "Stop", pi(c, 12, "stop"))
        }
        return b.build()
    }

    @SuppressLint("MissingPermission")
    fun complete(c: Context, s: Session) {
        if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) return
        val ch = when (Store.alertMode(c)) { "silent" -> CH_DONE_QUIET; "vibrate" -> CH_DONE_VIB; else -> CH_DONE }
        val n = NotificationCompat.Builder(c, ch).setSmallIcon(R.drawable.ic_stat_tree)
            .setContentTitle("Focus session complete").setContentText("Your tree is fully grown. Open Forestland to collect it.")
            .setAutoCancel(true).setCategory(NotificationCompat.CATEGORY_STATUS).setContentIntent(pi(c, 10, null)).build()
        NotificationManagerCompat.from(c).notify(ID_DONE, n)
    }

    @SuppressLint("MissingPermission")
    fun reminder(c: Context) {
        if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) return
        ensureChannels(c)
        val n = NotificationCompat.Builder(c, CH_REMIND).setSmallIcon(R.drawable.ic_stat_tree)
            .setContentTitle("Forestland").setContentText("Time to plant a tree")
            .setAutoCancel(true).setContentIntent(pi(c, 10, null)).build()
        NotificationManagerCompat.from(c).notify(ID_REMIND, n)
    }
}
