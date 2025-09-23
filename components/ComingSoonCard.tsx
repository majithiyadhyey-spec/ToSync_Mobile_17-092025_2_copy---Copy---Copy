import React from 'react';
import { useI18n } from '../context/I18nContext';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';

const ComingSoonCard: React.FC = () => {
    const { t } = useI18n();

    return (
        <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full animate-fade-in">
            <WrenchScrewdriverIcon className="w-20 h-20 text-gray-400 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('coming_soon')}</h2>
            <p className="mt-2 max-w-md">{t('coming_soon_desc')}</p>
        </div>
    );
};

export default ComingSoonCard;
