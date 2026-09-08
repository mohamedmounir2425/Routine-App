import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Milestone as MilestoneIcon, 
  Check, 
  Trash2, 
  Edit3, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  FolderKanban,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { GoalPlan, PlanMilestone, LifeTask, PlanCategory, LifeSpaceId } from '../../../types';
import { 
  getPlans, 
  getPlanMilestones, 
  calculatePlanProgress, 
  deletePlan,
  toggleMilestoneCompletion,
  deleteMilestone
} from '../../../db/goalPlanQueries';
import { getAllTasks, toggleTaskCompletion, deleteTask } from '../../../db/taskQueries';
import { PlanModal } from './PlanModal';
import { MilestoneModal } from '../goals/MilestoneModal';
import { PlanTaskModal } from './PlanTaskModal';

const CATEGORY_MAP: Record<PlanCategory, { label: string; icon: string }> = {
  career: { label: 'المهني', icon: '💼' },
  faith: { label: 'الإيماني', icon: '🕌' },
  health: { label: 'الصحي', icon: '🏋️' },
  finance: { label: 'المالي', icon: '💰' },
  personal: { label: 'الشخصي', icon: '🌱' },
};

const SPACE_BADGES: Record<LifeSpaceId, { label: string; color: string }> = {
  work: { label: 'العمل', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  health: { label: 'الصحة', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  worship: { label: 'العبادات', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  home: { label: 'المنزل', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  plans: { label: 'الخطط', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
};

export const PlansListView: React.FC = () => {
  const [plans, setPlans] = useState<GoalPlan[]>([]);
  const [milestonesMap, setMilestonesMap] = useState<Record<string, PlanMilestone[]>>({});
  const [tasksMap, setTasksMap] = useState<Record<string, LifeTask[]>>({});
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<GoalPlan | null>(null);

  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [targetPlanForMilestone, setTargetPlanForMilestone] = useState<string | undefined>(undefined);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetPlanForTask, setTargetPlanForTask] = useState<GoalPlan | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, allTasks] = await Promise.all([
        getPlans(),
        getAllTasks(),
      ]);
      setPlans(fetchedPlans);

      const msMap: Record<string, PlanMilestone[]> = {};
      const tMap: Record<string, LifeTask[]> = {};
      const pMap: Record<string, number> = {};

      for (const p of fetchedPlans) {
        const [ms, prog] = await Promise.all([
          getPlanMilestones(p.id),
          calculatePlanProgress(p.id),
        ]);
        msMap[p.id] = ms;
        pMap[p.id] = prog;
        tMap[p.id] = allTasks.filter((t) => t.planId === p.id);
      }

      setMilestonesMap(msMap);
      setProgressMap(pMap);
      setTasksMap(tMap);
    } catch (err) {
      console.error('Failed to load plans list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (planId: string) => {
    setExpandedPlans((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (activeTab !== 'all' && p.status !== activeTab) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      return true;
    });
  }, [plans, activeTab, selectedCategory]);

  const handleToggleMilestone = async (milestoneId: string) => {
    await toggleMilestoneCompletion(milestoneId);
    await loadData();
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المرحلة؟')) {
      await deleteMilestone(milestoneId);
      await loadData();
    }
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTaskCompletion(taskId);
    await loadData();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
      await deleteTask(taskId);
      await loadData();
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخطة وجميع مراحلها؟')) {
      await deletePlan(planId);
      await loadData();
    }
  };

  return (
    <SpaceShell
      icon="🎯"
      title="خططي الاستراتيجية"
      subtitle="إدارة الخطط، تفصيل المراحل والمستهدفات، وربط المهام التنفيذية عبر كافة مجالات الحياة"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-indigo-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{plans.length} خطط مسجلة</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-['Tajawal']">
        {/* Controls Header: Status Tabs + Category Filter + New Plan Button */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'all'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                الكل ({plans.length})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'active'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                النشطة ({plans.filter((p) => p.status === 'active').length})
              </button>
              <button
                onClick={() => setActiveTab('paused')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'paused'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                المعلقة ({plans.filter((p) => p.status === 'paused').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeTab === 'completed'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                المكتملة ({plans.filter((p) => p.status === 'completed').length})
              </button>
            </div>

            {/* New Plan Button */}
            <button
              onClick={() => {
                setEditingPlan(null);
                setIsPlanModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>خطة جديدة</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs border-t border-white/5 pt-3">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">المجال:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-white/15 text-white'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              جميع المجالات
            </button>
            {Object.entries(CATEGORY_MAP).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                  selectedCategory === key
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Plans List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            جاري تحميل الخطط الاستراتيجية...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="liquid-glass-card rounded-3xl p-10 border border-white/5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-xl text-indigo-400">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">لا توجد خطط تطابق هذا الفلتر</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              أنشئ خطة جديدة لتحديد أهدافك الكبرى وتقسيمها لمراحل تسلسلية
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => {
              const milestones = milestonesMap[plan.id] || [];
              const tasks = tasksMap[plan.id] || [];
              const progress = progressMap[plan.id] || 0;
              const isExpanded = !!expandedPlans[plan.id];
              const cat = CATEGORY_MAP[plan.category] || { label: plan.category, icon: '🎯' };

              return (
                <div
                  key={plan.id}
                  className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4 hover:border-indigo-500/30 transition-all"
                >
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-white/5">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                        <h3 className="text-base font-black text-white">{plan.title}</h3>
                        {plan.status !== 'active' && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-300 text-[10px] font-bold">
                            {plan.status === 'paused' ? 'معلقة' : 'مكتملة'}
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <p className="text-xs text-slate-400 max-w-2xl">{plan.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {plan.targetDate && (
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/5">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>{plan.targetDate}</span>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsPlanModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="تعديل الخطة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                        title="حذف الخطة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Quick Toggle */}
                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <button
                        onClick={() => toggleExpand(plan.id)}
                        className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                      >
                        <span>
                          تفاصيل الخطة ({milestones.length} مراحل · {tasks.length} مهام)
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <span className="font-bold text-teal-400">{progress}% مكتمل (ديناميكي)</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Expandable Section: Milestones & Linked Tasks */}
                  {isExpanded && (
                    <div className="pt-3 space-y-5 border-t border-white/5">
                      {/* Milestones Subsection */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <MilestoneIcon className="w-4 h-4 text-indigo-400" />
                            <span>المراحل الاستراتيجية (Milestones)</span>
                          </span>
                          <button
                            onClick={() => {
                              setTargetPlanForMilestone(plan.id);
                              setIsMilestoneModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            <span>إضافة مرحلة</span>
                          </button>
                        </div>

                        {milestones.length === 0 ? (
                          <div className="p-3 rounded-xl bg-white/5 text-center text-xs text-slate-400">
                            لا توجد مراحل مسجلة لهذه الخطة بعد. أضف المرحلة الأولى!
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {milestones.map((ms) => (
                              <div
                                key={ms.id}
                                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                  ms.isCompleted
                                    ? 'bg-indigo-950/15 border-indigo-500/20 text-slate-400'
                                    : 'bg-white/5 border-white/5 text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <button
                                    onClick={() => handleToggleMilestone(ms.id)}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                      ms.isCompleted
                                        ? 'bg-teal-400 border-teal-300 text-slate-950'
                                        : 'border-white/20 hover:border-indigo-400'
                                    }`}
                                  >
                                    {ms.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </button>
                                  <span className="w-5 h-5 rounded bg-white/10 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {ms.order}
                                  </span>
                                  <span className={`font-bold truncate ${ms.isCompleted ? 'line-through opacity-70' : ''}`}>
                                    {ms.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {ms.targetDate && (
                                    <span className="text-[10px] text-slate-400">
                                      {ms.targetDate}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteMilestone(ms.id)}
                                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="حذف المرحلة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Linked Tasks Subsection */}
                      <div className="space-y-2.5 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <LinkIcon className="w-4 h-4 text-teal-400" />
                            <span>المهام التنفيذية المرتبطة (Tasks Linked to Plan)</span>
                          </span>
                          <button
                            onClick={() => {
                              setTargetPlanForTask(plan);
                              setIsTaskModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            <span>ربط مهمة تنفيذية</span>
                          </button>
                        </div>

                        {tasks.length === 0 ? (
                          <div className="p-3 rounded-xl bg-white/5 text-center text-xs text-slate-400">
                            لا توجد مهام تنفيذية مرتبطة. اربط مهمة من مساحة العمل أو الصحة لتظهر في Today!
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {tasks.map((task) => {
                              const spaceBadge = SPACE_BADGES[task.spaceId] || { label: task.spaceId, color: 'bg-white/10 text-slate-300 border-white/10' };

                              return (
                                <div
                                  key={task.id}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                    task.isCompleted
                                      ? 'bg-slate-900/30 border-white/5 text-slate-500'
                                      : 'bg-white/5 border-white/5 text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <button
                                      onClick={() => handleToggleTask(task.id)}
                                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                        task.isCompleted
                                          ? 'bg-emerald-400 border-emerald-300 text-slate-950'
                                          : 'border-white/20 hover:border-teal-400'
                                      }`}
                                    >
                                      {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </button>
                                    <span className={`font-bold truncate ${task.isCompleted ? 'line-through opacity-70' : ''}`}>
                                      {task.title}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${spaceBadge.color}`}>
                                      {spaceBadge.label}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {task.dueDate && (
                                      <span className="text-[10px] text-slate-400">
                                        {task.dueDate}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                      title="حذف المهمة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modals */}
        <PlanModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          onPlanSaved={loadData}
          initialPlan={editingPlan}
        />

        <MilestoneModal
          isOpen={isMilestoneModalOpen}
          onClose={() => setIsMilestoneModalOpen(false)}
          onMilestoneSaved={loadData}
          plans={plans}
          defaultPlanId={targetPlanForMilestone}
        />

        {targetPlanForTask && (
          <PlanTaskModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onTaskSaved={loadData}
            plan={targetPlanForTask}
          />
        )}
      </div>
    </SpaceShell>
  );
};
