import { useState } from 'react';
import { Alert, Button, Collapse, Input, InputNumber, Modal, Radio, Select } from 'antd';
import type { Exercise, MuscleCategory } from '../../../../types';

export function AddExerciseModal({
  isOpen,
  onClose,
  onAddExercise,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (draft: Omit<Exercise, 'id' | 'createdAt'>) => void | Promise<unknown>;
}) {
  const [name, setName] = useState('');
  const [english, setEnglish] = useState('');
  const [category, setCategory] = useState<MuscleCategory>('mobility');
  const [mode, setMode] = useState<'time' | 'reps'>('time');
  const [duration, setDuration] = useState(60);
  const [reps, setReps] = useState(10);
  const [rest, setRest] = useState(15);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [video, setVideo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');

  const cancel = () => {
    if (!name || window.confirm('تجاهل مسودة التمرين؟')) onClose();
  };

  return (
    <Modal open={isOpen} title="إضافة تمرين" footer={null} onCancel={cancel} maskClosable={false} destroyOnHidden>
      <form
        className="space-y-5"
        onSubmit={async e => {
          e.preventDefault();
          if (busy) return;
          if (!name.trim()) {
            setNameError('أدخل اسم التمرين');
            return;
          }
          setBusy(true);
          setError('');
          setNameError('');
          try {
            await onAddExercise({
              name: english.trim() || name.trim(),
              arabicName: name.trim(),
              category,
              durationSeconds: mode === 'time' ? Math.max(1, duration) : 45,
              reps: mode === 'reps' ? Math.max(1, reps) : undefined,
              restAfterSeconds: Math.max(0, rest),
              description: description.trim(),
              instructions: instructions
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean),
              targetMuscles: [],
              videoUrl: video.trim() || undefined,
              isFavorite: false,
            });
            setName('');
            setEnglish('');
            setVideo('');
            setInstructions('');
            setDescription('');
            onClose();
          } catch {
            setError('تعذر حفظ التمرين. مسودتك محفوظة هنا.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-sm opacity-80">اسم التمرين يكفي. أضف التفاصيل عند الحاجة.</p>
        {error && <Alert title={error} type="error" showIcon />}

        <label className="block space-y-1.5">
          <span className="font-bold">اسم التمرين</span>
          <Input
            required
            autoFocus
            size="large"
            status={nameError ? 'error' : undefined}
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </label>

        <Collapse
          items={[
            {
              key: 'more',
              label: 'تفاصيل إضافية (اختياري)',
              children: (
                <div className="space-y-4">
                  <label className="block">
                    اسم بالإنجليزية
                    <Input value={english} onChange={e => setEnglish(e.target.value)} />
                  </label>
                  <label className="block">
                    التصنيف
                    <Select
                      className="w-full"
                      value={category}
                      onChange={setCategory}
                      options={[
                        { value: 'back', label: 'ظهر' },
                        { value: 'core', label: 'جذع' },
                        { value: 'mobility', label: 'مرونة وحركة' },
                        { value: 'neck', label: 'رقبة' },
                        { value: 'legs', label: 'أرجل' },
                      ]}
                    />
                  </label>
                  <div className="space-y-2">
                    <span className="block text-sm">طريقة العد الافتراضية</span>
                    <Radio.Group
                      value={mode}
                      onChange={e => setMode(e.target.value)}
                      options={[
                        { value: 'time', label: 'مدة بالثواني' },
                        { value: 'reps', label: 'تكرارات' },
                      ]}
                      optionType="button"
                    />
                  </div>
                  {mode === 'time' ? (
                    <label className="block">
                      المدة الافتراضية بالثواني
                      <InputNumber
                        className="!w-full"
                        min={1}
                        max={3600}
                        value={duration}
                        onChange={n => setDuration(n ?? 60)}
                      />
                    </label>
                  ) : (
                    <label className="block">
                      عدد التكرارات الافتراضي
                      <InputNumber
                        className="!w-full"
                        min={1}
                        max={500}
                        value={reps}
                        onChange={n => setReps(n ?? 10)}
                      />
                    </label>
                  )}
                  <label className="block">
                    الراحة بالثواني (0 بدون راحة)
                    <InputNumber
                      className="!w-full"
                      min={0}
                      max={600}
                      value={rest}
                      onChange={n => setRest(n ?? 0)}
                    />
                  </label>
                  <label className="block">
                    الوصف
                    <Input.TextArea value={description} onChange={e => setDescription(e.target.value)} />
                  </label>
                  <label className="block">
                    خطوات التنفيذ (كل خطوة في سطر)
                    <Input.TextArea value={instructions} onChange={e => setInstructions(e.target.value)} />
                  </label>
                  <label className="block">
                    رابط الفيديو
                    <Input type="url" value={video} onChange={e => setVideo(e.target.value)} />
                  </label>
                </div>
              ),
            },
          ]}
        />

        <Button htmlType="submit" type="primary" size="large" block loading={busy}>
          حفظ التمرين
        </Button>
      </form>
    </Modal>
  );
}
