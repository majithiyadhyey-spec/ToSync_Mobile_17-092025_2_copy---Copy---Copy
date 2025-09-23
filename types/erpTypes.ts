/**
 * Represents a customer or lead in the CRM system.
 */
import { Project } from '../types';

export interface Customer {
  id: string;
  name: string; // maps to custom_name
  contactName?: string; // maps to contact_name
  email?: string;
  tel?: string; // maps to tel
  billingAddress?: string; // maps to bill_address
  shippingAddress?: string; // maps to ship_address
  tags?: string[];
  createdAt: string; // ISO datetime string
  // FIX: Map status and project_names from the database record.
  status?: 'active' | 'inactive' | 'lead';
  projectNames?: string[];
  projects?: Project[];
  projectCount?: number;
}

/**
 * Defines the possible states a quotation can be in.
 */
export enum QuotationStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

/**
 * Represents a single line item within a quotation.
 */
export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Represents a price quotation provided to a customer.
 */
export interface Quotation {
  id: string;
  quotationNumber: string;
  version: number;
  customerId: string;
  projectId?: string;
  status: QuotationStatus;
  items: QuotationItem[];
  notes?: string;
  createdAt: string; // ISO datetime string
  updatedAt: string; // ISO datetime string
}

/**
 * Defines the possible states a sales order can be in.
 */
export enum OrderStatus {
    Created = 'Created',
    Confirmed = 'Confirmed',
    InProduction = 'In Production',
    Shipped = 'Shipped',
    Completed = 'Completed',
    Cancelled = 'Cancelled'
}

/**
 * Represents a sales order, typically created from an accepted quotation.
 */
export interface Order {
    id: string;
    orderNumber: string;
    quotationId: string;
    customerId: string;
    projectId?: string;
    status: OrderStatus;
    createdAt: string; // ISO datetime string
    logs: { timestamp: string; message: string; userId: string }[]; // History of the order
}

/**
 * Represents an item in the inventory/stock.
 */
export interface InventoryItem {
    id: string;
    name: string;
    sku: string; // Stock Keeping Unit
    quantity: number;
    location: string; // e.g., "Warehouse A, Shelf 3"
    relatedTaskId?: string;
    lastUpdated: string; // ISO datetime string
}

/**
 * Represents a shipment of goods for an order.
 */
export interface Shipment {
    id: string;
    shipmentNumber: string;
    orderId: string;
    dispatchedAt: string; // ISO datetime string
    vehicleId: string;
    items: { inventoryItemId: string, quantity: number }[];
}