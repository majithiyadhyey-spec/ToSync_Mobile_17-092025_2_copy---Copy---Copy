import React from 'react';
import DatabaseIcon from './icons/DatabaseIcon';
import { useI18n } from '../context/I18nContext';

const RestoringOverlay: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col justify-center items-center z-[100]" aria-live="assertive" role="alert">
            <DatabaseIcon className="w-16 h-16 text-white animate-spin" style={{ animationDuration: '2s' }} />
            <h2 className="text-2xl font-bold text-white mt-6">{t('restoring_title')}</h2>
            <p className="text-gray-300 mt-2 text-center max-w-sm px-4">{t('restoring_message')}</p>
        </div>
    );
};
export default RestoringOverlay;