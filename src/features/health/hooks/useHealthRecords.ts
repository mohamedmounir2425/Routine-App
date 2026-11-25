import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../../../db/database';
import type { HealthData, HealthKind, HealthRecord } from '../../../types/health';
import { migrateHealth, localToday } from '../data/trainingRepository';

export function useHealthRecords() {
  const [records,setRecords] = useState<HealthRecord[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [date,setDate] = useState(localToday);
  useEffect(() => {
    let subscription: ReturnType<ReturnType<typeof liveQuery>['subscribe']> | undefined;
    let cancelled = false;
    void migrateHealth().then(() => {
      if (cancelled) return;
      subscription = liveQuery(() => db.healthRecords.toArray()).subscribe({ next: rows => { setRecords(rows);setLoading(false); }, error: () => {setError('تعذر تحميل البيانات. أعد فتح الصفحة.');setLoading(false);} });
    }).catch(() => {setError('تعذر تهيئة بيانات الصحة.');setLoading(false);});
    const timer = setInterval(() => setDate(localToday()),30000);
    return () => { cancelled = true; subscription?.unsubscribe();clearInterval(timer); };
  },[]);
  const rows = <K extends HealthKind>(kind: K) => records.filter(r => r.kind === kind).map(r => r.data as HealthData[K]);
  return { rows, loading, error, date, records };
}
