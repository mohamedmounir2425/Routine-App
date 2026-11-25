import { useState } from 'react';
import { Alert, Button, Card } from 'antd';
import { Link } from 'react-router-dom';
import { useHealthRecords } from '../hooks/useHealthRecords';
import { logNutrition } from '../data/nutritionRepository';
export function NutritionCard(){
  const {rows,date}=useHealthRecords();const preferences=rows('preferences')[0];const plan=rows('nutrition').find(p=>p.id===preferences?.activeNutritionId);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  if(!plan)return <Card title="التغذية"><p>احفظ نظامك الغذائي عشان ترجعله بسهولة.</p><Link className="inline-block py-3 underline" to="/health/nutrition">＋ إضافة نظامي الغذائي</Link></Card>;
  const todayLog=rows('nutritionLog').find(l=>l.planId===plan.id&&l.trackingId===plan.trackingId&&l.date===date);
  return <Card title="نظامي الغذائي"><div className="space-y-3"><p className="font-bold">{plan.name}</p><Link className="inline-block py-2 underline" to="/health/nutrition">عرض نظامي</Link>{plan.tracking&&<div className="flex flex-wrap gap-2">{(['yes','partial','no'] as const).map((status,i)=><Button key={status} loading={busy} type={todayLog?.status===status?'primary':'default'} onClick={async()=>{setBusy(true);setError('');try{await logNutrition(plan,status,todayLog?.note);}catch{setError('تعذر حفظ تسجيل اليوم');}finally{setBusy(false);}}}>{['التزمت','جزئيًا','لم ألتزم'][i]}</Button>)}</div>}{error&&<Alert type="error" title={error}/>}</div></Card>;
}
