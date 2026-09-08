import React, { useState } from 'react';
import { Check, Sliders, LayoutGrid, Calendar, BarChart2, Palette, Bell, PlaySquare, ShieldCheck } from 'lucide-react';
import { UserSettings, TodayPreferences } from '../../types';
import { DEFAULT_USER_SETTINGS } from '../../db/seeds/tipsAndDefaults';
import { SpacesSettings } from './components/SpacesSettings';
import { TodayPreferencesSettings } from './components/TodayPreferencesSettings';
import { ProgressPreferencesSettings } from './components/ProgressPreferencesSettings';
import { WorkoutVideoSettings } from './components/WorkoutVideoSettings';
import { AudioVoiceSettings } from './components/AudioVoiceSettings';
import { DailyRemindersSettings } from './components/DailyRemindersSettings';
import { AppearanceLanguageSettings } from './components/AppearanceLanguageSettings';
import { BackupDataSettings } from './components/BackupDataSettings';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendTestNotification 
} from '../../utils/reminderService';

interface Props {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
  onRefreshData?: () => void;
  theme?: 'dark' | 'light';
  onSetTheme?: (theme: 'dark' | 'light') => void;
  isTvMode?: boolean;
  onToggleTvMode?: () => void;
}

type SettingsSection = 'all' | 'spaces' | 'today' | 'progress' | 'appearance' | 'notifications' | 'player' | 'data';

export const SettingsView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onInstallPwa,
  canInstallPwa = false,
  onRefreshData,
  theme = 'dark',
  onSetTheme,
  isTvMode = false,
  onToggleTvMode,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('all');
  const [notificationStatus, setNotificationStatus] = useState<string>(
    getNotificationPermission()
  );
  const [savedAlert, setSavedAlert] = useState(false);

  const handleRequestNotification = async () => {
    const permission = await requestNotificationPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      await sendTestNotification();
    }
  };

  const handleSendTestNotification = async () => {
    if (notificationStatus === 'granted') {
      await sendTestNotification();
    } else {
      await handleRequestNotification();
    }
  };

  const handleToggle = (key: keyof UserSettings, val: any) => {
    const updated = { ...settings, [key]: val };
    onUpdateSettings(updated);
    showSavedNotification();
  };

  const handleUpdateTodayPreferences = (todayPreferences: TodayPreferences) => {
    const updated = { ...settings, todayPreferences };
    onUpdateSettings(updated);
    showSavedNotification();
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      ...DEFAULT_USER_SETTINGS,
      theme,
    });
    showSavedNotification();
    if (onRefreshData) onRefreshData();
  };

  const showSavedNotification = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  const SECTIONS = [
    { id: 'all' as SettingsSection, label: 'الكل', icon: Sliders },
    { id: 'spaces' as SettingsSection, label: 'المساحات', icon: LayoutGrid },
    { id: 'today' as SettingsSection, label: 'اليوم', icon: Calendar },
    { id: 'progress' as SettingsSection, label: 'التقدم', icon: BarChart2 },
    { id: 'appearance' as SettingsSection, label: 'المظهر واللغة', icon: Palette },
    { id: 'notifications' as SettingsSection, label: 'التنبيهات', icon: Bell },
    { id: 'player' as SettingsSection, label: 'مشغل التمارين و PWA', icon: PlaySquare },
    { id: 'data' as SettingsSection, label: 'البيانات والنسخ', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 pb-20 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight flex items-center gap-2.5">
            <span>الإعدادات والتخصيص</span>
            <span className="text-xl">⚙️</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-['Tajawal']">
            مركز التحكم الرئيسي: المساحات، تفضيلات اليوم، المظهر، الإشعارات، وتخصيص الحياة.
          </p>
        </div>

        {savedAlert && (
          <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0">
            <Check className="w-4 h-4" />
            <span>تم حفظ الإعدادات بنجاح!</span>
          </div>
        )}
      </div>

      {/* Section Quick Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-slate-800/80">
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Grid */}
      <div className="space-y-6">
        {/* 1. Spaces Configuration */}
        {(activeSection === 'all' || activeSection === 'spaces') && (
          <SpacesSettings
            settings={settings}
            onToggle={handleToggle}
          />
        )}

        {/* 2. Today Preferences */}
        {(activeSection === 'all' || activeSection === 'today') && (
          <TodayPreferencesSettings
            settings={settings}
            onUpdatePreferences={handleUpdateTodayPreferences}
          />
        )}

        {/* 3. Progress Architecture & Weights */}
        {(activeSection === 'all' || activeSection === 'progress') && (
          <ProgressPreferencesSettings
            settings={settings}
          />
        )}

        {/* 4. Appearance & Language */}
        {(activeSection === 'all' || activeSection === 'appearance') && (
          <AppearanceLanguageSettings
            theme={theme}
            onSetTheme={onSetTheme}
            isTvMode={isTvMode}
            onToggleTvMode={onToggleTvMode}
            canInstallPwa={canInstallPwa}
            onInstallPwa={onInstallPwa}
          />
        )}

        {/* 5. Notifications & Reminders */}
        {(activeSection === 'all' || activeSection === 'notifications') && (
          <DailyRemindersSettings
            settings={settings}
            onToggle={handleToggle}
            notificationStatus={notificationStatus}
            onRequestNotification={handleRequestNotification}
            onSendTestNotification={handleSendTestNotification}
          />
        )}

        {/* 6. Exercise Player & Voice */}
        {(activeSection === 'all' || activeSection === 'player') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <WorkoutVideoSettings
              settings={settings}
              onToggle={handleToggle}
            />
            <AudioVoiceSettings
              settings={settings}
              onToggle={handleToggle}
            />
          </div>
        )}

        {/* 7. Data, Backup & Reset */}
        {(activeSection === 'all' || activeSection === 'data') && (
          <BackupDataSettings
            onRefreshData={onRefreshData}
            onResetDefaults={handleResetDefaults}
          />
        )}
      </div>
    </div>
  );
};
