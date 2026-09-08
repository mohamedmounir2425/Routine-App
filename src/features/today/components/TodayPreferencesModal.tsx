import React, { useState } from 'react';
import { X, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { TodayPreferences, DEFAULT_TODAY_PREFERENCES } from '../../../types';
import { saveTodayPreferences } from '../todayPreferencesService';
import { updateUserSettings } from '../../../db';

interface TodayPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: TodayPreferences;
  onSavePreferences: (prefs: TodayPreferences) => void;
}

export const TodayPreferencesModal: React.FC<TodayPreferencesModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSavePreferences,
}) => {
  const [prefs, setPrefs] = useState<TodayPreferences>({ ...currentPreferences });

  if (!isOpen) return null;

  const handleToggle = (key: keyof TodayPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    saveTodayPreferences(prefs);
    updateUserSettings({ todayPreferences: prefs }).catch(console.error);
    onSavePreferences(prefs);
    onClose();
  };

  const handleReset = () => {
    setPrefs({ ...DEFAULT_TODAY_PREFERENCES });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/15 w-full max-w-lg space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Tajawal']">
                تخصيص شاشة اليوم
              </h3>
              <p className="text-xs text-slate-400">
                تحكم في المساحات والأنواع التي تظهر في جدولك اليومي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 1. Worship Space */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>🕌</span>
                <span>مساحة العبادة</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.showWorship}
                onChange={() => handleToggle('showWorship')}
                className="w-4 h-4 rounded text-emerald-500 bg-white/10 border-white/20 cursor-pointer"
              />
            </div>

            {prefs.showWorship && (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.worshipOptions?.prayers !== false}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        worshipOptions: { ...(prev.worshipOptions || {}), prayers: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-emerald-500"
                  />
                  <span>الصلوات</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.worshipOptions?.azkar !== false}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        worshipOptions: { ...(prev.worshipOptions || {}), azkar: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-emerald-500"
                  />
                  <span>الأذكار</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.worshipOptions?.quran !== false}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        worshipOptions: { ...(prev.worshipOptions || {}), quran: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-emerald-500"
                  />
                  <span>ورد القرآن</span>
                </label>
              </div>
            )}
          </div>

          {/* 2. Health Space */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <span>🏋️</span>
              <span>مساحة الصحة والتمارين</span>
            </span>
            <input
              type="checkbox"
              checked={prefs.showHealth}
              onChange={() => handleToggle('showHealth')}
              className="w-4 h-4 rounded text-cyan-500 bg-white/10 border-white/20 cursor-pointer"
            />
          </div>

          {/* 3. Work Space */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>💼</span>
                <span>مساحة العمل</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.showWork}
                onChange={() => handleToggle('showWork')}
                className="w-4 h-4 rounded text-indigo-500 bg-white/10 border-white/20 cursor-pointer"
              />
            </div>

            {prefs.showWork && (
              <div className="pt-1 border-t border-white/5 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.workOptions?.top3Only === true}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        workOptions: { ...(prev.workOptions || {}), top3Only: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-indigo-500"
                  />
                  <span>التركيز على أهم ٣ أولويات فقط (Top 3 Focus)</span>
                </label>
              </div>
            )}
          </div>

          {/* 4. Home Space */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>🏠</span>
                <span>مساحة المنزل والمشاريع</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.showHome}
                onChange={() => handleToggle('showHome')}
                className="w-4 h-4 rounded text-amber-500 bg-white/10 border-white/20 cursor-pointer"
              />
            </div>

            {prefs.showHome && (
              <div className="space-y-1.5 pt-1 border-t border-white/5 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.homeOptions?.nextActionsOnly === true}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        homeOptions: { ...(prev.homeOptions || {}), nextActionsOnly: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-amber-500"
                  />
                  <span>الاقتصار على الخطوة القادمة للمشاريع (Next Actions Only)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.homeOptions?.routines !== false}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        homeOptions: { ...(prev.homeOptions || {}), routines: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-amber-500"
                  />
                  <span>إظهار الروتين المنزلي المتكرر</span>
                </label>
              </div>
            )}
          </div>

          {/* 5. Plans Space */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>🎯</span>
                <span>مساحة الخطط الاستراتيجية</span>
              </span>
              <input
                type="checkbox"
                checked={prefs.showPlans}
                onChange={() => handleToggle('showPlans')}
                className="w-4 h-4 rounded text-violet-500 bg-white/10 border-white/20 cursor-pointer"
              />
            </div>

            {prefs.showPlans && (
              <div className="space-y-1.5 pt-1 border-t border-white/5 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.plansOptions?.showActiveProgress !== false}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        plansOptions: { ...(prev.plansOptions || {}), showActiveProgress: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-violet-500"
                  />
                  <span>إظهار بطاقات تقدم الخطط النشطة</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.plansOptions?.showDailyActions !== false}
                    onChange={(e) =>
                      setPrefs((prev) => ({
                        ...prev,
                        plansOptions: { ...(prev.plansOptions || {}), showDailyActions: e.target.checked },
                      }))
                    }
                    className="w-3.5 h-3.5 rounded text-violet-500"
                  />
                  <span>إظهار خطوات الخطط في قائمة اليوم</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-lg shadow-emerald-500/20"
            >
              حفظ التفضيلات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
