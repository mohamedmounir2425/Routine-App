import { HomeFieldGrid } from '../components/HomeLayouts';
import { HomeButton } from '../components/HomeButton';
import { Checkbox as HomeCheckbox } from 'antd';
import { HomeInput as HomeTextField, HomeTextArea } from '../components/HomeInputs';
import { useState } from 'react';
import { HomeModal } from '../components/HomeModal';
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
  let image = '', video = '', draftImage = '';
  try { image = safeMediaUrl(recipe?.imageUrl ?? ''); } catch { /* Invalid legacy links are never rendered. */ }
  try { video = safeMediaUrl(recipe?.videoUrl ?? '', true); } catch { /* Invalid legacy links are never rendered. */ }
  try { draftImage = safeMediaUrl(draft.imageUrl); } catch { draftImage = ''; }
  return <>
      <HomeModal open={true} onClose={close} title={creating ? 'إضافة وصفة' : editing ? 'تعديل الوصفة' : recipe?.title ?? 'الوصفة'} width={760} className="recipe-dialog [--recipe-ink:var(--home-text)] [--recipe-muted:var(--home-muted)] [--recipe-border:var(--home-border)] [--recipe-accent:var(--home-accent)] text-[var(--recipe-ink)] font-[inherit] text-[14px] leading-[1.6] [color-scheme:inherit] bg-home-panel border border-solid border-home-border [box-shadow:0_24px_60px_rgba(0,_0,_0,_0.25)] flex flex-col overflow-hidden [&_button]:cursor-pointer [&_button]:touch-manipulation [&_button]:font-[inherit] [&_button:disabled]:opacity-[.55] [&_button:disabled]:cursor-wait [&_:focus-visible]:[outline:2px_solid_var(--home-accent)] [&_:focus-visible]:[outline-offset:2px] [&_fieldset]:[border:0] [&_fieldset]:p-0 [&_fieldset]:m-0 [&_legend]:font-bold [&_legend]:text-[13px] [&_legend]:mb-1.5 [&_legend]:w-full" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && editing) { event.preventDefault(); void submit(); } }}>
        <header className="recipe-dialog-header [.home-theme_&]:!bg-home-panel [.home-theme_&]:!shadow-none flex justify-between items-start gap-3 p-[16px_20px] border-b border-solid border-b-home-border shrink-0 [&_h2]:text-[18px] [&_h2]:font-extrabold [&_h2]:m-0 [&_p]:text-[12px] [&_p]:text-[var(--recipe-muted)] [&_p]:m-[2px_0_0]">
          <div><h2>{creating ? 'إضافة وصفة' : editing ? 'تعديل الوصفة' : recipe?.title}</h2><p>{editing ? 'الاسم يكفي للحفظ. باقي التفاصيل اختيارية.' : 'المكونات وطريقة التحضير والتفاصيل المحفوظة.'}</p></div>
          <HomeButton icon={<X size={20} />} type="button" onClick={close} disabled={busy} className="recipe-icon-button w-8.5 h-8.5 inline-flex items-center justify-center border border-solid border-home-border rounded-[10px] bg-home-input text-[var(--recipe-ink)] [transition:all_.15s_ease] hover:border-home-accent hover:text-home-accent [.recipe-ingredient-row_&]:w-8.5 [.recipe-ingredient-row_&]:h-8.5 [.recipe-ingredient-row_&]:text-[#ef4444]" aria-label="إغلاق"></HomeButton>
        </header>
        {editing ? <form id="recipe-form" className="recipe-dialog-body min-h-0 overflow-y-auto overscroll-contain p-[18px_20px] flex flex-col gap-4 [&_h3]:text-[15px] [&_h3]:font-extrabold [&_h3]:m-[0_0_8px] [&_h3]:text-[var(--recipe-ink)]" onSubmit={event => { event.preventDefault(); void submit(); }}>
          <label className="recipe-field flex flex-col gap-[5px] font-bold text-[13px] [&_small]:text-[11px] [&_small]:font-normal [&_small]:text-[var(--recipe-muted)]">اسم الوصفة <span aria-hidden="true">*</span><HomeTextField autoFocus required maxLength={160} value={draft.title} onChange={event => update('title', event.target.value)} placeholder="مثلاً: سندوتش فراخ بالفلفل" /></label>
          <fieldset><legend>نوع الوجبة <small>يمكن اختيار أكثر من وجبة أو تركها دون تصنيف</small></legend><div className="recipe-chips flex items-center gap-[5px] flex-wrap mb-1.5">{MEAL_TYPES.map(type => <HomeButton key={type.id} type="button" className="recipe-chip" aria-pressed={draft.mealTypes.includes(type.id)} onClick={() => update('mealTypes', draft.mealTypes.includes(type.id) ? draft.mealTypes.filter(item => item !== type.id) : [...draft.mealTypes, type.id])}>{type.icon} {type.label}</HomeButton>)}</div></fieldset>
          <fieldset><legend>المكونات <small>الكمية اختيارية — Enter يضيف سطر جديد</small></legend>
            <div className="recipe-ingredient-labels grid grid-cols-[minmax(0,_1.3fr)_minmax(0,_1fr)_34px] gap-2 text-[11.5px] font-bold text-[var(--recipe-muted)] mb-1"><span>المكون</span><span>الكمية / الوحدة</span></div>
            {draft.ingredients.map((ingredient, index) => <div key={index} className="recipe-ingredient-row grid grid-cols-[minmax(0,_1.3fr)_minmax(0,_1fr)_44px] gap-2 mt-1.5 items-center" onKeyDown={event => {
              if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && draft.ingredients.length < 100) { event.preventDefault(); update('ingredients', [...draft.ingredients, { name: '', quantity: '' }]); requestAnimationFrame(() => document.getElementById('ingredient-' + draft.ingredients.length)?.focus()); }
            }}>
              <HomeTextField id={'ingredient-' + index} aria-label={'المكون ' + (index + 1)} maxLength={160} value={ingredient.name} placeholder="بانيه" onChange={event => update('ingredients', draft.ingredients.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
              <HomeTextField aria-label={'كمية المكون ' + (index + 1)} maxLength={120} value={ingredient.quantity} placeholder="نصف كيلو" onChange={event => update('ingredients', draft.ingredients.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} />
              <HomeButton icon={<X size={16} />} type="button" className="recipe-icon-button w-8.5 h-8.5 inline-flex items-center justify-center border border-solid border-home-border rounded-[10px] bg-home-input text-[var(--recipe-ink)] [transition:all_.15s_ease] hover:border-home-accent hover:text-home-accent [.recipe-ingredient-row_&]:w-8.5 [.recipe-ingredient-row_&]:h-8.5 [.recipe-ingredient-row_&]:text-[#ef4444]" aria-label={'حذف المكون ' + (index + 1)} onClick={() => update('ingredients', draft.ingredients.filter((_, i) => i !== index))}></HomeButton>
            </div>)}
            <HomeButton type="button" className="recipe-text-button inline-flex items-center gap-1 text-[12px] font-bold text-[var(--recipe-accent)] [background:none] [border:0] p-[4px_6px] rounded-[6px] hover:bg-home-raised" disabled={draft.ingredients.length >= 100} onClick={() => { update('ingredients', [...draft.ingredients, { name: '', quantity: '' }]); requestAnimationFrame(() => document.getElementById('ingredient-' + draft.ingredients.length)?.focus()); }}><Plus size={16} /> إضافة مكون</HomeButton>
          </fieldset>
          <details className="recipe-extra border border-solid border-home-border rounded-home-control p-[10px_14px] bg-home-raised [&_summary]:cursor-pointer [&_summary]:font-bold [&_summary]:text-[13px] [&_summary]:text-[var(--recipe-accent)]" open={!!recipe}><summary>طريقة التحضير وتفاصيل إضافية</summary><div className="recipe-extra-body flex flex-col gap-3.5 pt-3">
          <label className="recipe-field flex flex-col gap-[5px] font-bold text-[13px] [&_small]:text-[11px] [&_small]:font-normal [&_small]:text-[var(--recipe-muted)]">طريقة التحضير <small>كل خطوة في سطر منفصل</small><HomeTextArea rows={4} maxLength={400000} value={stepsText} onChange={event => setStepsText(event.target.value)} placeholder={'نتبل الفراخ.\nنشوح الفلفل ونضيف الفراخ.\nنجهز السندوتشات.'} /></label>
          <HomeFieldGrid className="recipe-two-columns grid grid-cols-2 gap-3 max-[600.01px]:grid-cols-1"><label className="recipe-field flex flex-col gap-[5px] font-bold text-[13px] [&_small]:text-[11px] [&_small]:font-normal [&_small]:text-[var(--recipe-muted)]">المدة بالدقائق<HomeTextField inputMode="numeric" type="number" min={1} max={1440} step={1} value={draft.durationMinutes ?? ''} onChange={event => update('durationMinutes', event.target.value === '' ? null : Number(event.target.value))} placeholder="اختياري" /></label><label className="recipe-field flex flex-col gap-[5px] font-bold text-[13px] [&_small]:text-[11px] [&_small]:font-normal [&_small]:text-[var(--recipe-muted)]">عدد الأفراد<HomeTextField inputMode="numeric" type="number" min={1} max={100} step={1} value={draft.servings ?? ''} onChange={event => update('servings', event.target.value === '' ? null : Number(event.target.value))} placeholder="اختياري" /></label></HomeFieldGrid>
          <HomeFieldGrid className="recipe-two-columns grid grid-cols-2 gap-3 max-[600.01px]:grid-cols-1">
            <div className="recipe-field flex flex-col gap-[5px] font-bold text-[13px] [&_small]:text-[11px] [&_small]:font-normal [&_small]:text-[var(--recipe-muted)]">
              <span>رابط الصورة</span>
              <HomeTextField
                dir="ltr"
                type="url"
                inputMode="url"
                maxLength={2048}
                value={draft.imageUrl}
                onChange={event => update('imageUrl', event.target.value)}
                placeholder="https://…"
              />
              {draftImage && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={draftImage}
                    alt="معاينة"
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--home-border)' }}
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <small style={{ color: 'var(--home-green-text)', fontSize: 11 }}>معاينة الرابط ✓</small>
                </div>
              )}
            </div>
            <label className="recipe-field flex flex-col gap-[5px] font-bold text-[13px] [&_small]:text-[11px] [&_small]:font-normal [&_small]:text-[var(--recipe-muted)]">
              <span>رابط فيديو YouTube</span>
              <HomeTextField
                dir="ltr"
                type="url"
                inputMode="url"
                maxLength={2048}
                value={draft.videoUrl}
                onChange={event => update('videoUrl', event.target.value)}
                placeholder="https://youtu.be/…"
              />
            </label>
          </HomeFieldGrid>
          <label className="recipe-field flex flex-col gap-[5px] font-bold text-[13px] [&_small]:text-[11px] [&_small]:font-normal [&_small]:text-[var(--recipe-muted)]">ملاحظات<HomeTextArea rows={2} maxLength={8000} value={draft.notes} onChange={event => update('notes', event.target.value)} placeholder="بدائل، تجهيز من بليل، أو تعديل جربتوه…" /></label>
          </div></details>
          <div className="recipe-checks flex flex-wrap gap-4 text-[13px] font-semibold [&_label]:inline-flex [&_label]:items-center [&_label]:gap-1.5 [&_label]:cursor-pointer"><label><HomeCheckbox  checked={draft.isFavorite} onChange={event => update('isFavorite', event.target.checked)} /> إضافة إلى المفضلة</label><label><HomeCheckbox  checked={draft.isLight} onChange={event => update('isLight', event.target.checked)} /> وصفة خفيفة حسب اختيارك</label></div>
        </form> : <div className="recipe-dialog-body min-h-0 overflow-y-auto overscroll-contain p-[18px_20px] flex flex-col gap-4 [&_h3]:text-[15px] [&_h3]:font-extrabold [&_h3]:m-[0_0_8px] [&_h3]:text-[var(--recipe-ink)]">
          {image && !failedImage && <img className="recipe-detail-image w-full h-50 object-cover rounded-home-panel" src={image} alt={recipe?.title} referrerPolicy="no-referrer" onError={() => setFailedImage(true)} />}
          <div className="recipe-chips flex items-center gap-[5px] flex-wrap mb-1.5">{MEAL_TYPES.filter(type => recipe?.mealTypes.includes(type.id)).map(type => <span className="recipe-tag text-[10.5px] font-bold p-[2px_7px] rounded-[6px] bg-home-green-bg text-home-green-text border border-solid border-home-green-border" key={type.id}>{type.icon} {type.label}</span>)}{recipe?.isLight && <span className="recipe-tag text-[10.5px] font-bold p-[2px_7px] rounded-[6px] bg-home-green-bg text-home-green-text border border-solid border-home-green-border">🌿 خفيفة</span>}</div>
          <div className="recipe-meta flex items-center gap-3 text-[var(--recipe-muted)] text-[11px] font-semibold mt-auto border-t border-solid border-t-home-border pt-2 [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1">{recipe?.durationMinutes && <span><Clock3 size={16} /> {recipe.durationMinutes} دقيقة</span>}{recipe?.servings && <span><Users size={16} /> {recipe.servings} أفراد</span>}</div>
          <section><h3>المكونات</h3>{recipe?.ingredients.length ? <ul className="recipe-detail-ingredients list-none p-0 m-0 grid grid-cols-[repeat(auto-fill,_minmax(200px,_1fr))] gap-1.5 [&_li]:flex [&_li]:justify-between [&_li]:gap-2 [&_li]:p-[6px_10px] [&_li]:bg-home-input [&_li]:border [&_li]:border-solid [&_li]:border-home-border [&_li]:rounded-[8px] [&_li]:text-[12.5px] [&_strong]:text-[var(--recipe-accent)] [&_strong]:font-bold">{recipe.ingredients.map((item, i) => <li key={i}><span>{item.name}</span><strong>{item.quantity || 'حسب الحاجة'}</strong></li>)}</ul> : <p className="recipe-muted text-[var(--recipe-muted)] text-[13px]">لم تُضف المكونات بعد.</p>}</section>
          <section><h3>طريقة التحضير</h3>{recipe?.steps.length ? <ol className="recipe-steps list-none p-0 m-0 flex flex-col gap-2.5 [&_li]:flex [&_li]:gap-2.5 [&_li]:items-start [&_li_>_span]:w-6 [&_li_>_span]:h-6 [&_li_>_span]:shrink-0 [&_li_>_span]:rounded-full [&_li_>_span]:bg-home-green-bg [&_li_>_span]:text-home-green-text [&_li_>_span]:border [&_li_>_span]:border-solid [&_li_>_span]:border-home-green-border [&_li_>_span]:grid [&_li_>_span]:place-items-center [&_li_>_span]:text-[11.5px] [&_li_>_span]:font-extrabold [&_p]:m-[2px_0_0] [&_p]:text-[13px] [&_p]:leading-[1.5]">{recipe.steps.map((step, i) => <li key={i}><span>{i + 1}</span><p>{step}</p></li>)}</ol> : <p className="recipe-muted text-[var(--recipe-muted)] text-[13px]">ممكن تضيف الطريقة من تعديل الوصفة.</p>}</section>
          {recipe?.notes && <section className="recipe-note bg-home-raised rounded-home-control p-[12px_14px] text-[12.5px]"><h3>ملاحظات</h3><p className="whitespace-pre-wrap">{recipe.notes}</p></section>}
          {video && <a href={video} target="_blank" rel="noopener noreferrer" className="recipe-secondary rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid whitespace-nowrap [transition:all_.15s_ease] border-[var(--recipe-border)] bg-home-panel text-[var(--recipe-ink)] [&:hover:not(:disabled)]:bg-home-raised [&:hover:not(:disabled)]:border-home-accent [&.is-active-filter]:bg-home-raised [&.is-active-filter]:border-home-accent"><ExternalLink size={16} /> مشاهدة الفيديو على YouTube</a>}
        </div>}
        <footer className="recipe-dialog-footer border-t border-solid border-t-home-border p-[12px_20px] bg-home-panel shrink-0">
          {error && <p className="recipe-error text-home-error-text bg-home-error-bg rounded-[8px] p-[8px_12px] text-[13px] mb-2" role="alert">{error}</p>}
          {confirm ? <div className="recipe-confirm flex items-center justify-between gap-3 bg-[rgba(239,_68,_68,_0.1)] [border:1px_solid_rgba(239,_68,_68,_0.3)] p-[8px_12px] rounded-[10px] [&_p]:m-0 [&_p]:text-[12.5px] [&_p]:font-bold" role="alert"><p>{confirm === 'delete' ? 'هل تريد حذف هذه الوصفة؟' : 'لديك تغييرات غير محفوظة. هل تريد تجاهلها؟'}</p><div className="recipe-chips flex items-center gap-[5px] flex-wrap mb-1.5"><HomeButton variant="danger" disabled={busy} type="button" className="recipe-danger rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid border-transparent whitespace-nowrap [transition:all_.15s_ease] bg-[#a63a2e] text-white [&:hover:not(:disabled)]:bg-[#8e2b20]" onClick={() => confirm === 'delete' ? void remove() : onClose()}>{confirm === 'delete' ? 'تأكيد الحذف' : 'تجاهل التعديلات'}</HomeButton><HomeButton variant="secondary" type="button" disabled={busy} className="recipe-secondary rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid whitespace-nowrap [transition:all_.15s_ease] border-[var(--recipe-border)] bg-home-panel text-[var(--recipe-ink)] [&:hover:not(:disabled)]:bg-home-raised [&:hover:not(:disabled)]:border-home-accent [&.is-active-filter]:bg-home-raised [&.is-active-filter]:border-home-accent" onClick={() => setConfirm(null)}>رجوع</HomeButton></div></div> : <div className="recipe-footer-actions flex gap-2.5 items-center">
            {editing ? <><HomeButton variant="primary" key="save-recipe" type="submit" form="recipe-form" disabled={busy} className="recipe-primary rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid border-transparent whitespace-nowrap [transition:all_.15s_ease] bg-home-button text-home-button-text [box-shadow:0_1px_3px_rgba(0,0,0,0.06)] [&:hover:not(:disabled)]:bg-home-button-hover [&:hover:not(:disabled)]:[transform:translateY(-1px)] max-[600.01px]:p-[7px_12px] max-[600.01px]:text-[12px] max-[600.01px]:min-h-9">{busy ? 'جاري الحفظ…' : 'حفظ الوصفة'}</HomeButton><span className="recipe-shortcut text-[11px] opacity-[.8]">Ctrl + Enter للحفظ</span><HomeButton variant="secondary" type="button" disabled={busy} className="recipe-secondary rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid whitespace-nowrap [transition:all_.15s_ease] border-[var(--recipe-border)] bg-home-panel text-[var(--recipe-ink)] [&:hover:not(:disabled)]:bg-home-raised [&:hover:not(:disabled)]:border-home-accent [&.is-active-filter]:bg-home-raised [&.is-active-filter]:border-home-accent" onClick={close}>إلغاء</HomeButton></> : <><HomeButton variant="primary" key="edit-recipe" autoFocus type="button" className="recipe-primary rounded-home-control p-[8px_16px] min-h-10 inline-flex items-center justify-center gap-2 font-bold text-[13px] no-underline border border-solid border-transparent whitespace-nowrap [transition:all_.15s_ease] bg-home-button text-home-button-text [box-shadow:0_1px_3px_rgba(0,0,0,0.06)] [&:hover:not(:disabled)]:bg-home-button-hover [&:hover:not(:disabled)]:[transform:translateY(-1px)] max-[600.01px]:p-[7px_12px] max-[600.01px]:text-[12px] max-[600.01px]:min-h-9" onClick={event => { event.preventDefault(); setEditing(true); }}>تعديل الوصفة</HomeButton><HomeButton icon={<Trash2 size={19} />} type="button" className="recipe-icon-button recipe-delete w-8.5 h-8.5 inline-flex items-center justify-center border border-solid border-home-border rounded-[10px] bg-home-input text-[var(--recipe-ink)] [transition:all_.15s_ease] hover:border-home-accent hover:text-home-accent [.recipe-ingredient-row_&]:w-8.5 [.recipe-ingredient-row_&]:h-8.5 [.recipe-ingredient-row_&]:text-[#ef4444] [.recipe-footer-actions_&]:ms-auto [.recipe-footer-actions_&]:text-[#ef4444]" aria-label="حذف الوصفة" onClick={() => setConfirm('delete')}></HomeButton></>}
          </div>}
        </footer>
      </HomeModal></>;
}
