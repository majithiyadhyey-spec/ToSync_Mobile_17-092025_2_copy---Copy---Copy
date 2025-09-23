import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { useFormworkData } from '../context/FormworkDataContext';
import { getTaskProgress } from '../utils/dateUtils';
import { TASK_STATUS_COLORS } from '../constants';
import { useI18n } from '../context/I18nContext';

interface GridViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const GridView: React.FC<GridViewProps> = ({ tasks, onTaskClick }) => {
  const { users, projects } = useFormworkData();
  const { t, formatDate } = useI18n();
  
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const getWorkerNames = (workerIds: string[]) => {
    return workerIds.map(id => users.find(w => w.id === id)?.name || 'N/A').join(', ');
  };
  
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="w-full overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
      <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3">{t('reports_taskName')}</th>
            <th scope="col" className="px-6 py-3">{t('reports_project')}</th>
            <th scope="col" className="px-6 py-3">{t('reports_status')}</th>
            <th scope="col" className="px-6 py-3">{t('taskDetailsModal_startDate')}</th>
            <th scope="col" className="px-6 py-3">{t('reports_deadline')}</th>
            <th scope="col" className="px-6 py-3">{t('progress')}</th>
            <th scope="col" className="px-6 py-3">{t('reports_assignedWorkers')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map(task => (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
            >
              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{task.name}</td>
              <td className="px-6 py-4">{projectsById.get(task.projectId)?.name || 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`inline-block px-3 py-1 text-xs font-semibold text-white rounded-full ${TASK_STATUS_COLORS[task.status]}`}>
                  {t(task.status)}
                </span>
              </td>
              <td className="px-6 py-4">{formatDate(task.startDate)}</td>
              <td className="px-6 py-4">{formatDate(task.deadline)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${getTaskProgress(task)}%` }}
                        ></div>
                    </div>
                    <span className="text-xs font-semibold">{getTaskProgress(task)}%</span>
                </div>
              </td>
              <td className="px-6 py-4">{getWorkerNames(task.assignedWorkerIds)}</td>
            </tr>
          ))}
           {sortedTasks.length === 0 && (
                <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('reports_noTasksForFilter')}</td>
                </tr>
            )}
        </tbody>
      </table>
    </div>
  );
};

export default GridView;