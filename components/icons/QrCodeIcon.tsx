import React from 'react';

/**
 * Renders an SVG icon representing a QR code.
 */
const QrCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6.5 2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12H3m14 0h-2M5 7h2m6 0h2m-6 2v2m6-2v2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

export default QrCodeIcon;
