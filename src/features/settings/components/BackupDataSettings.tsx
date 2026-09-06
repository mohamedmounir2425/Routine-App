import React, { useState, useRef } from 'react';
import { ShieldCheck, Check, Download, Upload } from 'lucide-react';
import { exportCompleteBackup, importCompleteBackup } from '../../../db';

interface BackupDataSettingsProps {
  onRefreshData?: () => void;
}

export const BackupDataSettings: React.FC<BackupDataSettingsProps> = ({
  onRefreshData,
}) => {
  const [backupMsg, setBackupMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportCompleteBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movecare-backup-${new Date().toISOString().split('T')[0]}.json`;
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg">
      <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        النسخ الاحتياطي والبيانات المحلية
      </h3>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        جميع تمارينك وسجلاتك محفوظة محلياً على هذا الجهاز باستخدام IndexedDB بخصوصية وأمان 100%. يمكنك تصدير بياناتك أو استرجاعها على أي جهاز آخر بنقرة واحدة.
      </p>

      {backupMsg && (
        <div className={`p-3 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2 ${
          backupMsg.isError ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          <Check className="w-4 h-4" />
          <span>{backupMsg.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExportBackup}
          className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/60"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>تصدير نسخة احتياطية (JSON)</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/60"
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
    </div>
  );
};
