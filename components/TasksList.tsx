import React from 'react';
import { Task } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import { getTaskProgress } from '../utils/dateUtils';
import { TASK_STATUS_COLORS } from '../constants';
import { useI18n } from '../context/I18nContext';

interface TasksListProps {
  tasks: Task[];
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
}

const TasksList: React.FC<TasksListProps> = ({ tasks, onEditTask, onDeleteTask }) => {
    const { t, formatDate } = useI18n();
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 max-h-[calc(60vh-120px)]">
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-8">{t('reports_noTasksForFilter')}</div>
                ) : (
                    <div className="space-y-2">
                        {tasks.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(task => (
                            <div key={task.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                <div className="flex-grow overflow-hidden w-full">
                                    <p className="font-semibold text-gray-900 dark:text-white truncate" title={task.name}>{task.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded-full ${TASK_STATUS_COLORS[task.status]}`}>{t(task.status)}</span>
                                        <span>{t('reports_deadline')}: {formatDate(task.deadline)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${getTaskProgress(task)}%`}}></div>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{getTaskProgress(task)}%</span>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto flex-shrink-0 flex items-center justify-end gap-1">
                                    {onEditTask && <button onClick={() => onEditTask(task)} className="p-2 rounded-full text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600"><EditIcon className="w-4 h-4" /></button>}
                                    {onDeleteTask && <button onClick={() => onDeleteTask(task)} className="p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TasksList;