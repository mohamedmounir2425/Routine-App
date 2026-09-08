import React from 'react';
import { Bell, Send, Clock, Armchair } from 'lucide-react';
import { UserSettings } from '../../../types';

interface DailyRemindersSettingsProps {
  settings: UserSettings;
  onToggle: (key: keyof UserSettings, val: any) => void;
  notificationStatus: string;
  onRequestNotification: () => void;
  onSendTestNotification: () => void;
}

export const DailyRemindersSettings: React.FC<DailyRemindersSettingsProps> = ({
  settings,
  onToggle,
  notificationStatus,
  onRequestNotification,
  onSendTestNotification,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal']">
            تذكيرات التمرين والاستراحة
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            إشعارات المتصفح الذكية لتثبيت الاستمرارية وحماية عمودك الفقري
          </p>
        </div>
      </div>

      {/* Permission Status */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div>
          <div className="text-xs font-bold text-slate-200">إشعارات النظام والمتصفح</div>
          <div className="text-[11px] text-slate-400">
            الحالة: {notificationStatus === 'granted' ? 'مفعلة ومسموح بها ✓' : notificationStatus === 'denied' ? 'محظورة في إعدادات المتصفح' : 'تحتاج إذن تفعيل'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notificationStatus !== 'granted' ? (
            <button
              type="button"
              onClick={onRequestNotification}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition-colors cursor-pointer"
            >
              تفعيل الإشعارات
            </button>
          ) : (
            <button
              type="button"
              onClick={onSendTestNotification}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all cursor-pointer select-none"
              title="إرسال إشعار تجريبي فوري"
            >
              <Send className="w-3 h-3" />
              <span>إشعار تجريبي 🔔</span>
            </button>
          )}
        </div>
      </div>

      {/* Daily Workout Reminder Toggle */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div>
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>تذكير التمرين اليومي</span>
          </div>
          <div className="text-[11px] text-slate-400">
            تنبيهك إذا لم تكن قد تمرنت بعد بحلول الوقت المحدد
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle('reminderEnabled', !settings.reminderEnabled)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
            settings.reminderEnabled ? 'bg-emerald-500' : 'bg-slate-800'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
              settings.reminderEnabled ? 'right-1' : 'right-6'
            }`}
          />
        </button>
      </div>

      {/* Preferred Workout Time */}
      {settings.reminderEnabled && (
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80 animate-in fade-in">
          <div>
            <div className="text-xs font-bold text-slate-200">وقت التذكير المفضل</div>
            <div className="text-[11px] text-slate-400">الوقت الأنسب لك في اليوم (مثلاً: 18:30)</div>
          </div>
          <input
            type="time"
            value={settings.reminderTime || '18:30'}
            onChange={(e) => onToggle('reminderTime', e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-['Inter']"
          />
        </div>
      )}

      {/* Work Break Reminder Toggle */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div>
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Armchair className="w-3.5 h-3.5 text-sky-400" />
            <span>تذكير استراحة المكتب والتمدد</span>
          </div>
          <div className="text-[11px] text-slate-400">
            تذكيرك كل فترة للوقوف والتمدد لمدة 60 ثانية لحماية فقرات ظهرك
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggle('workBreakReminderEnabled', !settings.workBreakReminderEnabled)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
            settings.workBreakReminderEnabled ? 'bg-sky-500' : 'bg-slate-800'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
              settings.workBreakReminderEnabled ? 'right-1' : 'right-6'
            }`}
          />
        </button>
      </div>

      {/* Work Break Interval */}
      {settings.workBreakReminderEnabled && (
        <div className="flex items-center justify-between py-2 animate-in fade-in">
          <div>
            <div className="text-xs font-bold text-slate-200">تكرار استراحة العمل</div>
            <div className="text-[11px] text-slate-400">المدة بين كل استراحة تمدد والأخرى</div>
          </div>
          <select
            value={settings.workBreakIntervalMinutes || 45}
            onChange={(e) => onToggle('workBreakIntervalMinutes', Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value={30}>كل 30 دقيقة</option>
            <option value={45}>كل 45 دقيقة (موصى به)</option>
            <option value={60}>كل 60 دقيقة</option>
          </select>
        </div>
      )}
    </div>
  );
};
