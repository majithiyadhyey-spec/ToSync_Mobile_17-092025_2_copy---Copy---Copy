import React, { useState } from 'react';
import { useI18n } from '../../../context/I18nContext';
import { useErpData } from '../../../context/erp/ErpContext';
import { Order, OrderStatus } from '../../../types/erpTypes';
import OrderDetailsModal from './OrderDetailsModal';

const OrderManagement: React.FC = () => {
    const { t } = useI18n();
    const { orders, customers, quotations } = useErpData();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };
    
    const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'N/A';
    
    const getQuotationTotal = (quotationId: string) => {
        const quotation = quotations.find(q => q.id === quotationId);
        if (!quotation) return 0;
        const subtotal = quotation.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        return subtotal * 1.08; // Assuming 8% tax as in form
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('erp_orders')}</h2>

             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">{t('order_number')}</th>
                            <th className="px-6 py-3">{t('quotation_customer')}</th>
                            <th className="px-6 py-3">{t('order_date')}</th>
                            <th className="px-6 py-3">{t('quotation_total')}</th>
                            <th className="px-6 py-3">{t('quotation_status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} onClick={() => handleViewDetails(order)} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.orderNumber}</td>
                                <td className="px-6 py-4">{getCustomerName(order.customerId)}</td>
                                <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{formatCurrency(getQuotationTotal(order.quotationId))}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                        {t(`order_status_${order.status}`)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
        {isDetailsOpen && selectedOrder && (
            <OrderDetailsModal
                order={selectedOrder}
                onClose={() => setIsDetailsOpen(false)}
            />
        )}
        </>
    );
};

export default OrderManagement;