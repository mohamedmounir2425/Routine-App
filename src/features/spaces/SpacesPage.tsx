import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpLeft, Sparkles } from 'lucide-react';
import { getEnabledSpaceConfigs } from '../../config/spacesConfig';
import { useTranslation } from '../../i18n';
import { getSpaceTheme } from '../../theme/spaceTheme';

interface SpacesPageProps {
  enabledSpaces?: string[];
  streakCount?: number;
  todayRoutineName?: string;
  onStartRoutine?: () => void;
}

export const SpacesPage: React.FC<SpacesPageProps> = ({ enabledSpaces }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const spaces = getEnabledSpaceConfigs(enabledSpaces);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🧩</span>
            <h1 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
              مساحات الحياة | Life Spaces
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            أركان يومك المتكاملة: أدر عبادتك وصحتك وعملك وبيتك وخططك في مكان واحد متناغم
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{spaces.length} مساحات نشطة</span>
          </div>
        </div>
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {spaces.map((space) => {
          const theme = getSpaceTheme(space.id);
          const isFullWidth = space.id === 'plans' && spaces.length % 2 !== 0;

          return (
            <div
              key={space.id}
              onClick={() => navigate(space.route)}
              className={`liquid-glass-card rounded-3xl p-5 sm:p-6 border ${theme.badgeBorderClass} ${theme.cardBorderHoverClass} transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${
                isFullWidth ? 'md:col-span-2' : ''
              }`}
            >
              {/* Dynamic Subtle Glow */}
              <div
                className={`absolute top-0 right-0 w-36 h-36 ${theme.badgeBgClass} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
              />

              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl ${theme.badgeBgClass} border ${theme.badgeBorderClass} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}
                    >
                      {space.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white font-['Tajawal'] flex items-center gap-2">
                        {t(space.titleKey as any)}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {t(space.descriptionKey as any)}
                      </p>
                    </div>
                  </div>

                  <button
                    className="p-2 rounded-xl liquid-glass-pill text-slate-300 group-hover:text-white group-hover:border-white/30 transition-all shrink-0 cursor-pointer"
                    title="دخول المساحة"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(space.route);
                    }}
                  >
                    <ArrowUpLeft className="w-4 h-4 rtl:-scale-x-100" />
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Shortcut Pills */}
              <div className="pt-4 mt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {space.navigation.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                      className={`px-2.5 py-1 rounded-lg ${theme.badgeBgClass} ${theme.textClass} hover:brightness-125 font-medium text-[11px] transition-all cursor-pointer`}
                    >
                      {t(item.labelKey as any)}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors hidden sm:inline font-bold">
                  دخول المساحة ←
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
