import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Progress from '@radix-ui/react-progress';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Clock3, Flag, Pause, Play, Sparkles, Target, TriangleAlert } from 'lucide-react';
import { decideToday, decisionExplanation, DayDecision } from '../todayDecisionEngine';
import { TodayInsights } from '../todayInsights';
import { TodayItem } from '../todayTypes';
import { ActiveFocusState } from '../../work/focus/focusEngine';
import { PlanningDialog } from '../../../components/common/PlanningDialog';
import { getLocalDateString, parseLocalDate } from '../../../utils/dateUtils';

function GoalProgress({ value, label }: { value: number; label: string }) {
  return <Progress.Root className="decision-progress" value={value} aria-label={label}><Progress.Indicator className="decision-progress-fill" style={{ width: `${value}%` }} /></Progress.Root>;
}

export function TodayDecisionPanel({ decision, insights, ar, busy, focus, onExecute, onEdit, onFocus, onPause, onDefer, onInterrupt, onPlan, onSessionChange, sessionMinutes }: {
  decision: ReturnType<typeof decideToday>; insights: TodayInsights; ar: boolean; busy: boolean; focus: ActiveFocusState;
  onExecute: (item: TodayItem) => void; onEdit: (item: TodayItem) => void; onFocus: (id: string) => void;
  onPause: () => void; onDefer: (id: string) => void; onInterrupt: (title: string) => Promise<void>;
  onPlan: () => void; onSessionChange: (minutes?: number) => void; sessionMinutes?: number;
}) {
  const [clock, setClock] = useState(Date.now());
  const [interruptionOpen, setInterruptionOpen] = useState(false);
  const [interruptionTitle, setInterruptionTitle] = useState('');
  const [interruptionSaving, setInterruptionSaving] = useState(false);
  const [interruptionError, setInterruptionError] = useState('');
  useEffect(() => { if (!focus.activeSession) return; const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, [focus.activeSession]);
  const activeTask = insights.tasks.find(task => task.id === focus.focusedTaskId);
  const elapsed = focus.activeSession ? Math.max(0, Math.floor((clock - new Date(focus.activeSession.startedAt).getTime()) / 1000)) : 0;
  const renderTask = (entry: DayDecision) => <div className="decision-essential" key={entry.item.id}>
    <span className={`decision-check ${entry.item.isCompleted ? 'is-done' : ''}`} aria-hidden="true">{entry.item.isCompleted ? <Check size={15} /> : <Flag size={14} />}</span>
    <div className="min-w-0 flex-1"><strong>{entry.item.title}</strong><p>{entry.blocked ? `${ar ? 'متوقفة: ' : 'Blocked: '}${entry.blockers.join('، ') || entry.task?.waitingContext?.waitingOn || (ar ? 'في انتظار متابعة' : 'Awaiting follow-up')}` : decisionExplanation(entry, ar)}</p></div>
    {!entry.item.isCompleted && <button className="today-secondary" disabled={busy} onClick={() => entry.blocked ? onEdit(entry.item) : onExecute(entry.item)}>{entry.blocked ? (ar ? 'متابعة' : 'Review') : (ar ? 'تنفيذ' : 'Do it')}</button>}
  </div>;
  const recommendation = decision.recommendation;
  return <section className="decision-shell" aria-label={ar ? 'مساعد يومك' : 'Your daily guide'}>
    {activeTask && focus.activeSession && <div className="decision-focus" role="status">
      <span className="decision-live-dot" /><div className="flex-1 min-w-0"><small>{ar ? 'أنت مركز دلوقتي على' : 'Currently focused on'}</small><strong>{activeTask.title}</strong></div>
      <span className="font-mono tabular-nums" dir="ltr">{Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}</span>
      <button className="today-secondary" disabled={busy} onClick={onPause}><Pause size={14} />{ar ? 'إيقاف' : 'Pause'}</button>
      <button className="today-secondary" disabled={busy} onClick={() => setInterruptionOpen(true)}>{ar ? 'جت مقاطعة؟' : 'Interrupted?'}</button>
    </div>}
    {decision.overloadMinutes > 0 && <div className="decision-warning mx-4" role="status"><TriangleAlert size={17} /><span>{ar ? `الأساسيات محتاجة ${decision.overloadMinutes} دقيقة زيادة على وقتك المتاح، على الأقل.` : `Essentials need at least ${decision.overloadMinutes} more minutes than your capacity.`}</span><button className="today-secondary" onClick={onPlan}>{ar ? 'نراجع الخطة؟' : 'Review the plan'}</button></div>}
    <Tabs.Root defaultValue="now" dir={ar ? 'rtl' : 'ltr'}>
      <div className="decision-topbar"><Tabs.List className="decision-tabs" aria-label={ar ? 'اختار اللي محتاجه دلوقتي' : 'What do you need?'}>
        <Tabs.Trigger value="now"><Sparkles size={15} />{ar ? 'أعمل إيه دلوقتي؟' : 'What now?'}</Tabs.Trigger>
        <Tabs.Trigger value="day"><Flag size={15} />{ar ? 'ضروري النهارده' : 'Today’s essentials'}</Tabs.Trigger>
        <Tabs.Trigger value="progress"><Target size={15} />{ar ? 'أنا وصلت لفين؟' : 'My progress'}</Tabs.Trigger>
      </Tabs.List><button className="today-secondary" onClick={onPlan}>{ar ? 'رتّب يومك' : 'Plan my day'}</button></div>
      <Tabs.Content value="now" className="decision-tab-content">
        <div className="decision-session"><span>{ar ? 'وقت متاح للجلسة:' : 'Time for this session:'}</span>{[undefined, 15, 30, 60].map(value => <button key={value || 'any'} aria-pressed={sessionMinutes === value} onClick={() => onSessionChange(value)}>{value ? `${value} ${ar ? 'د' : 'min'}` : (ar ? 'مرن' : 'Flexible')}</button>)}</div>
        {recommendation ? <div className="decision-recommendation">
          <div className="decision-eyebrow"><Sparkles size={15} />{ar ? 'الخطوة الأنسب دلوقتي' : 'Your next meaningful step'}</div>
          <h2>{recommendation.item.title}</h2><p className="decision-reason">{recommendation.blocked ? (ar ? 'المهمة دي ضرورية، لكنها مستنية خطوة أو رد. المتابعة هي الإجراء المناسب دلوقتي.' : 'This commitment is blocked. Follow up before trying to execute it.') : decisionExplanation(recommendation, ar)}</p>
          <div className="decision-details"><span><Clock3 size={14} />{recommendation.minutes ? `${recommendation.minutes} ${ar ? 'دقيقة' : 'min'}` : (ar ? 'حدد المدة عشان التخطيط يبقى أدق' : 'Set a duration for more accurate planning')}</span>
            {recommendation.task?.deadlineAt && <span><Flag size={14} />{ar ? 'التسليم' : 'Due'} {new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(recommendation.task.deadlineAt))}</span>}
          </div>
          {decision.sessionTooShort && <p className="decision-warning"><TriangleAlert size={15} />{ar ? 'المهمة الأساسية أطول من الوقت اللي اخترته؛ خصّصلها وقت أو عدّل خطتك بدل الانشغال بمهمة أقل أهمية.' : 'This commitment needs more time. Make room or review your plan before switching to less important work.'}</p>}
          <div className="decision-actions">
            {!recommendation.blocked && recommendation.task && !recommendation.task.isRecurring && recommendation.task.spaceId === 'work' && focus.focusedTaskId !== recommendation.task.id && <button className="today-primary" disabled={busy} onClick={() => onFocus(recommendation.task!.id)}><Play size={15} />{ar ? 'ابدأ تركيز' : 'Start focus'}</button>}
            {!recommendation.blocked && <button className="today-secondary" disabled={busy} onClick={() => onExecute(recommendation.item)}><Check size={15} />{recommendation.item.actionType === 'toggle_task' || recommendation.item.actionType === 'log_prayer' ? (ar ? 'تم الإنجاز' : 'Mark done') : (ar ? 'ابدأ' : 'Start')}</button>}
            {recommendation.task && <button className="today-secondary" onClick={() => onEdit(recommendation.item)}>{ar ? 'تعديل التفاصيل' : 'Edit details'}</button>}
            {recommendation.task && !recommendation.essential && !recommendation.task.isRecurring && <button className="today-secondary" disabled={busy} onClick={() => onDefer(recommendation.task!.id)}>{ar ? 'بكرة أنسب' : 'Move to tomorrow'}</button>}
          </div>
        </div> : <div className="decision-recommendation"><h2>{ar ? 'مفيش حاجة جاهزة للتنفيذ دلوقتي' : 'Nothing ready to act on right now'}</h2><p className="today-muted">{ar ? 'راجع الالتزامات المتوقفة أو المواعيد الجاية، أو اختار نتيجة جديدة ليومك.' : 'Review blocked commitments and upcoming windows, or choose a new outcome.'}</p><button className="today-primary mt-4" onClick={onPlan}>{ar ? 'راجع خطة اليوم' : 'Review my plan'}</button></div>}
        {!!decision.blockedEssentials.length && <p className="decision-warning"><TriangleAlert size={16} />{ar ? `${decision.blockedEssentials.length} من أساسياتك محتاجة متابعة قبل التنفيذ. افتح «ضروري النهارده».` : `${decision.blockedEssentials.length} essential items need follow-up. Check today’s essentials.`}</p>}
      </Tabs.Content>
      <Tabs.Content value="day" className="decision-tab-content">
        <div className="decision-day-summary"><div><strong>{decision.essentialCompleted} / {decision.essentials.length}</strong><p>{ar ? 'من أساسيات يومك اتنجزت' : 'essential items done'}</p></div><div><strong>{decision.requiredMinutes} {ar ? 'د' : 'min'}</strong><p>{ar ? 'مدة محددة للأساسيات المتبقية' : 'known time for remaining essentials'}</p></div><div><strong>{decision.capacity === undefined ? '—' : `${decision.capacity} ${ar ? 'د' : 'min'}`}</strong><p>{ar ? 'قدرة متبقية حسب خطتك ونهاية اليوم' : 'capacity within your planned day'}</p></div></div>
        {decision.overloadMinutes > 0 && <div className="decision-warning"><TriangleAlert size={18} /><span>{ar ? `خطتك أكبر من وقتك المتاح بـ ${decision.overloadMinutes} دقيقة على الأقل. راجع المدة أو اختياراتك؛ مفيش تأجيل تلقائي.` : `Your plan exceeds capacity by at least ${decision.overloadMinutes} minutes. Review it; nothing is moved automatically.`}</span><button className="today-secondary" onClick={onPlan}>{ar ? 'إعادة تخطيط' : 'Replan'}</button></div>}
        {!!decision.unknownDurations && <p className="today-muted mb-3">{ar ? `${decision.unknownDurations} بنود أساسية بدون مدة؛ تقدير الحمل مش كامل.` : `${decision.unknownDurations} essentials have no duration, so workload is incomplete.`}</p>}
        {decision.essentials.length ? decision.essentials.map(renderTask) : <div className="today-empty">{ar ? 'حدد نتائج يومك أو أضف مهمة بموعد تسليم ثابت.' : 'Choose daily outcomes or add a task with a fixed deadline.'}</div>}
      </Tabs.Content>
      <Tabs.Content value="progress" className="decision-tab-content">
        <div className="decision-section-title"><h2>{ar ? 'خطوات صغيرة، وتقدّم واضح' : 'Small steps, visible progress'}</h2><Link to="/progress">{ar ? 'كل التقدم' : 'All progress'}<ArrowUpRight size={14} /></Link></div>
        <div className="decision-goals">{insights.goals.length ? insights.goals.map(goal => <Link to="/plans" key={goal.id} className="decision-goal"><div className="flex justify-between gap-3"><h3>{goal.title}</h3><strong>{goal.percent}%</strong></div><GoalProgress value={goal.percent} label={goal.title} /><p>{goal.totalMilestones ? (ar ? `${goal.completedMilestones} من ${goal.totalMilestones} مراحل مكتملة` : `${goal.completedMilestones} of ${goal.totalMilestones} milestones done`) : (ar ? `${goal.completedTasks} من ${goal.totalTasks} مهام مكتملة` : `${goal.completedTasks} of ${goal.totalTasks} tasks done`)}</p><p className="decision-goal-contribution">{ar ? `${goal.todayCompleted} خطوة اتنجزت النهارده` : `${goal.todayCompleted} steps completed today`}</p>{(goal.nextTask || goal.nextMilestone) && <p>{ar ? 'الخطوة الجاية: ' : 'Next: '}{goal.nextTask || goal.nextMilestone}</p>}</Link>) : <Link to="/plans" className="today-empty">{ar ? 'اربط مهامك بهدف عشان تشوف تأثير مجهودك هنا.' : 'Link tasks to a goal to see their impact here.'}</Link>}</div>
        <div className="decision-week"><h3>{ar ? 'استمراريتك خلال ٧ أيام' : 'Your last 7 days'}</h3><p className="today-muted">{ar ? 'أنشطة مسجّلة من مهامك وتمارينك وعباداتك.' : 'Recorded tasks, workouts and worship activities.'}</p><div className="decision-week-bars">{insights.week.map(day => <div key={day.date} title={`${day.date}: ${day.count} / ${day.focusMinutes} min`}><span>{day.count}</span><div style={{ height: `${Math.max(4, day.count / Math.max(1, ...insights.week.map(entry => entry.count)) * 64)}px` }} /><small>{new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { weekday: 'short' }).format(parseLocalDate(day.date))}</small></div>)}</div></div>
        <div className="decision-achievements"><h3>{ar ? 'مجهود النهارده ما راحش هدر' : 'What you moved forward today'}</h3>{insights.todayAchievements.length ? insights.todayAchievements.slice(0, 6).map(task => <p key={task.id}><Check size={14} />{task.title}</p>) : <p className="today-muted">{ar ? 'إنجازات مهامك هتظهر هنا أول ما تسجلها. خطوة واحدة كفاية للبداية.' : 'Completed tasks will appear here. One step is enough to start.'}</p>}</div>
      </Tabs.Content>
    </Tabs.Root>
    {interruptionOpen && <PlanningDialog open onOpenChange={open => { if (!open && !interruptionSaving) setInterruptionOpen(false); }} title={ar ? 'سجّل المقاطعة من غير ما تفقد مكانك' : 'Capture an interruption'} description={ar ? 'هنوقف الجلسة الحالية ونسجل وقتها، ونفتح تركيز للمهمة الجديدة مع ربطها بالمهمة الأصلية.' : 'Pause and log your current session, then focus on the interruption with a link to your original task.'}>
      <form className="space-y-4" onSubmit={async event => { event.preventDefault(); if (interruptionSaving || !interruptionTitle.trim()) return; setInterruptionSaving(true); setInterruptionError(''); try { await onInterrupt(interruptionTitle.trim()); setInterruptionOpen(false); setInterruptionTitle(''); } catch { setInterruptionError(ar ? 'تعذر حفظ المقاطعة.' : 'Could not save the interruption.'); } finally { setInterruptionSaving(false); } }}>
        {interruptionError && <p role="alert" className="text-rose-300">{interruptionError}</p>}
        <label className="planning-field"><span>{ar ? 'المهمة الجديدة' : 'New task'}</span><input autoFocus required value={interruptionTitle} onChange={e => setInterruptionTitle(e.target.value)} /></label><button className="today-primary w-full" disabled={interruptionSaving}>{ar ? 'سجّل وبدّل التركيز' : 'Capture and switch focus'}</button>
      </form>
    </PlanningDialog>}
    <span className="sr-only">{getLocalDateString()}</span>
  </section>;
}
