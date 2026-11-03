package com.forestland.focus

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews

/**
 * Home-screen widget. No polling: the running time is a system Chronometer, and the service refreshes the widget only
 * at real state changes (start, pause, resume, growth stage, target reached, end).
 */
class ForestWidget : AppWidgetProvider() {
    override fun onUpdate(c: Context, m: AppWidgetManager, ids: IntArray) = update(c)
    override fun onEnabled(c: Context) = update(c)

    companion object {
        private val STAGES = intArrayOf(R.drawable.tree_stage0, R.drawable.tree_stage1, R.drawable.tree_stage2, R.drawable.tree_stage3)

        fun update(c: Context) {
            val mgr = AppWidgetManager.getInstance(c)
            val ids = mgr.getAppWidgetIds(ComponentName(c, ForestWidget::class.java))
            if (ids.isEmpty()) return
            val v = build(c)
            mgr.updateAppWidget(ids, v)
        }

        private fun build(c: Context): RemoteViews {
            val v = RemoteViews(c.packageName, R.layout.widget_forest)
            val s = Store.active(c); val now = System.currentTimeMillis()
            v.setOnClickPendingIntent(R.id.w_root, Notifs.pi(c, 20, null))
            v.setViewVisibility(R.id.w_btn2, View.GONE)
            if (s == null) {
                v.setImageViewResource(R.id.w_tree, R.drawable.tree_stage3)
                v.setTextViewText(R.id.w_title, "Forestland")
                v.setViewVisibility(R.id.w_chrono, View.GONE); v.setViewVisibility(R.id.w_time, View.GONE)
                v.setTextViewText(R.id.w_sub, "Ready to plant a tree")
                v.setTextViewText(R.id.w_btn1, "Plant"); v.setOnClickPendingIntent(R.id.w_btn1, Notifs.pi(c, 21, "plant"))
                return v
            }
            val el = s.elapsedMs(now); val paused = s.isPaused(now); val over = s.isOver(now)
            v.setImageViewResource(R.id.w_tree, STAGES[s.stage(now)])
            v.setTextViewText(R.id.w_title, if (paused) "Paused" else if (over) "Session complete" else "Growing…")
            v.setTextViewText(R.id.w_btn1, if (paused) "Resume" else "Pause")
            v.setOnClickPendingIntent(R.id.w_btn1, Notifs.pi(c, 22, "pause"))
            v.setTextViewText(R.id.w_btn2, if (over) "Finish" else "Stop"); v.setViewVisibility(R.id.w_btn2, View.VISIBLE)
            v.setOnClickPendingIntent(R.id.w_btn2, Notifs.pi(c, 23, "stop"))
            val rt = SystemClock.elapsedRealtime()
            if (paused) {
                v.setViewVisibility(R.id.w_chrono, View.GONE); v.setViewVisibility(R.id.w_time, View.VISIBLE)
                v.setTextViewText(R.id.w_time, Notifs.clock(if (s.targetSec > 0) s.targetMs - el else el))
                v.setTextViewText(R.id.w_sub, "Resumes automatically")
            } else {
                v.setViewVisibility(R.id.w_time, View.GONE); v.setViewVisibility(R.id.w_chrono, View.VISIBLE)
                val countDown = s.targetSec > 0 && !over
                v.setChronometerCountDown(R.id.w_chrono, countDown)
                val base = if (countDown) rt + (s.targetMs - el) else rt - (if (over) el - s.targetMs else el)
                v.setChronometer(R.id.w_chrono, base, null, true)
                v.setTextViewText(R.id.w_sub, if (over) "Extra time" else if (countDown) "Time remaining" else "Focus time")
            }
            return v
        }
    }
}
