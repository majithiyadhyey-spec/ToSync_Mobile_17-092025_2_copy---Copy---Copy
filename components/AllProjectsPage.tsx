
import React, { useState } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import GanttChart from './GanttChart';
import BoardView from './BoardView';
import GanttChartIcon from './icons/GanttChartIcon';
import BoardViewIcon from './icons/BoardViewIcon';
import TaskDetailsModal from './TaskDetailsModal';
import { Task, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';


const AllProjectsPage: React.FC = () => {
    const { activeProjects: projects, activeTasks: tasks, workers } = useFormworkData();
    const { currentUser } = useAuth();
    const { t } = useI18n();
    const [viewMode, setViewMode] = useState<'gantt' | 'board'>('gantt');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const projectsById = new Map(projects.map(p => [p.id, p]));

    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('allProjectsView_title')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('allProjectsView_description')}</p>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-200 dark:bg-gray-700 p-1">
                        <button onClick={() => setViewMode('gantt')} className={`p-1.5 rounded ${viewMode === 'gantt' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('ganttView')}>
                            <GanttChartIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setViewMode('board')} className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('boardView')}>
                            <BoardViewIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                
                {viewMode === 'gantt' && <GanttChart projects={projects} />}
                {viewMode === 'board' && <BoardView tasks={tasks} onTaskClick={setSelectedTask} />}
            </div>

            {selectedTask && (
                <TaskDetailsModal 
                  task={selectedTask} 
                  project={projectsById.get(selectedTask.projectId)!}
                  onClose={() => setSelectedTask(null)}
                  workers={workers}
                  userRole={currentUser!.role}
                />
             )}
        </div>
    );
};

export default AllProjectsPage;
