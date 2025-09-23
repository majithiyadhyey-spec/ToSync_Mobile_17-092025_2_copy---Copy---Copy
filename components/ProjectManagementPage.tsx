import React, { useState, useMemo, useEffect } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { Project, Task, UserRole, TaskStatus } from '../types';
import { useI18n } from '../context/I18nContext';
import AddProjectModal from './AddProjectModal';
import EditProjectModal from './EditProjectModal';
import AddTaskModal from './AddTaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import ConfirmationModal from './ConfirmationModal';
import ProjectsList from './ProjectsList';
import TasksList from './TasksList';
import PlusIcon from './icons/PlusIcon';
import TasksIcon from './icons/TasksIcon';
import ProjectIcon from './icons/ProjectIcon';
import { useAuth } from '../context/AuthContext';
import SearchIcon from './icons/SearchIcon';

interface ProjectManagementPageProps {
  userRole: UserRole;
}

const ProjectManagementPage: React.FC<ProjectManagementPageProps> = ({ userRole }) => {
  const { activeProjects, activeTasks, workers, deleteProject, deleteTask, addAuditLog } = useFormworkData();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  
  const inputClasses = "block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";


  const filteredProjects = useMemo(() => {
    if (!projectSearchQuery) {
        return activeProjects;
    }
    const lowercasedQuery = projectSearchQuery.toLowerCase();
    return activeProjects.filter(project =>
        project.name.toLowerCase().includes(lowercasedQuery) ||
        project.marking.toLowerCase().includes(lowercasedQuery) ||
        project.client.toLowerCase().includes(lowercasedQuery)
    );
  }, [activeProjects, projectSearchQuery]);

  // When the project list is filtered, deselect any project that is no longer visible.
  useEffect(() => {
    if (selectedProjectId && !filteredProjects.some(p => p.id === selectedProjectId)) {
        setSelectedProjectId(null);
    }
  }, [filteredProjects, selectedProjectId]);
  
  const selectedProject = useMemo(() => {
    return activeProjects.find(p => p.id === selectedProjectId) || null;
  }, [selectedProjectId, activeProjects]);

  const tasksForSelectedProject = useMemo(() => {
    if (!selectedProjectId) return [];
    return activeTasks.filter(t => t.projectId === selectedProjectId);
  }, [selectedProjectId, activeTasks]);

  const filteredTasks = useMemo(() => {
    let tasks = tasksForSelectedProject;
    
    if (taskStatusFilter !== 'all') {
      tasks = tasks.filter(t => t.status === taskStatusFilter);
    }
    
    if (taskSearchQuery) {
        const lowercasedQuery = taskSearchQuery.toLowerCase();
        tasks = tasks.filter(t => t.name.toLowerCase().includes(lowercasedQuery));
    }
    
    return tasks;
  }, [tasksForSelectedProject, taskStatusFilter, taskSearchQuery]);

  const handleSelectProject = (projectId: string) => {
    const newSelectedId = projectId === selectedProjectId ? null : projectId;
    setSelectedProjectId(newSelectedId);
    setTaskStatusFilter('all'); // Reset filter when project changes
  };

  const handleDeleteProject = () => {
    if (projectToDelete && currentUser) {
      if (selectedProjectId === projectToDelete.id) {
        setSelectedProjectId(null);
      }
      addAuditLog({
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'delete_project',
        targetType: 'Project',
        targetId: projectToDelete.id,
        targetName: projectToDelete.name,
      });
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };
  
  const handleDeleteTask = () => {
    if(taskToDelete && currentUser) {
        addAuditLog({
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: 'delete_task',
            targetType: 'Task',
            targetId: taskToDelete.id,
            targetName: taskToDelete.name,
        });
        deleteTask(taskToDelete.id);
        setTaskToDelete(null);
    }
  };

  const canManage = userRole === UserRole.Administrator || userRole === UserRole.Planner;
  const canDelete = userRole === UserRole.Administrator;
  
  return (
    <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('projectManagement_title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 h-full">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"><ProjectIcon className="w-6 h-6" />{t('projects_panel_title')}</h2>
                    {canManage && (
                        <button onClick={() => setIsAddProjectModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors" aria-label={t('addNewProject')}>
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('addNewProject')}</span>
                        </button>
                    )}
                </div>
                <div className="relative">
                    <label htmlFor="project-search" className="sr-only">{t('search')}</label>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="project-search"
                        type="search"
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('searchProjects')}
                        value={projectSearchQuery}
                        onChange={(e) => setProjectSearchQuery(e.target.value)}
                    />
                </div>
                <ProjectsList 
                    projects={filteredProjects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={handleSelectProject}
                    onEditProject={canManage ? setProjectToEdit : undefined}
                    onDeleteProject={canDelete ? setProjectToDelete : undefined}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 h-full">
                 <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2"><TasksIcon className="w-6 h-6" />{t('tasks_panel_title')}</h2>
                    {canManage && selectedProject && (
                        <button onClick={() => setIsAddTaskModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors">
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('addTask')}</span>
                        </button>
                    )}
                </div>
                {selectedProject ? (
                   <>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0 sm:w-1/3">
                             <label htmlFor="task-status-filter" className="sr-only">{t('reports_status')}</label>
                            <select
                                id="task-status-filter"
                                value={taskStatusFilter}
                                onChange={(e) => setTaskStatusFilter(e.target.value as TaskStatus | 'all')}
                                className={inputClasses}
                            >
                                <option value="all">{t('allTasks')}</option>
                                <option value={TaskStatus.Planned}>{t(TaskStatus.Planned)}</option>
                                <option value={TaskStatus.InProgress}>{t(TaskStatus.InProgress)}</option>
                                <option value={TaskStatus.Completed}>{t(TaskStatus.Completed)}</option>
                            </select>
                        </div>
                        <div className="relative flex-grow">
                             <label htmlFor="task-search" className="sr-only">{t('search')}</label>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="task-search"
                                type="search"
                                className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('searchTasks')}
                                value={taskSearchQuery}
                                onChange={(e) => setTaskSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <TasksList
                        tasks={filteredTasks}
                        onEditTask={canManage ? setTaskToEdit : undefined}
                        onDeleteTask={canManage ? setTaskToDelete : undefined}
                    />
                   </>
                ) : (
                    <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                        <p>{t('tasks_panel_prompt')}</p>
                    </div>
                )}
            </div>
        </div>

        {isAddProjectModalOpen && <AddProjectModal onClose={() => setIsAddProjectModalOpen(false)} />}
        {projectToEdit && <EditProjectModal project={projectToEdit} onClose={() => setProjectToEdit(null)} />}
        {projectToDelete && (
            <ConfirmationModal title={t('deleteProjectConfirmationTitle')} onConfirm={handleDeleteProject} onClose={() => setProjectToDelete(null)}>
                <p>{t('deleteProjectConfirmationMessage', { projectName: projectToDelete.name })}</p>
            </ConfirmationModal>
        )}
        
        {isAddTaskModalOpen && selectedProject && <AddTaskModal project={selectedProject} onClose={() => setIsAddTaskModalOpen(false)} />}
        {taskToEdit && (
            <TaskDetailsModal 
              task={taskToEdit} 
              project={activeProjects.find(p => p.id === taskToEdit.projectId)!}
              onClose={() => setTaskToEdit(null)}
              workers={workers}
              userRole={userRole}
            />
        )}
        {taskToDelete && (
             <ConfirmationModal title={t('deleteTaskConfirmationTitle')} onConfirm={handleDeleteTask} onClose={() => setTaskToDelete(null)}>
                <p>{t('deleteTaskConfirmationMessage', { taskName: taskToDelete.name })}</p>
            </ConfirmationModal>
        )}
    </div>
  );
};

export default ProjectManagementPage;