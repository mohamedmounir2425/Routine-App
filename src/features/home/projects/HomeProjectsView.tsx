import { HomePanel } from '../components/HomeLayouts';
import { HomeButton } from '../components/HomeButton';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  FolderKanban,
  Check,
  Trash2,
  Edit3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { HomeSection as SpaceShell } from '../HomeSection';
import { HomeProject } from '../../../types';
import { getHomeProjects, deleteProject, completeProjectStep } from '../../../db/projectQueries';
import { HomeProjectModal } from './HomeProjectModal';

type StatusFilter = 'all' | 'in_progress' | 'backlog' | 'completed';

export const HomeProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<HomeProject | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const list = await getHomeProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load home projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeTab === 'all') return true;
      return p.status === activeTab;
    });
  }, [projects, activeTab]);

  const handleCompleteNextAction = async (projectId: string, stepId: string) => {
    await completeProjectStep(projectId, stepId);
    await loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع وجميع خطواته؟')) {
      await deleteProject(id);
      await loadProjects();
    }
  };

  const getStatusBadge = (status: HomeProject['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
            قيد التنفيذ
          </span>
        );
      case 'backlog':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-home-accent border border-amber-500/30 text-[10px] font-bold">
            قيد الانتظار
          </span>
        );
      case 'waiting':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
            معلق
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-home-text border border-home-border text-[10px] font-bold">
            مكتمل
          </span>
        );
    }
  };

  return (
    <SpaceShell
      icon="🏠"
      title="مشاريع وتحسينات المنزل"
      subtitle="مشاريع الصيانة، التجديد، والتنظيم المنزلي مقسمة لخطوات متسلسلة واضحة"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl bg-home-raised border border-home-border text-xs font-bold text-home-accent flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{projects.filter((p) => p.status === 'in_progress').length} مشاريع نشطة</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-home">
        {/* Controls Header: Tabs + New Project Button */}
        <HomePanel className=" p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <HomeButton
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              الكل ({projects.length})
            </HomeButton>
            <HomeButton
              onClick={() => setActiveTab('in_progress')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'in_progress'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              قيد التنفيذ ({projects.filter((p) => p.status === 'in_progress').length})
            </HomeButton>
            <HomeButton
              onClick={() => setActiveTab('backlog')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'backlog'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              قيد الانتظار ({projects.filter((p) => p.status === 'backlog').length})
            </HomeButton>
            <HomeButton
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'completed'
                  ? 'bg-amber-500/20 text-home-accent border border-amber-500/40'
                  : 'bg-home-raised text-home-muted hover:text-home-text border border-transparent'
              }`}
            >
              المكتملة ({projects.filter((p) => p.status === 'completed').length})
            </HomeButton>
          </div>

          <HomeButton variant="primary"
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>مشروع جديد</span>
          </HomeButton>
        </HomePanel>

        {/* Projects List */}
        {isLoading ? (
          <div className="text-center py-12 text-home-muted text-xs">
            جاري تحميل مشاريع المنزل...
          </div>
        ) : filteredProjects.length === 0 ? (
          <HomePanel className=" p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-home-raised border border-home-border flex items-center justify-center mx-auto text-xl text-home-accent">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-home-text">لا توجد مشاريع في هذا التصنيف</h3>
            <p className="text-xs text-home-muted max-w-sm mx-auto">
              أنشئ مشروعاً جديداً لتجديد، دهان، ترتيب أو إصلاح أي جزء في المنزل وتقسيمه لخطوات عملية
            </p>
          </HomePanel>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const totalSteps = project.steps?.length || 0;
              const completedSteps = project.steps?.filter((s) => s.isCompleted).length || 0;
              const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
              const isExpanded = !!expandedProjects[project.id];

              return (
                <HomePanel
                  key={project.id}
                  className=" p-5 sm:p-6 space-y-4 hover:border-amber-500/30 transition-all"
                >
                  {/* Top Bar: Title, Status, Meta, Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-black text-home-text">
                          {project.title}
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>
                      {project.description && (
                        <p className="text-xs text-home-muted max-w-2xl">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {project.targetDate && (
                        <span className="text-[10px] text-home-muted bg-home-raised px-2.5 py-1 rounded-lg flex items-center gap-1 border border-home-border">
                          <Calendar className="w-3 h-3 text-home-accent" />
                          <span>{project.targetDate}</span>
                        </span>
                      )}
                      <HomeButton icon={<Edit3 className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setEditingProject(project);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-home-muted hover:text-home-text hover:bg-home-selection transition-colors cursor-pointer"
                        title="تعديل المشروع"
                      >

                      </HomeButton>
                      <HomeButton icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDelete(project.id)}
                        className="p-1.5 rounded-lg text-home-muted hover:text-rose-400 hover:bg-home-selection transition-colors cursor-pointer"
                        title="حذف المشروع"
                      >

                      </HomeButton>
                    </div>
                  </div>

                  {/* Next Action Callout Card (GTD Next Physical Step) */}
                  {project.nextActionTitle && project.nextActionId && project.status !== 'completed' && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-home-accent text-[10px] font-black shrink-0">
                          الخطوة التالية (Next Action)
                        </span>
                        <span className="text-xs font-bold text-home-text truncate">
                          {project.nextActionTitle}
                        </span>
                      </div>

                      <HomeButton
                        onClick={() => handleCompleteNextAction(project.id, project.nextActionId!)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>إنجاز الخطوة</span>
                      </HomeButton>
                    </div>
                  )}

                  {/* Progress Bar & Toggle Steps Button */}
                  <div className="space-y-2 pt-1 border-t border-home-border">
                    <div className="flex items-center justify-between text-[11px] text-home-muted">
                      <HomeButton
                        onClick={() => toggleExpand(project.id)}
                        className="flex items-center gap-1 text-home-text hover:text-home-accent font-bold transition-colors cursor-pointer"
                      >
                        <span>الخطوات التفصيلية ({completedSteps}/{totalSteps})</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </HomeButton>
                      <span className="font-bold text-home-accent">{progressPct}% مكتمل</span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-home-raised overflow-hidden">
                      <div
                        className="h-full bg-home-accent transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Collapsible Steps Checklist */}
                  {isExpanded && (
                    <div className="pt-2 space-y-2 border-t border-home-border">
                      {project.steps?.map((step, idx) => (
                        <div
                          key={step.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                            step.isCompleted
                              ? 'bg-amber-950/15 border-amber-500/20 text-home-muted'
                              : 'bg-home-raised border-home-border text-home-text'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-home-selection text-home-text text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className={`font-medium ${step.isCompleted ? 'line-through opacity-70' : ''}`}>
                              {step.title}
                            </span>
                          </div>

                          {step.isCompleted ? (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>تمت</span>
                            </span>
                          ) : (
                            <HomeButton
                              onClick={() => handleCompleteNextAction(project.id, step.id)}
                              className="px-2.5 py-1 rounded-lg bg-home-selection hover:bg-amber-500/20 text-home-text hover:text-home-accent text-[10px] font-bold transition-all cursor-pointer shrink-0"
                            >
                              تعليم كمنجز
                            </HomeButton>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </HomePanel>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <HomeProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectSaved={loadProjects}
          initialProject={editingProject}
        />
      </div>
    </SpaceShell>
  );
};
