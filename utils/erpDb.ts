import { Customer, Quotation, Order, InventoryItem, Shipment } from '../types/erpTypes';
import { CUSTOMERS, QUOTATIONS, ORDERS, INVENTORY_ITEMS, SHIPMENTS } from '../constants/erpConstants';

/**
 * Interface representing the structure of the entire ERP module's data.
 */
export interface ErpData {
  customers: Customer[];
  quotations: Quotation[];
  orders: Order[];
  inventory: InventoryItem[];
  shipments: Shipment[];
}

/**
 * Loads initial empty ERP data. Data is not persisted and will reset on page reload.
 * @returns The complete ERP data object, initialized with empty arrays.
 */
export const getInitialErpData = (): ErpData => {
  const initialData: ErpData = {
    customers: CUSTOMERS,
    quotations: QUOTATIONS,
    orders: ORDERS,
    inventory: INVENTORY_ITEMS,
    shipments: SHIPMENTS,
  };
  return initialData;
};

/**
 * This function is now a no-op as localStorage persistence has been removed.
 * @param data - The ErpData object to be saved.
 */
export const saveErpData = (data: ErpData) => {
  // No-op
};
