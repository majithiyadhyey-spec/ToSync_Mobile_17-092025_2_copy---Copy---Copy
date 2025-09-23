import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

type ClockState = 'out' | 'in' | 'on_break';

const DailyAttendancePage: React.FC = () => {
    const { t } = useI18n();
    const { currentUser } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [clockState, setClockState] = useState<ClockState>('out');
    const [startTime, setStartTime] = useState<Date | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleDayStart = () => {
        setClockState('in');
        setStartTime(new Date());
    };

    const handleBreakStart = () => setClockState('on_break');
    const handleBreakEnd = () => setClockState('in');
    const handleDayEnd = () => {
        setClockState('out');
        setStartTime(null);
    };
    
    const buttonBaseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100";
    const dayStartClasses = "bg-blue-600 text-white hover:bg-blue-700";
    const dayEndClasses = "bg-red-600 text-white hover:bg-red-700";
    const breakClasses = "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500";


    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('daily_attendance')}</h1>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <button className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">My Att. Details</button>
                    <button className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">My Team's Details</button>
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-8">
                <div>
                    <p className="text-gray-600 dark:text-gray-400">{t('employee')}: <span className="font-semibold text-gray-800 dark:text-gray-200">{currentUser?.name}</span></p>
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
                        <button onClick={handleDayStart} disabled={clockState !== 'out'} className={`${buttonBaseClasses} ${dayStartClasses}`}>
                            {t('day_start')}
                        </button>
                         <button onClick={handleBreakStart} disabled={clockState !== 'in'} className={`${buttonBaseClasses} ${breakClasses}`}>
                            {t('break_start')}
                        </button>
                        <button onClick={handleDayEnd} disabled={clockState !== 'in'} className={`${buttonBaseClasses} ${dayEndClasses}`}>
                            {t('day_end')}
                        </button>
                         <button onClick={handleBreakEnd} disabled={clockState !== 'on_break'} className={`${buttonBaseClasses} ${breakClasses}`}>
                            {t('break_end')}
                        </button>
                    </div>
                    
                    {startTime && (
                         <div className="text-3xl font-mono font-bold text-green-600 dark:text-green-400 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                            {startTime.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-start">
                <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">{t('cancel')}</button>
            </div>
        </div>
    );
};

export default DailyAttendancePage;
