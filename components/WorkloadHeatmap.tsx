import React, { useMemo } from 'react';
import { Project, Task, User } from '../types';
import { getDaysDifference } from '../utils/dateUtils';
import { useI18n } from '../context/I18nContext';
import { TASK_DEFINITIONS } from '../constants';

interface WorkloadHeatmapProps {
  tasks: Task[];
  workers: User[];
  projects: Project[]; // All projects for global view
  project?: Project; // Optional: A single project to scope the timeline
}

const getHeatmapColor = (taskCount: number): string => {
  if (taskCount === 0) return 'bg-green-300 dark:bg-green-800 hover:bg-green-400 dark:hover:bg-green-700';
  if (taskCount === 1) return 'bg-yellow-300 dark:bg-yellow-700 hover:bg-yellow-400 dark:hover:bg-yellow-600';
  return 'bg-red-500 dark:bg-red-500 hover:bg-red-600';
};


const WorkloadHeatmap: React.FC<WorkloadHeatmapProps> = ({ tasks, workers, projects, project }) => {
  const { t } = useI18n();
  const { timeline, workloadData } = useMemo(() => {
    const relevantProjects = project ? [project] : projects;
    if (relevantProjects.length === 0) {
      return { timeline: [], workloadData: {} };
    }
    
    const allStartDates = relevantProjects.map(p => new Date(p.startDate));
    const allEndDates = relevantProjects.map(p => new Date(p.endDate));
    const timelineStart = new Date(Math.min(...allStartDates.map(d => d.getTime())));
    const timelineEnd = new Date(Math.max(...allEndDates.map(d => d.getTime())));
    timelineStart.setUTCHours(0,0,0,0);
    timelineEnd.setUTCHours(0,0,0,0);
    
    const totalDays = getDaysDifference(timelineStart.toISOString().split('T')[0], timelineEnd.toISOString().split('T')[0]);
    
    const timelineDates: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(timelineStart);
      date.setUTCDate(timelineStart.getUTCDate() + i);
      timelineDates.push(date);
    }
    
    const workloadDataMap: Record<string, { date: string; workedHours: number; availableHours: number; tasks: {name: string, hours: number}[] }[]> = {};

    workers.forEach(worker => {
        workloadDataMap[worker.id] = timelineDates.map(date => {
            const dateString = date.toISOString().split('T')[0];
            return {
                date: dateString,
                workedHours: 0,
                availableHours: worker.dailyAvailability?.[dateString] ?? 8,
                tasks: []
            };
        });
    });

    tasks.forEach(task => {
        let definition: (typeof TASK_DEFINITIONS)[0] | undefined;
        let bestMatchLength = 0;
        for (const def of TASK_DEFINITIONS) {
          if (task.name.startsWith(def.name) && def.name.length > bestMatchLength) {
              definition = def;
              bestMatchLength = def.name.length;
          }
        }

        if (!definition || !definition.baseProductionHours) return;

        const durationDays = getDaysDifference(task.startDate, task.deadline);
        if (durationDays <= 0) return;

        const hoursPerDay = definition.baseProductionHours / durationDays;

        task.assignedWorkerIds.forEach(workerId => {
            if (workloadDataMap[workerId]) {
                for (let d = new Date(task.startDate); d <= new Date(task.deadline); d.setUTCDate(d.getUTCDate() + 1)) {
                    const dateString = d.toISOString().split('T')[0];
                    const dayData = workloadDataMap[workerId].find(wd => wd.date === dateString);
                    if (dayData) {
                        dayData.workedHours += hoursPerDay;
                        dayData.tasks.push({ name: task.name, hours: hoursPerDay });
                    }
                }
            }
        });
    });
    
    return { timeline: timelineDates, workloadData: workloadDataMap };
  }, [project, projects, tasks, workers]);

  if (workers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mt-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('workloadHeatmap_title')}</h3>
        <p className="text-gray-500 dark:text-gray-400">{t('workloadHeatmap_noWorkers')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mt-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('workloadHeatmap_title')}</h3>
      <div className="w-full overflow-x-auto">
        <div className="relative inline-block" style={{ minWidth: '100%' }}>
          {/* Header */}
          <div className="flex sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="sticky left-0 w-32 flex-shrink-0 p-2 border-b border-r border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800">
              {t('reports_workerName')}
            </div>
            {timeline.map((date, index) => (
              <div key={index} className="flex-shrink-0 text-center w-10 p-1 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{date.getUTCDate()}</div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div>
            {workers.sort((a,b) => a.name.localeCompare(b.name)).map(worker => (
              <div key={worker.id} className="flex items-center">
                <div className="sticky left-0 w-32 flex-shrink-0 p-2 border-r border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 truncate bg-white dark:bg-gray-800" title={worker.name}>
                  {worker.name}
                </div>
                {timeline.map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const dayData = workloadData[worker.id]?.find(d => d.date === dateString);
                  const worked = dayData?.workedHours ?? 0;
                  const available = dayData?.availableHours ?? 8;
                  const cellTasks = dayData?.tasks ?? [];
                  const tooltipContent = `${t('workloadHeatmap_worked')}: ${worked.toFixed(1)}h\n${t('workloadHeatmap_available')}: ${available}h\n\n${t('workloadHeatmap_tooltip_tasks', { count: cellTasks.length })}\n${cellTasks.map(t => `- ${t.name}`).join('\n')}`;

                  return (
                    <div
                      key={index}
                      className={`w-10 h-10 flex-shrink-0 border-r border-b border-gray-200 dark:border-gray-700 transition-colors duration-150 flex items-center justify-center ${getHeatmapColor(cellTasks.length)}`}
                      title={tooltipContent}
                    >
                        <span className="text-xs font-bold text-white mix-blend-difference">{cellTasks.length > 0 ? cellTasks.length : ''}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadHeatmap;