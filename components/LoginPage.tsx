import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import ProjectIcon from './icons/ProjectIcon';
import * as api from '../api';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgotPassword'>('login');
  
  // State for the new forgot password flow
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(t('loginFailed'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setMessage(null);
      
      if (newPassword !== confirmPassword) {
          setError(t('passwords_no_match'));
          return;
      }
      
      setIsLoading(true);
      try {
        await api.updateUserPasswordByEmail(resetEmail, newPassword);
        setMessage(t('password_reset_success'));
        setView('login');
      } catch (err: any) {
        setError(t('password_reset_failed'));
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm p-6 sm:p-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="text-center">
          <ProjectIcon className="w-16 h-16 mx-auto text-blue-500" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{t('appTitle')}</h1>
           <p className="mt-2 text-gray-600 dark:text-gray-400">
            {view === 'login' ? t('loginPrompt') : t('reset_password')}
           </p>
        </div>

        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-600 p-3 rounded-md" role="alert">
              <p className="text-sm">{error}</p>
            </div>
        )}
        {message && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-600 p-3 rounded-md" role="alert">
              <p className="text-sm">{message}</p>
            </div>
        )}

        {view === 'login' ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                {t('username')}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={25}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={30}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="text-left mt-2">
                <button
                  type="button"
                  onClick={() => { setView('forgotPassword'); setError(null); setMessage(null); }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  {t('forgot_password')}
                </button>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
              >
                {isLoading ? t('loggingIn') : t('login')}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div>
                <label htmlFor="reset-email" className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t('email')}</label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
               <div>
                <label htmlFor="new-password"className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t('new_password')}</label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="confirm-password"className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">{t('confirm_password')}</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !resetEmail || !newPassword}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
              >
                {isLoading ? t('loading') : t('reset_password')}
              </button>
            </form>
            <div className="mt-4 text-center text-sm">
                <button onClick={() => { setView('login'); setError(null); setMessage(null); }} className="font-medium text-blue-600 hover:text-blue-500">
                    {t('back_to_login')}
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;