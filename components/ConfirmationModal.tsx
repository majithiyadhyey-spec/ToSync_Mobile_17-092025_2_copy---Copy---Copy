import React from 'react';
import { useI18n } from '../context/I18nContext';
import XIcon from './icons/XIcon';

interface ConfirmationModalProps {
  title: string;
  children: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  confirmText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, children, onConfirm, onClose, confirmText, confirmButtonClass }) => {
  const { t } = useI18n();

  const confirmBtnText = confirmText || t('confirmDelete');
  const confirmBtnClass = confirmButtonClass || 'bg-red-600 text-white hover:bg-red-500';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className={`text-xl font-bold ${confirmButtonClass ? 'text-gray-900 dark:text-white' : 'text-red-600'}`}>{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('close')}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 text-gray-700 dark:text-gray-300">
          {children}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('cancel')}</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-md transition ${confirmBtnClass}`}>{confirmBtnText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;