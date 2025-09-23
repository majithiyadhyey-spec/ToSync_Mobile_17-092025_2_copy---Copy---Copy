import React, { useState, useEffect } from 'react';
import { Customer } from '../../../types/erpTypes';
import { useErpData } from '../../../context/erp/ErpContext';
import { useI18n } from '../../../context/I18nContext';
import XIcon from '../../icons/XIcon';
import CrmIcon from '../../icons/CrmIcon';

interface CustomerFormModalProps {
    customer: Customer | null;
    onClose: () => void;
    onCustomerAdded?: (customer: Customer) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customer, onClose, onCustomerAdded }) => {
    const { addCustomer, updateCustomer } = useErpData();
    const { t } = useI18n();
    const [formData, setFormData] = useState<Omit<Customer, 'id' | 'createdAt'>>({
        name: customer?.name || '',
        contactName: customer?.contactName || '',
        email: customer?.email || '',
        tel: customer?.tel || '',
        billingAddress: customer?.billingAddress || '',
        shippingAddress: customer?.shippingAddress || '',
        tags: customer?.tags || [],
    });
    const [tagInput, setTagInput] = useState(customer?.tags?.join(', ') || '');
    const [isSameAddress, setIsSameAddress] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (customer && customer.billingAddress && customer.shippingAddress && customer.billingAddress === customer.shippingAddress) {
            setIsSameAddress(true);
        }
    }, [customer]);

    useEffect(() => {
        if (isSameAddress) {
            setFormData(prev => ({ ...prev, shippingAddress: prev.billingAddress }));
        }
    }, [formData.billingAddress, isSameAddress]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTagInput(e.target.value);
        setFormData(prev => ({
            ...prev,
            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean),
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setError(t('crm_error_customer_name_required'));
            return;
        }

        const finalFormData = { ...formData };

        if (customer) {
            updateCustomer({ ...customer, ...finalFormData });
        } else {
            const newCustomer = await addCustomer(finalFormData);
            if (onCustomerAdded) {
                onCustomerAdded(newCustomer);
            }
        }
        onClose();
    };

    const labelClasses = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1";
    const inputClasses = "block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[60] p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <CrmIcon className="w-6 h-6 text-blue-500" />
                           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{customer ? t('crm_edit_customer') : t('crm_add_customer')}</h2>
                        </div>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {error && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{error}</div>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className={labelClasses}>{t('crm_customer_name')}</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputClasses} required autoFocus />
                            </div>
                            <div>
                                <label htmlFor="contactName" className={labelClasses}>{t('crm_contact_person')}</label>
                                <input type="text" id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} className={inputClasses} />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="email" className={labelClasses}>{t('crm_email')}</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} />
                            </div>
                            <div>
                                <label htmlFor="tel" className={labelClasses}>{t('crm_phone')}</label>
                                <input type="tel" id="tel" name="tel" value={formData.tel} onChange={handleChange} className={inputClasses} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="billingAddress" className={labelClasses}>Billing Address</label>
                            <textarea id="billingAddress" name="billingAddress" value={formData.billingAddress} onChange={handleChange} className={inputClasses} rows={3}></textarea>
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                id="sameAsBilling"
                                type="checkbox"
                                checked={isSameAddress}
                                onChange={(e) => setIsSameAddress(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="sameAsBilling" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Shipping address is the same as billing address
                            </label>
                        </div>

                        <div>
                            <label htmlFor="shippingAddress" className={labelClasses}>Shipping Address</label>
                            <textarea
                                id="shippingAddress"
                                name="shippingAddress"
                                value={formData.shippingAddress}
                                onChange={handleChange}
                                className={`${inputClasses} disabled:bg-gray-200 dark:disabled:bg-gray-600`}
                                rows={3}
                                disabled={isSameAddress}
                            ></textarea>
                        </div>
                        
                        <div>
                            <label htmlFor="tags" className={labelClasses}>{t('crm_tags')}</label>
                            <input type="text" id="tags" name="tags" value={tagInput} onChange={handleTagChange} className={inputClasses} placeholder={t('crm_tags_placeholder')} />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-4 rounded-b-lg">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">{t('cancel')}</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">{t('crm_save_customer')}</button>
                    </div>
                </form>
            </div>
        </div>
    )
};

export default CustomerFormModal;
