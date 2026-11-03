package com.forestland.focus

import android.app.Application

class App : Application() {
    override fun onCreate() { super.onCreate(); Notifs.ensureChannels(this) }
}
