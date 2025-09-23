import React from 'react';

/**
 * Renders an SVG icon representing finance, with a coin and globe motif.
 */
const FinanceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m12.75 0v.75A.75.75 0 0017.25 6h.75m0 0v-.75a.75.75 0 00-.75-.75h-.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 4.5h.008v.008H12v-.008z" />
  </svg>
);

export default FinanceIcon;
