import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PlansOverview } from './PlansOverview';
import { SpaceTasksView } from '../spaces/SpaceTasksView';
import { PlansListView } from './list/PlansListView';
import { PlansGoalsView } from './goals/PlansGoalsView';
import { PlansProgressView } from './progress/PlansProgressView';

export const PlansSpace: React.FC = () => {
  return (
    <div className="w-full">
      <Routes>
        <Route index element={<PlansOverview />} />
        <Route path="tasks" element={<SpaceTasksView spaceId="plans" />} />
        <Route path="list" element={<PlansListView />} />
        <Route path="goals" element={<PlansGoalsView />} />
        <Route path="progress" element={<PlansProgressView />} />
        <Route path="*" element={<Navigate to="/plans" replace />} />
      </Routes>
    </div>
  );
};
