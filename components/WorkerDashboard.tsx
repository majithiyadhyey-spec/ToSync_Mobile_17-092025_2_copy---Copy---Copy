

import React, { useMemo, useState } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { User, TaskStatus } from '../types';
import WorkerTaskList from './WorkerTaskList';
import { useI18n } from '../context/I18nContext';
import { getTaskCompletionDate } from '../utils/dateUtils';

type WorkerActiveView = 'work/planned' | 'work/active' | 'work/finished';

interface WorkerDashboardProps {
    worker: User;
    activeView: WorkerActiveView;
}

const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ worker, activeView }) => {
  const { getTasksByWorkerId } = useFormworkData();
  const { t } = useI18n();
  const [filters, setFilters] = useState({ year: 'all', month: 'all', day: 'all' });

  const allWorkerTasks = useMemo(() => getTasksByWorkerId(worker.id), [worker.id, getTasksByWorkerId]);
  
  const finishedTasks = useMemo(() => {
    return allWorkerTasks.filter(t => t.status === TaskStatus.Completed);
  }, [allWorkerTasks]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    finishedTasks.forEach(task => {
      const completionDate = getTaskCompletionDate(task);
      if (completionDate) {
        years.add(new Date(completionDate).getUTCFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [finishedTasks]);

  const workerTasks = useMemo(() => {
    switch(activeView) {
        case 'work/planned':
            return allWorkerTasks.filter(t => t.status === TaskStatus.Planned);
        case 'work/active':
            return allWorkerTasks.filter(t => t.status === TaskStatus.InProgress);
        case 'work/finished':
            return finishedTasks.filter(task => {
              const completionDateStr = getTaskCompletionDate(task);
              if (!completionDateStr) return false;

              const completionDate = new Date(completionDateStr);
              const yearMatch = filters.year === 'all' || completionDate.getUTCFullYear() === parseInt(filters.year, 10);
              const monthMatch = filters.month === 'all' || (completionDate.getUTCMonth() + 1) === parseInt(filters.month, 10);
              const dayMatch = filters.day === 'all' || completionDate.getUTCDate() === parseInt(filters.day, 10);

              return yearMatch && monthMatch && dayMatch;
            }).sort((a, b) => {
                const dateA = getTaskCompletionDate(a);
                const dateB = getTaskCompletionDate(b);
                if (dateA && dateB) {
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                }
                return 0;
            });
        default:
            return allWorkerTasks;
    }
  }, [allWorkerTasks, finishedTasks, activeView, filters]);

  const handleFilterChange = (filterName: 'year' | 'month' | 'day', value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const selectClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";


  return (
    <div className="space-y-6">
      {activeView === 'work/finished' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} className={selectClasses} aria-label={t('filter_by_year')}>
                    <option value="all">{t('all_years')}</option>
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select value={filters.month} onChange={(e) => handleFilterChange('month', e.target.value)} className={selectClasses} aria-label={t('filter_by_month')}>
                    <option value="all">{t('all_months')}</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => <option key={month} value={month}>{new Date(0, month - 1).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
                <select value={filters.day} onChange={(e) => handleFilterChange('day', e.target.value)} className={selectClasses} aria-label={t('filter_by_day')}>
                    <option value="all">{t('all_days')}</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}</option>)}
                </select>
                <button onClick={() => setFilters({ year: 'all', month: 'all', day: 'all' })} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 text-sm rounded-lg p-2.5">
                    {t('reports_clearFilters')}
                </button>
            </div>
        </div>
      )}
      <WorkerTaskList tasks={workerTasks} worker={worker} />
    </div>
  );
};

export default WorkerDashboard;