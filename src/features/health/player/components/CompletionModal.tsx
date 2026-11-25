import { useState } from 'react';
import { Button, Input, Select, Alert, InputNumber, Tag } from 'antd';
import { Modal } from '../../../../components/common/Modal';
import type { Routine, WorkoutLog } from '../../../../types';

export function CompletionModal({
  routine,
  durationSeconds,
  exercisesCompletedCount,
  onSaveAndClose,
  onDiscard,
}: {
  onDiscard: () => void;
  routine: Routine;
  durationSeconds: number;
  exercisesCompletedCount: number;
  onSaveAndClose: (log: Omit<WorkoutLog, 'id'>) => void | Promise<void>;
}) {
  const [notes, setNotes] = useState('');
  const [difficulty, setDifficulty] = useState<WorkoutLog['difficultyRating']>();
  const [pre, setPre] = useState<number | null>(null);
  const [post, setPost] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalExercises = routine.exerciseIds.length;
  const isFull = exercisesCompletedCount >= totalExercises && totalExercises > 0;
  const isZero = exercisesCompletedCount <= 0;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onSaveAndClose({
        routineId: routine.id,
        routineName: routine.name,
        completedAt: new Date().toISOString(),
        durationMinutes: Math.max(0, Math.round(durationSeconds / 60)),
        elapsedSeconds: durationSeconds,
        exercisesCompleted: exercisesCompletedCount,
        totalExercises,
        weekNumber: routine.weekNumber,
        sessionCode: routine.sessionCode,
        notes: notes.trim() || undefined,
        difficultyRating: difficulty,
        prePainScore: pre ?? undefined,
        postPainScore: post ?? undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر الحفظ. أعد المحاولة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!saving) void save();
      }}
      title="ملخص الجلسة"
      showCloseButton={false}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-current/15 bg-current/5 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-base">{routine.name}</h3>
            <Tag color={isFull ? 'green' : isZero ? 'default' : 'orange'}>
              {isFull ? 'جلسة مكتملة' : isZero ? 'صفر إنجاز (تم تخطي التمارين)' : 'تنفيذ جزئي'}
            </Tag>
          </div>
          <p className="text-sm font-medium">
            {exercisesCompletedCount} من {totalExercises} تمارين مكتملة ·{' '}
            {Math.max(1, Math.round(durationSeconds / 60))} دقيقة ({durationSeconds} ثانية)
          </p>
          <p className="text-xs opacity-75">
            {isFull
              ? 'أحسنت! أتممت كل تمارين الجلسة.'
              : isZero
                ? 'تم تخطي جميع التمارين؛ لن يُحسب الموعد مكتملًا.'
                : 'سيُحفظ تنفيذ جزئي؛ التمارين المتخطاة لا تُحسب مكتملة.'}
          </p>
        </div>

        {error && <Alert title={error} type="error" showIcon />}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">الصعوبة (اختياري)</span>
          <Select
            className="w-full"
            allowClear
            placeholder="اختر مستوى الصعوبة..."
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: 'easy', label: 'سهل' },
              { value: 'moderate', label: 'مناسب' },
              { value: 'challenging', label: 'تحدي' },
              { value: 'hard', label: 'صعب' },
            ]}
          />
        </label>

        {routine.painTracking && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm">
              <span>الألم قبل (0-10)</span>
              <InputNumber className="!w-full" min={0} max={10} value={pre} onChange={setPre} />
            </label>
            <label className="block space-y-1 text-sm">
              <span>الألم بعد (0-10)</span>
              <InputNumber className="!w-full" min={0} max={10} value={post} onChange={setPost} />
            </label>
          </div>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">ملاحظة (اختياري)</span>
          <Input.TextArea
            rows={3}
            placeholder="أي ملاحظات حول الأداء أو راحة الظهر..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </label>

        <div className="flex flex-col gap-2 pt-2">
          <Button block size="large" type="primary" loading={saving} onClick={() => void save()}>
            حفظ التنفيذ
          </Button>
          <Button
            block
            disabled={saving}
            onClick={() => {
              if (window.confirm('إغلاق الملخص دون حفظ هذا التنفيذ؟')) onDiscard();
            }}
          >
            إغلاق دون حفظ
          </Button>
        </div>
      </div>
    </Modal>
  );
}
