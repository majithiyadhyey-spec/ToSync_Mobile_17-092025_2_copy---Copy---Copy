import React from 'react';

/**
 * Renders the Microsoft Teams logo SVG icon.
 */
const MicrosoftTeamsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.378 11.53c0-2.34 1.95-4.23 4.35-4.23h2.64v8.46h-2.64c-2.4 0-4.35-1.89-4.35-4.23z" fill="#4B53BC"/>
    <path d="M10.388 7.3h2.64v10.92h-2.64V7.3z" fill="#4B53BC"/>
    <path d="M14.659 13.918a3.253 3.253 0 003.284-3.21v-.016a3.253 3.253 0 00-3.284-3.211h-3.328v6.437h3.328z" fill="#4B53BC"/>
    <path d="M14.659 13.918h3.328c.45 0 .814.358.814.8v1.64c0 .442-.364.8-.814.8h-3.328v-3.24z" fill="#fff"/>
    <path d="M8.217 10.372a1.45 1.45 0 11-2.9 0 1.45 1.45 0 012.9 0z" fill="#fff"/>
  </svg>
);

export default MicrosoftTeamsIcon;
