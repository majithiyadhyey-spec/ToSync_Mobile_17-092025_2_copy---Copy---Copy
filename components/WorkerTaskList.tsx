import React from 'react';
import { Task, TaskStatus, User, TimerState } from '../types';
import { useFormworkData } from '../context/FormworkDataContext';
import { TASK_STATUS_COLORS } from '../constants';
import CheckCircleIcon from './icons/CheckCircleIcon';
import { useI18n } from '../context/I18nContext';
import TaskTimer from './TaskTimer';

interface WorkerTaskListProps {
  tasks: Task[];
  isReadOnly?: boolean;
  worker?: User;
}

const WorkerTaskList: React.FC<WorkerTaskListProps> = ({ tasks, isReadOnly = false, worker }) => {
  const { projects } = useFormworkData();
  const { t, formatDate } = useI18n();
  
  const getProjectName = (projectId: string) => {
      return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-8 bg-white dark:bg-gray-800 rounded-lg">
        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('workerTaskList_allClear')}</h3>
        <p>{t('workerTaskList_noTasks')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => {
          const isRunningByCurrentUser = !isReadOnly && worker && task.activeTimers && !!task.activeTimers[worker.id];
          const isPaused = !isReadOnly && task.timerState === TimerState.Paused;
          
          const cardClasses = [
            "bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col transition-all duration-300",
            isRunningByCurrentUser ? "ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 ring-green-500 scale-105 shadow-2xl" : "",
            isPaused ? "ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 ring-yellow-500" : ""
          ].filter(Boolean).join(" ");

          return (
            <div key={task.id} className={cardClasses}>
              <div className="p-6 flex-grow">
                <span className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full mb-3 ${TASK_STATUS_COLORS[task.status]}`}>
                  {t(task.status)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{task.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{getProjectName(task.projectId)}</p>
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <p><strong>{t('reports_deadline')}:</strong> {formatDate(task.deadline)}</p>
                    {task.notes && <p className="text-xs italic bg-gray-100 dark:bg-gray-700 p-2 rounded"><strong>{t('taskDetailsModal_notes')}:</strong> {task.notes}</p>}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-b-lg">
                  {!isReadOnly && worker ? (
                      <TaskTimer task={task} worker={worker} />
                  ) : (
                      <div className={`flex items-center justify-center gap-2 font-semibold ${
                          task.status === TaskStatus.Completed ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                          {task.status === TaskStatus.Completed && <CheckCircleIcon className="w-5 h-5" />}
                          <span>{t(task.status)}</span>
                      </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default WorkerTaskList;