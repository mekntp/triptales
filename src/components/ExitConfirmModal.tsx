import React, { useEffect, useRef } from 'react';
import { LogOut, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ExitConfirmModalProps {
  isOpen: boolean;
  hasUnsavedChanges?: boolean;
  onStay: () => void;
  onExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  hasUnsavedChanges = false,
  onStay,
  onExit,
}) => {
  const { t } = useLanguage();
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus stay button by default for safety
      setTimeout(() => stayButtonRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onStay();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      aria-describedby="exit-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
          <LogOut className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 id="exit-modal-title" className="text-lg font-black text-slate-800">
            {t('exitTitle')}
          </h3>
          <p id="exit-modal-desc" className="text-xs text-slate-500 leading-relaxed">
            {t('exitDesc')}
          </p>
        </div>

        {/* Unsaved changes warning if applicable */}
        {hasUnsavedChanges && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-rose-800 text-left text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{t('exitUnsavedWarning')}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {/* Stay (Primary) */}
          <button
            ref={stayButtonRef}
            onClick={onStay}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('exitStay')}</span>
          </button>

          {/* Exit (Secondary) */}
          <button
            onClick={onExit}
            className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>{t('exitConfirm')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
