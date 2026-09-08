import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Milestone, 
  BarChart2, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  Calendar,
  FolderKanban,
  Download
} from 'lucide-react';
import { SpaceShell } from '../../components/layout/SpaceShell';
import { GoalPlan, PlanCategory } from '../../types';
import { 
  getPlans, 
  getPlanMilestones, 
  calculatePlanProgress, 
  createPlan 
} from '../../db/goalPlanQueries';
import { getAllTasks } from '../../db/taskQueries';
import { PLAN_STARTER_TEMPLATES, PlanStarterTemplate } from './planTemplates';
import { PlanModal } from './list/PlanModal';

const CATEGORY_NAMES: Record<PlanCategory, { label: string; icon: string }> = {
  career: { label: 'المهني', icon: '💼' },
  faith: { label: 'الإيماني', icon: '🕌' },
  health: { label: 'الصحي', icon: '🏋️' },
  finance: { label: 'المالي', icon: '💰' },
  personal: { label: 'الشخصي', icon: '🌱' },
};

export const PlansOverview: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<GoalPlan[]>([]);
  const [planProgressMap, setPlanProgressMap] = useState<Record<string, number>>({});
  const [planNextMilestoneMap, setPlanNextMilestoneMap] = useState<Record<string, string>>({});
  const [planTaskCountMap, setPlanTaskCountMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, allTasks] = await Promise.all([
        getPlans(),
        getAllTasks(),
      ]);
      setPlans(fetchedPlans);

      const progressMap: Record<string, number> = {};
      const nextMsMap: Record<string, string> = {};
      const taskCountMap: Record<string, number> = {};

      for (const p of fetchedPlans) {
        const [progress, milestones] = await Promise.all([
          calculatePlanProgress(p.id),
          getPlanMilestones(p.id),
        ]);
        progressMap[p.id] = progress;
        const nextMs = milestones.find((m) => !m.isCompleted);
        if (nextMs) {
          nextMsMap[p.id] = nextMs.title;
        }

        const tasksForPlan = allTasks.filter((t) => t.planId === p.id && !t.isCompleted);
        taskCountMap[p.id] = tasksForPlan.length;
      }

      setPlanProgressMap(progressMap);
      setPlanNextMilestoneMap(nextMsMap);
      setPlanTaskCountMap(taskCountMap);
    } catch (err) {
      console.error('Failed to load plans data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activePlans = useMemo(() => plans.filter((p) => p.status === 'active'), [plans]);
  const completedPlans = useMemo(() => plans.filter((p) => p.status === 'completed'), [plans]);

  const avgProgress = useMemo(() => {
    if (activePlans.length === 0) return 0;
    const sum = activePlans.reduce((acc, p) => acc + (planProgressMap[p.id] || 0), 0);
    return Math.round(sum / activePlans.length);
  }, [activePlans, planProgressMap]);

  const handleApplyTemplate = async (template: PlanStarterTemplate) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 4);

    await createPlan(
      {
        title: template.title,
        category: template.category,
        description: template.description,
        targetDate: targetDate.toISOString().split('T')[0],
        status: 'active',
        color: template.color,
      },
      template.milestones
    );

    await loadData();
  };

  return (
    <SpaceShell
      icon="🎯"
      title="الخطط والرؤية الاستراتيجية"
      subtitle="البوصلة بعيدة المدى: خارطة أهدافك الكبرى مقسمة لمراحل وخطوات قابلة للتحقيق"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-indigo-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{activePlans.length} خطط قيد التنفيذ</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-['Tajawal']">
        {/* Strategic KPIs Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">خطط نشطة</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-400">{activePlans.length}</span>
              <span className="text-[10px] text-slate-500">أهداف كبرى</span>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">متوسط الإنجاز</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-400">{avgProgress}%</span>
              <span className="text-[10px] text-slate-500">تقدم تراكمي</span>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">خطط مكتملة</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">{completedPlans.length}</span>
              <span className="text-[10px] text-slate-500">تم تحقيقها 🎉</span>
            </div>
          </div>

          <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 font-bold block">المهام التنفيذية</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">
                {Object.values(planTaskCountMap).reduce((a, b) => a + b, 0)}
              </span>
              <span className="text-[10px] text-slate-500">خطوة مرتبطة</span>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/plans/list')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-right transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-white group-hover:text-indigo-300 block transition-colors">
                  خططي الاستراتيجية
                </span>
                <span className="text-[10px] text-slate-400">قائمة الخطط والمراحل والمهام</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors rotate-180" />
          </button>

          <button
            onClick={() => navigate('/plans/goals')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-right transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                <Milestone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-white group-hover:text-teal-300 block transition-colors">
                  خارطة الأهداف والمراحل
                </span>
                <span className="text-[10px] text-slate-400">المراحل التسلسلية (Milestones)</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors rotate-180" />
          </button>

          <button
            onClick={() => navigate('/plans/progress')}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-right transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-white group-hover:text-purple-300 block transition-colors">
                  التقدم والتحليلات
                </span>
                <span className="text-[10px] text-slate-400">معدلات الإنجاز ومواعيد الاستحقاق</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors rotate-180" />
          </button>
        </div>

        {/* Active Strategic Plans Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-black text-white">الخطط النشطة الحالية</h2>
            </div>
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>خطة جديدة</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              جاري استخراج الخطط الاستراتيجية...
            </div>
          ) : activePlans.length === 0 ? (
            <div className="liquid-glass-card rounded-3xl p-8 border border-white/5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto text-xl">
                🎯
              </div>
              <h3 className="text-sm font-bold text-white">لا توجد خطط نشطة حالياً</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                اختر قالباً من القوالب المقترحة بالأسفل أو أنشئ خطتك الأولى للبدء في تتبع أهدافك الكبرى
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePlans.map((plan) => {
                const progress = planProgressMap[plan.id] || 0;
                const nextMs = planNextMilestoneMap[plan.id];
                const cat = CATEGORY_NAMES[plan.category] || { label: plan.category, icon: '🎯' };
                const taskCount = planTaskCountMap[plan.id] || 0;

                return (
                  <div
                    key={plan.id}
                    className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-white/5">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                          {plan.targetDate && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-400" />
                              <span>{plan.targetDate}</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-white">{plan.title}</h3>
                      </div>

                      <span className="text-lg font-black text-teal-400 font-mono">
                        {progress}%
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    {/* Next Milestone Badge */}
                    {nextMs && (
                      <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <Milestone className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-indigo-300 font-bold block">
                              المرحلة القادمة:
                            </span>
                            <span className="text-xs text-white font-bold truncate block">
                              {nextMs}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 shrink-0">
                          {taskCount} مهام مرتبطة
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer link */}
                    <div className="flex items-center justify-end pt-1">
                      <button
                        onClick={() => navigate('/plans/list')}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>إدارة الخطة والمراحل</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lightweight Starter Templates Section */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-black text-white">قوالب استراتيجية مقترحة (تفعيل سريع)</h3>
          </div>
          <p className="text-xs text-slate-400">
            قوالب مهيأة بالمراحل الأساسية لتسهيل الانطلاق، يمكنك تعديلها أو إضافة مهام تنفيذية لها بعد التفعيل
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PLAN_STARTER_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{tpl.icon}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-bold">
                      {CATEGORY_NAMES[tpl.category]?.label}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-white group-hover:text-indigo-300 transition-colors">
                    {tpl.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <button
                  onClick={() => handleApplyTemplate(tpl)}
                  className="w-full py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تفعيل هذا القالب ({tpl.milestones.length} مراحل)</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        <PlanModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          onPlanSaved={loadData}
        />
      </div>
    </SpaceShell>
  );
};
