import React, { useState, useMemo, useEffect } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { Project, Task, User } from '../types';
import { useI18n } from '../context/I18nContext';
import ConfirmationModal from './ConfirmationModal';
import RecycleBinIcon from './icons/RecycleBinIcon';
import ProjectIcon from './icons/ProjectIcon';
import TasksIcon from './icons/TasksIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import { useAuth } from '../context/AuthContext';
import Pagination from './Pagination';
import SearchIcon from './icons/SearchIcon';

type Tab = 'projects' | 'tasks' | 'users';

const getExpiryDate = (deletedAt: string): Date => {
    const date = new Date(deletedAt);
    date.setDate(date.getDate() + 180);
    return date;
};

const RecycleBinPage: React.FC = () => {
    const { 
        deletedProjects, deletedTasks, deletedUsers, 
        restoreProject, restoreTask, restoreUser,
        permanentlyDeleteProject, permanentlyDeleteTask, permanentlyDeleteUser,
        activeProjects, addAuditLog
    } = useFormworkData();
    const { currentUser } = useAuth();
    const { t, formatDate } = useI18n();
    const [activeTab, setActiveTab] = useState<Tab>('projects');
    const [confirmAction, setConfirmAction] = useState<{ action: () => void; title: string; message: string; } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setCurrentPage(1);
        setSearchQuery('');
    }, [activeTab]);

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const activeProjectIds = new Set(activeProjects.map(p => p.id));

    const { paginatedItems, totalPages, totalItems } = useMemo(() => {
        let sourceItems: (Project | Task | User)[] = 
            activeTab === 'projects' ? deletedProjects :
            activeTab === 'tasks' ? deletedTasks :
            deletedUsers;

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            sourceItems = sourceItems.filter(item => 
                item.name.toLowerCase().includes(lowercasedQuery)
            );
        }

        const sortedItems = [...sourceItems].sort((a,b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());

        const total = sortedItems.length;
        const totalPagesCount = Math.ceil(total / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginated = sortedItems.slice(startIndex, startIndex + itemsPerPage);

        return { paginatedItems: paginated, totalPages: totalPagesCount, totalItems: total };
    }, [activeTab, currentPage, deletedProjects, deletedTasks, deletedUsers, itemsPerPage, searchQuery]);


    const handlePermanentDelete = (itemType: Tab, item: Project | Task | User) => {
        if (!currentUser) return;
        let action: () => void;
        let message: string;
        switch(itemType) {
            case 'projects':
                action = () => {
                    addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'permanent_delete_project', targetType: 'Project', targetId: item.id, targetName: item.name });
                    permanentlyDeleteProject(item.id);
                };
                message = t('recycleBin_confirmDeleteMessage_project', { name: item.name });
                break;
            case 'tasks':
                action = () => {
                    addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'permanent_delete_task', targetType: 'Task', targetId: item.id, targetName: item.name });
                    permanentlyDeleteTask(item.id);
                };
                message = t('recycleBin_confirmDeleteMessage_task', { name: item.name });
                break;
            case 'users':
                action = () => {
                    addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'permanent_delete_user', targetType: 'User', targetId: item.id, targetName: item.name });
                    permanentlyDeleteUser(item.id);
                };
                message = t('recycleBin_confirmDeleteMessage_user', { name: item.name });
                break;
        }
        setConfirmAction({ action, title: t('recycleBin_confirmDeleteTitle'), message });
    };

    const handleRestore = (itemType: Tab, item: Project | Task | User) => {
        if (!currentUser) return;
        switch(itemType) {
            case 'projects':
                addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'restore_project', targetType: 'Project', targetId: item.id, targetName: item.name });
                restoreProject(item.id);
                break;
            case 'tasks':
                 addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'restore_task', targetType: 'Task', targetId: item.id, targetName: item.name });
                restoreTask(item.id);
                break;
            case 'users':
                addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'restore_user', targetType: 'User', targetId: item.id, targetName: item.name });
                restoreUser(item.id);
                break;
        }
    }
    
    const onConfirm = () => {
        confirmAction?.action();
        setConfirmAction(null);
    }
    
    const renderList = () => {
        switch (activeTab) {
            case 'projects':
                return (
                    <ItemList
                        items={paginatedItems as Project[]}
                        icon={<ProjectIcon className="w-6 h-6 text-blue-500" />}
                        onRestore={(item) => handleRestore('projects', item)}
                        onPermanentDelete={(item) => handlePermanentDelete('projects', item)}
                        t={t}
                        formatDate={formatDate}
                    />
                );
            case 'tasks':
                return (
                    <ItemList
                        items={paginatedItems as Task[]}
                        icon={<TasksIcon className="w-6 h-6 text-green-500" />}
                        onRestore={(item) => handleRestore('tasks', item)}
                        onPermanentDelete={(item) => handlePermanentDelete('tasks', item)}
                        isRestoreDisabled={(item) => !activeProjectIds.has((item as Task).projectId)}
                        disabledRestoreTooltip={t('recycleBin_disabledRestoreTooltip')}
                        t={t}
                        formatDate={formatDate}
                    />
                );
            case 'users':
                 return (
                    <ItemList
                        items={paginatedItems as User[]}
                        icon={<UserGroupIcon className="w-6 h-6 text-purple-500" />}
                        onRestore={(item) => handleRestore('users', item)}
                        onPermanentDelete={(item) => handlePermanentDelete('users', item)}
                        t={t}
                        formatDate={formatDate}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <nav className="flex flex-wrap items-center gap-4" aria-label="Tabs">
                            <TabButton name={t('projects')} count={deletedProjects.length} isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
                            <TabButton name={t('tasks_panel_title')} count={deletedTasks.length} isActive={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
                            <TabButton name={t('users')} count={deletedUsers.length} isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                        </nav>
                        <div className="relative w-full sm:max-w-xs">
                            <label htmlFor="recycle-bin-search" className="sr-only">{t('search')}</label>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="recycle-bin-search"
                                type="search"
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('search')}
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-4 flex-grow overflow-y-auto">
                    {renderList()}
                </div>
                <div className="flex-shrink-0">
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        totalItems={totalItems}
                        t={t}
                        showSearch={false}
                    />
                </div>
            </div>

            {confirmAction && (
                <ConfirmationModal
                    title={confirmAction.title}
                    onConfirm={onConfirm}
                    onClose={() => setConfirmAction(null)}
                >
                    <p>{confirmAction.message}</p>
                </ConfirmationModal>
            )}
        </>
    );
};

interface TabButtonProps {
    name: string;
    count: number;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ name, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 font-medium text-sm rounded-md transition-colors ${
            isActive
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
        }`}
    >
        {name} <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ml-2 px-2 py-0.5 rounded-full text-xs">{count}</span>
    </button>
);

interface ItemListProps<T extends {id: string, name: string, deletedAt?: string | null}> {
    items: T[];
    icon: React.ReactNode;
    onRestore: (item: T) => void;
    onPermanentDelete?: (item: T) => void;
    isRestoreDisabled?: (item: T) => boolean;
    disabledRestoreTooltip?: string;
    t: (key: string, replacements?: Record<string, string | number>) => string;
    formatDate: (dateString: string) => string;
}

const ItemList = <T extends {id: string, name: string, deletedAt?: string | null}>({items, icon, onRestore, onPermanentDelete, isRestoreDisabled, disabledRestoreTooltip, t, formatDate}: ItemListProps<T>) => {
    if (items.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 p-12">
                <RecycleBinIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('recycleBin_empty')}</p>
                <p className="text-sm mt-2 max-w-md mx-auto">{t('recycleBin_description')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map(item => {
                const expiryDate = getExpiryDate(item.deletedAt!);
                const daysLeft = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                const restoreDisabled = isRestoreDisabled ? isRestoreDisabled(item) : false;

                return (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden w-full">
                            <span className="flex-shrink-0">{icon}</span>
                            <div className="truncate">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate" title={item.name}>{item.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('recycleBin_deletedOn', { date: formatDate(item.deletedAt!) })} | 
                                    <span className={daysLeft < 7 ? 'text-red-500 font-bold' : ''}> {t('recycleBin_expiresIn', { days: daysLeft })}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center self-end sm:self-center gap-2">
                             <div className="relative group">
                                <button 
                                    onClick={() => onRestore(item)} 
                                    disabled={restoreDisabled}
                                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {t('recycleBin_restore')}
                                </button>
                                {restoreDisabled && disabledRestoreTooltip && (
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        {disabledRestoreTooltip}
                                     </div>
                                )}
                             </div>
                            {onPermanentDelete && (
                                <button 
                                    onClick={() => onPermanentDelete(item)} 
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    {t('recycleBin_deletePermanent')}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


export default RecycleBinPage;