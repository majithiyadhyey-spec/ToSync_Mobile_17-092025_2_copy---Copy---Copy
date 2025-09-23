import React, { useState, useMemo } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { UserRole, User, TaskStatus } from '../types';
import AddWorkerModal from './AddWorkerModal';
import UserDetailsModal from './UserDetailsModal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import { useI18n } from '../context/I18nContext';
import ConfirmationModal from './ConfirmationModal';
import Pagination from './Pagination';
import SearchIcon from './icons/SearchIcon';

interface UsersPageProps {
    currentUser: User;
}

const UserCard: React.FC<{ user: User & { totalTasks: number; completedTasks: number; inProgressTasks: number; }; onSelectUser: (user: User) => void; onDeleteUser: (user: User) => void; t: (key: string, replacements?: Record<string, string | number>) => string; currentUser: User }> = ({ user, onSelectUser, onDeleteUser, t, currentUser }) => {
    const canDelete = currentUser.role === UserRole.Administrator && currentUser.id !== user.id;

    return (
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col text-center transition-all duration-300 hover:shadow-blue-500/20 hover:ring-1 hover:ring-blue-500">
            {canDelete && (
                <button 
                    onClick={() => onDeleteUser(user)} 
                    className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label={t('deleteWorkerAriaLabel')}
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            )}
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                <UserGroupIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate w-full">{user.name}</h3>
            <p className="text-sm font-medium text-blue-500 dark:text-blue-400 mb-2">{t(user.role)}</p>
            
            {user.role === UserRole.Worker && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 h-8 overflow-hidden" title={Array.isArray(user.skills) ? user.skills.join(', ') : ''}>{Array.isArray(user.skills) ? user.skills.join(', ') : ''}</p>
            )}

            <div className="mt-4 flex justify-around w-full text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                    <p className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">{user.totalTasks}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t('usersPage_total')}</p>
                </div>
                <div>
                    <p className="font-bold text-lg sm:text-xl text-green-600">{user.completedTasks}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t('usersPage_done')}</p>
                </div>
                <div>
                    <p className="font-bold text-lg sm:text-xl text-orange-600">{user.inProgressTasks}</p>
                    <p className="text-gray-500 dark:text-gray-400">{t('usersPage_active')}</p>
                </div>
            </div>
            <button
                onClick={() => onSelectUser(user)}
                className="mt-6 w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
            >
                {t('usersPage_viewDetails')}
            </button>
        </div>
    );
};

const UsersPage: React.FC<UsersPageProps> = ({ currentUser }) => {
    const { activeUsers, activeTasks: tasks, deleteWorker, addAuditLog } = useFormworkData();
    const { t } = useI18n();
    const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [searchQuery, setSearchQuery] = useState('');

    const canManageWorkers = currentUser.role === UserRole.Administrator;
    
    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (size: number) => {
        setItemsPerPage(size);
        setCurrentPage(1);
    };

    const handleDeleteUser = () => {
        if (userToDelete) {
            if (selectedUser?.id === userToDelete.id) setSelectedUser(null);
            addAuditLog({
                // FIX: Changed actorUuid to actorId to match the AuditLog type definition.
                actorId: currentUser.id,
                actorName: currentUser.name,
                action: 'delete_user',
                targetType: 'User',
                targetId: userToDelete.id,
                targetName: userToDelete.name,
            });
            deleteWorker(userToDelete.id);
            setUserToDelete(null);
        }
    }

    const userStats = useMemo(() => {
        return activeUsers.map(user => {
            const userTasks = user.role === UserRole.Worker ? tasks.filter(task => task.assignedWorkerIds.includes(user.id)) : [];
            return {
                ...user,
                totalTasks: userTasks.length,
                completedTasks: userTasks.filter(t => t.status === TaskStatus.Completed).length,
                inProgressTasks: userTasks.filter(t => t.status === TaskStatus.InProgress).length,
            };
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [activeUsers, tasks]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return userStats;
        const query = searchQuery.toLowerCase();
        return userStats.filter(user =>
            user.name.toLowerCase().includes(query) ||
            t(user.role).toLowerCase().includes(query) ||
            (Array.isArray(user.skills) && user.skills.some(skill => skill.toLowerCase().includes(query)))
        );
    }, [userStats, searchQuery, t]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    }, [currentPage, filteredUsers, itemsPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    return (
        <>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('usersPage_title')}</h1>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-full sm:max-w-xs">
                            <label htmlFor="users-search" className="sr-only">{t('searchWorkerPlaceholder')}</label>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="users-search"
                                type="search"
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('searchWorkerPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        {canManageWorkers && (
                            <button 
                                onClick={() => setIsAddWorkerModalOpen(true)}
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                            >
                                <PlusIcon className="w-5 h-5" />
                                {t('reports_addWorker')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedUsers.map(user => (
                        <UserCard key={user.id} user={user} onSelectUser={setSelectedUser} onDeleteUser={setUserToDelete} t={t} currentUser={currentUser}/>
                    ))}
                </div>
                
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    totalItems={filteredUsers.length}
                    t={t}
                    showSearch={false}
                />

            </div>
            
            {isAddWorkerModalOpen && (
                <AddWorkerModal onClose={() => setIsAddWorkerModalOpen(false)} />
            )}
            {selectedUser && (
                <UserDetailsModal 
                    user={selectedUser} 
                    onClose={() => setSelectedUser(null)} 
                    currentUser={currentUser}
                />
            )}
            {userToDelete && (
                <ConfirmationModal
                    title={t('deleteWorkerConfirmationTitle')}
                    onConfirm={handleDeleteUser}
                    onClose={() => setUserToDelete(null)}
                >
                    <p>{t('deleteWorkerConfirmationMessage', {
                        workerName: userToDelete.name
                    })}</p>
                </ConfirmationModal>
            )}
        </>
    );
};

export default UsersPage;