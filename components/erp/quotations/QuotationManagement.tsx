import React, { useState } from 'react';
import { useErpData } from '../../../context/erp/ErpContext';
import { useI18n } from '../../../context/I18nContext';
import PlusIcon from '../../icons/PlusIcon';
import QuotationFormModal from './QuotationFormModal';
import { Quotation, QuotationStatus } from '../../../types/erpTypes';
import QuotationDetailsModal from './QuotationDetailsModal';

const QuotationManagement: React.FC = () => {
    const { t } = useI18n();
    const { quotations, customers } = useErpData();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

    const handleAdd = () => {
        setSelectedQuotation(null);
        setIsFormOpen(true);
    };
    
    const handleViewDetails = (quotation: Quotation) => {
        setSelectedQuotation(quotation);
        setIsDetailsOpen(true);
    };

    const handleEdit = (quotation: Quotation) => {
        setSelectedQuotation(quotation);
        setIsDetailsOpen(false);
        setIsFormOpen(true);
    };
    
    const getCustomerName = (customerId: string) => {
        return customers.find(c => c.id === customerId)?.name || 'Unknown Customer';
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const getStatusColor = (status: QuotationStatus) => {
        switch(status) {
            case QuotationStatus.Draft: return 'bg-gray-200 text-gray-800';
            case QuotationStatus.Sent: return 'bg-blue-100 text-blue-800';
            case QuotationStatus.Accepted: return 'bg-green-100 text-green-800';
            case QuotationStatus.Rejected: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-200 text-gray-800';
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('erp_quotations')}</h2>
                <button
                    onClick={handleAdd}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('quotation_add')}
                </button>
            </div>

            {quotations.length === 0 ? (
                 <div className="text-center text-gray-500 dark:text-gray-400 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    {t('quotation_no_quotations')}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                        <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3">{t('quotation_number')}</th>
                                <th className="px-6 py-3">{t('quotation_customer')}</th>
                                <th className="px-6 py-3">{t('quotation_date')}</th>
                                <th className="px-6 py-3">{t('quotation_total')}</th>
                                <th className="px-6 py-3">{t('quotation_status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotations.map(q => {
                                const total = q.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                                return (
                                <tr key={q.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => handleViewDetails(q)}>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{q.quotationNumber} <span className="text-xs text-gray-400">{t('quotation_version', {version: q.version})}</span></td>
                                    <td className="px-6 py-4">{getCustomerName(q.customerId)}</td>
                                    <td className="px-6 py-4">{new Date(q.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{formatCurrency(total)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(q.status)}`}>
                                            {t(`quotation_status_${q.status}`)}
                                        </span>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isDetailsOpen && selectedQuotation && (
                <QuotationDetailsModal
                    quotation={selectedQuotation}
                    onClose={() => setIsDetailsOpen(false)}
                    onEdit={handleEdit}
                />
            )}

            {isFormOpen && (
                <QuotationFormModal
                    quotation={selectedQuotation}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
        </div>
    )
}

export default QuotationManagement;