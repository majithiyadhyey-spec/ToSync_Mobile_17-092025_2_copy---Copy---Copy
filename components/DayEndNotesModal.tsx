import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import XIcon from './icons/XIcon';
import TasksIcon from './icons/TasksIcon';

interface DayEndNotesModalProps {
  taskName: string;
  onClose: () => void;
  onSubmit: (notes: string) => void;
}

const DayEndNotesModal: React.FC<DayEndNotesModalProps> = ({ taskName, onClose, onSubmit }) => {
  const { t } = useI18n();
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(notes.trim());
  };

  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-400";
  const inputClasses = "mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <TasksIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dayEndNotesModal_title', { taskName })}</h2>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('close')}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dayEndNotesModal_prompt')}</p>
            <div>
              <label htmlFor="daily-notes" className={labelClasses}>{t('dayEndNotesModal_notesLabel')}</label>
              <textarea
                id="daily-notes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClasses} resize-y`}
                autoFocus
              />
            </div>
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-4 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">{t('dayEndNotesModal_submit')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DayEndNotesModal;