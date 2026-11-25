import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Collapse, Input, InputNumber, Modal, Radio, Select, Tag } from 'antd';
import type { SessionExercise, TrainingPlan, TrainingSession } from '../../../types/health';
import type { Exercise, MuscleCategory } from '../../../types';
import { workspaceStorage } from '../../../db/workspaceScope';
import { newId, putHealth } from '../data/trainingRepository';
import { useHealthControllerContext } from '../HealthContext';
import { ExerciseAnimation } from '../player/components/ExerciseAnimation';

const DRAFT_PREFIX = 'health_training_plan_draft_';

function readPlanDraft(key: string): TrainingPlan | null {
  try {
    const parsed = JSON.parse(workspaceStorage.getItem(key) ?? 'null');
    return parsed?.id && Array.isArray(parsed?.sessions) && typeof parsed.name === 'string'
      ? (parsed as TrainingPlan)
      : null;
  } catch {
    return null;
  }
}

export function TrainingPlanEditor({ initial, close }: { initial?: TrainingPlan; close: () => void }) {
  const health = useHealthControllerContext();
  const draftKey = `${DRAFT_PREFIX}${initial?.id ?? 'new'}`;

  const [plan, setPlan] = useState<TrainingPlan>(() => {
    const saved = readPlanDraft(draftKey);
    if (saved) return saved;
    return initial
      ? structuredClone(initial)
      : {
          id: newId(),
          name: '',
          description: '',
          sessions: [{ id: newId(), name: 'جلستي', items: [] }],
          painTracking: false,
          archived: false,
          updatedAt: new Date().toISOString(),
        };
  });

  const [sessionId, setSessionId] = useState(plan.sessions[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState(false);

  // Quick / Full inline new exercise creation without leaving the plan editor
  const [showNewExForm, setShowNewExForm] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<MuscleCategory>('mobility');
  const [newExMode, setNewExMode] = useState<'time' | 'reps'>('time');
  const [newExValue, setNewExValue] = useState<number>(45);
  const [newExRest, setNewExRest] = useState<number>(15);
  const [newExError, setNewExError] = useState('');
  const [addingExercise, setAddingExercise] = useState(false);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; sessions?: string }>({});
  const [saving, setSaving] = useState(false);

  const current = plan.sessions.find(s => s.id === sessionId) ?? plan.sessions[0];

  useEffect(() => {
    workspaceStorage.setItem(draftKey, JSON.stringify(plan));
  }, [plan, draftKey]);

  const updateSession = (update: Partial<TrainingSession>) =>
    setPlan(p => ({
      ...p,
      sessions: p.sessions.map(s => (s.id === current.id ? { ...s, ...update } : s)),
    }));

  const changeItem = (id: string, update: Partial<SessionExercise>) =>
    updateSession({
      items: current.items.map(i => (i.id === id ? { ...i, ...update } : i)),
    });

  const add = (e: Exercise) => {
    setFieldErrors(prev => ({ ...prev, sessions: undefined }));
    updateSession({
      items: [
        ...current.items,
        {
          id: newId(),
          exerciseId: e.id,
          sets: 1,
          durationSeconds: e.reps ? undefined : e.durationSeconds,
          reps: e.reps,
          restSeconds: e.restAfterSeconds ?? 15,
        },
      ],
    });
  };

  const [original] = useState(() =>
    JSON.stringify(
      initial ?? {
        id: plan.id,
        name: '',
        description: '',
        sessions: [{ id: plan.sessions[0]?.id, name: 'جلستي', items: [] }],
        painTracking: false,
        archived: false,
        updatedAt: plan.updatedAt,
      }
    )
  );
  const dirty = JSON.stringify(plan) !== original;

  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', leave);
    return () => window.removeEventListener('beforeunload', leave);
  }, [dirty]);

  const cancel = () => {
    if (!dirty || window.confirm('تجاهل التعديلات غير المحفوظة؟')) {
      workspaceStorage.removeItem(draftKey);
      close();
    }
  };

  const handleCreateAndAddExercise = async () => {
    if (addingExercise) return;
    const trimmed = newExName.trim();
    if (!trimmed) {
      setNewExError('أدخل اسم التمرين أولًا');
      return;
    }
    setAddingExercise(true);
    setNewExError('');
    try {
      const created = await health.handleAddExercise({
        name: trimmed,
        arabicName: trimmed,
        category: newExCategory,
        durationSeconds: newExMode === 'time' ? Math.max(1, newExValue) : 45,
        reps: newExMode === 'reps' ? Math.max(1, newExValue) : undefined,
        restAfterSeconds: Math.max(0, newExRest),
        description: '',
        instructions: [],
        targetMuscles: [],
      });
      add(created);
      setNewExName('');
      setShowNewExForm(false);
    } catch (e) {
      setNewExError(e instanceof Error ? e.message : 'تعذر إضافة التمرين');
    } finally {
      setAddingExercise(false);
    }
  };

  return (
    <Modal
      open
      title={initial ? 'تعديل الخطة' : 'خطة جديدة'}
      width={850}
      onCancel={cancel}
      footer={null}
      maskClosable={false}
    >
      <form
        className="space-y-5"
        onSubmit={async e => {
          e.preventDefault();
          if (saving) return;
          const nextFieldErrors: { name?: string; sessions?: string } = {};
          if (!plan.name.trim()) nextFieldErrors.name = 'أدخل اسم الخطة التدريبية';
          if (plan.sessions.some(s => !s.items.length)) {
            nextFieldErrors.sessions = 'أضف تمرينًا واحدًا على الأقل لكل جلسة في الخطة';
          }
          setFieldErrors(nextFieldErrors);
          if (nextFieldErrors.name || nextFieldErrors.sessions) {
            setError(nextFieldErrors.name ?? nextFieldErrors.sessions ?? '');
            return;
          }
          setSaving(true);
          setError('');
          try {
            await putHealth('plan', {
              ...plan,
              needsReview: false,
              name: plan.name.trim(),
              sessions: plan.sessions.map(s => ({
                ...s,
                name: s.name.trim() || 'جلسة',
              })),
              updatedAt: new Date().toISOString(),
            });
            workspaceStorage.removeItem(draftKey);
            close();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'تعذر الحفظ');
          } finally {
            setSaving(false);
          }
        }}
      >
        {error && <Alert type="error" title={error} showIcon />}

        <label className="block space-y-1.5">
          <span className="font-bold">اسم الخطة</span>
          <Input
            required
            size="large"
            autoFocus
            status={fieldErrors.name ? 'error' : undefined}
            value={plan.name}
            onChange={e => {
              setPlan({ ...plan, name: e.target.value });
              if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="مثال: درع الظهر والجذع"
          />
          {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        </label>

        {plan.sessions.length > 1 && (
          <div className="space-y-1.5">
            <span className="text-sm font-medium">الجلسة الحالية</span>
            <Select
              aria-label="الجلسة"
              className="w-full"
              value={current.id}
              onChange={setSessionId}
              options={plan.sessions.map(s => ({
                value: s.id,
                label: `${s.name || 'جلسة'}${s.week ? ` · أسبوع ${s.week}` : ''} (${s.items.length} تمرين)`,
              }))}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="اسم الجلسة"
            className="!w-56"
            value={current.name}
            placeholder="اسم الجلسة"
            onChange={e => updateSession({ name: e.target.value })}
          />
          <Button
            onClick={() => {
              const s = { id: newId(), name: `جلسة ${plan.sessions.length + 1}`, items: [] };
              setPlan({ ...plan, sessions: [...plan.sessions, s] });
              setSessionId(s.id);
            }}
          >
            ＋ إضافة جلسة أخرى
          </Button>
          {plan.sessions.length > 1 && (
            <Button
              danger
              onClick={() => {
                if (window.confirm('حذف هذه الجلسة من الخطة؟')) {
                  const remaining = plan.sessions.filter(s => s.id !== current.id);
                  setPlan({ ...plan, sessions: remaining });
                  setSessionId(remaining[0].id);
                }
              }}
            >
              حذف الجلسة
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">تمارين الجلسة · {current.items.length}</h3>
            {fieldErrors.sessions && <span className="text-xs text-red-500">{fieldErrors.sessions}</span>}
          </div>

          {current.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-current/20 p-4 text-center text-sm opacity-75">
              لم تضف تمارين لهذه الجلسة بعد. اختر من المكتبة بالأسفل أو أضف تمرينًا جديدًا.
            </div>
          )}

          {current.items.map((item, index) => {
            const exercise = health.exercises.find(e => e.id === item.exerciseId);
            const isReps = item.reps !== undefined && item.reps > 0;
            const valueNum = isReps ? item.reps : (item.durationSeconds ?? item.holdSeconds ?? 60);
            const restNum = item.restSeconds ?? 15;

            return (
              <div key={item.id} className="space-y-3 rounded-xl border border-current/15 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-current/5">
                      <ExerciseAnimation slug={exercise?.animationSlug} thumbnail />
                    </div>
                    <div>
                      <strong className="block">
                        {index + 1}. {exercise?.arabicName ?? 'تمرين مفقود؛ احذفه أو استبدله'}
                      </strong>
                      <span className="text-xs opacity-70">
                        {item.sets} مجموعة · {isReps ? `${valueNum} تكرار` : `${valueNum} ثانية`}
                        {item.sides === 'each' ? ' (لكل جانب)' : ''} · راحة {restNum}ث
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="small"
                      aria-label="تحريك لأعلى"
                      disabled={index === 0}
                      onClick={() => {
                        const items = [...current.items];
                        [items[index - 1], items[index]] = [items[index], items[index - 1]];
                        updateSession({ items });
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      size="small"
                      aria-label="تحريك لأسفل"
                      disabled={index === current.items.length - 1}
                      onClick={() => {
                        const items = [...current.items];
                        [items[index + 1], items[index]] = [items[index], items[index + 1]];
                        updateSession({ items });
                      }}
                    >
                      ↓
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => updateSession({ items: current.items.filter(i => i.id !== item.id) })}
                    >
                      إزالة
                    </Button>
                  </div>
                </div>

                <details>
                  <summary className="cursor-pointer py-1 text-sm font-medium opacity-80">
                    الإعدادات · {item.sets} مجموعة · {isReps ? `${valueNum} تكرار` : `${valueNum} ثانية`} · راحة {restNum}ث
                  </summary>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <label className="text-xs">
                      المجموعات
                      <InputNumber
                        className="!w-full mt-1"
                        min={1}
                        max={100}
                        value={item.sets}
                        onChange={n => changeItem(item.id, { sets: Math.max(1, Math.round(n ?? 1)) })}
                      />
                    </label>
                    <label className="text-xs">
                      طريقة التنفيذ
                      <Select
                        className="w-full mt-1"
                        value={isReps ? 'reps' : 'time'}
                        onChange={v =>
                          changeItem(
                            item.id,
                            v === 'reps'
                              ? { reps: 10, durationSeconds: undefined, holdSeconds: undefined }
                              : { reps: undefined, durationSeconds: 45, holdSeconds: undefined }
                          )
                        }
                        options={[
                          { value: 'time', label: 'مدة (ثواني)' },
                          { value: 'reps', label: 'تكرارات' },
                        ]}
                      />
                    </label>
                    <label className="text-xs">
                      {isReps ? 'التكرارات' : 'ثواني'}
                      <InputNumber
                        className="!w-full mt-1"
                        min={1}
                        max={3600}
                        value={valueNum}
                        onChange={n =>
                          changeItem(
                            item.id,
                            isReps
                              ? { reps: Math.max(1, Math.round(n ?? 10)), durationSeconds: undefined, holdSeconds: undefined }
                              : { durationSeconds: Math.max(1, Math.round(n ?? 45)), reps: undefined, holdSeconds: undefined }
                          )
                        }
                      />
                    </label>
                    <label className="text-xs">
                      راحة بالثواني
                      <InputNumber
                        className="!w-full mt-1"
                        min={0}
                        max={600}
                        value={restNum}
                        onChange={n => changeItem(item.id, { restSeconds: Math.max(0, Math.round(n ?? 0)) })}
                      />
                    </label>
                    <label className="text-xs">
                      الجانبان
                      <Select
                        className="w-full mt-1"
                        value={item.sides === 'each' ? 'each' : 'both'}
                        onChange={v => changeItem(item.id, { sides: v === 'each' ? 'each' : undefined })}
                        options={[
                          { value: 'both', label: 'حركة واحدة' },
                          { value: 'each', label: 'يمين ثم يسار' },
                        ]}
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs">
                    ملاحظات خاصة بهذا التمرين في الجلسة
                    <Input
                      className="mt-1"
                      value={item.notes ?? ''}
                      placeholder="مثال: تنفس بهدوء عند الثبات"
                      onChange={e => changeItem(item.id, { notes: e.target.value })}
                    />
                  </label>
                </details>
              </div>
            );
          })}
        </div>

        <section className="space-y-3 rounded-xl bg-current/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">اختيار التمارين</h3>
            <Checkbox checked={favorites} onChange={e => setFavorites(e.target.checked)}>
              المفضلة فقط
            </Checkbox>
          </div>

          <Input.Search
            aria-label="بحث التمارين"
            placeholder="ابحث عن تمرين بالاسم..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
            {health.exercises
              .filter(
                e =>
                  (!favorites || e.isFavorite) &&
                  `${e.name} ${e.arabicName}`.toLowerCase().includes(search.toLowerCase())
              )
              .map(e => {
                const count = current.items.filter(i => i.exerciseId === e.id).length;
                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-current/10 px-3 py-2"
                    key={e.id}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-current/5">
                        <ExerciseAnimation slug={e.animationSlug} thumbnail />
                      </div>
                      <div className="truncate">
                        <span className="font-medium">{e.arabicName || e.name}</span>
                        <span className="mr-2 text-xs opacity-70">
                          {e.reps ? `${e.reps} تكرار` : `${e.durationSeconds}ث`}
                        </span>
                        {count > 0 && (
                          <Tag color="green" className="!mr-2 !text-xs">
                            مختار ({count})
                          </Tag>
                        )}
                      </div>
                    </div>
                    <Button size="small" onClick={() => add(e)}>
                      ＋ إضافة
                    </Button>
                  </div>
                );
              })}
          </div>

          <div className="border-t border-current/10 pt-3">
            <div className="flex flex-wrap gap-2">
              <Input
                aria-label="اسم تمرين جديد"
                className="flex-1 min-w-48"
                placeholder="تمرين جديد بالاسم..."
                value={newExName}
                onChange={e => {
                  setNewExName(e.target.value);
                  if (newExError) setNewExError('');
                }}
              />
              <Button
                disabled={!newExName.trim() || addingExercise}
                loading={addingExercise}
                onClick={() => void handleCreateAndAddExercise()}
              >
                حفظ وإضافة
              </Button>
              <Button type="text" onClick={() => setShowNewExForm(v => !v)}>
                {showNewExForm ? 'إخفاء الإعدادات' : 'إعدادات التمرين الجديد'}
              </Button>
            </div>
            {newExError && <p className="mt-1 text-xs text-red-500">{newExError}</p>}

            {showNewExForm && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-current/15 p-3 sm:grid-cols-4">
                <label className="text-xs">
                  الفئة
                  <Select
                    className="w-full mt-1"
                    value={newExCategory}
                    onChange={setNewExCategory}
                    options={[
                      { value: 'mobility', label: 'مرونة وإطالة' },
                      { value: 'core', label: 'جذع وبطن' },
                      { value: 'back', label: 'ظهر' },
                      { value: 'neck', label: 'رقبة' },
                      { value: 'legs', label: 'أرجل' },
                    ]}
                  />
                </label>
                <label className="text-xs">
                  النوع
                  <Radio.Group
                    className="mt-1 block"
                    value={newExMode}
                    onChange={e => setNewExMode(e.target.value)}
                    options={[
                      { value: 'time', label: 'ثواني' },
                      { value: 'reps', label: 'تكرار' },
                    ]}
                    optionType="button"
                    size="small"
                  />
                </label>
                <label className="text-xs">
                  {newExMode === 'reps' ? 'عدد التكرارات' : 'المدة (ثانية)'}
                  <InputNumber
                    className="!w-full mt-1"
                    min={1}
                    max={3600}
                    value={newExValue}
                    onChange={n => setNewExValue(n ?? 30)}
                  />
                </label>
                <label className="text-xs">
                  الراحة بعده (ثانية)
                  <InputNumber
                    className="!w-full mt-1"
                    min={0}
                    max={600}
                    value={newExRest}
                    onChange={n => setNewExRest(n ?? 0)}
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        <Collapse
          items={[
            {
              key: 'more',
              label: 'تفاصيل إضافية (اختياري)',
              children: (
                <div className="space-y-4">
                  <label className="block">
                    وصف أو هدف
                    <Input.TextArea
                      value={plan.description}
                      onChange={e => setPlan({ ...plan, description: e.target.value })}
                    />
                  </label>
                  <Checkbox
                    checked={plan.painTracking}
                    onChange={e => setPlan({ ...plan, painTracking: e.target.checked })}
                  >
                    إظهار تقييم الألم بعد الجلسة
                  </Checkbox>
                  <label className="block">
                    أسبوع هذه الجلسة (للمحتوى المتدرج فقط)
                    <InputNumber
                      min={1}
                      max={520}
                      value={current.week}
                      onChange={n => updateSession({ week: n ?? undefined })}
                    />
                  </label>
                </div>
              ),
            },
          ]}
        />

        <Button htmlType="submit" type="primary" size="large" block loading={saving}>
          حفظ الخطة
        </Button>
      </form>
    </Modal>
  );
}
