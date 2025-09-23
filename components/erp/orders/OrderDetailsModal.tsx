import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../../../types/erpTypes';
import { useErpData } from '../../../context/erp/ErpContext';
import { useI18n } from '../../../context/I18nContext';
import { useFormworkData } from '../../../context/FormworkDataContext';
import XIcon from '../../icons/XIcon';
import OrderIcon from '../../icons/OrderIcon';
import ShippingIcon from '../../icons/ShippingIcon';
import ShipmentFormModal from '../shipping/ShipmentFormModal';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose }) => {
    const { t } = useI18n();
    const { customers, quotations, updateOrderStatus } = useErpData();
    const { users } = useFormworkData();
    const [status, setStatus] = useState(order.status);
    const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);

    const customer = useMemo(() => customers.find(c => c.id === order.customerId), [customers, order.customerId]);
    const quotation = useMemo(() => quotations.find(q => q.id === order.quotationId), [quotations, order.quotationId]);

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'System';
    
    const handleStatusUpdate = () => {
        if (status !== order.status) {
            updateOrderStatus(order.id, status);
        }
    };
    
    const canCreateShipment = ![OrderStatus.Shipped, OrderStatus.Completed, OrderStatus.Cancelled].includes(order.status);

    const getStatusColor = (status: OrderStatus) => {
        const colors: Record<OrderStatus, string> = {
            [OrderStatus.Created]: 'bg-gray-200 text-gray-800',
            [OrderStatus.Confirmed]: 'bg-blue-100 text-blue-800',
            [OrderStatus.InProduction]: 'bg-yellow-100 text-yellow-800',
            [OrderStatus.Shipped]: 'bg-purple-100 text-purple-800',
            [OrderStatus.Completed]: 'bg-green-100 text-green-800',
            [OrderStatus.Cancelled]: 'bg-red-100 text-red-800',
        };
        return colors[status] || colors.Created;
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <OrderIcon className="w-6 h-6 text-blue-500" />
                                {t('order_number')} {order.orderNumber}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 ml-9">
                                {t('quotation_customer')}: {customer?.name || 'N/A'}
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 flex-grow overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoCard title={t('quotation_customer')} value={customer?.name || 'N/A'} />
                            <InfoCard title={t('order_date')} value={new Date(order.createdAt).toLocaleDateString()} />
                             <InfoCard title={t('quotation_status')}>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {t(`order_status_${order.status}`)}
                                </span>
                            </InfoCard>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">{t('quotation_form_line_items')}</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left">{t('quotation_form_item_desc')}</th>
                                            <th className="px-4 py-2 text-center">{t('quotation_form_item_qty')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotation?.items.map(item => (
                                            <tr key={item.id} className="border-b dark:border-gray-700">
                                                <td className="px-4 py-2">{item.description}</td>
                                                <td className="px-4 py-2 text-center">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Order History</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg max-h-48 overflow-y-auto">
                                {order.logs.map((log, index) => (
                                    <li key={index} className="flex justify-between items-center">
                                        <span>{log.message}</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(log.timestamp).toLocaleString()} by {getUserName(log.userId)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-lg flex-shrink-0">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <label htmlFor="status" className="text-sm font-medium">{t('quotation_details_change_status')}:</label>
                            <select id="status" value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className="p-2 rounded-md border-gray-300 text-sm font-semibold bg-white dark:bg-gray-700">
                                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{t(`order_status_${s}`)}</option>)}
                            </select>
                            <button onClick={handleStatusUpdate} disabled={status === order.status} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm disabled:bg-gray-400">
                                {t('saveChanges')}
                            </button>
                        </div>
                        {canCreateShipment && (
                            <button onClick={() => setIsShipmentModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-semibold">
                                <ShippingIcon className="w-5 h-5" />
                                Create Shipment
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {isShipmentModalOpen && (
                <ShipmentFormModal
                    orderId={order.id}
                    onClose={() => {
                        setIsShipmentModalOpen(false);
                        onClose(); // Also close the details modal
                    }}
                />
            )}
        </>
    );
};

const InfoCard: React.FC<{ title: string; value?: string; children?: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">{title}</p>
        {value && <p className="text-md font-medium text-gray-900 dark:text-white">{value}</p>}
        {children}
    </div>
);


export default OrderDetailsModal;