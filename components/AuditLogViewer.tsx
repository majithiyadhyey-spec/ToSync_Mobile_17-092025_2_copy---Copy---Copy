import React, { useState, useMemo, useCallback } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import { AuditLog } from '../types';
import HistoryIcon from './icons/HistoryIcon';
import Pagination from './Pagination';
import SearchIcon from './icons/SearchIcon';

const AuditLogViewer: React.FC = () => {
    const { auditLogs, users } = useFormworkData();
    const { t, formatDateTime } = useI18n();
    const [filterUserId, setFilterUserId] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [logsPerPage, setLogsPerPage] = useState(15);
    const [searchQuery, setSearchQuery] = useState('');

    const handleItemsPerPageChange = (size: number) => {
        setLogsPerPage(size);
        setCurrentPage(1);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const getLogMessage = useCallback((log: AuditLog) => {
        const actionText = t(`auditLog_action_${log.action}`);
        const targetText = `${t(`auditLog_target_${log.targetType}`)}${log.targetName ? `: "${log.targetName}"` : ''}`;
        return `${actionText} ${targetText}`;
    }, [t]);

    const filteredLogs = useMemo(() => {
        let logs = [...auditLogs];

        if (filterUserId !== 'all') {
            logs = logs.filter(log => log.actorId === filterUserId);
        }

        if (filterDateRange !== 'all') {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            let startDate: Date;

            switch (filterDateRange) {
                case 'today':
                    startDate = startOfToday;
                    break;
                case '7days':
                    startDate = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30days':
                    startDate = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(0); // Epoch
            }
            logs = logs.filter(log => new Date(log.timestamp) >= startDate);
        }
        
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            logs = logs.filter(log =>
                log.actorName.toLowerCase().includes(lowercasedQuery) ||
                getLogMessage(log).toLowerCase().includes(lowercasedQuery)
            );
        }

        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [auditLogs, filterUserId, filterDateRange, searchQuery, getLogMessage]);
    
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * logsPerPage;
        return filteredLogs.slice(startIndex, startIndex + logsPerPage);
    }, [currentPage, filteredLogs, logsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

    const inputClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <div className="flex items-center space-x-3">
                    <HistoryIcon className="w-7 h-7 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('auditLog_title')}</h2>
                </div>
                 <div className="relative w-full sm:max-w-xs">
                    <label htmlFor="audit-log-search" className="sr-only">{t('search')}</label>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="audit-log-search"
                        type="search"
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('search')}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)} className={inputClasses}>
                    <option value="all">{t('auditLog_allUsers')}</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={filterDateRange} onChange={e => setFilterDateRange(e.target.value)} className={inputClasses}>
                    <option value="all">{t('auditLog_allTime')}</option>
                    <option value="today">{t('auditLog_today')}</option>
                    <option value="7days">{t('auditLog_last7Days')}</option>
                    <option value="30days">{t('auditLog_last30Days')}</option>
                </select>
                <button onClick={() => { setFilterUserId('all'); setFilterDateRange('all'); }} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 text-sm rounded-lg p-2.5">{t('reports_clearFilters')}</button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="hidden md:table-header-group text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-6 py-3">{t('auditLog_timestamp')}</th>
                            <th className="px-6 py-3">{t('auditLog_user')}</th>
                            <th className="px-6 py-3">{t('auditLog_action')}</th>
                        </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                        {paginatedLogs.map(log => (
                             <tr key={log.id} className="block md:table-row mb-4 md:mb-0 bg-white dark:bg-gray-800 rounded-lg shadow-md md:shadow-none md:border-b md:dark:border-gray-700">
                                <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 border-b md:border-none dark:border-gray-700">
                                    <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('auditLog_timestamp')}</span>
                                    <span className="text-right whitespace-nowrap">{formatDateTime(log.timestamp)}</span>
                                </td>
                                <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 font-medium text-gray-900 dark:text-white border-b md:border-none dark:border-gray-700">
                                     <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('auditLog_user')}</span>
                                     <span className="text-right">{log.actorName}</span>
                                </td>
                                <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4">
                                    <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('auditLog_action')}</span>
                                    <span className="text-right">{getLogMessage(log)}</span>
                                </td>
                            </tr>
                        ))}
                         {filteredLogs.length === 0 && (
                            <tr className="block md:table-row">
                                <td colSpan={3} className="block md:table-cell text-center py-8 text-gray-500 dark:text-gray-400">{t('auditLog_noResults')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage}
                itemsPerPage={logsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={filteredLogs.length}
                t={t}
                showSearch={false}
            />
        </div>
    );
};

export default AuditLogViewer;