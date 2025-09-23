import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation } from '../types/erpTypes';
import { Customer } from '../types/erpTypes';

/**
 * Formats a number as a currency string (USD).
 * @param amount The number to format.
 * @returns A formatted currency string, e.g., "$1,234.56".
 */
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

/**
 * Generates a PDF document for a given quotation and triggers a browser download.
 * @param quotation The quotation data.
 * @param customer The customer data associated with the quotation.
 * @param companyName The name of the company issuing the quotation.
 */
export const exportQuotationToPdf = (quotation: Quotation, customer: Customer, companyName: string) => {
    const doc = new jsPDF();

    // Add Company Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, 14, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Industrial Way, Tech City', 14, 28);
    
    // Add Document Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PRICE QUOTATION', 200, 22, { align: 'right' });
    
    // Add Quotation Details using autoTable for alignment
    doc.setFontSize(10);
    autoTable(doc, {
        body: [
            ['Quotation #:', quotation.quotationNumber],
            ['Date:', new Date(quotation.createdAt).toLocaleDateString()],
            ['Version:', quotation.version.toString()],
        ],
        startY: 35,
        theme: 'plain',
        tableWidth: 50,
        margin: { right: 14 },
        styles: { cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        tableLineColor: 255, // no lines
        tableLineWidth: 0,
    });
    
    // Add Customer Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(customer.name, 14, 66);
    // FIX: Changed customer.address to customer.billingAddress to match the Customer type.
    if(customer.billingAddress) doc.text(customer.billingAddress, 14, 71);
    if(customer.email) doc.text(customer.email, 14, 76);
    // FIX: Changed customer.phone to customer.tel to match the Customer type.
    if(customer.tel) doc.text(customer.tel, 14, 81);

    // Create and add the main table for line items
    const tableHead = [['#', 'Description', 'Quantity', 'Unit Price', 'Total']];
    const tableBody = quotation.items.map((item, index) => [
        (index + 1).toString(),
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.quantity * item.unitPrice)
    ]);
    
    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 90,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] } // Blue header
    });
    
    // Calculate and display totals below the table
    const finalY = (doc as any).lastAutoTable.finalY;
    const subtotal = quotation.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxRate = 0.08; // Example 8% tax
    const tax = subtotal * taxRate;
    const grandTotal = subtotal + tax;
    
    doc.setFontSize(10);
    doc.text('Subtotal:', 150, finalY + 10, { align: 'right' });
    doc.text(formatCurrency(subtotal), 200, finalY + 10, { align: 'right' });
    
    doc.text(`Tax (${taxRate * 100}%):`, 150, finalY + 15, { align: 'right' });
    doc.text(formatCurrency(tax), 200, finalY + 15, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 150, finalY + 22, { align: 'right' });
    doc.text(formatCurrency(grandTotal), 200, finalY + 22, { align: 'right' });

    // Add notes section if present
    if (quotation.notes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 14, finalY + 40);
        doc.setFont('helvetica', 'normal');
        doc.text(quotation.notes, 14, finalY + 45, { maxWidth: 180 });
    }

    // Add a footer with page numbers to every page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, 287, { align: 'center' });
    }

    // Save the PDF
    doc.save(`Quotation-${quotation.quotationNumber}.pdf`);
};