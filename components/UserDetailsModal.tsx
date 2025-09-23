import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { useFormworkData } from '../context/FormworkDataContext';
import WorkerTaskList from './WorkerTaskList';
import XIcon from './icons/XIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import { useI18n } from '../context/I18nContext';
import TwoFactorAuthSetupModal from './TwoFactorAuthSetupModal';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  currentUser: User;
}

const generateDateRange = (days: number): Date[] => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }
    return dates;
};


const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, currentUser }) => {
  const { getTasksByWorkerId, updateUser, users, addAuditLog } = useFormworkData();
  const { t } = useI18n();
  const workerTasks = getTasksByWorkerId(user.id);

  const [editableUser, setEditableUser] = useState<User>(user);
  const [availability, setAvailability] = useState<Record<string, number>>(user.dailyAvailability || {});
  const [editError, setEditError] = useState('');
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  
  const isAdministrator = currentUser.role === UserRole.Administrator;
  const isPlanner = currentUser.role === UserRole.Planner;
  const canEditDetails = isAdministrator || isPlanner;
  const canEditUser = isAdministrator && currentUser.id !== user.id;
  const isViewingSelf = currentUser.id === user.id;

  const availabilityDates = generateDateRange(14);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['age', 'efficiency', 'experience'].includes(name);
    
    setEditableUser(prev => ({
      ...prev,
      [name]: isNumericField ? (value === '' ? undefined : Number(value)) : value
    }));
  };

  const handleAvailabilityChange = (date: string, hours: string) => {
    const newAvailability = { ...availability };
    const hoursNum = parseFloat(hours);
    if (!isNaN(hoursNum) && hoursNum >= 0) {
        newAvailability[date] = hoursNum;
    } else {
        delete newAvailability[date];
    }
    setAvailability(newAvailability);
  };

  const handleSaveChanges = () => {
    if (!canEditUser && !isViewingSelf && !(canEditDetails && isWorker)) return;
    setEditError('');

    let finalUser = { ...editableUser, dailyAvailability: availability };

    if(canEditUser) {
        const trimmedName = finalUser.name.trim();
        const trimmedEmail = finalUser.email?.trim() ?? '';

        if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setEditError("Please enter a valid email address.");
            return;
        }
        finalUser.email = trimmedEmail || undefined;

        if (!trimmedName) {
          setEditError(t('userNameEmptyError'));
          return;
        }
        if (trimmedName.toLowerCase() !== user.name.toLowerCase() && users.some(u => u.id !== user.id && u.name.toLowerCase() === trimmedName.toLowerCase())) {
          setEditError(t('addWorkerModal_error_exists'));
          return;
        }
        finalUser.name = trimmedName;

        if (finalUser.role === UserRole.Worker) {
          const ageNum = Number(finalUser.age);
          if (!finalUser.age || isNaN(ageNum) || ageNum <= 16 || ageNum > 100) {
            setEditError(t('addWorkerModal_error_age'));
            return;
          }
          if (finalUser.experience == null) {
            setEditError(t('experienceEmptyError'));
            return;
          }
          const efficiencyNum = Number(finalUser.efficiency);
          if(!finalUser.efficiency || isNaN(efficiencyNum) || efficiencyNum < 0.5 || efficiencyNum > 2.0){
            setEditError(t('addWorkerModal_error_efficiency'));
            return;
          }

          finalUser.age = ageNum;
          finalUser.efficiency = efficiencyNum;
          
          const skillsValue = (finalUser.skills as any);
          const skillsArray = Array.isArray(skillsValue) ? skillsValue : String(skillsValue).split(',').map(s => s.trim()).filter(Boolean);
          
          if (skillsArray.length === 0) {
            setEditError(t('addWorkerModal_error_skills'));
            return;
          }
          finalUser.skills = skillsArray;
        } else {
          delete finalUser.age;
          delete finalUser.skills;
          delete finalUser.experience;
          delete finalUser.efficiency;
        }
    }
    
    updateUser(finalUser);
    addAuditLog({
        actorId: currentUser.id,
        actorName: currentUser.name,
        action: 'update_user',
        targetType: 'User',
        targetId: finalUser.id,
        targetName: finalUser.name,
    });
    alert(t('userChangesSuccess'));
    onClose();
  };

  const labelClasses = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1";
  const inputClasses = "block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";
  const isWorker = user.role === UserRole.Worker;

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="w-7 h-7 text-blue-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('userDetailsModal_title', { workerName: user.name })}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('close')}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {isViewingSelf && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('twoFactor_title')}</h3>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.isTwoFactorEnabled ? t('twoFactor_status_enabled') : t('twoFactor_status_disabled')}</p>
              <button onClick={() => setIs2FASetupOpen(true)} className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">
                {user.isTwoFactorEnabled ? t('twoFactor_disable_button') : t('twoFactor_enable_button')}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-grow">
          {canEditUser ? (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-6 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('userDetailsModal_editTitle')}</h3>
              {editError && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{editError}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div><label htmlFor="userName" className={labelClasses}>{t('addWorkerModal_workerName')}</label><input id="userName" name="name" type="text" value={editableUser.name} onChange={handleInputChange} className={inputClasses} /></div>
                <div><label htmlFor="userRole" className={labelClasses}>{t('changeRole')}</label><select id="userRole" name="role" value={editableUser.role} onChange={handleInputChange} className={inputClasses}>{Object.values(UserRole).map(role => <option key={role} value={role}>{t(role)}</option>)}</select></div>
                <div className="md:col-span-2"><label htmlFor="userEmail" className={labelClasses}>{t('email')}</label><input id="userEmail" name="email" type="email" value={editableUser.email || ''} onChange={handleInputChange} className={inputClasses} /></div>

                {editableUser.role === UserRole.Worker && (
                  <>
                    <div><label htmlFor="userAge" className={labelClasses}>{t('addWorkerModal_age')}</label><input id="userAge" name="age" type="number" value={editableUser.age || ''} onChange={handleInputChange} className={inputClasses} /></div>
                    <div><label htmlFor="userEfficiency" className={labelClasses}>{t('addWorkerModal_efficiency')}</label><input id="userEfficiency" name="efficiency" type="number" value={editableUser.efficiency ?? 1.0} onChange={handleInputChange} className={inputClasses} step="0.05" min="0.5" max="2.0" /></div>
                    <div className="md:col-span-2"><label htmlFor="userExperience" className={labelClasses}>{t('addWorkerModal_experience')}</label><input id="userExperience" name="experience" type="text" value={editableUser.experience || ''} onChange={handleInputChange} className={inputClasses} /></div>
                    <div className="md:col-span-2"><label htmlFor="userSkills" className={labelClasses}>{t('addWorkerModal_skills')}</label><input id="userSkills" name="skills" type="text" value={Array.isArray(editableUser.skills) ? editableUser.skills.join(', ') : ''} onChange={handleInputChange} placeholder={t('addWorkerModal_skills_placeholder')} className={inputClasses} /></div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="col-span-2"><p className="font-semibold text-gray-500 dark:text-gray-400">{t('email')}</p><p className="text-gray-900 dark:text-white truncate" title={user.email || 'N/A'}>{user.email || 'N/A'}</p></div>
                </div>
                {isWorker && (
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                     <div><p className="font-semibold text-gray-500 dark:text-gray-400">{t('userDetailsModal_age')}</p><p className="text-gray-900 dark:text-white">{user.age || 'N/A'}</p></div>
                     <div><p className="font-semibold text-gray-500 dark:text-gray-400">{t('userDetailsModal_experience')}</p><p className="text-gray-900 dark:text-white">{user.experience || 'N/A'}</p></div>
                     <div><p className="font-semibold text-gray-500 dark:text-gray-400">{t('addWorkerModal_efficiency')}</p><p className="text-gray-900 dark:text-white">{user.efficiency?.toFixed(2) || '1.00'}</p></div>
                     <div className="col-span-2 md:col-span-1"><p className="font-semibold text-gray-500 dark:text-gray-400">{t('userDetailsModal_skills')}</p><div className="flex flex-wrap gap-1 mt-1">{user.skills?.map((skill: string) => (<span key={skill} className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium">{skill}</span>))}</div></div>
                  </div>
                )}
            </>
          )}
          
          {(canEditDetails && isWorker) && (
             <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('userDetailsModal_availability')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mt-2">
                    {availabilityDates.map(date => {
                        const dateString = date.toISOString().split('T')[0];
                        return (
                            <div key={dateString}>
                                <label className="block text-xs text-center text-gray-500 dark:text-gray-400 mb-1">
                                    {date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                </label>
                                <input
                                    type="number"
                                    value={availability[dateString] ?? ''}
                                    onChange={(e) => handleAvailabilityChange(dateString, e.target.value)}
                                    className={`${inputClasses} text-center`}
                                    placeholder="8"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
          )}

          <div className="p-6 bg-gray-50 dark:bg-gray-900">
            {isWorker ? (
              <WorkerTaskList tasks={workerTasks} isReadOnly={true} />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                  <p>{t('noTasksForRole')}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4 flex-shrink-0">
          {(canEditUser || (canEditDetails && isWorker)) ? (
            <>
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('cancel')}</button>
                <button type="button" onClick={handleSaveChanges} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">{t('saveChanges')}</button>
            </>
          ) : (
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">{t('close')}</button>
          )}
        </div>
      </div>
    </div>
    {is2FASetupOpen && (
      <TwoFactorAuthSetupModal
        user={user}
        onClose={() => setIs2FASetupOpen(false)}
      />
    )}
    </>
  );
};

export default UserDetailsModal;