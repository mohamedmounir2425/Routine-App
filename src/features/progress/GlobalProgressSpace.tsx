import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GlobalProgressOverview } from './overview/GlobalProgressOverview';
import { DailyPerformanceView } from './today/DailyPerformanceView';
import { WeeklyTrendsView } from './week/WeeklyTrendsView';
import { SpaceComparisonView } from './spaces/SpaceComparisonView';
import { StrategicPlansProgressView } from './plans/StrategicPlansProgressView';

export const GlobalProgressSpace: React.FC = () => {
  return (
    <div className="w-full">
      <Routes>
        <Route index element={<GlobalProgressOverview />} />
        <Route path="today" element={<DailyPerformanceView />} />
        <Route path="week" element={<WeeklyTrendsView />} />
        <Route path="spaces" element={<SpaceComparisonView />} />
        <Route path="plans" element={<StrategicPlansProgressView />} />
        <Route path="*" element={<Navigate to="/progress" replace />} />
      </Routes>
    </div>
  );
};
