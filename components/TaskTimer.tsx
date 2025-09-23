import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, User, TimerState } from '../types';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import { formatSecondsToHHMMSS } from '../utils/dateUtils';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface TaskTimerProps {
  task: Task;
  worker: User;
}

const TaskTimer: React.FC<TaskTimerProps> = ({ task, worker }) => {
  const { startTimer, pauseTimer, endDayAndAddNotes, users, addAuditLog } = useFormworkData();
  const { t } = useI18n();
  const [isEnteringNotes, setIsEnteringNotes] = useState(false);
  const [notes, setNotes] = useState('');
  
  const totalTime = useMemo(() => 
    Object.values(task.dailyTimeSpent || {}).reduce((acc, workerTimes) => 
      acc + Object.values(workerTimes).reduce((dayAcc, record) => dayAcc + record.time, 0), 0)
  , [task.dailyTimeSpent]);
  
  const myTime = useMemo(() => {
    const workerTimes = task.dailyTimeSpent?.[worker.id];
    if (!workerTimes) return 0;
    return Object.values(workerTimes).reduce((acc, record) => acc + record.time, 0);
  }, [task.dailyTimeSpent, worker.id]);

  const [displayTotalTime, setDisplayTotalTime] = useState(totalTime);
  const [displayMyTime, setDisplayMyTime] = useState(myTime);

  const isRunningByCurrentUser = useMemo(() => !!task.activeTimers?.[worker.id], [task.activeTimers, worker.id]);

  const activeWorkers = useMemo(() => {
    if (!task.activeTimers) return [];
    return Object.keys(task.activeTimers)
      .map(workerId => users.find(u => u.id === workerId)?.name)
      .filter(Boolean) as string[];
  }, [task.activeTimers, users]);

  useEffect(() => {
    if (task.activeTimers && Object.keys(task.activeTimers).length > 0) {
      const intervalId = setInterval(() => {
        const now = Date.now();
        let totalElapsed = 0;
        let myElapsed = 0;

        for (const workerId in task.activeTimers) {
          const startTime = task.activeTimers[workerId].startTime;
          const elapsed = (now - startTime) / 1000;
          totalElapsed += elapsed;
          if (workerId === worker.id) {
            myElapsed = elapsed;
          }
        }
        
        setDisplayTotalTime(totalTime + totalElapsed);
        setDisplayMyTime(myTime + myElapsed);
      }, 1000);

      return () => clearInterval(intervalId);
    } else {
      setDisplayTotalTime(totalTime);
      setDisplayMyTime(myTime);
    }
  }, [task.activeTimers, totalTime, myTime, worker.id]);
  
  const handleStart = () => {
      startTimer(task.id, worker.id);
      addAuditLog({
          actorId: worker.id,
          actorName: worker.name,
          action: 'timer_start',
          targetType: 'Task',
          targetId: task.id,
          targetName: task.name,
      });
  };

  const handlePause = () => {
      pauseTimer(task.id, worker.id);
      addAuditLog({
          actorId: worker.id,
          actorName: worker.name,
          action: 'timer_pause',
          targetType: 'Task',
          targetId: task.id,
          targetName: task.name,
      });
  };

  const handleDayEndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    endDayAndAddNotes(task.id, worker.id, notes.trim());
    addAuditLog({
        actorId: worker.id,
        actorName: worker.name,
        action: 'timer_pause',
        targetType: 'Task',
        targetId: task.id,
        targetName: task.name,
    });
    setIsEnteringNotes(false);
    setNotes('');
  };

  if (isEnteringNotes) {
    return (
      <form onSubmit={handleDayEndSubmit} className="space-y-2">
        <label htmlFor={`notes-${task.id}`} className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            {t('dayEndNotesModal_notesLabel')}
        </label>
        <textarea
            id={`notes-${task.id}`}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full p-2 text-sm rounded-md bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('dayEndNotesModal_prompt')}
            autoFocus
          />
        <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={() => setIsEnteringNotes(false)} className="w-full px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">{t('cancel')}</button>
            <button type="submit" className="w-full px-3 py-2 text-sm bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors">{t('dayEndNotesModal_submit')}</button>
        </div>
      </form>
    );
  }

  if (task.status === TaskStatus.Completed) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-green-500">
          <CheckCircleIcon className="w-5 h-5" />
          {t('Completed')}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('timeTrackingReport_timeSpent')}: {formatSecondsToHHMMSS(displayTotalTime)}
        </div>
      </div>
    );
  }

  const renderButtons = () => {
    if (isRunningByCurrentUser) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handlePause}
            className="w-full px-3 py-2 text-sm bg-orange-500 text-white font-bold rounded-md hover:bg-orange-400 transition-colors"
          >
            {t('timer_pause')}
          </button>
          <button
            onClick={() => setIsEnteringNotes(true)}
            className="w-full px-3 py-2 text-sm bg-red-600 text-white font-bold rounded-md hover:bg-red-500 transition-colors"
          >
            {t('timer_day_end')}
          </button>
        </div>
      );
    } else {
      return (
        <button
          onClick={handleStart}
          className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors"
        >
          {task.timerState === 'paused' ? t('timer_resume') : t('timer_start')}
        </button>
      );
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="flex justify-around items-center text-center font-mono text-gray-800 dark:text-gray-200 py-2">
          <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('my_time')}</div>
              <div className={`text-lg font-semibold mt-1 ${isRunningByCurrentUser ? 'text-green-500 dark:text-green-400' : ''}`}>
                  {formatSecondsToHHMMSS(displayMyTime)}
              </div>
          </div>
           <div className="h-10 border-l border-gray-200 dark:border-gray-700"></div>
          <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('total_time')}</div>
              <div className={`text-lg font-semibold mt-1 ${task.timerState === TimerState.Running ? 'text-green-500 dark:text-green-400' : ''}`}>
                  {formatSecondsToHHMMSS(displayTotalTime)}
              </div>
          </div>
      </div>

      {activeWorkers.length > 0 && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
              <strong>Active:</strong> {activeWorkers.join(', ')}
          </div>
      )}
      
      <div>{renderButtons()}</div>
    </div>
  );
};

export default TaskTimer;