import React from 'react';

/**
 * Renders an SVG icon representing shipping or logistics.
 */
const ShippingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path d="M9 6.75V15m6-6v8.25m.5-11.25-1.5-1.5-1.5 1.5m3 0v.75M9 15h0l-3 3m0 0h3m-3 0V15m6 6v-3m0 0h-3m3 0l-3-3m-3.75 9.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m12 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c-4.805 0-8.716-3.91-8.716-8.716C3.284 7.473 7.195 3.563 12 3.563c4.805 0 8.716 3.91 8.716 8.716 0 4.806-3.91 8.717-8.716 8.717z" />
    </svg>
);

export default ShippingIcon;
