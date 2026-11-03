package com.forestland.focus

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(c: Context, i: Intent) {
        if (Store.active(c) == null) Notifs.reminder(c)   // no nagging while a tree is already growing
        Reminders.reschedule(c)
    }
}
