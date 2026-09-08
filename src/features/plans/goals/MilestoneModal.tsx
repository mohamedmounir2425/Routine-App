import React, { useState, useEffect } from 'react';
import { X, Milestone, Calendar } from 'lucide-react';
import { PlanMilestone, GoalPlan } from '../../../types';
import { saveMilestone } from '../../../db/goalPlanQueries';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMilestoneSaved: () => void;
  plans: GoalPlan[];
  defaultPlanId?: string;
  initialMilestone?: PlanMilestone | null;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  onMilestoneSaved,
  plans,
  defaultPlanId,
  initialMilestone,
}) => {
  const [planId, setPlanId] = useState('');
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [targetDate, setTargetDate] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (initialMilestone) {
      setPlanId(initialMilestone.planId);
      setTitle(initialMilestone.title);
      setOrder(initialMilestone.order);
      setTargetDate(initialMilestone.targetDate || '');
      setIsCompleted(initialMilestone.isCompleted);
    } else {
      setPlanId(defaultPlanId || (plans[0]?.id || ''));
      setTitle('');
      setOrder(1);
      setTargetDate('');
      setIsCompleted(false);
    }
  }, [initialMilestone, isOpen, defaultPlanId, plans]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !planId) return;

    await saveMilestone({
      id: initialMilestone?.id,
      planId,
      title: title.trim(),
      order,
      targetDate: targetDate || undefined,
      isCompleted,
      completedAt: isCompleted ? (initialMilestone?.completedAt || new Date().toISOString()) : undefined,
    });

    onMilestoneSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md liquid-glass-card rounded-3xl p-6 sm:p-7 border border-white/10 shadow-2xl text-right font-['Tajawal']">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Milestone className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black text-white">
              {initialMilestone ? 'تعديل المرحلة' : 'إضافة مرحلة أو هدف مرحلي'}
            </h2>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              الخطة التابعة لها هذه المرحلة *
            </label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              عنوان المرحلة (Milestone) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: إتمام بناء الـ API ونظام الصلاحيات..."
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Order & Target Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الترتيب في الخارطة
              </label>
              <input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>الموعد المستهدف</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* Completed Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-xs font-bold text-slate-300">
              تعليم المرحلة كمنجزة بالكامل؟
            </span>
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => setIsCompleted(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-500 bg-white/10 border-white/20 focus:ring-0 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {initialMilestone ? 'حفظ التعديلات' : 'إضافة المرحلة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
