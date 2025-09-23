
import React from 'react';
import { useI18n } from '../context/I18nContext';
import XIcon from './icons/XIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface ScanResultModalProps {
  data: string;
  onClose: () => void;
}

const ScanResultModal: React.FC<ScanResultModalProps> = ({ data, onClose }) => {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('scanResultModal_title')}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('close')}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('scanResultModal_dataLabel')}</label>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
            <pre className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap break-all"><code>{data}</code></pre>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg flex justify-end">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">
              {t('done')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScanResultModal;
