import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Dhikr, AzkarCategoryKey } from '../../types';
import { sounds } from '../../../../utils/audio';
import confetti from 'canvas-confetti';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Volume2, 
  VolumeX, 
  Copy,
  Settings
} from 'lucide-react';
import { useSwipeGesture } from '../../../../hooks/useSwipeGesture';

interface Props {
  dhikrList: Dhikr[];
  title: string;
  categoryKey: AzkarCategoryKey;
  onClose: () => void;
  onComplete: (durationSeconds: number) => void;
}

export const AzkarPlayer: React.FC<Props> = ({
  dhikrList,
  title,
  onClose,
  onComplete,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'continuous'>('cards');
  const [dhikrCounts, setDhikrCounts] = useState<Record<number, number>>({});
  const [advancedIndices, setAdvancedIndices] = useState<Record<number, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1); // 0.85, 1, 1.2
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    try {
      return localStorage.getItem('azkar_auto_advance') === 'true';
    } catch {
      return false;
    }
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [continuousAutoScroll, setContinuousAutoScroll] = useState<boolean>(() => {
    try {
      return localStorage.getItem('azkar_continuous_autoscroll') !== 'false';
    } catch {
      return true;
    }
  });
  const [cycleMuawwidhat, setCycleMuawwidhat] = useState<boolean>(() => {
    try {
      return localStorage.getItem('azkar_cycle_muawwidhat') === 'true';
    } catch {
      return false;
    }
  });
  const continuousItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const continuousFeedRef = useRef<HTMLElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  // Local Swipe Navigation for Azkar session view modes:
  // Swipe LEFT -> Cards
  // Swipe RIGHT -> Continuous
  // At edges -> do nothing
  useSwipeGesture({
    targetRef: playerContainerRef,
    onSwipeLeft: () => {
      if (viewMode === 'continuous') {
        setViewMode('cards');
      }
    },
    onSwipeRight: () => {
      if (viewMode === 'cards') {
        setViewMode('continuous');
      }
    },
    enabled: !isFinished && !showSettingsModal,
  });

  const handleToggleContinuousAutoScroll = (val: boolean) => {
    setContinuousAutoScroll(val);
    try {
      localStorage.setItem('azkar_continuous_autoscroll', String(val));
    } catch {}
  };

  const handleToggleAutoAdvance = (val: boolean) => {
    setAutoAdvance(val);
    try {
      localStorage.setItem('azkar_auto_advance', String(val));
    } catch {}
  };


  useEffect(() => {
    document.body.classList.add('azkar-session-active');
    window.dispatchEvent(new CustomEvent('azkar-session-change', { detail: { active: true } }));

    return () => {
      document.body.classList.remove('azkar-session-active');
      window.dispatchEvent(new CustomEvent('azkar-session-change', { detail: { active: false } }));
    };
  }, []);

  // Identify the Mu'awwidhat & Ikhlas group (consecutive Ikhlas, Falaq, Nas)
  const muawwidhatGroup = useMemo(() => {
    for (let i = 0; i < dhikrList.length - 2; i++) {
      const d1 = dhikrList[i];
      const d2 = dhikrList[i + 1];
      const d3 = dhikrList[i + 2];

      const isIkhlas = Boolean(d1.reference?.includes('الإخلاص') || d1.text.includes('قُلْ هُوَ اللَّهُ أَحَدٌ') || d1.text.includes('قُلْ هُوَ ٱللَّهُ أَحَدٌ'));
      const isFalaq = Boolean(d2.reference?.includes('الفلق') || d2.text.includes('قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ') || d2.text.includes('قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ'));
      const isNas = Boolean(d3.reference?.includes('الناس') || d3.text.includes('قُلْ أَعُوذُ بِرَبِّ النَّاسِ') || d3.text.includes('قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ'));

      if (isIkhlas && isFalaq && isNas) {
        return {
          ikhlasIndex: i,
          falaqIndex: i + 1,
          nasIndex: i + 2,
          maxRounds: Math.min(d1.count || 3, d2.count || 3, d3.count || 3),
        };
      }
    }
    return null;
  }, [dhikrList]);

  // Determine next target index in the alternating Mu'awwidhat cycle
  const getNextMuawwidhatTarget = (fromIndex: number, counts: Record<number, number>) => {
    if (!muawwidhatGroup) return fromIndex + 1;
    const { ikhlasIndex, falaqIndex, nasIndex, maxRounds } = muawwidhatGroup;

    const ikhlasCount = counts[ikhlasIndex] || 0;
    const falaqCount = counts[falaqIndex] || 0;
    const nasCount = counts[nasIndex] || 0;

    // All completed
    if (ikhlasCount >= maxRounds && falaqCount >= maxRounds && nasCount >= maxRounds) {
      return nasIndex + 1;
    }

    if (fromIndex === ikhlasIndex) {
      if (falaqCount < maxRounds) return falaqIndex;
      if (nasCount < maxRounds) return nasIndex;
      return nasIndex + 1;
    }

    if (fromIndex === falaqIndex) {
      if (nasCount < maxRounds) return nasIndex;
      if (ikhlasCount < maxRounds) return ikhlasIndex;
      return nasIndex + 1;
    }

    if (fromIndex === nasIndex) {
      if (ikhlasCount < maxRounds) return ikhlasIndex;
      if (falaqCount < maxRounds) return falaqIndex;
      return nasIndex + 1;
    }

    return fromIndex + 1;
  };

  const isCurrentInMuawwidhat = Boolean(
    muawwidhatGroup && 
    (currentIndex === muawwidhatGroup.ikhlasIndex || 
     currentIndex === muawwidhatGroup.falaqIndex || 
     currentIndex === muawwidhatGroup.nasIndex)
  );

  const currentMuawwidhatRound = muawwidhatGroup 
    ? Math.min(muawwidhatGroup.maxRounds, (dhikrCounts[currentIndex] || 0) + 1)
    : 1;

  let muawwidhatStatusText = '';
  if (isCurrentInMuawwidhat && cycleMuawwidhat && muawwidhatGroup) {
    const { ikhlasIndex, falaqIndex, nasIndex, maxRounds } = muawwidhatGroup;
    const allDone = (dhikrCounts[ikhlasIndex] || 0) >= maxRounds &&
                    (dhikrCounts[falaqIndex] || 0) >= maxRounds &&
                    (dhikrCounts[nasIndex] || 0) >= maxRounds;

    if (allDone) {
      muawwidhatStatusText = 'اكتملت المعوذات والإخلاص (3 دورات) ✓ اضغط للتالي ⬅';
    } else if (currentIndex === ikhlasIndex) {
      muawwidhatStatusText = `الدورة ${currentMuawwidhatRound} من ${maxRounds} - اضغط للمتابعة إلى الفلق ⬅`;
    } else if (currentIndex === falaqIndex) {
      muawwidhatStatusText = `الدورة ${currentMuawwidhatRound} من ${maxRounds} - اضغط للمتابعة إلى الناس ⬅`;
    } else if (currentIndex === nasIndex) {
      if (currentMuawwidhatRound < maxRounds) {
        muawwidhatStatusText = `الدورة ${currentMuawwidhatRound} من ${maxRounds} - اضغط للعودة للإخلاص (الدورة ${currentMuawwidhatRound + 1}) ⬅`;
      } else {
        muawwidhatStatusText = `الدورة ${maxRounds} (الأخيرة) - اضغط للإكمال ⬅`;
      }
    }
  }

  const currentDhikr = dhikrList[currentIndex] || dhikrList[0];
  const totalDhikrs = dhikrList.length;
  const targetCount = currentDhikr?.count || 1;
  const currentCount = dhikrCounts[currentIndex] || 0;
  const remainingInCurrent = Math.max(0, targetCount - currentCount);
  const overallProgressPercent = Math.round(((currentIndex + (Math.min(targetCount, currentCount) / targetCount)) / totalDhikrs) * 100);

  // Completed count for both modes
  const continuousCompletedCount = dhikrList.filter((d, i) => (dhikrCounts[i] || 0) >= (d.count || 1)).length;
  const continuousProgressPercent = Math.round((continuousCompletedCount / totalDhikrs) * 100);

  // Helper to scroll continuous feed smoothly to a specific dhikr index
  const scrollToContinuousItem = (idx: number, smooth = true) => {
    const container = continuousFeedRef.current;
    const targetEl = continuousItemRefs.current[idx];
    if (container && targetEl) {
      const containerRect = container.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      const scrollOffset = elRect.top - containerRect.top;
      const targetTop = container.scrollTop + scrollOffset - 16;

      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  const handleToggleCycleMuawwidhat = (val: boolean) => {
    setCycleMuawwidhat(val);
    try {
      localStorage.setItem('azkar_cycle_muawwidhat', String(val));
    } catch {}

    // When activating alternating cycle, reset their counters and start fresh from Surah Al-Ikhlas
    if (val && muawwidhatGroup) {
      const { ikhlasIndex, falaqIndex, nasIndex } = muawwidhatGroup;

      setDhikrCounts((prev) => ({
        ...prev,
        [ikhlasIndex]: 0,
        [falaqIndex]: 0,
        [nasIndex]: 0,
      }));

      setAdvancedIndices((prev) => ({
        ...prev,
        [ikhlasIndex]: false,
        [falaqIndex]: false,
        [nasIndex]: false,
      }));

      // If currently on any of the three, jump to the beginning of the cycle (Al-Ikhlas)
      if (currentIndex === ikhlasIndex || currentIndex === falaqIndex || currentIndex === nasIndex) {
        setCurrentIndex(ikhlasIndex);
        if (viewMode === 'continuous') {
          scrollToContinuousItem(ikhlasIndex, true);
        }
      }
    }
  };

  // Scroll to current active dhikr when switching to continuous view
  useEffect(() => {
    if (viewMode === 'continuous') {
      const timer = setTimeout(() => {
        scrollToContinuousItem(currentIndex, false);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Scroll listener in continuous feed to keep active dhikr in sync when scrolling
  const handleContinuousScroll = () => {
    const container = continuousFeedRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const focusLine = containerRect.top + 100;

    let closestIdx = currentIndex;
    let minDiff = Infinity;

    continuousItemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const diff = Math.abs(rect.top - focusLine);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    if (closestIdx !== currentIndex && closestIdx >= 0 && closestIdx < dhikrList.length) {
      setCurrentIndex(closestIdx);
    }
  };

  // Trigger tap count for card mode
  const handleCountTap = () => {
    if (isFinished || !currentDhikr) return;

    const count = dhikrCounts[currentIndex] || 0;

    // Check if we are inside the Mu'awwidhat alternating cycle
    if (cycleMuawwidhat && isCurrentInMuawwidhat && muawwidhatGroup) {
      const { ikhlasIndex, falaqIndex, nasIndex, maxRounds } = muawwidhatGroup;
      const allMuawwidhatDone = (dhikrCounts[ikhlasIndex] || 0) >= maxRounds &&
                                (dhikrCounts[falaqIndex] || 0) >= maxRounds &&
                                (dhikrCounts[nasIndex] || 0) >= maxRounds;

      // If all 3 are completed and user taps to advance
      if (allMuawwidhatDone) {
        setAdvancedIndices((prev) => ({ 
          ...prev, 
          [ikhlasIndex]: true, 
          [falaqIndex]: true, 
          [nasIndex]: true 
        }));
        if (nasIndex >= totalDhikrs - 1) {
          const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          setIsFinished(true);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          onComplete(durationSec);
        } else {
          setCurrentIndex(nasIndex + 1);
        }
        return;
      }

      // Haptic vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(35);
      }

      const nextCount = Math.min(maxRounds, count + 1);
      const updatedCounts = { ...dhikrCounts, [currentIndex]: nextCount };
      setDhikrCounts(updatedCounts);

      const nowAllDone = (updatedCounts[ikhlasIndex] || 0) >= maxRounds &&
                         (updatedCounts[falaqIndex] || 0) >= maxRounds &&
                         (updatedCounts[nasIndex] || 0) >= maxRounds;

      if (nowAllDone) {
        if (soundEnabled) sounds.playGoChime();
        if ('vibrate' in navigator) navigator.vibrate([40, 40, 70]);

        setAdvancedIndices((prev) => ({ 
          ...prev, 
          [ikhlasIndex]: true, 
          [falaqIndex]: true, 
          [nasIndex]: true 
        }));

        if (autoAdvance) {
          if (nasIndex >= totalDhikrs - 1) {
            const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
            setIsFinished(true);
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {}
            onComplete(durationSec);
          } else {
            setCurrentIndex(nasIndex + 1);
          }
        }
        // If !autoAdvance: all 3 reached max, button prompts to advance to next dhikr
      } else {
        if (soundEnabled) {
          sounds.playCountdownTick();
        }
        const nextTarget = getNextMuawwidhatTarget(currentIndex, updatedCounts);
        setCurrentIndex(nextTarget);
      }
      return;
    }

    // Standard card tap behavior
    // If current dhikr count is already completed, tapping advances to next dhikr (or completes session)
    if (count >= targetCount) {
      setAdvancedIndices((prev) => ({ ...prev, [currentIndex]: true }));
      if (currentIndex >= totalDhikrs - 1) {
        // Complete the entire session!
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setIsFinished(true);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore if canvas not supported
        }

        onComplete(durationSec);
      } else {
        // Move to next dhikr
        setCurrentIndex((prev) => prev + 1);
      }
      return;
    }

    // Haptic vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(35);
    }

    const nextCount = count + 1;
    setDhikrCounts((prev) => ({ ...prev, [currentIndex]: nextCount }));

    if (nextCount >= targetCount) {
      if (soundEnabled) {
        sounds.playGoChime();
      }
      if ('vibrate' in navigator) {
        navigator.vibrate([40, 40, 70]);
      }

      if (autoAdvance) {
        // Mode 1: Auto-advance directly without requiring extra tap
        setAdvancedIndices((prev) => ({ ...prev, [currentIndex]: true }));
        if (currentIndex >= totalDhikrs - 1) {
          const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          setIsFinished(true);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          onComplete(durationSec);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }
      // Mode 2: Keep current dhikr visible, user taps once more when ready to advance
    } else {
      if (soundEnabled) {
        sounds.playCountdownTick();
      }
    }
  };

  // Dedicated tap handler for continuous mode
  const handleContinuousCount = (index: number) => {
    if (isFinished) return;
    const item = dhikrList[index];
    if (!item) return;

    setCurrentIndex(index);

    const count = dhikrCounts[index] || 0;
    const target = item.count || 1;
    const isDone = count >= target;

    // Check if this item is part of the Mu'awwidhat alternating cycle
    const isMuawwidhatItem = Boolean(
      cycleMuawwidhat && muawwidhatGroup && 
      (index === muawwidhatGroup.ikhlasIndex || 
       index === muawwidhatGroup.falaqIndex || 
       index === muawwidhatGroup.nasIndex)
    );

    if (isMuawwidhatItem && muawwidhatGroup) {
      const { ikhlasIndex, falaqIndex, nasIndex, maxRounds } = muawwidhatGroup;
      const allMuawwidhatDone = (dhikrCounts[ikhlasIndex] || 0) >= maxRounds &&
                                (dhikrCounts[falaqIndex] || 0) >= maxRounds &&
                                (dhikrCounts[nasIndex] || 0) >= maxRounds;

      if (allMuawwidhatDone) {
        setAdvancedIndices((prev) => ({ 
          ...prev, 
          [ikhlasIndex]: true, 
          [falaqIndex]: true, 
          [nasIndex]: true 
        }));
        if (nasIndex + 1 < totalDhikrs) {
          setCurrentIndex(nasIndex + 1);
          scrollToContinuousItem(nasIndex + 1, true);
        } else {
          const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          setIsFinished(true);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          onComplete(durationSec);
        }
        return;
      }

      if ('vibrate' in navigator) {
        navigator.vibrate(35);
      }

      const next = Math.min(maxRounds, count + 1);
      const updatedCounts = { ...dhikrCounts, [index]: next };
      setDhikrCounts(updatedCounts);

      const nowAllDone = (updatedCounts[ikhlasIndex] || 0) >= maxRounds &&
                         (updatedCounts[falaqIndex] || 0) >= maxRounds &&
                         (updatedCounts[nasIndex] || 0) >= maxRounds;

      if (nowAllDone) {
        if (soundEnabled) sounds.playGoChime();
        if ('vibrate' in navigator) navigator.vibrate([40, 40, 70]);

        setAdvancedIndices((prev) => ({ 
          ...prev, 
          [ikhlasIndex]: true, 
          [falaqIndex]: true, 
          [nasIndex]: true 
        }));

        if (autoAdvance) {
          if (nasIndex + 1 < totalDhikrs) {
            setTimeout(() => {
              setCurrentIndex(nasIndex + 1);
              scrollToContinuousItem(nasIndex + 1, true);
            }, 220);
          } else {
            const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
            setIsFinished(true);
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {}
            onComplete(durationSec);
          }
        }
      } else {
        if (soundEnabled) sounds.playCountdownTick();
        const nextTarget = getNextMuawwidhatTarget(index, updatedCounts);
        setCurrentIndex(nextTarget);
        if (continuousAutoScroll) {
          setTimeout(() => {
            scrollToContinuousItem(nextTarget, true);
          }, 180);
        }
      }
      return;
    }

    // Standard continuous tap behavior
    // If already done, this tap acts as the extra tap to advance/skip or complete
    if (isDone) {
      const allDone = dhikrList.every((d, i) => (dhikrCounts[i] || 0) >= (d.count || 1));

      if (allDone) {
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setIsFinished(true);
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        onComplete(durationSec);
      } else if (index + 1 < totalDhikrs) {
        setAdvancedIndices((prev) => ({ ...prev, [index]: true }));
        setCurrentIndex(index + 1);
        if (continuousAutoScroll) {
          scrollToContinuousItem(index + 1, true);
        }
      }
      return;
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(35);
    }

    const next = count + 1;
    setDhikrCounts((prev) => ({ ...prev, [index]: next }));

    if (next >= target) {
      if (soundEnabled) sounds.playGoChime();
      if ('vibrate' in navigator) navigator.vibrate([40, 40, 70]);

      // Check if all items completed
      const allDone = dhikrList.every((d, i) => {
        const c = i === index ? next : (dhikrCounts[i] || 0);
        return c >= (d.count || 1);
      });

      if (autoAdvance) {
        // Immediate mode (autoAdvance = true): advance automatically
        setAdvancedIndices((prev) => ({ ...prev, [index]: true }));
        if (allDone) {
          const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          setIsFinished(true);
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch {}
          onComplete(durationSec);
        } else if (continuousAutoScroll && index + 1 < totalDhikrs) {
          setTimeout(() => {
            setCurrentIndex(index + 1);
            scrollToContinuousItem(index + 1, true);
          }, 220);
        }
      } else {
        // Manual mode (autoAdvance = false): "ضغطة زيادة للتخطي"
        // Stay on this dhikr! Do NOT scroll away! Do NOT complete yet!
        // The user must press once more to advance to next or finish.
      }
    } else {
      if (soundEnabled) sounds.playCountdownTick();
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < totalDhikrs - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleResetCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDhikrCounts((prev) => ({ ...prev, [currentIndex]: 0 }));
    setAdvancedIndices((prev) => ({ ...prev, [currentIndex]: false }));
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentDhikr) {
      navigator.clipboard.writeText(currentDhikr.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFontSizeMultiplier((prev) => (prev === 1 ? 1.2 : prev === 1.2 ? 0.9 : 1));
  };

  if (!currentDhikr) return null;

  return createPortal(
    <div 
      ref={playerContainerRef}
      dir="rtl"
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-[100dvh] max-h-[100dvh] z-[100] flex flex-col bg-[#070b14]/95 backdrop-blur-2xl text-slate-100 font-['Tajawal'] select-none overflow-hidden animate-in fade-in duration-200"
    >
      {/* Top Ambient Orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header Bar — rigidly locked to top */}
      <header className="sticky top-0 z-30 shrink-0 w-full flex items-center justify-between px-3 sm:px-6 py-3 border-b border-white/10 bg-[#070b14]/98 backdrop-blur-xl gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors shrink-0"
            title="إغلاق والعودة"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {title}
            </h2>
            <p className="text-[11px] text-slate-400">
              {viewMode === 'cards'
                ? `الذكر ${currentIndex + 1} من ${totalDhikrs}`
                : `تم إنجاز ${continuousCompletedCount} من ${totalDhikrs}`}
            </p>
          </div>
        </div>

        {/* Center: Mode Switch */}
        <div className="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
              viewMode === 'cards'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            بطاقات
          </button>
          <button
            type="button"
            onClick={() => setViewMode('continuous')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
              viewMode === 'continuous'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            قراءة متواصلة
          </button>
        </div>

        {/* Right Tools (Sound, Font size, Copy) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={toggleFontSize}
            className="px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-300 hover:text-white transition-all font-bold"
            title="تغيير حجم الخط"
          >
            A{fontSizeMultiplier > 1 ? '+' : fontSizeMultiplier < 1 ? '-' : ''}
          </button>

          {viewMode === 'cards' && (
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all"
              title="نسخ الذكر"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all"
            title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Session Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`p-2 rounded-xl liquid-glass-pill transition-all cursor-pointer ${
              autoAdvance ? 'text-emerald-400 border border-emerald-500/30' : 'text-slate-300 hover:text-white'
            }`}
            title="إعدادات جلسة الأذكار (الانتقال التلقائي/اليدوي)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Overall Progress Line */}
      <div className="w-full bg-slate-900/60 h-1.5 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
          style={{ width: `${viewMode === 'continuous' ? continuousProgressPercent : overallProgressPercent}%` }}
        />
      </div>

      {viewMode === 'cards' ? (
        <>
          {/* Main Reading Area — clicking anywhere in the reading space counts +1 */}
          <main
            onClick={handleCountTap}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleCountTap();
              }
            }}
            className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col items-center justify-start relative z-10 no-scrollbar cursor-pointer select-none active:scale-[0.998] transition-transform"
            title="اضغط في أي مكان في مساحة الذكر للعد (+1)"
          >
            <div className="max-w-2xl w-full mx-auto text-center space-y-5 pointer-events-none">
              {/* Subtitle / Category & Mu'awwidhat badge */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-pill text-xs text-emerald-300 border border-emerald-500/25">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentDhikr.categoryArabic}</span>
                </div>
                {isCurrentInMuawwidhat && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCycleMuawwidhat(!cycleMuawwidhat);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer pointer-events-auto select-none ${
                      cycleMuawwidhat
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-sm'
                        : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                    }`}
                    title="التبديل بين القراءة المتناوبة دورة دورة أو التكرار المعتاد 3 مرات"
                  >
                    <span>🔄</span>
                    <span>
                      {cycleMuawwidhat 
                        ? `دورة متناوبة (${currentMuawwidhatRound} من ${muawwidhatGroup?.maxRounds})`
                        : 'قراءة متناوبة: معطّل'}
                    </span>
                  </button>
                )}
              </div>

              {/* Dhikr Paragraphs */}
              <div className="py-2 px-2">
                {currentDhikr.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="dhikr-text text-white text-center leading-[2.3] mb-4 last:mb-0 transition-all duration-200 font-['Tajawal']"
                    style={{
                      fontSize: fontSizeMultiplier === 1.2 ? '1.55rem' : fontSizeMultiplier === 0.9 ? '1.15rem' : '1.35rem',
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Description & Reference */}
              {currentDhikr.description && (
                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-emerald-300 max-w-lg mx-auto leading-relaxed">
                  <span className="font-bold">الفضل: </span>
                  <span>{currentDhikr.description}</span>
                </div>
              )}

              {currentDhikr.reference && (
                <p className="text-xs text-slate-500">
                  {currentDhikr.reference}
                </p>
              )}
            </div>
          </main>

          {/* Bottom Counter Dock — safe-area aware */}
          <footer className="relative z-20 px-4 sm:px-6 pt-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              {/* Previous Dhikr Button */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title="الذكر السابق"
              >
                <ChevronRight className="w-5 h-5 rtl:scale-x-100" />
              </button>

              {/* Giant Center Counter Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCountTap();
                }}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer liquid-button"
              >
                <div className="text-right">
                  <div className="text-lg font-black tracking-tight">
                    {currentCount} / {targetCount}
                  </div>
                  <div className="text-[10px] text-slate-900 font-bold">
                    {muawwidhatStatusText || (
                      remainingInCurrent > 0 
                        ? `متبقي ${remainingInCurrent} - اضغط للعد` 
                        : currentIndex < totalDhikrs - 1 
                          ? 'اكتمل الذكر ✓ اضغط للتالي ⬅' 
                          : 'اكتمل الذكر ✓ اضغط للإنهاء 🎉'
                    )}
                  </div>
                </div>

                {/* Visual Dots for repetition if target <= 10 */}
                {targetCount > 1 && targetCount <= 10 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: targetCount }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i < currentCount ? 'bg-slate-950 scale-110' : 'bg-slate-950/30'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>

              {/* Reset Current Count Button */}
              <button
                onClick={handleResetCurrent}
                className="p-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white transition-all cursor-pointer"
                title="إعادة ضبط عداد الذكر الحالي"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Next Dhikr Button */}
              <button
                onClick={handleNext}
                disabled={currentIndex === totalDhikrs - 1}
                className="p-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                title="الذكر التالي"
              >
                <ChevronLeft className="w-5 h-5 rtl:scale-x-100" />
              </button>
            </div>
          </footer>
        </>
      ) : (
        /* Continuous / Vertical Reading Feed */
        <main
          ref={continuousFeedRef}
          onScroll={handleContinuousScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5 max-w-3xl w-full mx-auto no-scrollbar relative z-10 overscroll-contain"
          style={{ paddingBottom: 'max(4rem, env(safe-area-inset-bottom))' }}
        >
          {dhikrList.map((item, idx) => {
            const count = dhikrCounts[idx] || 0;
            const target = item.count || 1;
            const isDone = count >= target;
            const isWaitingForExtraTap = !autoAdvance && isDone && !advancedIndices[idx];
            const remaining = Math.max(0, target - count);
            const allDone = dhikrList.every((d, i) => (dhikrCounts[i] || 0) >= (d.count || 1));

            return (
              <div
                key={idx}
                ref={(el) => { continuousItemRefs.current[idx] = el; }}
                onClick={() => handleContinuousCount(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleContinuousCount(idx);
                  }
                }}
                className={`liquid-glass-card rounded-3xl p-5 sm:p-7 border transition-all text-right space-y-4 select-none scroll-mt-4 sm:scroll-mt-6 ${
                  isWaitingForExtraTap
                    ? 'border-emerald-500/60 bg-emerald-950/30 shadow-lg shadow-emerald-500/15 cursor-pointer active:scale-[0.99] ring-1 ring-emerald-500/30'
                    : isDone
                      ? 'border-emerald-500/30 bg-emerald-950/20 opacity-90 cursor-pointer'
                      : 'border-white/10 hover:border-emerald-500/30 cursor-pointer active:scale-[0.99]'
                }`}
                title={
                  isWaitingForExtraTap
                    ? (allDone ? 'اكتملت الأذكار! اضغط في أي مكان للإنهاء' : 'اكتمل الذكر! اضغط في أي مكان للمتابعة للذكر التالي')
                    : isDone
                      ? (idx + 1 < totalDhikrs ? 'اكتمل هذا الذكر - اضغط للانتقال للذكر التالي' : 'اكتمل هذا الذكر')
                      : 'اضغط في أي مكان داخل البطاقة للعد (+1)'
                }
              >
                {/* Item Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                      الذكر {idx + 1} من {totalDhikrs}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {item.categoryArabic}
                    </span>
                    {cycleMuawwidhat && muawwidhatGroup && (idx === muawwidhatGroup.ikhlasIndex || idx === muawwidhatGroup.falaqIndex || idx === muawwidhatGroup.nasIndex) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                        🔄 دورة متناوبة
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    الهدف: {target}
                  </span>
                </div>

                {/* Paragraphs */}
                <div className="space-y-3 py-1">
                  {item.paragraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      className="dhikr-text text-white text-right leading-[2.2] transition-all duration-200 font-['Tajawal']"
                      style={{
                        fontSize: fontSizeMultiplier === 1.2 ? '1.45rem' : fontSizeMultiplier === 0.9 ? '1.1rem' : '1.25rem',
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Virtue / Reference */}
                {item.description && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
                    <span className="font-bold">الفضل: </span>
                    <span>{item.description}</span>
                  </div>
                )}

                {item.reference && (
                  <p className="text-[11px] text-slate-500">
                    {item.reference}
                  </p>
                )}

                {/* Counter control row — explicit button only, scrolling never increments */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs font-bold">
                    {isDone ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> مكتمل ({target}/{target})
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        متبقي: <strong className="text-emerald-400 font-mono text-sm">{remaining}</strong> من {target}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinuousCount(idx);
                    }}
                    disabled={isDone && !isWaitingForExtraTap && idx >= totalDhikrs - 1}
                    className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer select-none ${
                      isWaitingForExtraTap
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-95 ring-2 ring-emerald-400/40 liquid-button animate-pulse'
                        : isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer'
                          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 hover:brightness-110 liquid-button'
                    }`}
                  >
                    {isWaitingForExtraTap ? (
                      allDone ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>اكتمل الذكر ✓ اضغط للإنهاء 🎉</span>
                        </>
                      ) : (
                        <>
                          <span>اكتمل الذكر ✓ اضغط للتالي ⬅</span>
                        </>
                      )
                    ) : isDone ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>اكتمل الذكر ✓</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {cycleMuawwidhat && muawwidhatGroup && (idx === muawwidhatGroup.ikhlasIndex || idx === muawwidhatGroup.falaqIndex || idx === muawwidhatGroup.nasIndex)
                            ? `اضغط للعد والتنقل (${count} / ${target})`
                            : `اضغط للعد (${count} / ${target})`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </main>
      )}

      {/* Session Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-white/10 shadow-2xl space-y-5 text-right font-['Tajawal'] select-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">إعدادات جلسة الأذكار</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Auto-advance Setting Option */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300">
                طريقة الانتقال بين الأذكار بعد اكتمال العدد:
              </div>

              {/* Option 1: Manual (Extra tap to advance) */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  !autoAdvance 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-sm shadow-emerald-500/10' 
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
                onClick={() => handleToggleAutoAdvance(false)}
              >
                <input
                  type="radio"
                  name="azkar-advance-mode"
                  checked={!autoAdvance}
                  onChange={() => handleToggleAutoAdvance(false)}
                  className="mt-1 accent-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <span>ضغطة إضافية للمتابعة (يدوي)</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">الموصى به</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يبقى الذكر الحالي ظاهرًا أمامك عند اكتمال العدد حتى تنتهي من قراءته، ثم تضغط في أي مكان للانتقال للذكر التالي دون خوف من فقدان مكانك (يطبق في عرض البطاقات والقراءة المتواصلة).
                  </p>
                </div>
              </label>

              {/* Option 2: Automatic (Immediate transition) */}
              <label 
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  autoAdvance 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-white shadow-sm shadow-emerald-500/10' 
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
                onClick={() => handleToggleAutoAdvance(true)}
              >
                <input
                  type="radio"
                  name="azkar-advance-mode"
                  checked={autoAdvance}
                  onChange={() => handleToggleAutoAdvance(true)}
                  className="mt-1 accent-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">
                    انتقال تلقائي فوري (بدون ضغطة إضافية)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    بمجرد اكتمال عدّات الذكر، ينتقل العداد تلقائيًا ومباشرةً إلى الذكر التالي دون توقف (يطبق في عرض البطاقات والقراءة المتواصلة).
                  </p>
                </div>
              </label>
            </div>

            {/* Mu'awwidhat Alternating Cycle Option */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">🔄</span>
                  <div className="text-xs font-bold text-slate-200">
                    قراءة المعوذتين والإخلاص بالتناوب (دورة دورة)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleCycleMuawwidhat(!cycleMuawwidhat)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    cycleMuawwidhat ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cycleMuawwidhat ? 'مفعّل' : 'معطّل'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                قراءة سورة الإخلاص مرة ثم الفلق مرة ثم الناس مرة، وتكرار هذه الدورة 3 مرات بالتتابع (السنة في قراءة المعوذات)، بدلاً من تكرار كل سورة 3 مرات متتالية.
              </p>
            </div>

            {/* Continuous Auto-Scroll Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200">التمرير التلقائي (قراءة متواصلة)</div>
                <div className="text-[11px] text-slate-400">تمرير الشاشة تلقائيًا للذكر التالي فور اكتمال العدد</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleContinuousAutoScroll(!continuousAutoScroll)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  continuousAutoScroll ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {continuousAutoScroll ? 'مفعّل' : 'معطّل'}
              </button>
            </div>

            {/* Sound toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs font-bold text-slate-300">أصوات التفاعل والانتهاء</span>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {soundEnabled ? 'مفعّل' : 'معطّل'}
              </button>
            </div>

            {/* Close / Done Button */}
            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              حفظ وإغلاق
            </button>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md liquid-glass-card rounded-3xl p-6 sm:p-8 shadow-2xl border-emerald-500/40 text-center font-['Tajawal']">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto mb-4 shadow-xl shadow-emerald-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-3xl">
                🌿
              </div>
            </div>

            <h3 className="text-2xl font-black text-white">تقبل الله طاعتكم</h3>
            <p className="text-sm text-emerald-400 font-bold mt-1">أتممت {title} بنجاح</p>
            <p className="text-xs text-slate-400 mt-2">
              تم تسجيل إنجازك في سجل العبادات اليومي والحفاظ على استمراريتك
            </p>

            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xl font-black text-emerald-400">{totalDhikrs}</div>
                <div className="text-[11px] text-slate-400">إجمالي الأذكار</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xl font-black text-teal-400">
                  {Math.round((Date.now() - startTimeRef.current) / 1000)} ث
                </div>
                <div className="text-[11px] text-slate-400">المدة المستغرقة</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer liquid-button"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
