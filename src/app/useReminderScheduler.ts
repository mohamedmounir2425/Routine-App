import { workspaceStorage } from '../db/workspaceScope';
import { useEffect, useRef } from 'react';
import { UserSettings } from '../types';
import { sendLocalNotification, getNotificationPermission } from '../utils/reminderService';

export function useReminderScheduler(
  settings: UserSettings,
  hasWorkedOutToday: boolean,
  onOpenDeskBreak?: () => void
) {
  const lastBreakNotifRef = useRef<number>(Date.now());

  useEffect(() => {
    const checkReminders = () => {
      const perm = getNotificationPermission();
      if (perm !== 'granted') return;

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().split('T')[0];

      // 1. Daily Workout Reminder Check (with Idempotency Guard)
      if (settings.reminderEnabled && settings.reminderTime) {
        const targetTime = settings.reminderTime;
        const lastNotifDate = workspaceStorage.getItem('routine_last_workout_notif_date');

        // If time matches, user hasn't worked out today, and we haven't already notified today
        if (currentTimeStr === targetTime && !hasWorkedOutToday && lastNotifDate !== todayDateStr) {
          sendLocalNotification('🏋️ وقت تمرينك اليومي لصحة ظهرك', {
            body: '15 دقيقة فقط لتخفيف الضغط عن عمودك الفقري وتثبيت استمراريتك. جاهز للبدء؟',
            tag: 'daily-workout-reminder',
          });
          workspaceStorage.setItem('routine_last_workout_notif_date', todayDateStr);
        }
      }

      // 2. Work Break Reminder Check
      if (settings.workBreakReminderEnabled) {
        const intervalMins = settings.workBreakIntervalMinutes || 45;
        const intervalMs = intervalMins * 60 * 1000;
        const elapsed = Date.now() - lastBreakNotifRef.current;

        if (elapsed >= intervalMs) {
          sendLocalNotification('🪑 استراحة المكتب والتمدد (60 ثانية)', {
            body: 'قف وتحرك لبضع ثوانٍ لتنشيط دورتك الدموية وتخفيف الضغط عن فقرات ظهرك.',
            tag: 'desk-break-reminder',
          });
          lastBreakNotifRef.current = Date.now();
          if (onOpenDeskBreak) {
            onOpenDeskBreak();
          }
        }
      }
    };

    // Run check immediately on mount and on visibility change (device wake up / tab restore)
    checkReminders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Run check every 45 seconds
    const timer = setInterval(checkReminders, 45000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings, hasWorkedOutToday, onOpenDeskBreak]);
}
