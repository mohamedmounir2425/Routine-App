import React, { useState, useRef } from 'react';
import { Bell, Volume2, Download, Upload, ShieldCheck, Smartphone, Check, Send, Sun, Moon } from 'lucide-react';
import { UserSettings } from '../../types';
import { exportCompleteBackup, importCompleteBackup } from '../../db';

interface Props {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
  onRefreshData?: () => void;
  theme?: 'dark' | 'light';
  onSetTheme?: (theme: 'dark' | 'light') => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onInstallPwa,
  canInstallPwa = false,
  onRefreshData,
  theme = 'dark',
  onSetTheme,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [savedAlert, setSavedAlert] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        new Notification('روتين | MoveCare 🧘‍♂️', {
          body: 'تم تفعيل التنبيهات بنجاح! سنذكرك بموعد تمرينك اليومي لصحة ظهرك.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleSendTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🏋️ وقت تمرينك اليومي', {
        body: '15 دقيقة فقط لنفسك ولتخفيف الضغط عن عمودك الفقري. جاهز للبدء؟',
        icon: '/favicon.ico',
      });
    } else {
      handleRequestNotification();
    }
  };

  const handleToggle = (key: keyof UserSettings, val: any) => {
    const updated = { ...settings, [key]: val };
    onUpdateSettings(updated);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  // Export JSON backup
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

  // Import JSON backup
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
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
          الإعدادات والتخصيص ⚙️
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          تخصيص التنبيهات، المساعد الصوتي، ومؤقت الاستراحة ليتناسب مع وتيرة يومك.
        </p>
      </div>

      {savedAlert && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>تم حفظ التعديلات بنجاح!</span>
        </div>
      )}

      {/* PWA Install Promotion */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-500/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-['Tajawal']">تثبيت التطبيق على الشاشة الرئيسية (PWA)</h4>
            <p className="text-xs text-slate-400 mt-0.5">يعمل بكفاءة بدون إنترنت كتطبيق هاتف حقيقي وخفيف</p>
          </div>
        </div>

        {canInstallPwa && onInstallPwa ? (
          <button
            onClick={onInstallPwa}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0"
          >
            تثبيت التطبيق الآن
          </button>
        ) : (
          <span className="text-[11px] text-emerald-400/80 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shrink-0">
            جاهز للتثبيت عبر المتصفح
          </span>
        )}
      </div>

      {/* Theme Selection Card (Dark & Light Mode) */}
      {onSetTheme && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-sky-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>مظهر التطبيق (الوضع الداكن والفاتح)</span>
            </h3>

            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {theme === 'dark' ? 'الوضع الليلي 🌙' : 'الوضع النهاري ☀️'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            اختر النمط الأكثر راحة لعينيك أثناء أداء التمارين في الإضاءة المختلفة.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all active:scale-95 group ${
                theme === 'dark'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400 theme-icon-animate' : 'text-slate-500 group-hover:text-white'}`} />
              <span>الوضع الداكن (Dark)</span>
            </button>

            <button
              type="button"
              onClick={() => onSetTheme('light')}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all active:scale-95 group ${
                theme === 'light'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 shadow-md ring-1 ring-amber-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500 theme-icon-animate' : 'text-slate-500 group-hover:text-amber-400'}`} />
              <span>الوضع الفاتح (Light)</span>
            </button>
          </div>
        </div>
      )}

      {/* Audio & Voice Coach Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2 mb-2">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          الصوت والتوجيه أثناء التمرين
        </h3>

        {/* Beeps */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">الأصوات التنبيهية (Beeps)</div>
            <div className="text-[11px] text-slate-400">نغمات العد التنازلي ونهاية التمرين</div>
          </div>
          <input
            type="checkbox"
            checked={settings.soundBeepsEnabled}
            onChange={(e) => handleToggle('soundBeepsEnabled', e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        {/* Voice Coach */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">المساعد الصوتي الذكي (Voice Guidance)</div>
            <div className="text-[11px] text-slate-400">نطق اسم التمرين والعد التنازلي بالـ Web Speech</div>
          </div>
          <input
            type="checkbox"
            checked={settings.voiceCoachEnabled}
            onChange={(e) => handleToggle('voiceCoachEnabled', e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
          />
        </div>

        {/* Rest Duration */}
        <div className="py-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-200">فترة الاستراحة الافتراضية بين التمارين</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">{settings.defaultRestSeconds} ثانية</span>
          </div>
          <input
            type="range"
            min="10"
            max="45"
            step="5"
            value={settings.defaultRestSeconds}
            onChange={(e) => handleToggle('defaultRestSeconds', Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>10 ثوانٍ</span>
            <span>30 ثانية</span>
            <span>45 ثانية</span>
          </div>
        </div>
      </div>

      {/* Daily Reminders */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-sky-400" />
          تذكيرات التمرين اليومية
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">إشعارات المتصفح والتطبيق</div>
            <div className="text-[11px] text-slate-400">
              الحالة: {notificationStatus === 'granted' ? 'مفعلة ومسموح بها ✓' : notificationStatus === 'denied' ? 'محظورة في إعدادات المتصفح' : 'غير مفعلة'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notificationStatus !== 'granted' ? (
              <button
                onClick={handleRequestNotification}
                className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition-colors"
              >
                تفعيل الإشعارات
              </button>
            ) : (
              <button
                onClick={handleSendTestNotification}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all"
                title="إرسال إشعار تجريبي فوري"
              >
                <Send className="w-3 h-3" />
                <span>إشعار تجريبي 🔔</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-xs font-bold text-slate-200">وقت التذكير المفضل</div>
            <div className="text-[11px] text-slate-400">مثال: وقت الاستيقاظ الصباحي لتذكيرك بتمرين اليوم</div>
          </div>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => handleToggle('reminderTime', e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Backup & Local Data */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
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
    </div>
  );
};
