import { LifeSpaceConfig } from '../types/spaces';

export const LIFE_SPACES_CONFIG: LifeSpaceConfig[] = [
  {
    id: 'worship',
    titleKey: 'spaceWorshipTitle',
    descriptionKey: 'spaceWorshipDesc',
    icon: '🕌',
    accentColor: 'emerald',
    route: '/worship',
    defaultEnabled: true,
    navigation: [
      { id: 'worship-overview', path: '/worship', labelKey: 'spaceNavOverview', iconName: 'Compass' },
      { id: 'worship-prayers', path: '/worship/prayers', labelKey: 'spaceNavPrayers', iconName: 'Clock' },
      { id: 'worship-azkar', path: '/worship/azkar', labelKey: 'spaceNavAzkar', iconName: 'BookOpen' },
      { id: 'worship-quran', path: '/worship/quran', labelKey: 'spaceNavQuran', iconName: 'BookMarked' },
      { id: 'worship-tasbeeh', path: '/worship/tasbeeh', labelKey: 'spaceNavTasbeeh', iconName: 'CircleDot' },
      { id: 'worship-progress', path: '/worship/progress', labelKey: 'spaceNavProgress', iconName: 'BarChart2' },
    ],
  },
  {
    id: 'health',
    titleKey: 'spaceHealthTitle',
    descriptionKey: 'spaceHealthDesc',
    icon: '🏋️',
    accentColor: 'teal',
    route: '/health',
    defaultEnabled: true,
    navigation: [
      { id: 'health-overview', path: '/health', labelKey: 'spaceNavOverview', iconName: 'Compass' },
      { id: 'health-exercises', path: '/health/exercises', labelKey: 'spaceNavExercises', iconName: 'Dumbbell' },
      { id: 'health-plans', path: '/health/plans', labelKey: 'spaceNavPlans', iconName: 'Calendar' },
      { id: 'health-progress', path: '/health/progress', labelKey: 'spaceNavProgress', iconName: 'BarChart2' },
    ],
  },
  {
    id: 'work',
    titleKey: 'spaceWorkTitle',
    descriptionKey: 'spaceWorkDesc',
    icon: '💼',
    accentColor: 'sky',
    route: '/work',
    defaultEnabled: true,
    navigation: [
      { id: 'work-overview', path: '/work', labelKey: 'spaceNavOverview', iconName: 'Compass' },
      { id: 'work-tasks', path: '/work/tasks', labelKey: 'spaceNavTasks', iconName: 'CheckSquare' },
      { id: 'work-projects', path: '/work/projects', labelKey: 'spaceNavProjects', iconName: 'FolderKanban' },
      { id: 'work-focus', path: '/work/focus', labelKey: 'spaceNavFocus', iconName: 'Timer' },
      { id: 'work-progress', path: '/work/progress', labelKey: 'spaceNavProgress', iconName: 'BarChart2' },
    ],
  },
  {
    id: 'home',
    titleKey: 'spaceHomeTitle',
    descriptionKey: 'spaceHomeDesc',
    icon: '🏠',
    accentColor: 'amber',
    route: '/home',
    defaultEnabled: true,
    navigation: [
      { id: 'home-overview', path: '/home', labelKey: 'spaceNavOverview', iconName: 'Compass' },
      { id: 'home-tasks', path: '/home/tasks', labelKey: 'spaceNavTasks', iconName: 'CheckSquare' },
      { id: 'home-projects', path: '/home/projects', labelKey: 'spaceNavProjects', iconName: 'FolderKanban' },
      { id: 'home-routines', path: '/home/routines', labelKey: 'spaceNavRoutines', iconName: 'ListChecks' },
      { id: 'home-maintenance', path: '/home/maintenance', labelKey: 'spaceNavMaintenance', iconName: 'Wrench' },
    ],
  },
  {
    id: 'plans',
    titleKey: 'spacePlansTitle',
    descriptionKey: 'spacePlansDesc',
    icon: '🎯',
    accentColor: 'indigo',
    route: '/plans',
    defaultEnabled: true,
    navigation: [
      { id: 'plans-overview', path: '/plans', labelKey: 'spaceNavOverview', iconName: 'Compass' },
      { id: 'plans-list', path: '/plans/list', labelKey: 'spaceNavPlansList', iconName: 'FolderKanban' },
      { id: 'plans-goals', path: '/plans/goals', labelKey: 'spaceNavGoals', iconName: 'Milestone' },
      { id: 'plans-progress', path: '/plans/progress', labelKey: 'spaceNavProgress', iconName: 'BarChart2' },
    ],
  },
];

export function getEnabledSpaceConfigs(enabledSpaces?: string[]): LifeSpaceConfig[] {
  if (Array.isArray(enabledSpaces) && enabledSpaces.length > 0) {
    const configs = LIFE_SPACES_CONFIG.filter((space) => enabledSpaces.includes(space.id));
    return configs.length > 0 ? configs : LIFE_SPACES_CONFIG.filter((s) => s.defaultEnabled);
  }
  return LIFE_SPACES_CONFIG.filter((s) => s.defaultEnabled);
}
