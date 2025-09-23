import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { User } from '../types';
import ProjectIcon from './icons/ProjectIcon';

interface TwoFactorAuthPromptProps {
  user: User;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  error?: string | null;
  isLoading?: boolean;
}

const TwoFactorAuthPrompt: React.FC<TwoFactorAuthPromptProps> = ({ user, onVerify, onCancel, error, isLoading }) => {
  const { t } = useI18n();
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await onVerify(code);
    } catch(e) {
        // Error is handled by the parent context
        setCode('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm p-6 sm:p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="text-center">
          <ProjectIcon className="w-16 h-16 mx-auto text-blue-500" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{t('twoFactor_prompt_title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('twoFactor_prompt_instructions')}</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-600 p-3 rounded-md" role="alert">
                <p className="text-sm">{error}</p>
             </div>
          )}
          <div>
            <label htmlFor="2fa-code" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              {t('twoFactor_prompt_label')}
            </label>
            <input
              id="2fa-code"
              name="2fa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-4">
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
            >
              {isLoading ? t('loggingIn') : t('twoFactor_prompt_verify_button')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuthPrompt;
