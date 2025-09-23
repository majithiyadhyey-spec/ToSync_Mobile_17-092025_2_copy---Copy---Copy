import React, { useState, useMemo } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { TaskStatus } from '../types';
import { useI18n } from '../context/I18nContext';
import CheckCircleIcon from './icons/CheckCircleIcon';
import SearchIcon from './icons/SearchIcon';

const FinishedProjectsPage: React.FC = () => {
  const { activeProjects: projects, activeTasks: tasks } = useFormworkData();
  const { t, formatDate } = useI18n();
  const [filters, setFilters] = useState({ year: 'all', month: 'all', day: 'all' });
  const [searchQuery, setSearchQuery] = useState('');

  const finishedProjects = useMemo(() => {
    const projectsWithStats = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const total = projectTasks.length;
      const completed = projectTasks.filter(t => t.status === TaskStatus.Completed).length;
      return { ...project, isFinished: total > 0 && total === completed };
    });
    return projectsWithStats.filter(p => p.isFinished);
  }, [projects, tasks]);
  
  const availableYears = useMemo(() => {
      const years = new Set(finishedProjects.map(p => new Date(p.endDate).getUTCFullYear()));
      return Array.from(years).sort((a,b) => b - a);
  }, [finishedProjects]);

  const filteredProjects = useMemo(() => {
    let finalProjects = finishedProjects;

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        finalProjects = finalProjects.filter(p => 
            p.name.toLowerCase().includes(lowercasedQuery) ||
            p.client.toLowerCase().includes(lowercasedQuery) ||
            p.marking.toLowerCase().includes(lowercasedQuery)
        );
    }
      
    finalProjects = finalProjects.filter(p => {
      const endDate = new Date(p.endDate);
      const yearMatch = filters.year === 'all' || endDate.getUTCFullYear() === parseInt(filters.year, 10);
      const monthMatch = filters.month === 'all' || (endDate.getUTCMonth() + 1) === parseInt(filters.month, 10);
      const dayMatch = filters.day === 'all' || endDate.getUTCDate() === parseInt(filters.day, 10);
      return yearMatch && monthMatch && dayMatch;
    });

    return finalProjects.sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [finishedProjects, filters, searchQuery]);
  
  const handleFilterChange = (filterName: 'year' | 'month' | 'day', value: string) => {
      setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const selectClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('finished_projects')}</h1>
        <div className="relative w-full sm:max-w-xs">
            <label htmlFor="finished-projects-page-search" className="sr-only">{t('searchProjects')}</label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                id="finished-projects-page-search"
                type="search"
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('searchProjects')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} className={selectClasses} aria-label={t('filter_by_year')}>
                <option value="all">{t('all_years')}</option>
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={filters.month} onChange={(e) => handleFilterChange('month', e.target.value)} className={selectClasses} aria-label={t('filter_by_month')}>
                <option value="all">{t('all_months')}</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(month => <option key={month} value={month}>{new Date(0, month-1).toLocaleString('default', {month: 'long'})}</option>)}
            </select>
             <select value={filters.day} onChange={(e) => handleFilterChange('day', e.target.value)} className={selectClasses} aria-label={t('filter_by_day')}>
                <option value="all">{t('all_days')}</option>
                {Array.from({length: 31}, (_, i) => i + 1).map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <button onClick={() => setFilters({ year: 'all', month: 'all', day: 'all' })} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 text-sm rounded-lg p-2.5">{t('reports_clearFilters')}</button>
          </div>
          
           <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">{t('reports_project')}</th>
                            <th className="px-6 py-3">{t('addProjectModal_client')}</th>
                            <th className="px-6 py-3">{t('addProjectModal_endDate')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProjects.map(project => (
                             <tr key={project.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{project.name}</td>
                                <td className="px-6 py-4">{project.client}</td>
                                <td className="px-6 py-4">{formatDate(project.endDate)}</td>
                            </tr>
                        ))}
                         {filteredProjects.length === 0 && (
                            <tr>
                                <td colSpan={3} className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center">
                                        <CheckCircleIcon className="w-12 h-12 text-green-500 mb-2"/>
                                        <p>{t('reports_noTasksForFilter')}</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
           </div>
      </div>
    </div>
  );
};

export default FinishedProjectsPage;