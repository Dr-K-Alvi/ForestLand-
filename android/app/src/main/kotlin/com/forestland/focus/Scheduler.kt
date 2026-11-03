package com.forestland.focus

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/** Alarms wake the timer service at the few moments the notification/widget must change (end, auto-resume, growth stage). */
object Scheduler {
    private fun am(c: Context) = c.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun set(c: Context, at: Long, pi: PendingIntent) {
        val a = am(c)
        if (Build.VERSION.SDK_INT < 31 || a.canScheduleExactAlarms()) a.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
        else a.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi)
    }

    private fun servicePi(c: Context) = PendingIntent.getService(
        c, 1, Intent(c, TimerService::class.java).setAction("tick"), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    fun scheduleService(c: Context, at: Long) { if (at <= 0) cancel(c) else try { set(c, at, servicePi(c)) } catch (_: SecurityException) { } }
    fun cancel(c: Context) { am(c).cancel(servicePi(c)) }

    private fun reminderPi(c: Context) = PendingIntent.getBroadcast(
        c, 2, Intent(c, ReminderReceiver::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    fun scheduleReminder(c: Context, at: Long) {
        if (at <= 0) am(c).cancel(reminderPi(c)) else am(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, reminderPi(c))
    }
}
