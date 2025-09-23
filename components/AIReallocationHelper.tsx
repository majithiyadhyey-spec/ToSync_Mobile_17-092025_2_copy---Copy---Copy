import React, { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Project, Task, User } from '../types';
import { useI18n } from '../context/I18nContext';
import SparklesIcon from './icons/SparklesIcon';
import { useFormworkData } from '../context/FormworkDataContext';

interface AIReallocationHelperProps {
  project: Project;
  tasks: Task[];
  workers: User[];
}

type Strategy = 'balance' | 'skill' | 'speed';
interface Suggestion {
  taskId: string;
  fromWorkerId: string;
  toWorkerId: string;
  reason: string;
}

const AIReallocationHelper: React.FC<AIReallocationHelperProps> = ({ project, tasks, workers }) => {
  const { t } = useI18n();
  const { workers: allWorkers, activeTasks: allTasks } = useFormworkData();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [strategy, setStrategy] = useState<Strategy>('balance');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const workerOptions = useMemo(() => {
    return workers.filter(w => tasks.some(t => t.assignedWorkerIds.includes(w.id)));
  }, [workers, tasks]);

  const getWorkerName = (id: string) => allWorkers.find(w => w.id === id)?.name || 'Unknown';
  const getTaskName = (id: string) => allTasks.find(t => t.id === id)?.name || 'Unknown';

  const handleGetSuggestions = async () => {
    if (!selectedWorkerId) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const workload = workers.map(w => ({
          workerId: w.id,
          name: w.name,
          taskCount: tasks.filter(t => t.assignedWorkerIds.includes(w.id)).length,
      }));

      const prompt = `You are a project management assistant for a construction formwork company. Your task is to suggest reallocations for tasks based on a given strategy.

      **Project Context:**
      - Project: ${project.name} (ID: ${project.id})
      - Tasks in this project: ${JSON.stringify(tasks.map(({id, name, assignedWorkerIds, startDate, deadline}) => ({id, name, assignedWorkerIds, startDate, deadline})))}
      - Workers in this project: ${JSON.stringify(workers.map(({id, name, skills}) => ({id, name, skills})))}
      - Current workload for each worker: ${JSON.stringify(workload)}

      **Reallocation Request:**
      - Strategy: "${strategy}"
      - Worker to reallocate tasks from: "${workers.find(w=>w.id === selectedWorkerId)?.name}" (ID: ${selectedWorkerId})

      **Your Task:**
      Based on the selected strategy, analyze the tasks assigned to the selected worker and suggest reallocations to other workers on the project.
      - If strategy is "balance": Find tasks to move to workers with fewer tasks to even out the workload.
      - If strategy is "skill": Find tasks that could be better handled by another worker with matching skills who is not overloaded.
      - If strategy is "speed": Find tasks that can be moved to workers with the lightest current workload to get them done sooner.

      Provide your response as a JSON array of objects. Do not suggest reassigning a task to the same worker. Only suggest reallocations for tasks currently assigned to the selected "from" worker. If no suggestions are logical, return an empty array.`;
      
      const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            taskId: { type: Type.STRING, description: "The ID of the task to be moved." },
            fromWorkerId: { type: Type.STRING, description: "The ID of the worker the task is currently assigned to." },
            toWorkerId: { type: Type.STRING, description: "The ID of the worker the task should be moved to." },
            reason: { type: Type.STRING, description: "A brief reason for the suggestion." },
          },
          required: ['taskId', 'fromWorkerId', 'toWorkerId', 'reason'],
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      
      const jsonResponse = JSON.parse(response.text);
      setSuggestions(jsonResponse);

    } catch (err) {
      console.error("AI suggestion generation failed:", err);
      setError(t('aiReallocationHelper_error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const inputClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mt-8">
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="w-7 h-7 text-blue-500"/>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('aiReallocationHelper_title')}</h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('aiReallocationHelper_description')}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select value={selectedWorkerId} onChange={e => setSelectedWorkerId(e.target.value)} className={inputClasses} aria-label={t('aiReallocationHelper_selectWorker')}>
          <option value="">{t('aiReallocationHelper_selectWorker')}</option>
          {workerOptions.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select value={strategy} onChange={e => setStrategy(e.target.value as Strategy)} className={inputClasses} aria-label={t('aiReallocationHelper_selectStrategy')}>
          <option value="balance">{t('aiReallocationHelper_strategy_balance')}</option>
          <option value="skill">{t('aiReallocationHelper_strategy_skill')}</option>
          <option value="speed">{t('aiReallocationHelper_strategy_speed')}</option>
        </select>
        <button
          onClick={handleGetSuggestions}
          disabled={!selectedWorkerId || isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors disabled:bg-blue-400 dark:disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {isLoading ? t('aiReallocationHelper_loading') : t('aiReallocationHelper_getSuggestions')}
        </button>
      </div>
      
      {error && <p className="text-red-500 dark:text-red-400 text-center mt-4">{error}</p>}

      {isLoading && (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          <SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-blue-500 mb-4" />
          {t('aiReallocationHelper_loading')}
        </div>
      )}
      
      {!isLoading && suggestions.length > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('aiReallocationHelper_suggestionsTitle')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="hidden md:table-header-group text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3">{t('aiReallocationHelper_table_task')}</th>
                  <th className="px-6 py-3">{t('aiReallocationHelper_table_from')}</th>
                  <th className="px-6 py-3">{t('aiReallocationHelper_table_to')}</th>
                  <th className="px-6 py-3">{t('aiReallocationHelper_table_reason')}</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {suggestions.map((s, i) => (
                  <tr key={i} className="block md:table-row mb-4 md:mb-0 rounded-lg shadow-md md:shadow-none bg-white dark:bg-gray-800 md:border-b md:dark:border-gray-700">
                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 md:font-medium text-gray-900 dark:text-white border-b md:border-none dark:border-gray-700">
                      <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('aiReallocationHelper_table_task')}</span>
                      <span className="text-right">{getTaskName(s.taskId)}</span>
                    </td>
                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 border-b md:border-none dark:border-gray-700">
                      <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('aiReallocationHelper_table_from')}</span>
                      <span className="text-right">{getWorkerName(s.fromWorkerId)}</span>
                    </td>
                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4 border-b md:border-none dark:border-gray-700">
                      <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('aiReallocationHelper_table_to')}</span>
                      <span className="text-right">{getWorkerName(s.toWorkerId)}</span>
                    </td>
                    <td className="p-4 flex justify-between items-center md:table-cell md:px-6 md:py-4">
                      <span className="font-bold text-sm text-gray-500 dark:text-gray-400 uppercase md:hidden">{t('aiReallocationHelper_table_reason')}</span>
                      <span className="text-right text-wrap">{s.reason}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !error && suggestions.length === 0 && selectedWorkerId && (
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
           {t('aiReallocationHelper_noSuggestions')}
        </div>
      )}
    </div>
  );
};

export default AIReallocationHelper;