import React, { useState, useEffect, useMemo } from 'react';
import { 
  Milestone as MilestoneIcon, 
  Plus, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Calendar, 
  Sparkles,
  Target
} from 'lucide-react';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { GoalPlan, PlanMilestone } from '../../../types';
import { 
  getPlans, 
  getPlanMilestones, 
  saveMilestone, 
  deleteMilestone, 
  toggleMilestoneCompletion,
  calculatePlanProgress
} from '../../../db/goalPlanQueries';
import { MilestoneModal } from './MilestoneModal';

export const PlansGoalsView: React.FC = () => {
  const [plans, setPlans] = useState<GoalPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [milestones, setMilestones] = useState<PlanMilestone[]>([]);
  const [planProgressMap, setPlanProgressMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<PlanMilestone | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedPlans = await getPlans();
      setPlans(fetchedPlans);

      const allMs: PlanMilestone[] = [];
      const progMap: Record<string, number> = {};

      for (const p of fetchedPlans) {
        const [msList, prog] = await Promise.all([
          getPlanMilestones(p.id),
          calculatePlanProgress(p.id),
        ]);
        allMs.push(...msList);
        progMap[p.id] = prog;
      }

      setMilestones(allMs);
      setPlanProgressMap(progMap);
    } catch (err) {
      console.error('Failed to load milestones:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const planMap = useMemo(() => {
    const map = new Map<string, GoalPlan>();
    for (const p of plans) {
      map.set(p.id, p);
    }
    return map;
  }, [plans]);

  const displayedMilestones = useMemo(() => {
    let list = milestones;
    if (selectedPlanId !== 'all') {
      list = list.filter((m) => m.planId === selectedPlanId);
    }
    return list.sort((a, b) => {
      if (a.planId !== b.planId) return a.planId.localeCompare(b.planId);
      return a.order - b.order;
    });
  }, [milestones, selectedPlanId]);

  const handleToggleCompletion = async (id: string) => {
    await toggleMilestoneCompletion(id);
    await loadData();
  };

  const handleMoveOrder = async (ms: PlanMilestone, direction: 'up' | 'down') => {
    const planMs = milestones.filter((m) => m.planId === ms.planId).sort((a, b) => a.order - b.order);
    const currIdx = planMs.findIndex((m) => m.id === ms.id);
    if (currIdx === -1) return;

    const targetIdx = direction === 'up' ? currIdx - 1 : currIdx + 1;
    if (targetIdx < 0 || targetIdx >= planMs.length) return;

    const otherMs = planMs[targetIdx];
    const oldOrder = ms.order;
    const newOrder = otherMs.order;

    await Promise.all([
      saveMilestone({ ...ms, order: newOrder }),
      saveMilestone({ ...otherMs, order: oldOrder }),
    ]);

    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المرحلة؟')) {
      await deleteMilestone(id);
      await loadData();
    }
  };

  return (
    <SpaceShell
      icon="🎯"
      title="خارطة الأهداف والمراحل"
      subtitle="المراحل التسلسلية الكبرى (Milestones) التي ترسم مسار تقدمك من البداية حتى الإنجاز"
      badge={
        <div className="px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-teal-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>{milestones.filter((m) => m.isCompleted).length} من {milestones.length} مراحل مكتملة</span>
        </div>
      }
    >
      <div className="space-y-6 text-right font-['Tajawal']">
        {/* Filter Controls */}
        <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">الخطة:</span>
            <button
              onClick={() => setSelectedPlanId('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                selectedPlanId === 'all'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              جميع الخطط ({plans.length})
            </button>
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 truncate max-w-[160px] ${
                  selectedPlanId === p.id
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setEditingMilestone(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>مرحلة جديدة</span>
          </button>
        </div>

        {/* Milestones Roadmap List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            جاري تحميل خارطة المراحل...
          </div>
        ) : displayedMilestones.length === 0 ? (
          <div className="liquid-glass-card rounded-3xl p-10 border border-white/5 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-xl text-teal-400">
              <MilestoneIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">لا توجد مراحل مسجلة</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              أضف مراحل رئيسية لخطتك لقياس التقدم التراكمي وتحديد ما يلزم إنجازه تالياً
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedMilestones.map((ms) => {
              const parentPlan = planMap.get(ms.planId);
              const planProgress = planProgressMap[ms.planId] || 0;

              return (
                <div
                  key={ms.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    ms.isCompleted
                      ? 'bg-teal-950/15 border-teal-500/20 text-slate-400 opacity-80'
                      : 'bg-white/5 border-white/10 hover:border-teal-500/30 text-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleCompletion(ms.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-all ${
                        ms.isCompleted
                          ? 'bg-teal-400 border-teal-300 text-slate-950'
                          : 'border-white/20 hover:border-teal-400'
                      }`}
                    >
                      {ms.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-md bg-white/10 text-teal-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {ms.order}
                        </span>

                        <span className={`text-xs font-bold leading-relaxed ${ms.isCompleted ? 'line-through opacity-70' : ''}`}>
                          {ms.title}
                        </span>

                        {parentPlan && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{parentPlan.title} ({planProgress}%)</span>
                          </span>
                        )}
                      </div>

                      {ms.targetDate && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                          <Calendar className="w-3 h-3 text-teal-400" />
                          <span>الموعد المستهدف: {ms.targetDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reorder and Action controls */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => handleMoveOrder(ms, 'up')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="تحريك لأعلى في الترتيب"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(ms, 'down')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="تحريك لأسفل في الترتيب"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ms.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                      title="حذف المرحلة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal */}
        <MilestoneModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onMilestoneSaved={loadData}
          plans={plans}
          initialMilestone={editingMilestone}
          defaultPlanId={selectedPlanId !== 'all' ? selectedPlanId : undefined}
        />
      </div>
    </SpaceShell>
  );
};
