import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Check, 
  ListTodo
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProgressNavTabs } from '../components/ProgressNavTabs';
import { aggregateTodayFeed } from '../../today/todayAggregator';
import { TodayAggregationResult } from '../../today/todayTypes';

export const DailyPerformanceView: React.FC = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<TodayAggregationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await aggregateTodayFeed();
        setFeed(data);
      } catch (err) {
        console.error('Failed to load today performance:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !feed) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
        <div className="flex flex-col gap-1 pb-3 border-b border-white/5">
          <h1 className="text-2xl font-black text-white">أداء اليوم</h1>
          <p className="text-xs text-slate-400">تفاصيل تنفيذك للمهام المجدولة اليوم</p>
        </div>
        <ProgressNavTabs />
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">جاري جمع أداء اليوم من مركز التنفيذ...</p>
        </div>
      </div>
    );
  }

  const { items, totalCount, completedCount, completionRate, spaceBreakdown, sections } = feed;
  const remainingCount = Math.max(0, totalCount - completedCount);
  const overdueSection = sections.find((s) => s.id === 'overdue');
  const overdueCount = overdueSection?.items.length || 0;

  const completedItems = items.filter((i) => i.isCompleted);
  const pendingItems = items.filter((i) => !i.isCompleted);

  const SPACES_MAP: Record<string, { label: string; icon: string; color: string }> = {
    worship: { label: 'العبادات', icon: '🕌', color: 'emerald' },
    health: { label: 'الصحة', icon: '🏋️', color: 'amber' },
    work: { label: 'العمل', icon: '💼', color: 'sky' },
    home: { label: 'المنزل', icon: '🏠', color: 'purple' },
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full text-right font-['Tajawal'] pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎯</span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              أداء اليوم
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            قراءة تحليلية لمستوى إنجازك لمهام وتدفقات اليوم الفعلي
          </p>
        </div>

        <button
          onClick={() => navigate('/today')}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ListTodo className="w-4 h-4" />
          <span>فتح مركز التنفيذ (Today)</span>
        </button>
      </div>

      {/* Nav Tabs */}
      <ProgressNavTabs />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">نسبة إنجاز اليوم</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">{completionRate}%</span>
            <span className="text-[10px] text-slate-500">من المستهدف</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">عناصر منجزة</span>
            <Check className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-400 font-mono">{completedCount}</span>
            <span className="text-[10px] text-slate-500">من أصل {totalCount}</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">عناصر متبقية</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-400 font-mono">{remainingCount}</span>
            <span className="text-[10px] text-slate-500">معلقة اليوم</span>
          </div>
        </div>

        <div className="liquid-glass-card rounded-2xl p-4 border border-white/10 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-bold">مهام متأخرة</span>
            <AlertTriangle className={`w-4 h-4 ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {overdueCount}
            </span>
            <span className="text-[10px] text-slate-500">بحاجة لإعادة جدولة</span>
          </div>
        </div>
      </div>

      {/* Completion Breakdown by Space */}
      <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>توزيع إنجاز اليوم حسب المساحة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(SPACES_MAP).map(([key, info]) => {
            const data = spaceBreakdown[key as keyof typeof spaceBreakdown] || { total: 0, completed: 0 };
            const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 100;

            return (
              <div key={key} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {data.completed}/{data.total}
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>نسبة الإكمال</span>
                  <span className="font-mono font-bold">{rate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline: Completed vs Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Items */}
        <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>العناصر المعلقة ({pendingItems.length})</span>
            </h3>
          </div>

          {pendingItems.length === 0 ? (
            <p className="text-xs text-emerald-400 text-center py-8">
              🎉 أحسنت! تم إكمال كافة مهام اليوم
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{item.space}</span>
                      {item.scheduledTime && (
                        <span className="font-mono">{item.scheduledTime}</span>
                      )}
                      {item.categoryLabel && (
                        <span className="px-1.5 py-0.2 rounded bg-white/5">{item.categoryLabel}</span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold shrink-0">
                    معلق
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Items */}
        <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>العناصر المكتملة ({completedItems.length})</span>
            </h3>
          </div>

          {completedItems.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              لم يتم إنجاز عناصر اليوم بعد
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-teal-950/15 border border-teal-500/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-300 line-through truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span>{item.space}</span>
                      {item.completedAt && (
                        <span className="font-mono">
                          {new Date(item.completedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                    مكتمل ✓
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
