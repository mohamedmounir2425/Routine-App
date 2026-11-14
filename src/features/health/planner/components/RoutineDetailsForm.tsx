import React from 'react';
import { Dumbbell, Clock } from 'lucide-react';

interface RoutineDetailsFormProps {
  name: string;
  setName: (v: string) => void;
  tag: string;
  setTag: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  selectedCount: number;
  totalEstimatedMinutes: number;
}

export const RoutineDetailsForm: React.FC<RoutineDetailsFormProps> = ({
  name,
  setName,
  tag,
  setTag,
  description,
  setDescription,
  selectedCount,
  totalEstimatedMinutes,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            اسم الروتين *
          </label>
          <input
            type="text"
            placeholder="مثال: روتين الصباح الهادئ، إطالات قبل النوم..."
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            تصنيف الروتين (وسم)
          </label>
          <input
            type="text"
            placeholder="مثال: صباحي، مسائي، علاج طبيعي..."
            value={tag}
            onChange={e => setTag(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            وصف الروتين (اختياري)
          </label>
          <input
            type="text"
            placeholder="اكتب وصفاً أو ملاحظات تذكرك بالهدف من هذا الروتين..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Quick Metrics Badge */}
      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Dumbbell className="w-4 h-4 text-emerald-400" />
          <span>التمارين المختارة:</span>
          <strong className="text-emerald-400 text-sm">{selectedCount}</strong>
        </div>

        <div className="w-px h-4 bg-slate-800" />

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Clock className="w-4 h-4 text-teal-400" />
          <span>المدة التقريبية الكلية:</span>
          <strong className="text-teal-400 text-sm">~{totalEstimatedMinutes} دقيقة</strong>
        </div>
      </div>
    </div>
  );
};
