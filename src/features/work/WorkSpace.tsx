import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WorkOverview } from './WorkOverview';
import { WorkTasksView } from './tasks/WorkTasksView';
import { WorkProjectsView } from './projects/WorkProjectsView';
import { WorkFocusView } from './focus/WorkFocusView';
import { WorkProgressView } from './progress/WorkProgressView';

export const WorkSpace: React.FC = () => {
  return (
    <div className="w-full">
      <Routes>
        <Route index element={<WorkOverview />} />
        <Route path="tasks" element={<WorkTasksView />} />
        <Route path="projects" element={<WorkProjectsView />} />
        <Route path="focus" element={<WorkFocusView />} />
        <Route path="progress" element={<WorkProgressView />} />
        <Route path="*" element={<Navigate to="/work" replace />} />
      </Routes>
    </div>
  );
};
