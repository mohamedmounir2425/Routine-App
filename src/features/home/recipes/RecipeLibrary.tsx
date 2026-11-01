import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Clock3, Heart, Plus, Search, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import { db } from '../../../db/database';
import { CURRENT_WORKSPACE } from '../../../db/workspaceScope';
import { MEAL_TYPES, defaultRecipeFilters, filterRecipes, safeMediaUrl, type Recipe, type RecipeFilters } from './recipeModel';
import { toggleRecipeFavorite } from './recipeRepository';
import { RecipeDialog } from './RecipeDialog';
import './recipes.css';

function RecipeCard({ recipe, open, favorite }: { recipe: Recipe; open: () => void; favorite: () => void }) {
  const [failed, setFailed] = useState(false);
  let image = '';
  try { image = safeMediaUrl(recipe.imageUrl); } catch { /* Hide unsafe imported links. */ }
  useEffect(() => setFailed(false), [recipe.imageUrl]);
  return <article className="recipe-card">
    <button type="button" className="recipe-card-open" onClick={open} aria-label={'عرض وصفة ' + recipe.title}>
      <div className="recipe-card-cover">{image && !failed ? <img src={image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} /> : <span aria-hidden="true">{MEAL_TYPES.find(type => recipe.mealTypes.includes(type.id))?.icon ?? '🍽️'}</span>}</div>
      <div className="recipe-card-content"><div className="recipe-chips">{MEAL_TYPES.filter(type => recipe.mealTypes.includes(type.id)).map(type => <span className="recipe-tag" key={type.id}>{type.label}</span>)}{!recipe.mealTypes.length && <span className="recipe-tag">لأي وقت</span>}</div><h2>{recipe.title}</h2><p>{recipe.ingredients.length ? recipe.ingredients.slice(0, 4).map(item => item.name).join(' • ') : 'أضف المكونات وطريقة التحضير لاحقًا'}</p><div className="recipe-meta">{recipe.durationMinutes !== null && <span><Clock3 size={14} /> {recipe.durationMinutes} دقيقة</span>}{recipe.isLight && <span>🌿 خفيفة</span>}</div></div>
    </button>
    <button type="button" className="recipe-card-favorite" aria-label={(recipe.isFavorite ? 'إزالة من المفضلة: ' : 'إضافة للمفضلة: ') + recipe.title} aria-pressed={recipe.isFavorite} onClick={favorite}><Heart size={19} fill={recipe.isFavorite ? 'currentColor' : 'none'} /></button>
  </article>;
}

export function RecipeLibrary() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<RecipeFilters>(() => ({ ...defaultRecipeFilters, meal: MEAL_TYPES.find(type => type.id === params.get('meal'))?.id ?? 'all' }));
  const [advanced, setAdvanced] = useState(false);
  const [selection, setSelection] = useState<Recipe | 'new' | null>(null);
  const search = useRef<HTMLInputElement>(null);
  const add = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const subscription = liveQuery(() => db.recipes.toArray()).subscribe({ next: rows => { setRecipes(rows); setLoading(false); }, error: () => { setError('تعذر تحميل الوصفات. أعد فتح الصفحة.'); setLoading(false); } });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (selection) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.ctrlKey || event.metaKey || event.altKey || target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return;
      if (event.key === '/') { event.preventDefault(); search.current?.focus(); }
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); setSelection('new'); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selection]);
  const visible = useMemo(() => filterRecipes(recipes, filters), [recipes, filters]);
  const favorite = async (id: string) => { try { await toggleRecipeFavorite(id); } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر تعديل المفضلة.'); } };
  const close = () => { setSelection(null); requestAnimationFrame(() => add.current?.focus()); };
  useEffect(() => {
    if (loading) return;
    const requested = params.get('recipe');
    if (params.get('new') === '1') setSelection('new');
    else if (requested) { const found = recipes.find(recipe => recipe.id === requested); if (found) setSelection(found); else setMessage('هذه الوصفة لم تعد موجودة.'); }
    if (requested || params.has('new')) { const next = new URLSearchParams(params); next.delete('recipe'); next.delete('new'); setParams(next, { replace: true }); }
  }, [loading, params, recipes, setParams]);
  return <section className="recipe-library" dir="rtl">
    <header className="recipe-hero"><div><span className="recipe-eyebrow"><UtensilsCrossed size={16} /> المطبخ</span><h2>الوصفات</h2><p>أفكار لوجباتك اليومية، ووصفات تستحق التجربة.</p></div><button ref={add} type="button" className="recipe-primary" onClick={() => setSelection('new')} aria-keyshortcuts="N"><Plus size={19} /> إضافة وصفة</button></header>
    <div className="recipe-library-summary"><BookOpen size={17} /><span>{recipes.length} وصفة محفوظة</span><span>•</span><span>{recipes.filter(recipe => recipe.isFavorite).length} في المفضلة</span></div>
    <nav className="recipe-meal-tabs" aria-label="نوع الوجبة"><button type="button" aria-pressed={filters.meal === 'all'} onClick={() => setFilters({ ...filters, meal: 'all' })}>🍽️ الكل</button>{MEAL_TYPES.map(type => <button key={type.id} type="button" aria-pressed={filters.meal === type.id} onClick={() => setFilters({ ...filters, meal: type.id })}>{type.icon} {type.label}</button>)}</nav>
    <section className="recipe-search-panel" aria-label="البحث والفلترة">
      <div className="recipe-search-row"><label className="recipe-search"><Search size={19} /><input ref={search} type="search" aria-label="ابحث باسم الوصفة أو أحد مكوناتها" placeholder="ابحث عن وصفة أو مكون…" value={filters.query} onChange={event => setFilters({ ...filters, query: event.target.value })} aria-keyshortcuts="/" /><kbd>/</kbd></label><button type="button" className="recipe-secondary" aria-expanded={advanced} aria-controls="recipe-filters" onClick={() => setAdvanced(!advanced)}><SlidersHorizontal size={17} /> فلترة</button></div>
      <div className="recipe-chips"><button type="button" className="recipe-chip" aria-pressed={filters.favorites} onClick={() => setFilters({ ...filters, favorites: !filters.favorites })}>♡ المفضلة</button><button type="button" className="recipe-chip" aria-pressed={filters.quick} onClick={() => setFilters({ ...filters, quick: !filters.quick })}>◷ ٣٠ دقيقة أو أقل</button><button type="button" className="recipe-chip" aria-pressed={filters.light} onClick={() => setFilters({ ...filters, light: !filters.light })}>🌿 خفيفة</button></div>
      {advanced && <div id="recipe-filters" className="recipe-advanced"><label className="recipe-field">البحث بعدة مكونات<input value={filters.ingredients} onChange={event => setFilters({ ...filters, ingredients: event.target.value })} placeholder="فراخ، فلفل" /><small>افصل المكونات بفاصلة لعرض الوصفات التي تحتويها جميعًا.</small></label><label className="recipe-field">ترتيب العرض<select value={filters.sort} onChange={event => setFilters({ ...filters, sort: event.target.value as typeof filters.sort })}><option value="recent">آخر تعديل</option><option value="title">الاسم</option><option value="duration">الأسرع أولًا</option></select></label></div>}
    </section>
    <div className="recipe-result-heading"><p aria-live="polite">{loading ? 'جارٍ تحميل الوصفات…' : `${visible.length} وصفة${filters.meal === 'all' ? ' لكل الأوقات' : ' مناسب للوجبة'}`}</p>{JSON.stringify(filters) !== JSON.stringify(defaultRecipeFilters) && <button type="button" className="recipe-text-button" onClick={() => setFilters(defaultRecipeFilters)}>مسح البحث والفلاتر</button>}</div>
    {message && <p role="status" className="recipe-success">{message}</p>}{error && <p role="alert" className="recipe-error">{error}</p>}
    {!loading && !error && !recipes.length ? <section className="recipe-empty"><span aria-hidden="true">🥘</span><h2>وصفاتك المفضلة تبدأ من هنا</h2><p>أضف اسم وصفة تحبها، وأكمل المكونات والتفاصيل متى شئت.</p><button type="button" className="recipe-primary" onClick={() => setSelection('new')}><Plus size={18} /> إضافة أول وصفة</button></section> : !loading && !visible.length && !error ? <section className="recipe-empty"><Search size={36} /><h2>لا توجد وصفات مطابقة</h2><p>جرّب مكونات أقل أو أزل بعض الفلاتر.</p><button type="button" className="recipe-secondary" onClick={() => setFilters(defaultRecipeFilters)}>عرض كل الوصفات</button></section> : <div className="recipe-grid">{visible.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} open={() => setSelection(recipe)} favorite={() => void favorite(recipe.id)} />)}</div>}
    <footer className="recipe-library-footer"><p>{CURRENT_WORKSPACE === 'guest' ? 'الوصفات محفوظة على هذا الجهاز. يمكنك تضمينها في نسخة احتياطية من الإعدادات.' : 'وصفاتك متاحة دون اتصال، وتتزامن مع حسابك عند توفر الإنترنت.'}</p><p className="recipe-shortcut">N إضافة وصفة · / بحث · Ctrl + Enter حفظ · Esc إغلاق</p></footer>
    {selection && <RecipeDialog key={selection === 'new' ? 'new' : selection.id} creating={selection === 'new'} recipe={selection === 'new' ? undefined : selection} onClose={close} onSaved={text => { setMessage(text); setError(''); }} />}
  </section>;
}
