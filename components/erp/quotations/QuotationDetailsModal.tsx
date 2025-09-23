import React, { useState, useMemo } from 'react';
import { Quotation, QuotationStatus } from '../../../types/erpTypes';
import { useErpData } from '../../../context/erp/ErpContext';
import { useI18n } from '../../../context/I18nContext';
import XIcon from '../../icons/XIcon';
import QuotationIcon from '../../icons/QuotationIcon';
import EditIcon from '../../icons/EditIcon';
import { exportQuotationToPdf } from '../../../utils/pdfExporter';
import DownloadIcon from '../../icons/DownloadIcon';

interface QuotationDetailsModalProps {
    quotation: Quotation;
    onClose: () => void;
    onEdit: (quotation: Quotation) => void;
}

const QuotationDetailsModal: React.FC<QuotationDetailsModalProps> = ({ quotation, onClose, onEdit }) => {
    const { t } = useI18n();
    const { customers, convertQuotationToOrder, updateQuotationStatus } = useErpData();
    const [status, setStatus] = useState(quotation.status);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const customer = useMemo(() => customers.find(c => c.id === quotation.customerId), [customers, quotation.customerId]);
    const TAX_RATE = 0.08;

    const totals = useMemo(() => {
        const subtotal = quotation.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = subtotal * TAX_RATE;
        const grandTotal = subtotal + tax;
        return { subtotal, tax, grandTotal };
    }, [quotation.items]);
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    const handleStatusChange = () => {
        setIsSubmitting(true);
        updateQuotationStatus(quotation.id, status);
        setIsSubmitting(false);
        onClose(); // Close after status change
    };

    const handleConvertToOrder = () => {
        convertQuotationToOrder(quotation.id);
        onClose();
    };

    const handleDownloadPdf = () => {
        if (customer) {
            exportQuotationToPdf(quotation, customer, t('appTitle'));
        }
    };

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                     <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <QuotationIcon className="w-6 h-6 text-blue-500" />
                            {t('quotation_details_title')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 ml-9">{quotation.quotationNumber} (v{quotation.version})</p>
                    </div>
                    <div>
                        <button type="button" onClick={handleDownloadPdf} className="p-2 mr-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={t('quotation_details_download_pdf')}>
                            <DownloadIcon className="w-6 h-6" />
                        </button>
                        <button type="button" onClick={() => onEdit(quotation)} className="p-2 mr-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={t('crm_edit_customer')}>
                            <EditIcon className="w-6 h-6" />
                        </button>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                     <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{customer?.name}</h3>
                        {/* FIX: Changed property from contactPerson to contactName */}
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer?.contactName}</p>
                        <p className="text-sm text-blue-500 dark:text-blue-400 mt-1">{customer?.email}</p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{t('quotation_form_line_items')}</h3>
                         <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2">{t('quotation_form_item_desc')}</th>
                                        <th className="px-4 py-2 text-center">{t('quotation_form_item_qty')}</th>
                                        <th className="px-4 py-2 text-right">{t('quotation_form_item_price')}</th>
                                        <th className="px-4 py-2 text-right">{t('quotation_form_item_total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotation.items.map(item => (
                                        <tr key={item.id} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-2">{item.description}</td>
                                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            {quotation.notes && (
                                <>
                                 <h3 className="text-md font-semibold mb-1">{t('quotation_form_notes')}</h3>
                                 <p className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md whitespace-pre-wrap">{quotation.notes}</p>
                                </>
                            )}
                        </div>
                        <div className="space-y-2 text-right font-medium">
                            <div className="flex justify-between"><span>{t('quotation_form_subtotal')}:</span><span>{formatCurrency(totals.subtotal)}</span></div>
                            <div className="flex justify-between"><span>{t('quotation_form_tax', {rate: TAX_RATE * 100})}:</span><span>{formatCurrency(totals.tax)}</span></div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>{t('quotation_form_grand_total')}:</span><span>{formatCurrency(totals.grandTotal)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-lg flex-shrink-0">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label htmlFor="status" className="text-sm font-medium">{t('quotation_details_change_status')}:</label>
                        <select id="status" value={status} onChange={e => setStatus(e.target.value as QuotationStatus)} className={`p-2 rounded-md border-gray-300 text-sm font-semibold ${getStatusColor(status)}`}>
                            {Object.values(QuotationStatus).map(s => <option key={s} value={s}>{t(`quotation_status_${s}`)}</option>)}
                        </select>
                         <button onClick={handleStatusChange} disabled={isSubmitting || status === quotation.status} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm disabled:bg-gray-400">
                            {t('saveChanges')}
                        </button>
                    </div>
                     {quotation.status === QuotationStatus.Accepted && (
                         <button onClick={handleConvertToOrder} className="w-full sm:w-auto px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-semibold">
                           {t('quotation_details_convert_order')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuotationDetailsModal;