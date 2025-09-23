import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import InstallIcon from './icons/InstallIcon';
import { User, UserRole } from '../types';
import BarcodeIcon from './icons/BarcodeIcon';
import GlobeAltIcon from './icons/GlobeAltIcon';
import ThemeSwitcher from './ThemeSwitcher';
import UserGroupIcon from './icons/UserGroupIcon';
import MenuIcon from './icons/MenuIcon';
import LogoutIcon from './icons/LogoutIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';

interface HeaderProps {
    currentUser: User | null;
    currentRole: UserRole | null;
    onLogout: () => void;
    onInstallClick: () => void;
    showInstallButton: boolean;
    showScanButton?: boolean;
    onScanClick?: () => void;
    onMenuClick: () => void;
    pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ currentUser, currentRole, onLogout, onInstallClick, showInstallButton, showScanButton, onScanClick, onMenuClick, pageTitle }) => {
  const { locale, setLocale, t } = useI18n();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (!currentUser || !currentRole) {
    return null; // Should not happen if app logic is correct
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex items-center space-x-3">
         <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden">
            <MenuIcon className="w-6 h-6" />
         </button>
         <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        {showInstallButton && (
            <button
                onClick={onInstallClick}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                title="Install App"
            >
                <InstallIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Install</span>
            </button>
        )}
        {showScanButton && (
            <button
              onClick={onScanClick}
              className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
              title={t('scanQrCode')}
            >
                <BarcodeIcon className="w-5 h-5" />
            </button>
        )}

        {/* Language Selector */}
        <div className="relative">
             <GlobeAltIcon className="w-5 h-5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
             <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as any)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-9 appearance-none"
                aria-label={t('language')}
              >
                <option value="en">{t('lang_en')}</option>
                <option value="cs">{t('lang_cs')}</option>
                <option value="hi">{t('lang_hi')}</option>
                <option value="gu">{t('lang_gu')}</option>
            </select>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 text-left p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-300">
               <UserGroupIcon className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{currentUser.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">{t(currentRole)}</p>
            </div>
          </button>
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 ring-1 ring-black/5 animate-fade-in-scale-up">
              <div className="py-1">
                 <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(currentRole)}</p>
                 </div>
                 <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-center">
                    <ThemeSwitcher />
                 </div>
                 <button
                    onClick={onLogout}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50`}
                  >
                    <LogoutIcon className="w-5 h-5" />
                    {t('logout')}
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;