import React, { useState } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import XIcon from './icons/XIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';

interface AddWorkerModalProps {
  onClose: () => void;
}

const AddWorkerModal: React.FC<AddWorkerModalProps> = ({ onClose }) => {
  const { addWorker, users, addAuditLog } = useFormworkData();
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Worker);
  const [age, setAge] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [password, setPassword] = useState('');
  const [efficiency, setEfficiency] = useState('1.0');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !password.trim()) {
      setError(t('addWorkerModal_error_allFields'));
      return;
    }
    if (users.some(u => u.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError(t('addWorkerModal_error_exists'));
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError("Please enter a valid email address.");
        return;
    }

    const newUserData: Omit<User, 'id'> & { password: string } = {
        name: trimmedName,
        email: trimmedEmail || undefined,
        password: password.trim(),
        role: role,
    };
    
    if (role === UserRole.Worker) {
        if (!age || !skills.trim() || !experience.trim()) {
            setError(t('addWorkerModal_error_allFields'));
            return;
        }
        const ageNum = parseInt(age, 10);
        if(isNaN(ageNum) || ageNum <= 16 || ageNum > 100){
          setError(t('addWorkerModal_error_age'));
          return;
        }

        const efficiencyNum = parseFloat(efficiency);
        if(isNaN(efficiencyNum) || efficiencyNum < 0.5 || efficiencyNum > 2.0){
          setError(t('addWorkerModal_error_efficiency'));
          return;
        }

        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
        if(skillsArray.length === 0){
            setError(t('addWorkerModal_error_skills'));
            return;
        }

        const experienceNum = parseFloat(experience);
        if (isNaN(experienceNum) || experienceNum < 0) {
            setError('Please enter a valid number for experience.');
            return;
        }
        
        newUserData.age = ageNum;
        newUserData.skills = skillsArray;
        newUserData.experience = experienceNum;
        newUserData.efficiency = efficiencyNum;
    }

    try {
        const newUser = await addWorker(newUserData);

        if (currentUser) {
            addAuditLog({
                actorId: currentUser.id,
                actorName: currentUser.name,
                action: 'create_user',
                targetType: 'User',
                targetId: newUser.id,
                targetName: newUser.name,
            });
        }

        onClose();
    } catch (err: any) {
        console.error("Failed to add user:", err);
        setError(err.message || "An unexpected error occurred.");
    }
  };
  
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-400";
  const inputClasses = "mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";
  
  const showEmailField = role === UserRole.Administrator || role === UserRole.Planner;
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newRole = e.target.value as UserRole;
      setRole(newRole);
      if (newRole === UserRole.Worker) {
          setEmail('');
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <UserGroupIcon className="w-7 h-7 text-blue-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addWorkerModal_title')}</h2>
            </div>
            <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('addProjectModal_close')}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{error}</div>}
            
            <div className={`grid grid-cols-1 ${showEmailField ? 'md:grid-cols-2' : ''} gap-4`}>
                <div>
                  <label htmlFor="workerName" className={labelClasses}>{t('addWorkerModal_workerName')}</label>
                  <input
                    id="workerName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('addWorkerModal_placeholder')}
                    className={inputClasses}
                    required
                    autoFocus
                  />
                </div>
                 {showEmailField && (
                     <div>
                      <label htmlFor="workerEmail" className={labelClasses}>{t('email')}</label>
                      <input
                        id="workerEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className={inputClasses}
                      />
                    </div>
                 )}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                  <label htmlFor="userRole" className={labelClasses}>{t('changeRole')}</label>
                  <select
                    id="userRole"
                    value={role}
                    onChange={handleRoleChange}
                    className={inputClasses}
                    required
                  >
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{t(r)}</option>)}
                  </select>
                </div>
                 <div>
                  <label htmlFor="workerPassword" className={labelClasses}>{t('password')}</label>
                  <input
                    id="workerPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClasses}
                    required
                  />
                </div>
            </div>
            
            {role === UserRole.Worker && (
                <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="workerAge" className={labelClasses}>{t('addWorkerModal_age')}</label>
                      <input
                        id="workerAge"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g., 35"
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div>
                        <label htmlFor="workerEfficiency" className={labelClasses}>{t('addWorkerModal_efficiency')}</label>
                        <input
                            id="workerEfficiency"
                            type="number"
                            value={efficiency}
                            onChange={(e) => setEfficiency(e.target.value)}
                            placeholder="1.0"
                            step="0.05"
                            min="0.5"
                            max="2.0"
                            className={inputClasses}
                            required
                        />
                    </div>
                </div>

                <div>
                  <label htmlFor="workerSkills" className={labelClasses}>{t('addWorkerModal_skills')}</label>
                  <input
                    id="workerSkills"
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder={t('addWorkerModal_skills_placeholder')}
                    className={inputClasses}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="workerExperience" className={labelClasses}>{t('addWorkerModal_experience')}</label>
                  <input
                    id="workerExperience"
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder={t('addWorkerModal_experience_placeholder')}
                    className={inputClasses}
                    required
                  />
                </div>
                </>
            )}

          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">{t('addWorkerModal_add')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkerModal;