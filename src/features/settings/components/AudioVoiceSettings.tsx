import React from 'react';
import { Volume2 } from 'lucide-react';
import { UserSettings } from '../../../types';

interface AudioVoiceSettingsProps {
  settings: UserSettings;
  onToggle: (key: keyof UserSettings, val: any) => void;
}

export const AudioVoiceSettings: React.FC<AudioVoiceSettingsProps> = ({
  settings,
  onToggle,
}) => {
  return (
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
          onChange={(e) => onToggle('soundBeepsEnabled', e.target.checked)}
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
          onChange={(e) => onToggle('voiceCoachEnabled', e.target.checked)}
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
          onChange={(e) => onToggle('defaultRestSeconds', Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>10 ثوانٍ</span>
          <span>30 ثانية</span>
          <span>45 ثانية</span>
        </div>
      </div>
    </div>
  );
};
