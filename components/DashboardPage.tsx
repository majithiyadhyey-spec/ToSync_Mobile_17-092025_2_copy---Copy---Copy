
import React from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { TaskStatus } from '../types';
import { useI18n } from '../context/I18nContext';
import ProjectIcon from './icons/ProjectIcon';
import TasksIcon from './icons/TasksIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full text-blue-500 dark:text-blue-400">{icon}</div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
    const { activeProjects, activeTasks } = useFormworkData();
    const { t } = useI18n();

    const stats = {
      totalProjects: activeProjects.length,
      totalTasks: activeTasks.length,
      inProgressTasks: activeTasks.filter(t => t.status === TaskStatus.InProgress).length,
      completedTasks: activeTasks.filter(t => t.status === TaskStatus.Completed).length,
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard_overview')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('totalProjects')} value={stats.totalProjects} icon={<ProjectIcon className="w-8 h-8" />} />
                <StatCard title={t('totalTasks')} value={stats.totalTasks} icon={<TasksIcon className="w-8 h-8" />} />
                <StatCard title={t('tasksInProgress')} value={stats.inProgressTasks} icon={<ClockIcon className="w-8 h-8" />} />
                <StatCard title={t('tasksCompleted')} value={stats.completedTasks} icon={<CheckCircleIcon className="w-8 h-8" />} />
            </div>
        </div>
    );
}

export default DashboardPage;
