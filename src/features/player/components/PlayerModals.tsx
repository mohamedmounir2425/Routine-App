import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Exercise } from '../../../types';

interface PlayerModalsProps {
  showExitConfirm: boolean;
  onCloseExitConfirm: () => void;
  onConfirmExit: () => void;
  showSwapModal: boolean;
  onCloseSwapModal: () => void;
  currentExerciseId?: string;
  availableExercises: Exercise[];
  onSelectSwapExercise: (ex: Exercise) => void;
}

export const PlayerModals: React.FC<PlayerModalsProps> = ({
  showExitConfirm,
  onCloseExitConfirm,
  onConfirmExit,
  showSwapModal,
  onCloseSwapModal,
  currentExerciseId,
  availableExercises,
  onSelectSwapExercise,
}) => {
  return (
    <>
      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-white mb-2 font-['Tajawal']">هل تريد إنهاء الجلسة؟</h3>
            <p className="text-xs text-slate-400 mb-6">
              لن يتم تسجيل التمرين الحالي في قائمة الإنجاز إذا خرجت الآن.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCloseExitConfirm}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                متابعة التمرين
              </button>
              <button
                onClick={onConfirmExit}
                className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30"
              >
                خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap / Replace Exercise Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white font-['Tajawal'] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  <span>استبدال التمرين ببديل مناسب</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اختر تمريناً بديلاً أكثر راحة لظهرك لمتابعة الجلسة دون انقطاع
                </p>
              </div>
              <button
                onClick={onCloseSwapModal}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
              {availableExercises
                .filter(ex => ex.id !== currentExerciseId)
                .map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => onSelectSwapExercise(ex)}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer flex items-center justify-between gap-3 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-white font-['Tajawal'] group-hover:text-emerald-400 transition-colors">
                        {ex.arabicName}
                      </div>
                      <div className="text-[10px] text-slate-400">{ex.name} • {ex.durationSeconds} ثانية</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 text-[10px] font-bold transition-all">
                      اختيار البديل
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
