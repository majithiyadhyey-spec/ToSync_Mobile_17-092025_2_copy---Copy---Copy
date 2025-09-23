import React, { useState } from 'react';
import { useI18n } from '../../../context/I18nContext';
import { useErpData } from '../../../context/erp/ErpContext';
import PlusIcon from '../../icons/PlusIcon';
import ShipmentFormModal from './ShipmentFormModal';

const ShippingPlanner: React.FC = () => {
    const { t } = useI18n();
    const { shipments, orders } = useErpData();
    const [isFormOpen, setIsFormOpen] = useState(false);

    const getOrderNumber = (orderId: string) => orders.find(o => o.id === orderId)?.orderNumber || 'N/A';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('erp_shipping')}</h2>
                 <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition-colors text-sm"
                >
                    <PlusIcon className="w-5 h-5" />
                    {"Create Shipment"}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3">{t('shipment_number')}</th>
                            <th className="px-6 py-3">{t('order_number')}</th>
                            <th className="px-6 py-3">{t('dispatch_date')}</th>
                            <th className="px-6 py-3">{t('vehicle_id')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map(shipment => (
                             <tr key={shipment.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{shipment.shipmentNumber}</td>
                                <td className="px-6 py-4">{getOrderNumber(shipment.orderId)}</td>
                                <td className="px-6 py-4">{new Date(shipment.dispatchedAt).toLocaleString()}</td>
                                <td className="px-6 py-4">{shipment.vehicleId}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isFormOpen && (
                <ShipmentFormModal onClose={() => setIsFormOpen(false)} />
            )}
        </div>
    );
};

export default ShippingPlanner;