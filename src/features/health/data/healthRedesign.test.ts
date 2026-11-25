import { db, RoutineDatabase, initializeDatabase } from '../../../db/database';
import Dexie from 'dexie';
import { exportCompleteBackup, importCompleteBackup } from '../../../db/backup';
import { validateHealthRecord } from '../../../db/healthValidation';
import { SYNC_ENTITIES } from '../../../db/syncEntities';
import { synchronizeVersioned } from '../../../db/versionedSync';
import type { TrainingPlan, TrainingRun } from '../../../types/health';
import type { Exercise, WorkoutLog } from '../../../types';
import { DEFAULT_USER_SETTINGS } from '../../../db/seedData';
import { getLocalDateString, parseLocalDate } from '../../../utils/dateUtils';
import { adherence, archiveTraining, changeOccurrence, getWorkoutOccurrences, healthRows, localToday, migrateHealth, occurrencesForDate, pauseTraining, playbackForSession, putHealth, recordTrainingExecution, routineForSession, startTrainingRun } from './trainingRepository';
import { activateNutrition, activeNutrition, emptyNutrition, logNutrition, saveNutrition, saveWeight } from './nutritionRepository';
import { emptyRecipe } from '../../home/recipes/recipeModel';
import { aggregateTodayFeed } from '../../today/todayAggregator';
import { INITIAL_EXERCISES, INITIAL_ROUTINES } from '../../../db/seedData';
import { clearSavedWorkoutSession, getSessionStorageKey, readSavedWorkoutSession } from '../player/usePlayerLogic';
import { workspaceStorage } from '../../../db/workspaceScope';

export async function runHealthRedesignTests() {
  const results: { name: string; passed: boolean }[]=[];
  const check=(name:string,passed:boolean)=>results.push({name,passed});
  const database=new RoutineDatabase('health-redesign-tests');await database.open();
  const date=localToday();const next=parseLocalDate(date);next.setDate(next.getDate()+1);const tomorrow=getLocalDateString(next);
  const exercise:Exercise={id:'source-exercise',name:'Movement',arabicName:'حركة',category:'mobility',durationSeconds:60,restAfterSeconds:15,description:'',instructions:[],targetMuscles:[],createdAt:new Date().toISOString()};
  const plan:TrainingPlan={id:'simple-plan',name:'تماريني',description:'',painTracking:false,archived:false,updatedAt:new Date().toISOString(),sessions:[{id:'session-one',name:'جلستي',items:[{id:'item-one',exerciseId:exercise.id,sets:1,durationSeconds:30,restSeconds:0},{id:'item-two',exerciseId:exercise.id,sets:2,reps:12,restSeconds:20}]}]};
  await database.exercises.put(exercise);await putHealth('plan',plan,database);
  const restored=(await healthRows('plan',database))[0];const playback=playbackForSession(restored.sessions[0],[exercise]);
  check('A name and exercises save a playable plan without a run or dates',restored.name===plan.name&&routineForSession(restored,restored.sessions[0]).exerciseIds.length===2&&(await healthRows('run',database)).length===0);
  check('Repeated exercise items preserve independent settings and zero rest in playback',playback.exercises[0].id!==playback.exercises[1].id&&playback.exercises[0].durationSeconds===30&&playback.exercises[0].restAfterSeconds===0&&playback.exercises[1].reps===12);
  await putHealth('plan',{...plan,id:'second-plan'},database);
  await putHealth('plan',{...plan,sessions:[{...plan.sessions[0],items:[{...plan.sessions[0].items[1],reps:8},plan.sessions[0].items[0]]}]},database);
  check('Reordering and editing a plan cannot mutate the library or another plan',(await database.exercises.get(exercise.id))?.durationSeconds===60&&(await healthRows('plan',database)).find(p=>p.id==='second-plan')?.sessions[0].items[1].reps===12);
  check('Missing playback exercises are reported instead of silently disappearing',playbackForSession(plan.sessions[0],[]).missing.length===2);

  const run=await startTrainingRun(plan,[{id:'morning',sessionId:'session-one',day:parseLocalDate(date).getDay(),time:'08:00'},{id:'evening',sessionId:'session-one',day:parseLocalDate(date).getDay(),time:'18:00'},{id:'tomorrow',sessionId:'session-one',day:next.getDay()}],date,undefined,database);
  const due=await getWorkoutOccurrences(date,database);
  const log:WorkoutLog={id:'execution-one',routineId:'session-one',routineName:plan.name,trainingPlanId:plan.id,trainingRunId:run.id,occurrenceId:due[0].id,completedAt:new Date().toISOString(),durationMinutes:3,exercisesCompleted:2,totalExercises:2,sessionSnapshot:structuredClone(plan.sessions[0]),executionSnapshot:playback.exercises};
  await recordTrainingExecution(log,due[0],database);
  const after=await getWorkoutOccurrences(date,database);
  check('Same-session appointments have separate IDs and completing one leaves the other pending',after.length===2&&after.filter(o=>o.status==='completed').length===1&&after.filter(o=>o.status==='pending').length===1);
  await recordTrainingExecution({...log,id:'manual-extra',occurrenceId:undefined},undefined,database);
  check('An additional manual execution does not complete another scheduled appointment',(await getWorkoutOccurrences(date,database)).filter(o=>o.status==='pending').length===1);
  let duplicateRejected=false;try{await recordTrainingExecution({...log,id:'duplicate'},due[0],database);}catch{duplicateRejected=true;}
  check('A repeated completion cannot duplicate an appointment execution',duplicateRejected&&!(await database.workoutLogs.get('duplicate')));
  await changeOccurrence(due[1],{date:tomorrow,reason:'موعد آخر'},database);
  const postponed=await getWorkoutOccurrences(tomorrow,database);
  check('Deferring retains occurrence identity and never replaces another session on its destination date',postponed.length===2&&postponed.some(o=>o.id===due[1].id&&o.deferred)&&!(await getWorkoutOccurrences(date,database)).some(o=>o.id===due[1].id));
  await changeOccurrence(postponed.find(o=>o.id===due[1].id)!,{skip:true},database);
  const week=[...await getWorkoutOccurrences(date,database),...await getWorkoutOccurrences(tomorrow,database)];const stats=adherence(week);
  check('Skipping is a distinct state and does not count as completion',stats.completed===1&&stats.skipped===1&&stats.planned===3);
  const pending=week.find(o=>o.status==='pending')!;
  await recordTrainingExecution({...log,id:'zero-skip-all',exercisesCompleted:0,occurrenceId:pending.id},pending,database);
  check('Skipping all exercises (0 completed) keeps the scheduled occurrence pending',(await getWorkoutOccurrences(tomorrow,database)).find(o=>o.id===pending.id)?.status==='pending');
  await recordTrainingExecution({...log,id:'partial',exercisesCompleted:1,occurrenceId:pending.id},pending,database);
  check('Partial playback remains separate from completed adherence',(await getWorkoutOccurrences(tomorrow,database)).some(o=>o.status==='partial'));
  const rerun=await startTrainingRun(plan,[run.rules[0]],date,tomorrow,database,[next.getDay()]);
  check('Restarting the same plan creates fresh pending occurrence IDs and persists endDate and restDays atomically',rerun.id!==run.id&&rerun.endDate===tomorrow&&rerun.restDays?.[0]===next.getDay()&&(await getWorkoutOccurrences(date,database)).some(o=>o.runId===rerun.id&&o.status==='pending'));
  await pauseTraining(rerun,date,database);
  check('Pausing prevents new due sessions without removing old execution history',!(await getWorkoutOccurrences(date,database)).some(o=>o.runId===rerun.id)&&(await healthRows('execution',database)).length===4);
  const paused=(await healthRows('run',database)).find(r=>r.id===rerun.id)!;await pauseTraining(paused,date,database);
  check('Resuming starts current availability without turning the pause into backlog',(await getWorkoutOccurrences(date,database)).some(o=>o.runId===rerun.id&&o.status==='pending'));
  const limited:TrainingRun={...rerun,endDate:date};
  check('Plan boundaries and local calendar dates exclude out-of-range occurrences',occurrencesForDate(plan,limited,tomorrow).length===0&&getLocalDateString(new Date(2026,10,15,0,5))==='2026-11-15');
  const rest={...rerun,rules:[],restDays:[next.getDay()]};
  check('An unscheduled or planned rest day contributes no missing sessions',adherence(occurrencesForDate(plan,rest,tomorrow)).planned===0);
  await archiveTraining(plan,database);
  check('Archiving ends future scheduling and retains historical snapshots',!(await getWorkoutOccurrences(date,database)).some(o=>o.runId===rerun.id&&o.status==='pending')&&(await healthRows('execution',database))[0].sessionSnapshot?.items[0].durationSeconds===30);

  // Legacy records retain IDs/settings; ambiguous schedules remain available for explicit review.
  await database.routines.put({id:'old-routine',name:'قديمة',description:'',exerciseIds:[exercise.id],totalEstimatedMinutes:1,level:'gentle',tag:'',isCustom:true,customExerciseConfigs:{[exercise.id]:{durationSeconds:45,restAfterSeconds:0}}});
  await database.settings.put({...DEFAULT_USER_SETTINGS,currentWeekNumber:3});
  await database.weeklySchedule.put({dayOfWeek:2,dayNameAr:'الثلاثاء',routineId:'old-routine'});
  await database.workoutSchedules.put({id:'old-time',routineId:'old-routine',dayOfWeek:2,scheduledTime:'08:00',durationMinutes:1,isEnabled:true});
  await migrateHealth(database,date);const migratedCount=await database.healthRecords.count();await migrateHealth(database,date);
  const legacyRuns=(await healthRows('run',database)).filter(r=>r.id.startsWith('migrated'));
  check('Migration is idempotent and preserves ambiguous old schedules for review',migratedCount===await database.healthRecords.count()&&legacyRuns.length===2&&legacyRuns.some(r=>r.migrationReview));
  check('Migration keeps custom exercise configuration and never invents a legacy start date',(await healthRows('plan',database)).find(p=>p.id==='training-old-routine')?.sessions[0].items[0].restSeconds===0&&legacyRuns.every(r=>r.startDate===undefined&&r.weekOffset===2));
  const oldName='LifeOS_user_health-upgrade-fixture_v1';
  const oldDatabase=new Dexie(oldName);
  oldDatabase.version(7).stores({exercises:'id',routines:'id',weeklySchedule:'dayOfWeek',workoutLogs:'id',settings:'id',azkarLogs:'id',tasks:'id',pendingSync:'++id, entityId, userId, status, nextRetryAt, [table+entityId], [userId+table+entityId]',projects:'id',plans:'id',planMilestones:'id',workoutSchedules:'id',dayPlans:'date'});
  await oldDatabase.table('exercises').put(exercise);
  await oldDatabase.table('routines').put({id:'upgrade-routine',name:'Retained',description:'',exerciseIds:[exercise.id],totalEstimatedMinutes:1,level:'gentle',tag:'',isCustom:true});
  oldDatabase.close();
  const upgraded=new RoutineDatabase(oldName);await upgraded.open();await migrateHealth(upgraded,date);
  check('An actual v7 account database upgrades through v12 without reading nonexistent future stores',upgraded.verno===12&&!!await upgraded.exercises.get(exercise.id)&&(await healthRows('plan',upgraded)).some(p=>p.id==='training-upgrade-routine'));
  upgraded.close();await upgraded.delete();

  const nutrition={...emptyNutrition(),name:'نظام مكتوب',text:'النظام الشخصي'};await saveNutrition(nutrition,database);await activateNutrition(nutrition.id,database);
  check('Written nutrition works with no Home, recipes, tracking or weight',(await activeNutrition(database))?.text===nutrition.text&&(await healthRows('nutritionLog',database)).length===0&&(await database.recipes.count())===0);
  let emptyNutritionRejected=false;try{await saveNutrition({...emptyNutrition(),name:'فارغ',text:'   '},database);}catch{emptyNutritionRejected=true;}
  let emptyMealRejected=false;try{await saveNutrition({...emptyNutrition(),name:'وجبة فارغة',mode:'meals',meals:[{id:'m1',name:'فطار',text:'  ',portion:'',alternatives:'',notes:''}]},database);}catch{emptyMealRejected=true;}
  check('Saving empty written nutrition or a meal without description/recipe is rejected',emptyNutritionRejected&&emptyMealRejected);
  const modelRoutine=INITIAL_ROUTINES.find(r=>r.id==='routine-core-back-shield')!;
  const modelHasAnimations=modelRoutine.exerciseIds.every(id=>!!INITIAL_EXERCISES.find(e=>e.id===id)?.animationSlug);
  check('All 6 model session exercises in Core & Spine Shield have dedicated offline motion illustrations',modelRoutine.exerciseIds.length===6&&modelHasAnimations);
  workspaceStorage.setItem(getSessionStorageKey(modelRoutine),JSON.stringify({routineId:modelRoutine.id,currentIndex:2,currentSet:2,currentSide:'left',timeLeft:25,setTimeLeft:15,completedIndices:[0,1],totalElapsedTime:95,updatedAt:new Date().toISOString()}));
  const resumedState=readSavedWorkoutSession(modelRoutine);
  clearSavedWorkoutSession(modelRoutine);
  check('Workout player persists and restores exact exercise, set, side and timer state for resume',resumedState?.currentIndex===2&&resumedState?.currentSet===2&&resumedState?.currentSide==='left'&&resumedState?.completedIndices.length===2&&readSavedWorkoutSession(modelRoutine)===null);
  const meals={...emptyNutrition(),name:'وجباتي',mode:'meals' as const,tracking:true,meals:[{id:'meal',name:'وجبة',text:'أكل المنزل',portion:'حصتي',alternatives:'بديل',notes:'',recipeId:'recipe-link',recipeTitle:'عنوان مرجعي'}]};
  await saveNutrition(meals,database);await activateNutrition(meals.id,database);
  check('Activating another nutrition plan retains earlier plans with only one explicit active selection',(await healthRows('nutrition',database)).length===2&&(await activeNutrition(database))?.id===meals.id);
  await logNutrition(meals,'yes','أول تسجيل',date,database);await logNutrition(meals,'partial','تعديل',date,database);
  check('Repeated nutrition recording updates one local-date record and unrecorded days stay absent',(await healthRows('nutritionLog',database)).length===1&&(await healthRows('nutritionLog',database))[0].note==='تعديل'&&!(await healthRows('nutritionLog',database)).some(l=>l.date===tomorrow));
  await saveNutrition({...meals,tracking:false},database);
  check('Disabling tracking retains the nutrition reference and previous logs',(await activeNutrition(database))?.tracking===false&&(await healthRows('nutritionLog',database)).length===1);
  await database.recipes.put({...emptyRecipe(),id:'recipe-link',title:'اسم أحدث',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});await database.recipes.delete('recipe-link');
  const kept=(await activeNutrition(database))!.meals[0];
  check('Deleting a recipe preserves meal text, personal portion, fallback title and link for repair',kept.portion==='حصتي'&&kept.recipeTitle==='عنوان مرجعي'&&kept.recipeId==='recipe-link');
  await saveWeight({planId:meals.id,date,value:70.5,unit:'kg'},database);
  check('Optional weight measurements retain their unit and local calendar date',(await healthRows('weight',database))[0].date===date&&(await healthRows('weight',database))[0].value===70.5);
  let invalidRejected=false;try{validateHealthRecord({id:plan.id,kind:'plan',data:{...plan,sessions:[{...plan.sessions[0],items:[{...plan.sessions[0].items[0],sets:-1}]}]}});}catch{invalidRejected=true;}
  check('Imported health records reject invalid nested prescription settings',invalidRejected);
  const codec=SYNC_ENTITIES.find(e=>e.cloud==='health_records')!;const row={id:meals.id,kind:'nutrition',data:meals};const cloud=codec.toCloud('owner-a',row);
  check('Cloud codecs preserve personal data and namespace stable IDs per account',JSON.stringify(codec.fromCloud(cloud))===JSON.stringify(row)&&cloud.id!==codec.toCloud('owner-b',row).id);
  const missingSchema=new RoutineDatabase('health-missing-schema-test');await putHealth('nutrition',nutrition,missingSchema);
  const sync=await synchronizeVersioned(missingSchema,'owner-a',{snapshot:async()=>({tables:Object.fromEntries(SYNC_ENTITIES.filter(e=>e.cloud!=='health_records').map(e=>[e.cloud,[]])),versions:[]}),mutate:async()=>{throw new Error('Unexpected mutation');}});
  check('A missing health cloud migration reports incomplete sync and retains local data',!!sync.error?.includes('health_records')&&(await healthRows('nutrition',missingSchema)).length===1);
  missingSchema.close();await missingSchema.delete();

  // Backup and Today use the real shared database, still exclusively fake-indexeddb.
  await db.transaction('rw',db.tables,async()=>{for(const table of db.tables)await table.clear();});
  await initializeDatabase();await initializeDatabase();
  check('Fresh workspaces never receive an enforced four-week workout schedule',await db.weeklySchedule.count()===0&&await db.workoutSchedules.count()===0);
  await putHealth('plan',plan);await putHealth('nutrition',meals);await activateNutrition(meals.id);await logNutrition(meals,'yes');
  const feedRun=await startTrainingRun(plan,[run.rules[0],run.rules[1]],date);
  const feedDue=(await getWorkoutOccurrences()).filter(o=>o.runId===feedRun.id);
  await recordTrainingExecution({...log,id:'today-one',trainingRunId:feedRun.id,occurrenceId:feedDue[0].id},feedDue[0]);
  const feed=await aggregateTodayFeed({customDateStr:date,preferences:{showHealth:true,showHome:false,showPlans:false,showWork:false,showWorship:false}});
  check('Today and Health expose identical occurrence identity, content and independent completion',feed.items.filter(i=>i.type==='workout').length===2&&feed.items.find(i=>i.id===feedDue[0].id)?.isCompleted===true&&feed.items.find(i=>i.id===feedDue[1].id)?.isCompleted===false&&feed.items.find(i=>i.id===feedDue[1].id)?.actionPayload?.routine.occurrenceId===feedDue[1].id);
  const backup=await exportCompleteBackup();const before=await db.healthRecords.count();await db.healthRecords.clear();await db.workoutLogs.clear();const imported=await importCompleteBackup(backup);await importCompleteBackup(backup);
  check('Portable backup restores all health data repeatedly without duplicating plans, logs or appointments',imported.success&&await db.healthRecords.count()===before&&(await activeNutrition())?.id===meals.id&&(await healthRows('nutritionLog')).length===1);
  check('Account caches are physically isolated for health records',(await healthRows('nutrition',database)).length===2&&(await healthRows('nutrition')).length===1);
  database.close();await database.delete();
  return results;
}
