import React, { useState, useEffect } from 'react';
import { Plus, Check, Trash2, Edit3, Calendar, Folder, ArrowRight } from 'lucide-react';
import { HomeProject } from '../../../types';
import { getWorkProjects, completeProjectStep, deleteProject } from '../../../db/projectQueries';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { WorkProjectModal } from './WorkProjectModal';

export const WorkProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<HomeProject | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  const loadProjects = async () => {
    const list = await getWorkProjects();
    setProjects(list);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCompleteStep = async (projectId: string, stepId: string) => {
    await completeProjectStep(projectId, stepId);
    await loadProjects();
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع وكافة خطواته؟')) {
      await deleteProject(projectId);
      await loadProjects();
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (filter === 'in_progress') return p.status !== 'completed';
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  return (
    <SpaceShell
      icon="💼"
      title="مشاريع العمل والخطط التنفيذية"
      subtitle="تفكيك المشاريع المعقدة إلى خطوات متسلسلة وتصعيد الخطوة القادمة فوراً"
      actions={
        <button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>مشروع جديد</span>
        </button>
      }
    >
      <div className="space-y-5 pb-20">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:bg-white/5'}`}
          >
            جميع المشاريع ({projects.length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'in_progress' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:bg-white/5'}`}
          >
            قيد التنفيذ ({projects.filter((p) => p.status !== 'completed').length}) 🚀
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${filter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:bg-white/5'}`}
          >
            المكتملة ({projects.filter((p) => p.status === 'completed').length}) ✓
          </button>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="liquid-glass-card rounded-3xl p-12 text-center space-y-3">
              <Folder className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400 font-['Tajawal']">
                لا توجد مشاريع عمل مسجلة في هذا التصنيف. ابدأ بإنشاء أول مشروع!
              </p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const steps = project.steps || [];
              const completedSteps = steps.filter((s) => s.isCompleted).length;
              const progressPct = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
              const isExpanded = expandedProjectId === project.id;

              return (
                <div
                  key={project.id}
                  className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4 transition-all hover:border-white/20"
                >
                  {/* Top: Header & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                        <h3 className="text-base sm:text-lg font-black text-white font-['Tajawal']">
                          {project.title}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          project.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          {project.status === 'completed' ? 'مكتمل ✓' : 'قيد التنفيذ 🚀'}
                        </span>
                      </div>

                      {project.description && (
                        <p className="text-xs text-slate-400">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Meta & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {project.targetDate && (
                        <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-[11px] text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          <span>{project.targetDate}</span>
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
                        title="تعديل المشروع"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-rose-400 transition-colors"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>إنجاز الخطوات: {completedSteps} من {steps.length}</span>
                      <span className="font-mono font-bold text-sky-400">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Highlighted Next Action Banner */}
                  {project.nextActionTitle && project.nextActionId && (
                    <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold text-[10px]">
                          الخطوة التالية (Next Action)
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {project.nextActionTitle}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCompleteStep(project.id, project.nextActionId!)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer self-end sm:self-auto shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>إنجاز الخطوة</span>
                      </button>
                    </div>
                  )}

                  {/* Steps Checklist Toggle */}
                  <div className="pt-1">
                    <button
                      onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? 'إخفاء تفاصيل الخطوات' : `عرض جميع الخطوات (${steps.length})`}</span>
                      <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : 'rtl:-scale-x-100'}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 pl-2 border-r-2 border-sky-500/30 pr-3 animate-in fade-in duration-200">
                        {steps.map((step, idx) => (
                          <div
                            key={step.id || idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                              step.isCompleted
                                ? 'bg-white/5 border-white/5 text-slate-400 line-through'
                                : 'bg-slate-900/60 border-white/10 text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={() => handleCompleteStep(project.id, step.id)}
                                disabled={step.isCompleted}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                  step.isCompleted
                                    ? 'bg-sky-500 border-sky-400 text-slate-950 cursor-default'
                                    : 'border-white/20 hover:border-sky-400 cursor-pointer'
                                }`}
                              >
                                {step.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                              <span className="truncate">{step.title}</span>
                            </div>

                            {step.completedAt && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(step.completedAt).toLocaleDateString('ar-EG')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Project Modal */}
      <WorkProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onProjectSaved={loadProjects}
        initialProject={editingProject}
      />
    </SpaceShell>
  );
};
