import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { UserSettings } from '../../types';
import { WorkoutVideoSettings } from './components/WorkoutVideoSettings';
import { AudioVoiceSettings } from './components/AudioVoiceSettings';
import { DailyRemindersSettings } from './components/DailyRemindersSettings';
import { AppearanceLanguageSettings } from './components/AppearanceLanguageSettings';
import { BackupDataSettings } from './components/BackupDataSettings';

interface Props {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onInstallPwa?: () => void;
  canInstallPwa?: boolean;
  onRefreshData?: () => void;
  theme?: 'dark' | 'light';
  onSetTheme?: (theme: 'dark' | 'light') => void;
}

export const SettingsView: React.FC<Props> = ({
  settings,
  onUpdateSettings,
  onInstallPwa,
  canInstallPwa = false,
  onRefreshData,
  theme = 'dark',
  onSetTheme,
}) => {
  const [notificationStatus, setNotificationStatus] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [savedAlert, setSavedAlert] = useState(false);

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        new Notification('روتين | MoveCare 🧘‍♂️', {
          body: 'تم تفعيل التنبيهات بنجاح! سنذكرك بموعد تمرينك اليومي لصحة ظهرك.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  const handleSendTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🏋️ وقت تمرينك اليومي', {
        body: '15 دقيقة فقط لنفسك ولتخفيف الضغط عن عمودك الفقري. جاهز للبدء؟',
        icon: '/favicon.ico',
      });
    } else {
      handleRequestNotification();
    }
  };

  const handleToggle = (key: keyof UserSettings, val: any) => {
    const updated = { ...settings, [key]: val };
    onUpdateSettings(updated);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
          الإعدادات والتخصيص ⚙️
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          إعدادات مشغل التمارين والفيديو، الصوت، المساعد الذكي، والتنبيهات اليومية.
        </p>
      </div>

      {savedAlert && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>تم حفظ الإعدادات وتطبيقها بنجاح!</span>
        </div>
      )}

      {/* Responsive 2-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Column 1: Video & Audio Guidance */}
        <div className="space-y-6">
          <WorkoutVideoSettings
            settings={settings}
            onToggle={handleToggle}
          />
          <AudioVoiceSettings
            settings={settings}
            onToggle={handleToggle}
          />
        </div>

        {/* Column 2: Reminders, Appearance & Backup */}
        <div className="space-y-6">
          <DailyRemindersSettings
            settings={settings}
            onToggle={handleToggle}
            notificationStatus={notificationStatus}
            onRequestNotification={handleRequestNotification}
            onSendTestNotification={handleSendTestNotification}
          />
          <AppearanceLanguageSettings
            theme={theme}
            onSetTheme={onSetTheme}
            canInstallPwa={canInstallPwa}
            onInstallPwa={onInstallPwa}
          />
          <BackupDataSettings
            onRefreshData={onRefreshData}
          />
        </div>
      </div>
    </div>
  );
};
