
import React, { useState, useEffect } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import { useI18n } from '../context/I18nContext';
import MicrosoftTeamsIcon from './icons/MicrosoftTeamsIcon';
import ConfirmationModal from './ConfirmationModal';
import { TeamsIntegrationSettings } from '../types';
import { sendTestNotification } from '../utils/teamsNotifier';
import TrashIcon from './icons/TrashIcon';

const TeamsIntegration: React.FC = () => {
  const { integrations, updateTeamsSettings } = useFormworkData();
  const { t } = useI18n();

  const [settings, setSettings] = useState<TeamsIntegrationSettings>(integrations.teams);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false);

  useEffect(() => {
    setSettings(integrations.teams);
  }, [integrations.teams]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTeamsSettings(settings);
    showFeedback('success', t('teams_settings_saved'));
  };

  const handleTest = async () => {
    if (!settings.webhookUrl) return;
    const success = await sendTestNotification(settings.webhookUrl);
    if (success) {
      showFeedback('success', t('teams_test_sent'));
    } else {
      showFeedback('error', t('teams_test_error_network'));
    }
  };

  const handleDisconnect = () => {
    updateTeamsSettings({
      webhookUrl: '',
      notifications: {
        taskCreated: true,
        taskInProgress: true,
        taskCompleted: true,
      },
    });
    setIsConfirmingDisconnect(false);
  };
  
  const showFeedback = (type: 'success' | 'error', message: string) => {
      setFeedback({ type, message });
      setTimeout(() => setFeedback(null), 4000);
  };

  const labelClasses = "font-medium text-gray-700 dark:text-gray-300";
  const inputClasses = "mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-full">
        <div className="flex items-center gap-3 mb-2">
          <MicrosoftTeamsIcon className="w-7 h-7" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('teams_title')}</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('teams_description')}</p>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="webhookUrl" className={labelClasses}>{t('teams_webhookUrl_label')}</label>
            <input
              id="webhookUrl"
              type="password"
              value={settings.webhookUrl}
              onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
              className={inputClasses}
              placeholder={t('teams_webhookUrl_placeholder')}
            />
          </div>

          <div>
            <h3 className={labelClasses}>{t('teams_notification_settings')}</h3>
            <div className="mt-2 space-y-2 rounded-md bg-gray-100 dark:bg-gray-900/50 p-4">
              <Toggle
                id="taskCreated"
                label={t('teams_notify_taskCreated')}
                checked={settings.notifications.taskCreated}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, taskCreated: e.target.checked } })}
              />
              <Toggle
                id="taskInProgress"
                label={t('teams_notify_taskInProgress')}
                checked={settings.notifications.taskInProgress}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, taskInProgress: e.target.checked } })}
              />
              <Toggle
                id="taskCompleted"
                label={t('teams_notify_taskCompleted')}
                checked={settings.notifications.taskCompleted}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, taskCompleted: e.target.checked } })}
              />
            </div>
          </div>
          
          <div className="h-6">
            {feedback && (
              <p className={`text-sm text-center font-semibold ${feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {feedback.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {settings.webhookUrl && (
              <button
                type="button"
                onClick={() => setIsConfirmingDisconnect(true)}
                className="w-full sm:w-auto p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 transition-colors"
                title={t('teams_disconnect')}
              >
                <TrashIcon className="w-5 h-5"/>
              </button>
            )}
            <div className="flex-grow flex flex-col sm:flex-row items-center gap-4 w-full">
              <button
                type="button"
                onClick={handleTest}
                disabled={!settings.webhookUrl}
                className="w-full flex-1 px-4 py-2 bg-gray-600 text-white font-bold rounded-md hover:bg-gray-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t('teams_test')}
              </button>
              <button
                type="submit"
                className="w-full flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors text-sm"
              >
                {t('teams_save')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {isConfirmingDisconnect && (
        <ConfirmationModal
          title={t('teams_disconnect_confirm_title')}
          onConfirm={handleDisconnect}
          onClose={() => setIsConfirmingDisconnect(false)}
        >
          <p>{t('teams_disconnect_confirm_message')}</p>
        </ConfirmationModal>
      )}
    </>
  );
};

interface ToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Toggle: React.FC<ToggleProps> = ({ id, label, checked, onChange }) => (
  <label htmlFor={id} className="flex items-center justify-between cursor-pointer">
    <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>
    <div className="relative">
      <input type="checkbox" id={id} className="sr-only" checked={checked} onChange={onChange} />
      <div className={`block w-10 h-6 rounded-full ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
    </div>
  </label>
);

export default TeamsIntegration;