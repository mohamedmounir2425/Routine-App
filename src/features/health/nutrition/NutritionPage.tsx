import { useEffect, useState } from 'react';
import { Alert, Button, Card, Checkbox, Collapse, Input, InputNumber, Modal, Radio, Select, Tag } from 'antd';
import type { NutritionMeal, NutritionPlan, NutritionRecipe } from '../../../types/health';
import { workspaceStorage } from '../../../db/workspaceScope';
import { useHealthRecords } from '../hooks/useHealthRecords';
import { useNutritionRecipes } from './NutritionContext';
import {
  activateNutrition,
  emptyNutrition,
  logNutrition,
  saveNutrition,
  saveWeight,
} from '../data/nutritionRepository';
import { localToday, newId } from '../data/trainingRepository';
import { getLocalDateString, parseLocalDate } from '../../../utils/dateUtils';

const DRAFT = 'health_nutrition_draft';

function readDraft(): NutritionPlan | null {
  try {
    const value = JSON.parse(workspaceStorage.getItem(DRAFT) ?? 'null');
    return value?.id && value?.meals && typeof value.name === 'string' ? value : null;
  } catch {
    return null;
  }
}

function RecipePicker({
  select,
  close,
}: {
  select: (recipe: NutritionRecipe) => void;
  close: () => void;
}) {
  const adapter = useNutritionRecipes();
  const [recipes, setRecipes] = useState<NutritionRecipe[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [light, setLight] = useState(false);

  useEffect(() => {
    let current = true;
    void adapter
      .list()
      .then(rows => {
        if (current) setRecipes(rows);
      })
      .catch(() => {
        if (current) setError('تعذر تحميل مكتبة المنزل. تقدر تكتب الوجبة مباشرة وتحاول الربط لاحقًا.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [adapter]);

  return (
    <Modal open title="اختيار وصفة من المنزل" footer={null} onCancel={close}>
      <div className="space-y-4">
        <Input.Search
          placeholder="بحث باسم الوصفة"
          aria-label="بحث الوصفات"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-4">
          <Checkbox checked={favorite} onChange={e => setFavorite(e.target.checked)}>
            المفضلة
          </Checkbox>
          <Checkbox checked={light} onChange={e => setLight(e.target.checked)}>
            الخفيفة
          </Checkbox>
        </div>
        <p className="text-sm opacity-70">«خفيفة» وسم شخصي للمساعدة في الاختيار. اختر ما يناسب نظامك بنفسك.</p>
        {error && <Alert title={error} type="error" />}
        {loading ? (
          <p role="status">جارٍ التحميل…</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {recipes
              .filter(
                r =>
                  (!favorite || r.isFavorite) &&
                  (!light || r.isLight) &&
                  r.title.toLowerCase().includes(search.toLowerCase())
              )
              .map(r => (
                <Button key={r.id} block onClick={() => select(r)}>
                  {r.title}
                  {r.isLight ? ' · خفيفة' : ''}
                </Button>
              ))}
            {!recipes.length && !error && <p>لا توجد وصفات محفوظة. اكتب وجبتك أو أضف وصفة في المنزل.</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function NutritionEditor({
  initial,
  close,
  activateOnSave,
}: {
  initial: NutritionPlan;
  close: () => void;
  activateOnSave: boolean;
}) {
  const adapter = useNutritionRecipes();
  const [plan, setPlan] = useState(() => structuredClone(initial));
  const [picker, setPicker] = useState<string>();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; content?: string }>({});
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(plan) !== JSON.stringify(initial);

  useEffect(() => {
    workspaceStorage.setItem(DRAFT, JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', unload);
    return () => window.removeEventListener('beforeunload', unload);
  }, [dirty]);

  const updateMeal = (id: string, change: Partial<NutritionMeal>) => {
    setFieldErrors(prev => ({ ...prev, content: undefined }));
    setPlan({ ...plan, meals: plan.meals.map(m => (m.id === id ? { ...m, ...change } : m)) });
  };

  const cancel = () => {
    if (!dirty || window.confirm('تجاهل التعديلات غير المحفوظة؟')) {
      workspaceStorage.removeItem(DRAFT);
      close();
    }
  };

  const addMeal = () => {
    setFieldErrors(prev => ({ ...prev, content: undefined }));
    setPlan({
      ...plan,
      meals: [
        ...plan.meals,
        {
          id: newId(),
          name: ['الفطار', 'الغداء', 'العشاء', 'سناك'][plan.meals.length] ?? 'وجبة',
          text: '',
          portion: '',
          alternatives: '',
          notes: '',
        },
      ],
    });
  };

  return (
    <Modal open title="نظامي الغذائي" onCancel={cancel} footer={null} width={760} maskClosable={false}>
      <form
        className="space-y-5"
        onSubmit={async e => {
          e.preventDefault();
          if (saving) return;
          const nextErrors: { name?: string; content?: string } = {};
          if (!plan.name.trim()) nextErrors.name = 'أدخل اسم النظام الغذائي';
          if (plan.mode === 'text' && !plan.text.trim()) {
            nextErrors.content = 'اكتب محتوى النظام الغذائي قبل الحفظ';
          } else if (plan.mode === 'meals') {
            if (!plan.meals.length) {
              nextErrors.content = 'أضف وجبة واحدة على الأقل';
            } else if (plan.meals.some(m => !m.text.trim() && !m.recipeId)) {
              nextErrors.content = 'أضف وصف الوجبة أو اربطها بوصفة لكل وجبة';
            }
          }
          setFieldErrors(nextErrors);
          if (nextErrors.name || nextErrors.content) {
            setError(nextErrors.name ?? nextErrors.content ?? '');
            return;
          }
          setSaving(true);
          setError('');
          try {
            await saveNutrition(plan);
            if (activateOnSave) await activateNutrition(plan.id);
            workspaceStorage.removeItem(DRAFT);
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
          <span className="font-bold">اسم النظام</span>
          <Input
            required
            autoFocus
            size="large"
            status={fieldErrors.name ? 'error' : undefined}
            value={plan.name}
            onChange={e => {
              setPlan({ ...plan, name: e.target.value });
              if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
            }}
            placeholder="مثال: نظام التنشيف المتوازن"
          />
          {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name}</p>}
        </label>

        <Radio.Group
          value={plan.mode}
          onChange={e => {
            setFieldErrors(prev => ({ ...prev, content: undefined }));
            setPlan({ ...plan, mode: e.target.value });
          }}
          options={[
            { value: 'text', label: 'نظام مكتوب' },
            { value: 'meals', label: 'وجباتي' },
          ]}
          optionType="button"
        />

        {plan.mode === 'text' ? (
          <label className="block space-y-1.5">
            <span className="font-bold">محتوى نظامي</span>
            <Input.TextArea
              required
              rows={9}
              status={fieldErrors.content ? 'error' : undefined}
              value={plan.text}
              onChange={e => {
                setPlan({ ...plan, text: e.target.value });
                if (fieldErrors.content) setFieldErrors(prev => ({ ...prev, content: undefined }));
              }}
              placeholder="اكتب أو الصق نظامك الغذائي هنا..."
            />
            {fieldErrors.content && <p className="text-xs text-red-500">{fieldErrors.content}</p>}
          </label>
        ) : (
          <div className="space-y-4">
            {fieldErrors.content && <p className="text-xs text-red-500">{fieldErrors.content}</p>}
            {plan.meals.map((m, index) => (
              <section key={m.id} className="space-y-3 rounded-xl border border-current/15 p-4">
                <div className="flex gap-2">
                  <Input
                    aria-label="اسم الوجبة"
                    value={m.name}
                    placeholder="اسم الوجبة (مثل الفطار)"
                    onChange={e => updateMeal(m.id, { name: e.target.value })}
                  />
                  <Button
                    aria-label="تحريك الوجبة لأعلى"
                    disabled={!index}
                    onClick={() => {
                      const meals = [...plan.meals];
                      [meals[index - 1], meals[index]] = [meals[index], meals[index - 1]];
                      setPlan({ ...plan, meals });
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    danger
                    onClick={() => setPlan({ ...plan, meals: plan.meals.filter(x => x.id !== m.id) })}
                  >
                    حذف
                  </Button>
                </div>
                <label className="block">
                  وصف الوجبة
                  <Input.TextArea
                    value={m.text}
                    onChange={e => updateMeal(m.id, { text: e.target.value })}
                    placeholder="مكونات الوجبة..."
                  />
                </label>
                {m.recipeId && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag color="blue">{m.recipeTitle}</Tag>
                    {adapter.enabled && <Button onClick={() => adapter.open(m.recipeId!)}>عرض الوصفة</Button>}
                    <Button onClick={() => updateMeal(m.id, { recipeId: undefined, recipeTitle: undefined })}>
                      إزالة الربط
                    </Button>
                  </div>
                )}
                <Button disabled={!adapter.enabled} onClick={() => setPicker(m.id)}>
                  {m.recipeId ? 'استبدال الوصفة' : 'ربط وصفة'}
                </Button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    كميتي الشخصية
                    <Input
                      value={m.portion}
                      onChange={e => updateMeal(m.id, { portion: e.target.value })}
                      placeholder="الكمية الخاصة بي؛ مستقلة عن عدد أفراد الوصفة"
                    />
                  </label>
                  <label className="block text-sm">
                    البدائل
                    <Input value={m.alternatives} onChange={e => updateMeal(m.id, { alternatives: e.target.value })} />
                  </label>
                </div>
                <label className="block text-sm">
                  ملاحظة
                  <Input value={m.notes} onChange={e => updateMeal(m.id, { notes: e.target.value })} />
                </label>
              </section>
            ))}
            <Button block onClick={addMeal}>
              ＋ إضافة وجبة
            </Button>
            {!adapter.enabled ? (
              <p className="text-xs opacity-75">فعّل مساحة المنزل لربط وصفاتها. تقدر تحفظ وجبات نصية.</p>
            ) : (
              <Button onClick={() => adapter.create()}>إضافة وصفة في المنزل والعودة للمسودة</Button>
            )}
          </div>
        )}

        <Collapse
          items={[
            {
              key: 'more',
              label: 'المدة والملاحظات والمتابعة (اختياري)',
              children: (
                <div className="space-y-4">
                  <label className="block">
                    وصف أو غرض
                    <Input value={plan.description} onChange={e => setPlan({ ...plan, description: e.target.value })} />
                  </label>
                  <label className="block">
                    قواعد النظام وملاحظاتي
                    <Input.TextArea value={plan.notes} onChange={e => setPlan({ ...plan, notes: e.target.value })} />
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label>
                      من
                      <Input
                        type="date"
                        value={plan.startDate ?? ''}
                        onChange={e => setPlan({ ...plan, startDate: e.target.value || undefined })}
                      />
                    </label>
                    <label>
                      حتى
                      <Input
                        type="date"
                        min={plan.startDate}
                        value={plan.endDate ?? ''}
                        onChange={e => setPlan({ ...plan, endDate: e.target.value || undefined })}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Checkbox
                      checked={plan.tracking}
                      onChange={e => setPlan({ ...plan, tracking: e.target.checked })}
                    >
                      متابعة الالتزام يوميًا
                    </Checkbox>
                    <Checkbox
                      checked={plan.weightTracking}
                      onChange={e => setPlan({ ...plan, weightTracking: e.target.checked })}
                    >
                      قياسات الوزن
                    </Checkbox>
                  </div>
                </div>
              ),
            },
          ]}
        />

        <Button type="primary" htmlType="submit" size="large" loading={saving} block>
          {activateOnSave ? 'حفظ وتفعيل النظام' : 'حفظ النظام'}
        </Button>
      </form>
      {picker && (
        <RecipePicker
          close={() => setPicker(undefined)}
          select={r => {
            updateMeal(picker, { recipeId: r.id, recipeTitle: r.title });
            setPicker(undefined);
          }}
        />
      )}
    </Modal>
  );
}

export function NutritionPage() {
  const { rows, date, loading, error } = useHealthRecords();
  const adapter = useNutritionRecipes();
  const [editor, setEditor] = useState<NutritionPlan | null>(readDraft);
  const [recipeIndex, setRecipeIndex] = useState<NutritionRecipe[]>([]);
  const [recipeError, setRecipeError] = useState('');
  const [recipeLoaded, setRecipeLoaded] = useState(false);
  const [actionError, setActionError] = useState('');
  const [note, setNote] = useState('');
  const [weight, setWeight] = useState<number | null>(null);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [weightDate, setWeightDate] = useState(localToday);
  const [busy, setBusy] = useState(false);

  const plans = rows('nutrition');
  const prefs = rows('preferences')[0];
  const plan = plans.find(p => p.id === prefs?.activeNutritionId);
  const logs = rows('nutritionLog').filter(l => l.planId === plan?.id && l.trackingId === plan?.trackingId);
  const todayLog = logs.find(l => l.date === date);

  useEffect(() => {
    setNote(todayLog?.note ?? '');
  }, [todayLog?.id, todayLog?.note]);

  useEffect(() => {
    if (!adapter.enabled) return;
    let alive = true;
    void adapter
      .list()
      .then(r => {
        if (alive) {
          setRecipeIndex(r);
          setRecipeLoaded(true);
        }
      })
      .catch(() => {
        if (alive) setRecipeError('تعذر تحميل الوصفات؛ محتوى نظامك ما زال متاحًا.');
      });
    return () => {
      alive = false;
    };
  }, [adapter, editor]);

  const perform = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setActionError('');
    try {
      await action();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">التغذية</h1>
          <p className="mt-1 text-sm opacity-70">وجباتك أو نظامك المكتوب في الواجهة، مع متابعة اختيارية هادئة.</p>
        </div>
        <Button type={plan ? 'default' : 'primary'} onClick={() => setEditor(emptyNutrition())}>
          ＋ نظام آخر
        </Button>
      </div>

      {(error || actionError) && <Alert type="error" title={error || actionError} showIcon />}
      {recipeError && <Alert type="warning" title={recipeError} showIcon />}

      {loading ? (
        <p role="status">جارٍ التحميل…</p>
      ) : !plan ? (
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">نظامك في مكان واحد</h2>
            <p className="opacity-80">احفظ نظامك الغذائي المكتوب أو قسّمه إلى وجبات يومية للرجوع إليه بسهولة.</p>
            <Button type="primary" size="large" onClick={() => setEditor(emptyNutrition())}>
              ＋ إضافة نظامي الغذائي
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card
            title={
              <div className="flex flex-wrap items-center gap-2">
                <span className="whitespace-normal text-lg font-bold">{plan.name}</span>
                <Tag color="green">النظام النشط حاليًا</Tag>
              </div>
            }
            extra={<Button onClick={() => setEditor(plan)}>تعديل</Button>}
          >
            <div className="space-y-4">
              {plan.description && <p className="text-sm opacity-85">{plan.description}</p>}
              <p className="text-xs opacity-70">
                المدة: {plan.startDate ?? 'مستمر'}
                {plan.endDate && ` — ${plan.endDate}`} · نظام يومي متكرر
              </p>

              {plan.mode === 'text' ? (
                <div className="rounded-xl bg-current/5 p-4">
                  <p className="whitespace-pre-wrap leading-8">{plan.text}</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {plan.meals.map(m => {
                    const recipe = recipeIndex.find(r => r.id === m.recipeId);
                    const missing = m.recipeId && adapter.enabled && recipeLoaded && !recipe && !recipeError;
                    return (
                      <section key={m.id} className="space-y-2 rounded-xl border border-current/15 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold">{m.name || 'وجبة'}</h3>
                          <Button size="small" type="text" onClick={() => setEditor(plan)}>
                            تعديل الوجبة
                          </Button>
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{m.text || recipe?.title || m.recipeTitle}</p>
                        {m.portion && <p className="text-xs opacity-80">كميتي: {m.portion}</p>}
                        {m.alternatives && <p className="text-xs opacity-80">البدائل: {m.alternatives}</p>}
                        {m.notes && <p className="text-xs opacity-75">{m.notes}</p>}
                        {missing ? (
                          <Alert
                            type="warning"
                            title="الوصفة المرتبطة لم تعد متاحة"
                            description="وصف الوجبة وكميتك محفوظان. استخدم تعديل لاستبدال الربط أو إزالته."
                          />
                        ) : (
                          m.recipeId && (
                            <Button size="small" disabled={!adapter.enabled} onClick={() => adapter.open(m.recipeId!)}>
                              عرض الوصفة
                            </Button>
                          )
                        )}
                        {m.recipeId && !adapter.enabled && (
                          <p className="text-xs opacity-70">فعّل مساحة المنزل لعرض الوصفة.</p>
                        )}
                      </section>
                    );
                  })}
                </div>
              )}

              {plan.mode === 'meals' && (
                <Button size="small" onClick={() => setEditor(plan)}>
                  ＋ إضافة وجبة
                </Button>
              )}

              {plan.notes && (
                <details className="rounded-xl border border-current/10 p-3">
                  <summary className="cursor-pointer text-sm font-medium">قواعد النظام وملاحظاتي</summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{plan.notes}</p>
                </details>
              )}
            </div>
          </Card>

          {plan.tracking && (
            <Card title="متابعة اليوم">
              <div className="space-y-4">
                <p className="text-sm opacity-80">
                  {todayLog ? 'يمكنك تعديل تسجيل اليوم.' : 'اليوم غير مسجل؛ لا يُحسب عدم التزام.'}
                </p>
                <Input.TextArea
                  aria-label="ملاحظة تسجيل اليوم"
                  placeholder="ملاحظة اختيارية عن يومك الغذائي"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  {(['yes', 'partial', 'no'] as const).map((s, i) => (
                    <Button
                      loading={busy}
                      type={todayLog?.status === s ? 'primary' : 'default'}
                      key={s}
                      onClick={() => void perform(() => logNutrition(plan, s, note, date))}
                    >
                      {['التزمت', 'جزئيًا', 'لم ألتزم'][i]}
                    </Button>
                  ))}
                </div>
                <details className="rounded-xl border border-current/10 p-3">
                  <summary className="cursor-pointer text-sm font-medium">متابعة آخر ٧ أيام</summary>
                  <div className="mt-2 divide-y divide-current/10 text-sm">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = parseLocalDate(date);
                      d.setDate(d.getDate() - i);
                      const key = getLocalDateString(d);
                      const log = logs.find(l => l.date === key);
                      return (
                        <p className="py-1.5" key={key}>
                          {key} · {log ? { yes: 'التزمت', partial: 'جزئيًا', no: 'لم ألتزم' }[log.status] : 'غير مسجل'}
                        </p>
                      );
                    })}
                  </div>
                </details>
              </div>
            </Card>
          )}

          {plan.weightTracking && (
            <Card title="قياسات الوزن">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <InputNumber aria-label="الوزن" min={0.1} max={2000} value={weight} onChange={setWeight} />
                  <Select
                    aria-label="الوحدة"
                    value={unit}
                    onChange={setUnit}
                    options={[
                      { value: 'kg', label: 'كجم' },
                      { value: 'lb', label: 'رطل' },
                    ]}
                  />
                  <Input
                    type="date"
                    aria-label="تاريخ القياس"
                    className="!w-44"
                    value={weightDate}
                    onChange={e => setWeightDate(e.target.value)}
                  />
                  <Button
                    type="primary"
                    disabled={weight === null || busy}
                    onClick={() =>
                      void perform(async () => {
                        await saveWeight({ planId: plan.id, date: weightDate, value: weight!, unit });
                        setWeight(null);
                      })
                    }
                  >
                    حفظ القياس
                  </Button>
                </div>
                <div className="divide-y divide-current/10 text-sm">
                  {rows('weight')
                    .filter(w => w.planId === plan.id)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map(w => (
                      <p className="py-1.5" key={w.id}>
                        {w.date} · {w.value} {w.unit === 'kg' ? 'كجم' : 'رطل'}
                      </p>
                    ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {plans.length > 0 && (
        <details className="rounded-xl border border-current/15 p-4" open={!plan || plans.length > 1}>
          <summary className="cursor-pointer py-1 font-bold">أنظمتي المحفوظة ({plans.length})</summary>
          <div className="mt-3 space-y-2.5">
            {plans.map(p => {
              const isActive = p.id === plan?.id;
              return (
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-3 ${
                    isActive ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-current/10'
                  }`}
                  key={p.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{p.name}</span>
                    {isActive ? (
                      <Tag color="green">النشط</Tag>
                    ) : (
                      <Tag>{p.mode === 'meals' ? `${p.meals.length} وجبات` : 'نظام مكتوب'}</Tag>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" onClick={() => setEditor(p)}>
                      تعديل
                    </Button>
                    {!isActive && (
                      <Button
                        size="small"
                        type="primary"
                        loading={busy}
                        onClick={() => void perform(() => activateNutrition(p.id))}
                      >
                        تفعيل هذا النظام
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {editor && <NutritionEditor activateOnSave={!plan} initial={editor} close={() => setEditor(null)} />}
    </div>
  );
}
