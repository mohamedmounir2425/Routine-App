import { useEffect, useState } from 'react';
import { Alert, Button, Card, Input, Modal, Tag } from 'antd';
import { Link } from 'react-router-dom';
import { liveQuery } from 'dexie';
import type { WorkoutOccurrence } from '../../../types/health';
import { useHealthRecords } from '../hooks/useHealthRecords';
import {
  adherence,
  changeOccurrence,
  getWorkoutOccurrences,
  isWorkoutAvailable,
  localToday,
  routineForSession,
} from '../data/trainingRepository';
import { useHealthControllerContext } from '../HealthContext';
import { NutritionCard } from '../nutrition/NutritionSummaryCard';
import { getLocalDateString, parseLocalDate } from '../../../utils/dateUtils';
import { readSavedWorkoutSession } from '../player/usePlayerLogic';
import { ExerciseAnimation } from '../player/components/ExerciseAnimation';

export function HealthToday() {
  const { rows, date, error } = useHealthRecords();
  const health = useHealthControllerContext();
  const [occurrences, setOccurrences] = useState<WorkoutOccurrence[]>([]);
  const [week, setWeek] = useState<WorkoutOccurrence[]>([]);
  const [action, setAction] = useState<{ occurrence: WorkoutOccurrence; type: 'defer' | 'skip' }>();
  const [actionError, setActionError] = useState('');
  const [target, setTarget] = useState(localToday);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sub = liveQuery(async () => {
      const current = await getWorkoutOccurrences(date);
      const all: WorkoutOccurrence[] = [];
      for (let i = 0; i < 7; i++) {
        const d = parseLocalDate(date);
        d.setDate(d.getDate() - i);
        all.push(...(await getWorkoutOccurrences(getLocalDateString(d))));
      }
      return { current, all };
    }).subscribe({
      next: ({ current, all }) => {
        setOccurrences(current);
        setWeek(all);
      },
      error: () => setActionError('تعذر تحميل جلسات اليوم'),
    });
    return () => sub.unsubscribe();
  }, [date]);

  const plans = rows('plan');
  const stats = adherence(week);
  const isRest =
    !occurrences.length &&
    rows('run').some(r => {
      const p = plans.find(p => p.id === r.planId);
      return (
        p &&
        !p.archived &&
        !r.endedOn &&
        !r.pauses.some(p => !p.until) &&
        r.restDays?.includes(parseLocalDate(date).getDay()) &&
        (r.startDate ?? r.effectiveFrom) <= date &&
        (!r.endDate || r.endDate >= date)
      );
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">صحتي اليوم</h1>
          <p className="mt-1 text-sm opacity-70">
            {parseLocalDate(date).toLocaleDateString('ar', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <Link className="py-2 underline" to="/health/tasks">
            مهام الصحة
          </Link>
          <Link className="py-2 underline" to="/health/progress">
            السجل والمتابعة
          </Link>
        </div>
      </div>

      {(error || actionError) && <Alert title={error || actionError} type="error" showIcon />}

      {/* 1. Today's Sessions & Start / Resume First */}
      {!occurrences.length ? (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">
                {isRest ? 'يوم راحة مخطط له 🌿' : 'لا توجد جلسات مجدولة اليوم'}
              </h2>
              <p className="text-sm opacity-75">
                {isRest
                  ? 'استمتع بيوم الراحة؛ أيام الراحة لا تؤثر على نسبة الالتزام.'
                  : 'تقدر تبدأ أي جلسة محفوظة في خططك وقت ما تحب.'}
              </p>
            </div>
            <Link className="inline-block font-medium underline" to="/health/plans">
              افتح خططي أو ابدأ جلسة بدون جدول
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {occurrences.map(o => {
            const plan = plans.find(p => p.id === o.planId);
            const session = plan?.sessions.find(s => s.id === o.sessionId);
            if (!plan || !session) {
              return (
                <Alert
                  key={o.id}
                  type="warning"
                  title="جلسة تشير إلى خطة غير متاحة؛ راجع خططك."
                />
              );
            }
            const routine = routineForSession(plan, session, o);
            const actionable = isWorkoutAvailable(
              o,
              rows('run').find(r => r.id === o.runId),
              plan
            );
            const savedResume = actionable ? readSavedWorkoutSession(routine) : null;
            const firstEx = health.exercises.find(e => e.id === session.items[0]?.exerciseId);

            return (
              <Card
                key={o.id}
                title={
                  <div className="flex items-center justify-between gap-2">
                    <span className="whitespace-normal font-bold">{plan.name}</span>
                    <Tag
                      color={
                        o.status === 'completed'
                          ? 'green'
                          : o.status === 'skipped'
                            ? 'default'
                            : savedResume
                              ? 'gold'
                              : 'blue'
                      }
                    >
                      {savedResume
                        ? 'قيد الاستكمال'
                        : {
                            pending: 'غير مسجلة',
                            completed: 'مكتملة',
                            partial: 'جزئية',
                            skipped: 'متخطاة',
                          }[o.status]}
                      {o.deferred ? ' · مؤجلة' : ''}
                    </Tag>
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-current/5">
                      <ExerciseAnimation slug={firstEx?.animationSlug} thumbnail />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{session.name}</p>
                      <p className="text-xs opacity-75">
                        {o.time ?? 'بدون وقت محدد'} · {session.items.length} تمارين · نحو{' '}
                        {routine.totalEstimatedMinutes} دقيقة
                      </p>
                    </div>
                  </div>

                  {o.reason && <p className="text-xs opacity-80">السبب: {o.reason}</p>}

                  {actionable && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        size="large"
                        type="primary"
                        onClick={() => void health.startRoutinePlayback(routine)}
                      >
                        {savedResume ? 'استكمال الجلسة ▶' : 'ابدأ'}
                      </Button>
                      <Button
                        onClick={() => {
                          setAction({ occurrence: o, type: 'defer' });
                          setTarget(date);
                          setReason('');
                        }}
                      >
                        تأجيل
                      </Button>
                      <Button
                        onClick={() => {
                          setAction({ occurrence: o, type: 'skip' });
                          setReason('');
                        }}
                      >
                        تخطي
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 2. Nutrition Summary Second */}
      <NutritionCard />

      {/* 3. Simple 7-Day Summary Third */}
      <details className="rounded-xl border border-current/15 p-4">
        <summary className="cursor-pointer py-1 font-bold">
          متابعة آخر ٧ أيام · {stats.completed} من {stats.planned} جلسات
          {stats.planned > 0 ? ` (${Math.round((stats.completed / stats.planned) * 100)}٪)` : ''}
        </summary>
        <p className="pt-3 text-sm opacity-80">
          الالتزام = الجلسات المكتملة ÷ الجلسات المقررة في الفترة. الجزئي: {stats.partial} · المتخطى:{' '}
          {stats.skipped}. أيام الراحة لا تدخل الحساب.
        </p>
        {stats.planned > 0 && (
          <p className="mt-1 text-base font-bold text-emerald-500">
            {Math.round((stats.completed / stats.planned) * 100)}٪
          </p>
        )}
      </details>

      <Modal
        open={!!action}
        title={action?.type === 'defer' ? 'تأجيل الجلسة' : 'تخطي الجلسة'}
        onCancel={() => setAction(undefined)}
        footer={null}
      >
        <form
          className="space-y-4"
          onSubmit={async e => {
            e.preventDefault();
            if (!action || busy) return;
            setBusy(true);
            setActionError('');
            try {
              await changeOccurrence(action.occurrence, {
                date: action.type === 'defer' ? target : undefined,
                skip: action.type === 'skip',
                reason: reason.trim() || undefined,
              });
              setAction(undefined);
            } catch (e) {
              setActionError(e instanceof Error ? e.message : 'تعذر الحفظ');
            } finally {
              setBusy(false);
            }
          }}
        >
          {action?.type === 'defer' && (
            <label className="block space-y-1">
              <span className="text-sm font-medium">التاريخ الجديد</span>
              <Input
                required
                type="date"
                min={date}
                value={target}
                onChange={e => setTarget(e.target.value)}
              />
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-sm font-medium">سبب اختياري</span>
            <Input.TextArea value={reason} onChange={e => setReason(e.target.value)} />
          </label>
          <p className="text-xs opacity-75">باقي الجدول يظل في مواعيده. التخطي لا يُحسب إنجازًا.</p>
          <Button block type="primary" htmlType="submit" loading={busy}>
            حفظ
          </Button>
        </form>
      </Modal>
    </div>
  );
}
