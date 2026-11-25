import { workspaceStorage } from '../../../db/workspaceScope';
import { useEffect, useRef } from 'react';
import type { UserSettings } from '../../../types';
import { sendLocalNotification, getNotificationPermission } from '../../../utils/reminderService';
import { getWorkoutOccurrences, isWorkoutAvailable, healthRows, localToday } from '../data/trainingRepository';

export function useReminderScheduler(settings: UserSettings, onOpenDeskBreak?: () => void) {
  const lastBreakNotifRef=useRef(Date.now());
  useEffect(()=>{
    let checking=false;
    const check=async()=>{
      if(checking||getNotificationPermission()!=='granted'||(settings.enabledSpaces&&!settings.enabledSpaces.includes('health')))return;
      checking=true;
      try {
        const now=new Date();const time=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
        const [runs,plans]=settings.reminderEnabled?await Promise.all([healthRows('run'),healthRows('plan')]):[[],[]];
        if(settings.reminderEnabled)for(const o of await getWorkoutOccurrences(localToday())){
          if(!isWorkoutAvailable(o,runs.find(r=>r.id===o.runId),plans.find(p=>p.id===o.planId)))continue;
          if((o.time??settings.reminderTime)!==time)continue;
          const key='health_notified:'+o.id+':'+o.date;
          if(workspaceStorage.getItem(key))continue;
          sendLocalNotification('حان موعد جلستك',{body:'افتح الصحة لبدء الجلسة أو تعديل موعدها.',tag:o.id});
          workspaceStorage.setItem(key,'1');
        }
        if(settings.workBreakReminderEnabled&&Date.now()-lastBreakNotifRef.current>=(settings.workBreakIntervalMinutes||45)*60000){
          sendLocalNotification('استراحة المكتب',{body:'تقدر تاخد استراحة حركة قصيرة.',tag:'desk-break-reminder'});
          lastBreakNotifRef.current=Date.now();onOpenDeskBreak?.();
        }
      }catch(error){console.error('Could not read workout reminders:',error);}finally{checking=false;}
    };
    void check();const visible=()=>{if(document.visibilityState==='visible')void check();};
    document.addEventListener('visibilitychange',visible);const timer=setInterval(()=>void check(),45000);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visible);};
  },[settings,onOpenDeskBreak]);
}
