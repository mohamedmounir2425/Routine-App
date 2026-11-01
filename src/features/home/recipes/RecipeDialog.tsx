import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Clock3, ExternalLink, Plus, Trash2, Users, X } from 'lucide-react';
import { MEAL_TYPES, emptyRecipe, safeMediaUrl, type Recipe, type RecipeDraft } from './recipeModel';
import { deleteRecipe, saveRecipe } from './recipeRepository';

export function RecipeDialog({ recipe, creating, onClose, onSaved }: { recipe?: Recipe; creating: boolean; onClose: () => void; onSaved: (message: string) => void }) {
  const [editing, setEditing] = useState(creating);
  const [draft, setDraft] = useState<RecipeDraft>(() => recipe ? { ...recipe, ingredients: recipe.ingredients.map(item => ({ ...item })), steps: [...recipe.steps] } : emptyRecipe());
  const [stepsText, setStepsText] = useState(recipe?.steps.join('\n') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<'discard' | 'delete' | null>(null);
  const [failedImage, setFailedImage] = useState(false);
  const initial = recipe ?? emptyRecipe();
  const dirty = editing && (JSON.stringify({ ...draft, steps: stepsText.split('\n') }) !== JSON.stringify({ ...initial, steps: initial.steps.length ? initial.steps : [''] }));
  const close = () => { if (busy) return; if (dirty) setConfirm('discard'); else onClose(); };
  const update = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) => setDraft(current => ({ ...current, [key]: value }));
  const submit = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await saveRecipe({ ...draft, steps: stepsText.split('\n') }, recipe); onSaved(recipe ? 'تم حفظ تغييرات الوصفة.' : 'تمت إضافة الوصفة.'); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر الحفظ. حاول تاني.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!recipe || busy) return;
    setBusy(true); setError('');
    try { await deleteRecipe(recipe); onSaved('تم حذف الوصفة.'); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر الحذف.'); setConfirm(null); }
    finally { setBusy(false); }
  };
  let image = '', video = '';
  try { image = safeMediaUrl(recipe?.imageUrl ?? ''); } catch { /* Invalid legacy links are never rendered. */ }
  try { video = safeMediaUrl(recipe?.videoUrl ?? '', true); } catch { /* Invalid legacy links are never rendered. */ }
  return <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="recipe-overlay" />
      <Dialog.Content dir="rtl" className="recipe-dialog home-theme" onPointerDownOutside={event => { event.preventDefault(); }} onEscapeKeyDown={event => { event.preventDefault(); close(); }} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && editing) { event.preventDefault(); void submit(); } }}>
        <header className="recipe-dialog-header">
          <div><Dialog.Title>{creating ? 'إضافة وصفة' : editing ? 'تعديل الوصفة' : recipe?.title}</Dialog.Title><Dialog.Description>{editing ? 'الاسم يكفي للحفظ. باقي التفاصيل اختيارية.' : 'المكونات وطريقة التحضير والتفاصيل المحفوظة.'}</Dialog.Description></div>
          <button type="button" onClick={close} disabled={busy} className="recipe-icon-button" aria-label="إغلاق"><X size={20} /></button>
        </header>
        {editing ? <form id="recipe-form" className="recipe-dialog-body" onSubmit={event => { event.preventDefault(); void submit(); }}>
          <label className="recipe-field">اسم الوصفة <span aria-hidden="true">*</span><input autoFocus required maxLength={160} value={draft.title} onChange={event => update('title', event.target.value)} placeholder="مثلاً: سندوتش فراخ بالفلفل" /></label>
          <fieldset><legend>نوع الوجبة <small>يمكن اختيار أكثر من وجبة أو تركها دون تصنيف</small></legend><div className="recipe-chips">{MEAL_TYPES.map(type => <button key={type.id} type="button" className="recipe-chip" aria-pressed={draft.mealTypes.includes(type.id)} onClick={() => update('mealTypes', draft.mealTypes.includes(type.id) ? draft.mealTypes.filter(item => item !== type.id) : [...draft.mealTypes, type.id])}>{type.icon} {type.label}</button>)}</div></fieldset>
          <fieldset><legend>المكونات <small>الكمية اختيارية — Enter يضيف سطر جديد</small></legend>
            <div className="recipe-ingredient-labels"><span>المكون</span><span>الكمية / الوحدة</span></div>
            {draft.ingredients.map((ingredient, index) => <div key={index} className="recipe-ingredient-row" onKeyDown={event => {
              if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && draft.ingredients.length < 100) { event.preventDefault(); update('ingredients', [...draft.ingredients, { name: '', quantity: '' }]); requestAnimationFrame(() => document.getElementById('ingredient-' + draft.ingredients.length)?.focus()); }
            }}>
              <input id={'ingredient-' + index} aria-label={'المكون ' + (index + 1)} maxLength={160} value={ingredient.name} placeholder="بانيه" onChange={event => update('ingredients', draft.ingredients.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
              <input aria-label={'كمية المكون ' + (index + 1)} maxLength={120} value={ingredient.quantity} placeholder="نصف كيلو" onChange={event => update('ingredients', draft.ingredients.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} />
              <button type="button" className="recipe-icon-button" aria-label={'حذف المكون ' + (index + 1)} onClick={() => update('ingredients', draft.ingredients.filter((_, i) => i !== index))}><X size={16} /></button>
            </div>)}
            <button type="button" className="recipe-text-button" disabled={draft.ingredients.length >= 100} onClick={() => { update('ingredients', [...draft.ingredients, { name: '', quantity: '' }]); requestAnimationFrame(() => document.getElementById('ingredient-' + draft.ingredients.length)?.focus()); }}><Plus size={16} /> إضافة مكون</button>
          </fieldset>
          <details className="recipe-extra" open={!!recipe}><summary>طريقة التحضير وتفاصيل إضافية</summary><div className="recipe-extra-body">
          <label className="recipe-field">طريقة التحضير <small>كل خطوة في سطر منفصل</small><textarea rows={4} maxLength={400000} value={stepsText} onChange={event => setStepsText(event.target.value)} placeholder={'نتبل الفراخ.\nنشوح الفلفل ونضيف الفراخ.\nنجهز السندوتشات.'} /></label>
          <div className="recipe-two-columns"><label className="recipe-field">المدة بالدقائق<input inputMode="numeric" type="number" min={1} max={1440} step={1} value={draft.durationMinutes ?? ''} onChange={event => update('durationMinutes', event.target.value === '' ? null : Number(event.target.value))} placeholder="اختياري" /></label><label className="recipe-field">عدد الأفراد<input inputMode="numeric" type="number" min={1} max={100} step={1} value={draft.servings ?? ''} onChange={event => update('servings', event.target.value === '' ? null : Number(event.target.value))} placeholder="اختياري" /></label></div>
          <div className="recipe-two-columns"><label className="recipe-field">رابط الصورة<input dir="ltr" type="url" inputMode="url" maxLength={2048} value={draft.imageUrl} onChange={event => update('imageUrl', event.target.value)} placeholder="https://…" /></label><label className="recipe-field">رابط فيديو YouTube<input dir="ltr" type="url" inputMode="url" maxLength={2048} value={draft.videoUrl} onChange={event => update('videoUrl', event.target.value)} placeholder="https://youtu.be/…" /></label></div>
          <label className="recipe-field">ملاحظات<textarea rows={2} maxLength={8000} value={draft.notes} onChange={event => update('notes', event.target.value)} placeholder="بدائل، تجهيز من بليل، أو تعديل جربتوه…" /></label>
          </div></details>
          <div className="recipe-checks"><label><input type="checkbox" checked={draft.isFavorite} onChange={event => update('isFavorite', event.target.checked)} /> إضافة إلى المفضلة</label><label><input type="checkbox" checked={draft.isLight} onChange={event => update('isLight', event.target.checked)} /> وصفة خفيفة حسب اختيارك</label></div>
        </form> : <div className="recipe-dialog-body">
          {image && !failedImage && <img className="recipe-detail-image" src={image} alt={recipe?.title} referrerPolicy="no-referrer" onError={() => setFailedImage(true)} />}
          <div className="recipe-chips">{MEAL_TYPES.filter(type => recipe?.mealTypes.includes(type.id)).map(type => <span className="recipe-tag" key={type.id}>{type.icon} {type.label}</span>)}{recipe?.isLight && <span className="recipe-tag">🌿 خفيفة</span>}</div>
          <div className="recipe-meta">{recipe?.durationMinutes && <span><Clock3 size={16} /> {recipe.durationMinutes} دقيقة</span>}{recipe?.servings && <span><Users size={16} /> {recipe.servings} أفراد</span>}</div>
          <section><h3>المكونات</h3>{recipe?.ingredients.length ? <ul className="recipe-detail-ingredients">{recipe.ingredients.map((item, i) => <li key={i}><span>{item.name}</span><strong>{item.quantity || 'حسب الحاجة'}</strong></li>)}</ul> : <p className="recipe-muted">لم تُضف المكونات بعد.</p>}</section>
          <section><h3>طريقة التحضير</h3>{recipe?.steps.length ? <ol className="recipe-steps">{recipe.steps.map((step, i) => <li key={i}><span>{i + 1}</span><p>{step}</p></li>)}</ol> : <p className="recipe-muted">ممكن تضيف الطريقة من تعديل الوصفة.</p>}</section>
          {recipe?.notes && <section className="recipe-note"><h3>ملاحظات</h3><p className="whitespace-pre-wrap">{recipe.notes}</p></section>}
          {video && <a href={video} target="_blank" rel="noopener noreferrer" className="recipe-secondary"><ExternalLink size={16} /> مشاهدة الفيديو على YouTube</a>}
        </div>}
        <footer className="recipe-dialog-footer">
          {error && <p className="recipe-error" role="alert">{error}</p>}
          {confirm ? <div className="recipe-confirm" role="alert"><p>{confirm === 'delete' ? 'هل تريد حذف هذه الوصفة؟' : 'لديك تغييرات غير محفوظة. هل تريد تجاهلها؟'}</p><div className="recipe-chips"><button disabled={busy} type="button" className="recipe-danger" onClick={() => confirm === 'delete' ? void remove() : onClose()}>{confirm === 'delete' ? 'تأكيد الحذف' : 'تجاهل التعديلات'}</button><button type="button" disabled={busy} className="recipe-secondary" onClick={() => setConfirm(null)}>رجوع</button></div></div> : <div className="recipe-footer-actions">
            {editing ? <><button type="submit" form="recipe-form" disabled={busy} className="recipe-primary">{busy ? 'جاري الحفظ…' : 'حفظ الوصفة'}</button><span className="recipe-shortcut">Ctrl + Enter للحفظ</span><button type="button" disabled={busy} className="recipe-secondary" onClick={close}>إلغاء</button></> : <><button autoFocus type="button" className="recipe-primary" onClick={() => setEditing(true)}>تعديل الوصفة</button><button type="button" className="recipe-icon-button recipe-delete" aria-label="حذف الوصفة" onClick={() => setConfirm('delete')}><Trash2 size={19} /></button></>}
          </div>}
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
