import React, { useState, useRef } from 'react';
import { ShieldCheck, Check, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { exportCompleteBackup, importCompleteBackup, previewBackup, SAFETY_BACKUP_KEY, type BackupConflictMode } from '../../../db';

interface BackupDataSettingsProps {
  onRefreshData?: () => void;
  onResetDefaults?: () => void;
}

export const BackupDataSettings: React.FC<BackupDataSettingsProps> = ({
  onRefreshData,
  onResetDefaults,
}) => {
  const [backupMsg, setBackupMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pending, setPending] = useState<{ content: string; name: string; summary: Awaited<ReturnType<typeof previewBackup>> } | null>(null);
  const [mode, setMode] = useState<BackupConflictMode>('keep-existing');
  const [busy, setBusy] = useState(false);
  const [hasSafety, setHasSafety] = useState(() => !!localStorage.getItem(SAFETY_BACKUP_KEY));
  const download = (content: string, prefix = 'routine-life-os-backup') => {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = prefix + '-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportCompleteBackup();
      download(jsonStr);
      setBackupMsg({ text: 'تم تصدير ملف النسخة الاحتياطية بنجاح!' });
      setTimeout(() => setBackupMsg(null), 3000);
    } catch {
      setBackupMsg({ text: 'فشل تصدير النسخة الاحتياطية', isError: true });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setPending(null);
    setBackupMsg(null);
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('حجم الملف أكبر من 25 ميجابايت');
      const content = await file.text();
      const summary = await previewBackup(content);
      setMode('keep-existing');
      setPending({ content, name: file.name, summary });
    } catch (error) {
      setBackupMsg({ text: error instanceof Error ? error.message : 'تعذر قراءة الملف', isError: true });
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const result = await importCompleteBackup(pending.content, mode);
      setHasSafety(!!localStorage.getItem(SAFETY_BACKUP_KEY));
      setBackupMsg({ text: result.message, isError: !result.success });
      if (result.success) { setPending(null); onRefreshData?.(); }
    } finally { setBusy(false); }
  };

  const handleConfirmReset = () => {
    if (onResetDefaults) {
      onResetDefaults();
      setShowResetConfirm(false);
      setBackupMsg({ text: 'تمت استعادة إعدادات المصنع الافتراضية بنجاح!' });
      setTimeout(() => setBackupMsg(null), 3000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-teal-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal']">
            النسخ الاحتياطي والبيانات المحلية
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            حفظ واسترجاع بيانات النظام محلياً أو استعادة الضبط الافتراضي
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        النسخة تشمل البيانات المحفوظة على الجهاز، وتعمل بدون Supabase. انقل ملف JSON للموبايل، وافتح نفس التطبيق ثم اختر استرجاع من ملف. الملف يحتوي بياناتك الشخصية؛ احتفظ به في مكان موثوق. النقل يدوي ولا يزامن الجهازين تلقائيًا.
      </p>

      {backupMsg && (
        <div role="status" aria-live="polite" className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          backupMsg.isError ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          <Check className="w-4 h-4" />
          <span>{backupMsg.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={handleExportBackup}
          className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/60 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>تصدير نسخة احتياطية (JSON)</span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/60 cursor-pointer"
        >
          <Upload className="w-4 h-4 text-teal-400" />
          <span>استرجاع من ملف (Restore JSON)</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
        />
      </div>

      {busy && <p role="status" className="text-sm text-teal-300">جارٍ معالجة الملف…</p>}
      {hasSafety && <button type="button" disabled={busy} className="text-sm text-teal-300 underline py-2" onClick={() => {
        const content = localStorage.getItem(SAFETY_BACKUP_KEY);
        if (content) download(content, 'lifeos-before-import');
      }}>تنزيل نسخة الأمان قبل آخر استيراد</button>}
      {pending && <section aria-label="معاينة الاستيراد" className="border border-teal-500/30 rounded-2xl p-4 space-y-4 text-sm text-slate-200">
        <h4 className="font-bold">معاينة الملف قبل الاستيراد</h4>
        <p className="break-all">{pending.name}</p>
        <p className="text-xs text-slate-400">إصدار الملف: {pending.summary.version} · تاريخ التصدير: {pending.summary.exportedAt && !Number.isNaN(Date.parse(pending.summary.exportedAt)) ? new Date(pending.summary.exportedAt).toLocaleString('ar-EG') : 'غير متاح'}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs"><thead><tr><th scope="col" className="text-start p-2">البيانات</th><th scope="col">بالملف</th><th scope="col">جديد</th><th scope="col">مختلف</th></tr></thead>
            <tbody>{pending.summary.tables.map(row => <tr key={row.name} className="border-t border-slate-800"><th scope="row" className="text-start p-2">{({ exercises: 'التمارين', routines: 'الروتينات', workoutLogs: 'سجل التمارين', weeklySchedule: 'الجدول الأسبوعي', settings: 'الإعدادات', azkarLogs: 'سجل الأذكار', tasks: 'المهام', projects: 'المشاريع', plans: 'الأهداف', planMilestones: 'مراحل الأهداف', workoutSchedules: 'مواعيد التمارين', dayPlans: 'خطة اليوم' } as Record<string, string>)[row.name] || row.name}</th><td className="text-center">{row.total}</td><td className="text-center">{row.added}</td><td className="text-center">{row.conflicts}</td></tr>)}</tbody>
          </table>
        </div>
        <p>تفضيلات مختلفة: {pending.summary.preferenceConflicts}</p>
        <fieldset disabled={busy} className="space-y-3"><legend className="mb-2 font-bold">لو نفس السجل موجود على الجهاز:</legend>
          <label className="flex items-center gap-2"><input type="radio" name="backup-mode" checked={mode === 'keep-existing'} onChange={() => setMode('keep-existing')} />احتفظ بالموجود وأضف الجديد فقط</label>
          <label className="flex items-center gap-2"><input type="radio" name="backup-mode" checked={mode === 'use-file'} onChange={() => setMode('use-file')} />استخدم نسخة الملف بدل الموجود</label>
        </fieldset>
        <p className="text-xs text-amber-200 leading-relaxed">لن تُحذف بيانات غير موجودة بالملف. الاختيار يطبق على كل السجلات والتفضيلات المتعارضة، والمعاينة لا تحدد أي نسخة أحدث. تُحفظ نسخة أمان محلية قبل التطبيق. الاستيراد لا يرفع البيانات للسحابة مباشرة.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" disabled={busy} onClick={confirmImport} className="bg-teal-700 rounded-xl px-4 py-3 font-bold">تأكيد الاستيراد</button>
          <button type="button" disabled={busy} onClick={() => setPending(null)} className="bg-slate-800 rounded-xl px-4 py-3">إلغاء</button>
        </div>
      </section>}
      {/* Reset to Defaults Section */}
      {onResetDefaults && (
        <div className="pt-3 border-t border-slate-800/80">
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة الإعدادات الافتراضية للنظام (Reset Settings)</span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>هل أنت متأكد من رغبتك في استعادة الإعدادات الافتراضية؟</span>
              </div>
              <p className="text-[11px] text-slate-400">
                سيتم إعادة ضبط التفضيلات، والمساحات المفعلة، وأوقات التذكيرات للوضع الموصى به بدون مسح بياناتك وسجلاتك.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy || !!pending}
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  نعم، استعادة الافتراضي
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
