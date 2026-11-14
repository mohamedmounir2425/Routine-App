import { HomePanel, HomeFieldGrid } from '../components/HomeLayouts';
import { HomeButton } from '../components/HomeButton';
import { HomeInput as HomeTextField, HomeTextArea } from '../components/HomeInputs';
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
  const [reviewDate, setReviewDate] = useState('');
  const [steps, setSteps] = useState<Array<{ id: string; title: string; isCompleted: boolean; order: number }>>([]);
  const [newStepText, setNewStepText] = useState('');

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setDescription(initialProject.description || '');
      setStatus(initialProject.status);
      setTargetDate(initialProject.targetDate || '');
      setReviewDate(initialProject.reviewDate || '');
      setSteps(initialProject.steps || []);
    } else {
      setTitle('');
      setDescription('');
      setStatus('in_progress');
      setTargetDate('');
      setReviewDate('');
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
        reviewDate: reviewDate || undefined,
        steps: validSteps,
      });
    } else {
      await createHomeProject({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        targetDate: targetDate || undefined,
        reviewDate: reviewDate || undefined,
        steps: validSteps,
      });
    }

    onProjectSaved();
    onClose();
  };

  return (
    <HomeWorkflowDialog open={isOpen} onClose={onClose} title="مشروع منزلي">
      <HomePanel className="home-form-surface relative max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-7 text-right no-scrollbar [.home-modal-content>&]:overflow-y-auto w-full border-0 bg-home-panel font-home text-home-text shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-home-border mb-5">
          <HomeButton icon={<X className="w-5 h-5" />}
            aria-label="إغلاق النافذة"
            onClick={onClose}
            className="p-2 rounded-xl text-home-muted hover:text-home-text hover:bg-home-selection transition-colors cursor-pointer"
          >
          </HomeButton>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏠</span>
            <h2 className="text-lg font-black text-home-text">
              {initialProject ? 'تعديل مشروع منزلي' : 'مشروع منزلي جديد'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5">
              اسم المشروع المنزلي *
            </label>
            <HomeTextField
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تجديد دهان غرفة المعيشة، تركيب شفاط المطبخ..."
              required
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5">
              وصف المشروع وهدفه (اختياري)
            </label>
            <HomeTextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ما هي النتيجة المرجوة من هذا المشروع المنزلي؟"
              rows={2}
              className="w-full"
            />
          </div>

          {/* Status & Target Date Grid */}
          <HomeFieldGrid>
            <div>
              <label className="block text-xs font-bold text-home-text mb-1.5">
                حالة المشروع
              </label>
              <HomeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as 'backlog' | 'in_progress' | 'waiting' | 'completed')}
                className="w-full"
              >
                <option value="in_progress">قيد التنفيذ (نشط)</option>
                <option value="backlog">لاحقًا / مؤجل (لا يدخل اليوم تلقائيًا)</option>
                <option value="waiting">معلق (بانتظار طرف أو مورد)</option>
                <option value="completed">مكتمل بالكامل</option>
              </HomeSelect>
            </div>

            <div>
              <label className="block text-xs font-bold text-home-text mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-home-accent" />
                <span>الموعد المستهدف (اختياري)</span>
              </label>
              <HomeTextField
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full"
              />
            </div>
          </HomeFieldGrid>

          <div>
            <label className="block text-xs font-bold text-home-text mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-home-accent" />
              <span>تاريخ المراجعة الدورية (اختياري — مثالي للمشاريع المؤجلة)</span>
            </label>
            <HomeTextField
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Sequential Steps Builder */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-home-text flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-home-accent" />
                <span>خطوات المشروع المتسلسلة (تحدد الخطوة القادمة تلقائياً)</span>
              </span>
              <span className="text-[10px] text-home-muted">
                {steps.filter((s) => s.title.trim()).length} خطوات
              </span>
            </div>

            {/* List of Steps */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
              {steps.map((step, idx) => (
                <div key={step.id || idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-home-accent text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <HomeTextField
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepTitleChange(idx, e.target.value)}
                    placeholder={`الخطوة ${idx + 1}...`}
                    className="w-full"
                  />
                  {steps.length > 1 && (
                    <HomeButton icon={<Trash2 className="w-3.5 h-3.5" />}
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 rounded-lg text-home-muted hover:text-rose-400 hover:bg-home-raised transition-colors cursor-pointer"
                    >
                    </HomeButton>
                  )}
                </div>
              ))}
            </div>

            {/* Add Step Input */}
            <div className="flex gap-2 pt-1">
              <HomeTextField
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
                className="w-full"
              />
              <HomeButton
                type="button"
                onClick={handleAddStep}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-home-accent border border-amber-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة</span>
              </HomeButton>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-home-border">
            <HomeButton
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-home-muted hover:text-home-text hover:bg-home-raised transition-colors cursor-pointer"
            >
              إلغاء
            </HomeButton>
            <HomeButton variant="primary"
              type="submit"
              className="shrink-0"
            >
              {initialProject ? 'حفظ التعديلات' : 'إنشاء المشروع'}
            </HomeButton>
          </div>
        </form>
      </HomePanel>
    </HomeWorkflowDialog>
  );
};
