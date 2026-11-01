import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { Link } from 'react-router-dom';
import { Archive, ArrowLeft, BookOpen, Check, Clock3, CookingPot, ShoppingBasket, ListChecks } from 'lucide-react';
import { db } from '../../db/database';
import type { LifeTask } from '../../types';
import { toggleTaskCompletion } from '../../db/taskQueries';
import { getLocalDateString } from '../../utils/dateUtils';
import { isHomeTaskDone, isShoppingTask } from './homeTasks';
import { MEAL_TYPES, type Recipe } from './recipes/recipeModel';
import { isSpaceTaskDue } from '../today/taskCalendar';
import { inventoryFlags, type InventoryItem } from './inventory/inventoryModel';
export function HomeOverview() {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const today = getLocalDateString();
  useEffect(() => {
    const subscription = liveQuery(async () => ({ tasks: await db.tasks.where('spaceId').equals('home').toArray(), recipes: await db.recipes.toArray(), inventory: await db.inventoryItems.toArray() })).subscribe({ next: data => { setTasks(data.tasks); setRecipes(data.recipes); setInventory(data.inventory); setLoading(false); }, error: () => { setError('تعذر تحميل بيانات المنزل. أعد فتح الصفحة.'); setLoading(false); } });
    return () => subscription.unsubscribe();
  }, []);
  const shopping = tasks.filter(task => isShoppingTask(task) && !isHomeTaskDone(task, today));
  const due = tasks.filter(task => !isShoppingTask(task) && !isHomeTaskDone(task, today) && isSpaceTaskDue(task, today) && (task.isRecurring || !!task.dueDate && task.dueDate <= today)).sort((a, b) => (a.dueDate ?? today).localeCompare(b.dueDate ?? today) || Number(b.priority === 'high') - Number(a.priority === 'high'));
  const suggestions = [...recipes].sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const toggle = async (task: LifeTask) => { if (busy) return; setBusy(task.id); try { await toggleTaskCompletion(task.id, today); } catch { setError('تعذر حفظ التغيير. حاول مرة أخرى.'); } finally { setBusy(''); } };
  return <div className="home-overview">
    <section className="home-welcome"><div><p className="home-eyebrow">مساحة مرتبة لما يهمك</p><h2>كل ما يحتاجه منزلك،<br /><span>في مكان واحد.</span></h2><p>وصفات تلهمك، ومشتريات واضحة، وأعمال منزلية يسهل متابعتها.</p></div><div className="home-welcome-art" aria-hidden="true"><CookingPot size={65} strokeWidth={1.1} /><span>طبخة طيبة، يوم أجمل</span></div></section>
    {error && <p className="home-error" role="alert">{error}</p>}
    <section className="home-panel home-kitchen-preview"><div className="home-panel-heading"><div><span className="home-eyebrow"><CookingPot size={16} /> المطبخ</span><h2>ماذا نأكل اليوم؟</h2><p>ابدأ من وصفاتك، واختر ما يناسب وقتك.</p></div><Link className="home-text-link" to="/home/recipes">كل الوصفات <ArrowLeft size={16} /></Link></div>
      <div className="home-meal-links">{MEAL_TYPES.map(type => <Link key={type.id} to={'/home/recipes?meal=' + type.id}><span aria-hidden="true">{type.icon}</span>{type.label}</Link>)}</div>
      {loading ? <p role="status" className="home-empty">جارٍ تحميل وصفاتك…</p> : suggestions.length ? <div className="home-recipe-previews">{suggestions.map(recipe => <Link key={recipe.id} to={'/home/recipes?recipe=' + encodeURIComponent(recipe.id)} className="home-recipe-preview"><span className="home-recipe-mark" aria-hidden="true">{MEAL_TYPES.find(type => recipe.mealTypes.includes(type.id))?.icon ?? '🍽️'}</span><div><h3>{recipe.title}</h3><p>{recipe.durationMinutes ? `${recipe.durationMinutes} دقيقة` : 'المدة غير محددة'}{recipe.isFavorite ? ' · من المفضلة' : ''}</p></div><ArrowLeft size={16} /></Link>)}</div> : <div className="home-inline-empty"><BookOpen size={26} /><div><h3>احتفظ بأفكار وجباتك المفضلة</h3><p>يكفي اسم الوصفة كبداية؛ أضف المكونات والطريقة لاحقًا.</p></div><Link to="/home/recipes?new=1" className="home-primary-button">إضافة وصفة</Link></div>}
      <Link to="/home/inventory" className="home-inventory-glance"><Archive size={21} /><div><strong>المخزون والجرد</strong><p>{inventory.length ? `${inventory.length} صنف مسجل · ${inventory.filter(item => { const flags = inventoryFlags(item, today); return flags.useFirst || flags.expiring || flags.expired; }).length} يحتاج مراجعة أو استخدامًا أولًا` : 'سجّل المتاح في الثلاجة والفريزر والتموين'}</p></div><ArrowLeft size={17} /></Link>
    </section>
    <div className="home-overview-columns"><section className="home-panel"><div className="home-panel-heading"><div><span className="home-eyebrow"><ShoppingBasket size={16} /> المشتريات</span><h2>احتياجات المنزل</h2></div><Link className="home-text-link" to="/home/shopping">فتح القائمة <ArrowLeft size={16} /></Link></div>{shopping.length ? <><p className="home-muted">{shopping.length} عناصر لم تُشترَ بعد</p><ul className="home-short-list">{shopping.slice(0, 4).map(task => <li key={task.id}><ShoppingBasket size={15} /><span>{task.title.replace(/^🛒\s*/, '')}</span></li>)}</ul></> : <div className="home-empty"><ShoppingBasket size={27} /><p>قائمة المشتريات خالية.</p><Link to="/home/shopping" className="home-text-link">إضافة احتياجات المنزل</Link></div>}</section>
    <section className="home-panel"><div className="home-panel-heading"><div><span className="home-eyebrow"><ListChecks size={16} /> إدارة المنزل</span><h2>المطلوب اليوم</h2></div><Link className="home-text-link" to="/home/tasks">كل المهام <ArrowLeft size={16} /></Link></div>{due.length ? <ul className="home-short-list">{due.slice(0, 4).map(task => <li key={task.id}><button type="button" className="home-check" disabled={!!busy} aria-label={'إكمال ' + task.title} onClick={() => void toggle(task)}><Check size={15} /></button><div><span>{task.title}</span><small><Clock3 size={12} />{task.dueDate && task.dueDate < today ? 'متأخرة' : task.isRecurring ? 'روتين اليوم' : 'اليوم'}</small></div></li>)}</ul> : <div className="home-empty"><Check size={27} /><p>لا توجد أعمال مستحقة اليوم.</p><Link to="/home/tasks" className="home-text-link">تنظيم مهام المنزل</Link></div>}</section></div>
  </div>;
}
