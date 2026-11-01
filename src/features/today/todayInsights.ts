import { db } from '../../db/database';
import { calculatePlanProgress } from '../../db/goalPlanQueries';
import { addDaysToLocalDate, getLocalDateString } from '../../utils/dateUtils';
import { getDailyPrayersState, getQuranDailyStatus } from '../../db/worshipQueries';
import { getFocusHistory } from '../work/focus/focusService';

export async function loadTodayInsights(date = getLocalDateString()) {
  const [tasks, plans, milestones, workouts, azkar, dayPlan] = await Promise.all([
    db.tasks.toArray(), db.plans.toArray(), db.planMilestones.toArray(), db.workoutLogs.toArray(), db.azkarLogs.toArray(), db.dayPlans.get(date),
  ]);
  const completedOn = (task: typeof tasks[number], day: string) => task.isRecurring ? !!task.recurringCompletionDates?.includes(day) : !!task.isCompleted && !!task.completedAt && getLocalDateString(new Date(task.completedAt)) === day;
  const goals = await Promise.all(plans.filter(plan => plan.status === 'active').map(async plan => {
    const linked = tasks.filter(task => task.planId === plan.id);
    const stages = milestones.filter(milestone => milestone.planId === plan.id).sort((a, b) => a.order - b.order);
    return { id: plan.id, title: plan.title, percent: await calculatePlanProgress(plan.id), completedMilestones: stages.filter(stage => stage.isCompleted).length,
      totalMilestones: stages.length, completedTasks: linked.filter(task => task.isCompleted && !task.isRecurring).length,
      totalTasks: linked.filter(task => !task.isRecurring).length, todayCompleted: linked.filter(task => completedOn(task, date)).length,
      nextMilestone: stages.find(stage => !stage.isCompleted)?.title,
      nextTask: linked.find(task => !task.isCompleted && task.status !== 'WAITING')?.title };
  }));
  const focusHistory = getFocusHistory();
  const week = Array.from({ length: 7 }, (_, index) => {
    const day = addDaysToLocalDate(date, index - 6);
    const taskCount = tasks.filter(task => completedOn(task, day)).length;
    const activityCount = workouts.filter(log => getLocalDateString(new Date(log.completedAt)) === day).length
      + azkar.filter(log => log.date === day && log.isFullyCompleted).length
      + Object.values(getDailyPrayersState(day)).filter(prayer => prayer.fard).length
      + (getQuranDailyStatus(day).pagesRead > 0 ? 1 : 0);
    return { date: day, count: taskCount + activityCount, focusMinutes: focusHistory.filter(session => getLocalDateString(new Date(session.date)) === day).reduce((sum, session) => sum + session.minutes, 0) };
  });
  return { tasks, dayPlan, goals, week, todayAchievements: tasks.filter(task => completedOn(task, date)) };
}

export type TodayInsights = Awaited<ReturnType<typeof loadTodayInsights>>;
