import React, { useState, useRef } from 'react';
import { 
  Bell, Volume2, Download, Upload, ShieldCheck, Smartphone, Check, Send, 
  Sun, Moon, Video, PlayCircle, VolumeX, Repeat, Palette, Sparkles 
} from 'lucide-react';
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
          إعدادات مشغل التمارين والفيديو، الصوت، المساعد الذكي، والتنبيهات اليومية.
        </p>
      </div>

      {savedAlert && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>تم حفظ الإعدادات وتطبيقها بنجاح!</span>
        </div>
      )}

      {/* ============================================================
          GROUP 1: WORKOUT PLAYER & VIDEO SETTINGS (إعدادات مشغل التمارين والفيديو)
          ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal'] flex items-center gap-2">
                <span>مشغل التمارين وعرض الفيديو</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  YouTube & Video
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                التحكم في تشغيل فيديوهات التمارين، كتم الصوت، وتكرار العرض تلقائياً
              </p>
            </div>
          </div>
        </div>

        {/* 1. Autoplay Video */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <div className="space-y-0.5 pr-1">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <PlayCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>تشغيل فيديو التمرين تلقائياً (Autoplay)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              بدء تشغيل فيديو YouTube فور فتح المشغل وعند الانتقال التلقائي بين التمارين
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.workoutVideoAutoplay ?? true}
            onChange={(e) => handleToggle('workoutVideoAutoplay', e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* 2. Mute Video Audio */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <div className="space-y-0.5 pr-1">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
              <span>كتم صوت فيديو اليوتيوب (Mute Video Audio)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              كتم صوت الفيديو لمنع تداخله مع التوجيه الصوتي والعد التنازلي، وضمان التشغيل التلقائي المباشر في المتصفحات
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.workoutVideoMuted ?? true}
            onChange={(e) => handleToggle('workoutVideoMuted', e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* 3. Loop / Repeat Video */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <div className="space-y-0.5 pr-1">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-teal-400" />
              <span>تكرار تشغيل الفيديو تلقائياً (Loop / Repeat)</span>
            </div>
            <div className="text-[11px] text-slate-400">
              إعادة تشغيل الفيديو بشكل متكرر فور انتهائه حتى ينتهي وقت أداء التمرين
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.workoutVideoLoop ?? true}
            onChange={(e) => handleToggle('workoutVideoLoop', e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* 4. Default View Mode in Player */}
        <div className="py-2">
          <div className="text-xs font-bold text-slate-200 mb-1">
            طريقة العرض الافتراضية للتمرين في المشغل
          </div>
          <div className="text-[11px] text-slate-400 mb-2.5">
            اختر العرض الذي يبدأ به مشغل التمارين أولاً عند تشغيل أي روتين
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleToggle('workoutDefaultViewMode', 'video')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                (settings.workoutDefaultViewMode ?? 'video') === 'video'
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-sm ring-1 ring-rose-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>فيديو يوتيوب الشارح 🎥</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggle('workoutDefaultViewMode', 'animation')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                settings.workoutDefaultViewMode === 'animation'
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-400 shadow-sm ring-1 ring-sky-500/30'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>رسم الحركة التوضيحي 🏃</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          GROUP 2: AUDIO & VOICE COACH (الصوت والمساعد الصوتي)
          ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal']">
              الصوت والمساعد الصوتي أثناء التمرين
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              الأصوات التنبيهية، التوجيه الصوتي، وفترة الاستراحة بين التمارين
            </p>
          </div>
        </div>

        {/* Beeps */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <div>
            <div className="text-xs font-bold text-slate-200">الأصوات التنبيهية (Beeps)</div>
            <div className="text-[11px] text-slate-400">نغمات العد التنازلي ونهاية التمرين</div>
          </div>
          <input
            type="checkbox"
            checked={settings.soundBeepsEnabled}
            onChange={(e) => handleToggle('soundBeepsEnabled', e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Voice Coach */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <div>
            <div className="text-xs font-bold text-slate-200">المساعد الصوتي الذكي (Voice Guidance)</div>
            <div className="text-[11px] text-slate-400">نطق اسم التمرين والعد التنازلي بالـ Web Speech</div>
          </div>
          <input
            type="checkbox"
            checked={settings.voiceCoachEnabled}
            onChange={(e) => handleToggle('voiceCoachEnabled', e.target.checked)}
            className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
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

      {/* ============================================================
          GROUP 3: DAILY REMINDERS & NOTIFICATIONS (التنبيهات وتذكيرات التمرين)
          ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal']">
              تذكيرات التمرين اليومية
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              إشعارات المتصفح والتطبيق وتوقيت التذكير المناسب ليومك
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <div>
            <div className="text-xs font-bold text-slate-200">إشعارات المتصفح والتطبيق</div>
            <div className="text-[11px] text-slate-400">
              الحالة: {notificationStatus === 'granted' ? 'مفعلة ومسموح بها ✓' : notificationStatus === 'denied' ? 'محظورة في إعدادات المتصفح' : 'غير مفعلة'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notificationStatus !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition-colors"
              >
                تفعيل الإشعارات
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendTestNotification}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer select-none"
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
            <div className="text-[11px] text-slate-400">مثال: وقت الاستيقاظ الصباحي أو المسائي لتذكيرك بجلسة اليوم</div>
          </div>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => handleToggle('reminderTime', e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ============================================================
          GROUP 4: THEME & DISPLAY (مظهر التطبيق والعرض)
          ============================================================ */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal']">
              المظهر وتثبيت التطبيق
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              التبديل بين الوضع الداكن والفاتح، وتثبيت التطبيق على الشاشة الرئيسية
            </p>
          </div>
        </div>

        {onSetTheme && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">نمط العرض (الوضع الداكن / الفاتح)</span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {theme === 'dark' ? 'الوضع الليلي 🌙' : 'الوضع النهاري ☀️'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all active:scale-95 cursor-pointer select-none group ${
                  theme === 'dark'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'}`} />
                <span>الوضع الداكن (Dark)</span>
              </button>

              <button
                type="button"
                onClick={() => onSetTheme('light')}
                className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 font-bold text-xs transition-all active:scale-95 cursor-pointer select-none group ${
                  theme === 'light'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-amber-500' : 'text-slate-500 group-hover:text-amber-400'}`} />
                <span>الوضع الفاتح (Light)</span>
              </button>
            </div>
          </div>
        )}

        {/* PWA Section */}
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-slate-200">تطبيق الهاتف الخفيف (PWA)</div>
              <div className="text-[11px] text-slate-400">يعمل بدون إنترنت كتطبيق هاتف حقيقي وخفيف</div>
            </div>
          </div>
          {canInstallPwa && onInstallPwa ? (
            <button
              type="button"
              onClick={onInstallPwa}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0"
            >
              تثبيت التطبيق الآن
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400/80 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 shrink-0 text-center">
              جاهز للتثبيت عبر المتصفح
            </span>
          )}
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
