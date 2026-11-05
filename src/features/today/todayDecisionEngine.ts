import { DayPlan, LifeTask } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';
import { TodayItem } from './todayTypes';
import { isSpaceTaskDue } from './taskCalendar';

export type DecisionReason = 'deadline_risk' | 'deadline_today' | 'prayer_window' | 'chosen' | 'must' | 'current' | 'goal' | 'priority' | 'flexible';
export interface DayDecision {
  item: TodayItem;
  task?: LifeTask;
  essential: boolean;
  blocked: boolean;
  blockers: string[];
  reason: DecisionReason;
  minutes?: number;
  latestStart?: Date;
  score: number;
}

/** Explainable, deterministic rules. No opaque scoring model or automatic rescheduling. */
export function decideToday(items: TodayItem[], tasks: LifeTask[], plan: DayPlan | undefined, now = new Date(), sessionMinutes?: number) {
  const today = getLocalDateString(now);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  const byId = new Map(tasks.map(task => [task.id, task]));
  const picked = new Set(plan?.date === today ? plan.essentialTaskIds : []);
  const sourceItems = [...items];
  // Presentation filters must never hide a hard deadline or a deliberately chosen outcome.
  for (const task of tasks) {
    if (sourceItems.some(item => item.actionType === 'toggle_task' && item.sourceId === task.id)) continue;
    const deadline = task.deadlineAt ? new Date(task.deadlineAt) : undefined;
    const critical = (deadline && deadline <= end) || picked.has(task.id) || (task.commitment === 'must' && isSpaceTaskDue(task, today));
    if (!critical) continue;
    const completed = task.isRecurring ? !!task.recurringCompletionDates?.includes(today) : task.isCompleted;
    if (completed && !picked.has(task.id) && task.completedAt && getLocalDateString(new Date(task.completedAt)) !== today) continue;
    sourceItems.push({ id: `essential_${task.id}_${today}`, sourceId: task.id, title: task.title, space: task.spaceId,
      type: task.spaceId === 'work' ? 'work_task' : task.spaceId === 'health' ? 'health_task' : task.spaceId === 'worship' ? 'worship_task' : task.spaceId === 'plans' ? 'plan_action' : 'home_task',
      scheduledTime: task.scheduledTime, estimatedMinutes: task.estimatedMinutes, priority: task.priority,
      timeTag: completed ? 'completed' : 'flexible', status: completed ? 'completed' : 'pending', isCompleted: completed,
      actionType: 'toggle_task', sortKey: 0 });
  }
  const decisions: DayDecision[] = sourceItems.map(item => {
    const task = item.actionType === 'toggle_task' ? byId.get(item.sourceId) : undefined;
    const duration = item.estimatedMinutes && item.estimatedMinutes > 0 ? item.estimatedMinutes : undefined;
    const deadline = task?.deadlineAt ? new Date(task.deadlineAt) : undefined;
    const validDeadline = deadline && Number.isFinite(deadline.getTime()) ? deadline : undefined;
    const deadlineToday = !!validDeadline && validDeadline <= end;
    const latestStart = validDeadline && duration ? new Date(validDeadline.getTime() - duration * 60000) : undefined;
    const deadlineRisk = deadlineToday && (latestStart ? latestStart.getTime() <= now.getTime() + 15 * 60000 : validDeadline!.getTime() <= now.getTime() + 60 * 60000);
    const blockers = (task?.dependsOnTaskIds || []).filter(id => {
      const dependency = byId.get(id);
      return !dependency || (dependency.isRecurring ? !dependency.recurringCompletionDates?.includes(today) : !dependency.isCompleted);
    }).map(id => byId.get(id)?.title || 'مهمة مرتبطة غير متاحة');
    const blocked = task?.status === 'WAITING' || blockers.length > 0;
    const chosen = picked.has(item.sourceId);
    const essential = deadlineToday || chosen || task?.commitment === 'must' || item.type === 'prayer';
    let reason: DecisionReason = 'flexible';
    let score = 100;
    if (deadlineRisk) { reason = 'deadline_risk'; score = 10000; }
    else if (item.type === 'prayer' && item.timeTag === 'now') { reason = 'prayer_window'; score = 9500; }
    else if (deadlineToday) { reason = 'deadline_today'; score = 9000; }
    else if (chosen) { reason = 'chosen'; score = 7500; }
    else if (task?.commitment === 'must') { reason = 'must'; score = 7000; }
    else if (item.timeTag === 'now') { reason = 'current'; score = 6000; }
    else if (task?.planId || task?.goalImpact === 'high' || item.type === 'plan_action') { reason = 'goal'; score = 4500; }
    else if (item.priority === 'high') { reason = 'priority'; score = 3000; }
    // Within the same deadline tier, protect the least remaining slack first.
    if (deadlineToday && validDeadline) score += Math.max(-500, Math.min(500, 500 - ((latestStart || validDeadline).getTime() - now.getTime()) / 60000));
    return { item, task, essential, blocked, blockers, reason, minutes: duration, latestStart, score };
  }).sort((a, b) => b.score - a.score || a.item.sortKey - b.item.sortKey || a.item.id.localeCompare(b.item.id));
  const pending = decisions.filter(decision => !decision.item.isCompleted);
  // Scheduled activities are visible but do not displace executable work before their window.
  const executable = pending.filter(decision => !decision.blocked && (decision.item.timeTag !== 'scheduled' || decision.reason === 'deadline_risk' || decision.reason === 'deadline_today'));
  let recommendation = executable[0] || null;
  const blockedEssential = pending.find(decision => decision.blocked && decision.essential);
  if (blockedEssential && (!recommendation || !recommendation.essential || blockedEssential.score > recommendation.score)) recommendation = blockedEssential;
  if (sessionMinutes && recommendation && !recommendation.blocked && recommendation.reason !== 'deadline_risk' && recommendation.reason !== 'prayer_window') {
    const pool = executable.some(decision => decision.essential) ? executable.filter(decision => decision.essential) : executable;
    recommendation = pool.find(decision => decision.minutes !== undefined && decision.minutes <= sessionMinutes) || pool[0] || null;
  }
  const essentials = decisions.filter(decision => decision.essential);
  const remainingEssentials = essentials.filter(decision => !decision.item.isCompleted);
  const requiredMinutes = remainingEssentials.reduce((sum, decision) => sum + (decision.minutes || 0), 0);
  const unknownDurations = remainingEssentials.filter(decision => !decision.minutes).length;
  const [hours, minutes] = (plan?.endTime || '22:00').split(':').map(Number);
  const dayEnd = new Date(now); dayEnd.setHours(hours, minutes, 0, 0);
  const wallMinutes = Math.max(0, Math.floor((dayEnd.getTime() - now.getTime()) / 60000));
  const capacity = plan ? Math.min(plan.availableMinutes, wallMinutes) : undefined;
  return {
    decisions, recommendation, essentials, remainingEssentials,
    essentialCompleted: essentials.filter(decision => decision.item.isCompleted).length,
    requiredMinutes, unknownDurations, capacity,
    overloadMinutes: capacity === undefined ? 0 : Math.max(0, requiredMinutes - capacity),
    blockedEssentials: remainingEssentials.filter(decision => decision.blocked),
    sessionTooShort: !!(sessionMinutes && recommendation?.minutes && recommendation.minutes > sessionMinutes),
  };
}

export function decisionExplanation(decision: DayDecision, ar: boolean) {
  const reasons: Record<DecisionReason, [string, string]> = {
    deadline_risk: ['وقت التسليم ضيق بالنسبة للمدة المطلوبة؛ ابدأ قبل ما تتزنق.', 'The delivery deadline is tight for the required duration. Start now.'],
    deadline_today: ['موعد تسليم ثابت النهارده؛ قبل المهام المرنة.', 'A fixed delivery deadline is due today, ahead of flexible work.'],
    prayer_window: ['ده وقت الصلاة الحالي.', 'This is the current prayer window.'],
    chosen: ['أنت اخترتها ضمن نتائج يومك الأساسية.', 'You chose this as a key outcome for today.'],
    must: ['أنت محدد إن المهمة دي مينفعش تتأجل.', 'You marked this as a must-do commitment.'],
    current: ['ميعادها الحالي مناسب للتنفيذ.', 'Its scheduled window is open now.'],
    goal: ['خطوة مباشرة بتقرّبك من هدفك.', 'A direct step toward your goal.'],
    priority: ['أولوية عالية ومفيش التزام ثابت أسبق منها متاح حاليًا.', 'High priority, with no earlier executable commitment.'],
    flexible: ['مهمة متاحة دلوقتي ومفيش التزام أسبق منها.', 'Available now, with no earlier executable commitment.'],
  };
  return reasons[decision.reason][ar ? 0 : 1];
}
