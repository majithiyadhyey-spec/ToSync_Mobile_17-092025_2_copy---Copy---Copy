import React, { useMemo } from 'react';
import { Project } from '../types';
import { getDaysDifference } from '../utils/dateUtils';
import { getTextColorForBackground } from '../utils/colorUtils';

interface GanttChartProps {
  projects: Project[];
  timelineStartDate?: string;
  timelineEndDate?: string;
}

const GanttChart: React.FC<GanttChartProps> = ({ projects, timelineStartDate, timelineEndDate }) => {
  const { timeline, totalDays, timelineStart } = useMemo(() => {
    if (projects.length === 0 && !timelineStartDate) {
      return { timeline: [], totalDays: 0, timelineStart: '' };
    }

    let start: Date;
    let end: Date;

    if (timelineStartDate && timelineEndDate) {
        start = new Date(timelineStartDate);
        end = new Date(timelineEndDate);
    } else {
        const allStartDates = projects.map(p => new Date(p.startDate));
        const allEndDates = projects.map(p => new Date(p.endDate));
        start = new Date(Math.min(...allStartDates.map(d => d.getTime())));
        end = new Date(Math.max(...allEndDates.map(d => d.getTime())));
    }
    
    start.setUTCHours(0,0,0,0);
    end.setUTCHours(0,0,0,0);
    
    const timelineStartStr = start.toISOString().split('T')[0];
    const timelineEndStr = end.toISOString().split('T')[0];

    const totalDays = getDaysDifference(timelineStartStr, timelineEndStr);

    const timelineDates: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + i);
      timelineDates.push(date);
    }
    return { timeline: timelineDates, totalDays, timelineStart: timelineStartStr };
  }, [projects, timelineStartDate, timelineEndDate]);

  const getDayDiff = (start: Date, end: Date): number => {
    const differenceInTime = end.getTime() - start.getTime();
    return Math.round(differenceInTime / (1000 * 3600 * 24));
  }

  const getProjectPositionAndWidth = (project: Project) => {
    // FIX: Renamed local `timelineEndDate` variable to `visibleTimelineEnd` to avoid shadowing the prop
    // and causing a temporal dead zone error. Also removed the redundant check for the optional prop.
    if (!timelineStart || !timeline || timeline.length === 0 || totalDays <= 0) return { left: '0%', width: '0%' };
    
    const timelineStartDate = new Date(timelineStart);
    const visibleTimelineEnd = new Date(timeline[timeline.length - 1]);

    const projectStartDate = new Date(project.startDate);
    const projectEndDate = new Date(project.endDate);

    // If project is completely outside the timeline, don't render it.
    if (projectEndDate < timelineStartDate || projectStartDate > visibleTimelineEnd) {
        return { left: '0%', width: '0%' };
    }

    // Clamp dates to be within the visible timeline for rendering
    const visibleStart = projectStartDate < timelineStartDate ? timelineStartDate : projectStartDate;
    const visibleEnd = projectEndDate > visibleTimelineEnd ? visibleTimelineEnd : projectEndDate;

    const offset = getDayDiff(timelineStartDate, visibleStart);
    const duration = getDayDiff(visibleStart, visibleEnd) + 1; // +1 to be inclusive of the end day
    
    const left = (offset / totalDays) * 100;
    const width = (duration / totalDays) * (100);
    
    return { left: `${Math.max(0, left)}%`, width: `${width}%` }; // modify this for duration width
  };

  return (
    <div className="w-full overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
      <div className="relative" style={{ minWidth: `${totalDays * 36}px` }}>
        
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {timeline.map((_, index) => (
            <div 
              key={`grid-${index}`} 
              className="flex-shrink-0 w-[36px] border-r border-gray-200 dark:border-gray-700" style={{width: `${100/totalDays}%`}}></div>
          ))}
        </div>

        {/* Timeline Header */}
        <div className="relative flex border-b-2 border-gray-300 dark:border-gray-600 mb-2 sticky top-0 bg-gray-50 dark:bg-gray-800/50 z-10">
          {timeline.map((date, index) => (
            <div key={index} className="flex-shrink-0 text-center" style={{ width: `${100/totalDays}%` }}>
              <div className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{date.getUTCDate()}</div>
            </div>
          ))}
        </div>
        
        {/* Project Rows */}
        <div className="relative space-y-2">
          {projects.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(project => {
            const bgColor = project.markingColor || '#A0AEC0'; // default gray
            const textColor = getTextColorForBackground(bgColor);

            return (
              <div
                key={project.id}
                className="relative h-10 flex items-center"
              >
                <div
                  className={`absolute h-full rounded-md transition-all duration-300`}
                  style={{ ...getProjectPositionAndWidth(project), backgroundColor: bgColor }}
                >
                  <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                     <p className="text-xs font-bold whitespace-nowrap truncate" style={{ color: textColor }}>
                      {`[${project.marking}] `}{project.name}
                     </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;