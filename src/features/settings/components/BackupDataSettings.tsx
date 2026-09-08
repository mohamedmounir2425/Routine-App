import React, { useState, useRef } from 'react';
import { ShieldCheck, Check, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { exportCompleteBackup, importCompleteBackup } from '../../../db';

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportCompleteBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `routine-life-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg({ text: 'تم تصدير ملف النسخة الاحتياطية بنجاح!' });
      setTimeout(() => setBackupMsg(null), 3000);
    } catch {
      setBackupMsg({ text: 'فشل تصدير النسخة الاحتياطية', isError: true });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importCompleteBackup(content);
        if (res.success) {
          setBackupMsg({ text: res.message });
          if (onRefreshData) onRefreshData();
        } else {
          setBackupMsg({ text: res.message, isError: true });
        }
        setTimeout(() => setBackupMsg(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        جميع بياناتك ومهامك وسجلاتك محفوظة محلياً على هذا الجهاز باستخدام IndexedDB بخصوصية وأمان 100%. يمكنك تصدير بياناتك أو استرجاعها على أي جهاز آخر بنقرة واحدة.
      </p>

      {backupMsg && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
          backupMsg.isError ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          <Check className="w-4 h-4" />
          <span>{backupMsg.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleExportBackup}
          className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/60 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>تصدير نسخة احتياطية (JSON)</span>
        </button>

        <button
          type="button"
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
