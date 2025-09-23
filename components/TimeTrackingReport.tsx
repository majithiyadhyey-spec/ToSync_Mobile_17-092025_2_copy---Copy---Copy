import React, { useState, useMemo } from 'react';
import { Project, Task, User } from '../types';
import { useI18n } from '../context/I18nContext';
import { formatSecondsToHHMMSS } from '../utils/dateUtils';
import ClockIcon from './icons/ClockIcon';
import { useFormworkData } from '../context/FormworkDataContext';

interface TimeTrackingReportProps {
    projects: Project[];
    tasks: Task[];
}

const TimeTrackingReport: React.FC<TimeTrackingReportProps> = ({ projects, tasks }) => {
    const { t, formatDate } = useI18n();
    const { users } = useFormworkData();
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('all');

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        projects.forEach(p => years.add(new Date(p.startDate).getUTCFullYear().toString()));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [projects]);
    
    const projectsForSelectedYear = useMemo(() => {
        if (selectedYear === 'all') {
            return projects.sort((a, b) => a.name.localeCompare(b.name));
        }
        return projects
            .filter(p => new Date(p.startDate).getUTCFullYear().toString() === selectedYear)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [projects, selectedYear]);


    const projectTotalTimes = useMemo(() => {
        const totals: Record<string, number> = {};
        projects.forEach(p => {
            totals[p.id] = tasks
                .filter(t => t.projectId === p.id)
                .reduce((projectSum, task) => {
                    const taskTotal = Object.values(task.dailyTimeSpent || {}).reduce((workerAcc, dailyTimes) => {
                        return workerAcc + Object.values(dailyTimes).reduce((dayAcc, record) => dayAcc + record.time, 0);
                    }, 0);
                    return projectSum + taskTotal;
                }, 0);
        });
        return totals;
    }, [projects, tasks]);

    const tasksForSelectedProject = useMemo(() => {
        if (selectedProjectId === 'all') return [];
        return tasks
            .filter(t => t.projectId === selectedProjectId)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [tasks, selectedProjectId]);

    const taskTotalTimes = useMemo(() => {
        const totals: Record<string, number> = {};
        tasksForSelectedProject.forEach(task => {
            totals[task.id] = Object.values(task.dailyTimeSpent || {}).reduce((workerAcc, dailyTimes) => {
                return workerAcc + Object.values(dailyTimes).reduce((dayAcc, record) => dayAcc + record.time, 0);
            }, 0);
        });
        return totals;
    }, [tasksForSelectedProject]);

    const workerTimeForSelectedTask = useMemo(() => {
        if (selectedTaskId === 'all' || selectedProjectId === 'all') return null;
        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return null;

        const breakdown: { workerId: string; workerName: string; date: string; timeSpent: number; notes?: string }[] = [];
        let totalTime = 0;

        if (task.dailyTimeSpent) {
            for (const workerId in task.dailyTimeSpent) {
                const worker = users.find(w => w.id === workerId);
                const dailyRecords = task.dailyTimeSpent[workerId];
                for (const date in dailyRecords) {
                    const record = dailyRecords[date];
                    if (record.time > 0) {
                        breakdown.push({
                            workerId: workerId,
                            workerName: worker?.name || 'Unknown Worker',
                            date: date,
                            timeSpent: record.time,
                            notes: record.notes,
                        });
                        totalTime += record.time;
                    }
                }
            }
        }
        
        breakdown.sort((a, b) => b.date.localeCompare(a.date) || a.workerName.localeCompare(b.workerName));
        
        return { breakdown, totalTime };
    }, [selectedTaskId, selectedProjectId, tasks, users]);

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedYear(e.target.value);
        setSelectedProjectId('all');
        setSelectedTaskId('all');
    };

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProjectId(e.target.value);
        setSelectedTaskId('all');
    };

    const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTaskId(e.target.value);
    };

    const hasAnyTimeTrackedData = useMemo(() => {
        return tasks.some(t => t.dailyTimeSpent && Object.values(t.dailyTimeSpent).some(workerTimes => Object.values(workerTimes).some(record => record.time > 0)));
    }, [tasks]);

    const selectClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mt-8">
            <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-7 h-7 text-blue-500"/>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('timeTrackingReport_title')}</h3>
            </div>
            
            {!hasAnyTimeTrackedData ? (
                <p className="text-gray-500 dark:text-gray-400">{t('timeTrackingReport_noData')}</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label htmlFor="year-filter" className="sr-only">{t('timeTrackingReport_selectYear')}</label>
                            <select
                                id="year-filter"
                                value={selectedYear}
                                onChange={handleYearChange}
                                className={selectClasses}
                            >
                                <option value="all">{t('timeTrackingReport_allYears')}</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="project-filter" className="sr-only">{t('timeTrackingReport_selectProject')}</label>
                            <select
                                id="project-filter"
                                value={selectedProjectId}
                                onChange={handleProjectChange}
                                className={selectClasses}
                            >
                                <option value="all">{t('timeTrackingReport_selectProject')}</option>
                                {projectsForSelectedYear.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {`${p.name} (${t('timeTrackingReport_total')}: ${formatSecondsToHHMMSS(projectTotalTimes[p.id] || 0)})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="task-filter" className="sr-only">{t('timeTrackingReport_selectTask')}</label>
                            <select
                                id="task-filter"
                                value={selectedTaskId}
                                onChange={handleTaskChange}
                                className={selectClasses}
                                disabled={tasksForSelectedProject.length === 0 || selectedProjectId === 'all'}
                            >
                                <option value="all">{t('timeTrackingReport_selectTask')}</option>
                                {tasksForSelectedProject.map(task => (
                                    <option key={task.id} value={task.id}>
                                        {`${task.name} (${t('timeTrackingReport_total')}: ${formatSecondsToHHMMSS(taskTotalTimes[task.id] || 0)})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {workerTimeForSelectedTask && workerTimeForSelectedTask.breakdown.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                                <thead className="hidden md:table-header-group text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">{t('reports_workerName')}</th>
                                        <th scope="col" className="px-6 py-3">{t('timeTrackingReport_date')}</th>
                                        <th scope="col" className="px-6 py-3 text-right">{t('timeTrackingReport_timeSpent')}</th>
                                    </tr>
                                </thead>
                                <tbody className="block md:table-row-group">
                                    {workerTimeForSelectedTask.breakdown.map((item, index) => {
                                      const hasNotes = !!item.notes;
                                      return (
                                        <React.Fragment key={index}>
                                            <tr className={`block md:table-row bg-white dark:bg-gray-800 ${hasNotes ? 'rounded-t-lg md:rounded-t-none' : 'rounded-lg md:rounded-none mb-4 md:mb-0'} shadow-md md:shadow-none ${hasNotes ? '' : 'md:border-b md:dark:border-gray-700'}`}>
                                                <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 md:font-medium text-gray-900 dark:text-white border-b md:border-none dark:border-gray-700">
                                                    <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('reports_workerName')}</span>
                                                    <span className="text-right">{item.workerName}</span>
                                                </td>
                                                <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 border-b md:border-none dark:border-gray-700">
                                                    <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('timeTrackingReport_date')}</span>
                                                    <span className="text-right">{formatDate(item.date)}</span>
                                                </td>
                                                <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 text-right text-gray-800 dark:text-gray-200">
                                                    <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('timeTrackingReport_timeSpent')}</span>
                                                    <span className="font-mono">{formatSecondsToHHMMSS(item.timeSpent)}</span>
                                                </td>
                                            </tr>
                                            {hasNotes && (
                                                <tr className="block md:table-row mb-4 md:mb-0 bg-white dark:bg-gray-800 rounded-b-lg md:rounded-none shadow-md md:shadow-none md:border-b md:dark:border-gray-700">
                                                    <td colSpan={3} className="px-4 pb-4 md:px-6 md:py-3">
                                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm text-gray-600 dark:text-gray-400">
                                                            <p className="font-semibold mb-1 text-gray-700 dark:text-gray-300">{t('timeTrackingReport_notes')}</p>
                                                            <p className="text-xs italic">{item.notes}</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                      );
                                    })}
                                </tbody>
                                <tfoot className="block md:table-footer-group">
                                    <tr className="font-bold bg-gray-50 dark:bg-gray-700/50 block md:table-row rounded-b-lg md:rounded-none">
                                        <td colSpan={2} className="hidden md:table-cell px-6 py-3 text-gray-900 dark:text-white">{t('timeTrackingReport_total')}</td>
                                        <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-3 md:text-right text-gray-900 dark:text-white">
                                            <span className="font-bold text-sm uppercase">{t('timeTrackingReport_total')}</span>
                                            <span className="font-mono">{formatSecondsToHHMMSS(workerTimeForSelectedTask.totalTime)}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            {selectedProjectId !== 'all' && tasksForSelectedProject.length === 0 
                                ? <p>{t('timeTrackingReport_noTasksInProject')}</p>
                                : <p>{t('timeTrackingReport_prompt')}</p>
                            }
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TimeTrackingReport;