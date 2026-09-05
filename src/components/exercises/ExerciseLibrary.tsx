import React, { useState } from 'react';
import { Search, Star, Play, Plus, Clock, AlertTriangle, X, Dumbbell, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { Exercise, MuscleCategory } from '../../types';
import { ExerciseAnimation } from '../player/ExerciseAnimation';
import { BACK_SAFETY_TIPS } from '../../db/seedData';

interface Props {
  exercises: Exercise[];
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onAddExercise: (newEx: Omit<Exercise, 'id' | 'createdAt'>) => void;
  onPreviewExerciseInPlayer?: (exercise: Exercise) => void;
}

export const ExerciseLibrary: React.FC<Props> = ({
  exercises,
  onToggleFavorite,
  onAddExercise,
  onPreviewExerciseInPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // New exercise form state
  const [newArabicName, setNewArabicName] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<MuscleCategory>('back');
  const [newDuration, setNewDuration] = useState(60);
  const [newRest, setNewRest] = useState(15);
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [modalViewMode, setModalViewMode] = useState<'video' | 'animation'>('video');

  // Filter exercises
  const filtered = exercises.filter(ex => {
    const matchesSearch = 
      ex.arabicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.targetMuscles.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'favorites') return !!ex.isFavorite;
    return ex.category === selectedCategory;
  });

  const handleCreateExercise = (e: React.FormEvent) => {
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

    setShowAddModal(false);
    // Reset
    setNewArabicName('');
    setNewName('');
    setNewDesc('');
    setNewInstructions('');
    setNewVideoUrl('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
            مكتبة التمارين العلاجية 🏋️
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تمارين آمنة ومعتمدة في التأهيل والعلاج الطبيعي لتقوية الظهر وتليين العمود الفقري.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة تمرين خاص</span>
        </button>
      </div>

      {/* Safety Tips Collapsible Box */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-lg">
        <button
          onClick={() => setShowTips(!showTips)}
          className="w-full flex items-center justify-between gap-3 text-right"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-['Tajawal']">
                7 إرشادات طبية ذهبية لحماية الظهر والديسك 🛡️
              </h3>
              <p className="text-[11px] text-slate-400">قواعد هامة قبل وأثناء ممارسة التمارين</p>
            </div>
          </div>
          <div className="text-slate-400 p-1 rounded-lg bg-slate-800">
            {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showTips && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
            {BACK_SAFETY_TIPS.map(tip => (
              <div key={tip.id} className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {tip.id}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">{tip.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث باسم التمرين أو العضلة المستهدفة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full liquid-glass-pill rounded-2xl pr-10 pl-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'favorites', label: '⭐ المفضلة' },
            { id: 'back', label: 'علاج الظهر' },
            { id: 'core', label: 'تثبيت الجذع' },
            { id: 'mobility', label: 'المرونة والاستطالة' },
            { id: 'neck', label: 'أعلى الظهر والرقبة' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25 liquid-button'
                  : 'liquid-glass-pill text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(ex => (
          <div
            key={ex.id}
            onClick={() => setActiveExercise(ex)}
            className="group relative liquid-glass-card rounded-3xl p-5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Card visual / badge row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold liquid-glass-pill text-slate-300">
                  {ex.category === 'back' ? 'علاج الظهر' : ex.category === 'core' ? 'تقوية الجذع' : 'مرونة وإطالة'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(ex.id, !ex.isFavorite);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-800 transition-colors"
                >
                  <Star className={`w-4 h-4 ${ex.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                </button>
              </div>

              {/* Animation mini preview */}
              <div className="w-full h-28 liquid-glass-pill rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
                <ExerciseAnimation slug={ex.animationSlug} category={ex.category} className="scale-75" />
              </div>

              <h3 className="text-base font-bold text-white font-['Tajawal'] group-hover:text-emerald-400 transition-colors">
                {ex.arabicName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{ex.name}</p>

              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {ex.description}
              </p>
            </div>

            {/* Bottom info row */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {ex.durationSeconds} ثانية
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold group-hover:underline">
                عرض التفاصيل ←
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 liquid-glass rounded-3xl">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">لا توجد تمارين تطابق هذا البحث أو التصنيف.</p>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {activeExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl liquid-glass rounded-3xl p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto my-auto custom-scrollbar">
            <button
              onClick={() => setActiveExercise(null)}
              className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 text-right">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeExercise.category === 'back' ? 'علاج الظهر' : activeExercise.category === 'core' ? 'تقوية الجذع' : 'مرونة وإطالة'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] mt-1">
                {activeExercise.arabicName}
              </h3>
              <p className="text-xs text-slate-400">{activeExercise.name}</p>
            </div>

            {/* Media switcher pills & direct link */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {activeExercise.videoUrl && (
                  <button
                    onClick={() => setModalViewMode('video')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      modalViewMode === 'video' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    فيديو يوتيوب
                  </button>
                )}
                <button
                  onClick={() => setModalViewMode('animation')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    modalViewMode === 'animation' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  رسم توضيحي
                </button>
              </div>

              {activeExercise.youtubeUrl && (
                <a
                  href={activeExercise.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold underline underline-offset-4"
                >
                  <span>فتح في YouTube</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            {/* Visual presentation */}
            <div className="w-full h-48 sm:h-56 bg-slate-950 border border-slate-800 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
              {modalViewMode === 'video' && activeExercise.videoUrl ? (
                <iframe
                  src={activeExercise.videoUrl}
                  title={activeExercise.name}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <ExerciseAnimation slug={activeExercise.animationSlug} category={activeExercise.category} />
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-4 text-right">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  خطوات التنفيذ السليمة:
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {activeExercise.instructions.map((inst, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activeExercise.precautions && activeExercise.precautions.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="block text-[11px] text-amber-400 mb-0.5">تنبيه لمرضى الظهر:</strong>
                    {activeExercise.precautions[0]}
                  </div>
                </div>
              )}

              {/* Muscles */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs text-slate-400">العضلات المستهدفة:</span>
                {activeExercise.targetMuscles.map(m => (
                  <span key={m} className="px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-300">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  const ex = activeExercise;
                  setActiveExercise(null);
                  if (onPreviewExerciseInPlayer) onPreviewExerciseInPlayer(ex);
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>بدء التمرين الفردي الآن</span>
              </button>

              <button
                onClick={() => {
                  onToggleFavorite(activeExercise.id, !activeExercise.isFavorite);
                  setActiveExercise(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
                }}
                className={`p-3 rounded-2xl border transition-colors ${
                  activeExercise.isFavorite
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="إضافة للمفضلة"
              >
                <Star className={`w-4 h-4 ${activeExercise.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-right max-h-[92vh] overflow-y-auto my-auto custom-scrollbar">
            <button
              onClick={() => setShowAddModal(false)}
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

            <form onSubmit={handleCreateExercise} className="space-y-4">
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
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
