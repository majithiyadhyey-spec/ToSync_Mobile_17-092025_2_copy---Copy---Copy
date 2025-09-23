import React from 'react';

/**
 * Renders an SVG icon representing a CRM (Customer Relationship Management) system.
 */
const CrmIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.404 0L18 18.72m-7.5-2.962a3.75 3.75 0 00-5.404 0L6 18.72m-3 0a9.094 9.094 0 013.741-.479 3 3 0 014.682-2.72m-7.5-2.962V12A2.25 2.25 0 015.25 9.75h13.5A2.25 2.25 0 0121 12v1.278" />
    </svg>
);

export default CrmIcon;
