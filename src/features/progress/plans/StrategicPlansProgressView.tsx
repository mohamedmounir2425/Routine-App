import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, 
  Milestone, 
  TrendingUp, 
  BarChart2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProgressNavTabs } from '../components/ProgressNavTabs';
import { GoalPlan, PlanMilestone, LifeTask } from '../../../types';
import { db } from '../../../db/database';
import { getPlans, calculatePlanProgress } from '../../../db/goalPlanQueries';
import { getLocalDateString } from '../../../utils/dateUtils';

export const StrategicPlansProgressView: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<GoalPlan[]>([]);
  const [milestones, setMilestones] = useState<PlanMilestone[]>([]);
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => getLocalDateString(), []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allPlans, allMilestones, allPlanTasks] = await Promise.all([
        getPlans(),
        db.planMilestones.toArray(),
        db.tasks.filter((t) => Boolean(t.planId)).toArray(),
      ]);

      setPlans(allPlans);
      setMilestones(allMilestones);
      setTasks(allPlanTasks);

      const progressEntries = await Promise.all(
        allPlans.map(async (p) => {
          const score = await calculatePlanProgress(p.id);
          return [p.id, score] as const;
        })
      );
      setProgressMap(Object.fromEntries(progressEntries));
    } catch (err) {
      console.error('Failed to load strategic plans progress:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activePlans = useMemo(() => plans.filter((p) => p.status === 'active'), [plans]);

  const avgProgress = useMemo(() => {
    if (plans.length === 0) return 0;
    const total = plans.reduce((sum, p) => sum + (progressMap[p.id] || 0), 0);
    return Math.round(total / plans.length);
  }, [plans, progressMap]);

  const totalMilestones = milestones.length;
  const completedMilestones = useMemo(
    () => milestones.filter((m) => m.isCompleted).length,
    [milestones]
  );

  const overdueMilestones = useMemo(() => {
    return milestones.filter((m) => !m.isCompleted && m.targetDate && m.targetDate < todayStr);
  }, [milestones, todayStr]);

  const upcomingMilestones = useMemo(() => {
    return milestones
      .filter((m) => !m.isCompleted && m.targetDate && m.targetDate >= todayStr)
      .sort((a, b) => (a.targetDate! > b.targetDate! ? 1 : -1))
      .slice(0, 5);
  }, [milestones, todayStr]);

  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; progressSum: number }> = {};
    for (const p of plans) {
      const cat = p.category || 'career';
      if (!map[cat]) {
        map[cat] = { total: 0, progressSum: 0 };
      }
      map[cat].total += 1;
      map[cat].progressSum += progressMap[p.id] || 0;
    }

    const CATEGORY_NAMES: Record<string, string> = {
      career: 'المهنة والتعليم',
      faith: 'الروحانيات والعبادات',
      health: 'الصحة والتمارين',
      finance: 'المالية والاستثمار',
      personal: 'التطوير الشخصي',
    };

    return Object.entries(map).map(([category, data]) => ({
      categoryKey: category,
      categoryLabel: CATEGORY_NAMES[category] || category,
      count: data.total,
      avg: Math.round(data.progressSum / data.total),
    }));
  }, [plans, progressMap]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
        <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
          <h1 className="text-2xl font-black text-white">تقدم الخطط الاستراتيجية</h1>
          <p className="text-xs text-slate-400">البوصلة طويلة المدى: قياس تقدم الأهداف الكبرى ومراحل تحقيقها</p>
        </div>
        <ProgressNavTabs />
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جاري تحميل تقدم الخطط الاستراتيجية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎯</span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              تقدم الخطط الاستراتيجية
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            البوصلة طويلة المدى: قياس تقدم الأهداف الكبرى ومراحل تحقيقها
          </p>
        </div>

        <button
          onClick={() => navigate('/plans')}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Target className="w-4 h-4" />
          <span>فتح مساحة الخطط (Plans)</span>
        </button>
      </div>

      {/* Nav Tabs */}
      <ProgressNavTabs />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">متوسط الإنجاز الكلي</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">{avgProgress}%</span>
            <span className="text-[10px] text-slate-500">لكافة الخطط</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">المراحل المنجزة</span>
            <Milestone className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-400 font-mono">
              {completedMilestones}/{totalMilestones}
            </span>
            <span className="text-[10px] text-slate-500">مرحلة رئيسية</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">الخطط النشطة</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400 font-mono">{activePlans.length}</span>
            <span className="text-[10px] text-slate-500">خطة قيد المتابعة</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">المهام التنفيذية</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{tasks.length}</span>
            <span className="text-[10px] text-slate-500">مهمة مرتبطة</span>
          </div>
        </div>
      </div>

      {/* Overdue Milestones Alert */}
      {overdueMilestones.length > 0 && (
        <div className="rounded-2xl p-4 bg-rose-500/10 border border-rose-500/30 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>مراحل استراتيجية تجاوزت تاريخها المستهدف ({overdueMilestones.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {overdueMilestones.map((m) => {
              const plan = plans.find((p) => p.id === m.planId);
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/20 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200">{m.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      الخطة: {plan?.title || 'عامة'}
                    </p>
                  </div>
                  <span className="text-[10px] text-rose-400 font-mono shrink-0 px-2 py-0.5 rounded bg-rose-500/20">
                    {m.targetDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Progress & Upcoming Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Categories Distribution */}
        <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>توزيع الخطط حسب المسار الحياتي</span>
          </h3>

          {categoryStats.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">لا توجد خطط مسجلة</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((item) => (
                <div key={item.categoryKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {item.categoryLabel} ({item.count} خطط)
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">{item.avg}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${item.avg}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Milestones */}
        <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>المراحل القادمة المستهدفة</span>
            </h3>
            <button
              onClick={() => navigate('/plans/goals')}
              className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>خارطة الأهداف</span>
              <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </button>
          </div>

          {upcomingMilestones.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">لا توجد مراحل قادمة محددة بتاريخ</p>
          ) : (
            <div className="space-y-2">
              {upcomingMilestones.map((m) => {
                const plan = plans.find((p) => p.id === m.planId);
                return (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{m.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        الخطة: {plan?.title || 'خطة عامة'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-[10px] text-teal-300 font-mono">{m.targetDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
