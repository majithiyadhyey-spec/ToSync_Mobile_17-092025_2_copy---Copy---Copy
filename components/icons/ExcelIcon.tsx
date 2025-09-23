import React from 'react';

/**
 * Renders an SVG icon representing an Excel file, used in export options.
 */
const ExcelIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.5h-3.045M15 17.25a3 3 0 01-3 3h-1.5a3 3 0 01-3-3V8.25a3 3 0 013-3h1.5a3 3 0 013 3v9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 8.25L3 12m0 0l.375 3.75M3 12h18M20.625 8.25L21 12m0 0l-.375 3.75M17.25 21v-2.625" />
  </svg>
);

export default ExcelIcon;
