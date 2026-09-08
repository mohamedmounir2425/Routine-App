import React from 'react';
import { BarChart2, Compass } from 'lucide-react';
import { UserSettings } from '../../../types';
import { LifeSpaceId } from '../../../types/spaces';

interface ProgressPreferencesSettingsProps {
  settings: UserSettings;
}

export const ProgressPreferencesSettings: React.FC<ProgressPreferencesSettingsProps> = ({
  settings,
}) => {
  const enabledSpaces = (settings.enabledSpaces || ['worship', 'health', 'work', 'home', 'plans']) as LifeSpaceId[];

  // Baseline Life OS weights
  const BASE_WEIGHTS: Record<string, { label: string; icon: string; weight: number; color: string; bg: string }> = {
    worship: { label: 'العبادة', icon: '🕌', weight: 30, color: 'text-emerald-400', bg: 'bg-emerald-500' },
    health: { label: 'الصحة والتمارين', icon: '🏋️', weight: 25, color: 'text-teal-400', bg: 'bg-teal-500' },
    work: { label: 'العمل والمهام', icon: '💼', weight: 25, color: 'text-sky-400', bg: 'bg-sky-500' },
    home: { label: 'المنزل والصيانة', icon: '🏠', weight: 20, color: 'text-amber-400', bg: 'bg-amber-500' },
  };

  // Calculate normalized active weights
  const activeSpaces = Object.keys(BASE_WEIGHTS).filter((id) => enabledSpaces.includes(id as LifeSpaceId));
  const totalActiveBaseWeight = activeSpaces.reduce((acc, id) => acc + BASE_WEIGHTS[id].weight, 0);

  const normalizedWeights: Record<string, number> = {};
  if (totalActiveBaseWeight > 0) {
    activeSpaces.forEach((id) => {
      normalizedWeights[id] = Math.round((BASE_WEIGHTS[id].weight / totalActiveBaseWeight) * 100);
    });
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal'] flex items-center gap-2">
            <span>أوزان واحتساب التقدم اليومي (Progress Architecture)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              100% Normalized
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            آلية احتساب إنجاز اليوم الموحد تلقائياً استناداً لمساحاتك المفعلة بدون تكرار أو ازدواجية.
          </p>
        </div>
      </div>

      {/* Visual Weight Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>توزيع نسب الإنجاز الفعلي لليوم:</span>
          <span className="text-cyan-400">{totalActiveBaseWeight > 0 ? '100%' : '0%'} إجمالي</span>
        </div>

        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          {activeSpaces.map((id) => {
            const pct = normalizedWeights[id] || 0;
            return (
              <div
                key={id}
                style={{ width: `${pct}%` }}
                className={`${BASE_WEIGHTS[id].bg} h-full transition-all duration-500 relative group`}
                title={`${BASE_WEIGHTS[id].label}: ${pct}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Grid of weights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {Object.entries(BASE_WEIGHTS).map(([id, info]) => {
          const isActive = enabledSpaces.includes(id as LifeSpaceId);
          const effectivePct = isActive ? normalizedWeights[id] : 0;

          return (
            <div
              key={id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-950/20 border-slate-900 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-xs font-bold text-white">{info.label}</span>
                </div>
                <span className={`text-xs font-black ${info.color}`}>
                  {isActive ? `${effectivePct}%` : 'معطلة'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>الوزن الأساسي: {info.weight}%</span>
                {isActive && effectivePct !== info.weight && (
                  <span className="text-emerald-400 font-medium">معدل حسب المساحات النشطة</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Exclusion Notice for Plans */}
      <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3 text-xs">
        <Compass className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <span>لماذا لا تدخل مساحة الخطط (🎯) في النسبة اليومية؟</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            الخطط تمثل البوصلة الاستراتيجية (<strong>Why</strong>) بينما اليوم يمثل الإنجاز التنفيذي (<strong>What</strong>). أي مهمة مرتبطة بخطة تُحتسب في مساحتها الأصلية (عمل، منزل، صحة، عبادة) لمنع التكرار وازدواجية الاحتساب، بينما يُقاس تقدم الخطة عبر معالمها ومسارها الاستراتيجي المستقل في <code className="text-indigo-300">/progress/plans</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
