import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Exercise, MuscleCategory } from '../../../types';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (newEx: Omit<Exercise, 'id' | 'createdAt'>) => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  onAddExercise,
}) => {
  const [newArabicName, setNewArabicName] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MuscleCategory>('back');
  const [newDuration, setNewDuration] = useState(60);
  const [newRest, setNewRest] = useState(15);
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArabicName.trim()) return;

    onAddExercise({
      arabicName: newArabicName.trim(),
      name: newName.trim() || newArabicName.trim(),
      category: newCategory,
      durationSeconds: Number(newDuration) || 60,
      restAfterSeconds: Number(newRest) || 15,
      description: newDesc.trim() || 'تمرين مخصص وموصى به',
      instructions: newInstructions.split('\n').filter(i => i.trim()),
      targetMuscles: [newCategory === 'back' ? 'أسفل الظهر' : 'عضلات الجسم'],
      videoUrl: newVideoUrl.trim() || undefined,
      isFavorite: true,
    });

    onClose();
    setNewArabicName('');
    setNewName('');
    setNewDesc('');
    setNewInstructions('');
    setNewVideoUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-right max-h-[92vh] overflow-y-auto my-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white font-['Tajawal'] mb-1">
          إضافة تمرين جديد للمكتبة ➕
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          أدخل بيانات التمرين الموصى به لك من طبيبك أو أخصائي العلاج الطبيعي.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم التمرين بالعربية *</label>
            <input
              type="text"
              required
              placeholder="مثال: إطالة عضلة الفخذ الخلفية"
              value={newArabicName}
              onChange={(e) => setNewArabicName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">التصنيف</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MuscleCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="back">علاج الظهر</option>
                <option value="core">تقوية الجذع</option>
                <option value="mobility">مرونة واستطالة</option>
                <option value="neck">رقبة وأعلى الظهر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">المدة (ثواني)</label>
              <input
                type="number"
                min="15"
                max="300"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الراحة (ثواني)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={newRest}
                onChange={(e) => setNewRest(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">خطوات التنفيذ (كل سطر خطوة)</label>
            <textarea
              rows={3}
              placeholder="الخطوة الأولى...&#10;الخطوة الثانية..."
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">رابط يوتيوب أو فيديو (اختياري)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/embed/..."
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              حفظ التمرين
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
