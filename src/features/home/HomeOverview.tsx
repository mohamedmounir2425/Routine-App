import { HomeStack } from './components/HomeLayouts';
import { HomeButton } from './components/HomeButton';
import { HomeCompletion } from './components/HomeCompletion';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { liveQuery } from 'dexie';
import { Link } from 'react-router-dom';
import { App } from 'antd';
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
import { isSpaceTaskDue } from '../../shared/tasks/taskCalendar';
import { inventoryFlags, type InventoryItem } from './inventory/inventoryModel';
import { parseShoppingTitle } from './tasks/HomeTasksView';
import { toggleRecipeFavorite } from './recipes/recipeRepository';
import { HomeCompactSearch } from './components/HomeInputs';

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
  const [shoppingDraft, setShoppingDraft] = useState('');
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
    return recipes.filter(r => r.mealTypes.some(type => type === selectedMealFilter));
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
      setShoppingDraft('');
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
    <HomeStack className="home-overview flex flex-col gap-5 [.home-space_&]:gap-4" dir="rtl">
      {/* 🌟 Household Vital Stats Bar (نبض البيت) */}
      <section className="home-pulse-bar grid grid-cols-[repeat(3,__1fr)] gap-3 min-[769px]:max-[1024.01px]:!gap-2.5 max-[768.01px]:grid-cols-[repeat(3,_!_1fr)] max-[768.01px]:!gap-[7px] max-[480.01px]:!gap-[5px]" aria-label="ملخص حالة المنزل اليوم">
        <Link to="/home/shopping" className="home-pulse-card is-shopping flex items-center justify-between gap-3 bg-home-panel border border-solid border-home-border rounded-home-panel p-[12px_16px] no-underline text-home-text [transition:all_.15s_ease] min-w-0 [box-shadow:0_1px_3px_rgba(0,_0,_0,_0.03)] hover:border-home-accent hover:[transform:translateY(-1px)] [&.is-shopping]:bg-[rgba(227,__162,__123,__0.1)] [&.is-shopping]:border-[rgba(227,__162,__123,__0.4)] [&.is-inventory]:bg-[rgba(180,__199,__151,__0.14)] [&.is-inventory]:border-[rgba(180,__199,__151,__0.42)] [&.is-tasks]:bg-[rgba(147,__197,__253,__0.12)] [&.is-tasks]:border-[rgba(147,__197,__253,__0.42)] min-[769px]:max-[1024.01px]:!p-[10px_14px] min-[769px]:max-[1024.01px]:!gap-2 min-[769px]:max-[1024.01px]:!rounded-home-control max-[768.01px]:!flex-col max-[768.01px]:!items-start max-[768.01px]:!justify-center max-[768.01px]:!gap-1 max-[768.01px]:!p-[8px_10px] max-[768.01px]:!rounded-home-control max-[768.01px]:!min-h-14.5 max-[480.01px]:!p-[7px_8px] max-[480.01px]:!gap-[3px]">
          <div className="home-pulse-header flex items-center gap-2.5 min-w-0 max-[768.01px]:!flex max-[768.01px]:!items-center max-[768.01px]:!gap-[5px] max-[768.01px]:!w-full">
            <div className="home-pulse-icon is-shopping w-8.5 h-8.5 rounded-[10px] grid place-items-center shrink-0 [&_svg]:w-[17px] [&_svg]:h-[17px] [&.is-shopping]:bg-[rgba(227,__162,__123,__0.28)] [&.is-shopping]:text-home-accent [&.is-inventory]:bg-[rgba(180,__199,__151,__0.35)] [&.is-inventory]:text-home-green [&.is-tasks]:bg-[rgba(147,__197,__253,__0.35)] [&.is-tasks]:text-[#2563eb] [html.dark_&.is-tasks]:text-[#60a5fa] min-[769px]:max-[1024.01px]:!w-7.5 min-[769px]:max-[1024.01px]:!h-7.5 min-[769px]:max-[1024.01px]:!rounded-[8px] min-[769px]:max-[1024.01px]:[&_svg]:!w-[15px] min-[769px]:max-[1024.01px]:[&_svg]:!h-[15px] max-[768.01px]:!w-5 max-[768.01px]:!h-5 max-[768.01px]:!rounded-[6px] max-[768.01px]:[&_svg]:!w-3 max-[768.01px]:[&_svg]:!h-3 max-[480.01px]:!w-4.5 max-[480.01px]:!h-4.5 max-[480.01px]:[&_svg]:!w-[11px] max-[480.01px]:[&_svg]:!h-[11px]">
              <ShoppingBasket size={14} />
            </div>
            <span className="home-pulse-title text-[13px] text-home-text font-bold whitespace-nowrap min-[769px]:max-[1024.01px]:!text-[12px] max-[768.01px]:!text-[10.5px] max-[768.01px]:!font-bold max-[768.01px]:!text-home-muted max-[768.01px]:!whitespace-nowrap max-[768.01px]:!overflow-hidden max-[768.01px]:!text-ellipsis max-[480.01px]:!text-[9.5px]">المشتريات</span>
          </div>
          <div className="home-pulse-value flex items-baseline shrink-0 max-[768.01px]:!w-full">
            {shopping.length ? (
              <span className="home-pulse-metric is-shopping inline-flex items-baseline gap-[3px] whitespace-nowrap [&_strong]:text-[18px] [&_strong]:font-extrabold [&_strong]:leading-[1] [&_small]:text-[12px] [&_small]:font-bold [&_small]:text-home-muted [&.is-shopping_strong]:text-home-accent [&.is-inventory_strong]:text-home-green [&.is-tasks_strong]:text-[#2563eb] [html.dark_&.is-tasks_strong]:text-[#60a5fa] [&.is-urgent_strong]:text-[#d97706] [html.dark_&.is-urgent_strong]:text-[#fbbf24] [&.is-done]:text-home-green [&.is-done]:text-[12px] [&.is-done]:font-bold [&.is-done]:inline-flex [&.is-done]:items-center [&.is-done]:gap-1 min-[769px]:max-[1024.01px]:[&_strong]:!text-[16px] min-[769px]:max-[1024.01px]:[&_small]:!text-[11px] max-[768.01px]:!inline-flex max-[768.01px]:!items-baseline max-[768.01px]:!gap-[3px] max-[768.01px]:!whitespace-nowrap max-[768.01px]:[&_strong]:!text-[15px] max-[768.01px]:[&_strong]:!font-extrabold max-[768.01px]:[&_strong]:!leading-[1] max-[768.01px]:[&_small]:!text-[10.5px] max-[768.01px]:[&_small]:!font-bold max-[768.01px]:[&.is-done]:!text-[11px] max-[480.01px]:[&_strong]:!text-[14px] max-[480.01px]:[&_small]:!text-[10px]">
                <strong>{shopping.length}</strong> <small>نواقص</small>
              </span>
            ) : (
              <span className="home-pulse-metric is-done inline-flex items-baseline gap-[3px] whitespace-nowrap [&_strong]:text-[18px] [&_strong]:font-extrabold [&_strong]:leading-[1] [&_small]:text-[12px] [&_small]:font-bold [&_small]:text-home-muted [&.is-shopping_strong]:text-home-accent [&.is-inventory_strong]:text-home-green [&.is-tasks_strong]:text-[#2563eb] [html.dark_&.is-tasks_strong]:text-[#60a5fa] [&.is-urgent_strong]:text-[#d97706] [html.dark_&.is-urgent_strong]:text-[#fbbf24] [&.is-done]:text-home-green [&.is-done]:text-[12px] [&.is-done]:font-bold [&.is-done]:inline-flex [&.is-done]:items-center [&.is-done]:gap-1 min-[769px]:max-[1024.01px]:[&_strong]:!text-[16px] min-[769px]:max-[1024.01px]:[&_small]:!text-[11px] max-[768.01px]:!inline-flex max-[768.01px]:!items-baseline max-[768.01px]:!gap-[3px] max-[768.01px]:!whitespace-nowrap max-[768.01px]:[&_strong]:!text-[15px] max-[768.01px]:[&_strong]:!font-extrabold max-[768.01px]:[&_strong]:!leading-[1] max-[768.01px]:[&_small]:!text-[10.5px] max-[768.01px]:[&_small]:!font-bold max-[768.01px]:[&.is-done]:!text-[11px] max-[480.01px]:[&_strong]:!text-[14px] max-[480.01px]:[&_small]:!text-[10px]">
                <Check size={13} /> <small>مكتملة</small>
              </span>
            )}
          </div>
        </Link>

        <Link to="/home/inventory" className="home-pulse-card is-inventory flex items-center justify-between gap-3 bg-home-panel border border-solid border-home-border rounded-home-panel p-[12px_16px] no-underline text-home-text [transition:all_.15s_ease] min-w-0 [box-shadow:0_1px_3px_rgba(0,_0,_0,_0.03)] hover:border-home-accent hover:[transform:translateY(-1px)] [&.is-shopping]:bg-[rgba(227,__162,__123,__0.1)] [&.is-shopping]:border-[rgba(227,__162,__123,__0.4)] [&.is-inventory]:bg-[rgba(180,__199,__151,__0.14)] [&.is-inventory]:border-[rgba(180,__199,__151,__0.42)] [&.is-tasks]:bg-[rgba(147,__197,__253,__0.12)] [&.is-tasks]:border-[rgba(147,__197,__253,__0.42)] min-[769px]:max-[1024.01px]:!p-[10px_14px] min-[769px]:max-[1024.01px]:!gap-2 min-[769px]:max-[1024.01px]:!rounded-home-control max-[768.01px]:!flex-col max-[768.01px]:!items-start max-[768.01px]:!justify-center max-[768.01px]:!gap-1 max-[768.01px]:!p-[8px_10px] max-[768.01px]:!rounded-home-control max-[768.01px]:!min-h-14.5 max-[480.01px]:!p-[7px_8px] max-[480.01px]:!gap-[3px]">
          <div className="home-pulse-header flex items-center gap-2.5 min-w-0 max-[768.01px]:!flex max-[768.01px]:!items-center max-[768.01px]:!gap-[5px] max-[768.01px]:!w-full">
            <div className="home-pulse-icon is-inventory w-8.5 h-8.5 rounded-[10px] grid place-items-center shrink-0 [&_svg]:w-[17px] [&_svg]:h-[17px] [&.is-shopping]:bg-[rgba(227,__162,__123,__0.28)] [&.is-shopping]:text-home-accent [&.is-inventory]:bg-[rgba(180,__199,__151,__0.35)] [&.is-inventory]:text-home-green [&.is-tasks]:bg-[rgba(147,__197,__253,__0.35)] [&.is-tasks]:text-[#2563eb] [html.dark_&.is-tasks]:text-[#60a5fa] min-[769px]:max-[1024.01px]:!w-7.5 min-[769px]:max-[1024.01px]:!h-7.5 min-[769px]:max-[1024.01px]:!rounded-[8px] min-[769px]:max-[1024.01px]:[&_svg]:!w-[15px] min-[769px]:max-[1024.01px]:[&_svg]:!h-[15px] max-[768.01px]:!w-5 max-[768.01px]:!h-5 max-[768.01px]:!rounded-[6px] max-[768.01px]:[&_svg]:!w-3 max-[768.01px]:[&_svg]:!h-3 max-[480.01px]:!w-4.5 max-[480.01px]:!h-4.5 max-[480.01px]:[&_svg]:!w-[11px] max-[480.01px]:[&_svg]:!h-[11px]">
              <Archive size={14} />
            </div>
            <span className="home-pulse-title text-[13px] text-home-text font-bold whitespace-nowrap min-[769px]:max-[1024.01px]:!text-[12px] max-[768.01px]:!text-[10.5px] max-[768.01px]:!font-bold max-[768.01px]:!text-home-muted max-[768.01px]:!whitespace-nowrap max-[768.01px]:!overflow-hidden max-[768.01px]:!text-ellipsis max-[480.01px]:!text-[9.5px]">المخزون</span>
          </div>
          <div className="home-pulse-value flex items-baseline shrink-0 max-[768.01px]:!w-full">
            {urgentInventory.length ? (
              <span className="home-pulse-metric is-urgent inline-flex items-baseline gap-[3px] whitespace-nowrap [&_strong]:text-[18px] [&_strong]:font-extrabold [&_strong]:leading-[1] [&_small]:text-[12px] [&_small]:font-bold [&_small]:text-home-muted [&.is-shopping_strong]:text-home-accent [&.is-inventory_strong]:text-home-green [&.is-tasks_strong]:text-[#2563eb] [html.dark_&.is-tasks_strong]:text-[#60a5fa] [&.is-urgent_strong]:text-[#d97706] [html.dark_&.is-urgent_strong]:text-[#fbbf24] [&.is-done]:text-home-green [&.is-done]:text-[12px] [&.is-done]:font-bold [&.is-done]:inline-flex [&.is-done]:items-center [&.is-done]:gap-1 min-[769px]:max-[1024.01px]:[&_strong]:!text-[16px] min-[769px]:max-[1024.01px]:[&_small]:!text-[11px] max-[768.01px]:!inline-flex max-[768.01px]:!items-baseline max-[768.01px]:!gap-[3px] max-[768.01px]:!whitespace-nowrap max-[768.01px]:[&_strong]:!text-[15px] max-[768.01px]:[&_strong]:!font-extrabold max-[768.01px]:[&_strong]:!leading-[1] max-[768.01px]:[&_small]:!text-[10.5px] max-[768.01px]:[&_small]:!font-bold max-[768.01px]:[&.is-done]:!text-[11px] max-[480.01px]:[&_strong]:!text-[14px] max-[480.01px]:[&_small]:!text-[10px]">
                <strong>{urgentInventory.length}</strong> <small>للاستهلاك</small>
              </span>
            ) : (
              <span className="home-pulse-metric is-inventory inline-flex items-baseline gap-[3px] whitespace-nowrap [&_strong]:text-[18px] [&_strong]:font-extrabold [&_strong]:leading-[1] [&_small]:text-[12px] [&_small]:font-bold [&_small]:text-home-muted [&.is-shopping_strong]:text-home-accent [&.is-inventory_strong]:text-home-green [&.is-tasks_strong]:text-[#2563eb] [html.dark_&.is-tasks_strong]:text-[#60a5fa] [&.is-urgent_strong]:text-[#d97706] [html.dark_&.is-urgent_strong]:text-[#fbbf24] [&.is-done]:text-home-green [&.is-done]:text-[12px] [&.is-done]:font-bold [&.is-done]:inline-flex [&.is-done]:items-center [&.is-done]:gap-1 min-[769px]:max-[1024.01px]:[&_strong]:!text-[16px] min-[769px]:max-[1024.01px]:[&_small]:!text-[11px] max-[768.01px]:!inline-flex max-[768.01px]:!items-baseline max-[768.01px]:!gap-[3px] max-[768.01px]:!whitespace-nowrap max-[768.01px]:[&_strong]:!text-[15px] max-[768.01px]:[&_strong]:!font-extrabold max-[768.01px]:[&_strong]:!leading-[1] max-[768.01px]:[&_small]:!text-[10.5px] max-[768.01px]:[&_small]:!font-bold max-[768.01px]:[&.is-done]:!text-[11px] max-[480.01px]:[&_strong]:!text-[14px] max-[480.01px]:[&_small]:!text-[10px]">
                <strong>{inventory.length}</strong> <small>صنف</small>
              </span>
            )}
          </div>
        </Link>

        <Link to="/home/tasks" className="home-pulse-card is-tasks flex items-center justify-between gap-3 bg-home-panel border border-solid border-home-border rounded-home-panel p-[12px_16px] no-underline text-home-text [transition:all_.15s_ease] min-w-0 [box-shadow:0_1px_3px_rgba(0,_0,_0,_0.03)] hover:border-home-accent hover:[transform:translateY(-1px)] [&.is-shopping]:bg-[rgba(227,__162,__123,__0.1)] [&.is-shopping]:border-[rgba(227,__162,__123,__0.4)] [&.is-inventory]:bg-[rgba(180,__199,__151,__0.14)] [&.is-inventory]:border-[rgba(180,__199,__151,__0.42)] [&.is-tasks]:bg-[rgba(147,__197,__253,__0.12)] [&.is-tasks]:border-[rgba(147,__197,__253,__0.42)] min-[769px]:max-[1024.01px]:!p-[10px_14px] min-[769px]:max-[1024.01px]:!gap-2 min-[769px]:max-[1024.01px]:!rounded-home-control max-[768.01px]:!flex-col max-[768.01px]:!items-start max-[768.01px]:!justify-center max-[768.01px]:!gap-1 max-[768.01px]:!p-[8px_10px] max-[768.01px]:!rounded-home-control max-[768.01px]:!min-h-14.5 max-[480.01px]:!p-[7px_8px] max-[480.01px]:!gap-[3px]">
          <div className="home-pulse-header flex items-center gap-2.5 min-w-0 max-[768.01px]:!flex max-[768.01px]:!items-center max-[768.01px]:!gap-[5px] max-[768.01px]:!w-full">
            <div className="home-pulse-icon is-tasks w-8.5 h-8.5 rounded-[10px] grid place-items-center shrink-0 [&_svg]:w-[17px] [&_svg]:h-[17px] [&.is-shopping]:bg-[rgba(227,__162,__123,__0.28)] [&.is-shopping]:text-home-accent [&.is-inventory]:bg-[rgba(180,__199,__151,__0.35)] [&.is-inventory]:text-home-green [&.is-tasks]:bg-[rgba(147,__197,__253,__0.35)] [&.is-tasks]:text-[#2563eb] [html.dark_&.is-tasks]:text-[#60a5fa] min-[769px]:max-[1024.01px]:!w-7.5 min-[769px]:max-[1024.01px]:!h-7.5 min-[769px]:max-[1024.01px]:!rounded-[8px] min-[769px]:max-[1024.01px]:[&_svg]:!w-[15px] min-[769px]:max-[1024.01px]:[&_svg]:!h-[15px] max-[768.01px]:!w-5 max-[768.01px]:!h-5 max-[768.01px]:!rounded-[6px] max-[768.01px]:[&_svg]:!w-3 max-[768.01px]:[&_svg]:!h-3 max-[480.01px]:!w-4.5 max-[480.01px]:!h-4.5 max-[480.01px]:[&_svg]:!w-[11px] max-[480.01px]:[&_svg]:!h-[11px]">
              <ListChecks size={14} />
            </div>
            <span className="home-pulse-title text-[13px] text-home-text font-bold whitespace-nowrap min-[769px]:max-[1024.01px]:!text-[12px] max-[768.01px]:!text-[10.5px] max-[768.01px]:!font-bold max-[768.01px]:!text-home-muted max-[768.01px]:!whitespace-nowrap max-[768.01px]:!overflow-hidden max-[768.01px]:!text-ellipsis max-[480.01px]:!text-[9.5px]">أعمال اليوم</span>
          </div>
          <div className="home-pulse-value flex items-baseline shrink-0 max-[768.01px]:!w-full">
            {due.length ? (
              <span className="home-pulse-metric is-tasks inline-flex items-baseline gap-[3px] whitespace-nowrap [&_strong]:text-[18px] [&_strong]:font-extrabold [&_strong]:leading-[1] [&_small]:text-[12px] [&_small]:font-bold [&_small]:text-home-muted [&.is-shopping_strong]:text-home-accent [&.is-inventory_strong]:text-home-green [&.is-tasks_strong]:text-[#2563eb] [html.dark_&.is-tasks_strong]:text-[#60a5fa] [&.is-urgent_strong]:text-[#d97706] [html.dark_&.is-urgent_strong]:text-[#fbbf24] [&.is-done]:text-home-green [&.is-done]:text-[12px] [&.is-done]:font-bold [&.is-done]:inline-flex [&.is-done]:items-center [&.is-done]:gap-1 min-[769px]:max-[1024.01px]:[&_strong]:!text-[16px] min-[769px]:max-[1024.01px]:[&_small]:!text-[11px] max-[768.01px]:!inline-flex max-[768.01px]:!items-baseline max-[768.01px]:!gap-[3px] max-[768.01px]:!whitespace-nowrap max-[768.01px]:[&_strong]:!text-[15px] max-[768.01px]:[&_strong]:!font-extrabold max-[768.01px]:[&_strong]:!leading-[1] max-[768.01px]:[&_small]:!text-[10.5px] max-[768.01px]:[&_small]:!font-bold max-[768.01px]:[&.is-done]:!text-[11px] max-[480.01px]:[&_strong]:!text-[14px] max-[480.01px]:[&_small]:!text-[10px]">
                <strong>{due.length}</strong> <small>متبقية</small>
              </span>
            ) : (
              <span className="home-pulse-metric is-done inline-flex items-baseline gap-[3px] whitespace-nowrap [&_strong]:text-[18px] [&_strong]:font-extrabold [&_strong]:leading-[1] [&_small]:text-[12px] [&_small]:font-bold [&_small]:text-home-muted [&.is-shopping_strong]:text-home-accent [&.is-inventory_strong]:text-home-green [&.is-tasks_strong]:text-[#2563eb] [html.dark_&.is-tasks_strong]:text-[#60a5fa] [&.is-urgent_strong]:text-[#d97706] [html.dark_&.is-urgent_strong]:text-[#fbbf24] [&.is-done]:text-home-green [&.is-done]:text-[12px] [&.is-done]:font-bold [&.is-done]:inline-flex [&.is-done]:items-center [&.is-done]:gap-1 min-[769px]:max-[1024.01px]:[&_strong]:!text-[16px] min-[769px]:max-[1024.01px]:[&_small]:!text-[11px] max-[768.01px]:!inline-flex max-[768.01px]:!items-baseline max-[768.01px]:!gap-[3px] max-[768.01px]:!whitespace-nowrap max-[768.01px]:[&_strong]:!text-[15px] max-[768.01px]:[&_strong]:!font-extrabold max-[768.01px]:[&_strong]:!leading-[1] max-[768.01px]:[&_small]:!text-[10.5px] max-[768.01px]:[&_small]:!font-bold max-[768.01px]:[&.is-done]:!text-[11px] max-[480.01px]:[&_strong]:!text-[14px] max-[480.01px]:[&_small]:!text-[10px]">
                <Check size={13} /> <small>منجزة</small>
              </span>
            )}
          </div>
        </Link>
      </section>

      {/* 💡 Smart Pantry Alert (لو فيه أصناف أوشكت على الانتهاء) */}
      {urgentInventory.length > 0 && (
        <div className="home-pantry-alert flex items-center justify-between gap-2 bg-[rgba(227,__162,__123,__0.08)] border border-solid border-home-border rounded-[10px] p-[6px_12px] text-[11.5px] text-home-text min-h-8">
          <div className="home-pantry-alert-content flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [&_p]:m-0 [&_p]:text-[11px] [&_p]:overflow-hidden [&_p]:text-ellipsis [&_p]:whitespace-nowrap">
            <Sparkles size={14} className="text-amber-500 shrink-0" />
            <p>
              يُفضل استهلاكها أولًا:{' '}
              <strong>{urgentInventory.slice(0, 3).map(i => i.name).join('، ')}</strong>
              {urgentInventory.length > 3 ? ` (+${urgentInventory.length - 3})` : ''}
            </p>
          </div>
          <Link to="/home/inventory?filter=first" className="home-pantry-alert-btn inline-flex items-center gap-1 p-[3px_8px] rounded-[6px] bg-home-panel border border-solid border-home-border text-home-accent text-[10.5px] font-bold no-underline whitespace-nowrap shrink-0 [transition:all_.15s_ease] hover:border-home-accent hover:bg-home-selection">
            <span>معاينة النواقص</span>
            <ArrowLeft size={12} />
          </Link>
        </div>
      )}

      {/* 🍲 قسم "ماذا نأكل اليوم؟" البطل التفاعلي */}
      <section className="home-kitchen-preview !bg-transparent ![border:0] !p-0 !shadow-none">
        <div className="home-panel-heading !flex !items-start !justify-between !gap-3.5 !mb-3 !w-full [&>div]:flex-1 [&>div]:min-w-0 [&_h2]:!text-[19px] [&_h2]:!font-extrabold [&_h2]:!m-[2px_0_0] [&_h2]:!leading-[1.4] [&_p]:!text-[12px] [&_p]:!text-home-muted [&_p]:!m-[3px_0_0] [&_p]:!leading-[1.5] max-[600.01px]:[&_h2]:text-[21px] [.home-space_&]:!bg-transparent [.home-space_&]:!shadow-none [.home-space_&_h2]:text-[20px]">
          <div>
            <span className="home-eyebrow text-[12px] text-home-green font-bold flex items-center gap-[7px] max-[600.01px]:[.home-header_&]:text-[10px] max-[600.01px]:[.home-welcome_p:not(&)]:text-[12px] max-[767.01px]:[.home-header_&]:hidden">
              <CookingPot size={15} /> المطبخ والوجبات
            </span>
            <h2>ماذا نأكل اليوم؟</h2>
          </div>
          <Link className="home-text-link home-all-recipes-link [.home-panel-heading_&]:!whitespace-nowrap [.home-panel-heading_&]:!inline-flex [.home-panel-heading_&]:!items-center [.home-panel-heading_&]:!gap-[5px] [.home-panel-heading_&]:!shrink-0 [.home-panel-heading_&]:!text-[11.5px] [.home-panel-heading_&]:!font-bold [.home-panel-heading_&]:!p-[5px_11px] [.home-panel-heading_&]:!rounded-[9px] [.home-panel-heading_&]:!bg-home-raised [.home-panel-heading_&]:!border [.home-panel-heading_&]:!border-solid [.home-panel-heading_&]:!border-home-border [.home-panel-heading_&]:!text-home-accent [.home-panel-heading_&]:!no-underline [.home-panel-heading_&]:!min-h-8 [.home-panel-heading_&]:mt-0.5 [.home-panel-heading_&]:![transition:all_.15s_ease] [.home-panel-heading_&:hover]:!bg-home-selection [.home-panel-heading_&:hover]:!border-home-accent max-[600.01px]:[.home-panel-heading_&]:text-[11px] max-[600.01px]:[.home-panel-heading_&]:gap-1 !whitespace-nowrap !inline-flex !items-center !gap-[5px] !shrink-0 !text-[11.5px] !font-bold !p-[5px_11px] !rounded-[9px] !bg-home-raised !border !border-solid !border-home-border !text-home-accent !no-underline !min-h-8 mt-0.5 ![transition:all_.15s_ease] hover:!bg-home-selection hover:!border-home-accent" to="/home/recipes">
            <span>كل الوصفات ({recipes.length})</span>
            <ArrowLeft size={15} />
          </Link>
        </div>

        {/* فلاتر المزاج ونوع الوجبة السريعة بشادو جانبي وبدون شريط تمرير */}
        <div
          className={`home-meal-filter-pills-wrap relative w-full mb-1 [&::before]:[content:''] [&::before]:absolute [&::before]:top-0 [&::before]:bottom-0 [&::before]:w-6 [&::before]:[pointer-events:none] [&::before]:z-[3] [&::before]:opacity-[0] [&::before]:[transition:opacity_.18s_ease] [&::before]:right-0 [&::before]:[background:linear-gradient(to_left,_rgba(0,_0,_0,_0.45)_0%,_rgba(0,_0,_0,_0.15)_60%,_transparent_100%)] [&::after]:[content:''] [&::after]:absolute [&::after]:top-0 [&::after]:bottom-0 [&::after]:w-6 [&::after]:[pointer-events:none] [&::after]:z-[3] [&::after]:opacity-[0] [&::after]:[transition:opacity_.18s_ease] [&::after]:left-0 [&::after]:[background:linear-gradient(to_right,_rgba(0,_0,_0,_0.45)_0%,_rgba(0,_0,_0,_0.15)_60%,_transparent_100%)] [html.light_&::before]:[background:linear-gradient(to_left,_rgba(70,_48,_25,_0.24)_0%,_rgba(70,_48,_25,_0.06)_60%,_transparent_100%)] [html.light_&::after]:[background:linear-gradient(to_right,_rgba(70,_48,_25,_0.24)_0%,_rgba(70,_48,_25,_0.06)_60%,_transparent_100%)] [&.has-shadow-start::before]:opacity-[1] [&.has-shadow-end::after]:opacity-[1] ${scrollShadows.start ? 'has-shadow-start' : ''} ${
            scrollShadows.end ? 'has-shadow-end' : ''
          }`}
        >
          <div
            ref={pillsRef}
            onScroll={updateScrollShadows}
            className="home-meal-filter-pills flex gap-1.5 overflow-x-auto p-[2px_0_6px] ![scrollbar-width:none] ![-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:!hidden"
            aria-label="فلاتر اقتراح الوجبة"
          >
            <HomeButton
              type="button"
              className="home-meal-pill min-h-8 p-[4px_11px] border border-solid border-home-border rounded-[16px] bg-home-raised text-home-text text-[12px] font-semibold inline-flex items-center gap-[5px] cursor-pointer whitespace-nowrap [transition:all_.15s_ease] shrink-0 hover:border-home-accent aria-pressed:!bg-home-selection aria-pressed:!border-home-accent aria-pressed:!text-home-selection-text aria-pressed:font-bold [html.light_&[aria-pressed='true']]:!bg-[#f1e4d6] [html.light_&[aria-pressed='true']]:!border-[#9a4e2d] [html.light_&[aria-pressed='true']]:!text-[#9a4e2d]"
              aria-pressed={selectedMealFilter === 'all'}
              onClick={() => setSelectedMealFilter('all')}
            >
              🍽️ الكل
            </HomeButton>
            {MEAL_TYPES.map(type => (
              <HomeButton
                key={type.id}
                type="button"
                className="home-meal-pill min-h-8 p-[4px_11px] border border-solid border-home-border rounded-[16px] bg-home-raised text-home-text text-[12px] font-semibold inline-flex items-center gap-[5px] cursor-pointer whitespace-nowrap [transition:all_.15s_ease] shrink-0 hover:border-home-accent aria-pressed:!bg-home-selection aria-pressed:!border-home-accent aria-pressed:!text-home-selection-text aria-pressed:font-bold [html.light_&[aria-pressed='true']]:!bg-[#f1e4d6] [html.light_&[aria-pressed='true']]:!border-[#9a4e2d] [html.light_&[aria-pressed='true']]:!text-[#9a4e2d]"
                aria-pressed={selectedMealFilter === type.id}
                onClick={() => setSelectedMealFilter(type.id)}
              >
                <span aria-hidden="true">{type.icon}</span> {type.label}
              </HomeButton>
            ))}
            <HomeButton
              type="button"
              className="home-meal-pill min-h-8 p-[4px_11px] border border-solid border-home-border rounded-[16px] bg-home-raised text-home-text text-[12px] font-semibold inline-flex items-center gap-[5px] cursor-pointer whitespace-nowrap [transition:all_.15s_ease] shrink-0 hover:border-home-accent aria-pressed:!bg-home-selection aria-pressed:!border-home-accent aria-pressed:!text-home-selection-text aria-pressed:font-bold [html.light_&[aria-pressed='true']]:!bg-[#f1e4d6] [html.light_&[aria-pressed='true']]:!border-[#9a4e2d] [html.light_&[aria-pressed='true']]:!text-[#9a4e2d]"
              aria-pressed={selectedMealFilter === 'quick'}
              onClick={() => setSelectedMealFilter('quick')}
            >
              ⚡ سريعة (&lt;30د)
            </HomeButton>
            <HomeButton
              type="button"
              className="home-meal-pill min-h-8 p-[4px_11px] border border-solid border-home-border rounded-[16px] bg-home-raised text-home-text text-[12px] font-semibold inline-flex items-center gap-[5px] cursor-pointer whitespace-nowrap [transition:all_.15s_ease] shrink-0 hover:border-home-accent aria-pressed:!bg-home-selection aria-pressed:!border-home-accent aria-pressed:!text-home-selection-text aria-pressed:font-bold [html.light_&[aria-pressed='true']]:!bg-[#f1e4d6] [html.light_&[aria-pressed='true']]:!border-[#9a4e2d] [html.light_&[aria-pressed='true']]:!text-[#9a4e2d]"
              aria-pressed={selectedMealFilter === 'light'}
              onClick={() => setSelectedMealFilter('light')}
            >
              🌿 خفيفة
            </HomeButton>
          </div>
        </div>

        {loading ? (
          <p role="status" className="home-empty flex flex-col items-center gap-2.5 p-[28px_14px] text-home-muted text-[14px] text-center [&>svg]:text-home-green [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-home-text">
            جارٍ تحميل المقترحات…
          </p>
        ) : featuredRecipe ? (
          <div className={`home-meal-hero bg-home-raised border border-solid border-home-border rounded-[16px] p-3.5 mt-2.5 [&.has-cover]:grid [&.has-cover]:grid-cols-[150px_1fr] [&.has-cover]:gap-3.5 [&.has-cover]:items-center [&.no-cover]:flex [&.no-cover]:flex-col [&.no-cover]:gap-2 max-[768.01px]:[&.has-cover]:!flex max-[768.01px]:[&.has-cover]:!flex-col max-[768.01px]:[&.has-cover]:!gap-3 ${hasCoverImage ? 'has-cover' : 'no-cover'}`}>
            {hasCoverImage && (
              <div className="home-meal-hero-cover w-full h-30 rounded-home-control overflow-hidden bg-home-panel border border-solid border-home-border max-[768.01px]:!w-full max-[768.01px]:!h-35 max-[768.01px]:!rounded-home-control">
                <img
                  src={safeMediaUrl(featuredRecipe.imageUrl)}
                  alt={featuredRecipe.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="home-meal-hero-img w-full h-full object-cover"
                />
              </div>
            )}

            <div className="home-meal-hero-body flex flex-col gap-[7px] min-w-0 max-[768.01px]:!w-full">
              <div className="home-meal-hero-head flex items-center justify-between gap-2">
                <div className="home-meal-hero-tags flex items-center gap-1.5 flex-wrap">
                  <span className="home-hero-badge inline-flex items-center gap-1 text-[10.5px] font-bold p-[2px_7px] rounded-[6px] bg-home-panel text-home-text border border-solid border-home-border whitespace-nowrap shrink-0">
                    <span aria-hidden="true">{featuredIcon}</span>
                    <span>مقترح {mealPeriodInfo.label}</span>
                  </span>
                  {featuredRecipe.durationMinutes && (
                    <span className="home-hero-tag inline-flex items-center gap-[3px] text-[10.5px] text-home-muted bg-home-panel p-[2px_6px] rounded-[6px] border border-solid border-home-border">
                      <Clock3 size={11} /> {featuredRecipe.durationMinutes} دقيقة
                    </span>
                  )}
                  {featuredRecipe.isLight && <span className="home-hero-tag inline-flex items-center gap-[3px] text-[10.5px] text-home-muted bg-home-panel p-[2px_6px] rounded-[6px] border border-solid border-home-border">🌿 خفيفة</span>}
                </div>

                <div className="home-meal-hero-corner-actions flex items-center gap-[5px] shrink-0">
                  <HomeButton icon={<Pin size={15} />}
                    type="button"
                    className={`home-hero-icon-btn w-7 h-7 rounded-[8px] grid place-items-center bg-home-panel border border-solid border-home-border text-home-muted cursor-pointer [transition:all_.15s_ease] hover:border-home-accent hover:text-home-text hover:[transform:scale(1.05)] [&.is-active-pin]:bg-[rgba(234,__179,__8,_!_0.16)] [&.is-active-pin]:!border-[#facc15] [&.is-active-pin]:!text-[#b45309] [html.dark_&.is-active-pin]:!text-[#facc15] [&.is-active-fav]:bg-[rgba(244,__63,__94,_!_0.14)] [&.is-active-fav]:!border-[#f43f5e] [&.is-active-fav]:!text-[#e11d48] [html.dark_&.is-active-fav]:!text-[#fb7185] ${pinnedMealId === featuredRecipe.id ? 'is-active-pin' : ''}`}
                    onClick={() => togglePinMeal(featuredRecipe.id)}
                    title={pinnedMealId === featuredRecipe.id ? 'إلغاء اعتماد وجبة اليوم' : 'تثبيت كوجبة اليوم 📌'}
                    aria-label="تثبيت وجبة اليوم"
                  >

                  </HomeButton>
                  <HomeButton icon={<Heart size={15} fill={featuredRecipe.isFavorite ? 'currentColor' : 'none'} />}
                    type="button"
                    className={`home-hero-icon-btn w-7 h-7 rounded-[8px] grid place-items-center bg-home-panel border border-solid border-home-border text-home-muted cursor-pointer [transition:all_.15s_ease] hover:border-home-accent hover:text-home-text hover:[transform:scale(1.05)] [&.is-active-pin]:bg-[rgba(234,__179,__8,_!_0.16)] [&.is-active-pin]:!border-[#facc15] [&.is-active-pin]:!text-[#b45309] [html.dark_&.is-active-pin]:!text-[#facc15] [&.is-active-fav]:bg-[rgba(244,__63,__94,_!_0.14)] [&.is-active-fav]:!border-[#f43f5e] [&.is-active-fav]:!text-[#e11d48] [html.dark_&.is-active-fav]:!text-[#fb7185] ${featuredRecipe.isFavorite ? 'is-active-fav' : ''}`}
                    onClick={() => void toggleFavorite(featuredRecipe)}
                    title={featuredRecipe.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة ♥'}
                    aria-label="المفضلة"
                  >

                  </HomeButton>
                </div>
              </div>

              <h3 className="home-meal-hero-title text-[17px] font-extrabold m-0 leading-[1.35] [&_a]:text-home-text [&_a]:no-underline [&_a:hover]:text-home-accent">
                <Link to={`/home/recipes?recipe=${encodeURIComponent(featuredRecipe.id)}`}>
                  {featuredRecipe.title}
                </Link>
              </h3>

              <p className="home-meal-hero-desc text-[11.5px] text-home-muted leading-[1.5] m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {featuredRecipe.ingredients.length
                  ? `المكونات: ${featuredRecipe.ingredients.slice(0, 5).map(i => i.name).join(' • ')}`
                  : 'أكلة مسجلة في مفضلتك المنزلية.'}
              </p>

              {/* أزرار التفاعل الموحدة في نفس السطر تماماً */}
              <div className="home-meal-hero-actions !flex !items-center !gap-1.5 !mt-1 !w-full [&>*]:!flex-[1_1_0] [&>*]:!min-w-0 max-[768.01px]:!mt-1.5 max-[768.01px]:!w-full max-[768.01px]:!flex max-[768.01px]:!gap-1.5">
                <Link
                  to={`/home/recipes?recipe=${encodeURIComponent(featuredRecipe.id)}`}
                  className="home-primary-button home-hero-action-btn inline-flex items-center gap-2 font-bold no-underline bg-home-button border border-solid border-home-button text-home-button-text hover:bg-home-button-hover [.home-quick-add_&]:min-h-9 [.home-quick-add_&]:p-[6px_14px] [.home-quick-add_&]:rounded-[10px] [.home-quick-add_&]:text-[13px] max-[600.01px]:[.home-inline-empty_&]:w-full max-[600.01px]:[.home-quick-add_&]:p-[10px_12px] !text-[11.5px] !min-h-[33px] !p-[5px_8px] !rounded-[8px] !whitespace-nowrap !overflow-hidden !text-ellipsis !justify-center max-[768.01px]:!text-[11px] max-[768.01px]:!min-h-[33px] max-[768.01px]:!p-[5px_6px] max-[768.01px]:!flex-[1_1_0] max-[768.01px]:!min-w-0"
                >
                  <span>عرض الوصفة</span>
                  <ArrowLeft size={14} />
                </Link>

                <HomeButton variant="secondary"
                  type="button"
                  className="home-secondary-button home-hero-action-btn inline-flex items-center gap-2 font-bold no-underline bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px] !text-[11.5px] !min-h-[33px] !p-[5px_8px] !rounded-[8px] !whitespace-nowrap !overflow-hidden !text-ellipsis !justify-center max-[768.01px]:!text-[11px] max-[768.01px]:!min-h-[33px] max-[768.01px]:!p-[5px_6px] max-[768.01px]:!flex-[1_1_0] max-[768.01px]:!min-w-0"
                  onClick={randomizeMeal}
                  title="اقتراح أكلة بديلة عشوائية من المفضلة"
                >
                  <Dices size={14} />
                  <span>اقترح غيرها</span>
                </HomeButton>

                {featuredRecipe.ingredients.length > 0 && (
                  <HomeButton variant="secondary"
                    type="button"
                    className="home-secondary-button home-hero-action-btn inline-flex items-center gap-2 font-bold no-underline bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px] !text-[11.5px] !min-h-[33px] !p-[5px_8px] !rounded-[8px] !whitespace-nowrap !overflow-hidden !text-ellipsis !justify-center max-[768.01px]:!text-[11px] max-[768.01px]:!min-h-[33px] max-[768.01px]:!p-[5px_6px] max-[768.01px]:!flex-[1_1_0] max-[768.01px]:!min-w-0"
                    disabled={busy === 'ingredients'}
                    onClick={() => void sendIngredientsToShopping(featuredRecipe)}
                    title="نقل مقادير هذه الطبخة لقائمة المشتريات"
                  >
                    <ShoppingBasket size={14} />
                    <span>نقل للمشتريات</span>
                  </HomeButton>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="home-inline-empty max-[600.01px]:flex-wrap max-[600.01px]:gap-[11px] max-[600.01px]:[&>div]:min-w-45">
            <BookOpen size={28} />
            <div>
              <h3>لا توجد وصفات بعد</h3>
              <p>سجّل أكلاتك المفضلة لتظهر لك اقتراحات الوجبات يوميًا بضغطة زر.</p>
            </div>
            <Link to="/home/recipes?new=1" className="home-primary-button inline-flex items-center justify-center gap-2 min-h-11.5 p-[10px_17px] rounded-home-control text-[14px] font-bold no-underline whitespace-nowrap bg-home-button border border-solid border-home-button text-home-button-text hover:bg-home-button-hover [.home-quick-add_&]:min-h-9 [.home-quick-add_&]:p-[6px_14px] [.home-quick-add_&]:rounded-[10px] [.home-quick-add_&]:text-[13px] max-[600.01px]:[.home-inline-empty_&]:w-full max-[600.01px]:[.home-quick-add_&]:p-[10px_12px]">
              إضافة أول وصفة
            </Link>
          </div>
        )}

        {/* شريط مصغر للأكلات المقترحة الأخرى */}
        {recipes.length > 1 && (
          <div className="home-other-recipes-row mt-3.5 border-t border-solid border-t-home-border pt-3">
            <span className="home-other-recipes-label text-[11.5px] font-bold text-home-muted flex items-center gap-[5px] mb-2">
              <UtensilsCrossed size={14} /> مقترحات أخرى تناسب اليوم:
            </span>
            <div className="home-other-recipes-list grid grid-cols-[repeat(auto-fill,__minmax(180px,__1fr))] gap-2">
              {recipes
                .filter(r => r.id !== featuredRecipe?.id)
                .slice(0, 4)
                .map(r => (
                  <Link
                    key={r.id}
                    to={`/home/recipes?recipe=${encodeURIComponent(r.id)}`}
                    className="home-mini-recipe-card flex items-center gap-2 p-[7px_10px] bg-home-raised border border-solid border-home-border rounded-[10px] no-underline text-home-text [transition:border-color_.15s] hover:border-home-accent [&_strong]:text-[12px] [&_strong]:font-bold [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:text-[10.5px] [&_small]:text-home-muted"
                  >
                    <span className="home-mini-mark text-[20px] shrink-0">
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
      <div className="home-overview-columns grid grid-cols-2 gap-4.5 items-stretch w-full max-[768.01px]:!grid-cols-1 max-[768.01px]:!w-full max-[768.01px]:!gap-3.5">
        {/* كارت المشتريات */}
        <section className="home-panel home-overview-col-panel max-[600.01px]:p-[17px_14px] max-[600.01px]:rounded-[16px] [.home-space_&]:rounded-home-panel [.home-space_&]:p-4.5 max-[600.01px]:[.home-space_&]:p-3.5 flex flex-col min-h-65">
          <div className="home-panel-heading !flex !items-start !justify-between !gap-3.5 !mb-3 !w-full [&>div]:flex-1 [&>div]:min-w-0 [&_h2]:!text-[19px] [&_h2]:!font-extrabold [&_h2]:!m-[2px_0_0] [&_h2]:!leading-[1.4] [&_p]:!text-[12px] [&_p]:!text-home-muted [&_p]:!m-[3px_0_0] [&_p]:!leading-[1.5] max-[600.01px]:[&_h2]:text-[21px] [.home-space_&]:!bg-transparent [.home-space_&]:!shadow-none [.home-space_&_h2]:text-[20px]">
            <div>
              <span className="home-eyebrow text-[12px] text-home-green font-bold flex items-center gap-[7px] max-[600.01px]:[.home-header_&]:text-[10px] max-[600.01px]:[.home-welcome_p:not(&)]:text-[12px] max-[767.01px]:[.home-header_&]:hidden">
                <ShoppingBasket size={16} /> المشتريات
              </span>
              <h2>احتياجات المنزل</h2>
            </div>
            <Link className="home-text-link home-all-recipes-link [.home-panel-heading_&]:!whitespace-nowrap [.home-panel-heading_&]:!inline-flex [.home-panel-heading_&]:!items-center [.home-panel-heading_&]:!gap-[5px] [.home-panel-heading_&]:!shrink-0 [.home-panel-heading_&]:!text-[11.5px] [.home-panel-heading_&]:!font-bold [.home-panel-heading_&]:!p-[5px_11px] [.home-panel-heading_&]:!rounded-[9px] [.home-panel-heading_&]:!bg-home-raised [.home-panel-heading_&]:!border [.home-panel-heading_&]:!border-solid [.home-panel-heading_&]:!border-home-border [.home-panel-heading_&]:!text-home-accent [.home-panel-heading_&]:!no-underline [.home-panel-heading_&]:!min-h-8 [.home-panel-heading_&]:mt-0.5 [.home-panel-heading_&]:![transition:all_.15s_ease] [.home-panel-heading_&:hover]:!bg-home-selection [.home-panel-heading_&:hover]:!border-home-accent max-[600.01px]:[.home-panel-heading_&]:text-[11px] max-[600.01px]:[.home-panel-heading_&]:gap-1 !whitespace-nowrap !inline-flex !items-center !gap-[5px] !shrink-0 !text-[11.5px] !font-bold !p-[5px_11px] !rounded-[9px] !bg-home-raised !border !border-solid !border-home-border !text-home-accent !no-underline !min-h-8 mt-0.5 ![transition:all_.15s_ease] hover:!bg-home-selection hover:!border-home-accent" to="/home/shopping">
              <span>فتح القائمة ({shopping.length})</span>
              <ArrowLeft size={16} />
            </Link>
          </div>

          {/* شريط الإضافة والفلترة في نفس الصف */}
          <div className="home-shopping-action-row flex items-center gap-2 w-full mb-3 max-[600.01px]:!gap-1.5">
            <HomeCompactSearch
              mode={shoppingFilter}
              onModeChange={setShoppingFilter}
              modeLabel="تصفية المشتريات"
              modeOptions={[
                { value: 'pending', label: `لم يُشترَ (${pendingShopping.length})` },
                { value: 'completed', label: `تم الشراء (${completedShopping.length})` },
                { value: 'all', label: `الكل (${allShoppingTasks.length})` }
              ]}
              value={shoppingDraft}
              onChange={setShoppingDraft}
              placeholder="أضف طلبًا سريعًا…"
              addButton
              shortcut=""
              selectWidth={145}
              maxLength={150}
              loading={!!busy}
              onAdd={addQuickShopItem}
              className="home-shopping-quick-add [.home-shopping-action-row_&]:flex-1 [.home-shopping-action-row_&]:min-w-0 [.home-shopping-action-row_&]:!mb-0 max-[600.01px]:!mb-0"
            />
          </div>

          {displayedShopping.length ? (
            <div
              className={`home-short-list-wrap relative w-full [&::before]:[content:''] [&::before]:absolute [&::before]:left-0 [&::before]:right-0 [&::before]:h-5 [&::before]:[pointer-events:none] [&::before]:z-[3] [&::before]:opacity-[0] [&::before]:[transition:opacity_.18s_ease] [&::before]:top-0 [&::before]:[background:linear-gradient(to_bottom,_var(--home-panel),_transparent)] [&::after]:[content:''] [&::after]:absolute [&::after]:left-0 [&::after]:right-0 [&::after]:h-5 [&::after]:[pointer-events:none] [&::after]:z-[3] [&::after]:opacity-[0] [&::after]:[transition:opacity_.18s_ease] [&::after]:bottom-0 [&::after]:[background:linear-gradient(to_top,_var(--home-panel),_transparent)] [&.has-shadow-top::before]:opacity-[1] [&.has-shadow-bottom::after]:opacity-[1] ${shoppingScroll.top ? 'has-shadow-top' : ''} ${
                shoppingScroll.bottom ? 'has-shadow-bottom' : ''
              }`}
            >
              <ul
                ref={shoppingListRef}
                onScroll={updateShoppingScroll}
                className="home-short-list-scrollable list-none p-0 m-0 max-h-[225px] overflow-y-auto ![scrollbar-width:none] ![-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:!hidden"
              >
                {displayedShopping.map(task => {
                  const parsed = parseShoppingTitle(task.title);
                  const isDone = isHomeTaskDone(task, today);
                  return (
                    <li
                      key={task.id}
                      className={`home-short-list-item flex items-center p-[8px_2px] border-b border-solid border-b-home-border [transition:opacity_.15s_ease] [&:last-child]:[border-bottom:0] ${isDone ? 'is-task-done' : ''}`}
                    >
                      <HomeCompletion
                        checked={isDone}
                        aria-label={isDone ? `إلغاء شراء ${parsed.name}` : `شراء ${parsed.name}`}
                        disabled={!!busy}
                        onChange={() => void toggleTask(task)}
                        title={isDone ? 'انقر لإلغاء الشطب' : 'انقر للشطب عند الشراء'}
                      />
                      <div className="home-short-list-item-content flex items-center justify-between gap-2 flex-1 min-w-0">
                        <span className="home-short-item-title [.home-short-list-item.is-task-done_&]:line-through [.home-short-list-item.is-task-done_&]:opacity-[0.55] [.home-short-list-item.is-task-done_&]:text-home-muted text-[13px] font-semibold text-home-text overflow-hidden text-ellipsis whitespace-nowrap">{parsed.name}</span>
                        {parsed.quantity && (
                          <span className="home-shopping-qty-badge ms-auto shrink-0 text-[11px] font-bold p-[2px_8px] rounded-[6px] bg-home-raised border border-solid border-home-border text-home-accent">{parsed.quantity}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="home-empty-card flex flex-col items-center justify-center text-center p-[24px_14px] flex-1 gap-1.5 text-home-muted [&_h4]:text-[14px] [&_h4]:font-bold [&_h4]:text-home-text [&_h4]:m-0 [&_p]:text-[11.5px] [&_p]:m-0 [&_p]:max-w-60 [&_p]:leading-[1.5]">
              <div className="home-empty-check-icon w-11 h-11 rounded-home-panel bg-[rgba(180,__199,__151,__0.16)] text-home-green grid place-items-center mb-1">
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
                <Link to="/home/shopping" className="home-secondary-button home-empty-action-btn inline-flex items-center justify-center gap-2 rounded-home-control font-bold no-underline whitespace-nowrap bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px] mt-2 !text-[11.5px] !min-h-8.5 !p-[5px_12px]">
                  <Plus size={14} /> إضافة احتياجات للمنزل
                </Link>
              )}
            </div>
          )}
        </section>

        {/* كارت إدارة أعمال المنزل */}
        <section className="home-panel home-overview-col-panel max-[600.01px]:p-[17px_14px] max-[600.01px]:rounded-[16px] [.home-space_&]:rounded-home-panel [.home-space_&]:p-4.5 max-[600.01px]:[.home-space_&]:p-3.5 flex flex-col min-h-65">
          <div className="home-panel-heading !flex !items-start !justify-between !gap-3.5 !mb-3 !w-full [&>div]:flex-1 [&>div]:min-w-0 [&_h2]:!text-[19px] [&_h2]:!font-extrabold [&_h2]:!m-[2px_0_0] [&_h2]:!leading-[1.4] [&_p]:!text-[12px] [&_p]:!text-home-muted [&_p]:!m-[3px_0_0] [&_p]:!leading-[1.5] max-[600.01px]:[&_h2]:text-[21px] [.home-space_&]:!bg-transparent [.home-space_&]:!shadow-none [.home-space_&_h2]:text-[20px]">
            <div>
              <span className="home-eyebrow text-[12px] text-home-green font-bold flex items-center gap-[7px] max-[600.01px]:[.home-header_&]:text-[10px] max-[600.01px]:[.home-welcome_p:not(&)]:text-[12px] max-[767.01px]:[.home-header_&]:hidden">
                <ListChecks size={16} /> إدارة المنزل
              </span>
              <h2>المطلوب اليوم</h2>
            </div>
            <Link className="home-text-link home-all-recipes-link [.home-panel-heading_&]:!whitespace-nowrap [.home-panel-heading_&]:!inline-flex [.home-panel-heading_&]:!items-center [.home-panel-heading_&]:!gap-[5px] [.home-panel-heading_&]:!shrink-0 [.home-panel-heading_&]:!text-[11.5px] [.home-panel-heading_&]:!font-bold [.home-panel-heading_&]:!p-[5px_11px] [.home-panel-heading_&]:!rounded-[9px] [.home-panel-heading_&]:!bg-home-raised [.home-panel-heading_&]:!border [.home-panel-heading_&]:!border-solid [.home-panel-heading_&]:!border-home-border [.home-panel-heading_&]:!text-home-accent [.home-panel-heading_&]:!no-underline [.home-panel-heading_&]:!min-h-8 [.home-panel-heading_&]:mt-0.5 [.home-panel-heading_&]:![transition:all_.15s_ease] [.home-panel-heading_&:hover]:!bg-home-selection [.home-panel-heading_&:hover]:!border-home-accent max-[600.01px]:[.home-panel-heading_&]:text-[11px] max-[600.01px]:[.home-panel-heading_&]:gap-1 !whitespace-nowrap !inline-flex !items-center !gap-[5px] !shrink-0 !text-[11.5px] !font-bold !p-[5px_11px] !rounded-[9px] !bg-home-raised !border !border-solid !border-home-border !text-home-accent !no-underline !min-h-8 mt-0.5 ![transition:all_.15s_ease] hover:!bg-home-selection hover:!border-home-accent" to="/home/tasks">
              <span>كل المهام</span>
              <ArrowLeft size={16} />
            </Link>
          </div>

          {due.length ? (
            <div
              className={`home-short-list-wrap relative w-full [&::before]:[content:''] [&::before]:absolute [&::before]:left-0 [&::before]:right-0 [&::before]:h-5 [&::before]:[pointer-events:none] [&::before]:z-[3] [&::before]:opacity-[0] [&::before]:[transition:opacity_.18s_ease] [&::before]:top-0 [&::before]:[background:linear-gradient(to_bottom,_var(--home-panel),_transparent)] [&::after]:[content:''] [&::after]:absolute [&::after]:left-0 [&::after]:right-0 [&::after]:h-5 [&::after]:[pointer-events:none] [&::after]:z-[3] [&::after]:opacity-[0] [&::after]:[transition:opacity_.18s_ease] [&::after]:bottom-0 [&::after]:[background:linear-gradient(to_top,_var(--home-panel),_transparent)] [&.has-shadow-top::before]:opacity-[1] [&.has-shadow-bottom::after]:opacity-[1] ${tasksScroll.top ? 'has-shadow-top' : ''} ${
                tasksScroll.bottom ? 'has-shadow-bottom' : ''
              }`}
            >
              <ul
                ref={tasksListRef}
                onScroll={updateTasksScroll}
                className="home-short-list-scrollable list-none p-0 m-0 max-h-[225px] overflow-y-auto ![scrollbar-width:none] ![-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:!hidden"
              >
                {due.map(task => (
                  <li key={task.id} className="home-short-list-item flex items-center p-[8px_2px] border-b border-solid border-b-home-border [transition:opacity_.15s_ease] [&:last-child]:[border-bottom:0]">
                    <HomeCompletion
                      checked={false}
                      disabled={!!busy}
                      aria-label={`إكمال ${task.title}`}
                      onChange={() => void toggleTask(task)}
                      title="انقر لإكمال المهمة"
                    />
                    <div className="home-short-list-item-content flex items-center justify-between gap-2 flex-1 min-w-0">
                      <span className="home-short-item-title [.home-short-list-item.is-task-done_&]:line-through [.home-short-list-item.is-task-done_&]:opacity-[0.55] [.home-short-list-item.is-task-done_&]:text-home-muted text-[13px] font-semibold text-home-text overflow-hidden text-ellipsis whitespace-nowrap">{task.title}</span>
                      <span className="home-task-due-badge text-[10.5px] text-home-muted inline-flex items-center gap-[3px] bg-home-raised border border-solid border-home-border p-[1.5px_7px] rounded-[5px] ms-auto shrink-0">
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
            <div className="home-empty-card flex flex-col items-center justify-center text-center p-[24px_14px] flex-1 gap-1.5 text-home-muted [&_h4]:text-[14px] [&_h4]:font-bold [&_h4]:text-home-text [&_h4]:m-0 [&_p]:text-[11.5px] [&_p]:m-0 [&_p]:max-w-60 [&_p]:leading-[1.5]">
              <div className="home-empty-check-icon w-11 h-11 rounded-home-panel bg-[rgba(180,__199,__151,__0.16)] text-home-green grid place-items-center mb-1">
                <Check size={24} />
              </div>
              <h4>جميع أعمال اليوم منجزة! ✨</h4>
              <p>لا توجد مهام مستحقة في البيت اليوم، استمتع بوقتك مع الأسرة.</p>
              <Link to="/home/tasks" className="home-secondary-button home-empty-action-btn inline-flex items-center justify-center gap-2 rounded-home-control font-bold no-underline whitespace-nowrap bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px] mt-2 !text-[11.5px] !min-h-8.5 !p-[5px_12px]">
                <Plus size={14} /> إضافة مهمة منزلية
              </Link>
            </div>
          )}
        </section>
      </div>
    </HomeStack>
  );
}
