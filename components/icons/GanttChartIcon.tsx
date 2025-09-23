import React from 'react';

/**
 * Renders an SVG icon representing a Gantt chart.
 */
const GanttChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 8h18M3 12h18M3 16h10M3 20h5" />
  </svg>
);

export default GanttChartIcon;
