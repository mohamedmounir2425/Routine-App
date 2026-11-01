import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar } from 'lucide-react';
import { HomeProject, ProjectStep } from '../../../types';
import { createWorkProject, updateProject } from '../../../db/projectQueries';

interface WorkProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSaved: () => void;
  initialProject?: HomeProject | null;
}

export const WorkProjectModal: React.FC<WorkProjectModalProps> = ({
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

  // Work Project Hub Dev Context
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [runCommand, setRunCommand] = useState('');
  const [requiresVpn, setRequiresVpn] = useState(false);
  const [setupNotes, setSetupNotes] = useState('');

  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setDescription(initialProject.description || '');
      setStatus(initialProject.status);
      setTargetDate(initialProject.targetDate || '');
      setSteps(initialProject.steps || []);
      setRepositoryUrl(initialProject.repositoryUrl || '');
      setDevUrl(initialProject.devUrl || '');
      setApiUrl(initialProject.apiUrl || '');
      setBranch(initialProject.branch || '');
      setRunCommand(initialProject.runCommand || '');
      setRequiresVpn(Boolean(initialProject.requiresVpn));
      setSetupNotes(initialProject.setupNotes || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('in_progress');
      setTargetDate('');
      setSteps([
        { id: `step_${Date.now()}_1`, title: '', isCompleted: false, order: 1 },
      ]);
      setRepositoryUrl('');
      setDevUrl('');
      setApiUrl('');
      setBranch('');
      setRunCommand('');
      setRequiresVpn(false);
      setSetupNotes('');
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

    // Filter out completely empty steps
    const validSteps: ProjectStep[] = steps
      .filter((s) => s.title.trim().length > 0)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    const devContext = {
      repositoryUrl: repositoryUrl.trim() || undefined,
      devUrl: devUrl.trim() || undefined,
      apiUrl: apiUrl.trim() || undefined,
      branch: branch.trim() || undefined,
      runCommand: runCommand.trim() || undefined,
      requiresVpn: requiresVpn || undefined,
      setupNotes: setupNotes.trim() || undefined,
    };

    if (initialProject) {
      await updateProject(initialProject.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        targetDate: targetDate || undefined,
        steps: validSteps,
        ...devContext,
      });
    } else {
      await createWorkProject({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        targetDate: targetDate || undefined,
        steps: validSteps,
        ...devContext,
      });
    }

    onProjectSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">📂</span>
            <h2 className="text-lg font-black text-white font-['Tajawal']">
              {initialProject ? 'تعديل مشروع عمل' : 'إنشاء مشروع عمل جديد'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
              اسم المشروع <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إطلاق النسخة التجريبية للمنصة"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
              الوصف أو الهدف الأساسي
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر لمخرجات المشروع..."
              className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 resize-none"
            />
          </div>

          {/* Status & Target Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal']">
                حالة المشروع
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              >
                <option value="in_progress">قيد التنفيذ 🚀</option>
                <option value="backlog">مؤجل / في الانتظار ⏳</option>
                <option value="completed">مكتمل ✓</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 font-['Tajawal'] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>تاريخ التسليم المستهدف</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          {/* Developer Work OS Setup Context */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-['Tajawal'] flex items-center gap-1.5">
                <span>💻</span>
                <span>إعدادات وبيئة عمل المشروع (Dev Setup)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-['Tajawal']">
                روابط وأوامر التشغيل السريع
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">رابط المستودع (Repository)</label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">بيئة التطوير (Dev URL)</label>
                <input
                  type="url"
                  value={devUrl}
                  onChange={(e) => setDevUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">API / Swagger URL</label>
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.dev.domain/docs"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">الفرع الحالي (Branch)</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main أو feature/xyz"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">أمر التشغيل (Run Command)</label>
                <input
                  type="text"
                  value={runCommand}
                  onChange={(e) => setRunCommand(e.target.value)}
                  placeholder="npm run dev أو docker-compose up"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-sky-300 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-white/5">
                <span className="text-xs text-slate-300 font-medium font-['Tajawal']">
                  يتطلب اتصال VPN للعمل؟
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={requiresVpn}
                    onChange={(e) => setRequiresVpn(e.target.checked)}
                    className="rounded border-white/20 text-sky-500 focus:ring-sky-500"
                  />
                  <span>نعم، يحتاج VPN 🔒</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ملاحظات الإعداد (Setup Notes)</label>
                <textarea
                  rows={2}
                  value={setupNotes}
                  onChange={(e) => setSetupNotes(e.target.value)}
                  placeholder="متطلبات إضافية، خطوات تهيئة، أو اعتمادات محلية..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 resize-none font-['Tajawal']"
                />
              </div>
            </div>
          </div>

          {/* Project Steps / Sequential Actions */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-['Tajawal']">
                خطوات المشروع المتسلسلة (Next Actions)
              </span>
              <span className="text-[10px] text-slate-400">
                أول خطوة غير منجزة تظهر كـ Next Action في Today
              </span>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={step.id || idx} className="flex items-center gap-2">
                  <span className="w-5 text-center text-xs font-mono font-bold text-sky-400">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepTitleChange(idx, e.target.value)}
                    placeholder={`خطوة ${idx + 1}...`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add step */}
            <div className="flex items-center gap-2 pt-1">
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
                placeholder="أضف خطوة تالية..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
              />
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold hover:bg-sky-500/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 text-xs font-black shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              {initialProject ? 'حفظ التعديلات' : 'إنشاء المشروع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
