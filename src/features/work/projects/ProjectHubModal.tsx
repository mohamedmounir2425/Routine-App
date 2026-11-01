import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  ExternalLink, 
  GitBranch, 
  Terminal, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  Check, 
  Folder, 
  FileText, 
  AlertCircle,
  Edit3,
  Copy
} from 'lucide-react';
import { LifeProject, LifeTask, TaskPriority } from '../../../types';
import { getTasksByProject, saveTask, toggleTaskCompletion } from '../../../db/taskQueries';
import { sounds } from '../../../utils/audio';

interface ProjectHubModalProps {
  isOpen: boolean;
  project: LifeProject | null;
  onClose: () => void;
  onEditProject?: (project: LifeProject) => void;
  onProjectUpdated?: () => void;
}

export const ProjectHubModal: React.FC<ProjectHubModalProps> = ({
  isOpen,
  project,
  onClose,
  onEditProject,
  onProjectUpdated,
}) => {
  const [tasks, setTasks] = useState<LifeTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isCopiedCommand, setIsCopiedCommand] = useState(false);

  // Quick Add Task Form State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskEstimatedMinutes, setTaskEstimatedMinutes] = useState<string>('');

  const loadProjectTasks = async () => {
    if (!project) return;
    setIsLoadingTasks(true);
    try {
      const list = await getTasksByProject(project.id);
      // Sort: incomplete first, then by priority / createdAt
      setTasks(
        list.sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    } catch (err) {
      console.error('Failed to load tasks for project hub:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      loadProjectTasks();
      setIsAddingTask(false);
      setTaskTitle('');
      setTaskDueDate('');
      setTaskPriority('medium');
      setTaskEstimatedMinutes('');
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const handleCopyCommand = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setIsCopiedCommand(true);
      setTimeout(() => setIsCopiedCommand(false), 2000);
    } catch (e) {
      console.warn('Failed to copy command to clipboard', e);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    sounds.playGoChime();
    await toggleTaskCompletion(taskId);
    await loadProjectTasks();
    if (onProjectUpdated) onProjectUpdated();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !project) return;

    const est = taskEstimatedMinutes.trim() ? parseInt(taskEstimatedMinutes.trim(), 10) : undefined;
    const newTask: LifeTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      spaceId: 'work',
      projectId: project.id,
      title: taskTitle.trim(),
      priority: taskPriority,
      status: 'TODO',
      isCompleted: false,
      dueDate: taskDueDate.trim() || undefined,
      estimatedMinutes: Number.isFinite(est) && (est as number) > 0 ? est : undefined,
      actualMinutes: 0,
      focusSessions: [],
      sourceType: 'project',
      sourceId: project.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveTask(newTask);
    setTaskTitle('');
    setTaskDueDate('');
    setTaskEstimatedMinutes('');
    setIsAddingTask(false);
    await loadProjectTasks();
    if (onProjectUpdated) onProjectUpdated();
  };

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl liquid-glass-card rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl text-right max-h-[90vh] flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0 gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-black text-white font-['Tajawal'] truncate">
                {project.title}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                project.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}>
                {project.status === 'completed' ? 'مكتمل ✓' : 'قيد التنفيذ 🚀'}
              </span>
              {project.requiresVpn && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>يتطلب VPN</span>
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-xs text-slate-300 font-['Tajawal'] line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEditProject && (
              <button
                onClick={() => {
                  onClose();
                  onEditProject(project);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="تعديل المشروع"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 pl-1">
          {/* Section 1: Developer Context Cards */}
          {(project.repositoryUrl || project.devUrl || project.apiUrl || project.branch || project.runCommand || project.setupNotes) ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-['Tajawal']">
                <span>بيئة التطوير والتشغيل (Dev Context)</span>
                {project.targetDate && (
                  <span className="text-[11px] text-sky-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>التسليم: {project.targetDate}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Dev URL */}
                {project.devUrl && (
                  <a
                    href={project.devUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/15 flex items-center justify-between gap-2 text-sky-300 transition-all group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">🌐</span>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">بيئة العمل المحلية (Dev URL)</span>
                        <span className="font-mono text-xs font-bold truncate block">{project.devUrl}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                  </a>
                )}

                {/* Repo Link */}
                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 flex items-center justify-between gap-2 text-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">🐙</span>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">مستودع الكود (Repository)</span>
                        <span className="font-mono text-xs truncate block">{project.repositoryUrl}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                  </a>
                )}

                {/* API / Swagger */}
                {project.apiUrl && (
                  <a
                    href={project.apiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 flex items-center justify-between gap-2 text-slate-200 transition-all group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">⚡</span>
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">توثيق الواجهة (API / Swagger)</span>
                        <span className="font-mono text-xs truncate block">{project.apiUrl}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                  </a>
                )}

                {/* Branch */}
                {project.branch && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <GitBranch className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] text-slate-400 block">الفرع الحالي (Branch)</span>
                        <span className="font-mono text-xs font-bold text-white truncate block">{project.branch}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Run Command */}
                {project.runCommand && (
                  <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="truncate flex-1">
                        <span className="text-[10px] text-slate-400 block">أمر التشغيل (Run Command)</span>
                        <code className="font-mono text-xs text-emerald-300 font-bold select-all block truncate">
                          {project.runCommand}
                        </code>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCommand(project.runCommand!)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                      title="نسخ الأمر"
                    >
                      {isCopiedCommand ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Setup Notes */}
                {project.setupNotes && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                      <FileText className="w-3.5 h-3.5" />
                      <span>ملاحظات الإعداد والبيئة:</span>
                    </div>
                    <p className="text-slate-300 font-['Tajawal'] whitespace-pre-wrap">
                      {project.setupNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="font-['Tajawal']">لم يتم إدخال إعدادات التطوير لهذا المشروع بعد.</span>
              {onEditProject && (
                <button
                  onClick={() => {
                    onClose();
                    onEditProject(project);
                  }}
                  className="text-sky-400 hover:text-sky-300 font-bold text-xs"
                >
                  + إضافة إعدادات Dev
                </button>
              )}
            </div>
          )}

          {/* Section 2: Tasks List & Quick Add */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white font-['Tajawal']">
                  مهام المشروع ({tasks.length})
                </h3>
              </div>

              {!isAddingTask && (
                <button
                  type="button"
                  onClick={() => setIsAddingTask(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>+ إضافة مهمة (Add Task)</span>
                </button>
              )}
            </div>

            {/* Inline Quick Add Task Form */}
            {isAddingTask && (
              <form 
                onSubmit={handleCreateTask}
                className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-3 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-['Tajawal']">إضافة مهمة جديدة للمشروع</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    إلغاء
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="عنوان المهمة (مثال: بناء نموذج المصادقة)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">الأولوية</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-xs text-white focus:outline-none focus:border-sky-500/50"
                    >
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية ⚡</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">الوقت المقدر (بالدقائق)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="مثال: 45"
                      value={taskEstimatedMinutes}
                      onChange={(e) => setTaskEstimatedMinutes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    تراجع
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    حفظ المهمة
                  </button>
                </div>
              </form>
            )}

            {/* Task Items */}
            {isLoadingTasks ? (
              <div className="text-center py-6 text-xs text-slate-500">جاري تحميل المهام...</div>
            ) : tasks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-['Tajawal']">
                  لا توجد مهام مسجلة لهذا المشروع حتى الآن.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(true)}
                  className="text-xs text-sky-400 font-bold hover:underline"
                >
                  أضف أول مهمة الآن
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Active Tasks */}
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="w-5 h-5 rounded-md border border-white/20 hover:border-sky-400 flex items-center justify-center shrink-0 cursor-pointer transition-all"
                        title="إنجاز المهمة"
                      />
                      <span className="truncate text-white font-medium">{task.title}</span>
                      {task.priority === 'high' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold shrink-0">
                          عالية ⚡
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-slate-400 text-[11px]">
                      {task.estimatedMinutes && (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{task.estimatedMinutes}د</span>
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-sky-400">
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Completed Tasks Accordion / List */}
                {completedTasks.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      المهام المنجزة ({completedTasks.length})
                    </span>
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="w-5 h-5 rounded-md bg-emerald-500 border-emerald-400 text-slate-950 flex items-center justify-center shrink-0 cursor-pointer"
                            title="إلغاء الإنجاز"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <span className="truncate text-slate-400 line-through">{task.title}</span>
                        </div>
                        {task.actualMinutes ? (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {task.actualMinutes}د تركيز
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            {project.steps?.length || 0} خطوات متسلسلة • {tasks.length} مهام
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
