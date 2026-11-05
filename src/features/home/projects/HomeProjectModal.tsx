import { HomeSelect } from '../HomeSelect';
import { HomeWorkflowDialog } from '../HomeWorkflowDialog';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Folder } from 'lucide-react';
import { HomeProject, ProjectStep } from '../../../types';
import { createHomeProject, updateProject } from '../../../db/projectQueries';

interface HomeProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSaved: () => void;
  initialProject?: HomeProject | null;
}

export const HomeProjectModal: React.FC<HomeProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectSaved,
  initialProject,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'backlog' | 'in_progress' | 'waiting' | 'completed'>('in_progress');
  const [targetDate, setTargetDate] = useState('');
  const [steps, setSteps] = useState<Array<{ id: string; title: string; isCompleted: boolean; order: number }>>([]);
  const [newStepText, setNewStepText] = useState('');

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setDescription(initialProject.description || '');
      setStatus(initialProject.status);
      setTargetDate(initialProject.targetDate || '');
      setSteps(initialProject.steps || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('in_progress');
      setTargetDate('');
      setSteps([
        { id: `step_${Date.now()}_1`, title: '', isCompleted: false, order: 1 },
      ]);
    }
  }, [initialProject, isOpen]);

  if (!isOpen) return null;

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    const newStep: ProjectStep = {
      id: `step_${Date.now()}_${steps.length + 1}`,
      title: newStepText.trim(),
      isCompleted: false,
      order: steps.length + 1,
    };
    setSteps([...steps, newStep]);
    setNewStepText('');
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleStepTitleChange = (idx: number, val: string) => {
    const next = [...steps];
    next[idx].title = val;
    setSteps(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validSteps: ProjectStep[] = steps
      .filter((s) => s.title.trim().length > 0)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    if (initialProject) {
      await updateProject(initialProject.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        targetDate: targetDate || undefined,
        steps: validSteps,
      });
    } else {
      await createHomeProject({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        targetDate: targetDate || undefined,
        steps: validSteps,
      });
    }

    onProjectSaved();
    onClose();
  };

  return (
    <HomeWorkflowDialog open={isOpen} onClose={onClose} title="مشروع منزلي">
      <div className="home-legacy-dialog relative w-full max-w-lg max-h-[90vh] overflow-y-auto liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl text-right font-['Tajawal'] no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <button
            aria-label="إغلاق النافذة"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏠</span>
            <h2 className="text-lg font-black text-white">
              {initialProject ? 'تعديل مشروع منزلي' : 'مشروع منزلي جديد'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المشروع المنزلي *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تجديد دهان غرفة المعيشة، ترتيب وتنظيم المخزن..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              وصف المشروع وهدفه (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ما هي النتيجة المرجوة من هذا المشروع المنزلي؟"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Status & Target Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                حالة المشروع
              </label>
              <HomeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as 'backlog' | 'in_progress' | 'waiting' | 'completed')}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
              >
                <option value="in_progress">قيد التنفيذ (نشط)</option>
                <option value="backlog">قيد الانتظار (لاحقاً)</option>
                <option value="waiting">معلق (بانتظار شيء)</option>
                <option value="completed">مكتمل بالكامل</option>
              </HomeSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>الموعد المستهدف (اختياري)</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Sequential Steps Builder */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-400" />
                <span>خطوات المشروع المتسلسلة (تحدد الخطوة القادمة تلقائياً)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {steps.filter((s) => s.title.trim()).length} خطوات
              </span>
            </div>

            {/* List of Steps */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {steps.map((step, idx) => (
                <div key={step.id || idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepTitleChange(idx, e.target.value)}
                    placeholder={`الخطوة ${idx + 1}...`}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Step Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStep();
                  }
                }}
                placeholder="أضف خطوة جديدة واضغط Enter..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </button>
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {initialProject ? 'حفظ التعديلات' : 'إنشاء المشروع'}
            </button>
          </div>
        </form>
      </div>
    </HomeWorkflowDialog>
  );
};
