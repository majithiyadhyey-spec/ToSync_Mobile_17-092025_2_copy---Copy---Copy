import React from 'react';
import { useI18n } from '../../../context/I18nContext';
import InventoryIcon from '../../icons/InventoryIcon';

const InventoryManagement: React.FC = () => {
    const { t } = useI18n();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 p-12">
                <InventoryIcon className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('coming_soon')}</h2>
                <p className="mt-2 max-w-md">{t('coming_soon_desc')}</p>
            </div>
        </div>
    );
};

export default InventoryManagement;