import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Compass } from 'lucide-react';
import { 
  aggregateTodayFeed, 
  TodayAggregationResult, 
  TodayItem 
} from './index';
import { 
  executeToggleTask, 
  executeTogglePrayer, 
  executeCompleteProjectAction, 
  executeAddQuranPage 
} from './todayActions';
import { getSavedTodayPreferences } from './todayPreferencesService';
import { TodayHeader } from './components/TodayHeader';
import { TodayNextUpCard } from './components/TodayNextUpCard';
import { TodaySectionList } from './components/TodaySectionList';
import { TodayActivePlansWidget } from './components/TodayActivePlansWidget';
import { TodayQuickAddModal } from './components/TodayQuickAddModal';
import { TodayPreferencesModal } from './components/TodayPreferencesModal';
import { Routine, TodayPreferences } from '../../types';

interface TodayPageProps {
  onStartRoutine?: (routine: Routine) => void;
}

export const TodayPage: React.FC<TodayPageProps> = ({ onStartRoutine }) => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<TodayPreferences>(getSavedTodayPreferences);
  const [data, setData] = useState<TodayAggregationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const loadFeed = useCallback(async (currentPrefs?: TodayPreferences) => {
    try {
      const activePrefs = currentPrefs || preferences;
      const result = await aggregateTodayFeed({ preferences: activePrefs });
      setData(result);
    } catch (err) {
      console.error('Failed to aggregate Today feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  useEffect(() => {
    loadFeed();

    // Listen for cross-tab or settings updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'routine_today_preferences') {
        const fresh = getSavedTodayPreferences();
        setPreferences(fresh);
        loadFeed(fresh);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [loadFeed]);

  // Handle Primary Actions
  const handleExecuteAction = async (item: TodayItem) => {
    switch (item.actionType) {
      case 'start_workout':
        if (item.actionPayload?.routine && onStartRoutine) {
          onStartRoutine(item.actionPayload.routine);
        } else {
          navigate('/health');
        }
        break;

      case 'log_prayer':
        executeTogglePrayer(item.sourceId);
        await loadFeed();
        break;

      case 'open_azkar':
        navigate('/worship/azkar');
        break;

      case 'open_quran':
        navigate('/worship/quran');
        break;

      case 'complete_project_step':
        if (item.actionPayload?.projectId && item.actionPayload?.stepId) {
          await executeCompleteProjectAction(item.actionPayload.projectId, item.actionPayload.stepId);
          await loadFeed();
        }
        break;

      case 'toggle_task':
      default:
        await executeToggleTask(item.sourceId);
        await loadFeed();
        break;
    }
  };

  const handleAddQuranPage = (amount: number) => {
    executeAddQuranPage(amount);
    loadFeed();
  };

  const handleSavePreferences = (newPrefs: TodayPreferences) => {
    setPreferences(newPrefs);
    loadFeed(newPrefs);
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium font-['Tajawal']">
          جاري تجميع جدولك اليومي عبر المساحات...
        </p>
      </div>
    );
  }

  const isEmpty = !data || data.items.length === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 w-full animate-in fade-in duration-300">
      {/* 1. Header with stats & actions */}
      <TodayHeader
        totalCount={data?.totalCount || 0}
        completedCount={data?.completedCount || 0}
        completionRate={data?.completionRate || 0}
        spaceBreakdown={data?.spaceBreakdown || {
          worship: { total: 0, completed: 0 },
          health: { total: 0, completed: 0 },
          work: { total: 0, completed: 0 },
          home: { total: 0, completed: 0 },
          plans: { total: 0, completed: 0 },
        }}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
      />

      {/* 2. Empty State */}
      {isEmpty ? (
        <div className="liquid-glass-card rounded-3xl p-8 sm:p-12 text-center space-y-4 border border-white/10 my-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
            🎉
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Tajawal']">
              يومك خالي من المهام 🎉
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              لا توجد بنود مجدولة أو مساحات مفعلة لليوم. يمكنك البدء بإضافة مهمة سريعة أو استكشاف مساحات حياتك.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مهمة سريعة</span>
            </button>

            <button
              onClick={() => navigate('/spaces')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-bold text-xs cursor-pointer transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>استعراض المساحات (Spaces)</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Next Up Hero Card */}
          <TodayNextUpCard
            nextUp={data.nextUp}
            onExecuteAction={handleExecuteAction}
          />

          {/* 4. Ordered Sections List (NOW -> OVERDUE -> SCHEDULED -> HIGH PRIORITY -> FLEXIBLE -> PLANS -> COMPLETED) */}
          <TodaySectionList
            sections={data.sections}
            onExecuteAction={handleExecuteAction}
            onAddQuranPage={handleAddQuranPage}
          />

          {/* 5. Active Plans Progress Widgets (placed after daily timeline so urgent items remain visible first) */}
          {data.activePlansSummary && data.activePlansSummary.length > 0 && (
            <div className="pt-2">
              <TodayActivePlansWidget plans={data.activePlansSummary} />
            </div>
          )}
        </>
      )}

      {/* Quick Add Modal */}
      <TodayQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onTaskCreated={() => loadFeed()}
      />

      {/* Preferences Modal */}
      <TodayPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        currentPreferences={preferences}
        onSavePreferences={handleSavePreferences}
      />
    </div>
  );
};
