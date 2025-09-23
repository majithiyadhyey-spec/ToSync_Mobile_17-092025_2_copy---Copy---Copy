import React from 'react';

/**
 * Renders an SVG icon representing a barcode, used for scanning actions.
 */
const BarcodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16M6 4v4m4-4v4m4-4v4m4-4v4" />
  </svg>
);

export default BarcodeIcon;
