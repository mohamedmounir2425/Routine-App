import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { GoalPlan, PlanCategory } from '../../../types';
import { createPlan, updatePlan } from '../../../db/goalPlanQueries';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSaved: () => void;
  initialPlan?: GoalPlan | null;
}

const CATEGORY_OPTIONS: Array<{ key: PlanCategory; label: string; icon: string }> = [
  { key: 'career', label: 'المسار المهني والعمل', icon: '💼' },
  { key: 'faith', label: 'الروحانيات والعبادات', icon: '🕌' },
  { key: 'health', label: 'الصحة والنشاط البدني', icon: '🏋️' },
  { key: 'finance', label: 'المالية والاستثمار', icon: '💰' },
  { key: 'personal', label: 'تطوير الذات والحياة الشخصية', icon: '🌱' },
];

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  onClose,
  onPlanSaved,
  initialPlan,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PlanCategory>('career');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');

  useEffect(() => {
    if (initialPlan) {
      setTitle(initialPlan.title);
      setCategory(initialPlan.category);
      setDescription(initialPlan.description || '');
      setTargetDate(initialPlan.targetDate || '');
      setStatus(initialPlan.status);
    } else {
      setTitle('');
      setCategory('career');
      setDescription('');
      setTargetDate('');
      setStatus('active');
    }
  }, [initialPlan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (initialPlan) {
      await updatePlan(initialPlan.id, {
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        status,
      });
    } else {
      await createPlan({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        targetDate: targetDate || undefined,
        status,
      });
    }

    onPlanSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl text-right font-['Tajawal']">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-black text-white">
              {initialPlan ? 'تعديل الخطة الاستراتيجية' : 'إنشاء خطة استراتيجية جديدة'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              عنوان الخطة أو الهدف الكبير *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إتقان .NET 9، حفظ 5 أجزاء من القرآن، شراء سيارة..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              مجال الخطة في حياتك
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-start gap-2 transition-all cursor-pointer ${
                    category === cat.key
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              لماذا هذه الخطة مهمة؟ وما هي النتيجة المرجوة؟ (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="أكتب بوضوح الدافع وراء هذا الهدف طويل المدى..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          {/* Status & Target Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                حالة الخطة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              >
                <option value="active">نشطة ومستمرة (Active)</option>
                <option value="paused">معلقة مؤقتاً (Paused)</option>
                <option value="completed">مكتملة بالكامل (Completed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>الموعد المستهدف لتحقيقها</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {initialPlan ? 'حفظ التعديلات' : 'إنشاء الخطة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
