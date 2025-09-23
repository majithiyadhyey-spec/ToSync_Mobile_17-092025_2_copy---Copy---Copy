import React, { useState, useMemo } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import GanttChart from './GanttChart';
import BoardView from './BoardView';
import GanttChartIcon from './icons/GanttChartIcon';
import BoardViewIcon from './icons/BoardViewIcon';
import TaskDetailsModal from './TaskDetailsModal';
import { Task } from '../types';
import { useAuth } from '../context/AuthContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

const CalendarPage: React.FC = () => {
    const { activeProjects, activeTasks, workers } = useFormworkData();
    const { currentUser } = useAuth();
    const { t } = useI18n();
    const [viewMode, setViewMode] = useState<'gantt' | 'board'>('gantt');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const projectsById = useMemo(() => new Map(activeProjects.map(p => [p.id, p])), [activeProjects]);

    const { monthStart, monthEnd, filteredProjects, filteredTasks } = useMemo(() => {
        // const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 2);
        start.setUTCHours(0,0,0,0);
        // const end = new Date(currentDate.getFullYear(), (currentDate.getMonth()) + 1, 0);
        const end = new Date(currentDate.getFullYear(), (currentDate.getMonth()) + 1, 1);
        end.setUTCHours(23,59,59,999);

        const tasksInMonth = activeTasks.filter(task => {
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.deadline);
            return taskStart <= end && taskEnd >= start;
        });

        const projectIdsInView = new Set<string>();

        activeProjects.forEach(p => {
            const projectStart = new Date(p.startDate);
            const projectEnd = new Date(p.endDate);
            if (projectStart <= end && projectEnd >= start) {
                projectIdsInView.add(p.id);
            }
        });

        const projectsInView = activeProjects.filter(p => projectIdsInView.has(p.id));

        return {
            monthStart: start,
            monthEnd: end,
            filteredProjects: projectsInView,
            filteredTasks: tasksInMonth,
        };
    }, [currentDate, activeProjects, activeTasks]);
    
    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };


    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Previous month">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center w-48">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Next month">
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex items-center rounded-md bg-gray-200 dark:bg-gray-700 p-1 self-center">
                        <button onClick={() => setViewMode('gantt')} className={`p-1.5 rounded ${viewMode === 'gantt' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('ganttView')}>
                            <GanttChartIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setViewMode('board')} className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('boardView')}>
                            <BoardViewIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
                
                {viewMode === 'gantt' && (
                    <GanttChart
                        projects={filteredProjects}
                        timelineStartDate={monthStart.toISOString().split('T')[0]}
                        timelineEndDate={monthEnd.toISOString().split('T')[0]}
                    />
                )}
                {viewMode === 'board' && <BoardView tasks={filteredTasks} onTaskClick={setSelectedTask} />}
            </div>

            {selectedTask && currentUser && (
                <TaskDetailsModal 
                  task={selectedTask} 
                  project={projectsById.get(selectedTask.projectId)!}
                  onClose={() => setSelectedTask(null)}
                  workers={workers}
                  userRole={currentUser.role}
                />
             )}
        </div>
    );
};

export default CalendarPage;
