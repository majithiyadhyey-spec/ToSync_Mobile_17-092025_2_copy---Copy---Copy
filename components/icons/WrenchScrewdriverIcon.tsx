import React from 'react';

/**
 * Renders an SVG icon of a wrench and screwdriver, used for "work in progress" or "coming soon" placeholders.
 */
const WrenchScrewdriverIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.471-2.471a.563.563 0 01.801 0l3.533 3.533a.563.563 0 010 .801l-2.471 2.471m-4.509-4.509a4.5 4.5 0 10-6.364-6.364 4.5 4.5 0 006.364 6.364zm-6.364-6.364L6 7.5m6.364 6.364l-1.5-1.5" />
  </svg>
);

export default WrenchScrewdriverIcon;
