import { KitchenHeader, KitchenActionButton } from '../components/KitchenHeader';
import { HomeButton } from '../components/HomeButton';
import { Card } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Clock3, Heart, Plus, Search, Sparkles } from 'lucide-react';
import { db } from '../../../db/database';
import { CURRENT_WORKSPACE } from '../../../db/workspaceScope';
import { MEAL_TYPES, defaultRecipeFilters, filterRecipes, safeMediaUrl, type Recipe, type RecipeFilters } from './recipeModel';
import { toggleRecipeFavorite } from './recipeRepository';
import { RecipeDialog } from './RecipeDialog';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { HomeCompactSearch, HomeSelect } from '../components/HomeInputs';
import './recipes.css';

function RecipeCard({ recipe, open, favorite }: { recipe: Recipe; open: () => void; favorite: () => void }) {
  const [failed, setFailed] = useState(false);
  let image = '';
  try { image = safeMediaUrl(recipe.imageUrl); } catch { /* Hide unsafe imported links. */ }
  useEffect(() => setFailed(false), [recipe.imageUrl]);

  const hasImage = Boolean(image && !failed);

  return (
    <Card className="recipe-card relative !border !border-solid !border-home-border !rounded-[16px] !bg-home-panel overflow-hidden [transition:all_.2s_ease] [box-shadow:0_1px_3px_rgba(0,0,0,0.03)] hover:[transform:translateY(-2px)] hover:[box-shadow:0_8px_24px_rgba(0,0,0,0.06)] hover:!border-home-accent [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:leading-[1.35] [&_h2]:m-[0_0_6px] [&_h2]:text-home-text [&_h2]:wrap-anywhere [&_p]:text-[12px] [&_p]:text-[var(--recipe-muted)] [&_p]:m-[0_0_10px] [&_p]:[display:-webkit-box] [&_p]:[-webkit-line-clamp:2] [&_p]:[-webkit-box-orient:vertical] [&_p]:overflow-hidden [&_p]:leading-[1.45] max-[600.01px]:[&_h2]:text-[14px] max-[600.01px]:[&_h2]:m-[0_0_4px]" styles={{ body: { padding: 0 } }}>
      <button type="button" className="recipe-card-open flex flex-col w-full h-full text-start [border:0] [background:none] [color:inherit] p-0 max-[600.01px]:grid max-[600.01px]:grid-cols-[110px_1fr]" onClick={open} aria-label={'عرض وصفة ' + recipe.title}>
        <div className={`recipe-card-cover relative w-full h-[155px] overflow-hidden bg-home-raised [&.has-img_img]:w-full [&.has-img_img]:h-full [&.has-img_img]:object-cover [&.has-img_img]:[transition:transform_.3s_ease] [&.has-img_img]:block [.recipe-card:hover_&.has-img_img]:[transform:scale(1.04)] max-[768.01px]:h-35 max-[600.01px]:h-full max-[600.01px]:min-h-30 ${hasImage ? 'has-img' : 'no-img'}`}>
          {hasImage ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="recipe-card-placeholder w-full h-full flex items-center justify-center [background:linear-gradient(135deg,_rgba(227,_162,_123,_0.16)_0%,_rgba(180,_199,_151,_0.14)_100%)]">
              <span className="recipe-placeholder-icon text-[46px] [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.08))]" aria-hidden="true">
                {MEAL_TYPES.find(type => recipe.mealTypes.includes(type.id))?.icon ?? '🍽️'}
              </span>
            </div>
          )}

        </div>
        <div className="recipe-card-content p-[12px_14px_14px] flex flex-col flex-1 max-[600.01px]:p-[10px_12px]">
          <div className="recipe-chips flex items-center gap-[5px] flex-wrap mb-1.5">
            {MEAL_TYPES.filter(type => recipe.mealTypes.includes(type.id)).map(type => (
              <span className="recipe-tag text-[10.5px] font-bold p-[2px_7px] rounded-[6px] bg-home-green-bg text-home-green-text border border-solid border-home-green-border" key={type.id}>
                {type.icon} {type.label}
              </span>
            ))}
            {!recipe.mealTypes.length && <span className="recipe-tag text-[10.5px] font-bold p-[2px_7px] rounded-[6px] bg-home-green-bg text-home-green-text border border-solid border-home-green-border">لأي وقت</span>}
          </div>
          <h2>{recipe.title}</h2>
          <p>
            {recipe.ingredients.length
              ? recipe.ingredients.slice(0, 4).map(item => item.name).join(' • ')
              : 'أضف المكونات وطريقة التحضير لاحقًا'}
          </p>
          <div className="recipe-meta flex items-center gap-3 text-[var(--recipe-muted)] text-[11px] font-semibold mt-auto border-t border-solid border-t-home-border pt-2 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1">
            {recipe.durationMinutes !== null && (
              <span>
                <Clock3 size={12} /> {recipe.durationMinutes} دقيقة
              </span>
            )}
            {recipe.isLight && <span>🌿 خفيفة</span>}
          </div>
        </div>
      </button>
          <HomeButton icon={<Heart size={16} fill={recipe.isFavorite ? 'currentColor' : 'none'} />}
            type="button"
            className={`recipe-card-favorite absolute top-2.5 left-2.5 z-[2] bg-[rgba(255,_255,_255,_0.88)] [backdrop-filter:blur(8px)] [border:1px_solid_rgba(0,_0,_0,_0.08)] w-8 h-8 flex items-center justify-center rounded-full text-home-muted [transition:all_.15s_ease] [html.dark_&]:bg-[rgba(33,_29,_25,_0.82)] [html.dark_&]:border-[rgba(255,_255,_255,_0.12)] [html.dark_&]:text-home-muted hover:[transform:scale(1.1)] hover:text-[#f43f5e] [&.is-fav]:!text-[#f43f5e] [&.is-fav]:!bg-[rgba(244,_63,_94,_0.14)] [&.is-fav]:!border-[rgba(244,_63,_94,_0.3)] ${recipe.isFavorite ? 'is-fav' : ''}`}
            aria-label={(recipe.isFavorite ? 'إزالة من المفضلة: ' : 'إضافة للمفضلة: ') + recipe.title}
            aria-pressed={recipe.isFavorite}
            onClick={e => {
              e.stopPropagation();
              favorite();
            }}
          >

          </HomeButton>
    </Card>
  );
}

const PAGE_SIZE = 12;

export function RecipeLibrary() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<RecipeFilters>(() => ({ ...defaultRecipeFilters, meal: MEAL_TYPES.find(type => type.id === params.get('meal'))?.id ?? 'all' }));
  const [searchMode, setSearchMode] = useState<'title' | 'ingredients'>('title');
  const [selection, setSelection] = useState<Recipe | 'new' | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const search = useRef<import('antd').InputRef>(null);
  const add = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const subscription = liveQuery(() => db.recipes.toArray()).subscribe({ next: rows => { setRecipes(rows); setLoading(false); }, error: () => { setError('تعذر تحميل الوصفات. أعد فتح الصفحة.'); setLoading(false); } });
    return () => subscription.unsubscribe();
  }, []);

  const visible = useMemo(() => filterRecipes(recipes, filters), [recipes, filters]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters]);

  const displayed = useMemo(() => visible.slice(0, visibleCount), [visible, visibleCount]);
  const hasMore = visible.length > visibleCount;

  useEffect(() => {
    if (selection) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.ctrlKey || event.metaKey || event.altKey || target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]')) return;
      if (event.key === '/') {
        event.preventDefault();
        search.current?.focus();
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setSelection('new');
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setFilters(prev => ({ ...prev, favorites: !prev.favorites }));
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (visible.length > 0) {
          const randomRecipe = visible[Math.floor(Math.random() * visible.length)];
          setSelection(randomRecipe);
        }
      } else if (event.key === '[' || event.key === ']') {
        event.preventDefault();
        navigate('/home/inventory');
      } else if (event.key === '?') {
        event.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selection, visible, navigate]);

  const favorite = async (id: string) => { try { await toggleRecipeFavorite(id); } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر تعديل المفضلة.'); } };
  const close = () => { setSelection(null); requestAnimationFrame(() => add.current?.focus()); };

  useEffect(() => {
    if (loading) return;
    const requested = params.get('recipe');
    if (params.get('new') === '1') setSelection('new');
    else if (requested) { const found = recipes.find(recipe => recipe.id === requested); if (found) setSelection(found); else setMessage('هذه الوصفة لم تعد موجودة.'); }
    if (requested || params.has('new')) { const next = new URLSearchParams(params); next.delete('recipe'); next.delete('new'); setParams(next, { replace: true }); }
  }, [loading, params, recipes, setParams]);

  return (
    <section className="recipe-library [--recipe-ink:var(--home-text)] [--recipe-muted:var(--home-muted)] [--recipe-border:var(--home-border)] [--recipe-accent:var(--home-accent)] text-[var(--recipe-ink)] font-[inherit] text-[14px] leading-[1.6] [color-scheme:inherit] bg-transparent p-0 min-h-[55vh] max-w-320 m-auto flex flex-col gap-4 [&_button]:cursor-pointer [&_button]:touch-manipulation [&_button]:font-[inherit] [&_button:disabled]:opacity-[.55] [&_button:disabled]:cursor-wait [&_:focus-visible]:[outline:2px_solid_var(--home-accent)] [&_:focus-visible]:[outline-offset:2px]" dir="rtl">
      <KitchenHeader>
          {visible.length > 0 && (
            <KitchenActionButton variant="secondary"
              type="button"

              onClick={() => {
                const randomRecipe = visible[Math.floor(Math.random() * visible.length)];
                setSelection(randomRecipe);
              }}
              title="اقتراح أكلة عشوائية (R)"
              aria-label="اقتراح أكلة عشوائية"
            >
              <Sparkles size={15} />
              <span className="hidden-sm max-[600.01px]:!hidden">اقترح لي <span className="kitchen-kbd-cue max-[600.01px]:!hidden">(R)</span></span>
            </KitchenActionButton>
          )}
          <KitchenActionButton variant="primary"
            ref={add}
            type="button"

            onClick={() => setSelection('new')}
            title="إضافة أكلة جديدة (N)"
            aria-keyshortcuts="N"
          >
            <Plus size={16} />
            <span>إضافة أكلة</span>
          </KitchenActionButton>
          <KitchenActionButton variant="secondary"
            type="button"
            className="max-[600px]:hidden"
            onClick={() => setShowShortcuts(true)}
            title="اختصارات لوحة المفاتيح (?)"
            aria-label="اختصارات لوحة المفاتيح"
          >
            <kbd style={{ fontSize: 11, padding: '2px 5px', borderRadius: 4, background: 'var(--home-kbd-bg, rgba(0,0,0,0.06))' }}>?</kbd>
          </KitchenActionButton>
        </KitchenHeader>

      {/* تبويبات نوع الوجبة بتمرير سلس */}
      <div className="recipe-meal-tabs-wrap flex items-center overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] m-[-4px_0_0] p-[2px_0] [&::-webkit-scrollbar]:hidden">
        <nav className="recipe-meal-tabs inline-flex items-center gap-2 min-w-[max-content] [&_button]:inline-flex [&_button]:items-center [&_button]:gap-1.5 [&_button]:p-[6px_14px] [&_button]:rounded-full [&_button]:bg-home-panel [&_button]:border [&_button]:border-solid [&_button]:border-home-border [&_button]:text-home-muted [&_button]:text-[13px] [&_button]:font-semibold [&_button]:cursor-pointer [&_button]:whitespace-nowrap [&_button]:[transition:all_.15s_ease] [&_button:hover]:border-home-accent [&_button:hover]:text-home-text [&_button[aria-pressed='true']]:bg-home-button [&_button[aria-pressed='true']]:border-home-button [&_button[aria-pressed='true']]:text-home-button-text [&_button[aria-pressed='true']]:font-bold [&_button[aria-pressed='true']]:[box-shadow:0_1px_3px_rgba(0,_0,_0,_0.08)]" aria-label="نوع الوجبة">
          <HomeButton
            type="button"
            aria-pressed={filters.meal === 'all'}
            onClick={() => setFilters({ ...filters, meal: 'all' })}
          >
            🍽️ الكل ({recipes.length})
          </HomeButton>
          {MEAL_TYPES.map(type => {
            const count = recipes.filter(r => r.mealTypes.includes(type.id)).length;
            return (
              <HomeButton
                key={type.id}
                type="button"
                aria-pressed={filters.meal === type.id}
                onClick={() => setFilters({ ...filters, meal: type.id })}
              >
                {type.icon} {type.label} {count > 0 ? `(${count})` : ''}
              </HomeButton>
            );
          })}
        </nav>
      </div>

      <section className="recipe-search-panel bg-home-panel border border-solid border-home-border rounded-[16px] p-[8px_10px]" aria-label="البحث والفلترة">
        <div className="recipe-search-toolbar flex items-center justify-between gap-2.5 w-full max-[860.01px]:!flex-col max-[860.01px]:!items-stretch max-[860.01px]:!gap-2">
          <div className="recipe-search-toolbar-main flex-[1_1_260px] min-w-50 max-[860.01px]:!w-full max-[860.01px]:!flex-[none] max-[860.01px]:!min-w-0">
            <HomeCompactSearch
              mode={searchMode}
              onModeChange={(mode: 'title' | 'ingredients') => {
                setSearchMode(mode);
                if (mode === 'title') {
                  setFilters(f => ({ ...f, query: f.ingredients || f.query, ingredients: '' }));
                } else {
                  setFilters(f => ({ ...f, ingredients: f.query || f.ingredients, query: '' }));
                }
              }}
              modeOptions={[
                { value: 'title', label: '🍲 بالاسم' },
                { value: 'ingredients', label: '🥕 بالمكونات' }
              ]}
              value={searchMode === 'title' ? filters.query : filters.ingredients}
              onChange={val => {
                if (searchMode === 'title') {
                  setFilters(f => ({ ...f, query: val }));
                } else {
                  setFilters(f => ({ ...f, ingredients: val }));
                }
              }}
              placeholder={
                searchMode === 'title'
                  ? 'ابحث عن أكلة…'
                  : 'مكونات مفصولة بفاصلة (فراخ، جبن…)'
              }
              inputRef={search}
              selectWidth={120}
            />
          </div>

          <div className="recipe-search-toolbar-side inline-flex items-center gap-2 shrink-0 flex-nowrap max-[860.01px]:!w-full max-[860.01px]:!flex max-[860.01px]:!flex-row max-[860.01px]:!items-center max-[860.01px]:!justify-start max-[860.01px]:!overflow-x-auto max-[860.01px]:[-webkit-overflow-scrolling:touch] max-[860.01px]:[scrollbar-width:none] max-[860.01px]:pb-0.5 max-[860.01px]:!gap-1.5 max-[860.01px]:[&::-webkit-scrollbar]:hidden">
            <HomeSelect
              aria-label="ترتيب الأكلات"
              value={filters.sort}
              onChange={value => setFilters(f => ({ ...f, sort: value }))}
              options={[
                { value: 'recent', label: '⇅ آخر تعديل' },
                { value: 'title', label: '⇅ الاسم أبجديًا' },
                { value: 'duration', label: '⇅ الأسرع تحضيرًا' }
              ]}
              className="w-full"
            />

            <div className="recipe-toggle-flags inline-flex items-center gap-1.5 shrink-0 flex-nowrap" role="toolbar" aria-label="فلاتر سريعة">
              <HomeButton
                type="button"
                className={`recipe-toggle-chip inline-flex items-center gap-[5px] p-[6px_11px] h-10 rounded-[10px] bg-home-input border border-solid border-home-border text-home-muted text-[12px] font-bold cursor-pointer !whitespace-nowrap !shrink-0 [transition:all_.15s_ease] hover:border-home-accent hover:text-home-text [&.is-active]:!bg-home-selection [&.is-active]:!border-home-accent [&.is-active]:!text-home-selection-text [&.is-active]:font-bold [html.light_&.is-active]:!bg-[#f1e4d6] [html.light_&.is-active]:!text-[#9a4e2d] [html.light_&.is-active]:!border-[#9a4e2d] max-[860.01px]:!h-9.5 max-[860.01px]:!p-[0_9px] max-[860.01px]:!text-[11.5px] max-[600.01px]:!h-9 max-[600.01px]:!p-[0_8px] max-[600.01px]:!text-[11px] ${filters.favorites ? 'is-active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, favorites: !f.favorites }))}
                aria-pressed={filters.favorites}
                title="تصفية بالمفضلة (F)"
              >
                <Heart size={13} fill={filters.favorites ? 'currentColor' : 'none'} />
                <span>المفضلة ({recipes.filter(r => r.isFavorite).length})</span>
              </HomeButton>
              <HomeButton
                type="button"
                className={`recipe-toggle-chip inline-flex items-center gap-[5px] p-[6px_11px] h-10 rounded-[10px] bg-home-input border border-solid border-home-border text-home-muted text-[12px] font-bold cursor-pointer !whitespace-nowrap !shrink-0 [transition:all_.15s_ease] hover:border-home-accent hover:text-home-text [&.is-active]:!bg-home-selection [&.is-active]:!border-home-accent [&.is-active]:!text-home-selection-text [&.is-active]:font-bold [html.light_&.is-active]:!bg-[#f1e4d6] [html.light_&.is-active]:!text-[#9a4e2d] [html.light_&.is-active]:!border-[#9a4e2d] max-[860.01px]:!h-9.5 max-[860.01px]:!p-[0_9px] max-[860.01px]:!text-[11.5px] max-[600.01px]:!h-9 max-[600.01px]:!p-[0_8px] max-[600.01px]:!text-[11px] ${filters.quick ? 'is-active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, quick: !f.quick }))}
                aria-pressed={filters.quick}
                title="سريعة التحضير في 30 دقيقة أو أقل"
              >
                <Clock3 size={13} />
                <span>≤٣٠د ({recipes.filter(r => r.durationMinutes !== null && r.durationMinutes <= 30).length})</span>
              </HomeButton>
              <HomeButton
                type="button"
                className={`recipe-toggle-chip inline-flex items-center gap-[5px] p-[6px_11px] h-10 rounded-[10px] bg-home-input border border-solid border-home-border text-home-muted text-[12px] font-bold cursor-pointer !whitespace-nowrap !shrink-0 [transition:all_.15s_ease] hover:border-home-accent hover:text-home-text [&.is-active]:!bg-home-selection [&.is-active]:!border-home-accent [&.is-active]:!text-home-selection-text [&.is-active]:font-bold [html.light_&.is-active]:!bg-[#f1e4d6] [html.light_&.is-active]:!text-[#9a4e2d] [html.light_&.is-active]:!border-[#9a4e2d] max-[860.01px]:!h-9.5 max-[860.01px]:!p-[0_9px] max-[860.01px]:!text-[11.5px] max-[600.01px]:!h-9 max-[600.01px]:!p-[0_8px] max-[600.01px]:!text-[11px] ${filters.light ? 'is-active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, light: !f.light }))}
                aria-pressed={filters.light}
                title="أكلات خفيفة وصحية"
              >
                <span>🌿</span>
                <span>خفيفة ({recipes.filter(r => r.isLight).length})</span>
              </HomeButton>
            </div>
          </div>
        </div>
      </section>

      <div className="recipe-result-heading flex justify-between items-center gap-2.5 text-[12.5px] text-[var(--recipe-muted)] font-semibold mt-[-4px]">
        <p aria-live="polite">
          {loading
            ? 'جارٍ تحميل الأكلات…'
            : hasMore
            ? `عرض ${displayed.length} من أصل ${visible.length} أكلة${filters.meal === 'all' ? ' لكل الأوقات' : ' مناسبة للوجبة'}`
            : `${visible.length} أكلة${filters.meal === 'all' ? ' لكل الأوقات' : ' مناسبة للوجبة'}`}
        </p>
        {(JSON.stringify(filters) !== JSON.stringify(defaultRecipeFilters) || searchMode !== 'title') && (
          <HomeButton
            type="button"
            className="recipe-text-button inline-flex items-center gap-1 text-[12px] font-bold text-[var(--recipe-accent)] [background:none] [border:0] p-[4px_6px] rounded-[6px] hover:bg-home-raised"
            onClick={() => {
              setFilters(defaultRecipeFilters);
              setSearchMode('title');
            }}
          >
            مسح البحث والفلاتر
          </HomeButton>
        )}
      </div>

      {message && <p role="status" className="recipe-success text-home-green-text bg-home-green-bg rounded-[8px] p-[8px_12px] text-[13px] mb-2">{message}</p>}
      {error && <p role="alert" className="recipe-error text-home-error-text bg-home-error-bg rounded-[8px] p-[8px_12px] text-[13px] mb-2">{error}</p>}

      {!loading && !error && !recipes.length ? (
        <section className="recipe-empty p-[40px_14px] text-center flex items-center flex-col gap-2.5 bg-home-panel border border-solid border-home-border rounded-[18px] [&_>_span]:text-[48px] [&_h2]:text-[18px] [&_h2]:font-extrabold [&_h2]:m-0 [&_p]:max-w-90 [&_p]:text-[var(--recipe-muted)] [&_p]:text-[13px] [&_p]:m-0">
          <span aria-hidden="true">🥘</span>
          <h2>أكلاتك المفضلة تبدأ من هنا</h2>
          <p>أضف اسم أكلة تحبها، وأكمل المكونات والتفاصيل متى شئت.</p>
          <HomeButton variant="primary" type="button" className="recipe-primary rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid border-transparent whitespace-nowrap [transition:all_.15s_ease] bg-home-button text-home-button-text [box-shadow:0_1px_3px_rgba(0,0,0,0.06)] [&:hover:not(:disabled)]:bg-home-button-hover [&:hover:not(:disabled)]:[transform:translateY(-1px)] max-[600.01px]:p-[7px_12px] max-[600.01px]:text-[12px] max-[600.01px]:min-h-9" onClick={() => setSelection('new')}>
            <Plus size={18} /> إضافة أول أكلة
          </HomeButton>
        </section>
      ) : !loading && !visible.length && !error ? (
        <section className="recipe-empty p-[40px_14px] text-center flex items-center flex-col gap-2.5 bg-home-panel border border-solid border-home-border rounded-[18px] [&_>_span]:text-[48px] [&_h2]:text-[18px] [&_h2]:font-extrabold [&_h2]:m-0 [&_p]:max-w-90 [&_p]:text-[var(--recipe-muted)] [&_p]:text-[13px] [&_p]:m-0">
          <Search size={36} />
          <h2>لا توجد أكلات مطابقة</h2>
          <p>جرّب مكونات أقل أو أزل بعض الفلاتر.</p>
          <HomeButton variant="secondary"
            type="button"
            className="recipe-secondary rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid whitespace-nowrap [transition:all_.15s_ease] border-[var(--recipe-border)] bg-home-panel text-[var(--recipe-ink)] [&:hover:not(:disabled)]:bg-home-raised [&:hover:not(:disabled)]:border-home-accent [&.is-active-filter]:bg-home-raised [&.is-active-filter]:border-home-accent"
            onClick={() => {
              setFilters(defaultRecipeFilters);
              setSearchMode('title');
            }}
          >
            عرض كل الأكلات
          </HomeButton>
        </section>
      ) : (
        <>
          <div className="recipe-grid grid grid-cols-[repeat(auto-fill,_minmax(260px,_1fr))] gap-4 max-[768.01px]:grid-cols-[repeat(auto-fill,_minmax(220px,_1fr))] max-[768.01px]:gap-3 max-[600.01px]:grid-cols-1 max-[600.01px]:gap-3">
            {displayed.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                open={() => setSelection(recipe)}
                favorite={() => void favorite(recipe.id)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="recipe-show-more-wrap flex justify-center p-[16px_0_6px]">
              <HomeButton
                type="button"
                className="recipe-show-more-btn inline-flex items-center justify-center gap-2 min-h-10.5 p-[9px_24px] rounded-home-control bg-home-panel border border-solid border-home-border text-home-text text-[13.5px] font-bold cursor-pointer [transition:all_.15s_ease] [box-shadow:0_1px_3px_rgba(0,0,0,0.03)] hover:bg-home-raised hover:border-home-accent hover:text-home-accent hover:[transform:translateY(-1px)]"
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              >
                <span>عرض المزيد من الأكلات (متبقي {visible.length - visibleCount})</span>
                <ChevronDown size={16} />
              </HomeButton>
            </div>
          )}
        </>
      )}

      <footer className="recipe-library-footer border-t border-solid border-t-home-border pt-3.5 mt-5 text-[12px] text-[var(--recipe-muted)] flex flex-col gap-1">
        <p>
          {CURRENT_WORKSPACE === 'guest'
            ? 'الأكلات محفوظة على هذا الجهاز. يمكنك تضمينها في نسخة احتياطية من الإعدادات.'
            : 'أكلاتك متاحة دون اتصال، وتتزامن مع حسابك عند توفر الإنترنت.'}
        </p>
      </footer>

      {selection && (
        <RecipeDialog
          key={selection === 'new' ? 'new' : selection.id}
          creating={selection === 'new'}
          recipe={selection === 'new' ? undefined : selection}
          onClose={close}
          onSaved={text => {
            setMessage(text);
            setError('');
          }}
        />
      )}

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </section>
  );
}
