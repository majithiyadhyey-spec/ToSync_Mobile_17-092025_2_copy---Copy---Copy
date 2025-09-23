import React, { useState, useEffect, useRef } from 'react';
import { useFormworkData } from '../context/FormworkDataContext';
import XIcon from './icons/XIcon';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useErpData } from '../context/erp/ErpContext';
import CustomerFormModal from './erp/crm/CustomerFormModal';
import PlusIcon from './icons/PlusIcon';
import { Customer } from '../types/erpTypes';

interface AddProjectModalProps {
  onClose: () => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ onClose }) => {
  const { addProject, addAuditLog } = useFormworkData();
  const { customers } = useErpData();
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [marking, setMarking] = useState('');
  const [markingColor, setMarkingColor] = useState('#FBBF24');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);

  // State for customer search input
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLDivElement>(null);

  const minDateString = "2000-01-01";
  const maxDateString = "2099-12-31";
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setClientId(''); // Clear selected client ID when user types

    if (query) {
      const filtered = customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
      setFilteredCustomers(filtered);
      setIsDropdownOpen(true);
    } else {
      setFilteredCustomers([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSearchQuery(customer.name);
    setClientId(customer.id);
    setIsDropdownOpen(false);
  };
  
  const handleAddNewCustomerClick = () => {
    setIsAddCustomerModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    handleSelectCustomer(newCustomer);
    setIsAddCustomerModalOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const selectedCustomer = customers.find(c => c.id === clientId);

    if (!name.trim() || !marking.trim() || !clientId || !startDate || !endDate) {
      setError(t('addProjectModal_error_allFields'));
      return;
    }
    if (!selectedCustomer) {
        setError("Please select a valid customer.");
        return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError(t('addProjectModal_error_date'));
      return;
    }
    
    const newProject = await addProject({ name: name.trim(), marking: marking.trim(), client: selectedCustomer.name, clientId: clientId, markingColor, startDate, endDate });
    if (currentUser) {
        addAuditLog({
            actorId: currentUser.id,
            actorName: currentUser.name,
            action: 'create_project',
            targetType: 'Project',
            targetId: newProject.id,
            targetName: newProject.name,
        });
    }
    onClose();
  };

  const inputClasses = "mt-1 block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";
  const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-400";

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addProjectModal_title')}</h2>
            <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label={t('addProjectModal_close')}>
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{error}</div>}
            
            <div>
              <label htmlFor="projectName" className={labelClasses}>{t('addProjectModal_projectName')}</label>
              <input
                id="projectName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClasses}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex items-end gap-2">
                 <div className="flex-grow">
                    <label htmlFor="marking" className={labelClasses}>{t('addProjectModal_marking')}</label>
                    <input id="marking" type="text" value={marking} onChange={(e) => setMarking(e.target.value)} className={inputClasses} required />
                 </div>
                 <div>
                    <label htmlFor="markingColor" className={`${labelClasses} text-center`}>{t('addProjectModal_markingColor')}</label>
                    <input id="markingColor" type="color" value={markingColor} onChange={(e) => setMarkingColor(e.target.value)} className={`${inputClasses} p-1 h-10 w-14 cursor-pointer`} />
                 </div>
               </div>
              <div ref={searchInputRef}>
                <label htmlFor="client" className={labelClasses}>{t('addProjectModal_client')}</label>
                <div className="relative">
                    <input type="text" id="client" value={searchQuery} onChange={handleSearchChange} className={inputClasses} required autoComplete="off" />
                    {isDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            <ul>
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map(customer => (
                                        <li key={customer.id} onClick={() => handleSelectCustomer(customer)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                            {customer.name}
                                        </li>
                                    ))
                                ) : (
                                    <li onClick={handleAddNewCustomerClick} className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer flex items-center gap-2">
                                        <PlusIcon className="w-4 h-4" /> Add "{searchQuery}" as new customer
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className={labelClasses}>{t('taskDetailsModal_startDate')}</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClasses}
                  required
                  min={minDateString}
                  max={maxDateString}
                />
              </div>
              <div>
                <label htmlFor="endDate" className={labelClasses}>{t('addProjectModal_endDate')}</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClasses}
                  required
                  min={startDate || minDateString}
                  max={maxDateString}
                />
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition">{t('addProjectModal_save')}</button>
          </div>
        </form>
      </div>
    </div>
    {isAddCustomerModalOpen && <CustomerFormModal customer={null} onClose={() => setIsAddCustomerModalOpen(false)} onCustomerAdded={handleCustomerAdded} />}
    </>
  );
};

export default AddProjectModal;