import React, { useMemo } from 'react';
import { Task, TaskStatus, Project } from '../types';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import { getTextColorForBackground } from '../utils/colorUtils';
import { getTaskProgress } from '../utils/dateUtils';

interface BoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusColumns: TaskStatus[] = [TaskStatus.Planned, TaskStatus.InProgress, TaskStatus.Completed];

const TaskCard: React.FC<{ task: Task; onClick: () => void; project: Project | undefined; }> = ({ task, onClick, project }) => {
  const { users } = useFormworkData();
  const assignedWorkerAvatars = task.assignedWorkerIds
    .map(id => users.find(w => w.id === id))
    .filter(Boolean);
    
  const progress = getTaskProgress(task);

  return (
    <div onClick={onClick} className="bg-white dark:bg-gray-700 rounded-md shadow-sm p-4 mb-3 cursor-pointer hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex-1">{task.name}</h4>
        {project && (
           <span
              style={{ backgroundColor: project.markingColor, color: getTextColorForBackground(project.markingColor) }}
              className="px-2 py-0.5 text-xs font-bold rounded-full ml-2 flex-shrink-0"
           >
              {project.marking}
           </span>
        )}
      </div>
       <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
        <span className="font-semibold">{progress}%</span>
      </div>
      <div className="flex items-center justify-end space-x-reverse -space-x-2">
        {assignedWorkerAvatars.slice(0, 3).map(worker => (
          <div key={worker!.id} title={worker!.name} className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-700">
            {worker!.name.charAt(0)}
          </div>
        ))}
        {assignedWorkerAvatars.length > 3 && (
           <div className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-700">
            +{assignedWorkerAvatars.length - 3}
          </div>
        )}
      </div>
    </div>
  );
};


const BoardView: React.FC<BoardViewProps> = ({ tasks, onTaskClick }) => {
  const { t } = useI18n();
  const { projects } = useFormworkData();
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const tasksByStatus = {
    [TaskStatus.Planned]: tasks.filter(t => t.status === TaskStatus.Planned),
    [TaskStatus.InProgress]: tasks.filter(t => t.status === TaskStatus.InProgress),
    [TaskStatus.Completed]: tasks.filter(t => t.status === TaskStatus.Completed),
  };

  const columnColors: Record<TaskStatus, string> = {
    [TaskStatus.Planned]: 'border-blue-500',
    [TaskStatus.InProgress]: 'border-orange-500',
    [TaskStatus.Completed]: 'border-green-500',
  };

  return (
    <div className="w-full overflow-x-auto p-2">
      <div className="flex space-x-4 min-w-max">
        {statusColumns.map(status => (
          <div key={status} className="w-72 bg-gray-100 dark:bg-gray-900/50 rounded-lg flex-shrink-0">
            <div className={`p-3 border-t-4 ${columnColors[status]} rounded-t-lg`}>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t(status)} <span className="text-sm text-gray-500 dark:text-gray-400">({tasksByStatus[status].length})</span></h3>
            </div>
            <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
              {tasksByStatus[status]
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} project={projectsById.get(task.projectId)} />
              ))}
              {tasksByStatus[status].length === 0 && (
                <div className="text-center text-gray-400 p-4 text-sm">{t('reports_noTasksForFilter')}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardView;