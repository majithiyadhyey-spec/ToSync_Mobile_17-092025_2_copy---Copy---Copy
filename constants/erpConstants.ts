/**
 * This file contains the initial seed data for the ERP module of the application.
 * This data populates the ERP sections (CRM, Quotations, Orders, etc.) on first load,
 * providing a functional demo environment.
 */
import { Customer, Quotation, QuotationStatus, Order, OrderStatus, InventoryItem, Shipment } from "../types/erpTypes";

/**
 * Initial list of customers for the CRM module. Now empty for backend integration.
 */
export const CUSTOMERS: Customer[] = [];

/**
 * Initial list of price quotations. Now empty for backend integration.
 */
export const QUOTATIONS: Quotation[] = [];

/**
 * Initial list of sales orders. Now empty for backend integration.
 */
export const ORDERS: Order[] = [];

/**
 * Initial list of inventory items. Now empty for backend integration.
 */
export const INVENTORY_ITEMS: InventoryItem[] = [];

/**
 * Initial list of shipments. Now empty for backend integration.
 */
export const SHIPMENTS: Shipment[] = [];
