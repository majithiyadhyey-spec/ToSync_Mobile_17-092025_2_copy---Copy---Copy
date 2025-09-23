import React from 'react';
import { useTheme } from '../context/ThemeContext';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import { useI18n } from '../context/I18nContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <div className="flex items-center p-1 rounded-full bg-gray-100 dark:bg-gray-700">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-full transition-colors ${
          theme === 'light' ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        aria-label={t('theme_light')}
        title={t('theme_light')}
      >
        <SunIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-full transition-colors ${
          theme === 'dark' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        aria-label={t('theme_dark')}
        title={t('theme_dark')}
      >
        <MoonIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ThemeSwitcher;
