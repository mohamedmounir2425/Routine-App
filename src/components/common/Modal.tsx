import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  showCloseButton = true,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus management & Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Basic Tab focus trap containment
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Initial focus on first input or container
    const focusTimer = setTimeout(() => {
      if (dialogRef.current) {
        const firstInput = dialogRef.current.querySelector<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        );
        if (firstInput) {
          firstInput.focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen) return null;

  // Render modal content
  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-accessible-title' : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidth} liquid-glass-card rounded-3xl border border-white/15 shadow-2xl text-right text-slate-100 font-['Tajawal'] max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden focus:outline-none ${className}`}
      >
        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
            {title ? (
              <div id="modal-accessible-title" className="text-base sm:text-lg font-black text-white">
                {title}
              </div>
            ) : (
              <div />
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق النافذة"
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(modalContent, document.body);
};
