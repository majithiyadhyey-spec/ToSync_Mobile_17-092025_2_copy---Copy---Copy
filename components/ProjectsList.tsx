import React from 'react';
import { Project } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import { getTextColorForBackground } from '../utils/colorUtils';
import { useI18n } from '../context/I18nContext';

interface ProjectsListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, selectedProjectId, onSelectProject, onEditProject, onDeleteProject }) => {
    const { t, formatDate } = useI18n();

    if (projects.length === 0) {
        return <div className="text-center text-gray-500 dark:text-gray-400 p-8">{t('selectProject')}</div>;
    }

    return (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            {projects.sort((a,b) => a.name.localeCompare(b.name)).map(project => (
                <div 
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${selectedProjectId === project.id ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                >
                    <div className="flex-grow flex items-center gap-3 overflow-hidden w-full">
                        <span style={{ backgroundColor: project.markingColor, color: getTextColorForBackground(project.markingColor) }} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-sm font-bold rounded-full">{project.marking}</span>
                        <div className="truncate">
                            <p className="font-semibold text-gray-900 dark:text-white truncate" title={project.name}>{project.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={project.client}>{project.client}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto flex-shrink-0 flex items-center justify-end gap-1">
                        {onEditProject && <button onClick={(e) => { e.stopPropagation(); onEditProject(project); }} className="p-2 rounded-full text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600"><EditIcon className="w-4 h-4" /></button>}
                        {onDeleteProject && <button onClick={(e) => { e.stopPropagation(); onDeleteProject(project); }} className="p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectsList;