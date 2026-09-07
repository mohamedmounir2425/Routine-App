export type LifeSpaceId = 'worship' | 'health' | 'work' | 'home' | 'plans';

export interface SpaceNavigationItem {
  id: string;
  path: string;
  labelKey: string;
  iconName: string;
}

export interface LifeSpaceConfig {
  id: LifeSpaceId;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  accentColor: string; // Tailwind color token or hex
  route: string;
  defaultEnabled: boolean;
  navigation: SpaceNavigationItem[];
}
