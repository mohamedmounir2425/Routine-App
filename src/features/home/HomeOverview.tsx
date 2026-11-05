import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { liveQuery } from 'dexie';
import { Link } from 'react-router-dom';
import { App, Select } from 'antd';
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Check,
  Clock3,
  CookingPot,
  ShoppingBasket,
  ListChecks,
  Sparkles,
  Dices,
  Pin,
  Heart,
  Plus,
  UtensilsCrossed
} from 'lucide-react';
import { db } from '../../db/database';
import type { LifeTask } from '../../types';
import { toggleTaskCompletion, saveTask } from '../../db/taskQueries';
import { getLocalDateString } from '../../utils/dateUtils';
import { isHomeTaskDone, isShoppingTask } from './homeTasks';
import { MEAL_TYPES, safeMediaUrl, normalizeFoodText, type Recipe } from './recipes/recipeModel';
import { isSpaceTaskDue } from '../today/taskCalendar';
import { inventoryFlags, type InventoryItem } from './inventory/inventoryModel';
import { parseShoppingTitle } from './tasks/HomeTasksView';
import { toggleRecipeFavorite } from './recipes/recipeRepository';
import { QuickInlineAdd } from './components/QuickInlineAdd';

export function HomeOverview() {
  const { message: antMessage } = App.useApp();
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  // Interactive Meal State
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('all');
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [pinnedMealId, setPinnedMealId] = useState<string>('');

  // Horizontal scroll shadow for filter pills
  const pillsRef = useRef<HTMLDivElement>(null);
  const [scrollShadows, setScrollShadows] = useState({ start: false, end: false });

  // Shopping List Filter & Scroll State (max 5.5 items with scroll shadows)
  const [shoppingFilter, setShoppingFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const shoppingListRef = useRef<HTMLUListElement>(null);
  const [shoppingScroll, setShoppingScroll] = useState({ top: false, bottom: false });

  // Tasks List Scroll State (max 5.5 items with scroll shadows)
  const tasksListRef = useRef<HTMLUListElement>(null);
  const [tasksScroll, setTasksScroll] = useState({ top: false, bottom: false });

  const updateScrollShadows = useCallback(() => {
    const el = pillsRef.current;
    if (!el) return;
    const isOverflowing = el.scrollWidth > el.clientWidth + 2;
    if (!isOverflowing) {
      setScrollShadows({ start: false, end: false });
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    const current = Math.abs(el.scrollLeft);
    setScrollShadows({
      start: current > 6,
      end: current < maxScroll - 6
    });
  }, []);

  const updateShoppingScroll = useCallback(() => {
    const el = shoppingListRef.current;
    if (!el) return;
    const isOverflowing = el.scrollHeight > el.clientHeight + 2;
    if (!isOverflowing) {
      setShoppingScroll({ top: false, bottom: false });
      return;
    }
    const maxScroll = el.scrollHeight - el.clientHeight;
    const current = el.scrollTop;
    setShoppingScroll({
      top: current > 4,
      bottom: current < maxScroll - 4
    });
  }, []);

  const updateTasksScroll = useCallback(() => {
    const el = tasksListRef.current;
    if (!el) return;
    const isOverflowing = el.scrollHeight > el.clientHeight + 2;
    if (!isOverflowing) {
      setTasksScroll({ top: false, bottom: false });
      return;
    }
    const maxScroll = el.scrollHeight - el.clientHeight;
    const current = el.scrollTop;
    setTasksScroll({
      top: current > 4,
      bottom: current < maxScroll - 4
    });
  }, []);

  useEffect(() => {
    updateScrollShadows();
    window.addEventListener('resize', updateScrollShadows);
    return () => window.removeEventListener('resize', updateScrollShadows);
  }, [updateScrollShadows]);

  const today = getLocalDateString();
  const PIN_KEY = `home_pinned_meal_${today}`;

  useEffect(() => {
    const savedPin = localStorage.getItem(PIN_KEY);
    if (savedPin) setPinnedMealId(savedPin);
  }, [PIN_KEY]);

  useEffect(() => {
    const subscription = liveQuery(async () => ({
      tasks: await db.tasks.where('spaceId').equals('home').toArray(),
      recipes: await db.recipes.toArray(),
      inventory: await db.inventoryItems.toArray()
    })).subscribe({
      next: data => {
        setTasks(data.tasks);
        setRecipes(data.recipes);
        setInventory(data.inventory);
        setLoading(false);
      },
      error: () => {
        antMessage.error('تعذر تحميل بيانات المنزل. أعد فتح الصفحة.');
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Filter tasks
  const allShoppingTasks = useMemo(
    () => tasks.filter(task => isShoppingTask(task)),
    [tasks]
  );

  const pendingShopping = useMemo(
    () => allShoppingTasks.filter(task => !isHomeTaskDone(task, today)),
    [allShoppingTasks, today]
  );

  const completedShopping = useMemo(
    () => allShoppingTasks.filter(task => isHomeTaskDone(task, today)),
    [allShoppingTasks, today]
  );

  // Backward compatibility: shopping = pendingShopping
  const shopping = pendingShopping;

  const displayedShopping = useMemo(() => {
    if (shoppingFilter === 'pending') return pendingShopping;
    if (shoppingFilter === 'completed') return completedShopping;
    // 'all': pending first, completed last
    return [...pendingShopping, ...completedShopping];
  }, [shoppingFilter, pendingShopping, completedShopping]);

  useEffect(() => {
    updateShoppingScroll();
  }, [displayedShopping, updateShoppingScroll]);

  const due = useMemo(
    () =>
      tasks
        .filter(
          task =>
            !isShoppingTask(task) &&
            !isHomeTaskDone(task, today) &&
            isSpaceTaskDue(task, today) &&
            (task.isRecurring || (!!task.dueDate && task.dueDate <= today))
        )
        .sort(
          (a, b) =>
            (a.dueDate ?? today).localeCompare(b.dueDate ?? today) ||
            Number(b.priority === 'high') - Number(a.priority === 'high')
        ),
    [tasks, today]
  );

  useEffect(() => {
    updateTasksScroll();
  }, [due, updateTasksScroll]);

  // Expiring/Urgent inventory items
  const urgentInventory = useMemo(() => {
    return inventory.filter(item => {
      const flags = inventoryFlags(item, today);
      return flags.useFirst || flags.expiring || flags.expired;
    });
  }, [inventory, today]);

  // Current time of day label
  const mealPeriodInfo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { id: 'breakfast', label: 'الإفطار', icon: '🍳' };
    }
    if (hour >= 12 && hour < 18) {
      return { id: 'lunch', label: 'الغداء', icon: '🍲' };
    }
    return { id: 'dinner', label: 'العشاء', icon: '🥗' };
  }, []);

  // Filtered recipe list based on selected filter
  const filteredRecipes = useMemo(() => {
    if (!recipes.length) return [];
    if (selectedMealFilter === 'all') return recipes;
    if (selectedMealFilter === 'quick') {
      return recipes.filter(r => r.durationMinutes !== null && r.durationMinutes <= 30);
    }
    if (selectedMealFilter === 'light') {
      return recipes.filter(r => r.isLight);
    }
    return recipes.filter(r => r.mealTypes.includes(selectedMealFilter as any));
  }, [recipes, selectedMealFilter]);

  // Determine current featured recipe
  const featuredRecipe = useMemo(() => {
    if (!recipes.length) return null;
    if (pinnedMealId) {
      const pinned = recipes.find(r => r.id === pinnedMealId);
      if (pinned) return pinned;
    }
    const pool = filteredRecipes.length ? filteredRecipes : recipes;
    const safeIndex = featuredIndex % pool.length;
    return pool[safeIndex] ?? pool[0] ?? null;
  }, [recipes, filteredRecipes, pinnedMealId, featuredIndex]);

  const toggleTask = async (task: LifeTask) => {
    if (busy) return;
    setBusy(task.id);
    const wasDone = isHomeTaskDone(task, today);
    try {
      await toggleTaskCompletion(task.id, today);
      if (isShoppingTask(task)) {
        antMessage.success(wasDone ? 'أُعيد الغرض إلى قائمة النواقص 🛒' : 'تم شطب الغرض من المشتريات ✅');
      }
    } catch {
      antMessage.error('تعذر حفظ التغيير. حاول مرة أخرى.');
    } finally {
      setBusy('');
    }
  };

  const addQuickShopItem = async (text: string) => {
    if (busy) return;
    setBusy('quick_shop');
    try {
      await saveTask({
        id: crypto.randomUUID(),
        spaceId: 'home',
        title: `🛒 ${text.replace(/^🛒\s*/, '')}`,
        isCompleted: false,
        priority: 'medium',
        createdAt: new Date().toISOString()
      });
      antMessage.success(`أُضيف «${text}» إلى المشتريات 🛒`);
    } catch {
      antMessage.error('تعذر إضافة الغرض للمشتريات.');
    } finally {
      setBusy('');
    }
  };

  const togglePinMeal = (recipeId: string) => {
    if (pinnedMealId === recipeId) {
      localStorage.removeItem(PIN_KEY);
      setPinnedMealId('');
      antMessage.info('تم إلغاء تثبيت وجبة اليوم.');
    } else {
      localStorage.setItem(PIN_KEY, recipeId);
      setPinnedMealId(recipeId);
      antMessage.success('تم اعتماد هذه الوجبة كوجبة اليوم للأسرة ⭐');
    }
  };

  const toggleFavorite = async (recipe: Recipe) => {
    try {
      await toggleRecipeFavorite(recipe.id);
      antMessage.success(recipe.isFavorite ? 'أُزيلت من المفضلة' : 'أُضيفت إلى المفضلة ♥');
    } catch {
      antMessage.error('تعذر تحديث المفضلة.');
    }
  };

  const randomizeMeal = () => {
    const pool = filteredRecipes.length ? filteredRecipes : recipes;
    if (pool.length <= 1) return;
    if (pinnedMealId) {
      localStorage.removeItem(PIN_KEY);
      setPinnedMealId('');
    }
    let nextIdx = Math.floor(Math.random() * pool.length);
    if (nextIdx === featuredIndex) {
      nextIdx = (nextIdx + 1) % pool.length;
    }
    setFeaturedIndex(nextIdx);
  };

  const sendIngredientsToShopping = async (recipe: Recipe) => {
    if (!recipe.ingredients.length) {
      antMessage.info('هذه الوصفة لا تحتوي مقادير مسجلة لنقلها.');
      return;
    }
    setBusy('ingredients');
    try {
      const currentTasks = await db.tasks.where('spaceId').equals('home').toArray();
      let added = 0;
      for (const ing of recipe.ingredients) {
        const title = `🛒 ${ing.name}${ing.quantity ? ` · ${ing.quantity}` : ''}`;
        const exists = currentTasks.some(
          t => !t.isCompleted && normalizeFoodText(t.title).includes(normalizeFoodText(ing.name))
        );
        if (!exists) {
          await saveTask({
            id: crypto.randomUUID(),
            spaceId: 'home',
            title,
            isCompleted: false,
            priority: 'medium',
            createdAt: new Date().toISOString()
          });
          added++;
        }
      }
      if (added > 0) {
        antMessage.success(`تم نقل ${added} مقادير من «${recipe.title}» إلى المشتريات بنجاح 🛒`);
      } else {
        antMessage.info('جميع مقادير هذه الطبخة موجودة بالفعل في المشتريات.');
      }
    } catch {
      antMessage.error('تعذر نقل المقادير للمشتريات.');
    } finally {
      setBusy('');
    }
  };

  const featuredIcon = featuredRecipe
    ? MEAL_TYPES.find(t => featuredRecipe.mealTypes.includes(t.id))?.icon ?? '🍲'
    : '🍲';

  const hasCoverImage = featuredRecipe && safeMediaUrl(featuredRecipe.imageUrl);

  return (
    <div className="home-overview" dir="rtl">
      {/* 🌟 Household Vital Stats Bar (نبض البيت) */}
      <section className="home-pulse-bar" aria-label="ملخص حالة المنزل اليوم">
        <Link to="/home/shopping" className="home-pulse-card is-shopping">
          <div className="home-pulse-header">
            <div className="home-pulse-icon is-shopping">
              <ShoppingBasket size={14} />
            </div>
            <span className="home-pulse-title">المشتريات</span>
          </div>
          <div className="home-pulse-value">
            {shopping.length ? (
              <span className="home-pulse-metric is-shopping">
                <strong>{shopping.length}</strong> <small>نواقص</small>
              </span>
            ) : (
              <span className="home-pulse-metric is-done">
                <Check size={13} /> <small>مكتملة</small>
              </span>
            )}
          </div>
        </Link>

        <Link to="/home/inventory" className="home-pulse-card is-inventory">
          <div className="home-pulse-header">
            <div className="home-pulse-icon is-inventory">
              <Archive size={14} />
            </div>
            <span className="home-pulse-title">المخزون</span>
          </div>
          <div className="home-pulse-value">
            {urgentInventory.length ? (
              <span className="home-pulse-metric is-urgent">
                <strong>{urgentInventory.length}</strong> <small>للاستهلاك</small>
              </span>
            ) : (
              <span className="home-pulse-metric is-inventory">
                <strong>{inventory.length}</strong> <small>صنف</small>
              </span>
            )}
          </div>
        </Link>

        <Link to="/home/tasks" className="home-pulse-card is-tasks">
          <div className="home-pulse-header">
            <div className="home-pulse-icon is-tasks">
              <ListChecks size={14} />
            </div>
            <span className="home-pulse-title">أعمال اليوم</span>
          </div>
          <div className="home-pulse-value">
            {due.length ? (
              <span className="home-pulse-metric is-tasks">
                <strong>{due.length}</strong> <small>متبقية</small>
              </span>
            ) : (
              <span className="home-pulse-metric is-done">
                <Check size={13} /> <small>منجزة</small>
              </span>
            )}
          </div>
        </Link>
      </section>

      {/* 💡 Smart Pantry Alert (لو فيه أصناف أوشكت على الانتهاء) */}
      {urgentInventory.length > 0 && (
        <div className="home-pantry-alert">
          <div className="home-pantry-alert-content">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <p>
              يُفضل استهلاكها أولًا:{' '}
              <strong>{urgentInventory.slice(0, 3).map(i => i.name).join('، ')}</strong>
              {urgentInventory.length > 3 ? ` (+${urgentInventory.length - 3})` : ''}
            </p>
          </div>
          <Link to="/home/inventory?filter=first" className="home-pantry-alert-btn">
            <span>معاينة النواقص</span>
            <ArrowLeft size={12} />
          </Link>
        </div>
      )}

      {/* 🍲 قسم "ماذا نأكل اليوم؟" البطل التفاعلي */}
      <section className="home-kitchen-preview">
        <div className="home-panel-heading">
          <div>
            <span className="home-eyebrow">
              <CookingPot size={15} /> المطبخ والوجبات
            </span>
            <h2>ماذا نأكل اليوم؟</h2>
          </div>
          <Link className="home-text-link home-all-recipes-link" to="/home/recipes">
            <span>كل الوصفات ({recipes.length})</span>
            <ArrowLeft size={15} />
          </Link>
        </div>

        {/* فلاتر المزاج ونوع الوجبة السريعة بشادو جانبي وبدون شريط تمرير */}
        <div
          className={`home-meal-filter-pills-wrap ${scrollShadows.start ? 'has-shadow-start' : ''} ${
            scrollShadows.end ? 'has-shadow-end' : ''
          }`}
        >
          <div
            ref={pillsRef}
            onScroll={updateScrollShadows}
            className="home-meal-filter-pills"
            aria-label="فلاتر اقتراح الوجبة"
          >
            <button
              type="button"
              className="home-meal-pill"
              aria-pressed={selectedMealFilter === 'all'}
              onClick={() => setSelectedMealFilter('all')}
            >
              🍽️ الكل
            </button>
            {MEAL_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                className="home-meal-pill"
                aria-pressed={selectedMealFilter === type.id}
                onClick={() => setSelectedMealFilter(type.id)}
              >
                <span aria-hidden="true">{type.icon}</span> {type.label}
              </button>
            ))}
            <button
              type="button"
              className="home-meal-pill"
              aria-pressed={selectedMealFilter === 'quick'}
              onClick={() => setSelectedMealFilter('quick')}
            >
              ⚡ سريعة (&lt;30د)
            </button>
            <button
              type="button"
              className="home-meal-pill"
              aria-pressed={selectedMealFilter === 'light'}
              onClick={() => setSelectedMealFilter('light')}
            >
              🌿 خفيفة
            </button>
          </div>
        </div>

        {loading ? (
          <p role="status" className="home-empty">
            جارٍ تحميل المقترحات…
          </p>
        ) : featuredRecipe ? (
          <div className={`home-meal-hero ${hasCoverImage ? 'has-cover' : 'no-cover'}`}>
            {hasCoverImage && (
              <div className="home-meal-hero-cover">
                <img
                  src={safeMediaUrl(featuredRecipe.imageUrl)}
                  alt={featuredRecipe.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="home-meal-hero-img"
                />
              </div>
            )}

            <div className="home-meal-hero-body">
              <div className="home-meal-hero-head">
                <div className="home-meal-hero-tags">
                  <span className="home-hero-badge">
                    <span aria-hidden="true">{featuredIcon}</span>
                    <span>مقترح {mealPeriodInfo.label}</span>
                  </span>
                  {featuredRecipe.durationMinutes && (
                    <span className="home-hero-tag">
                      <Clock3 size={11} /> {featuredRecipe.durationMinutes} دقيقة
                    </span>
                  )}
                  {featuredRecipe.isLight && <span className="home-hero-tag">🌿 خفيفة</span>}
                </div>

                <div className="home-meal-hero-corner-actions">
                  <button
                    type="button"
                    className={`home-hero-icon-btn ${pinnedMealId === featuredRecipe.id ? 'is-active-pin' : ''}`}
                    onClick={() => togglePinMeal(featuredRecipe.id)}
                    title={pinnedMealId === featuredRecipe.id ? 'إلغاء اعتماد وجبة اليوم' : 'تثبيت كوجبة اليوم 📌'}
                    aria-label="تثبيت وجبة اليوم"
                  >
                    <Pin size={15} />
                  </button>
                  <button
                    type="button"
                    className={`home-hero-icon-btn ${featuredRecipe.isFavorite ? 'is-active-fav' : ''}`}
                    onClick={() => void toggleFavorite(featuredRecipe)}
                    title={featuredRecipe.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة ♥'}
                    aria-label="المفضلة"
                  >
                    <Heart size={15} fill={featuredRecipe.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <h3 className="home-meal-hero-title">
                <Link to={`/home/recipes?recipe=${encodeURIComponent(featuredRecipe.id)}`}>
                  {featuredRecipe.title}
                </Link>
              </h3>

              <p className="home-meal-hero-desc">
                {featuredRecipe.ingredients.length
                  ? `المكونات: ${featuredRecipe.ingredients.slice(0, 5).map(i => i.name).join(' • ')}`
                  : 'أكلة مسجلة في مفضلتك المنزلية.'}
              </p>

              {/* أزرار التفاعل الموحدة في نفس السطر تماماً */}
              <div className="home-meal-hero-actions">
                <Link
                  to={`/home/recipes?recipe=${encodeURIComponent(featuredRecipe.id)}`}
                  className="home-primary-button home-hero-action-btn"
                >
                  <span>عرض الوصفة</span>
                  <ArrowLeft size={14} />
                </Link>

                <button
                  type="button"
                  className="home-secondary-button home-hero-action-btn"
                  onClick={randomizeMeal}
                  title="اقتراح أكلة بديلة عشوائية من المفضلة"
                >
                  <Dices size={14} />
                  <span>اقترح غيرها</span>
                </button>

                {featuredRecipe.ingredients.length > 0 && (
                  <button
                    type="button"
                    className="home-secondary-button home-hero-action-btn"
                    disabled={busy === 'ingredients'}
                    onClick={() => void sendIngredientsToShopping(featuredRecipe)}
                    title="نقل مقادير هذه الطبخة لقائمة المشتريات"
                  >
                    <ShoppingBasket size={14} />
                    <span>نقل للمشتريات</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="home-inline-empty">
            <BookOpen size={28} />
            <div>
              <h3>لا توجد وصفات بعد</h3>
              <p>سجّل أكلاتك المفضلة لتظهر لك اقتراحات الوجبات يوميًا بضغطة زر.</p>
            </div>
            <Link to="/home/recipes?new=1" className="home-primary-button">
              إضافة أول وصفة
            </Link>
          </div>
        )}

        {/* شريط مصغر للأكلات المقترحة الأخرى */}
        {recipes.length > 1 && (
          <div className="home-other-recipes-row">
            <span className="home-other-recipes-label">
              <UtensilsCrossed size={14} /> مقترحات أخرى تناسب اليوم:
            </span>
            <div className="home-other-recipes-list">
              {recipes
                .filter(r => r.id !== featuredRecipe?.id)
                .slice(0, 4)
                .map(r => (
                  <Link
                    key={r.id}
                    to={`/home/recipes?recipe=${encodeURIComponent(r.id)}`}
                    className="home-mini-recipe-card"
                  >
                    <span className="home-mini-mark">
                      {MEAL_TYPES.find(t => r.mealTypes.includes(t.id))?.icon ?? '🍽️'}
                    </span>
                    <div className="min-w-0">
                      <strong>{r.title}</strong>
                      <small>{r.durationMinutes ? `${r.durationMinutes} دقيقة` : 'سهلة'}</small>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* العمودان السفليان: المشتريات + المطلوب اليوم */}
      <div className="home-overview-columns">
        {/* كارت المشتريات */}
        <section className="home-panel home-overview-col-panel">
          <div className="home-panel-heading">
            <div>
              <span className="home-eyebrow">
                <ShoppingBasket size={16} /> المشتريات
              </span>
              <h2>احتياجات المنزل</h2>
            </div>
            <Link className="home-text-link home-all-recipes-link" to="/home/shopping">
              <span>فتح القائمة ({shopping.length})</span>
              <ArrowLeft size={16} />
            </Link>
          </div>

          {/* شريط الإضافة والفلترة في نفس الصف */}
          <div className="home-shopping-action-row">
            <Select
              value={shoppingFilter}
              onChange={setShoppingFilter}
              className="home-shopping-select"
              options={[
                { value: 'pending', label: `لم يُشترَ (${pendingShopping.length})` },
                { value: 'completed', label: `تم الشراء (${completedShopping.length})` },
                { value: 'all', label: `الكل (${allShoppingTasks.length})` }
              ]}
            />
            <QuickInlineAdd
              placeholder="أضف طلبًا سريعًا…"
              buttonText="إضافة"
              loading={busy === 'quick_shop'}
              onAdd={addQuickShopItem}
              className="home-shopping-quick-add"
            />
          </div>

          {displayedShopping.length ? (
            <div
              className={`home-short-list-wrap ${shoppingScroll.top ? 'has-shadow-top' : ''} ${
                shoppingScroll.bottom ? 'has-shadow-bottom' : ''
              }`}
            >
              <ul
                ref={shoppingListRef}
                onScroll={updateShoppingScroll}
                className="home-short-list-scrollable"
              >
                {displayedShopping.map(task => {
                  const parsed = parseShoppingTitle(task.title);
                  const isDone = isHomeTaskDone(task, today);
                  return (
                    <li
                      key={task.id}
                      className={`home-short-list-item ${isDone ? 'is-task-done' : ''}`}
                    >
                      <button
                        type="button"
                        className={`home-check-circle ${isDone ? 'is-checked' : ''}`}
                        aria-label={isDone ? `إلغاء شراء ${parsed.name}` : `شراء ${parsed.name}`}
                        disabled={!!busy}
                        onClick={() => void toggleTask(task)}
                        title={isDone ? 'انقر لإلغاء الشطب' : 'انقر للشطب عند الشراء'}
                      >
                        <Check size={13} className="home-check-icon" />
                      </button>
                      <div className="home-short-list-item-content">
                        <span className="home-short-item-title">{parsed.name}</span>
                        {parsed.quantity && (
                          <span className="home-shopping-qty-badge">{parsed.quantity}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="home-empty-card">
              <div className="home-empty-check-icon">
                <ShoppingBasket size={24} />
              </div>
              <h4>
                {shoppingFilter === 'completed'
                  ? 'لا توجد مشتريات مكتملة اليوم'
                  : 'قائمة المشتريات خالية'}
              </h4>
              <p>
                {shoppingFilter === 'completed'
                  ? 'الأغراض التي تشتريها وتشطبها تظهر هنا.'
                  : 'كل احتياجات البيت متوفرة ومسجلة.'}
              </p>
              {shoppingFilter !== 'completed' && (
                <Link to="/home/shopping" className="home-secondary-button home-empty-action-btn">
                  <Plus size={14} /> إضافة احتياجات للمنزل
                </Link>
              )}
            </div>
          )}
        </section>

        {/* كارت إدارة أعمال المنزل */}
        <section className="home-panel home-overview-col-panel">
          <div className="home-panel-heading">
            <div>
              <span className="home-eyebrow">
                <ListChecks size={16} /> إدارة المنزل
              </span>
              <h2>المطلوب اليوم</h2>
            </div>
            <Link className="home-text-link home-all-recipes-link" to="/home/tasks">
              <span>كل المهام</span>
              <ArrowLeft size={16} />
            </Link>
          </div>

          {due.length ? (
            <div
              className={`home-short-list-wrap ${tasksScroll.top ? 'has-shadow-top' : ''} ${
                tasksScroll.bottom ? 'has-shadow-bottom' : ''
              }`}
            >
              <ul
                ref={tasksListRef}
                onScroll={updateTasksScroll}
                className="home-short-list-scrollable"
              >
                {due.map(task => (
                  <li key={task.id} className="home-short-list-item">
                    <button
                      type="button"
                      className="home-check-circle"
                      disabled={!!busy}
                      aria-label={`إكمال ${task.title}`}
                      onClick={() => void toggleTask(task)}
                      title="انقر لإكمال المهمة"
                    >
                      <Check size={13} className="home-check-icon" />
                    </button>
                    <div className="home-short-list-item-content">
                      <span className="home-short-item-title">{task.title}</span>
                      <span className="home-task-due-badge">
                        <Clock3 size={11} />
                        {task.dueDate && task.dueDate < today
                          ? 'متأخرة'
                          : task.isRecurring
                          ? 'روتين اليوم'
                          : 'اليوم'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="home-empty-card">
              <div className="home-empty-check-icon">
                <Check size={24} />
              </div>
              <h4>جميع أعمال اليوم منجزة! ✨</h4>
              <p>لا توجد مهام مستحقة في البيت اليوم، استمتع بوقتك مع الأسرة.</p>
              <Link to="/home/tasks" className="home-secondary-button home-empty-action-btn">
                <Plus size={14} /> إضافة مهمة منزلية
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
