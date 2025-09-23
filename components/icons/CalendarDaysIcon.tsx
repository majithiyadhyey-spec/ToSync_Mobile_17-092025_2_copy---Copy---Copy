import React from 'react';

/**
 * Renders an SVG icon representing a calendar.
 */
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M9.75 12.75h.008v.008H9.75v-.008zM9.75 15.75h.008v.008H9.75v-.008zM12 12.75h.008v.008H12v-.008zM12 15.75h.008v.008H12v-.008zM14.25 12.75h.008v.008h-.008v-.008zM14.25 15.75h.008v.008h-.008v-.008z" />
  </svg>
);

export default CalendarDaysIcon;