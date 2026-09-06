import React from 'react';
import { Bell, Send } from 'lucide-react';
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
              onClick={onRequestNotification}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition-colors"
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

      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-xs font-bold text-slate-200">وقت التذكير المفضل</div>
          <div className="text-[11px] text-slate-400">مثال: وقت الاستيقاظ الصباحي أو المسائي لتذكيرك بجلسة اليوم</div>
        </div>
        <input
          type="time"
          value={settings.reminderTime}
          onChange={(e) => onToggle('reminderTime', e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
};
