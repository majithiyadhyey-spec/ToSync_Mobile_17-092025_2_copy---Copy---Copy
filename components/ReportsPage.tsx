import React, { useState, useMemo } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { Task, TaskStatus, User, UserRole } from '../types';
import { TASK_STATUS_COLORS } from '../constants';
import TasksIcon from './icons/TasksIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import { useI18n } from '../context/I18nContext';
import ExportDropdown from './ExportDropdown';
import Pagination from './Pagination';
import SearchIcon from './icons/SearchIcon';

type SortableTaskKeys = keyof Task | 'projectName' | 'assignedWorkers';

interface ReportsPageProps {
    userRole: UserRole;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ userRole }) => {
    const { activeTasks: tasks, activeProjects: projects, workers, users } = useFormworkData();
    const { t, formatDate } = useI18n();
    const [filters, setFilters] = useState({ projectId: 'all', workerId: 'all', status: 'all', startDate: '', endDate: '' });
    const [sortConfig, setSortConfig] = useState<{ key: SortableTaskKeys; direction: 'asc' | 'desc' } | null>({ key: 'deadline', direction: 'asc' });
    
    const [taskCurrentPage, setTaskCurrentPage] = useState(1);
    const [workerCurrentPage, setWorkerCurrentPage] = useState(1);
    const [taskItemsPerPage, setTaskItemsPerPage] = useState(10);
    const [workerItemsPerPage, setWorkerItemsPerPage] = useState(10);
    const [taskSearch, setTaskSearch] = useState('');
    const [workerSearch, setWorkerSearch] = useState('');

    const getProjectName = (projectId: string) => projects.find(p => p.id === projectId)?.name || 'N/A';
    const getWorkerNames = (workerIds: string[]) => workerIds.map(id => users.find(w => w.id === id)?.name || 'N/A');

    const handleTaskSearch = (query: string) => {
        setTaskSearch(query);
        setTaskCurrentPage(1);
    };

    const handleWorkerSearch = (query: string) => {
        setWorkerSearch(query);
        setWorkerCurrentPage(1);
    };

    const handleTaskItemsPerPageChange = (size: number) => {
        setTaskItemsPerPage(size);
        setTaskCurrentPage(1);
    };

    const handleWorkerItemsPerPageChange = (size: number) => {
        setWorkerItemsPerPage(size);
        setWorkerCurrentPage(1);
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const projectMatch = filters.projectId === 'all' || task.projectId === filters.projectId;
            const workerMatch = filters.workerId === 'all' || task.assignedWorkerIds.includes(filters.workerId);
            const statusMatch = filters.status === 'all' || task.status === filters.status;

            // Date range filter logic: a task is included if its duration overlaps with the filter range.
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.deadline);
            const filterStart = filters.startDate ? new Date(filters.startDate) : null;
            const filterEnd = filters.endDate ? new Date(filters.endDate) : null;

            if (filterStart && taskEnd < filterStart) return false; // Task ends before filter starts
            if (filterEnd && taskStart > filterEnd) return false; // Task starts after filter ends

            return projectMatch && workerMatch && statusMatch;
        });
    }, [tasks, filters]);

    const sortedTasks = useMemo(() => {
        let sortableItems = [...filteredTasks];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = sortConfig.key === 'projectName' ? getProjectName(a.projectId) : sortConfig.key === 'assignedWorkers' ? getWorkerNames(a.assignedWorkerIds).join(', ') : a[sortConfig.key as keyof Task];
                const bValue = sortConfig.key === 'projectName' ? getProjectName(b.projectId) : sortConfig.key === 'assignedWorkers' ? getWorkerNames(b.assignedWorkerIds).join(', ') : b[sortConfig.key as keyof Task];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredTasks, sortConfig]);
    
    const searchedTasks = useMemo(() => {
        if (!taskSearch) return sortedTasks;
        const query = taskSearch.toLowerCase();
        return sortedTasks.filter(task =>
            task.name.toLowerCase().includes(query) ||
            getProjectName(task.projectId).toLowerCase().includes(query) ||
            getWorkerNames(task.assignedWorkerIds).join(', ').toLowerCase().includes(query)
        );
    }, [sortedTasks, taskSearch]);
    
    const paginatedTasks = useMemo(() => {
        const startIndex = (taskCurrentPage - 1) * taskItemsPerPage;
        return searchedTasks.slice(startIndex, startIndex + taskItemsPerPage);
    }, [taskCurrentPage, searchedTasks, taskItemsPerPage]);

    const totalTaskPages = Math.ceil(searchedTasks.length / taskItemsPerPage);

    const requestSort = (key: SortableTaskKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const workerProductivity = useMemo(() => {
        return workers.map(worker => {
            const workerTasks = tasks.filter(task => task.assignedWorkerIds.includes(worker.id));
            return {
                id: worker.id,
                name: worker.name,
                completed: workerTasks.filter(t => t.status === TaskStatus.Completed).length,
                inProgress: workerTasks.filter(t => t.status === TaskStatus.InProgress).length,
                planned: workerTasks.filter(t => t.status === TaskStatus.Planned).length,
                total: workerTasks.length,
            };
        }).sort((a, b) => b.total - a.total);
    }, [workers, tasks]);

    const searchedWorkers = useMemo(() => {
        if (!workerSearch) return workerProductivity;
        const query = workerSearch.toLowerCase();
        return workerProductivity.filter(w => w.name.toLowerCase().includes(query));
    }, [workerProductivity, workerSearch]);

    const paginatedWorkers = useMemo(() => {
        const startIndex = (workerCurrentPage - 1) * workerItemsPerPage;
        return searchedWorkers.slice(startIndex, startIndex + workerItemsPerPage);
    }, [workerCurrentPage, searchedWorkers, workerItemsPerPage]);

    const totalWorkerPages = Math.ceil(searchedWorkers.length / workerItemsPerPage);

    const taskExportData = useMemo(() => searchedTasks.map(task => ({
        [t('reports_taskName')]: task.name,
        [t('reports_project')]: getProjectName(task.projectId),
        [t('reports_status')]: t(task.status),
        [t('reports_deadline')]: formatDate(task.deadline),
        [t('reports_assignedWorkers')]: getWorkerNames(task.assignedWorkerIds).join('; '),
    })), [searchedTasks, t, formatDate]);
    
    const workerExportData = useMemo(() => searchedWorkers.map(worker => ({
        [t('reports_workerName')]: worker.name,
        [t('reports_completed')]: worker.completed,
        [t('reports_inProgress')]: worker.inProgress,
        [t('reports_planned')]: worker.planned,
        [t('reports_totalAssigned')]: worker.total,
    })), [searchedWorkers, t]);


    const renderSortArrow = (key: SortableTaskKeys) => {
        if (sortConfig?.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const inputClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";
    const labelClasses = "text-sm font-medium text-gray-500 dark:text-gray-400";

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('reports_title')}</h1>
            
            {/* Task Status Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <TasksIcon className="w-7 h-7 text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('reports_taskStatusReport')}</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <label htmlFor="task-report-search" className="sr-only">{t('searchTasks')}</label>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="task-report-search"
                                type="search"
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('searchTasks')}
                                value={taskSearch}
                                onChange={(e) => handleTaskSearch(e.target.value)}
                            />
                        </div>
                        <ExportDropdown
                             data={taskExportData}
                             baseFilename={`task_status_report_${new Date().toISOString().split('T')[0]}`}
                             t={t}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select onChange={e => setFilters({...filters, projectId: e.target.value})} value={filters.projectId} className={inputClasses}>
                            <option value="all">{t('reports_allProjects')}</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select onChange={e => setFilters({...filters, workerId: e.target.value})} value={filters.workerId} className={inputClasses}>
                            <option value="all">{t('reports_allWorkers')}</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <select onChange={e => setFilters({...filters, status: e.target.value})} value={filters.status} className={inputClasses}>
                            <option value="all">{t('reports_allStatuses')}</option>
                            {Object.values(TaskStatus).map(s => <option key={s} value={s}>{t(s)}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="start-date-filter" className={labelClasses}>{t('taskDetailsModal_startDate')}</label>
                            <input id="start-date-filter" type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className={inputClasses} />
                        </div>
                        <div>
                            <label htmlFor="end-date-filter" className={labelClasses}>{t('addProjectModal_endDate')}</label>
                            <input id="end-date-filter" type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className={inputClasses} min={filters.startDate || ''} />
                        </div>
                        <div className="flex items-end">
                            <button onClick={() => setFilters({ projectId: 'all', workerId: 'all', status: 'all', startDate: '', endDate: '' })} className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 text-sm rounded-lg p-2.5 h-10">{t('reports_clearFilters')}</button>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto mt-6">
                    <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                        <thead className="hidden md:table-header-group text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>{t('reports_taskName')}{renderSortArrow('name')}</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('projectName')}>{t('reports_project')}{renderSortArrow('projectName')}</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>{t('reports_status')}{renderSortArrow('status')}</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('deadline')}>{t('reports_deadline')}{renderSortArrow('deadline')}</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('assignedWorkers')}>{t('reports_assignedWorkers')}{renderSortArrow('assignedWorkers')}</th>
                            </tr>
                        </thead>
                        <tbody className="block md:table-row-group">
                            {paginatedTasks.map(task => (
                                <tr key={task.id} className="block md:table-row mb-4 md:mb-0 rounded-lg shadow-md md:shadow-none bg-white dark:bg-gray-800 md:border-b md:dark:border-gray-700">
                                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 md:font-medium text-gray-900 dark:text-white border-b md:border-none dark:border-gray-700">
                                        <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('reports_taskName')}</span>
                                        <span className="text-right truncate">{task.name}</span>
                                    </td>
                                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 border-b md:border-none dark:border-gray-700">
                                        <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('reports_project')}</span>
                                        <span className="text-right">{getProjectName(task.projectId)}</span>
                                    </td>
                                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 border-b md:border-none dark:border-gray-700">
                                        <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('reports_status')}</span>
                                        <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]}`}>{t(task.status)}</span>
                                    </td>
                                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 border-b md:border-none dark:border-gray-700">
                                        <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('reports_deadline')}</span>
                                        <span className="text-right">{formatDate(task.deadline)}</span>
                                    </td>
                                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4">
                                        <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('reports_assignedWorkers')}</span>
                                        <span className="text-right">{getWorkerNames(task.assignedWorkerIds).join(', ')}</span>
                                    </td>
                                </tr>
                            ))}
                            {searchedTasks.length === 0 && (
                                <tr className="block md:table-row">
                                    <td colSpan={5} className="block md:table-cell text-center py-8 text-gray-500 dark:text-gray-400">{t('reports_noTasksForFilter')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    currentPage={taskCurrentPage} 
                    totalPages={totalTaskPages} 
                    onPageChange={setTaskCurrentPage} 
                    itemsPerPage={taskItemsPerPage}
                    onItemsPerPageChange={handleTaskItemsPerPageChange}
                    totalItems={searchedTasks.length}
                    t={t}
                    showSearch={false}
                />
            </div>

            {/* Worker Productivity Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div className="flex items-center space-x-3">
                        <UserGroupIcon className="w-7 h-7 text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('reports_workerProductivity')}</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <label htmlFor="worker-report-search" className="sr-only">{t('searchWorkerPlaceholder')}</label>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="worker-report-search"
                                type="search"
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('searchWorkerPlaceholder')}
                                value={workerSearch}
                                onChange={(e) => handleWorkerSearch(e.target.value)}
                            />
                        </div>
                        <ExportDropdown
                            data={workerExportData}
                            baseFilename={`worker_productivity_report_${new Date().toISOString().split('T')[0]}`}
                            t={t}
                        />
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('reports_workerName')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('reports_completed')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('reports_inProgress')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('reports_planned')}</th>
                                <th scope="col" className="px-6 py-3 text-center">{t('reports_totalAssigned')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedWorkers.map(worker => (
                                <tr key={worker.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{worker.name}</td>
                                    <td className="px-6 py-4 text-center text-green-600 font-bold">{worker.completed}</td>
                                    <td className="px-6 py-4 text-center text-orange-600 font-bold">{worker.inProgress}</td>
                                    <td className="px-6 py-4 text-center text-blue-600 font-bold">{worker.planned}</td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-800 dark:text-gray-200">{worker.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination 
                    currentPage={workerCurrentPage} 
                    totalPages={totalWorkerPages} 
                    onPageChange={setWorkerCurrentPage}
                    itemsPerPage={workerItemsPerPage}
                    onItemsPerPageChange={handleWorkerItemsPerPageChange}
                    totalItems={searchedWorkers.length}
                    t={t} 
                    showSearch={false}
                />
            </div>
        </div>
    );
};

export default ReportsPage;