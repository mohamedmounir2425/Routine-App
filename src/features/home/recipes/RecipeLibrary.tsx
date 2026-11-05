import { Card } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, Clock3, Heart, Plus, Search, Sparkles, UtensilsCrossed } from 'lucide-react';
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
    <Card className="recipe-card" styles={{ body: { padding: 0 } }}>
      <button type="button" className="recipe-card-open" onClick={open} aria-label={'عرض وصفة ' + recipe.title}>
        <div className={`recipe-card-cover ${hasImage ? 'has-img' : 'no-img'}`}>
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
            <div className="recipe-card-placeholder">
              <span className="recipe-placeholder-icon" aria-hidden="true">
                {MEAL_TYPES.find(type => recipe.mealTypes.includes(type.id))?.icon ?? '🍽️'}
              </span>
            </div>
          )}
          <button
            type="button"
            className={`recipe-card-favorite ${recipe.isFavorite ? 'is-fav' : ''}`}
            aria-label={(recipe.isFavorite ? 'إزالة من المفضلة: ' : 'إضافة للمفضلة: ') + recipe.title}
            aria-pressed={recipe.isFavorite}
            onClick={e => {
              e.stopPropagation();
              favorite();
            }}
          >
            <Heart size={16} fill={recipe.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="recipe-card-content">
          <div className="recipe-chips">
            {MEAL_TYPES.filter(type => recipe.mealTypes.includes(type.id)).map(type => (
              <span className="recipe-tag" key={type.id}>
                {type.icon} {type.label}
              </span>
            ))}
            {!recipe.mealTypes.length && <span className="recipe-tag">لأي وقت</span>}
          </div>
          <h2>{recipe.title}</h2>
          <p>
            {recipe.ingredients.length
              ? recipe.ingredients.slice(0, 4).map(item => item.name).join(' • ')
              : 'أضف المكونات وطريقة التحضير لاحقًا'}
          </p>
          <div className="recipe-meta">
            {recipe.durationMinutes !== null && (
              <span>
                <Clock3 size={12} /> {recipe.durationMinutes} دقيقة
              </span>
            )}
            {recipe.isLight && <span>🌿 خفيفة</span>}
          </div>
        </div>
      </button>
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
    <section className="recipe-library" dir="rtl">
      <header className="kitchen-unified-header">
        <div className="kitchen-header-right">
          <span className="kitchen-eyebrow">
            <UtensilsCrossed size={15} /> المطبخ
          </span>
          <div className="kitchen-segmented-switch" role="tablist" aria-label="أقسام المطبخ">
            <NavLink
              to="/home/recipes"
              className={({ isActive }) => `kitchen-switch-btn ${isActive ? 'is-active' : ''}`}
            >
              <span className="switch-full">🍲 أكلات البيت</span>
              <span className="switch-short">🍲 أكلات</span>
            </NavLink>
            <NavLink
              to="/home/inventory"
              className={({ isActive }) => `kitchen-switch-btn ${isActive ? 'is-active' : ''}`}
            >
              <span className="switch-full">🧊 خزين البيت</span>
              <span className="switch-short">🧊 خزين</span>
            </NavLink>
          </div>
        </div>

        <div className="kitchen-header-left">
          {visible.length > 0 && (
            <button
              type="button"
              className="kitchen-action-btn secondary"
              onClick={() => {
                const randomRecipe = visible[Math.floor(Math.random() * visible.length)];
                setSelection(randomRecipe);
              }}
              title="اقتراح أكلة عشوائية (R)"
              aria-label="اقتراح أكلة عشوائية"
            >
              <Sparkles size={15} />
              <span className="hidden-sm">اقترح لي <span className="kitchen-kbd-cue">(R)</span></span>
            </button>
          )}
          <button
            ref={add}
            type="button"
            className="kitchen-action-btn primary"
            onClick={() => setSelection('new')}
            title="إضافة أكلة جديدة (N)"
            aria-keyshortcuts="N"
          >
            <Plus size={16} />
            <span>إضافة أكلة</span>
          </button>
          <button
            type="button"
            className="kitchen-action-btn secondary kitchen-shortcuts-btn"
            onClick={() => setShowShortcuts(true)}
            title="اختصارات لوحة المفاتيح (?)"
            aria-label="اختصارات لوحة المفاتيح"
          >
            <kbd style={{ fontSize: 11, padding: '2px 5px', borderRadius: 4, background: 'var(--home-kbd-bg, rgba(0,0,0,0.06))' }}>?</kbd>
          </button>
        </div>
      </header>

      {/* تبويبات نوع الوجبة بتمرير سلس */}
      <div className="recipe-meal-tabs-wrap">
        <nav className="recipe-meal-tabs" aria-label="نوع الوجبة">
          <button
            type="button"
            aria-pressed={filters.meal === 'all'}
            onClick={() => setFilters({ ...filters, meal: 'all' })}
          >
            🍽️ الكل ({recipes.length})
          </button>
          {MEAL_TYPES.map(type => {
            const count = recipes.filter(r => r.mealTypes.includes(type.id)).length;
            return (
              <button
                key={type.id}
                type="button"
                aria-pressed={filters.meal === type.id}
                onClick={() => setFilters({ ...filters, meal: type.id })}
              >
                {type.icon} {type.label} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </nav>
      </div>

      <section className="recipe-search-panel" aria-label="البحث والفلترة">
        <div className="recipe-search-toolbar">
          <div className="recipe-search-toolbar-main">
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

          <div className="recipe-search-toolbar-side">
            <HomeSelect
              aria-label="ترتيب الأكلات"
              value={filters.sort}
              onChange={value => setFilters(f => ({ ...f, sort: value }))}
              options={[
                { value: 'recent', label: '⇅ آخر تعديل' },
                { value: 'title', label: '⇅ الاسم أبجديًا' },
                { value: 'duration', label: '⇅ الأسرع تحضيرًا' }
              ]}
              className="recipe-sort-select"
            />

            <div className="recipe-toggle-flags" role="toolbar" aria-label="فلاتر سريعة">
              <button
                type="button"
                className={`recipe-toggle-chip ${filters.favorites ? 'is-active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, favorites: !f.favorites }))}
                aria-pressed={filters.favorites}
                title="تصفية بالمفضلة (F)"
              >
                <Heart size={13} fill={filters.favorites ? 'currentColor' : 'none'} />
                <span>المفضلة ({recipes.filter(r => r.isFavorite).length})</span>
              </button>
              <button
                type="button"
                className={`recipe-toggle-chip ${filters.quick ? 'is-active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, quick: !f.quick }))}
                aria-pressed={filters.quick}
                title="سريعة التحضير في 30 دقيقة أو أقل"
              >
                <Clock3 size={13} />
                <span>≤٣٠د ({recipes.filter(r => r.durationMinutes !== null && r.durationMinutes <= 30).length})</span>
              </button>
              <button
                type="button"
                className={`recipe-toggle-chip ${filters.light ? 'is-active' : ''}`}
                onClick={() => setFilters(f => ({ ...f, light: !f.light }))}
                aria-pressed={filters.light}
                title="أكلات خفيفة وصحية"
              >
                <span>🌿</span>
                <span>خفيفة ({recipes.filter(r => r.isLight).length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="recipe-result-heading">
        <p aria-live="polite">
          {loading
            ? 'جارٍ تحميل الأكلات…'
            : hasMore
            ? `عرض ${displayed.length} من أصل ${visible.length} أكلة${filters.meal === 'all' ? ' لكل الأوقات' : ' مناسبة للوجبة'}`
            : `${visible.length} أكلة${filters.meal === 'all' ? ' لكل الأوقات' : ' مناسبة للوجبة'}`}
        </p>
        {(JSON.stringify(filters) !== JSON.stringify(defaultRecipeFilters) || searchMode !== 'title') && (
          <button
            type="button"
            className="recipe-text-button"
            onClick={() => {
              setFilters(defaultRecipeFilters);
              setSearchMode('title');
            }}
          >
            مسح البحث والفلاتر
          </button>
        )}
      </div>

      {message && <p role="status" className="recipe-success">{message}</p>}
      {error && <p role="alert" className="recipe-error">{error}</p>}

      {!loading && !error && !recipes.length ? (
        <section className="recipe-empty">
          <span aria-hidden="true">🥘</span>
          <h2>أكلاتك المفضلة تبدأ من هنا</h2>
          <p>أضف اسم أكلة تحبها، وأكمل المكونات والتفاصيل متى شئت.</p>
          <button type="button" className="recipe-primary" onClick={() => setSelection('new')}>
            <Plus size={18} /> إضافة أول أكلة
          </button>
        </section>
      ) : !loading && !visible.length && !error ? (
        <section className="recipe-empty">
          <Search size={36} />
          <h2>لا توجد أكلات مطابقة</h2>
          <p>جرّب مكونات أقل أو أزل بعض الفلاتر.</p>
          <button
            type="button"
            className="recipe-secondary"
            onClick={() => {
              setFilters(defaultRecipeFilters);
              setSearchMode('title');
            }}
          >
            عرض كل الأكلات
          </button>
        </section>
      ) : (
        <>
          <div className="recipe-grid">
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
            <div className="recipe-show-more-wrap">
              <button
                type="button"
                className="recipe-show-more-btn"
                onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              >
                <span>عرض المزيد من الأكلات (متبقي {visible.length - visibleCount})</span>
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <footer className="recipe-library-footer">
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
