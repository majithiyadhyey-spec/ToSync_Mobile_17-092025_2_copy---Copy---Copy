import React, { useState, useMemo } from 'react';
import { Quotation, QuotationItem, QuotationStatus } from '../../../types/erpTypes';
import { useErpData } from '../../../context/erp/ErpContext';
import { useI18n } from '../../../context/I18nContext';
import { useFormworkData } from '../../../context/FormworkDataContext';
import XIcon from '../../icons/XIcon';
import QuotationIcon from '../../icons/QuotationIcon';
import TrashIcon from '../../icons/TrashIcon';
import PlusIcon from '../../icons/PlusIcon';

interface QuotationFormModalProps {
    quotation: Quotation | null;
    onClose: () => void;
}

const QuotationFormModal: React.FC<QuotationFormModalProps> = ({ quotation, onClose }) => {
    const { t } = useI18n();
    const { customers, addQuotation, updateQuotation } = useErpData();
    const { activeProjects, addProject } = useFormworkData();

    const [customerId, setCustomerId] = useState(quotation?.customerId || '');
    const [projectId, setProjectId] = useState(quotation?.projectId || '');
    const [items, setItems] = useState<QuotationItem[]>(quotation?.items || [{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
    const [notes, setNotes] = useState(quotation?.notes || '');
    const [error, setError] = useState('');
    
    const isEditing = !!quotation;
    const TAX_RATE = 0.08;

    const projectsForCustomerDropdown = useMemo(() => {
        if (!customerId) return [];
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return [];
        
        // 1. Get existing projects linked by client name
        const existingProjects = activeProjects.filter(p => p.client === customer.name);

        // 2. Get project names from the customer object and create placeholder objects
        const customerProjectNames = customer.projectNames || [];
        const potentialProjectObjects = customerProjectNames
            .filter(name => !existingProjects.some(p => p.name === name)) // Filter out names that already have a project
            .map(name => ({
                id: name, // Use the name as a temporary ID for the value of the option
                name: `${name} (${t('crm_status_lead')})`, // Visually indicate it's a new/potential project
                // Provide dummy data to satisfy the Project type for the dropdown
                client: customer.name,
                marking: 'LEAD',
                markingColor: '#A0AEC0',
                startDate: '',
                endDate: '',
            }));
            
        // Combine and sort the list for the dropdown
        const combinedList = [...existingProjects, ...potentialProjectObjects];
        return combinedList.sort((a, b) => a.name.localeCompare(b.name));

    }, [customerId, customers, activeProjects, t]);
    
    const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCustomerId = e.target.value;
        setCustomerId(newCustomerId);
        // Always reset the project when the customer changes to ensure consistency
        setProjectId('');
    };

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = subtotal * TAX_RATE;
        const grandTotal = subtotal + tax;
        return { subtotal, tax, grandTotal };
    }, [items]);
    
    const handleItemChange = (id: string, field: keyof Omit<QuotationItem, 'id'>, value: string | number) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    // FIX: Converted the function to async to handle the promise returned by addProject.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!customerId) {
            setError(t('quotation_form_error_customer'));
            return;
        }
        if (items.some(i => !i.description || i.quantity <= 0 || i.unitPrice < 0)) {
            setError(t('quotation_form_error_items'));
            return;
        }

        let finalProjectId = projectId;
        
        // Check if the selected projectId exists in the main projects list.
        // If not, it's a new project name selected from the dropdown.
        const projectExists = activeProjects.some(p => p.id === projectId);
        
        if (projectId && !projectExists) {
            // A new project name was selected, so create a real Project entity.
            const customer = customers.find(c => c.id === customerId);
            if(customer) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + 30); // Assign a default 30-day duration

                // FIX: Awaited the addProject promise to get the resolved project object.
                // FIX: Added missing 'clientId' property required by the Project type.
                const newProject = await addProject({
                    name: projectId, // The project name was stored in the `projectId` state
                    marking: projectId.substring(0, 3).toUpperCase(),
                    client: customer.name,
                    clientId: customer.id,
                    markingColor: '#A0AEC0', // A neutral color for lead-generated projects
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                });
                finalProjectId = newProject.id; // Use the ID of the newly created project
            }
        }

        const quotationData = {
            customerId,
            projectId: finalProjectId || undefined,
            items,
            notes,
        };

        if (isEditing) {
            updateQuotation({ ...quotation!, ...quotationData });
        } else {
            addQuotation({ ...quotationData, status: QuotationStatus.Draft });
        }
        onClose();
    };


    const labelClasses = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1";
    const inputClasses = "block w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <QuotationIcon className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isEditing ? t('quotation_form_edit_title') : t('quotation_form_title')}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                    {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{error}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="customer" className={labelClasses}>{t('quotation_customer')}</label>
                            <select id="customer" value={customerId} onChange={handleCustomerChange} className={inputClasses}>
                                <option value="">{t('quotation_form_select_customer')}</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="project" className={labelClasses}>{t('quotation_project')}</label>
                            <select id="project" value={projectId} onChange={e => setProjectId(e.target.value)} className={inputClasses} disabled={!customerId}>
                                <option value="">{t('quotation_form_select_project')}</option>
                                {projectsForCustomerDropdown.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{t('quotation_form_line_items')}</h3>
                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                <input type="text" placeholder={t('quotation_form_item_desc')} value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} className={`${inputClasses} col-span-6`} />
                                <input type="number" placeholder={t('quotation_form_item_qty')} value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} className={`${inputClasses} col-span-2`} min="1" />
                                <input type="number" placeholder={t('quotation_form_item_price')} value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', Number(e.target.value))} className={`${inputClasses} col-span-2`} min="0" />
                                <span className="col-span-1 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span>
                                <button type="button" onClick={() => removeItem(item.id)} className="col-span-1 p-2 text-red-500 hover:text-red-700 disabled:text-gray-400" disabled={items.length <= 1}>
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                           <PlusIcon className="w-4 h-4" /> {t('quotation_form_add_item')}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="notes" className={labelClasses}>{t('quotation_form_notes')}</label>
                            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={5} className={inputClasses}></textarea>
                        </div>
                        <div className="space-y-2 text-right font-medium">
                            <div className="flex justify-between"><span>{t('quotation_form_subtotal')}:</span><span>{formatCurrency(totals.subtotal)}</span></div>
                            <div className="flex justify-between"><span>{t('quotation_form_tax', {rate: TAX_RATE * 100})}:</span><span>{formatCurrency(totals.tax)}</span></div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>{t('quotation_form_grand_total')}:</span><span>{formatCurrency(totals.grandTotal)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-4 rounded-b-lg flex-shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">{isEditing ? t('saveChanges') : t('addProjectModal_save')}</button>
                </div>
            </form>
        </div>
    )
}

export default QuotationFormModal;