import rawAzkarData from './data/azkar.json';
import { AzkarCategoryKey, Dhikr } from '../types';

interface RawDhikr {
  category: string;
  count: string;
  description: string;
  reference: string;
  zekr: string;
}

function mapCategoryToKey(cat: string): AzkarCategoryKey {
  if (cat === 'أذكار الصباح') return 'morning';
  if (cat === 'أذكار المساء') return 'evening';
  if (cat === 'أذكار الاستيقاظ من النوم') return 'waking';
  if (cat === 'أذكار النوم') return 'sleeping';
  if (cat === 'الأذكار بعد السلام من الصلاة') return 'after_prayer';
  if (cat.includes('الرُّقية الشرعية')) return 'ruqyah';
  return 'misc';
}

function parseCount(rawCount: string): number {
  if (!rawCount || typeof rawCount !== 'string') return 1;
  const cleaned = rawCount.trim();
  const num = parseInt(cleaned, 10);
  return isNaN(num) || num < 1 ? 1 : num;
}

function parseParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export const ALL_DHIKR: Dhikr[] = (rawAzkarData as RawDhikr[]).map((raw, idx) => {
  const categoryKey = mapCategoryToKey(raw.category);
  const text = raw.zekr ? raw.zekr.trim() : '';
  const paragraphs = parseParagraphs(text);
  const count = parseCount(raw.count);

  return {
    id: `dhikr_${idx + 1}`,
    categoryKey,
    categoryArabic: raw.category,
    text,
    paragraphs,
    count,
    description: raw.description?.trim() || undefined,
    reference: raw.reference?.trim() || undefined,
  };
});

export const MORNING_DHIKR = ALL_DHIKR.filter((d) => d.categoryKey === 'morning');
export const EVENING_DHIKR = ALL_DHIKR.filter((d) => d.categoryKey === 'evening');
export const WAKING_DHIKR = ALL_DHIKR.filter((d) => d.categoryKey === 'waking');
export const SLEEPING_DHIKR = ALL_DHIKR.filter((d) => d.categoryKey === 'sleeping');
export const AFTER_PRAYER_DHIKR = ALL_DHIKR.filter((d) => d.categoryKey === 'after_prayer');
export const RUQYAH_DHIKR = ALL_DHIKR.filter((d) => d.categoryKey === 'ruqyah');

export function getAzkarByCategory(key: AzkarCategoryKey): Dhikr[] {
  switch (key) {
    case 'morning':
      return MORNING_DHIKR;
    case 'evening':
      return EVENING_DHIKR;
    case 'waking':
      return WAKING_DHIKR;
    case 'sleeping':
      return SLEEPING_DHIKR;
    case 'after_prayer':
      return AFTER_PRAYER_DHIKR;
    case 'ruqyah':
      return RUQYAH_DHIKR;
    case 'all':
      return ALL_DHIKR;
    default:
      return ALL_DHIKR.filter((d) => d.categoryKey === 'misc');
  }
}

export function getCategoryTitle(key: AzkarCategoryKey): { title: string; icon: string; subtitle: string } {
  switch (key) {
    case 'morning':
      return { title: 'أذكار الصباح', icon: '🌅', subtitle: 'تحصين وبداية مباركة ليومك' };
    case 'evening':
      return { title: 'أذكار المساء', icon: '🌙', subtitle: 'سكينة وحفظ وأمان لمسائك' };
    case 'waking':
      return { title: 'أذكار الاستيقاظ', icon: '☀️', subtitle: 'الحمد لله الذي أحيانا' };
    case 'sleeping':
      return { title: 'أذكار النوم', icon: '🛌', subtitle: 'حرز وحفظ قبل المنام' };
    case 'after_prayer':
      return { title: 'أذكار بعد الصلاة', icon: '🕌', subtitle: 'الأذكار الواردة بعد كل فريضة' };
    case 'ruqyah':
      return { title: 'الرُّقية الشرعية', icon: '🛡️', subtitle: 'آيات وأدعية الشفاء والحفظ' };
    default:
      return { title: 'أدعية وأذكار منوعة', icon: '📖', subtitle: 'من حصن المسلم النبوي' };
  }
}

export function searchAzkar(query: string, category?: AzkarCategoryKey): Dhikr[] {
  const normalized = query.trim().toLowerCase();
  const source = category && category !== 'all' ? getAzkarByCategory(category) : ALL_DHIKR;
  if (!normalized) return source;

  return source.filter((d) => {
    return (
      d.text.toLowerCase().includes(normalized) ||
      (d.description && d.description.toLowerCase().includes(normalized)) ||
      (d.reference && d.reference.toLowerCase().includes(normalized)) ||
      d.categoryArabic.toLowerCase().includes(normalized)
    );
  });
}
