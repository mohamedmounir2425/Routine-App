import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Sparkles, Folder, Target, Award, Flame } from 'lucide-react';
import { LifeTask, HomeProject } from '../../../types';
import { getTasksBySpace } from '../../../db/taskQueries';
import { getWorkProjects } from '../../../db/projectQueries';
import { SpaceShell } from '../../../components/layout/SpaceShell';
import { getFocusStats, FocusStats } from '../focus/focusService';

export const WorkProgressView: React.FC = () => {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [focusStats, setFocusStats] = useState<FocusStats>(getFocusStats());

  useEffect(() => {
    Promise.all([
      getTasksBySpace('work'),
      getWorkProjects(),
    ]).then(([taskList, projectList]) => {
      setTasks(taskList);
      setProjects(projectList);
      setFocusStats(getFocusStats());
    });
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const highPriorityTasks = tasks.filter((t) => t.priority === 'high');
  const completedHighTasks = highPriorityTasks.filter((t) => t.isCompleted).length;

  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const activeProjects = projects.filter((p) => p.status !== 'completed').length;

  let totalSteps = 0;
  let completedSteps = 0;
  projects.forEach((p) => {
    (p.steps || []).forEach((s) => {
      totalSteps += 1;
      if (s.isCompleted) completedSteps += 1;
    });
  });

  return (
    <SpaceShell
      icon="💼"
      title="سجل تقدم العمل والإنتاجية"
      subtitle="مؤشرات إنجاز المهام، تطور المشاريع، وتاريخ جلسات التركيز العميق"
      badge={
        <div className="px-3 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-sky-400 flex items-center gap-1.5">
          <Award className="w-4 h-4" />
          <span>معدل الإنجاز: {taskCompletionRate}%</span>
        </div>
      }
    >
      <div className="space-y-6 pb-20">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* 1. Tasks Done */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-sky-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold font-['Tajawal']">المهام المنجزة</span>
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {completedTasks} <span className="text-xs text-slate-400 font-sans">/ {totalTasks}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-500"
                style={{ width: `${taskCompletionRate}%` }}
              />
            </div>
          </div>

          {/* 2. Focus Time */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold font-['Tajawal']">وقت التركيز العميق</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {focusStats.totalFocusMinutes} <span className="text-xs text-slate-400 font-sans">دقيقة</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {focusStats.completedSessions} جلسات مكتملة · اليوم: {focusStats.todayMinutes}د
            </p>
          </div>

          {/* 3. High Priority Focus */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold font-['Tajawal']">المهام الحرجة</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">
              {completedHighTasks} <span className="text-xs text-slate-400 font-sans">/ {highPriorityTasks.length}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              أولويات اليوم والمهام عالية الأهمية
            </p>
          </div>

          {/* 4. Active Projects */}
          <div className="liquid-glass-card rounded-2xl p-4 sm:p-5 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold font-['Tajawal']">المشاريع النشطة</span>
              <Folder className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
              {activeProjects} <span className="text-xs text-slate-400 font-sans">نشط ({completedProjects} مكتمل)</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {completedSteps} من {totalSteps} خطوات منجزة
            </p>
          </div>
        </div>

        {/* 2 Columns: Recent Focus History & Projects Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Recent Focus Sessions */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>سجل جلسات التركيز الأخيرة</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{focusStats.completedSessions} جلسات</span>
            </div>

            {focusStats.history.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                لم تسجل أي جلسات بومودورو بعد. ابدأ جلستك الأولى من قسم التركيز!
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {focusStats.history.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">
                        {session.taskTitle || 'جلسة تركيز عام'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(session.date).toLocaleString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 font-bold font-mono shrink-0">
                      {session.minutes} دقيقة
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Project Progress Summary */}
          <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-['Tajawal'] flex items-center gap-2">
                <Target className="w-4 h-4 text-sky-400" />
                <span>مشاريع العمل ومحطات الإنجاز</span>
              </h3>
              <span className="text-xs text-slate-400">{totalProjects} مشاريع</span>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                لا توجد مشاريع عمل مسجلة بعد.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const pSteps = proj.steps || [];
                  const pDone = pSteps.filter((s) => s.isCompleted).length;
                  const pct = pSteps.length > 0 ? Math.round((pDone / pSteps.length) * 100) : 0;

                  return (
                    <div key={proj.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate">{proj.title}</span>
                        <span className="font-mono text-sky-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-cyan-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>الخطوات: {pDone} / {pSteps.length}</span>
                        {proj.nextActionTitle && (
                          <span className="text-sky-300 truncate max-w-[200px]">
                            التالي: {proj.nextActionTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </SpaceShell>
  );
};
