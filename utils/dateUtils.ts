import { Task, TaskStatus } from '../types';
import { TASK_DEFINITIONS } from '../constants';

/**
 * Resolves the timezone string for use in `toLocaleDateString` and other Intl functions.
 * 'local' will be converted to `undefined` to let the browser use its default timezone.
 * 'UTC' or any IANA string will be passed through.
 * @param timeZone - The timezone string ('local', 'UTC', or IANA).
 * @returns A valid timezone string for Intl API or undefined.
 */
const getResolvedTimeZone = (timeZone: string): string | undefined => {
  if (timeZone === 'local') {
    return undefined; // Let the browser decide
  }
  return timeZone; // UTC or IANA string
};

/**
 * Formats an ISO date string into a more readable format (e.g., "Jul 20, 2024").
 * @param dateString - The ISO date string to format.
 * @param timeZone - The timezone to format the date in ('local', 'UTC', or IANA). Defaults to 'UTC'.
 * @returns The formatted date string, or 'N/A' if the input is invalid.
 */
export const formatDate = (dateString: string, timeZone: string = 'UTC'): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: getResolvedTimeZone(timeZone),
    });
  } catch (e) {
    console.error(`Invalid date string for formatDate: ${dateString}`, e);
    return 'Invalid Date';
  }
};

/**
 * Formats an ISO datetime string into a more readable format including time (e.g., "Jul 20, 2024, 14:30:00 GMT").
 * @param dateString - The ISO datetime string to format.
 * @param timeZone - The timezone to format the datetime in ('local', 'UTC', or IANA). Defaults to 'UTC'.
 * @returns The formatted datetime string, or 'N/A' if the input is invalid.
 */
export const formatDateTime = (dateString: string, timeZone: string = 'UTC'): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
      timeZone: getResolvedTimeZone(timeZone),
    });
  } catch (e) {
    console.error(`Invalid date string for formatDateTime: ${dateString}`, e);
    return 'Invalid Date';
  }
};

/**
 * Calculates the total number of days between two date strings, inclusive.
 * @param startDateString - The start date string.
 * @param endDateString - The end date string.
 * @returns The total number of days.
 */
export const getDaysDifference = (startDateString: string, endDateString: string): number => {
  const start = new Date(startDateString);
  const end = new Date(endDateString);
  const differenceInTime = end.getTime() - start.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  return Math.max(differenceInDays, 0) + 1; // Include start day, so min duration is 1
};

/**
 * Converts a total number of seconds into a HH:MM:SS formatted string.
 * @param totalSeconds - The total number of seconds.
 * @returns The formatted time string.
 */
export const formatSecondsToHHMMSS = (totalSeconds: number): string => {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    totalSeconds = 0;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

/**
 * Determines the completion date of a task by finding the latest date
 * in its dailyTimeSpent logs. Falls back to the deadline if no time is logged.
 * @param task - The task object.
 * @returns The completion date as a 'YYYY-MM-DD' string, or null if not applicable.
 */
export const getTaskCompletionDate = (task: Task): string | null => {
  if (!task.dailyTimeSpent) {
    // As a fallback for completed tasks with no time spent, use the deadline.
    if (task.status === 'Completed') {
        return task.deadline.split('T')[0]; // Return just the date part
    }
    return null;
  }

  let latestDate: string | null = null;

  // Iterate through all worker logs to find the most recent date with time recorded.
  for (const workerId in task.dailyTimeSpent) {
    const dailyRecords = task.dailyTimeSpent[workerId];
    for (const dateStr in dailyRecords) {
      if (!latestDate || dateStr > latestDate) {
        latestDate = dateStr;
      }
    }
  }
  
  // Another fallback for completed tasks that have the dailyTimeSpent object but no entries.
  if (!latestDate && task.status === 'Completed') {
      return task.deadline.split('T')[0];
  }

  return latestDate;
};

/**
 * Calculates the progress of a task based on logged time versus estimated production hours.
 * The estimated hours are derived from the task's name by matching it to a TaskDefinition.
 * @param task - The task object.
 * @returns The progress percentage (0-100).
 */
export const getTaskProgress = (task: Task): number => {
  if (task.status === TaskStatus.Completed) {
    return 100;
  }

  let definition: (typeof TASK_DEFINITIONS)[0] | undefined;
  let bestMatchLength = 0;

  // Find the best matching TaskDefinition based on the task name
  for (const def of TASK_DEFINITIONS) {
      if (task.name.startsWith(def.name) && def.name.length > bestMatchLength) {
          definition = def;
          bestMatchLength = def.name.length;
      }
  }

  if (!definition || !definition.baseProductionHours || definition.baseProductionHours <= 0) {
    return 0; // Cannot determine progress without an estimated time
  }

  const estimatedSeconds = definition.baseProductionHours * 3600;

  const loggedSeconds = Object.values(task.dailyTimeSpent || {}).reduce(
    (total, workerLog) =>
      total + Object.values(workerLog).reduce((workerTotal, day) => workerTotal + day.time, 0),
    0
  );

  const progress = Math.round((loggedSeconds / estimatedSeconds) * 100);
  
  return Math.min(progress, 100); // Cap at 100%
};