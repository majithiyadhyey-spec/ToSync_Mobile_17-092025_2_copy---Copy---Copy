// import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// import { UserRole, TaskStatus } from './types';
// import Header from './components/Header';
// import Dashboard from './components/Dashboard';
// import WorkerDashboard from './components/WorkerDashboard';
// import ReportsPage from './components/ReportsPage';
// import UsersPage from './components/UsersPage';
// import ProjectIcon from './components/icons/ProjectIcon';
// import ChartBarIcon from './components/icons/ChartBarIcon';
// import { useFormworkData } from './context/FormworkDataContext';
// import { useI18n } from './context/I18nContext';
// import { useAuth } from './context/AuthContext';
// import CogIcon from './components/icons/CogIcon';
// import ComingSoonCard from './components/ComingSoonCard';
// import WorkIcon from './components/icons/WorkIcon';
// import ProjectManagementPage from './components/ProjectManagementPage';
// import RecycleBinPage from './components/RecycleBinPage';
// import AuditLogViewer from './components/AuditLogViewer';
// import FinishedProjectsPage from './components/FinishedProjectsPage';
// import CalendarPage from './components/CalendarPage';
// import QRCodeScannerModal from './components/QRCodeScannerModal';
// import TimeZonePage from './components/TimeZonePage';
// import Sidebar from './components/Sidebar';
// import LoginPage from './components/LoginPage';
// import CheckCircleIcon from './components/icons/CheckCircleIcon';
// import CrmIcon from './components/icons/CrmIcon';
// import ErpPage from './components/ErpPage';


// export interface NavItem {
//     id: string;
//     label: string;
//     icon: React.ReactNode;
//     children?: NavItem[];
//     roles?: UserRole[];
// }

// const App: React.FC = () => {
//   const { currentUser, currentRole, loading: authLoading, logout } = useAuth();
//   const [activeView, setActiveView] = useState<string>('dashboard');
//   const { tasks, loading: dataLoading, error, endTimer, addAuditLog } = useFormworkData();
//   const { t, loading: i18nLoading } = useI18n();
//   const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
//   const [isGeneralScannerOpen, setIsGeneralScannerOpen] = useState(false);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);


//   useEffect(() => {
//     const handleResize = () => {
//         setIsMobile(window.innerWidth < 1024);
//     };
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     if (currentUser) {
//       if (currentUser.role === UserRole.Worker) {
//           if (!activeView.startsWith('work/')) {
//             setActiveView('work/active');
//           }
//       } else {
//           if (activeView.startsWith('work/')) {
//             setActiveView('dashboard');
//           }
//       }
//     }
//   }, [currentUser, activeView]);

//   useEffect(() => {
//     const handleBeforeInstallPrompt = (e: Event) => {
//       e.preventDefault();
//       setDeferredPrompt(e);
//     };
//     window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
//     return () => {
//       window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
//     };
//   }, []);

//   const handleInstallClick = async () => {
//     if (deferredPrompt) {
//         deferredPrompt.prompt();
//         await deferredPrompt.userChoice;
//         setDeferredPrompt(null);
//     }
//   };

//   const handleGeneralScan = useCallback((scannedData: string | null) => {
//     setIsGeneralScannerOpen(false);
//     if (!scannedData || !currentUser) return;

//     const task = tasks.find(t => t.id === scannedData);
//     if (!task) {
//         alert(t('scannerError_taskNotFound', { taskId: scannedData }));
//         return;
//     }
//     if (task.status === TaskStatus.Completed) {
//         alert(t('scannerInfo_taskAlreadyCompleted', { taskName: task.name }));
//         return;
//     }
//     if (!task.assignedWorkerIds.includes(currentUser.id)) {
//         alert(`Error: You are not assigned to the task "${task.name}". Please contact a planner.`);
//         return;
//     }

//     endTimer(task.id);
//     addAuditLog({ actorId: currentUser.id, actorName: currentUser.name, action: 'timer_complete', targetType: 'Task', targetId: task.id, targetName: task.name });
//     alert(t('scannerSuccess_taskCompleted', { taskName: task.name }));
//   }, [tasks, currentUser, endTimer, addAuditLog, t]);


//   const loading = dataLoading || i18nLoading || authLoading;

//   const mobileNavItems: NavItem[] = useMemo(() => [
//     { id: 'dashboard', label: t('dashboard'), icon: <ProjectIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner] },
//     { id: 'projects/list', label: t('active_projects'), icon: <ProjectIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner] },
//     { id: 'projects/finished', label: t('finished_projects'), icon: <CheckCircleIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner] },
//     { id: 'erp/clients', label: t('sales_crm'), icon: <CrmIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner] },
//     { id: 'admin', label: t('admin'), icon: <CogIcon className="w-5 h-5"/>, roles: [UserRole.Administrator],
//         children: [
//             { id: 'admin/users', label: t('users'), icon: <></> },
//         ]
//     },
//   ], [t]);
  
//   const desktopNavItems: NavItem[] = useMemo(() => [
//     { id: 'dashboard', label: t('dashboard'), icon: <ProjectIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner] },
//     { id: 'projects', label: t('projects'), icon: <ProjectIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner],
//         children: [
//             { id: 'projects/list', label: t('active_projects'), icon: <></> },
//             { id: 'projects/finished', label: t('finished_projects'), icon: <></> },
//             { id: 'projects/calendar', label: t('calendar'), icon: <></> },
//         ]
//     },
//     { id: 'erp/clients', label: t('sales_crm'), icon: <CrmIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner] },
//     { id: 'reports', label: t('reports'), icon: <ChartBarIcon className="w-5 h-5"/>, roles: [UserRole.Administrator, UserRole.Planner] },
//     { id: 'admin', label: t('admin'), icon: <CogIcon className="w-5 h-5"/>, roles: [UserRole.Administrator],
//         children: [
//             { id: 'admin/users', label: t('users'), icon: <></> },
//             { id: 'admin/recycle-bin', label: t('recycleBin_title'), icon: <></> },
//             { id: 'admin/audit-log', label: t('auditLog_title'), icon: <></> },
//             { id: 'admin/timezone', label: t('timeZone_title'), icon: <></> },
//         ]
//     },
//   ], [t]);

//   const workerNavItems: NavItem[] = useMemo(() => [
//     { id: 'work', label: t('my_tasks'), icon: <WorkIcon className="w-5 h-5"/>, roles: [UserRole.Worker],
//         children: [
//             { id: 'work/planned', label: t('planned_tasks'), icon: <></> },
//             { id: 'work/active', label: t('active_tasks'), icon: <></> },
//             { id: 'work/finished', label: t('finished_tasks'), icon: <></> },
//         ]
//     },
//   ], [t]);

//   const navItemsForRole = useMemo(() => {
//     if (!currentUser) return [];
//     if (currentUser.role === UserRole.Worker) return workerNavItems;
//     const itemsToFilter = isMobile ? mobileNavItems : desktopNavItems;
//     return itemsToFilter.filter(item => !item.roles || item.roles.includes(currentUser.role))
//         .map(item => ({...item, children: item.children?.filter(child => !child.roles || child.roles.includes(currentUser.role))}));
//   }, [currentUser, isMobile, mobileNavItems, desktopNavItems, workerNavItems]);

//   const pageTitle = useMemo(() => {
//     const allNavItems = navItemsForRole.flatMap(item => item.children ? [item, ...item.children] : [item]);
//     const currentNavItem = allNavItems.find(item => item.id === activeView);
//     return currentNavItem ? currentNavItem.label : t('dashboard');
//   }, [activeView, navItemsForRole, t]);


//   if (authLoading) { // Use authLoading specifically for the initial login screen
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
//         <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
//       </div>
//     );
//   }

//   if (!currentUser) {
//     return <LoginPage />;
//   }


//   const renderContent = () => {
//     if (error) {
//       return (
//         <div className="p-8 text-center bg-red-100 border border-red-300 text-red-800 rounded-lg dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">
//           <h2 className="text-xl font-bold mb-2">{t('connectionError')}</h2>
//           <p>{error}</p>
//         </div>
//       );
//     }

//     switch (activeView) {
//         case 'work/planned':
//         case 'work/active':
//         case 'work/finished':
//             if (currentUser.role === UserRole.Worker) {
//                  return <WorkerDashboard worker={currentUser} activeView={activeView as 'work/planned' | 'work/active' | 'work/finished'} />;
//             }
//             return <Dashboard userRole={currentUser.role} />;
//         case 'dashboard':
//             return <Dashboard userRole={currentUser.role} />;
//         case 'projects/list':
//             return <ProjectManagementPage userRole={currentUser.role} />;
//         case 'projects/finished':
//             return <FinishedProjectsPage />;
//         case 'projects/calendar':
//             return <CalendarPage />;
//         case 'erp/clients':
//             return <ErpPage activeView={activeView} />;
//         case 'admin/users':
//             return <UsersPage currentUser={currentUser} />;
//         case 'reports':
//             return <ReportsPage userRole={currentUser.role} />;
//         case 'admin/recycle-bin':
//             if (currentUser.role === UserRole.Administrator) return <RecycleBinPage />;
//             return <Dashboard userRole={currentUser.role} />;
//         case 'admin/audit-log':
//             if (currentUser.role === UserRole.Administrator) return <AuditLogViewer />;
//             return <Dashboard userRole={currentUser.role} />;
//         case 'admin/timezone':
//             if (currentUser.role === UserRole.Administrator) return <TimeZonePage />;
//             return <Dashboard userRole={currentUser.role} />;
//         default:
//             // Fallback for removed nav items
//             const parentView = activeView.split('/')[0];
//             if (['projects', 'admin', 'reports', 'erp'].includes(parentView)) {
//                 return <Dashboard userRole={currentUser.role} />;
//             }
//             return <ComingSoonCard />;
//     }
//   };

//   return (
//     <>
//     <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex h-screen">
//        {isSidebarOpen && (
//         <div 
//             className="fixed inset-0 bg-gray-900/75 z-40 transition-opacity lg:hidden"
//             onClick={() => setIsSidebarOpen(false)}
//         ></div>
//       )}
//       <Sidebar 
//         navItems={navItemsForRole}
//         activeView={activeView}
//         setActiveView={setActiveView}
//         isOpen={isSidebarOpen}
//         closeSidebar={() => setIsSidebarOpen(false)}
//       />
//       <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
//         <Header 
//           currentUser={currentUser}
//           currentRole={currentRole}
//           onLogout={logout}
//           onInstallClick={handleInstallClick} 
//           showInstallButton={!!deferredPrompt} 
//           showScanButton={currentUser.role === UserRole.Worker}
//           onScanClick={() => setIsGeneralScannerOpen(true)}
//           onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
//           pageTitle={pageTitle}
//         />
//         <main className="flex-1 overflow-y-auto">
//           <div className="p-4 sm:p-6 lg:p-8">
//             {renderContent()}
//           </div>
//         </main>
//       </div>
//     </div>

//     {isGeneralScannerOpen && (
//         <QRCodeScannerModal
//             onScan={handleGeneralScan}
//             onClose={() => setIsGeneralScannerOpen(false)}
//         />
//     )}
//     </>
//   );
// };

// export default App;





import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserRole, TaskStatus } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WorkerDashboard from './components/WorkerDashboard';
import ReportsPage from './components/ReportsPage';
import UsersPage from './components/UsersPage';
import ProjectIcon from './components/icons/ProjectIcon';
import ChartBarIcon from './components/icons/ChartBarIcon';
import { useFormworkData } from './context/FormworkDataContext';
import { useI18n } from './context/I18nContext';
import { useAuth } from './context/AuthContext';
import CogIcon from './components/icons/CogIcon';
import ComingSoonCard from './components/ComingSoonCard';
import WorkIcon from './components/icons/WorkIcon';
import ProjectManagementPage from './components/ProjectManagementPage';
import RecycleBinPage from './components/RecycleBinPage';
import AuditLogViewer from './components/AuditLogViewer';
import FinishedProjectsPage from './components/FinishedProjectsPage';
import CalendarPage from './components/CalendarPage';
import QRCodeScannerModal from './components/QRCodeScannerModal';
import TimeZonePage from './components/TimeZonePage';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import CheckCircleIcon from './components/icons/CheckCircleIcon';
import CrmIcon from './components/icons/CrmIcon';
import ErpPage from './components/ErpPage';

// ✅ Register push notifications
import { registerPush } from './services/notifications';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
  roles?: UserRole[];
}

const App: React.FC = () => {
  const { currentUser, currentRole, loading: authLoading, logout } = useAuth();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const { tasks, loading: dataLoading, error, endTimer, addAuditLog } = useFormworkData();
  const { t, loading: i18nLoading } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isGeneralScannerOpen, setIsGeneralScannerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Register push notifications
  useEffect(() => {
    if (currentUser) {
      registerPush(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.Worker) {
        if (!activeView.startsWith('work/')) {
          setActiveView('work/active');
        }
      } else {
        if (activeView.startsWith('work/')) {
          setActiveView('dashboard');
        }
      }
    }
  }, [currentUser, activeView]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  const handleGeneralScan = useCallback(
    (scannedData: string | null) => {
      setIsGeneralScannerOpen(false);
      if (!scannedData || !currentUser) return;

      const task = tasks.find((t) => t.id === scannedData);
      if (!task) {
        alert(t('scannerError_taskNotFound', { taskId: scannedData }));
        return;
      }
      if (task.status === TaskStatus.Completed) {
        alert(t('scannerInfo_taskAlreadyCompleted', { taskName: task.name }));
        return;
      }
      if (!task.assignedWorkerIds.includes(currentUser.id)) {
        alert(`Error: You are not assigned to the task "${task.name}". Please contact a planner.`);
        return;
      }

      endTimer(task.id);
      addAuditLog({
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'timer_complete',
        targetType: 'Task',
        targetId: task.id,
        targetName: task.name,
      });
      alert(t('scannerSuccess_taskCompleted', { taskName: task.name }));
    },
    [tasks, currentUser, endTimer, addAuditLog, t]
  );

  const loading = dataLoading || i18nLoading || authLoading;

  const mobileNavItems: NavItem[] = useMemo(
    () => [
      { id: 'dashboard', label: t('dashboard'), icon: <ProjectIcon className="w-5 h-5" />, roles: [UserRole.Administrator, UserRole.Planner] },
      { id: 'projects/list', label: t('active_projects'), icon: <ProjectIcon className="w-5 h-5" />, roles: [UserRole.Administrator, UserRole.Planner] },
      { id: 'projects/finished', label: t('finished_projects'), icon: <CheckCircleIcon className="w-5 h-5" />, roles: [UserRole.Administrator, UserRole.Planner] },
      { id: 'erp/clients', label: t('sales_crm'), icon: <CrmIcon className="w-5 h-5" />, roles: [UserRole.Administrator, UserRole.Planner] },
      {
        id: 'admin',
        label: t('admin'),
        icon: <CogIcon className="w-5 h-5" />,
        roles: [UserRole.Administrator],
        children: [{ id: 'admin/users', label: t('users'), icon: <></> }],
      },
    ],
    [t]
  );

  const desktopNavItems: NavItem[] = useMemo(
    () => [
      { id: 'dashboard', label: t('dashboard'), icon: <ProjectIcon className="w-5 h-5" />, roles: [UserRole.Administrator, UserRole.Planner] },
      {
        id: 'projects',
        label: t('projects'),
        icon: <ProjectIcon className="w-5 h-5" />,
        roles: [UserRole.Administrator, UserRole.Planner],
        children: [
          { id: 'projects/list', label: t('active_projects'), icon: <></> },
          { id: 'projects/finished', label: t('finished_projects'), icon: <></> },
          { id: 'projects/calendar', label: t('calendar'), icon: <></> },
        ],
      },
      { id: 'erp/clients', label: t('sales_crm'), icon: <CrmIcon className="w-5 h-5" />, roles: [UserRole.Administrator, UserRole.Planner] },
      { id: 'reports', label: t('reports'), icon: <ChartBarIcon className="w-5 h-5" />, roles: [UserRole.Administrator, UserRole.Planner] },
      {
        id: 'admin',
        label: t('admin'),
        icon: <CogIcon className="w-5 h-5" />,
        roles: [UserRole.Administrator],
        children: [
          { id: 'admin/users', label: t('users'), icon: <></> },
          { id: 'admin/recycle-bin', label: t('recycleBin_title'), icon: <></> },
          { id: 'admin/audit-log', label: t('auditLog_title'), icon: <></> },
          { id: 'admin/timezone', label: t('timeZone_title'), icon: <></> },
        ],
      },
    ],
    [t]
  );

  const workerNavItems: NavItem[] = useMemo(
    () => [
      {
        id: 'work',
        label: t('my_tasks'),
        icon: <WorkIcon className="w-5 h-5" />,
        roles: [UserRole.Worker],
        children: [
          { id: 'work/planned', label: t('planned_tasks'), icon: <></> },
          { id: 'work/active', label: t('active_tasks'), icon: <></> },
          { id: 'work/finished', label: t('finished_tasks'), icon: <></> },
        ],
      },
    ],
    [t]
  );

  const navItemsForRole = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.Worker) return workerNavItems;
    const itemsToFilter = isMobile ? mobileNavItems : desktopNavItems;
    return itemsToFilter
      .filter((item) => !item.roles || item.roles.includes(currentUser.role))
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) => !child.roles || child.roles.includes(currentUser.role)),
      }));
  }, [currentUser, isMobile, mobileNavItems, desktopNavItems, workerNavItems]);

  const pageTitle = useMemo(() => {
    const allNavItems = navItemsForRole.flatMap((item) => (item.children ? [item, ...item.children] : [item]));
    const currentNavItem = allNavItems.find((item) => item.id === activeView);
    return currentNavItem ? currentNavItem.label : t('dashboard');
  }, [activeView, navItemsForRole, t]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="p-8 text-center bg-red-100 border border-red-300 text-red-800 rounded-lg dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">
          <h2 className="text-xl font-bold mb-2">{t('connectionError')}</h2>
          <p>{error}</p>
        </div>
      );
    }

    switch (activeView) {
      case 'work/planned':
      case 'work/active':
      case 'work/finished':
        if (currentUser.role === UserRole.Worker) {
          return <WorkerDashboard worker={currentUser} activeView={activeView as any} />;
        }
        return <Dashboard userRole={currentUser.role} />;
      case 'dashboard':
        return <Dashboard userRole={currentUser.role} />;
      case 'projects/list':
        return <ProjectManagementPage userRole={currentUser.role} />;
      case 'projects/finished':
        return <FinishedProjectsPage />;
      case 'projects/calendar':
        return <CalendarPage />;
      case 'erp/clients':
        return <ErpPage activeView={activeView} />;
      case 'admin/users':
        return <UsersPage currentUser={currentUser} />;
      case 'reports':
        return <ReportsPage userRole={currentUser.role} />;
      case 'admin/recycle-bin':
        return currentUser.role === UserRole.Administrator ? <RecycleBinPage /> : <Dashboard userRole={currentUser.role} />;
      case 'admin/audit-log':
        return currentUser.role === UserRole.Administrator ? <AuditLogViewer /> : <Dashboard userRole={currentUser.role} />;
      case 'admin/timezone':
        return currentUser.role === UserRole.Administrator ? <TimeZonePage /> : <Dashboard userRole={currentUser.role} />;
      default:
        const parentView = activeView.split('/')[0];
        if (['projects', 'admin', 'reports', 'erp'].includes(parentView)) {
          return <Dashboard userRole={currentUser.role} />;
        }
        return <ComingSoonCard />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex h-screen">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-gray-900/75 z-40 transition-opacity lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        <Sidebar
          navItems={navItemsForRole}
          activeView={activeView}
          setActiveView={setActiveView}
          isOpen={isSidebarOpen}
          closeSidebar={() => setIsSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
          <Header
            currentUser={currentUser}
            currentRole={currentRole}
            onLogout={logout}
            onInstallClick={handleInstallClick}
            showInstallButton={!!deferredPrompt}
            showScanButton={currentUser.role === UserRole.Worker}
            onScanClick={() => setIsGeneralScannerOpen(true)}
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            pageTitle={pageTitle}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
          </main>
        </div>
      </div>

      {isGeneralScannerOpen && <QRCodeScannerModal onScan={handleGeneralScan} onClose={() => setIsGeneralScannerOpen(false)} />}
    </>
  );
};

export default App;

