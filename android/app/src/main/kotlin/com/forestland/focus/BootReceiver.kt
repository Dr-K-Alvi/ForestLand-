package com.forestland.focus

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** After reboot / app update: re-attach the timer notification for a session that is still valid, and re-arm reminders. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        Reminders.reschedule(c)
        if (Store.active(c) != null) TimerService.sync(c, true)
    }
}
