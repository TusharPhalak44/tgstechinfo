import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, Mail, X } from 'lucide-react';

const FeedbackModalContext = createContext({
  showModal: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  closeModal: () => {}
});

export const FeedbackModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'error' | 'info' | 'warning'
    title: '',
    message: '',
    buttonText: 'OK',
    onClose: null
  });

  const closeModal = useCallback(() => {
    if (modalState.onClose && typeof modalState.onClose === 'function') {
      try {
        modalState.onClose();
      } catch (err) {
        console.error('FeedbackModal onClose error:', err);
      }
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, [modalState]);

  const showModal = useCallback(({
    type = 'success',
    title = '',
    message = '',
    buttonText = 'OK',
    onClose = null
  }) => {
    setModalState({
      isOpen: true,
      type,
      title: title || (type === 'success' ? 'Success!' : type === 'error' ? 'Notice' : 'Information'),
      message: message || '',
      buttonText: buttonText || 'OK',
      onClose
    });
  }, []);

  const showSuccess = useCallback((title, message, onClose) => {
    showModal({ type: 'success', title, message, onClose });
  }, [showModal]);

  const showError = useCallback((title, message, onClose) => {
    showModal({ type: 'error', title, message, onClose });
  }, [showModal]);

  const showInfo = useCallback((title, message, onClose) => {
    showModal({ type: 'info', title, message, onClose });
  }, [showModal]);

  // Handle Escape and Enter key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modalState.isOpen) return;
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState.isOpen, closeModal]);

  return (
    <FeedbackModalContext.Provider
      value={{
        showModal,
        showSuccess,
        showError,
        showInfo,
        closeModal
      }}
    >
      {children}

      <AnimatePresence>
        {modalState.isOpen && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl border text-center overflow-hidden"
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                borderColor: 'var(--color-border, #e2e8f0)',
                color: 'var(--color-heading, #0f172a)'
              }}
            >
              {/* Colored top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{
                  background:
                    modalState.type === 'success'
                      ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                      : modalState.type === 'error'
                      ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(90deg, #0AAEEF 0%, #4a7cff 100%)'
                }}
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Center Status Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-md">
                {modalState.type === 'success' ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : modalState.type === 'error' ? (
                  <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                    <Info className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-2 tracking-tight">
                {modalState.title}
              </h3>

              {/* Message */}
              <p
                className="text-sm leading-relaxed mb-6 font-normal whitespace-pre-line"
                style={{ color: 'var(--color-muted, #64748b)' }}
              >
                {modalState.message}
              </p>

              {/* Action Button */}
              <button
                type="button"
                onClick={closeModal}
                className={`w-full py-3 px-6 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-[0.99] ${
                  modalState.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : modalState.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {modalState.buttonText}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FeedbackModalContext.Provider>
  );
};

export const useFeedbackModal = () => useContext(FeedbackModalContext);

