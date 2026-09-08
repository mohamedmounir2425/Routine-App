import React from 'react';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import { LIFE_SPACES_CONFIG } from '../../../config/spacesConfig';
import { LifeSpaceId } from '../../../types/spaces';
import { UserSettings } from '../../../types';
import { useTranslation } from '../../../i18n';

interface SpacesSettingsProps {
  settings: UserSettings;
  onToggle: (key: keyof UserSettings, val: any) => void;
}

export const SpacesSettings: React.FC<SpacesSettingsProps> = ({
  settings,
  onToggle,
}) => {
  const { t } = useTranslation();
  const currentEnabled = (settings.enabledSpaces || ['worship', 'health', 'work', 'home', 'plans']) as LifeSpaceId[];

  const handleToggleSpace = (spaceId: LifeSpaceId) => {
    let updated: LifeSpaceId[];
    if (currentEnabled.includes(spaceId)) {
      // Don't allow disabling all spaces - require at least one
      if (currentEnabled.length <= 1) return;
      updated = currentEnabled.filter((id) => id !== spaceId);
    } else {
      updated = [...currentEnabled, spaceId];
    }
    onToggle('enabledSpaces', updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
          <LayoutGrid className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal'] flex items-center gap-2">
            <span>مساحات الحياة (Life Spaces)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              {currentEnabled.length} مفعلة
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            تفعيل أو تعطيل مساحات النظام الأساسية. المساحات المعطلة لن تظهر في شريط التنقل أو اليوم.
          </p>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {LIFE_SPACES_CONFIG.map((space) => {
          const isEnabled = currentEnabled.includes(space.id as LifeSpaceId);
          const isLastRemaining = isEnabled && currentEnabled.length === 1;

          return (
            <div
              key={space.id}
              onClick={() => !isLastRemaining && handleToggleSpace(space.id as LifeSpaceId)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all select-none cursor-pointer ${
                isEnabled
                  ? 'bg-slate-950/70 border-slate-700/80 hover:border-emerald-500/40 shadow-sm'
                  : 'bg-slate-950/30 border-slate-800/40 opacity-60 hover:opacity-80'
              } ${isLastRemaining ? 'cursor-not-allowed opacity-90' : ''}`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="text-2xl shrink-0 p-2 rounded-xl bg-slate-900 border border-white/5">
                  {space.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {t(space.titleKey as any)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {isEnabled ? 'مفعلة' : 'معطلة'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {t(space.descriptionKey as any)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pr-2">
                <button
                  type="button"
                  disabled={isLastRemaining}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLastRemaining) handleToggleSpace(space.id as LifeSpaceId);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEnabled ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                  aria-label={`تبديل ${t(space.titleKey as any)}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      isEnabled ? 'right-1' : 'right-6'
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {currentEnabled.length === 1 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-2 text-[11px] text-amber-300 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>يجب الإبقاء على مساحة واحدة مفعلة على الأقل لضمان عمل النظام بشكل صحيح.</span>
        </div>
      )}
    </div>
  );
};
