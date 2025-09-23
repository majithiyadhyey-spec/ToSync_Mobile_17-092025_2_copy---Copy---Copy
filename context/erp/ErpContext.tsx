import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Customer, Quotation, Order, InventoryItem, QuotationStatus, OrderStatus, Shipment } from '../../types/erpTypes';
import * as api from '../../api';
import { useAuth } from '../AuthContext';
import { useFormworkData } from '../FormworkDataContext';
import { Project } from '../../types';
import { supabase } from '../../utils/supabaseClient';

interface ErpContextType {
    customers: Customer[];
    quotations: Quotation[];
    orders: Order[];
    inventory: InventoryItem[];
    shipments: Shipment[];
    loading: boolean;
    error: string | null;
    addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
    updateCustomer: (updatedCustomer: Customer) => Promise<void>;
    deleteCustomer: (customerId: string) => Promise<void>;
    addQuotation: (quotationData: Omit<Quotation, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'quotationNumber'>) => Promise<Quotation>;
    updateQuotation: (updatedQuotation: Quotation) => Promise<void>;
    updateQuotationStatus: (quotationId: string, status: QuotationStatus) => Promise<void>;
    convertQuotationToOrder: (quotationId: string) => Promise<Order | null>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    addShipment: (data: { orderId: string; dispatchedAt: string; vehicleId: string }) => Promise<void>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { currentUser } = useAuth();
    const { activeProjects, addProject } = useFormworkData();

    const loadErpData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.fetchErpData();
            setCustomers(data.customers || []);
            setQuotations(data.quotations || []);
            setOrders(data.orders || []);
            setInventory(data.inventory || []);
            setShipments(data.shipments || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load ERP data from the server.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadErpData();

        const channel = supabase
            .channel('erp-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customer',
                },
                (payload) => {
                    console.log('ERP Customer table change received:', payload);
                    loadErpData();
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to Supabase Realtime for ERP!');
                }
                if (status === 'CHANNEL_ERROR') {
                   console.error('Supabase Realtime ERP channel error:', err);
                   setError(prev => prev ? `${prev}\nERP Realtime connection failed.` : `ERP Realtime connection failed: ${err?.message}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadErpData]);
    
    const customersWithProjects = useMemo(() => {
        return customers.map(customer => {
            const customerProjects = activeProjects.filter(p => p.clientId === customer.id);
            return {
                ...customer,
                projects: customerProjects,
                projectCount: customerProjects.length,
            };
        });
    }, [customers, activeProjects]);

    const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> => {
        const newCustomer = await api.addCustomer(customerData);
        setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        return newCustomer;
    }, []);

    const updateCustomer = useCallback(async (updatedCustomer: Customer) => {
        const updated = await api.updateCustomer(updatedCustomer);
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
    }, []);
    
    const deleteCustomer = useCallback(async (customerId: string) => {
        await api.deleteCustomer(customerId);
        setCustomers(prev => prev.filter(c => c.id !== customerId));
    }, []);

    const addQuotation = useCallback(async (quotationData: Omit<Quotation, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'quotationNumber'>): Promise<Quotation> => {
        const newQuotation = await api.addQuotation(quotationData);
        setQuotations(prev => [...prev, newQuotation]);
        return newQuotation;
    }, []);
    
    const updateQuotation = useCallback(async (updatedQuotation: Quotation) => {
        const updated = await api.updateQuotation(updatedQuotation);
        setQuotations(prev => prev.map(q => q.id === updated.id ? updated : q));
    }, []);
    
    // FIX: Refactored to correctly merge partial API response with existing state, preventing type errors.
    const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
        await api.updateOrderStatus(orderId, status);
        setOrders(prevOrders => prevOrders.map(o => {
            if (o.id === orderId) {
                return { ...o, status };
            }
            return o;
        }));
    }, []);

    // FIX: Refactored to correctly merge partial API response and handle project creation logic.
    const updateQuotationStatus = useCallback(async (quotationId: string, status: QuotationStatus) => {
        const updatedPartial = await api.updateQuotationStatus(quotationId, status);
        
        let updatedQuotation: Quotation | undefined;
        setQuotations(prev => prev.map(q => {
            if (q.id === updatedPartial.id) {
                updatedQuotation = { ...q, status: updatedPartial.status, updatedAt: new Date().toISOString() };
                return updatedQuotation;
            }
            return q;
        }));
    
        if (status === QuotationStatus.Accepted && updatedQuotation) {
            const customer = customers.find(c => c.id === updatedQuotation!.customerId);
            if (customer) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + 30);
    
                // FIX: Added missing 'clientId' property required by the Project type.
                const newProjectData: Omit<Project, 'id'> = {
                    name: `Project for ${updatedQuotation!.quotationNumber}`,
                    marking: `${customer.name.substring(0, 3).toUpperCase().replace(/\s/g, '')}-${updatedQuotation!.quotationNumber.slice(-3)}`,
                    client: customer.name,
                    clientId: customer.id,
                    markingColor: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                };
                await addProject(newProjectData);
            }
        }
    }, [customers, addProject]);
    
    const convertQuotationToOrder = useCallback(async (quotationId: string): Promise<Order | null> => {
        const newOrder = await api.convertQuotationToOrder(quotationId);
        if (newOrder) {
            setOrders(prev => [...prev, newOrder]);
        }
        return newOrder;
    }, []);
    
    const addShipment = useCallback(async (data: { orderId: string; dispatchedAt: string; vehicleId: string; }) => {
        const newShipment = await api.addShipment(data);
        setShipments(prev => [...prev, newShipment]);
        await updateOrderStatus(data.orderId, OrderStatus.Shipped);
    }, [updateOrderStatus]);


    const value = useMemo(() => ({
        customers: customersWithProjects, quotations, orders, inventory, shipments, loading, error,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addQuotation,
        updateQuotation,
        updateQuotationStatus,
        convertQuotationToOrder,
        updateOrderStatus,
        addShipment
    }), [customersWithProjects, quotations, orders, inventory, shipments, loading, error, addCustomer, updateCustomer, deleteCustomer, addQuotation, updateQuotation, updateQuotationStatus, convertQuotationToOrder, updateOrderStatus, addShipment]);

    return (
        <ErpContext.Provider value={value}>
            {children}
        </ErpContext.Provider>
    );
};


export const useErpData = (): ErpContextType => {
    const context = useContext(ErpContext);
    if (context === undefined) {
        throw new Error('useErpData must be used within an ErpProvider');
    }
    return context;
}
