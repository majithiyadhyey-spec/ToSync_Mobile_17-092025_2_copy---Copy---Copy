

import React, { useState, useMemo, useEffect } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { Project, Task, TaskStatus, UserRole } from '../types';
import TaskDetailsModal from './TaskDetailsModal';
import AddProjectModal from './AddProjectModal';
import AddTaskModal from './AddTaskModal';
import ConfirmationModal from './ConfirmationModal';
import ProjectIcon from './icons/ProjectIcon';
import TasksIcon from './icons/TasksIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import EditProjectModal from './EditProjectModal';
import { useI18n } from '../context/I18nContext';
import WorkloadHeatmap from './WorkloadHeatmap';
import TimeTrackingReport from './TimeTrackingReport';
import QRCodeScannerModal from './QRCodeScannerModal';
import { getTextColorForBackground } from '../utils/colorUtils';
import Tooltip from './Tooltip';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { formatDate } from '../utils/dateUtils';
import GridView from './GridView';
import BoardView from './BoardView';
import GridViewIcon from './icons/GridViewIcon';
import BoardViewIcon from './icons/BoardViewIcon';
import { useAuth } from '../context/AuthContext';
import GanttChart from './GanttChart';
import GanttChartIcon from './icons/GanttChartIcon';
import Pagination from './Pagination';
import SearchIcon from './icons/SearchIcon';
// FIX: Import the PlusIcon component to resolve the "Cannot find name 'PlusIcon'" error.
import PlusIcon from './icons/PlusIcon';

interface DashboardProps {
    userRole: UserRole;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  const { activeProjects: projects, activeTasks: tasks, workers, users, deleteProject, endTimer, addAuditLog } = useFormworkData();
  const { currentUser } = useAuth();
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { t } = useI18n();
  const [overallViewMode, setOverallViewMode] = useState<'gantt' | 'board'>('gantt');
  
  // State to track if the view is mobile/tablet.
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Effect to update isMobileView on window resize.
  useEffect(() => {
    const handleResize = () => {
        setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // State for search and pagination
  const [activeProjectSearch, setActiveProjectSearch] = useState('');
  const [finishedProjectSearch, setFinishedProjectSearch] = useState('');
  const [activeProjectCurrentPage, setActiveProjectCurrentPage] = useState(1);
  const [finishedProjectCurrentPage, setFinishedProjectCurrentPage] = useState(1);
  const [activeProjectItemsPerPage, setActiveProjectItemsPerPage] = useState(5);
  const [finishedProjectItemsPerPage, setFinishedProjectItemsPerPage] = useState(5);

  const canManageProjects = userRole === UserRole.Administrator || userRole === UserRole.Planner;
  const canDeleteProjects = userRole === UserRole.Administrator;
  
  const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

  const stats = useMemo(() => {
    return {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      inProgressTasks: tasks.filter(t => t.status === TaskStatus.InProgress).length,
      completedTasks: tasks.filter(t => t.status === TaskStatus.Completed).length,
    };
  }, [projects, tasks]);

  const projectsWithStats = useMemo(() => {
    return projects.map(project => {
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        const total = projectTasks.length;
        
        const completed = projectTasks.filter(t => t.status === TaskStatus.Completed).length;
        
        const stats = {
            total,
            assigned: projectTasks.filter(t => t.assignedWorkerIds.length > 0).length,
            unstarted: projectTasks.filter(t => t.status === TaskStatus.Planned).length,
            inProgress: projectTasks.filter(t => t.status === TaskStatus.InProgress).length,
            completed,
        };

        const assignedWorkerIds = new Set<string>();
        projectTasks.forEach(t => t.assignedWorkerIds.forEach(id => assignedWorkerIds.add(id)));
        const assignedWorkersList = Array.from(assignedWorkerIds).map(id => users.find(w => w.id === id)?.name).filter(Boolean).sort() as string[];
        const unstartedTasksList = projectTasks.filter(t => t.status === TaskStatus.Planned).map(t => t.name).sort();
        const inProgressTasksList = projectTasks.filter(t => t.status === TaskStatus.InProgress).map(t => ({ taskName: t.name, workerNames: t.assignedWorkerIds.map(id => users.find(w => w.id === id)?.name).filter(Boolean).sort() as string[] })).sort((a,b) => a.taskName.localeCompare(b.taskName));
        const completedTasksList = projectTasks.filter(t => t.status === TaskStatus.Completed).map(t => t.name).sort();

        return { project, stats, isFinished: total > 0 && completed === total, tooltipData: { assigned: assignedWorkersList, unstarted: unstartedTasksList, inProgress: inProgressTasksList, completed: completedTasksList } };
    }).sort((a,b) => a.project.name.localeCompare(b.project.name));
  }, [projects, tasks, users]);
  
  const { activeProjects, finishedProjects } = useMemo(() => {
    const active = projectsWithStats.filter(p => !p.isFinished);
    const finished = projectsWithStats.filter(p => p.isFinished);
    return { activeProjects: active, finishedProjects: finished };
  }, [projectsWithStats]);

  // --- Search and Pagination Logic ---

    const searchedActiveProjects = useMemo(() => {
        if (!activeProjectSearch) return activeProjects;
        const query = activeProjectSearch.toLowerCase();
        return activeProjects.filter(pws => 
            pws.project.name.toLowerCase().includes(query) ||
            pws.project.marking.toLowerCase().includes(query) ||
            pws.project.client.toLowerCase().includes(query)
        );
    }, [activeProjects, activeProjectSearch]);

    const paginatedActiveProjects = useMemo(() => {
        const startIndex = (activeProjectCurrentPage - 1) * activeProjectItemsPerPage;
        return searchedActiveProjects.slice(startIndex, startIndex + activeProjectItemsPerPage);
    }, [searchedActiveProjects, activeProjectCurrentPage, activeProjectItemsPerPage]);

    const totalActiveProjectPages = Math.ceil(searchedActiveProjects.length / activeProjectItemsPerPage);

    const searchedFinishedProjects = useMemo(() => {
        if (!finishedProjectSearch) return finishedProjects;
        const query = finishedProjectSearch.toLowerCase();
        return finishedProjects.filter(pws => 
            pws.project.name.toLowerCase().includes(query) ||
            pws.project.marking.toLowerCase().includes(query) ||
            pws.project.client.toLowerCase().includes(query)
        );
    }, [finishedProjects, finishedProjectSearch]);

    const paginatedFinishedProjects = useMemo(() => {
        const startIndex = (finishedProjectCurrentPage - 1) * finishedProjectItemsPerPage;
        return searchedFinishedProjects.slice(startIndex, startIndex + finishedProjectItemsPerPage);
    }, [searchedFinishedProjects, finishedProjectCurrentPage, finishedProjectItemsPerPage]);

    const totalFinishedProjectPages = Math.ceil(searchedFinishedProjects.length / finishedProjectItemsPerPage);

    const handleActiveProjectSearch = (query: string) => {
        setActiveProjectSearch(query);
        setActiveProjectCurrentPage(1);
    };
    const handleFinishedProjectSearch = (query: string) => {
        setFinishedProjectSearch(query);
        setFinishedProjectCurrentPage(1);
    };
    const handleActiveItemsPerPageChange = (size: number) => {
        setActiveProjectItemsPerPage(size);
        setActiveProjectCurrentPage(1);
    };
    const handleFinishedItemsPerPageChange = (size: number) => {
        setFinishedProjectItemsPerPage(size);
        setFinishedProjectCurrentPage(1);
    };

  // --- End Search and Pagination ---
  
  const handleToggleProjectDetails = (projectId: string) => {
    if (isMobileView) return;
    setExpandedProjectId(currentId => currentId === projectId ? null : projectId);
  };
  
  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  const handleDeleteProject = () => {
    if (projectToDelete && currentUser) {
        if (expandedProjectId === projectToDelete.id) setExpandedProjectId(null);
        addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'delete_project', targetType: 'Project', targetId: projectToDelete.id, targetName: projectToDelete.name });
        deleteProject(projectToDelete.id);
        setProjectToDelete(null);
    }
  };

  const handleScanResult = (scannedData: string | null) => {
    setIsScannerOpen(false);
    if (!scannedData || !currentUser) return;
    const task = tasks.find(t => t.id === scannedData);
    if (!task) { alert(t('scannerError_taskNotFound', { taskId: scannedData })); return; }
    if (task.status === TaskStatus.Completed) { alert(t('scannerInfo_taskAlreadyCompleted', { taskName: task.name })); return; }
    endTimer(task.id);
    addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'timer_complete', targetType: 'Task', targetId: task.id, targetName: task.name });
    alert(t('scannerSuccess_taskCompleted', { taskName: task.name }));
  };

  const ProjectDetails: React.FC<{ project: Project }> = ({ project }) => {
    const [viewMode, setViewMode] = useState<'grid' | 'board'>('board');
    const projectTasks = useMemo(() => tasks.filter(t => t.projectId === project.id), [tasks, project.id]);
    
    return (
      <div className="bg-gray-100 dark:bg-gray-900/30 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
           <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div><span className="font-semibold text-gray-600 dark:text-gray-400">{t('taskDetailsModal_startDate')}:</span> <span className="text-gray-800 dark:text-gray-200">{formatDate(project.startDate)}</span></div>
                <div><span className="font-semibold text-gray-600 dark:text-gray-400">{t('addProjectModal_endDate')}:</span> <span className="text-gray-800 dark:text-gray-200">{formatDate(project.endDate)}</span></div>
           </div>
           
           <div className="flex items-center gap-2">
               {canManageProjects && (
                  <button onClick={() => setIsAddTaskModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors" aria-label={t('addTask')}>
                     <PlusIcon className="w-5 h-5" />
                     <span className="hidden sm:inline">{t('addTask')}</span>
                  </button>
               )}
               <div className="flex items-center rounded-md bg-gray-200 dark:bg-gray-700 p-1">
                   <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('gridView')}><GridViewIcon className="w-5 h-5"/></button>
                   <button onClick={() => setViewMode('board')} className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('boardView')}><BoardViewIcon className="w-5 h-5"/></button>
               </div>
           </div>
        </div>
        <div>{viewMode === 'grid' ? <GridView tasks={projectTasks} onTaskClick={setSelectedTask} /> : <BoardView tasks={projectTasks} onTaskClick={setSelectedTask} />}</div>
      </div>
    );
  };
  
  const renderProjectTable = (projectList: typeof projectsWithStats) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left text-gray-600 dark:text-gray-300">
            <thead className="hidden md:table-header-group text-sm text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                <tr>
                    <th scope="col" className="px-4 py-3 min-w-[200px]">{t('reports_project')}</th>
                    <th scope="col" className="px-4 py-3">{t('addProjectModal_marking')}</th>
                    <th scope="col" className="px-4 py-3 min-w-[150px]">{t('addProjectModal_client')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('totalTasks')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('reports_assignedWorkers')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('reports_planned')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('tasksInProgress')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('tasksCompleted')}</th>
                    <th scope="col" className="px-4 py-3"></th>
                    <th scope="col" className="px-4 py-3 w-10"></th>
                </tr>
            </thead>
            <tbody className="block md:table-row-group">
                {projectList.map(({ project, stats, tooltipData }) => (
                    <React.Fragment key={project.id}>
                    <tr onClick={() => handleToggleProjectDetails(project.id)} className={`block md:table-row mb-4 md:mb-0 rounded-lg shadow-md md:shadow-none bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-all duration-200 ${!isMobileView ? 'cursor-pointer' : ''} ${expandedProjectId === project.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 font-bold text-base text-gray-900 dark:text-white border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('reports_project')}</span>{project.name}</td>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('addProjectModal_marking')}</span><span style={{ backgroundColor: project.markingColor, color: getTextColorForBackground(project.markingColor) }} className="px-3 py-1 text-sm font-bold rounded-full">{project.marking}</span></td>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 text-base border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('addProjectModal_client')}</span>{project.client}</td>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 md:text-center text-lg font-bold border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('totalTasks')}</span>{stats.total}</td>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 md:text-center text-blue-600 border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('reports_assignedWorkers')}</span><Tooltip content={tooltipData.assigned.length > 0 && (<div className="text-left"><h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 mb-2 pb-1">{t('reports_assignedWorkers')}</h4><ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200">{tooltipData.assigned.map(name => <li key={name}>{name}</li>)}</ul></div>)}><div><span className="text-lg font-bold">{stats.assigned}</span> <span className="text-sm text-gray-600 dark:text-gray-400">({stats.total > 0 ? Math.round(stats.assigned/stats.total*100) : 0}%)</span></div></Tooltip></td>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 md:text-center text-red-600 border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('reports_planned')}</span><Tooltip content={tooltipData.unstarted.length > 0 && (<div className="text-left"><h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 mb-2 pb-1">{t('reports_planned')}</h4><ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200">{tooltipData.unstarted.map(name => <li key={name}>{name}</li>)}</ul></div>)}><div><span className="text-lg font-bold">{stats.unstarted}</span> <span className="text-sm text-gray-600 dark:text-gray-400">({stats.total > 0 ? Math.round(stats.unstarted/stats.total*100) : 0}%)</span></div></Tooltip></td>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 md:text-center text-green-600 border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('tasksInProgress')}</span><Tooltip content={tooltipData.inProgress.length > 0 && (<div className="text-left"><h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 mb-2 pb-1">{t('tasksInProgress')}</h4><ul className="space-y-2 text-gray-800 dark:text-gray-200">{tooltipData.inProgress.map(item => (<li key={item.taskName}><strong className="block text-gray-900 dark:text-white">{item.taskName}</strong><span className="text-xs pl-2 text-gray-600 dark:text-gray-400">{item.workerNames.join(', ')}</span></li>))}</ul></div>)}><div><span className="text-lg font-bold">{stats.inProgress}</span> <span className="text-sm text-gray-600 dark:text-gray-400">({stats.total > 0 ? Math.round(stats.inProgress/stats.total*100) : 0}%)</span></div></Tooltip></td>
                       <td className="p-4 flex justify-between items-center md:table-cell md:px-4 md:py-3 md:text-center border-b md:border-none dark:border-gray-700"><span className="font-bold text-base text-gray-500 dark:text-gray-400 uppercase md:hidden mr-2">{t('tasksCompleted')}</span><Tooltip content={tooltipData.completed.length > 0 && (<div className="text-left"><h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 mb-2 pb-1">{t('tasksCompleted')}</h4><ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200">{tooltipData.completed.map(name => <li key={name}>{name}</li>)}</ul></div>)}><div><span className="text-lg font-bold">{stats.completed}</span> <span className="text-sm text-gray-600 dark:text-gray-400">({stats.total > 0 ? Math.round(stats.completed/stats.total*100) : 0}%)</span></div></Tooltip></td>
                       <td className="p-4 flex justify-end items-center md:table-cell md:px-4 md:py-3 space-x-1" onClick={e => e.stopPropagation()}>{canManageProjects && <button onClick={() => setProjectToEdit(project)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><EditIcon className="w-5 h-5" /></button>}{canDeleteProjects && <button onClick={() => setProjectToDelete(project)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>}</td>
                       <td className="p-4 flex justify-center items-center md:table-cell md:px-4 md:py-3">
                            {!isMobileView && <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${expandedProjectId === project.id ? 'rotate-180' : ''}`} />}
                       </td>
                    </tr>
                    {!isMobileView && expandedProjectId === project.id && (<tr className="block md:table-row animate-fade-in"><td colSpan={10} className="p-0"><ProjectDetails project={project} /></td></tr>)}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    </div>
  );


  return (
    <div className="space-y-8">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('totalProjects')} value={stats.totalProjects} icon={<ProjectIcon className="w-8 h-8" />} />
        <StatCard title={t('totalTasks')} value={stats.totalTasks} icon={<TasksIcon className="w-8 h-8" />} />
        <StatCard title={t('tasksInProgress')} value={stats.inProgressTasks} icon={<ClockIcon className="w-8 h-8" />} />
        <StatCard title={t('tasksCompleted')} value={stats.completedTasks} icon={<CheckCircleIcon className="w-8 h-8" />} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('activeProjects')}</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:max-w-xs">
                    <label htmlFor="dashboard-project-search" className="sr-only">{t('searchProjects')}</label>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="dashboard-project-search"
                        type="search"
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('searchProjects')}
                        value={activeProjectSearch}
                        onChange={(e) => handleActiveProjectSearch(e.target.value)}
                    />
                </div>
            </div>
          </div>
          {renderProjectTable(paginatedActiveProjects)}
          <Pagination 
            currentPage={activeProjectCurrentPage}
            totalPages={totalActiveProjectPages}
            onPageChange={setActiveProjectCurrentPage}
            itemsPerPage={activeProjectItemsPerPage}
            onItemsPerPageChange={handleActiveItemsPerPageChange}
            totalItems={searchedActiveProjects.length}
            t={t}
            showSearch={false}
          />
      </div>
          
      {finishedProjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('finishedProjects')}</h2>
                <div className="relative w-full sm:max-w-xs">
                    <label htmlFor="dashboard-finished-project-search" className="sr-only">{t('searchProjects')}</label>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="dashboard-finished-project-search"
                        type="search"
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('searchProjects')}
                        value={finishedProjectSearch}
                        onChange={(e) => handleFinishedProjectSearch(e.target.value)}
                    />
                </div>
            </div>
            {renderProjectTable(paginatedFinishedProjects)}
             <Pagination 
                currentPage={finishedProjectCurrentPage}
                totalPages={totalFinishedProjectPages}
                onPageChange={setFinishedProjectCurrentPage}
                itemsPerPage={finishedProjectItemsPerPage}
                onItemsPerPageChange={handleFinishedItemsPerPageChange}
                totalItems={searchedFinishedProjects.length}
                t={t}
                showSearch={false}
              />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hidden lg:block">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('allProjectsView_title')}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('allProjectsView_description')}</p>
              </div>
              <div className="flex items-center rounded-md bg-gray-200 dark:bg-gray-700 p-1">
                  <button onClick={() => setOverallViewMode('gantt')} className={`p-1.5 rounded ${overallViewMode === 'gantt' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('ganttView')}><GanttChartIcon className="w-5 h-5"/></button>
                  <button onClick={() => setOverallViewMode('board')} className={`p-1.5 rounded ${overallViewMode === 'board' ? 'bg-white dark:bg-gray-800 text-blue-500' : 'text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50'}`} title={t('boardView')}><BoardViewIcon className="w-5 h-5"/></button>
              </div>
          </div>
          {overallViewMode === 'gantt' && <GanttChart projects={projects} />}
          {overallViewMode === 'board' && <BoardView tasks={tasks} onTaskClick={setSelectedTask} />}
      </div>

      <div className="hidden lg:block">
        <WorkloadHeatmap projects={projects} tasks={tasks} workers={workers} />
      </div>
      <div className="hidden lg:block">
        <TimeTrackingReport projects={projects} tasks={tasks} />
      </div>

      {selectedTask && (<TaskDetailsModal task={selectedTask} project={projectsById.get(selectedTask.projectId)!} onClose={handleCloseModal} workers={workers} userRole={userRole} />)}
      {isAddProjectModalOpen && (<AddProjectModal onClose={() => setIsAddProjectModalOpen(false)} />)}
      {isAddTaskModalOpen && projectsById.get(expandedProjectId || '') && (<AddTaskModal project={projectsById.get(expandedProjectId || '')!} onClose={() => setIsAddTaskModalOpen(false)} />)}
      {projectToEdit && (<EditProjectModal project={projectToEdit} onClose={() => setProjectToEdit(null)} />)}
      {projectToDelete && (<ConfirmationModal title={t('deleteProjectConfirmationTitle')} onConfirm={handleDeleteProject} onClose={() => setProjectToDelete(null)}><p>{t('deleteProjectConfirmationMessage', { projectName: projectToDelete.name })}</p></ConfirmationModal>)}
      {isScannerOpen && (<QRCodeScannerModal onScan={handleScanResult} onClose={() => setIsScannerOpen(false)} />)}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-4">
    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full text-blue-500 dark:text-blue-400">{icon}</div>
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default Dashboard;