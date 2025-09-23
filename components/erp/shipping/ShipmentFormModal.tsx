import React, { useState, useMemo, useEffect } from 'react';
import { useErpData } from '../../../context/erp/ErpContext';
import { useI18n } from '../../../context/I18nContext';
import { OrderStatus } from '../../../types/erpTypes';
import XIcon from '../../icons/XIcon';
import ShippingIcon from '../../icons/ShippingIcon';

interface ShipmentFormModalProps {
    onClose: () => void;
    orderId?: string;
}

const ShipmentFormModal: React.FC<ShipmentFormModalProps> = ({ onClose, orderId }) => {
    const { t } = useI18n();
    const { orders, addShipment } = useErpData();
    
    const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
    const [dispatchedAt, setDispatchedAt] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [error, setError] = useState('');
    
    useEffect(() => {
        if (orderId) {
            setSelectedOrderId(orderId);
        }
    }, [orderId]);

    const eligibleOrders = useMemo(() => {
        return orders.filter(o => [OrderStatus.Confirmed, OrderStatus.InProduction].includes(o.status));
    }, [orders]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!selectedOrderId || !dispatchedAt || !vehicleId) {
            setError('All fields are required.');
            return;
        }
        addShipment({
            orderId: selectedOrderId,
            dispatchedAt,
            vehicleId
        });
        onClose();
    };

    const labelClasses = "block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1";
    const inputClasses = "block w-full p-2.5 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShippingIcon className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Shipment</h2>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    {error && <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-md text-sm dark:bg-red-900/20 dark:border-red-500/50 dark:text-red-300">{error}</div>}
                    
                    <div>
                        <label htmlFor="orderId" className={labelClasses}>{t('order_number')}</label>
                        <select
                            id="orderId"
                            value={selectedOrderId}
                            onChange={e => setSelectedOrderId(e.target.value)}
                            className={inputClasses}
                            disabled={!!orderId}
                            required
                        >
                            <option value="">Select an order...</option>
                            {eligibleOrders.map(o => (
                                <option key={o.id} value={o.id}>{o.orderNumber}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dispatchedAt" className={labelClasses}>{t('dispatch_date')}</label>
                            <input
                                type="datetime-local"
                                id="dispatchedAt"
                                value={dispatchedAt}
                                onChange={e => setDispatchedAt(e.target.value)}
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="vehicleId" className={labelClasses}>{t('vehicle_id')}</label>
                            <input
                                type="text"
                                id="vehicleId"
                                value={vehicleId}
                                onChange={e => setVehicleId(e.target.value)}
                                className={inputClasses}
                                placeholder="e.g., TRUCK-01"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-4 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">{t('cancel')}</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-semibold">Create Shipment</button>
                </div>
            </form>
        </div>
    );
};

export default ShipmentFormModal;