

import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import XIcon from './icons/XIcon';
import DatabaseIcon from './icons/DatabaseIcon';

interface EncryptionPasswordModalProps {
  mode: 'encrypt' | 'decrypt';
  onClose: () => void;
  onSubmit: (password: string) => void;
}

const EncryptionPasswordModal: React.FC<EncryptionPasswordModalProps> = ({ mode, onClose, onSubmit }) => {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'encrypt' && password !== confirmPassword) {
      setError(t('encryptBackup_passwordsNoMatch'));
      return;
    }
    
    if(!password.trim()){
      return;
    }

    onSubmit(password);
  };

  const isEncryptMode = mode === 'encrypt';
  const title = isEncryptMode ? t('encryptBackup_title') : t('decryptBackup_title');
  const prompt = isEncryptMode ? t('encryptBackup_prompt') : t('decryptBackup_prompt');
  const submitText = isEncryptMode ? t('encryptBackup_submit') : t('decryptBackup_submit');

  const inputClasses = "mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[70] p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <DatabaseIcon className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('close')}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{prompt}</p>
            {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{error}</div>}
            
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('encryptBackup_password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                required
                autoFocus
              />
            </div>
            
            {isEncryptMode && (
              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('encryptBackup_confirmPassword')}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClasses}
                  required
                />
              </div>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-4 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">{submitText}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EncryptionPasswordModal;