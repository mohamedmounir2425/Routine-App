import { useState } from 'react';
import { Alert, Button, Card, Checkbox, Dropdown, Input, Modal, Select, Tag } from 'antd';
import { Link } from 'react-router-dom';
import type { TrainingPlan, TrainingRule, TrainingRun } from '../../../types/health';
import { useHealthRecords } from '../hooks/useHealthRecords';
import {
  archiveTraining,
  localToday,
  newId,
  occurrencesForDate,
  pauseTraining,
  putHealth,
  routineForSession,
  startTrainingRun,
} from '../data/trainingRepository';
import { useHealthControllerContext } from '../HealthContext';
import { TrainingPlanEditor } from './TrainingPlanEditor';
import { FOUNDATION_LEVELS_PLAN } from '../../../db/seeds/foundationLevels';
import { getLocalDateString, parseLocalDate } from '../../../utils/dateUtils';
import { ExerciseAnimation } from '../player/components/ExerciseAnimation';

const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function nextRunDate(plan: TrainingPlan, run: TrainingRun, from = localToday()) {
  const date = parseLocalDate(from);
  for (let i = 0; i < 370; i++) {
    const key = getLocalDateString(date);
    if (occurrencesForDate(plan, run, key).length) return key;
    date.setDate(date.getDate() + 1);
  }
  return undefined;
}

function ScheduleEditor({
  plan,
  run,
  close,
}: {
  plan: TrainingPlan;
  run?: TrainingRun;
  close: () => void;
}) {
  const [rules, setRules] = useState<TrainingRule[]>(
    () =>
      run?.rules?.length
        ? structuredClone(run.rules)
        : [{ id: newId(), sessionId: plan.sessions[0].id, day: new Date().getDay() }]
  );
  const [start, setStart] = useState(() => run?.startDate ?? localToday());
  const [end, setEnd] = useState(() => run?.endDate ?? '');
  const [restDays, setRestDays] = useState<number[]>(() => run?.restDays ?? []);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (id: string, update: Partial<TrainingRule>) =>
    setRules(rules.map(r => (r.id === id ? { ...r, ...update } : r)));

  const cleanEnd = end.trim() || undefined;
  const preview: TrainingRun = {
    id: 'preview',
    planId: plan.id,
    effectiveFrom: start,
    startDate: start,
    endDate: cleanEnd,
    restDays,
    rules,
    pauses: [],
  };

  let last = '';
  if (cleanEnd && start && cleanEnd >= start) {
    const date = parseLocalDate(cleanEnd);
    for (let i = 0; i < 3700 && getLocalDateString(date) >= start; i++) {
      const key = getLocalDateString(date);
      if (occurrencesForDate(plan, preview, key).length) {
        last = key;
        break;
      }
      date.setDate(date.getDate() - 1);
    }
  }

  return (
    <Modal open title={`جدول الخطة · ${plan.name}`} onCancel={close} footer={null} width={760} maskClosable={false}>
      <form
        className="space-y-5"
        onSubmit={async e => {
          e.preventDefault();
          if (saving) return;
          setError('');
          setDateError('');
          if (cleanEnd && cleanEnd < start) {
            setDateError('تاريخ النهاية لا يمكن أن يسبق تاريخ البداية');
            setError('النهاية تسبق البداية');
            return;
          }
          if (cleanEnd && !last) {
            setDateError('لا توجد أيام مطابقة للمواعيد المختارة ضمن فترة البداية والنهاية');
            setError('لا توجد جلسات ضمن المدة المحددة');
            return;
          }
          setSaving(true);
          try {
            await startTrainingRun(plan, rules, start, cleanEnd, undefined, restDays);
            close();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'تعذر الحفظ');
          } finally {
            setSaving(false);
          }
        }}
      >
        <p className="text-sm opacity-80">
          المواعيد أسبوعية. تقدر تضيف أكثر من جلسة في نفس اليوم. حفظ الجدول يبدأ متابعة جديدة ويحفظ السجل السابق.
        </p>
        {error && <Alert type="error" title={error} showIcon />}

        <div className="space-y-2.5">
          {rules.map(r => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-current/15 p-3">
              <Select
                aria-label="الجلسة"
                className="min-w-40 flex-1"
                value={r.sessionId}
                options={plan.sessions.map(s => ({
                  value: s.id,
                  label: s.name + (s.week ? ` · أسبوع ${s.week}` : ''),
                }))}
                onChange={v => change(r.id, { sessionId: v })}
              />
              <Select
                aria-label="اليوم"
                className="!w-32"
                value={r.day}
                options={days.map((label, value) => ({ value, label }))}
                onChange={v => change(r.id, { day: v })}
              />
              <Input
                type="time"
                aria-label="وقت اختياري"
                className="!w-32"
                value={r.time ?? ''}
                onChange={e => change(r.id, { time: e.target.value || undefined })}
              />
              <Button danger onClick={() => setRules(rules.filter(x => x.id !== r.id))}>
                حذف
              </Button>
              <details className="w-full text-xs">
                <summary className="cursor-pointer opacity-75">أسبوع محدد (اختياري)</summary>
                <Input
                  type="number"
                  aria-label="رقم الأسبوع"
                  className="mt-1 !w-36"
                  min={1}
                  max={520}
                  value={r.week ?? ''}
                  onChange={e => change(r.id, { week: e.target.value ? Number(e.target.value) : undefined })}
                />
              </details>
            </div>
          ))}
        </div>

        <Button onClick={() => setRules([...rules, { id: newId(), sessionId: plan.sessions[0].id, day: 0 }])}>
          ＋ موعد آخر
        </Button>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">تاريخ البداية</span>
            <Input
              required
              type="date"
              value={start}
              onChange={e => {
                setStart(e.target.value);
                setDateError('');
              }}
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">النهاية (اختياري للمدة المحددة)</span>
            <Input
              type="date"
              min={start}
              status={dateError ? 'error' : undefined}
              value={end}
              onChange={e => {
                setEnd(e.target.value);
                setDateError('');
              }}
            />
          </label>
        </div>
        {dateError && <p className="text-xs text-red-500">{dateError}</p>}

        <details className="rounded-xl border border-current/10 p-3">
          <summary className="cursor-pointer text-sm font-medium">أيام راحة مخططة (اختياري)</summary>
          <div className="mt-2">
            <Checkbox.Group
              value={restDays}
              options={days.map((label, value) => ({ value, label }))}
              onChange={values => setRestDays(values as number[])}
            />
          </div>
        </details>

        <div className="rounded-xl bg-current/5 p-3 text-sm" role="status">
          أول جلسة: <strong>{nextRunDate(plan, preview, start) ?? 'لا توجد جلسات'}</strong>
          {cleanEnd && (
            <>
              {' '}
              · نهاية الخطة: <strong>{cleanEnd}</strong> · آخر جلسة:{' '}
              <strong>{last || 'لا توجد جلسات'}</strong>
            </>
          )}
        </div>

        <Button type="primary" size="large" htmlType="submit" block loading={saving} disabled={!rules.length}>
          حفظ وبدء المتابعة
        </Button>
      </form>
    </Modal>
  );
}

export function TrainingPlansPage() {
  const { rows, loading, error } = useHealthRecords();
  const health = useHealthControllerContext();
  const [editor, setEditor] = useState<TrainingPlan | 'new' | null>(null);
  const [opened, setOpened] = useState<string>();
  const [schedule, setSchedule] = useState<TrainingPlan>();
  const [archived, setArchived] = useState(false);
  const [actionError, setActionError] = useState('');

  const plans = rows('plan');
  const runs = rows('run');
  const executions = rows('execution');

  const perform = async (f: () => Promise<unknown>) => {
    setActionError('');
    try {
      await f();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'تعذر حفظ التغيير');
    }
  };

  const duplicatePlan = (plan: TrainingPlan) =>
    perform(async () => {
      const copy: TrainingPlan = {
        ...structuredClone(plan),
        id: newId(),
        name: `${plan.name} — نسخة`,
        template: false,
        archived: false,
        updatedAt: new Date().toISOString(),
      };
      await putHealth('plan', copy);
    });

  const toggleArchivePlan = (plan: TrainingPlan) => {
    if (
      window.confirm(
        plan.archived
          ? 'إعادة الخطة إلى خططك النشطة؟'
          : 'أرشفة الخطة وإيقاف استحقاقاتها الجديدة مع حفظ السجل السابق؟'
      )
    ) {
      void perform(() => archiveTraining(plan));
    }
  };

  const selected = plans.find(p => p.id === opened);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">خططي</h1>
          <p className="mt-1 text-sm opacity-70">ابدأ بالاسم والتمارين، وأضف جدول المواعيد وقت ما تحب.</p>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox checked={archived} onChange={e => setArchived(e.target.checked)}>
            عرض المؤرشفة
          </Checkbox>
          <Button type="primary" size="large" onClick={() => setEditor('new')}>
            ＋ خطة جديدة
          </Button>
        </div>
      </div>

      {(error || actionError) && <Alert type="error" title={error || actionError} showIcon />}

      {loading ? (
        <p role="status">جارٍ تحميل الخطط…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans
            .filter(p => p.archived === archived)
            .map(p => {
              const run = runs.find(r => r.planId === p.id && !r.endedOn);
              const paused = run?.pauses.some(pause => !pause.until);
              const nextDate = run && !paused ? nextRunDate(p, run) : undefined;
              const totalExercises = p.sessions.reduce((n, s) => n + s.items.length, 0);

              return (
                <Card
                  key={p.id}
                  title={
                    <div className="flex items-center justify-between gap-2">
                      <span className="whitespace-normal font-bold">{p.name}</span>
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          items: [
                            {
                              key: 'open',
                              label: 'تفاصيل الخطة والسجل',
                              onClick: () => setOpened(p.id),
                            },
                            {
                              key: 'edit',
                              label: 'تعديل التمارين',
                              onClick: () => setEditor(p),
                            },
                            ...(!p.archived
                              ? [
                                  {
                                    key: 'schedule',
                                    label: run ? 'تعديل الجدول / المدة' : 'جدولة الخطة',
                                    onClick: () => setSchedule(p),
                                  },
                                ]
                              : []),
                            ...(run && !p.archived
                              ? [
                                  {
                                    key: 'pause',
                                    label: paused ? 'استئناف المتابعة' : 'إيقاف مؤقت',
                                    onClick: () => void perform(() => pauseTraining(run)),
                                  },
                                ]
                              : []),
                            {
                              key: 'copy',
                              label: 'نسخ الخطة',
                              onClick: () => void duplicatePlan(p),
                            },
                            {
                              key: 'archive',
                              danger: !p.archived,
                              label: p.archived ? 'إعادة الخطة' : 'أرشفة الخطة',
                              onClick: () => toggleArchivePlan(p),
                            },
                          ],
                        }}
                      >
                        <Button size="small" aria-label={`المزيد من خيارات ${p.name}`}>
                          المزيد ▾
                        </Button>
                      </Dropdown>
                    </div>
                  }
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      <span>
                        {p.sessions.length} جلسة · {totalExercises} تمرين
                      </span>
                      {p.needsReview && <Tag color="orange">تحتاج مراجعة المحتوى</Tag>}
                      {p.template && <Tag>قالب اختياري</Tag>}
                    </div>

                    <div className="rounded-lg bg-current/5 px-3 py-2 text-xs">
                      {run ? (
                        paused ? (
                          <span className="font-medium text-amber-500">المتابعة متوقفة مؤقتًا</span>
                        ) : (
                          <span>
                            {run.rules.length} موعد أسبوعي · التالي:{' '}
                            <strong>{nextDate ?? 'لا توجد جلسة قادمة'}</strong>
                            {run.endDate ? ` · حتى ${run.endDate}` : ''}
                          </span>
                        )
                      ) : (
                        <span className="opacity-75">بدون جدول؛ جاهزة للتشغيل في أي وقت</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {p.sessions.length === 1 && !p.archived && (
                        <Button
                          type="primary"
                          onClick={() => void health.startRoutinePlayback(routineForSession(p, p.sessions[0]))}
                        >
                          ابدأ
                        </Button>
                      )}
                      <Button onClick={() => setOpened(p.id)}>فتح الخطة</Button>
                      {!p.archived && !run && (
                        <Button type="text" onClick={() => setSchedule(p)}>
                          جدولة
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {!loading && !plans.filter(p => p.archived === archived).length && (
        <Card>
          <p className="text-center py-4 opacity-75">
            {archived ? 'لا توجد خطط مؤرشفة.' : 'أضف أول خطة بتمارينك المفضلة للبدء.'}
          </p>
        </Card>
      )}

      <details className="rounded-xl border border-current/15 p-4">
        <summary className="cursor-pointer font-medium">المستويات المحفوظة سابقًا (مرجع البرنامج المتدرج)</summary>
        <div className="space-y-3 pt-4">
          {FOUNDATION_LEVELS_PLAN.map(l => (
            <details key={l.levelNumber} className="rounded-lg border border-current/10 p-3">
              <summary className="cursor-pointer font-semibold">{l.title}</summary>
              <p className="mt-1 text-sm opacity-80">{l.goal}</p>
              <div className="mt-2 space-y-2">
                {l.sections.map((s, i) => (
                  <div key={i} className="rounded bg-current/5 p-2.5 text-sm">
                    <h3 className="font-bold">{s.title}</h3>
                    {s.exercises.map((e, j) => (
                      <p key={j} className="opacity-85">
                        {e.arabicName} · {e.sets} مجموعة ·{' '}
                        {e.reps ? `${e.reps} تكرار` : `${e.durationSeconds ?? e.holdSeconds ?? 0} ثانية`}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </details>

      <div className="flex items-center justify-between pt-2">
        <Link className="inline-block py-2 text-sm font-medium underline" to="/health/progress">
          السجل والمتابعة التاريخية
        </Link>
      </div>

      {editor && <TrainingPlanEditor initial={editor === 'new' ? undefined : editor} close={() => setEditor(null)} />}

      {schedule && (
        <ScheduleEditor
          plan={schedule}
          run={runs.find(r => r.planId === schedule.id && !r.endedOn)}
          close={() => setSchedule(undefined)}
        />
      )}

      <Modal open={!!selected} title={selected?.name} onCancel={() => setOpened(undefined)} footer={null} width={760}>
        {selected && (
          <div className="space-y-5">
            {selected.description && <p className="text-sm opacity-85">{selected.description}</p>}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setOpened(undefined);
                  setEditor(selected);
                }}
              >
                تعديل
              </Button>
              {!selected.archived && (
                <Button
                  onClick={() => {
                    setOpened(undefined);
                    setSchedule(selected);
                  }}
                >
                  ضبط الجدول / بدء متابعة جديدة
                </Button>
              )}
              <Button onClick={() => void duplicatePlan(selected)}>نسخ</Button>
              <Button onClick={() => toggleArchivePlan(selected)}>
                {selected.archived ? 'إعادة الخطة' : 'أرشفة'}
              </Button>
            </div>

            <div className="space-y-3">
              {selected.sessions.map(s => (
                <div
                  key={s.id}
                  className="space-y-3 rounded-xl border border-current/15 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">{s.name}</h3>
                      <p className="text-xs opacity-75">
                        {s.items.length} تمرين{s.week ? ` · أسبوع ${s.week}` : ''}
                      </p>
                    </div>
                    <Button
                      type="primary"
                      disabled={selected.archived}
                      onClick={() => {
                        setOpened(undefined);
                        void health.startRoutinePlayback(routineForSession(selected, s));
                      }}
                    >
                      ابدأ الجلسة
                    </Button>
                  </div>

                  {s.items.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {s.items.map((item, idx) => {
                        const ex = health.exercises.find(e => e.id === item.exerciseId);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2.5 rounded-lg bg-current/5 px-2.5 py-1.5 text-xs"
                          >
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-current/5">
                              <ExerciseAnimation slug={ex?.animationSlug} thumbnail />
                            </div>
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-semibold">
                                {idx + 1}. {ex?.arabicName ?? 'تمرين'}
                              </span>
                              <span className="block opacity-70">
                                {item.sets}×{' '}
                                {item.reps
                                  ? `${item.reps} تكرار`
                                  : `${item.durationSeconds ?? item.holdSeconds ?? 45}ث`}
                                {item.sides === 'each' ? ' (لكل جانب)' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {runs
              .filter(r => r.planId === selected.id && !r.endedOn)
              .map(run => {
                const paused = run.pauses.some(p => !p.until);
                return (
                  <div className="space-y-3 rounded-xl border border-current/15 p-4" key={run.id}>
                    {run.migrationReview && (
                      <Alert
                        type="warning"
                        title={run.migrationReview}
                        action={
                          <Button
                            size="small"
                            onClick={() => void perform(() => putHealth('run', { ...run, endedOn: localToday() }))}
                          >
                            إيقاف هذا الموعد
                          </Button>
                        }
                      />
                    )}
                    <p className="font-medium">
                      {run.rules.map(r => `${days[r.day]} ${r.time ?? 'بدون وقت'}`).join(' · ')}
                    </p>
                    <p className="text-sm opacity-80">
                      البداية: {run.startDate ?? 'غير معروفة؛ محتفظون بالأسبوع السابق'} · النهاية:{' '}
                      {run.endDate ?? 'مستمر'}
                    </p>
                    <p className="text-sm">
                      {paused
                        ? 'متوقفة؛ الاستئناف يبدأ من اليوم دون تعويض الفترة السابقة'
                        : `الجلسة القادمة: ${nextRunDate(selected, run) ?? 'لا توجد جلسة قادمة'}`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => void perform(() => pauseTraining(run))}>
                        {paused ? 'استئناف' : 'إيقاف المتابعة مؤقتًا'}
                      </Button>
                      <Button
                        onClick={() => {
                          setOpened(undefined);
                          setSchedule(selected);
                        }}
                      >
                        تعديل الجدول
                      </Button>
                    </div>
                  </div>
                );
              })}

            <details className="rounded-xl border border-current/10 p-3">
              <summary className="cursor-pointer font-medium">سجل تنفيذ هذه الخطة</summary>
              <div className="mt-2 divide-y divide-current/10 text-sm">
                {executions
                  .filter(l => l.trainingPlanId === selected.id)
                  .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
                  .map(l => (
                    <p className="py-2" key={l.id}>
                      {new Date(l.completedAt).toLocaleString()} · {l.routineName} · {l.exercisesCompleted}/
                      {l.totalExercises}
                      {l.occurrenceId ? ' · موعد مسجل' : ' · تنفيذ إضافي'}
                    </p>
                  ))}
              </div>
            </details>
          </div>
        )}
      </Modal>
    </div>
  );
}
