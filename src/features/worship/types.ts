export type AzkarCategoryKey =
  | 'morning'
  | 'evening'
  | 'waking'
  | 'sleeping'
  | 'after_prayer'
  | 'ruqyah'
  | 'misc'
  | 'all';

export interface Dhikr {
  id: string;
  categoryKey: AzkarCategoryKey;
  categoryArabic: string;
  text: string;
  paragraphs: string[];
  count: number;
  description?: string;
  reference?: string;
}

export interface AzkarLog {
  id: string;
  date: string; // YYYY-MM-DD
  categoryKey: AzkarCategoryKey;
  categoryArabic: string;
  totalDhikr: number;
  completedDhikr: number;
  isFullyCompleted: boolean;
  durationSeconds: number;
  completedAt: string; // ISO String
}
