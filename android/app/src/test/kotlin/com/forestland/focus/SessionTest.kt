package com.forestland.focus

import org.junit.Assert.*
import org.junit.Test

/** Mirrors the JS rules in app.js (elapsed(), PAUSE_AUTO). Run: ./gradlew testDebugUnitTest */
class SessionTest {
    private val min = 60_000L
    private fun s(start: Long = 0, target: Long = 25 * 60, paused: Long = 0, pauseAt: Long = 0) =
        Session("t", start, target, paused, pauseAt, "birch", true)

    @Test fun elapsedIsWallClockWhenRunning() = assertEquals(10 * min, s().elapsedMs(10 * min))

    @Test fun elapsedFreezesWhilePaused() {
        val x = s(pauseAt = 10 * min)
        assertEquals(10 * min, x.elapsedMs(10 * min)); assertEquals(10 * min, x.elapsedMs(20 * min)); assertTrue(x.isPaused(20 * min))
    }

    @Test fun pauseAutoResumesAfter15Minutes() {
        val x = s(pauseAt = 10 * min)
        assertFalse(x.isPaused(26 * min))
        assertEquals(10 * min, x.elapsedMs(25 * min))          // still frozen exactly at the limit
        assertEquals(11 * min, x.elapsedMs(26 * min))          // counting again after auto-resume
    }

    @Test fun accumulatedPausesAreSubtracted() = assertEquals(20 * min, s(paused = 5 * min).elapsedMs(25 * min))

    @Test fun overAndNextEvent() {
        val x = s(target = 25 * 60)
        assertFalse(x.isOver(24 * min)); assertTrue(x.isOver(25 * min))
        assertEquals(2 * min, x.nextEvent(0))                   // first growth stage (sprout -> young)
        assertEquals(25 * min, x.nextEvent(3 * min))             // end of session comes before the 30-minute stage
    }

    @Test fun nextEventWhilePausedIsAutoResume() = assertEquals(25 * min, s(pauseAt = 10 * min).nextEvent(12 * min))

    @Test fun stagesFollowFocusTimeNotWallTime() {
        assertEquals(0, s().stage(1 * min)); assertEquals(1, s().stage(5 * min)); assertEquals(2, s().stage(31 * min)); assertEquals(3, s().stage(61 * min))
        assertEquals(0, s(paused = 30 * min).stage(31 * min))   // 31 min on the clock but only 1 focus minute -> still a sprout
    }

    @Test fun sessionSpanningMidnightKeepsCorrectElapsed() {
        val start = 23 * 60 * min + 50 * min                    // 23:50
        val x = s(start = start, target = 60 * 60)
        assertEquals(30 * min, x.elapsedMs(start + 30 * min))   // 00:20 next day: pure timestamps, no day arithmetic
    }

    @Test fun nextReminderPicksEarliestMatchingDay() {
        val t = Reminders.nextTime("[{\"time\":\"09:00\",\"days\":[0,1,2,3,4,5,6],\"on\":true}]", System.currentTimeMillis())
        assertTrue(t > System.currentTimeMillis())
        assertEquals(0L, Reminders.nextTime("[{\"time\":\"09:00\",\"days\":[1],\"on\":false}]", System.currentTimeMillis()))
    }
}
