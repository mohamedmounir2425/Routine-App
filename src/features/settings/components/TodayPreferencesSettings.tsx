import React from 'react';
import { Calendar } from 'lucide-react';
import { TodayPreferences, DEFAULT_TODAY_PREFERENCES, UserSettings } from '../../../types';

interface TodayPreferencesSettingsProps {
  settings: UserSettings;
  onUpdatePreferences: (prefs: TodayPreferences) => void;
}

export const TodayPreferencesSettings: React.FC<TodayPreferencesSettingsProps> = ({
  settings,
  onUpdatePreferences,
}) => {
  const prefs: TodayPreferences = settings.todayPreferences || DEFAULT_TODAY_PREFERENCES;

  const updateField = <K extends keyof TodayPreferences>(key: K, val: TodayPreferences[K]) => {
    const updated = {
      ...prefs,
      [key]: val,
    };
    onUpdatePreferences(updated);
  };

  const updateSubField = (
    group: 'worshipOptions' | 'workOptions' | 'homeOptions' | 'plansOptions',
    key: string,
    val: boolean
  ) => {
    const updated = {
      ...prefs,
      [group]: {
        ...(prefs[group] || {}),
        [key]: val,
      },
    };
    onUpdatePreferences(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal'] flex items-center gap-2">
            <span>تفضيلات مركز التنفيذ اليومي (Today)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Single Execution Center
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تخصيص ما يظهر في صفحة اليوم الرئيسية من أنشطة ومهام ومؤشرات لكل مساحة.
          </p>
        </div>
      </div>

      {/* 1. Worship Section */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🕌</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">مساحة العبادة</h4>
              <p className="text-[11px] text-slate-400">إظهار قسم العبادات في صفحة اليوم</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateField('showWorship', !prefs.showWorship)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              prefs.showWorship ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.showWorship ? 'right-1' : 'right-6'
              }`}
            />
          </button>
        </div>

        {prefs.showWorship && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.worshipOptions?.prayers ?? true}
                onChange={(e) => updateSubField('worshipOptions', 'prayers', e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-slate-300 font-medium">الصلوات الخمس</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.worshipOptions?.azkar ?? true}
                onChange={(e) => updateSubField('worshipOptions', 'azkar', e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-slate-300 font-medium">أذكار الصباح والمساء</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.worshipOptions?.quran ?? true}
                onChange={(e) => updateSubField('worshipOptions', 'quran', e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-slate-300 font-medium">الورد القرآني</span>
            </label>
          </div>
        )}
      </div>

      {/* 2. Health Section */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏋️</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">مساحة الصحة والتمارين</h4>
              <p className="text-[11px] text-slate-400">إظهار تمرين اليوم وعداد السلسلة في صفحة اليوم</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateField('showHealth', !prefs.showHealth)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              prefs.showHealth ? 'bg-teal-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.showHealth ? 'right-1' : 'right-6'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Work Section */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💼</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">مساحة العمل والمهام</h4>
              <p className="text-[11px] text-slate-400">إظهار مهام العمل ومؤقت التركيز في صفحة اليوم</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateField('showWork', !prefs.showWork)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              prefs.showWork ? 'bg-sky-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.showWork ? 'right-1' : 'right-6'
              }`}
            />
          </button>
        </div>

        {prefs.showWork && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.workOptions?.top3Only ?? false}
                onChange={(e) => updateSubField('workOptions', 'top3Only', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded"
              />
              <span className="text-slate-300 font-medium">التركيز على أهم 3 مهام ذات أولوية فقط</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.workOptions?.focusTimer ?? true}
                onChange={(e) => updateSubField('workOptions', 'focusTimer', e.target.checked)}
                className="w-4 h-4 accent-sky-500 rounded"
              />
              <span className="text-slate-300 font-medium">إظهار ويدجت جلسات التركيز السريعة (Pomodoro)</span>
            </label>
          </div>
        )}
      </div>

      {/* 4. Home Section */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏠</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">مساحة المنزل والصيانة</h4>
              <p className="text-[11px] text-slate-400">إظهار روتين المنزل والإجراءات التالية في اليوم</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateField('showHome', !prefs.showHome)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              prefs.showHome ? 'bg-amber-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.showHome ? 'right-1' : 'right-6'
              }`}
            />
          </button>
        </div>

        {prefs.showHome && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.homeOptions?.routines ?? true}
                onChange={(e) => updateSubField('homeOptions', 'routines', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-slate-300 font-medium">إظهار الروتين المنزلي المتكرر</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.homeOptions?.nextActionsOnly ?? true}
                onChange={(e) => updateSubField('homeOptions', 'nextActionsOnly', e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <span className="text-slate-300 font-medium">إظهار الإجراء التالي فقط لكل مشروع</span>
            </label>
          </div>
        )}
      </div>

      {/* 5. Plans Section */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎯</span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">مساحة الخطط والأهداف</h4>
              <p className="text-[11px] text-slate-400">إظهار مؤشرات تقدم الخطط الاستراتيجية ومهامها المرتبطة</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateField('showPlans', !prefs.showPlans)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              prefs.showPlans ? 'bg-indigo-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.showPlans ? 'right-1' : 'right-6'
              }`}
            />
          </button>
        </div>

        {prefs.showPlans && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.plansOptions?.showActiveProgress ?? true}
                onChange={(e) => updateSubField('plansOptions', 'showActiveProgress', e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
              <span className="text-slate-300 font-medium">إظهار شريط التقدم للخطط النشطة</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={prefs.plansOptions?.showDailyActions ?? true}
                onChange={(e) => updateSubField('plansOptions', 'showDailyActions', e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
              <span className="text-slate-300 font-medium">إظهار وربط المهام ذات الصلة بالخطط</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
