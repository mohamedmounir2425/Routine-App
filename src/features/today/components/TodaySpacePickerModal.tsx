import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, Clock, Search } from 'lucide-react';
import { PlanningDialog } from '../../../components/common/PlanningDialog';
import { db } from '../../../db/database';
import { DayPlan, HomeProject, LifeSpaceId, LifeTask } from '../../../types';
import { LIFE_SPACES_CONFIG } from '../../../config/spacesConfig';
import { getSpaceTheme } from '../../../theme/spaceTheme';
import { getLocalDateString } from '../../../utils/dateUtils';
import { isShoppingTask } from '../../home/public';
import {
  getDayPlan,
  addItemToDayPlan,
  removeItemFromDayPlan,
  isItemSelectedForDay,
  buildTaskRefKey,
  buildProjectStepRefKey,
  buildRoutineOccurrenceRefKey,
  type DayPlanSelectedItemInput,
} from '../todayPlanningService';

interface PickerCandidate {
  id: string;
  refKey: string;
  spaceId: LifeSpaceId;
  title: string;
  subtitle?: string;
  estimatedMinutes?: number;
  selectionInput: DayPlanSelectedItemInput;
}

export function TodaySpacePickerModal({
  enabledSpaces,
  ar,
  onClose,
  onChanged,
}: {
  enabledSpaces: LifeSpaceId[];
  ar: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [dayPlan, setDayPlan] = useState<DayPlan | undefined>(undefined);
  const [spaceFilter, setSpaceFilter] = useState<LifeSpaceId | 'all'>('all');
  const [quickOnly, setQuickOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const today = getLocalDateString();

  const loadData = async () => {
    const [allTasks, allProjects, currentPlan] = await Promise.all([
      db.tasks.toArray(),
      db.projects.toArray(),
      getDayPlan(today),
    ]);
    setTasks(allTasks);
    setProjects(allProjects);
    setDayPlan(currentPlan);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [today]);

  const enabledSet = useMemo(() => new Set(enabledSpaces), [enabledSpaces]);

  const candidates = useMemo<PickerCandidate[]>(() => {
    const items: PickerCandidate[] = [];

    for (const task of tasks) {
      if (!enabledSet.has(task.spaceId)) continue;
      const done = task.isRecurring
        ? Boolean(task.recurringCompletionDates?.includes(today))
        : task.isCompleted;
      if (done) continue;
      if (isShoppingTask(task)) continue;
      if (task.isSomeday === true || task.status === 'WAITING') continue;
      if (task.availableFrom && task.availableFrom > today) continue;

      const refKey = task.isRecurring
        ? buildRoutineOccurrenceRefKey(task.id, today)
        : buildTaskRefKey(task.id);

      items.push({
        id: `task_${task.id}`,
        refKey,
        spaceId: task.spaceId,
        title: task.title,
        subtitle: task.description || (task.isRecurring ? 'روتين متكرر' : 'مهمة جاهزة للتنفيذ'),
        estimatedMinutes: task.estimatedMinutes,
        selectionInput: task.isRecurring
          ? {
              refKey,
              sourceType: 'routine_occurrence',
              taskId: task.id,
              occurrenceDate: today,
            }
          : {
              refKey,
              sourceType: 'task',
              taskId: task.id,
            },
      });
    }

    for (const proj of projects) {
      const projSpace: LifeSpaceId = proj.spaceId || 'home';
      if (!enabledSet.has(projSpace)) continue;
      if (proj.status !== 'in_progress') continue;
      const openSteps = [...(proj.steps || [])]
        .filter((s) => !s.isCompleted)
        .sort((a, b) => a.order - b.order);

      for (const step of openSteps) {
        const refKey = buildProjectStepRefKey(proj.id, step.id);
        const isNext = proj.nextActionId === step.id;
        items.push({
          id: `proj_${proj.id}_${step.id}`,
          refKey,
          spaceId: projSpace,
          title: step.title,
          subtitle: `${isNext ? 'الخطوة التالية · ' : ''}مشروع: ${proj.title}`,
          selectionInput: {
            refKey,
            sourceType: 'project_step',
            projectId: proj.id,
            stepId: step.id,
          },
        });
      }
    }

    return items;
  }, [tasks, projects, enabledSet, today]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return candidates.filter((item) => {
      if (spaceFilter !== 'all' && item.spaceId !== spaceFilter) return false;
      if (quickOnly && (!item.estimatedMinutes || item.estimatedMinutes > 15)) return false;
      if (q && !`${item.title} ${item.subtitle || ''}`.toLocaleLowerCase().includes(q)) return false;
      return true;
    });
  }, [candidates, spaceFilter, quickOnly, query]);

  const handleToggle = async (candidate: PickerCandidate) => {
    if (busyKey) return;
    setBusyKey(candidate.refKey);
    try {
      const selected = isItemSelectedForDay(dayPlan, candidate.refKey);
      const updated = selected
        ? await removeItemFromDayPlan(today, candidate.refKey)
        : await addItemToDayPlan(today, candidate.selectionInput);
      setDayPlan(updated);
      onChanged();
    } finally {
      setBusyKey(null);
    }
  };

  const spaceNames: Record<LifeSpaceId, string> = {
    worship: ar ? 'العبادة' : 'Worship',
    health: ar ? 'الصحة' : 'Health',
    work: ar ? 'العمل' : 'Work',
    home: ar ? 'المنزل' : 'Home',
    plans: ar ? 'الخطط' : 'Plans',
  };

  return (
    <PlanningDialog
      open
      onOpenChange={(open) => {
        if (!open && !busyKey) onClose();
      }}
      title={ar ? 'اختيار مهام وخطوات لليوم من المساحات' : 'Pick tasks & steps across spaces'}
      description={
        ar
          ? 'اختر ما تريد إنجازه اليوم من مهام المساحات الجاهزة أو خطوات المشاريع النشطة دون تغيير تواريخها.'
          : 'Select ready tasks or active project steps for today without changing their due dates.'
      }
    >
      <div className="space-y-4">
        {/* Search & Quick Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <label className="planning-search flex items-center gap-2 flex-1">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              aria-label={ar ? 'ابحث في المساحات' : 'Search across spaces'}
              placeholder={ar ? 'ابحث عن مهمة أو خطوة مشروع...' : 'Find a task or project step…'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent outline-none"
            />
          </label>
          <button
            type="button"
            aria-pressed={quickOnly}
            onClick={() => setQuickOnly((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              quickOnly
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Clock size={13} />
            <span>{ar ? 'سريعة ≤ ١٥ د' : 'Quick ≤ 15m'}</span>
          </button>
        </div>

        {/* Space Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            aria-pressed={spaceFilter === 'all'}
            onClick={() => setSpaceFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              spaceFilter === 'all'
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {ar ? 'كل المساحات' : 'All spaces'} ({candidates.length})
          </button>
          {LIFE_SPACES_CONFIG.filter((s) => enabledSet.has(s.id)).map((space) => {
            const count = candidates.filter((c) => c.spaceId === space.id).length;
            return (
              <button
                key={space.id}
                type="button"
                aria-pressed={spaceFilter === space.id}
                onClick={() => setSpaceFilter(space.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  spaceFilter === space.id
                    ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <span>{space.icon}</span>
                <span>{spaceNames[space.id]}</span>
                <span className="opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Candidate List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="today-muted p-4 text-center">{ar ? 'جاري التحميل...' : 'Loading…'}</p>
          ) : filtered.length === 0 ? (
            <p className="today-muted p-4 text-center">
              {ar ? 'لا توجد عناصر جاهزة مطابقة لهذا الفلتر.' : 'No ready items match this filter.'}
            </p>
          ) : (
            filtered.map((candidate) => {
              const selected = isItemSelectedForDay(dayPlan, candidate.refKey);
              const space = getSpaceTheme(candidate.spaceId);
              return (
                <div
                  key={candidate.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${space.badgeBgClass} ${space.textClass} ${space.badgeBorderClass} flex items-center gap-1`}
                      >
                        <span>{space.icon}</span>
                        <span>{space.label}</span>
                      </span>
                      {candidate.estimatedMinutes && (
                        <span className="text-[10px] text-slate-400">{candidate.estimatedMinutes} د</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white truncate">{candidate.title}</h4>
                    {candidate.subtitle && (
                      <p className="text-xs text-slate-400 truncate">{candidate.subtitle}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={busyKey === candidate.refKey}
                    onClick={() => void handleToggle(candidate)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      selected
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-500/35 text-indigo-200'
                    }`}
                  >
                    {selected ? <Check size={14} /> : <CalendarPlus size={14} />}
                    <span>{selected ? (ar ? 'مختارة لليوم ✓' : 'Selected ✓') : (ar ? '+ أضف ليومي' : '+ Add to day')}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PlanningDialog>
  );
}
