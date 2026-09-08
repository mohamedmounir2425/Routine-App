import React, { useState } from 'react';
import { LIFE_SPACES_CONFIG } from '../../../config/spacesConfig';
import { LifeSpaceId } from '../../../types/spaces';
import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface Props {
  isOpen: boolean;
  onSave: (enabledSpaces: LifeSpaceId[]) => void;
}

export const SpacesOnboardingModal: React.FC<Props> = ({ isOpen, onSave }) => {
  const { t } = useTranslation();
  const [selectedSpaces, setSelectedSpaces] = useState<LifeSpaceId[]>([
    'worship',
    'health',
    'work',
    'home',
    'plans',
  ]);

  if (!isOpen) return null;

  const toggleSpace = (id: LifeSpaceId) => {
    setSelectedSpaces((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    // Ensure at least one space is selected
    const fallback: LifeSpaceId[] = ['worship', 'health'];
    const finalSelection: LifeSpaceId[] = selectedSpaces.length > 0 ? selectedSpaces : fallback;
    onSave(finalSelection);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg liquid-glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border-emerald-500/30 text-right font-['Tajawal']">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto mb-5 shadow-xl shadow-emerald-500/25">
          <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-2xl">
            🌟
          </div>
        </div>

        <h2 className="text-2xl font-black text-white text-center">
          مرحباً بك في روتين لايف OS
        </h2>
        <p className="text-sm text-slate-300 text-center mt-2 mb-6 leading-relaxed">
          جهّز مساحاتك اليومية. اختر المجالات التي ترغب بإدارتها ويمكنك تعديلها في أي وقت من الإعدادات.
        </p>

        {/* Spaces Selection List */}
        <div className="space-y-3 mb-6">
          {LIFE_SPACES_CONFIG.map((space) => {
            const isSelected = selectedSpaces.includes(space.id);
            return (
              <div
                key={space.id}
                onClick={() => toggleSpace(space.id)}
                className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-2xl sm:text-3xl shrink-0 p-1.5 rounded-xl bg-slate-900/60 border border-white/5">
                    {space.icon}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {t(space.titleKey as any)}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {t(space.descriptionKey as any)}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-white/20 bg-black/20'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer liquid-button"
        >
          <Sparkles className="w-5 h-5 text-slate-950" />
          <span>ابدأ يومك الآن</span>
        </button>
      </div>
    </div>
  );
};
