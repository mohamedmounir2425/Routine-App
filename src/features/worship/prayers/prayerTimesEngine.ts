import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan';

export interface CityOption {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  method: 'Egyptian' | 'UmmAlQura' | 'Dubai';
}

export const PRESET_CITIES: CityOption[] = [
  { id: 'cairo', name: 'القاهرة', country: 'مصر', latitude: 30.0444, longitude: 31.2357, method: 'Egyptian' },
  { id: 'alexandria', name: 'الإسكندرية', country: 'مصر', latitude: 31.2001, longitude: 29.9187, method: 'Egyptian' },
  { id: 'giza', name: 'الجيزة', country: 'مصر', latitude: 30.0131, longitude: 31.2089, method: 'Egyptian' },
  { id: 'mansoura', name: 'المنصورة', country: 'مصر', latitude: 31.0409, longitude: 31.3785, method: 'Egyptian' },
  { id: 'tanta', name: 'طنطا', country: 'مصر', latitude: 30.7865, longitude: 31.0004, method: 'Egyptian' },
  { id: 'asyut', name: 'أسيوط', country: 'مصر', latitude: 27.1809, longitude: 31.1837, method: 'Egyptian' },
  { id: 'riyadh', name: 'الرياض', country: 'السعودية', latitude: 24.7136, longitude: 46.6753, method: 'UmmAlQura' },
  { id: 'makkah', name: 'مكة المكرمة', country: 'السعودية', latitude: 21.4225, longitude: 39.8262, method: 'UmmAlQura' },
  { id: 'madinah', name: 'المدينة المنورة', country: 'السعودية', latitude: 24.5247, longitude: 39.5692, method: 'UmmAlQura' },
  { id: 'dubai', name: 'دبي', country: 'الإمارات', latitude: 25.2048, longitude: 55.2708, method: 'Dubai' },
];

export const STORAGE_KEY_CITY = 'routine_prayer_city';
export const STORAGE_KEY_COORDS = 'routine_prayer_coords';

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface NextPrayerInfo {
  id: string;
  name: string;
  time: Date;
  isTomorrow: boolean;
  diffMs: number;
  diffMinutes: number;
  diffHours: number;
  progressPercent: number; // 0 to 100 between previous prayer and next prayer
}

/**
 * Round up seconds to next minute to match official mosque prayer boards in Egypt and Arab countries.
 */
function roundToNextMinute(d: Date): Date {
  const rounded = new Date(d.getTime());
  if (rounded.getSeconds() > 0) {
    rounded.setMinutes(rounded.getMinutes() + 1);
    rounded.setSeconds(0);
  }
  rounded.setMilliseconds(0);
  return rounded;
}

/**
 * Calculate prayer times for a given date and location using adhan.
 * DST-Safe: relies on the browser's Date object, naturally tracking Cairo +3 DST and +2 Winter.
 */
export function calculatePrayerTimes(
  coords: { latitude: number; longitude: number },
  date: Date = new Date(),
  methodName: 'Egyptian' | 'UmmAlQura' | 'Dubai' = 'Egyptian',
  madhab: (typeof Madhab)[keyof typeof Madhab] = Madhab.Shafi
): PrayerTimesResult {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);

  let params = CalculationMethod.Egyptian();
  if (methodName === 'UmmAlQura') {
    params = CalculationMethod.UmmAlQura();
  } else if (methodName === 'Dubai') {
    params = CalculationMethod.Dubai();
  }
  params.madhab = madhab;

  const pt = new PrayerTimes(coordinates, date, params);

  return {
    fajr: roundToNextMinute(pt.fajr),
    sunrise: roundToNextMinute(pt.sunrise),
    dhuhr: roundToNextMinute(pt.dhuhr),
    asr: roundToNextMinute(pt.asr),
    maghrib: roundToNextMinute(pt.maghrib),
    isha: roundToNextMinute(pt.isha),
  };
}

/**
 * Format prayer time into natural Arabic string (e.g. "04:45 ص")
 */
export function formatPrayerTime(d: Date): string {
  try {
    return d.toLocaleTimeString('ar-EG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? 'م' : 'ص';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}

/**
 * Get Next Prayer info with Day Boundary handling (calculates tomorrow's Fajr after Isha).
 */
export function getNextPrayerInfo(
  coords: { latitude: number; longitude: number },
  methodName: 'Egyptian' | 'UmmAlQura' | 'Dubai' = 'Egyptian'
): NextPrayerInfo {
  const now = new Date();
  const todayTimes = calculatePrayerTimes(coords, now, methodName);

  const prayers = [
    { id: 'fajr', name: 'الفجر', time: todayTimes.fajr, isTomorrow: false },
    { id: 'dhuhr', name: 'الظهر', time: todayTimes.dhuhr, isTomorrow: false },
    { id: 'asr', name: 'العصر', time: todayTimes.asr, isTomorrow: false },
    { id: 'maghrib', name: 'المغرب', time: todayTimes.maghrib, isTomorrow: false },
    { id: 'isha', name: 'العشاء', time: todayTimes.isha, isTomorrow: false },
  ];

  for (let i = 0; i < prayers.length; i++) {
    const p = prayers[i];
    if (p.time.getTime() > now.getTime()) {
      let prevTime = i > 0 ? prayers[i - 1].time : null;
      if (!prevTime) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayTimes = calculatePrayerTimes(coords, yesterday, methodName);
        prevTime = yesterdayTimes.isha;
      }
      const totalSpan = p.time.getTime() - prevTime.getTime();
      const elapsed = now.getTime() - prevTime.getTime();
      const progressPercent = totalSpan > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100))) : 50;

      const diffMs = p.time.getTime() - now.getTime();
      return {
        ...p,
        diffMs,
        diffMinutes: Math.floor(diffMs / 60000),
        diffHours: Math.floor(diffMs / 3600000),
        progressPercent,
      };
    }
  }

  // Day Boundary: It is after Isha! Next prayer is Tomorrow's Fajr.
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = calculatePrayerTimes(coords, tomorrow, methodName);
  const tomorrowFajr = tomorrowTimes.fajr;

  const totalSpan = tomorrowFajr.getTime() - todayTimes.isha.getTime();
  const elapsed = now.getTime() - todayTimes.isha.getTime();
  const progressPercent = totalSpan > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100))) : 50;

  const diffMs = tomorrowFajr.getTime() - now.getTime();
  return {
    id: 'fajr',
    name: 'الفجر (غداً)',
    time: tomorrowFajr,
    isTomorrow: true,
    diffMs,
    diffMinutes: Math.floor(diffMs / 60000),
    diffHours: Math.floor(diffMs / 3600000),
    progressPercent,
  };
}

/**
 * Get cached location or fallback to Cairo (Default for Egypt).
 */
export function getSavedLocation(): { city: CityOption; coords: { latitude: number; longitude: number } } {
  try {
    const savedCityId = localStorage.getItem(STORAGE_KEY_CITY);
    if (savedCityId) {
      const found = PRESET_CITIES.find(c => c.id === savedCityId);
      if (found) {
        return { city: found, coords: { latitude: found.latitude, longitude: found.longitude } };
      }
    }

    const savedCoordsRaw = localStorage.getItem(STORAGE_KEY_COORDS);
    if (savedCoordsRaw) {
      const parsed = JSON.parse(savedCoordsRaw);
      if (parsed.latitude && parsed.longitude) {
        return {
          city: {
            id: 'custom',
            name: parsed.cityName || 'موقعي الحالي',
            country: '',
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            method: 'Egyptian',
          },
          coords: parsed,
        };
      }
    }
  } catch {}

  // Default Cairo
  const cairo = PRESET_CITIES[0];
  return { city: cairo, coords: { latitude: cairo.latitude, longitude: cairo.longitude } };
}

/**
 * Save selected city or custom GPS coordinates
 */
export function saveLocation(cityId: string, customCoords?: { latitude: number; longitude: number; cityName?: string }) {
  try {
    if (cityId === 'custom' && customCoords) {
      localStorage.setItem(STORAGE_KEY_CITY, 'custom');
      localStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify(customCoords));
    } else {
      localStorage.setItem(STORAGE_KEY_CITY, cityId);
    }
  } catch {}
}
