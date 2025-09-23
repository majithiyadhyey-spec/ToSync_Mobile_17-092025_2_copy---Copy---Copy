import React, { useState } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import GlobeAltIcon from './icons/GlobeAltIcon';

const timezones = [
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'America/Toronto',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Pacific/Auckland',
    'Pacific/Honolulu'
];

const TimeZonePage: React.FC = () => {
    const { integrations, updateTimezone } = useFormworkData();
    const { t } = useI18n();
    const [selectedTimezone, setSelectedTimezone] = useState(integrations.timezone);
    const [feedback, setFeedback] = useState('');

    const handleSave = () => {
        updateTimezone(selectedTimezone);
        setFeedback('Timezone settings saved successfully!');
        setTimeout(() => setFeedback(''), 3000);
    };

    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
    const selectClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <GlobeAltIcon className="w-7 h-7 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('timeZone_title')}</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('timeZone_description')}</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="timezone-select" className={labelClasses}>{t('timeZone_label')}</label>
                    <select
                        id="timezone-select"
                        value={selectedTimezone}
                        onChange={(e) => setSelectedTimezone(e.target.value)}
                        className={selectClasses}
                    >
                        {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                
                <div className="h-6 text-center">
                    {feedback && <p className="text-sm text-green-600 dark:text-green-400">{feedback}</p>}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors text-sm"
                    >
                        {t('saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeZonePage;