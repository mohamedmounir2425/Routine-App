import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomeOverview } from './HomeOverview';
import { HomeTasksView } from './tasks/HomeTasksView';
import { HomeProjectsView } from './projects/HomeProjectsView';
import { HomeRoutinesView } from './routines/HomeRoutinesView';
import { HomeMaintenanceView } from './maintenance/HomeMaintenanceView';

export const HomeSpace: React.FC = () => {
  return (
    <div className="w-full">
      <Routes>
        <Route index element={<HomeOverview />} />
        <Route path="tasks" element={<HomeTasksView />} />
        <Route path="projects" element={<HomeProjectsView />} />
        <Route path="routines" element={<HomeRoutinesView />} />
        <Route path="maintenance" element={<HomeMaintenanceView />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
};
