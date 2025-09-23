import React, { useState, useRef, useEffect } from 'react';
import { useErpData } from '../../../context/erp/ErpContext';
import { useI18n } from '../../../context/I18nContext';
import PlusIcon from '../../icons/PlusIcon';
import { Customer } from '../../../types/erpTypes';
import CustomerFormModal from './CustomerFormModal';
import EditIcon from '../../icons/EditIcon';
import TrashIcon from '../../icons/TrashIcon';
import ConfirmationModal from '../../ConfirmationModal';
import ProjectIcon from '../../icons/ProjectIcon';

const CustomerManagement: React.FC = () => {
    const { customers, deleteCustomer } = useErpData();
    const { t } = useI18n();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleAddCustomer = () => {
        setCustomerToEdit(null);
        setIsFormModalOpen(true);
    };

    const handleEditCustomer = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsFormModalOpen(true);
    };
    
    const handleCardClick = (customerId: string) => {
        setExpandedCustomerId(prevId => prevId === customerId ? null : customerId);
    };

    const handleDelete = () => {
        if (customerToDelete) {
            deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setExpandedCustomerId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('crm_leads_clients')}</h2>
                <button
                    onClick={handleAddCustomer}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('crm_add_customer')}
                </button>
            </div>

            {customers.length === 0 ? (
                 <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    {t('crm_no_customers')}
                </div>
            ) : (
                <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {customers.map(customer => (
                        <div key={customer.id} className="relative">
                            <div onClick={() => handleCardClick(customer.id)} className={`bg-gray-50 dark:bg-gray-900/50 rounded-lg flex flex-col transition-shadow duration-300 cursor-pointer ${expandedCustomerId === customer.id ? 'shadow-lg ring-1 ring-blue-500' : 'hover:shadow-md'}`}>
                                <div className="p-4 flex-grow">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{customer.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{customer.contactName}</p>
                                    <p className="text-sm text-blue-500 dark:text-blue-400 mt-1 truncate">{customer.email}</p>
                                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                                        {customer.status && <span className={`capitalize px-2 py-0.5 text-xs font-semibold rounded-full ${
                                            customer.status === 'active' ? 'bg-green-100 text-green-800' : 
                                            customer.status === 'lead' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-200 text-gray-800'
                                        }`}>{customer.status}</span>}
                                        {customer.tags?.map(tag => (
                                            <span key={tag} className="bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-medium rounded-full">{tag}</span>
                                        ))}
                                        {customer.projectCount !== undefined && customer.projectCount > 0 && (
                                            <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-xs font-medium rounded-full">
                                                <ProjectIcon className="w-3 h-3" />
                                                <span>{customer.projectCount} {customer.projectCount > 1 ? t('projects') : t('reports_project')}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-shrink-0 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 p-3">
                                    <button onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer); }} className="p-2 rounded-full text-gray-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors" title="Edit Customer">
                                        <EditIcon className="w-4 h-4"/>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setCustomerToDelete(customer); }} className="p-2 rounded-full text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors" title="Delete Customer">
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>

                            {/* Absolutely positioned project list */}
                            {expandedCustomerId === customer.id && (
                                <div className="absolute top-full left-0 right-0 z-10 mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 animate-fade-in">
                                    <div className="p-4">
                                        <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2">{t('projects')}</h4>
                                        {customer.projects && customer.projects.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300 max-h-48 overflow-y-auto pr-2">
                                                {customer.projects.map(project => <li key={project.id}>{project.name}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No active projects.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            
            {isFormModalOpen && (
                <CustomerFormModal
                    customer={customerToEdit}
                    onClose={() => setIsFormModalOpen(false)}
                />
            )}
            {customerToDelete && (
                <ConfirmationModal
                    title="Delete Customer?"
                    onConfirm={handleDelete}
                    onClose={() => setCustomerToDelete(null)}
                >
                    <p>Are you sure you want to delete the customer "{customerToDelete.name}"? This action cannot be undone.</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default CustomerManagement;