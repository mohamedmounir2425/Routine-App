import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { liveQuery } from 'dexie';
import { ArrowUpRight, Plus, RefreshCw, Search } from 'lucide-react';
import { aggregateTodayFeed } from './todayAggregator';
import { TodayAggregationResult, TodayItem } from './todayTypes';
import { executeToggleTask, executeTogglePrayer, executeCompleteProjectAction, executeAddQuranPage } from './todayActions';
import { getSavedTodayPreferences } from './todayPreferencesService';
import { TodayHeader } from './components/TodayHeader';
import { TodaySectionList } from './components/TodaySectionList';
import { TodayDecisionPanel } from './components/TodayDecisionPanel';
import { DayPlanningDialog } from './components/DayPlanningDialog';
import { loadTodayInsights, TodayInsights } from './todayInsights';
import { decideToday } from './todayDecisionEngine';
import { deferTaskUntilTomorrow } from './todayPlanningService';
import { getLocalDateString } from '../../utils/dateUtils';
import { startTaskFocus, pauseActiveFocus, completeTaskWithFocus, captureAndStartInterruption, getPersistedActiveFocusState } from '../work/focus/focusEngine';
import { TodayQuickAddModal } from './components/TodayQuickAddModal';
import { TodayPreferencesModal } from './components/TodayPreferencesModal';
import { TodayWorkoutModal } from './components/TodayWorkoutModal';
import { Routine, TodayPreferences, LifeSpaceId, LifeTask } from '../../types';
import { LIFE_SPACES_CONFIG } from '../../config/spacesConfig';
import { db } from '../../db/database';
import { useTranslation } from '../../i18n';
import './today.css';

export function TodayPage({ onStartRoutine }: { onStartRoutine?: (routine: Routine) => void }) {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const ar = language === 'ar';
  const [preferences, setPreferences] = useState<TodayPreferences>(getSavedTodayPreferences);
  const [data, setData] = useState<TodayAggregationResult | null>(null);
  const [insights, setInsights] = useState<TodayInsights | null>(null);
  const [isDayPlanningOpen, setIsDayPlanningOpen] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LifeTask | null>(null);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isWorkoutScheduleOpen, setIsWorkoutScheduleOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<LifeSpaceId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const requestId = useRef(0);
  const invalidateRequests = useCallback(() => { requestId.current += 1; }, []);

  const loadFeed = useCallback(async () => {
    const request = ++requestId.current;
    try {
      const [result, details] = await Promise.all([aggregateTodayFeed({ preferences }), loadTodayInsights()]);
      if (request === requestId.current) { setData(result); setInsights(details); setError(''); }
    } catch (err) {
      console.error('Failed to load Today:', err);
      if (request === requestId.current) setError(ar ? 'تعذر تحديث يومك. حاول مرة أخرى.' : 'Could not refresh your day. Please retry.');
    } finally {
      if (request === requestId.current) setIsLoading(false);
    }
  }, [preferences, ar]);

  useEffect(() => {
    // Track Dexie reads made by the aggregator so mutations elsewhere refresh Today too.
    const subscription = liveQuery(() => Promise.all([aggregateTodayFeed({ preferences }), loadTodayInsights()])).subscribe({
      next: ([result, details]) => { ++requestId.current; setData(result); setInsights(details); setIsLoading(false); setError(''); },
      error: err => { console.error(err); setError(ar ? 'تعذر تحميل اليوم.' : 'Could not load Today.'); setIsLoading(false); },
    });
    const refresh = () => { if (document.visibilityState === 'visible') void loadFeed(); };
    const storage = () => { setPreferences(getSavedTodayPreferences()); void loadFeed(); };
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', storage);
    return () => {
      invalidateRequests();
      subscription.unsubscribe(); window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh); window.removeEventListener('storage', storage);
    };
  }, [preferences, loadFeed, ar, invalidateRequests]);

  const perform = async (action: () => Promise<void> | void) => {
    if (actionLock.current) return;
    actionLock.current = true; setBusy(true); setError('');
    try { await action(); await loadFeed(); }
    catch (err) { console.error(err); setError(ar ? 'لم يتم حفظ التغيير. حاول مرة أخرى.' : 'Your change could not be saved. Please retry.'); }
    finally { actionLock.current = false; setBusy(false); }
  };

  const handleExecuteAction = (item: TodayItem) => perform(async () => {
    switch (item.actionType) {
      case 'start_workout':
        if (item.actionPayload?.routine && onStartRoutine) onStartRoutine(item.actionPayload.routine);
        else navigate('/health');
        break;
      case 'log_prayer': executeTogglePrayer(item.sourceId); break;
      case 'open_azkar': navigate('/worship/azkar'); break;
      case 'open_quran': navigate('/worship/quran'); break;
      case 'start_focus': navigate('/work/focus'); break;
      case 'complete_project_step':
        if (!item.actionPayload?.projectId || !item.actionPayload?.stepId) throw new Error('Missing project action');
        if (!await executeCompleteProjectAction(item.actionPayload.projectId, item.actionPayload.stepId)) throw new Error('Project action failed');
        break;
      case 'toggle_task':
        {
          const task = await db.tasks.get(item.sourceId);
          const result = task && !task.isCompleted && !task.isRecurring
            ? await completeTaskWithFocus(task.id)
            : await executeToggleTask(item.sourceId);
          if (!result) throw new Error('Task update failed');
        }
        break;
    }
  });

  const editTask = async (item: TodayItem) => {
    try {
      const task = await db.tasks.get(item.sourceId);
      if (!task) throw new Error('Task no longer exists');
      setEditingTask(task); setIsQuickAddOpen(true);
    } catch { setError(ar ? 'تعذر فتح المهمة للتعديل.' : 'Could not open this task.'); }
  };
  const addTask = () => {
    if (selectedSpace === 'health') { setIsWorkoutScheduleOpen(true); return; }
    setEditingTask(null); setIsQuickAddOpen(true);
  };
  const spaceConfig = LIFE_SPACES_CONFIG.find(space => space.id === selectedSpace);
  const matching = (item: TodayItem) => (selectedSpace === 'all' || item.space === selectedSpace)
    && (!query.trim() || `${item.title} ${item.subtitle || ''} ${item.categoryLabel || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    && (status === 'all' || (status === 'pending' && !item.isCompleted) || (status === 'completed' && item.isCompleted) || (status === 'priority' && item.priority === 'high' && !item.isCompleted));
  const sections = (data?.sections || []).map(section => ({ ...section, items: section.items.filter(matching), badgeCount: section.items.filter(matching).length })).filter(section => section.items.length);
  const decision = decideToday(data?.items || [], insights?.tasks || [], insights?.dayPlan, new Date(), sessionMinutes);
  const remainingMinutes = (data?.items || []).filter(item => !item.isCompleted).reduce((sum, item) => sum + (item.estimatedMinutes || 0), 0);
  const spaceNames = { worship: ar ? 'العبادة' : 'Worship', health: ar ? 'الصحة' : 'Health', work: ar ? 'العمل' : 'Work', home: ar ? 'المنزل' : 'Home', plans: ar ? 'الخطط' : 'Plans' };

  return <div className="today-dashboard">
    <TodayHeader totalCount={decision.essentials.length} completedCount={decision.essentialCompleted} completionRate={decision.essentials.length ? Math.round(decision.essentialCompleted / decision.essentials.length * 100) : 0} spaceBreakdown={data?.spaceBreakdown || { worship: { total:0, completed:0 }, health: { total:0, completed:0 }, work: { total:0, completed:0 }, home: { total:0, completed:0 }, plans: { total:0, completed:0 } }} onOpenQuickAdd={addTask} onOpenPreferences={() => setIsPreferencesOpen(true)} />
    {error && <div role="alert" className="today-alert"><span>{error}</span><button onClick={() => void loadFeed()}>{ar ? 'إعادة المحاولة' : 'Retry'}</button></div>}
    {insights && <TodayDecisionPanel decision={decision} insights={insights} ar={ar} busy={busy} focus={getPersistedActiveFocusState()}
      onExecute={handleExecuteAction} onEdit={editTask} onPlan={() => setIsDayPlanningOpen(true)}
      onSessionChange={setSessionMinutes} sessionMinutes={sessionMinutes}
      onFocus={id => void perform(async () => { if (!await startTaskFocus(id)) throw new Error('Focus could not start'); })}
      onPause={() => void perform(async () => { await pauseActiveFocus(); })}
      onDefer={id => void perform(() => deferTaskUntilTomorrow(id))}
      onInterrupt={async title => {
        if (actionLock.current) throw new Error('Another action is in progress');
        actionLock.current = true; setBusy(true);
        try {
          await captureAndStartInterruption({ title, spaceId: 'work', priority: 'medium', isCompleted: false, dueDate: getLocalDateString() }, title);
          await loadFeed();
        } finally { actionLock.current = false; setBusy(false); }
      }} />}
    <section aria-label={ar ? 'مساحات حياتك' : 'Your spaces'}>
      <div className="today-section-heading"><h2>{ar ? 'مساحات حياتك' : 'Your life spaces'}</h2><button className="today-secondary" onClick={() => setSelectedSpace('all')} aria-pressed={selectedSpace === 'all'}>{ar ? 'كل المساحات' : 'All spaces'}</button></div>
      <div className="today-space-grid">{LIFE_SPACES_CONFIG.map(space => {
        const count = data?.spaceBreakdown[space.id] || { total:0, completed:0 };
        return <button key={space.id} className="today-space-card" aria-pressed={selectedSpace === space.id} onClick={() => setSelectedSpace(selectedSpace === space.id ? 'all' : space.id)}>
          <span aria-hidden="true">{space.icon}</span><strong>{spaceNames[space.id]}</strong><p>{count.total ? (ar ? `${count.completed} من ${count.total} منجز` : `${count.completed} of ${count.total} done`) : (ar ? 'لا بنود ظاهرة اليوم' : 'No items shown today')}</p>
          <div className="today-space-track"><span style={{width:`${count.total ? count.completed / count.total * 100 : 0}%`}} /></div>
        </button>;
      })}</div>
    </section>
    <div className="today-workspace">
      <section className="today-agenda" aria-busy={busy || isLoading}>
        <div className="today-section-heading"><h2>{spaceConfig ? spaceNames[spaceConfig.id] : (ar ? 'جدول يومك' : 'Your daily agenda')}</h2><button className="today-secondary" onClick={() => void loadFeed()} aria-label={ar ? 'تحديث اليوم' : 'Refresh Today'}><RefreshCw size={14} /></button></div>
        <div className="today-toolbar">
          <label className="today-search"><Search size={16} /><input aria-label={ar ? 'البحث في اليوم' : 'Search your day'} placeholder={ar ? 'ابحث في مهامك وخططك...' : 'Search tasks and plans…'} value={query} onChange={e => setQuery(e.target.value)} /></label>
          <select aria-label={ar ? 'حالة البنود' : 'Item status'} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">{ar ? 'الكل' : 'All items'}</option><option value="pending">{ar ? 'المتبقي' : 'Remaining'}</option><option value="priority">{ar ? 'الأولوية العالية' : 'High priority'}</option><option value="completed">{ar ? 'المكتمل' : 'Completed'}</option>
          </select>
        </div>
        {isLoading && !data ? <div className="today-empty" role="status">{ar ? 'جاري تجهيز يومك...' : 'Preparing your day…'}</div> : sections.length ? <>
          <fieldset disabled={busy} className="min-w-0"><TodaySectionList sections={sections} expandCompleted={status === 'completed'} onExecuteAction={handleExecuteAction} onAddQuranPage={amount => void perform(() => { executeAddQuranPage(amount); })} onEditTask={editTask} /></fieldset>
        </> : <div className="today-empty"><h3>{ar ? 'مساحة لخطوتك القادمة' : 'Room for your next step'}</h3><p>{ar ? 'لا توجد بنود تطابق هذا العرض. أضف مهمة أو عدّل الفلاتر وتفضيلات اليوم.' : 'No items match this view. Add a task or adjust your filters and Today preferences.'}</p><button className="today-primary mt-4" onClick={addTask}><Plus size={16} />{ar ? 'إضافة مهمة' : 'Add a task'}</button></div>}
      </section>
      <aside className="today-sidebar">
        <div className="today-panel"><h3>{ar ? 'إدارة المساحة' : 'Manage your space'}</h3><p className="today-muted">{ar ? 'اختر مساحة لعرض أدواتها، أو انتقل مباشرة لما تحتاجه.' : 'Select a space for its tools, or jump directly to what you need.'}</p>
          <div className="today-tool-list">{spaceConfig ? spaceConfig.navigation.map(item => <Link key={item.id} to={item.path}>{t(item.labelKey as Parameters<typeof t>[0])}<ArrowUpRight size={14} /></Link>) : LIFE_SPACES_CONFIG.map(space => <Link key={space.id} to={space.route}><span>{space.icon} {spaceNames[space.id]}</span><ArrowUpRight size={14} /></Link>)}</div>
          <button className="today-primary w-full mt-4" onClick={addTask}><Plus size={15} />{selectedSpace === 'health' ? (ar ? 'جدولة تمرين' : 'Schedule a workout') : (ar ? 'إضافة مهمة' : 'Add a task')}</button>
        </div>
        <div className="today-panel"><h3>{ar ? 'نظرة على اليوم' : 'Day at a glance'}</h3><p className="today-muted">{ar ? `${(data?.totalCount || 0) - (data?.completedCount || 0)} بنود متبقية` : `${(data?.totalCount || 0) - (data?.completedCount || 0)} items remaining`}</p><p className="today-muted">{ar ? `${remainingMinutes} دقيقة مقدّرة للبنود ذات المدة` : `${remainingMinutes} estimated minutes for timed items`}</p><Link className="today-secondary mt-3" to="/progress">{ar ? 'عرض التقدم' : 'View progress'}<ArrowUpRight size={14} /></Link></div>
      </aside>
    </div>
    <TodayQuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onTaskCreated={() => void loadFeed()} initialTask={editingTask} initialSpace={selectedSpace === 'health' || selectedSpace === 'all' ? 'work' : selectedSpace} />
    {isPreferencesOpen && <TodayPreferencesModal isOpen onClose={() => setIsPreferencesOpen(false)} currentPreferences={preferences} onSavePreferences={setPreferences} />}
    {isWorkoutScheduleOpen && <TodayWorkoutModal onClose={() => setIsWorkoutScheduleOpen(false)} onSaved={() => void loadFeed()} />}
    {isDayPlanningOpen && insights && <DayPlanningDialog plan={insights.dayPlan} tasks={insights.tasks} ar={ar} onClose={() => setIsDayPlanningOpen(false)} onSaved={() => void loadFeed()} />}
  </div>;
}
