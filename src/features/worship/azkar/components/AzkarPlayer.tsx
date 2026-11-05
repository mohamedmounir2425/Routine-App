import { workspaceStorage } from '../../../../db/workspaceScope';
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
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Compass,
  Heart
} from 'lucide-react';
import { useSwipeGesture } from '../../../../hooks/useSwipeGesture';
import { DHIKR_THEMES, DhikrThemeId, getDefaultThemeForCategory } from '../../../../theme/dhikrThemes';

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
  categoryKey,
  onClose,
  onComplete,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'continuous'>('cards');
  const [dhikrCounts, setDhikrCounts] = useState<Record<number, number>>({});
  const [, setAdvancedIndices] = useState<Record<number, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState<number>(1); // 0.85, 1, 1.2
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => {
    try {
      return workspaceStorage.getItem('azkar_auto_advance') === 'true';
    } catch {
      return false;
    }
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'dhikr' | 'display'>('dhikr');
  const [continuousAutoScroll, setContinuousAutoScroll] = useState<boolean>(() => {
    try {
      return workspaceStorage.getItem('azkar_continuous_autoscroll') !== 'false';
    } catch {
      return true;
    }
  });
  const [cycleMuawwidhat, setCycleMuawwidhat] = useState<boolean>(() => {
    try {
      return workspaceStorage.getItem('azkar_cycle_muawwidhat') === 'true';
    } catch {
      return false;
    }
  });
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    try {
      return workspaceStorage.getItem('azkar_focus_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showTadabbur, setShowTadabbur] = useState(false);
  const [selectedCompanionDhikr, setSelectedCompanionDhikr] = useState<number | null>(() => {
    try {
      const saved = workspaceStorage.getItem('azkar_companion_dhikr');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [expandedContinuousTadabbur, setExpandedContinuousTadabbur] = useState<Record<number, boolean>>({});
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

  const [tahlilCount, setTahlilCount] = useState<10 | 100>(() => {
    try {
      const saved = workspaceStorage.getItem('azkar_tahlil_count');
      return saved === '100' ? 100 : 10;
    } catch {
      return 10;
    }
  });

  const [includeIstighfar, setIncludeIstighfar] = useState<boolean>(() => {
    try {
      return workspaceStorage.getItem('azkar_include_istighfar') !== 'false';
    } catch {
      return true;
    }
  });

  const [sessionTheme, setSessionTheme] = useState<DhikrThemeId>(() => {
    try {
      const saved = workspaceStorage.getItem('azkar_session_theme');
      if (saved && (saved === 'serenity' || saved === 'dawn' || saved === 'evening' || saved === 'solitude')) {
        return saved as DhikrThemeId;
      }
      return getDefaultThemeForCategory(categoryKey);
    } catch {
      return 'serenity';
    }
  });

  const handleSelectTheme = (themeId: DhikrThemeId) => {
    setSessionTheme(themeId);
    try {
      workspaceStorage.setItem('azkar_session_theme', themeId);
    } catch {}
  };

  const theme = DHIKR_THEMES[sessionTheme] || DHIKR_THEMES.serenity;

  const isTahlilDhikr = (d?: Dhikr) => {
    if (!d) return false;
    return d.text.includes('لَا إلَه إلّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ') ||
           d.text.includes('لا إله إلا الله وحده لا شريك له') ||
           d.text.includes('لا اله الا الله وحده لا شريك له');
  };

  const isIstighfarDhikr = (d?: Dhikr) => {
    if (!d) return false;
    return d.text.includes('أسْتَغْفِرُ اللهَ وَأتُوبُ إلَيْهِ') ||
           d.text.includes('أستغفر الله وأتوب إليه') ||
           d.text.includes('استغفر الله واتوب اليه');
  };

  const handleToggleTahlilCount = (val: 10 | 100) => {
    setTahlilCount(val);
    try {
      workspaceStorage.setItem('azkar_tahlil_count', String(val));
    } catch {}
  };

  const handleToggleIncludeIstighfar = (val: boolean) => {
    setIncludeIstighfar(val);
    try {
      workspaceStorage.setItem('azkar_include_istighfar', String(val));
    } catch {}
  };

  // Filter and map dhikrList based on user settings (Tahlil count 10/100, Istighfar inclusion)
  const effectiveDhikrList = useMemo(() => {
    return dhikrList
      .filter((d) => {
        if (!includeIstighfar && isIstighfarDhikr(d)) {
          return false;
        }
        return true;
      })
      .map((d) => {
        if (isTahlilDhikr(d)) {
          return {
            ...d,
            count: tahlilCount,
          };
        }
        return d;
      });
  }, [dhikrList, includeIstighfar, tahlilCount]);

  useEffect(() => {
    if (currentIndex >= effectiveDhikrList.length && effectiveDhikrList.length > 0) {
      setCurrentIndex(effectiveDhikrList.length - 1);
    }
  }, [effectiveDhikrList.length, currentIndex]);

  const handleToggleContinuousAutoScroll = (val: boolean) => {
    setContinuousAutoScroll(val);
    try {
      workspaceStorage.setItem('azkar_continuous_autoscroll', String(val));
    } catch {}
  };

  const handleToggleAutoAdvance = (val: boolean) => {
    setAutoAdvance(val);
    try {
      workspaceStorage.setItem('azkar_auto_advance', String(val));
    } catch {}
  };

  const handleToggleFocusMode = (val: boolean) => {
    setFocusMode(val);
    try {
      workspaceStorage.setItem('azkar_focus_mode', String(val));
    } catch {}
  };

  const handleSelectCompanionDhikr = (idx: number | null) => {
    setSelectedCompanionDhikr(idx);
    try {
      if (idx !== null) {
        workspaceStorage.setItem('azkar_companion_dhikr', String(idx));
      } else {
        workspaceStorage.removeItem('azkar_companion_dhikr');
      }
    } catch {}
  };

  const toggleContinuousTadabbur = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedContinuousTadabbur((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };



  useEffect(() => {
    setShowTadabbur(false);
  }, [currentIndex]);

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
    for (let i = 0; i < effectiveDhikrList.length - 2; i++) {
      const d1 = effectiveDhikrList[i];
      const d2 = effectiveDhikrList[i + 1];
      const d3 = effectiveDhikrList[i + 2];

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
  }, [effectiveDhikrList]);

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

  const currentDhikr = effectiveDhikrList[currentIndex] || effectiveDhikrList[0];
  const totalDhikrs = effectiveDhikrList.length;
  const targetCount = currentDhikr?.count || 1;
  const currentCount = dhikrCounts[currentIndex] || 0;
  const remainingInCurrent = Math.max(0, targetCount - currentCount);
  const overallProgressPercent = Math.round(((currentIndex + (Math.min(targetCount, currentCount) / targetCount)) / totalDhikrs) * 100);

  // Completed count for both modes
  const continuousCompletedCount = effectiveDhikrList.filter((d, i) => (dhikrCounts[i] || 0) >= (d.count || 1)).length;
  const continuousProgressPercent = Math.round((continuousCompletedCount / totalDhikrs) * 100);

  // Milestone / Stages (محطات الجلسة) calculation for focus mode
  const segmentCount = totalDhikrs >= 20 ? 4 : totalDhikrs >= 10 ? 3 : 2;
  const segmentSize = Math.ceil(totalDhikrs / segmentCount);
  const currentSegment = Math.min(segmentCount, Math.floor(currentIndex / segmentSize) + 1);
  const segmentNames = ['المقطع الأول', 'المقطع الثاني', 'المقطع الثالث', 'المقطع الرابع'];
  const currentSegmentName = segmentNames[currentSegment - 1] || `المقطع ${currentSegment}`;

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
      workspaceStorage.setItem('azkar_cycle_muawwidhat', String(val));
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

    if (closestIdx !== currentIndex && closestIdx >= 0 && closestIdx < effectiveDhikrList.length) {
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
    const item = effectiveDhikrList[index];
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
      const allDone = effectiveDhikrList.every((d, i) => (dhikrCounts[i] || 0) >= (d.count || 1));

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
      const allDone = effectiveDhikrList.every((d, i) => {
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

  const handleFinishSession = () => {
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
    } else {
      handleFinishSession();
    }
  };

  const handleResetDhikr = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDhikrCounts((prev) => ({ ...prev, [index]: 0 }));
    setAdvancedIndices((prev) => ({ ...prev, [index]: false }));
  };

  const handleResetCurrent = (e: React.MouseEvent) => {
    handleResetDhikr(currentIndex, e);
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
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-full h-[100dvh] max-h-[100dvh] z-[100] flex flex-col backdrop-blur-2xl text-slate-100 font-['Tajawal'] select-none overflow-hidden animate-in fade-in duration-300"
      style={{ backgroundColor: theme.sessionBgHex }}
    >
      {/* Top Ambient Orbs */}
      <div className={`absolute -top-20 -right-20 w-80 h-80 ${theme.ambientOrb1Class} rounded-full blur-[100px] pointer-events-none transition-all duration-700 ${focusMode ? 'opacity-20' : 'opacity-100'}`} />
      <div className={`absolute -bottom-20 -left-20 w-80 h-80 ${theme.ambientOrb2Class} rounded-full blur-[100px] pointer-events-none transition-all duration-700 ${focusMode ? 'opacity-20' : 'opacity-100'}`} />

      {/* Top Header Bar — rigidly locked to top */}
      <header 
        className={`sticky top-0 z-30 shrink-0 w-full flex items-center justify-between px-3 sm:px-6 py-3 border-b backdrop-blur-xl gap-2 transition-colors duration-300 ${theme.headerBgStyle}`}
        style={{ backgroundColor: `${theme.sessionBgHex}ea` }}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
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
            className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
              viewMode === 'cards'
                ? `${theme.badgeClass} shadow-sm`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            بطاقات
          </button>
          <button
            type="button"
            onClick={() => setViewMode('continuous')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
              viewMode === 'continuous'
                ? `${theme.badgeClass} shadow-sm`
                : 'text-slate-400 hover:text-white'
            }`}
          >
            قراءة متواصلة
          </button>
        </div>

        {/* Right Tools (Sound, Font size, Copy, Focus, Settings) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={toggleFontSize}
            className="px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-300 hover:text-white transition-all font-bold cursor-pointer"
            title="تغيير حجم الخط"
          >
            A{fontSizeMultiplier > 1 ? '+' : fontSizeMultiplier < 1 ? '-' : ''}
          </button>

          {viewMode === 'cards' && (
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all cursor-pointer"
              title="نسخ الذكر"
            >
              {copied ? <Check className={`w-4 h-4 ${theme.accentPrimary}`} /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all cursor-pointer"
            title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            {soundEnabled ? <Volume2 className={`w-4 h-4 ${theme.accentPrimary}`} /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Focus Mode Quick Toggle */}
          <button
            onClick={() => handleToggleFocusMode(!focusMode)}
            className={`p-2 rounded-xl liquid-glass-pill transition-all cursor-pointer ${
              focusMode
                ? `${theme.badgeFocusClass} shadow-sm`
                : 'text-slate-300 hover:text-white'
            }`}
            title={focusMode ? 'وضع التركيز والتدبر: مفعّل (انقر للتعطيل)' : 'تفعيل وضع التركيز والتدبر (خلو من المشتتات)'}
          >
            {focusMode ? <Eye className={`w-4 h-4 ${theme.accentPrimary}`} /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Session Settings Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className={`p-2 rounded-xl liquid-glass-pill transition-all cursor-pointer ${
              showSettingsModal ? `${theme.badgeClass}` : 'text-slate-300 hover:text-white'
            }`}
            title="إعدادات جلسة الأذكار (المظهر / الانتقال / وضع التركيز)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Overall Progress Line */}
      <div className={`w-full ${theme.progressBarTrack} h-1.5 relative overflow-hidden transition-colors`}>
        <div
          className={`h-full ${theme.progressBarFill} transition-all duration-300`}
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
            <div className={`max-w-2xl w-full mx-auto text-center space-y-5 pointer-events-none p-5 sm:p-7 rounded-3xl border transition-all ${
              focusMode
                ? `${theme.cardBorderFocus} ${theme.cardBgFocus}`
                : `${theme.cardBorderNormal} ${theme.cardBgNormal}`
            } liquid-glass-card shadow-2xl`}>
              {/* Header inside card: Focus Journey Milestones or Normal Category */}
              {focusMode ? (
                <div className="space-y-2 select-none">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium">
                    <Compass className={`w-3.5 h-3.5 ${theme.accentPrimary}`} />
                    <span className={`font-bold ${theme.accentPrimary}`}>{currentSegmentName}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-slate-300">الذكر {currentIndex + 1} من {totalDhikrs}</span>
                  </div>

                  {/* Stage Milestones Journey Bar: ●────●────○────○ */}
                  <div className="flex items-center justify-center gap-1.5 py-0.5">
                    {Array.from({ length: segmentCount }).map((_, sIdx) => {
                      const isPastOrCurrent = sIdx + 1 <= currentSegment;
                      const isExactCurrent = sIdx + 1 === currentSegment;
                      return (
                        <React.Fragment key={sIdx}>
                          <span
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              isExactCurrent
                                ? `${theme.accentPrimary} ring-4 ring-white/20 scale-110`
                                : isPastOrCurrent
                                  ? `${theme.accentPrimary} opacity-70`
                                  : 'bg-white/20'
                            }`}
                            title={`المقطع ${sIdx + 1}`}
                          />
                          {sIdx < segmentCount - 1 && (
                            <span
                              className={`w-7 sm:w-10 h-[1.5px] rounded-full transition-colors ${
                                sIdx + 1 < currentSegment ? 'bg-white/40' : 'bg-white/15'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Alternating Mu'awwidhat indicator in Focus Mode if applicable */}
                  {isCurrentInMuawwidhat && (
                    <div className="pt-1 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCycleMuawwidhat(!cycleMuawwidhat);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer select-none ${
                          cycleMuawwidhat
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                            : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                        }`}
                      >
                        <span>🔄</span>
                        <span>
                          {cycleMuawwidhat 
                            ? `دورة متناوبة (${currentMuawwidhatRound} من ${muawwidhatGroup?.maxRounds})`
                            : 'قراءة متناوبة: معطّل'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Subtitle / Category & Mu'awwidhat badge */
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${theme.badgeClass}`}>
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
              )}

              {/* Tahlil count 10 vs 100 inline switcher */}
              {isTahlilDhikr(currentDhikr) && (
                <div className="flex items-center justify-center pt-1 pointer-events-auto">
                  <div className="inline-flex items-center p-1 rounded-full bg-white/5 border border-white/10 text-xs select-none gap-1 shadow-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTahlilCount(10);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        tahlilCount === 10
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="السنة الميسرة في الصباح والمساء (10 مرات)"
                    >
                      10 مرات (ميسر)
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTahlilCount(100);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        tahlilCount === 100
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="الأصل اليومي (100 مرة)"
                    >
                      100 مرة
                    </button>
                  </div>
                </div>
              )}

              {/* Dhikr Paragraphs */}
              <div className="py-2 px-2">
                {currentDhikr.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="dhikr-text text-center leading-[2.3] mb-4 last:mb-0 transition-all duration-200 font-['Tajawal']"
                    style={{
                      color: theme.arabicTextColor,
                      fontSize: fontSizeMultiplier === 1.2 ? '1.55rem' : fontSizeMultiplier === 0.9 ? '1.15rem' : '1.35rem',
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* In Focus Mode: Collapsible Tadabbur & Meaning */}
              {focusMode ? (
                (currentDhikr.description || currentDhikr.reference) && (
                  <div className="pt-2 pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTadabbur((prev) => !prev);
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium ${theme.tadabburButtonFocus} transition-all cursor-pointer shadow-sm`}
                    >
                      <span>تدبّر والمعنى</span>
                      {showTadabbur ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showTadabbur && (
                      <div className={`mt-3 p-4 rounded-2xl ${theme.tadabburDrawerFocus} text-xs sm:text-sm max-w-lg mx-auto leading-relaxed text-right animate-in fade-in zoom-in-95 duration-200 space-y-2`}>
                        {currentDhikr.description && (
                          <div>
                            <span className="font-bold text-white">المعنى والفضل: </span>
                            <span className="text-slate-200">{currentDhikr.description}</span>
                          </div>
                        )}
                        {currentDhikr.reference && (
                          <p className="text-[11px] opacity-70 pt-1.5 border-t border-white/10">
                            {currentDhikr.reference}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Standard Description & Reference */
                <>
                  {currentDhikr.description && (
                    <div className={`p-3 sm:p-4 rounded-2xl ${theme.tadabburDrawerNormal} text-xs sm:text-sm max-w-lg mx-auto leading-relaxed`}>
                      <span className="font-bold">الفضل: </span>
                      <span>{currentDhikr.description}</span>
                    </div>
                  )}

                  {currentDhikr.reference && (
                    <p className="text-xs text-slate-500">
                      {currentDhikr.reference}
                    </p>
                  )}
                </>
              )}
            </div>
          </main>

          {/* Bottom Counter Dock — safe-area aware */}
          <footer 
            className={`relative z-20 px-4 sm:px-6 pt-4 border-t backdrop-blur-xl transition-colors duration-300 ${theme.dockBgStyle}`}
            style={{ 
              backgroundColor: `${theme.sessionBgHex}ea`,
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' 
            }}
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

              {/* Center Counter Button: Quiet Serene Counter in Focus Mode vs Gradient Button in Regular */}
              {focusMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCountTap();
                  }}
                  className={`flex-1 py-3 px-4 rounded-2xl border active:scale-98 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${theme.cardBgFocus} ${theme.cardBorderFocus} hover:border-white/30`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono tracking-tight text-white">
                      {currentCount} <span className="text-slate-500 font-normal text-sm">/ {targetCount}</span>
                    </span>
                    {/* Quiet repetition dots */}
                    {targetCount > 1 && targetCount <= 10 && (
                      <div className="flex items-center gap-1 mr-2">
                        {Array.from({ length: targetCount }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              i < currentCount ? `${theme.accentPrimary} scale-110` : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`text-[11px] ${theme.secondaryTextColor} font-medium`}>
                    {muawwidhatStatusText || (
                      remainingInCurrent > 0 
                        ? `متبقي ${remainingInCurrent} • انقر للعد` 
                        : currentIndex < totalDhikrs - 1 
                          ? 'اكتمل الذكر ✓ انقر للمتابعة' 
                          : 'اكتمل الذكر ✓ انقر للختام'
                    )}
                  </div>
                </button>
              ) : (
                /* Giant Center Counter Button */
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCountTap();
                  }}
                  className={`flex-1 py-3.5 px-5 rounded-2xl ${theme.accentGradient} active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer liquid-button`}
                >
                  <div className="text-right">
                    <div className={`text-lg font-black tracking-tight ${theme.accentText}`}>
                      {currentCount} / {targetCount}
                    </div>
                    <div className={`text-[10px] ${theme.accentText} opacity-90 font-bold`}>
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
              )}

              {/* Reset Current Count Button */}
              <button
                onClick={handleResetCurrent}
                disabled={currentCount === 0}
                className={`p-3 rounded-2xl liquid-glass-pill transition-all ${
                  currentCount === 0 ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-300 hover:text-white cursor-pointer active:scale-95'
                }`}
                title="إعادة ضبط عداد الذكر الحالي"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Next Dhikr / Finish Button */}
              <button
                onClick={handleNext}
                className={`p-3 rounded-2xl liquid-glass-pill transition-all cursor-pointer ${
                  currentIndex === totalDhikrs - 1
                    ? `${theme.completedText} border border-emerald-500/30 bg-emerald-500/10`
                    : 'text-slate-300 hover:text-white'
                }`}
                title={currentIndex < totalDhikrs - 1 ? 'الذكر التالي' : 'إنهاء الجلسة 🤍'}
              >
                {currentIndex < totalDhikrs - 1 ? (
                  <ChevronLeft className="w-5 h-5 rtl:scale-x-100" />
                ) : (
                  <Check className={`w-5 h-5 ${theme.completedText}`} />
                )}
              </button>
            </div>
          </footer>
        </>
      ) : (
        /* Continuous / Vertical Reading Feed */
        <main
          ref={continuousFeedRef}
          onScroll={handleContinuousScroll}
          className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 overflow-y-auto pb-28 no-scrollbar"
        >
          {effectiveDhikrList.map((item, idx) => {
            const count = dhikrCounts[idx] || 0;
            const target = item.count || 1;
            const isDone = count >= target;
            const remaining = Math.max(0, target - count);
            const isWaitingForExtraTap = isDone && !autoAdvance;
            const allDone = effectiveDhikrList.every((d, i) => (dhikrCounts[i] || 0) >= (d.count || 1));

            return (
              <div
                key={idx}
                ref={(el) => {
                  continuousItemRefs.current[idx] = el;
                }}
                onClick={() => handleContinuousCount(idx)}
                className={`liquid-glass-card rounded-3xl p-5 sm:p-7 border transition-all text-right space-y-4 select-none scroll-mt-4 sm:scroll-mt-6 ${
                  isWaitingForExtraTap
                    ? theme.cardBorderWaiting
                    : isDone
                      ? theme.cardBorderDone
                      : focusMode
                        ? `${theme.cardBorderFocus} ${theme.cardBgFocus}`
                        : `${theme.cardBorderNormal} ${theme.cardBgNormal}`
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
                {focusMode ? (
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold ${theme.accentPrimary}`}>
                        {segmentNames[Math.min(segmentCount - 1, Math.floor(idx / segmentSize))]}
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-xs text-slate-400 font-medium">
                        الذكر {idx + 1} من {totalDhikrs}
                      </span>
                      {cycleMuawwidhat && muawwidhatGroup && (idx === muawwidhatGroup.ikhlasIndex || idx === muawwidhatGroup.falaqIndex || idx === muawwidhatGroup.nasIndex) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                          🔄 دورة متناوبة
                        </span>
                      )}
                      {isTahlilDhikr(item) && (
                        <div className="inline-flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 text-xs select-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTahlilCount(10);
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              tahlilCount === 10
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            10 مرات
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTahlilCount(100);
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              tahlilCount === 100
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            100 مرة
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-400">
                      {count} / {target}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.badgeClass}`}>
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
                      {isTahlilDhikr(item) && (
                        <div className="inline-flex items-center p-0.5 rounded-full bg-white/5 border border-white/10 text-xs select-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTahlilCount(10);
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              tahlilCount === 10
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            10 مرات (ميسر)
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTahlilCount(100);
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              tahlilCount === 100
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            100 مرة
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-400">
                      الهدف: {target}
                    </span>
                  </div>
                )}

                {/* Paragraphs */}
                <div className="space-y-3 py-1">
                  {item.paragraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      className="dhikr-text text-right leading-[2.2] transition-all duration-200 font-['Tajawal']"
                      style={{
                        color: theme.arabicTextColor,
                        fontSize: fontSizeMultiplier === 1.2 ? '1.45rem' : fontSizeMultiplier === 0.9 ? '1.1rem' : '1.25rem',
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Virtue / Reference */}
                {focusMode ? (
                  (item.description || item.reference) && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={(e) => toggleContinuousTadabbur(idx, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium ${theme.tadabburButtonFocus} transition-all cursor-pointer`}
                      >
                        <span>تدبّر والمعنى</span>
                        {expandedContinuousTadabbur[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {expandedContinuousTadabbur[idx] && (
                        <div className={`mt-2.5 p-3.5 rounded-2xl ${theme.tadabburDrawerFocus} text-xs leading-relaxed text-right space-y-1.5 animate-in fade-in zoom-in-95 duration-150`}>
                          {item.description && (
                            <div>
                              <span className="font-bold text-white">المعنى والفضل: </span>
                              <span className="text-slate-200">{item.description}</span>
                            </div>
                          )}
                          {item.reference && (
                            <p className="text-[10px] opacity-70 pt-1 border-t border-white/10">
                              {item.reference}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <>
                    {item.description && (
                      <div className={`p-3 rounded-2xl ${theme.tadabburDrawerNormal} text-xs leading-relaxed`}>
                        <span className="font-bold">الفضل: </span>
                        <span>{item.description}</span>
                      </div>
                    )}

                    {item.reference && (
                      <p className="text-[11px] text-slate-500">
                        {item.reference}
                      </p>
                    )}
                  </>
                )}

                {/* Counter control row — explicit button only, scrolling never increments */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-xs font-bold">
                    {isDone ? (
                      <span className={`${theme.completedText} flex items-center gap-1`}>
                        <Check className="w-4 h-4" /> مكتمل ({target}/{target})
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        متبقي: <strong className={`${theme.accentPrimary} font-mono text-sm`}>{remaining}</strong> من {target}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Reset Button for this dhikr */}
                    <button
                      type="button"
                      onClick={(e) => handleResetDhikr(idx, e)}
                      disabled={count === 0}
                      className={`p-2.5 rounded-2xl liquid-glass-pill transition-all select-none shrink-0 ${
                        count > 0
                          ? 'text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 cursor-pointer active:scale-95'
                          : 'text-slate-600 opacity-25 cursor-not-allowed border border-transparent'
                      }`}
                      title={count > 0 ? 'إعادة ضبط عداد هذا الذكر' : 'العداد عند الصفر'}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinuousCount(idx);
                      }}
                      disabled={isDone && !isWaitingForExtraTap && idx >= totalDhikrs - 1}
                      className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer select-none ${
                        isWaitingForExtraTap
                          ? `${theme.accentGradient} ${theme.accentRingWaiting} active:scale-95 animate-pulse`
                          : isDone
                            ? theme.completedBadge
                            : `${focusMode ? theme.accentGradientFocus : theme.accentGradient} active:scale-95 hover:brightness-110`
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
              </div>
            );
          })}

          {/* Bottom Session Completion Button for Continuous View */}
          <div className="pt-6 pb-12 text-center">
            <button
              type="button"
              onClick={handleFinishSession}
              className={`w-full max-w-sm mx-auto py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 ${theme.accentPrimary} font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2`}
            >
              <Check className={`w-4 h-4 ${theme.completedText}`} />
              <span>إنهاء وختام الجلسة 🤍</span>
            </button>
          </div>
        </main>
      )}

      {/* Session Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="w-full max-w-lg max-h-[88vh] rounded-3xl bg-[#0d1322]/98 border border-white/15 shadow-2xl flex flex-col overflow-hidden text-right font-['Tajawal'] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/10 shrink-0 bg-white/[0.02]">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight">إعدادات جلسة الأذكار</h3>
                    <p className="text-[11px] text-slate-400">تخصيص أسلوب القراءة والتكرار والواجهة</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 rounded-2xl liquid-glass-pill text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Category Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setSettingsTab('dhikr')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settingsTab === 'dhikr'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>📿</span>
                  <span>الورد والعدد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('display')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settingsTab === 'display'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>🎨</span>
                  <span>العرض والتجربة</span>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 no-scrollbar">
              {settingsTab === 'dhikr' ? (
                <>
                  {/* Advance Mode Section */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">الانتقال بعد اكتمال العداد:</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/25">
                        {!autoAdvance ? 'يدوي بتأكيد' : 'تلقائي فوري'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleAutoAdvance(false)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 select-none ${
                          !autoAdvance
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 shadow-md shadow-emerald-500/10'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">ضغطة إضافية</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">موصى به</span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-relaxed">يبقى الذكر أمامك حتى تضغط للمتابعة براحتك</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAutoAdvance(true)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 select-none ${
                          autoAdvance
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 shadow-md shadow-emerald-500/10'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white">انتقال فوري</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-bold">سريع</span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-relaxed">ينتقل للذكر التالي فور اكتمال العدد</span>
                      </button>
                    </div>
                  </div>

                  {/* Tahlil count */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <div className="text-xs font-bold text-slate-200">
                          تكرار التهليل (لا إله إلا الله...)
                        </div>
                        <p className="text-[10px] text-slate-400">
                          الذكر الختامي المائة
                        </p>
                      </div>
                      <div className="inline-flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 text-xs select-none">
                        <button
                          type="button"
                          onClick={() => handleToggleTahlilCount(10)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                            tahlilCount === 10 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          10 مرات (سنة ميسرة)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleTahlilCount(100)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                            tahlilCount === 100 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          100 مرة (الأصل)
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                      10 مرات سنة ميسرة ثابتة في الصباح والمساء في سنن أبي داود والنسائي، و100 مرة لمن اتسع وقته.
                    </p>
                  </div>

                  {/* Istighfar inclusion */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200">
                        إدراج الاستغفار اليومي (100 مرة)
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        يمكنك استبعاده من الجلسة لتخفيف وقت الورد وقراءته في أي وقت آخر من اليوم.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={includeIstighfar}
                      onClick={() => handleToggleIncludeIstighfar(!includeIstighfar)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
                        includeIstighfar ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' : 'bg-white/10 border border-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-md ${
                          includeIstighfar ? 'right-[2px] bg-slate-950' : 'right-[26px] bg-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Muawwidhat Alternating Cycle */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">
                          قراءة المعوذتين والإخلاص بالتناوب
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">دورة دورة</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        الإخلاص ثم الفلق ثم الناس وتكرارها 3 مرات (السنة النبوية)، بدلاً من تكرار كل سورة 3 مرات متتالية.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={cycleMuawwidhat}
                      onClick={() => handleToggleCycleMuawwidhat(!cycleMuawwidhat)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
                        cycleMuawwidhat ? 'bg-cyan-500 shadow-md shadow-cyan-500/20' : 'bg-white/10 border border-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-md ${
                          cycleMuawwidhat ? 'right-[2px] bg-slate-950' : 'right-[26px] bg-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Theme Picker Setting Option */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎨</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200">مظهر جلسة الأذكار</div>
                          <p className="text-[10px] text-slate-400">اختر الأجواء التي تساعدك على القراءة بهدوء.</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badgeClass}`}>
                        {theme.icon} {theme.nameArabic}
                      </span>
                    </div>

                    {/* Theme Grid Cards */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {(Object.keys(DHIKR_THEMES) as DhikrThemeId[]).map((thId) => {
                        const th = DHIKR_THEMES[thId];
                        const isSelected = sessionTheme === thId;

                        return (
                          <button
                            key={thId}
                            type="button"
                            onClick={() => handleSelectTheme(thId)}
                            className={`group relative p-2.5 sm:p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 overflow-hidden select-none ${
                              isSelected
                                ? 'border-white/60 ring-2 ring-white/30 shadow-lg scale-[1.02]'
                                : 'border-white/10 hover:border-white/25 hover:scale-[1.01]'
                            }`}
                            style={{ backgroundColor: th.preview.bgHex }}
                          >
                            {/* Mini Dhikr Card simulation inside preview */}
                            <div
                              className="p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between h-18 transition-all"
                              style={{
                                backgroundColor: th.preview.cardBgHex,
                                borderColor: `${th.preview.borderHex}40`,
                              }}
                            >
                              {/* Mini badge & dot */}
                              <div className="flex items-center justify-between">
                                <div
                                  className="w-2 h-2 rounded-full shadow-sm"
                                  style={{ backgroundColor: th.preview.accentHex }}
                                />
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                                  style={{
                                    backgroundColor: `${th.preview.accentHex}20`,
                                    color: th.preview.accentHex,
                                  }}
                                >
                                  {th.icon}
                                </span>
                              </div>

                              {/* Sample Arabic Dhikr line */}
                              <div
                                className="text-[11px] font-['Tajawal'] font-bold text-center leading-snug truncate"
                                style={{ color: th.preview.textHex }}
                              >
                                {th.preview.sampleSnippet}
                              </div>

                              {/* Mini Counter bar */}
                              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: '65%',
                                    backgroundColor: th.preview.accentHex,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Theme Name & Subtitle */}
                            <div className="flex items-center justify-between pt-0.5">
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-white block leading-tight">
                                  {th.nameArabic}
                                </span>
                                <span className="text-[9px] text-slate-400 block truncate">
                                  {th.subtitleArabic}
                                </span>
                              </div>
                              {isSelected && (
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm"
                                  style={{ backgroundColor: th.preview.accentHex }}
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Focus Mode Card */}
                  <div className={`p-4 rounded-2xl ${theme.cardBgFocus} ${theme.cardBorderFocus} border space-y-2.5`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">🧘</span>
                        <div>
                          <div className={`text-xs font-bold ${theme.accentPrimary}`}>
                            وضع التركيز
                          </div>
                          <span className={`text-[10px] ${theme.secondaryTextColor} font-medium`}>تجربة أكثر هدوءًا وأقل تشتيتًا.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={focusMode}
                        onClick={() => handleToggleFocusMode(!focusMode)}
                        className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
                          focusMode ? `${theme.accentGradient} shadow-md` : 'bg-white/10 border border-white/15'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-md ${
                            focusMode ? 'right-[2px] bg-slate-950' : 'right-[26px] bg-slate-400'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed border-t border-white/10 pt-2">
                      يخفي الزخارف والمشتتات، ويقسم الأذكار لمحطات تدبرية قصيرة، ويجعل نص الذكر هو البطل الأساسي مع إظهار المعاني والفضائل عند الطلب فقط.
                    </p>
                  </div>

                  {/* Continuous Auto-Scroll */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200">
                        التمرير التلقائي (القراءة المتواصلة)
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        تمرير الشاشة بنعومة وتلقائية إلى الذكر التالي فور اكتمال عدد الذكر الحالي.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={continuousAutoScroll}
                      onClick={() => handleToggleContinuousAutoScroll(!continuousAutoScroll)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
                        continuousAutoScroll ? `${theme.accentGradient} shadow-md` : 'bg-white/10 border border-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-md ${
                          continuousAutoScroll ? 'right-[2px] bg-slate-950' : 'right-[26px] bg-slate-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sound Toggle */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">
                          أصوات التفاعل والنقر
                        </span>
                        {soundEnabled ? <Volume2 className={`w-3.5 h-3.5 ${theme.accentPrimary}`} /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        نبض صوتي خفيف عند كل نقرة للعد، ونغمة إنجاز هادئة عند ختام الجلسة.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={soundEnabled}
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${
                        soundEnabled ? `${theme.accentGradient} shadow-md` : 'bg-white/10 border border-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200 shadow-md ${
                          soundEnabled ? 'right-[2px] bg-slate-950' : 'right-[26px] bg-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-white/10 shrink-0 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className={`w-full py-3 px-4 rounded-2xl ${theme.accentGradient} text-slate-950 font-black text-xs shadow-lg active:scale-98 hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>تم وحفظ الإعدادات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border-white/15 text-center font-['Tajawal'] space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-2xl shadow-inner">
              🤍
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">الحمد لله 🤍</h3>
              <p className={`text-sm ${theme.accentPrimary} font-bold mt-1`}>أتممت {title}</p>
            </div>

            {/* Stats: Count & Duration */}
            <div className="grid grid-cols-2 gap-3 my-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className={`text-lg font-black ${theme.accentPrimary}`}>{totalDhikrs}</div>
                <div className="text-[11px] text-slate-400">إجمالي الأذكار</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className={`text-lg font-black ${theme.accentPrimary}`}>
                  {Math.round((Date.now() - startTimeRef.current) / 1000) < 60
                    ? `${Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))} ثانية`
                    : `${Math.round((Date.now() - startTimeRef.current) / 60000)} دقيقة`}
                </div>
                <div className="text-[11px] text-slate-400">المدة المستغرقة</div>
              </div>
            </div>

            {/* Reflection / Companion Dhikr (ذكر رافقني اليوم) */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-right space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                  <span>ذكر رافق قلبك اليوم</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCompanionPicker((prev) => !prev)}
                  className={`text-[11px] ${theme.accentPrimary} hover:opacity-80 underline cursor-pointer`}
                >
                  {selectedCompanionDhikr !== null ? 'تغيير الذكر' : 'اختر ذكرًا'}
                </button>
              </div>

              {selectedCompanionDhikr !== null && effectiveDhikrList[selectedCompanionDhikr] ? (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-slate-200 leading-relaxed">
                  <p className="font-semibold line-clamp-3">
                    « {effectiveDhikrList[selectedCompanionDhikr].text} »
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  هل استوقفك ذكر في هذه الجلسة وتود استصحابه في يومك؟
                </p>
              )}

              {/* Companion Picker Dropdown / List */}
              {showCompanionPicker && (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pt-2 border-t border-white/10 no-scrollbar">
                  {effectiveDhikrList.map((d, dIdx) => (
                    <button
                      key={dIdx}
                      type="button"
                      onClick={() => {
                        handleSelectCompanionDhikr(dIdx);
                        setShowCompanionPicker(false);
                      }}
                      className={`w-full text-right p-2 rounded-xl text-xs transition-all flex items-start gap-2 cursor-pointer ${
                        selectedCompanionDhikr === dIdx
                          ? `${theme.badgeClass} font-bold border`
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">#{dIdx + 1}</span>
                      <span className="truncate">{d.text}</span>
                    </button>
                  ))}
                  {selectedCompanionDhikr !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectCompanionDhikr(null);
                        setShowCompanionPicker(false);
                      }}
                      className="w-full text-center py-1 text-[11px] text-slate-500 hover:text-slate-300"
                    >
                      إلغاء التحديد
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className={`w-full py-3 px-6 rounded-2xl ${theme.accentGradient} text-slate-950 font-black text-sm shadow-lg hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer`}
            >
              إنهاء
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
