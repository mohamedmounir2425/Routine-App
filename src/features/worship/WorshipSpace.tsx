import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WorshipOverview } from './WorshipOverview';
import { SpaceTasksView } from '../spaces/SpaceTasksView';
import { AzkarHubView } from './azkar/AzkarHubView';
import { TasbeehCounter } from './tasbeeh/TasbeehCounter';
import { PrayerTracker } from './prayers/PrayerTracker';
import { QuranTracker } from './quran/QuranTracker';
import { WorshipProgress } from './progress/WorshipProgress';

export const WorshipSpace: React.FC = () => {
  return (
    <div className="w-full">
      <Routes>
        <Route index element={<WorshipOverview />} />
        <Route path="tasks" element={<SpaceTasksView spaceId="worship" />} />
        <Route path="azkar" element={<AzkarHubView />} />
        <Route path="tasbeeh" element={<TasbeehCounter />} />
        <Route path="prayers" element={<PrayerTracker />} />
        <Route path="quran" element={<QuranTracker />} />
        <Route path="progress" element={<WorshipProgress />} />
        <Route path="*" element={<Navigate to="/worship" replace />} />
      </Routes>
    </div>
  );
};
