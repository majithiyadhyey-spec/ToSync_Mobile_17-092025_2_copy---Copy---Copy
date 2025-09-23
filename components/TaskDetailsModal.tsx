import React, { useState } from 'react';
import { Task, TaskStatus, User, UserRole, Project } from '../types';
import { useFormworkData } from '../context/FormworkDataContext';
import { TASK_STATUS_COLORS } from '../constants';
import XIcon from './icons/XIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import QRCodeDisplayModal from './QRCodeDisplayModal';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';

interface TaskDetailsModalProps {
  task: Task;
  project: Project;
  onClose: () => void;
  workers: User[];
  userRole: UserRole;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, project, onClose, workers, userRole }) => {
  const { updateTask, users, addAuditLog } = useFormworkData();
  const { currentUser } = useAuth();
  const { t, formatDate } = useI18n();
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const canEdit = userRole === UserRole.Administrator || userRole === UserRole.Planner;
  const taskMinDate = project.startDate;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentTask({ ...currentTask, status: e.target.value as TaskStatus });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'startDate' | 'deadline') => {
    setCurrentTask({ ...currentTask, [field]: e.target.value });
  };

  const handleWorkerToggle = (workerId: string) => {
    const assignedWorkerIds = currentTask.assignedWorkerIds.includes(workerId)
      ? currentTask.assignedWorkerIds.filter(id => id !== workerId)
      : [...currentTask.assignedWorkerIds, workerId];
    setCurrentTask({ ...currentTask, assignedWorkerIds });
  };

  const handleSaveChanges = () => {
    setError('');
    if (new Date(currentTask.startDate) > new Date(currentTask.deadline)) {
      setError(t('addTaskModal_error_deadline'));
      return;
    }
    if (new Date(currentTask.startDate) < new Date(project.startDate) || new Date(currentTask.deadline) > new Date(project.endDate)) {
      setError(t('editTaskModal_error_timeline'));
      return;
    }

    updateTask(currentTask);
    if (currentUser) {
        addAuditLog({
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: 'update_task',
            targetType: 'Task',
            targetId: currentTask.id,
            targetName: currentTask.name,
        });
    }
    onClose();
  };

  const inputClasses = "mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white";

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{task.name}</h2>
            <div className="flex items-center gap-4">
              {canEdit && (
                <button
                    onClick={() => setIsQrCodeModalOpen(true)}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
                    aria-label={t('viewQrCode')}
                    title={t('viewQrCode')}
                >
                    <QrCodeIcon className="w-6 h-6" />
                </button>
              )}
              <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
        </div>
        
        <div className="p-6 space-y-6">
          {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('taskDetailsModal_status')}</label>
              {canEdit ? (
                <select
                  value={currentTask.status}
                  onChange={handleStatusChange}
                  className={`mt-1 block w-full p-2.5 rounded-md text-white border-gray-300 dark:border-gray-600 ${TASK_STATUS_COLORS[currentTask.status]}`}
                >
                  {Object.values(TaskStatus).map(status => (
                    <option key={status} value={status}>{t(status)}</option>
                  ))}
                </select>
              ) : (
                <p className={`mt-1 p-2 rounded-md text-white ${TASK_STATUS_COLORS[task.status]}`}>{t(task.status)}</p>
              )}
            </div>
            <div>
                <label htmlFor="numberOfMoldsDetails" className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('numberOfMolds')}</label>
                {canEdit ? (
                    <input
                        id="numberOfMoldsDetails"
                        type="number"
                        value={currentTask.numberOfMolds ?? ''}
                        onChange={(e) => setCurrentTask({ ...currentTask, numberOfMolds: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                        min="1"
                        step="1"
                        className={inputClasses}
                    />
                ) : (
                    <p className="mt-1 p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">{task.numberOfMolds || 'N/A'}</p>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('taskDetailsModal_startDate')}</label>
                {canEdit ? (
                    <input
                        type="date"
                        value={currentTask.startDate}
                        onChange={(e) => handleDateChange(e, 'startDate')}
                        min={taskMinDate}
                        max={project.endDate}
                        className={inputClasses}
                    />
                ) : (
                    <p className="mt-1 text-gray-900 dark:text-white">{formatDate(task.startDate)}</p>
                )}
            </div>
            <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('taskDetailsModal_deadline')}</label>
                {canEdit ? (
                     <input
                        type="date"
                        value={currentTask.deadline}
                        onChange={(e) => handleDateChange(e, 'deadline')}
                        min={currentTask.startDate || taskMinDate}
                        max={project.endDate}
                        className={inputClasses}
                    />
                ) : (
                    <p className="mt-1 text-gray-900 dark:text-white">{formatDate(task.deadline)}</p>
                )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('taskDetailsModal_assignedWorkers')}</label>
            {canEdit ? (
               <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                {workers.map(worker => (
                  <div key={worker.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`worker-${worker.id}`}
                      checked={currentTask.assignedWorkerIds.includes(worker.id)}
                      onChange={() => handleWorkerToggle(worker.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-200 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500"
                    />
                    <label htmlFor={`worker-${worker.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{worker.name}</label>
                  </div>
                ))}
              </div>
            ) : (
                <ul className="mt-1 list-disc list-inside text-gray-900 dark:text-gray-100">
                    {users.filter(w => task.assignedWorkerIds.includes(w.id)).map(w => <li key={w.id}>{w.name}</li>)}
                </ul>
            )}
          </div>
          
          <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('taskDetailsModal_notes')}</label>
              <textarea 
                rows={4}
                readOnly={!canEdit}
                placeholder={canEdit ? t('taskDetailsModal_addNotesPlaceholder') : t('taskDetailsModal_noNotes')}
                className="mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white read-only:bg-gray-200 dark:read-only:bg-gray-600"
                defaultValue={task.notes}
                onChange={(e) => canEdit && setCurrentTask({...currentTask, notes: e.target.value})}
              />
          </div>
        </div>
        
        {canEdit && (
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
                <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('cancel')}</button>
                <button onClick={handleSaveChanges} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">{t('saveChanges')}</button>
            </div>
        )}
      </div>
    </div>
    {isQrCodeModalOpen && (
      <QRCodeDisplayModal
        taskId={task.id}
        taskName={task.name}
        onClose={() => setIsQrCodeModalOpen(false)}
      />
    )}
    </>
  );
};

export default TaskDetailsModal;