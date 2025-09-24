import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { Project, Task, User, UserRole } from '../types';
import XIcon from './icons/XIcon';
import TasksIcon from './icons/TasksIcon';
import { useI18n } from '../context/I18nContext';
import { TASK_DEFINITIONS } from '../constants';
import WorkloadHeatmap from './WorkloadHeatmap';
import QRCodeDisplayModal from './QRCodeDisplayModal';
import { useAuth } from '../context/AuthContext';

interface AddTaskModalProps {
  project: Project;
  onClose: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ project, onClose }) => {
  const { addTask, workers, tasks: allTasks, addAuditLog } = useFormworkData();
  const { currentUser } = useAuth();
  const { t } = useI18n();

  // Form State
  const [taskType, setTaskType] = useState<string>('');
  const [taskDefinitionId, setTaskDefinitionId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [numberOfMolds, setNumberOfMolds] = useState('');
  const [productionHours, setProductionHours] = useState('');
  
  // Worker Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const workerSearchRef = useRef<HTMLDivElement>(null);


  // New state to hold the created task for QR code display
  const [newlyCreatedTask, setNewlyCreatedTask] = useState<Task | null>(null);

  // Derived Values
  const taskTypes = useMemo(() => [...new Set(TASK_DEFINITIONS.map(def => def.taskType))], []);
  
  const filteredTaskDefinitions = useMemo(() => {
    if (!taskType) return [];
    return TASK_DEFINITIONS.filter(def => def.taskType === taskType);
  }, [taskType]);

  const selectedTaskDefinition = useMemo(() => {
    if (!taskDefinitionId) return null;
    return TASK_DEFINITIONS.find(def => def.id === taskDefinitionId) || null;
  }, [taskDefinitionId]);

  useEffect(() => {
    if (selectedTaskDefinition) {
      setProductionHours(String(selectedTaskDefinition.baseProductionHours));
    } else {
      setProductionHours('');
    }
  }, [selectedTaskDefinition]);

  const { suggestedWorkers, availableWorkers } = useMemo(() => {
    if (!selectedTaskDefinition || !deadline || !productionHours) {
      return { suggestedWorkers: [], availableWorkers: workers };
    }
    const deadlineDate = new Date(deadline);
    const customProductionHours = parseFloat(productionHours);
    if (isNaN(customProductionHours) || customProductionHours <= 0) {
        return { suggestedWorkers: [], availableWorkers: workers };
    }
    const startDate = new Date(deadlineDate.getTime() - customProductionHours * 3600 * 1000);

    const available: typeof workers = [];
    const suggested: typeof workers = [];

    workers.forEach(worker => {
      const isBusy = allTasks.some(task => {
        if (!task.assignedWorkerIds.includes(worker.id)) return false;
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.deadline);
        return startDate < taskEnd && deadlineDate > taskStart;
      });

      if (!isBusy) {
        available.push(worker);
        const hasRequiredSkills = selectedTaskDefinition.requiredSkills.every(skill => worker.skills?.includes(skill));
        if (hasRequiredSkills || selectedTaskDefinition.requiredSkills.length === 0) {
          suggested.push(worker);
        }
      }
    });

    return { suggestedWorkers: suggested, availableWorkers: available };
  }, [selectedTaskDefinition, deadline, workers, allTasks, productionHours]);


  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isDropdownOpen) {
        setIsDropdownOpen(true);
    }
  };

  const handleSelectWorker = (workerId: string) => {
      if (!assignedWorkerIds.includes(workerId)) {
          setAssignedWorkerIds(prev => [...prev, workerId]);
      }
      setSearchQuery('');
      setIsDropdownOpen(false);
  };
  
  const handleRemoveWorker = (workerId: string) => {
      setAssignedWorkerIds(prev => prev.filter(id => id !== workerId));
  };
  
  // Click outside handler for worker search dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (workerSearchRef.current && !workerSearchRef.current.contains(event.target as Node)) {
              setIsDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const filteredWorkersForDropdown = useMemo(() => {
      const unassignedAvailable = availableWorkers.filter(worker => !assignedWorkerIds.includes(worker.id));
      
      if (!searchQuery) {
          const suggestedUnassigned = suggestedWorkers.filter(w => !assignedWorkerIds.includes(w.id));
          const otherAvailable = unassignedAvailable.filter(w => !suggestedUnassigned.some(sw => sw.id === w.id));
          return [...suggestedUnassigned, ...otherAvailable];
      }
      
      return unassignedAvailable.filter(worker => 
          worker.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [searchQuery, availableWorkers, suggestedWorkers, assignedWorkerIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
        setError("You must be logged in to create a task.");
        return;
    }

    try {
        if (!selectedTaskDefinition) {
          setError(t('newTask_error_noEnumerator'));
          return;
        }
        if (!deadline) {
          setError(t('newTask_error_noDeadline'));
          return;
        }
        if (assignedWorkerIds.length === 0) {
          setError(t('newTask_error_noWorkers'));
          return;
        }
        
        const customProductionHours = parseFloat(productionHours);
        if (isNaN(customProductionHours) || customProductionHours <= 0) {
            setError(t('newTask_error_invalidTime'));
            return;
        }
        
        const deadlineDate = new Date(deadline);
        const startDate = new Date(deadlineDate.getTime() - customProductionHours * 3600 * 1000);

        if (startDate < new Date(project.startDate) || deadlineDate > new Date(project.endDate)) {
            setError(t('addTaskModal_error_timeline'));
            return;
        }
        
        const newTask = await addTask({
            name: selectedTaskDefinition.name,
            projectId: project.id,
            startDate: startDate.toISOString(),
            deadline: deadlineDate.toISOString(),
            assignedWorkerIds,
            notes: description.trim(),
            numberOfMolds: numberOfMolds ? parseInt(numberOfMolds, 10) : undefined,
            actorId: currentUser.id,
        });

        addAuditLog({
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: 'create_task',
            targetType: 'Task',
            targetId: newTask.id,
            targetName: newTask.name,
        });

        // Push notification functionality temporarily disabled
        // TODO: Re-enable when backend API is properly configured
        console.log('Task created successfully:', newTask.name);

        setNewlyCreatedTask(newTask);
    } catch (err: any) {
        console.error("Failed to create task:", err);
        setError(err.message || "An unexpected error occurred while saving the task.");
    }
  };
  
  const labelClasses = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1";
  const inputClasses = "mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed";

  if (newlyCreatedTask) {
    return (
      <QRCodeDisplayModal
        taskId={newlyCreatedTask.id}
        taskName={newlyCreatedTask.name}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
             <div className="flex items-center gap-3">
                <TasksIcon className="w-7 h-7 text-blue-500" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('TASK_title')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('addTaskModal_title', {projectName: project.name})}</p>
                </div>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('scannerModal_close')}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto flex-grow">
            {/* Left Column: Task Details */}
            <div className="space-y-6">
                <div>
                    <label htmlFor="taskType" className={labelClasses}>{t('newTask_taskType')}</label>
                    <select id="taskType" value={taskType} onChange={e => { setTaskType(e.target.value); setTaskDefinitionId(''); }} className={inputClasses}>
                        <option value="">{t('newTask_selectTaskType')}</option>
                        {taskTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="taskEnumerator" className={labelClasses}>{t('newTask_taskEnumerator')}</label>
                    <select id="taskEnumerator" value={taskDefinitionId} onChange={e => setTaskDefinitionId(e.target.value)} className={inputClasses} disabled={!taskType}>
                        <option value="">{t('newTask_selectEnumerator')}</option>
                        {filteredTaskDefinitions.map(def => <option key={def.id} value={def.id}>{def.name} (C: {def.complexity})</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="description" className={labelClasses}>{t('newTask_description')}</label>
                    <textarea id="description" rows={3} placeholder={t('newTask_descriptionPlaceholder')} className={`${inputClasses} resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="productionTime" className={labelClasses}>{t('newTask_productionTime')}</label>
                        <input id="productionTime" type="number" value={productionHours} onChange={e => setProductionHours(e.target.value)} className={inputClasses} disabled={!taskDefinitionId} min="0.1" step="0.1" required />
                    </div>
                    <div>
                        <label htmlFor="numberOfMolds" className={labelClasses}>{t('numberOfMolds')}</label>
                        <input id="numberOfMolds" type="number" value={numberOfMolds} onChange={e => setNumberOfMolds(e.target.value)} placeholder="e.g., 5" className={inputClasses} min="1" step="1" />
                    </div>
                </div>
                <div>
                    <label htmlFor="deadline" className={labelClasses}>{t('newTask_finishBy')}</label>
                    <input id="deadline" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputClasses} min={`${project.startDate}T00:00`} max={`${project.endDate}T23:59`} />
                </div>
                {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{error}</div>}
            </div>
            
            {/* Right Column: Worker Assignment */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('newTask_assignAndSchedule')}</h3>
                    {/* Search Component */}
                    <div className="relative" ref={workerSearchRef}>
                        <label htmlFor="workerSearch" className={labelClasses}>{t('taskDetailsModal_assignedWorkers')}</label>
                        <input
                            id="workerSearch"
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => setIsDropdownOpen(true)}
                            placeholder={t('searchWorkerPlaceholder')}
                            className={inputClasses}
                            autoComplete="off"
                        />
                        {isDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                <ul className="py-1">
                                    {filteredWorkersForDropdown.length > 0 ? (
                                        filteredWorkersForDropdown.map(worker => (
                                            <li key={worker.id} onClick={() => handleSelectWorker(worker.id)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex justify-between items-center">
                                                <span>{worker.name}</span>
                                                {suggestedWorkers.some(sw => sw.id === worker.id) && <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{t('newTask_workerSuggestion')}</span>}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No available workers found.</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                    
                    {/* Selected Workers Display */}
                    {assignedWorkerIds.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                            <div className="flex flex-wrap gap-2">
                                {assignedWorkerIds.map(workerId => {
                                    const worker = workers.find(w => w.id === workerId);
                                    if (!worker) return null;
                                    return (
                                        <div key={workerId} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-1 rounded-full animate-fade-in">
                                            <span>{worker.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveWorker(workerId)}
                                                className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                                aria-label={`Remove ${worker.name}`}
                                            >
                                                <XIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('workloadHeatmap_title')}</h3>
                    <div className="h-64 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                        <WorkloadHeatmap
                            project={project}
                            projects={[project]}
                            tasks={allTasks}
                            workers={workers.filter(w => assignedWorkerIds.includes(w.id))}
                        />
                    </div>
                </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition font-semibold">{t('cancel')}</button>
            <button type="submit" className="px-6 py-2.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition font-semibold shadow-md hover:shadow-lg">{t('newTask_confirmTask')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;