import React, { useState, useRef, useEffect } from 'react';
import { exportToCsv } from '../utils/csvExporter';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DownloadIcon from './icons/DownloadIcon';
import CsvIcon from './icons/CsvIcon';
import ExcelIcon from './icons/ExcelIcon';
import PdfIcon from './icons/PdfIcon';

interface ExportDropdownProps {
  data: Record<string, any>[];
  baseFilename: string;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ data, baseFilename, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${baseFilename}.xlsx`);
    setIsOpen(false);
  };

  const handleExportPdf = () => {
    if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
    }
    const doc = new jsPDF();
    const tableHead = [Object.keys(data[0])];
    const tableBody = data.map(row => Object.values(row));

    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 15,
        didDrawPage: (data) => {
            // Header
            doc.setFontSize(20);
            doc.text(t('appTitle'), data.settings.margin.left, 10);
        },
    });

    doc.save(`${baseFilename}.pdf`);
    setIsOpen(false);
  };

  const handleExportCsv = () => {
    exportToCsv(`${baseFilename}.csv`, data);
    setIsOpen(false);
  }

  const isDisabled = !data || data.length === 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-500 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <DownloadIcon className="w-5 h-5" />
        {t('reports_export')}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 ring-1 ring-black/5">
          <div className="py-1">
            <button onClick={handleExportCsv} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                <CsvIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                {t('reports_exportCsv')}
            </button>
            <button onClick={handleExportExcel} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                <ExcelIcon className="w-5 h-5 text-green-600" />
                {t('reports_exportExcel')}
            </button>
            <button onClick={handleExportPdf} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                <PdfIcon className="w-5 h-5 text-red-600" />
                {t('reports_exportPdf')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDropdown;