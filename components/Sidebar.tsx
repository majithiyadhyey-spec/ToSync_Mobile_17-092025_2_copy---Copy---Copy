import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import ProjectIcon from './icons/ProjectIcon';
import { NavItem } from '../App';
import ChevronRightIcon from './icons/ChevronRightIcon';


interface SidebarProps {
    navItems: NavItem[];
    activeView: string;
    setActiveView: (view: string) => void;
    isOpen: boolean;
    closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navItems, activeView, setActiveView, isOpen, closeSidebar }) => {
    const { t } = useI18n();
    const [openMenus, setOpenMenus] = useState<string[]>([]);
    
    useEffect(() => {
        // Automatically open the parent menu of the active view
        const parentId = activeView.split('/')[0];
        if (parentId && !openMenus.includes(parentId)) {
            setOpenMenus(prev => [...prev, parentId]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView]);


    const toggleMenu = (id: string) => {
        setOpenMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
    };

    return (
        <aside className={`fixed top-0 left-0 h-full z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out flex flex-col w-64 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Logo */}
            <div className="flex items-center h-20 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden justify-start px-6">
                <ProjectIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <span className="ml-3 text-xl font-bold tracking-wider whitespace-nowrap">{t('appTitle')}</span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-grow px-2 py-4 overflow-y-auto">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id} title={item.label}>
                            {item.children && item.children.length > 0 ? (
                                <div>
                                    <button
                                        onClick={() => toggleMenu(item.id)}
                                        className="w-full flex items-center my-1 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors justify-between px-4 py-3"
                                    >
                                        <div className="flex items-center">
                                            {item.icon}
                                            <span className="ml-4 whitespace-nowrap">{item.label}</span>
                                        </div>
                                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${openMenus.includes(item.id) ? 'rotate-90' : ''}`} />
                                    </button>
                                    {openMenus.includes(item.id) && (
                                        <ul className="pl-8 py-1">
                                            {item.children.map(child => (
                                                <li key={child.id}>
                                                    <a
                                                        href="#"
                                                        onClick={(e) => { e.preventDefault(); setActiveView(child.id); closeSidebar(); }}
                                                        className={`flex items-center px-4 py-2 my-1 rounded-lg text-sm transition-colors duration-200 ${
                                                            activeView === child.id
                                                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold'
                                                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                        }`}
                                                    >
                                                        {child.label}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setActiveView(item.id); closeSidebar(); }}
                                    className={`flex items-center my-1 rounded-lg transition-colors duration-200 px-4 py-3 ${
                                        activeView === item.id || (item.children && item.children.some(c => c.id === activeView))
                                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    {item.icon}
                                    <span className="ml-4 whitespace-nowrap">{item.label}</span>
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;