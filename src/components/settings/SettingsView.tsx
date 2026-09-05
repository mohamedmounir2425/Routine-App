import React, { useState } from 'react';
import { Bell, Volume2, Download, ShieldCheck, Smartphone, Check } from 'lucide-react';
import { UserSettings } from '../../types';
import { db } from '../../db';

interface Props {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onInstallPwa,
  canInstallPwa = false,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [savedAlert, setSavedAlert] = useState(false);

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        new Notification('روتين اليومي 🧘‍♂️', {
          body: 'تم تفعيل التنبيهات بنجاح! سنذكرك بموعد تمرينك اليومي.',
          icon: '/favicon.ico',
        });
      }
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
    const exercises = await db.exercises.toArray();
    const routines = await db.routines.toArray();
    const weeklySchedule = await db.weeklySchedule.toArray();
    const workoutLogs = await db.workoutLogs.toArray();

    const data = {
      backupDate: new Date().toISOString(),
      exercises,
      routines,
      weeklySchedule,
      workoutLogs,
      settings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routine-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            <div className="text-xs font-bold text-slate-200">إشعارات المتصفح</div>
            <div className="text-[11px] text-slate-400">
              الحالة: {notificationStatus === 'granted' ? 'مفعلة ✓' : 'غير مفعلة'}
            </div>
          </div>

          {notificationStatus !== 'granted' ? (
            <button
              onClick={handleRequestNotification}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition-colors"
            >
              تفعيل الإشعارات
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-400">مسموح بها</span>
          )}
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-xs font-bold text-slate-200">وقت التذكير المفضل</div>
            <div className="text-[11px] text-slate-400">مثال: وقت الاستيقاظ الصباحي</div>
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
          جميع تمارينك وسجلاتك محفوظة محلياً على هذا الجهاز باستخدام IndexedDB بخصوصية وأمان 100%. يمكنك حفظ نسخة احتياطية من بياناتك في أي وقت.
        </p>

        <button
          onClick={handleExportBackup}
          className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700/60"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>تنزيل نسخة احتياطية من التمارين والسجلات (JSON)</span>
        </button>
      </div>
    </div>
  );
};
