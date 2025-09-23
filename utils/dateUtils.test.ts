import { formatSecondsToHHMMSS } from './dateUtils';

describe('formatSecondsToHHMMSS', () => {
  it('formats 0 seconds correctly', () => {
    expect(formatSecondsToHHMMSS(0)).toBe('00:00:00');
  });

  it('formats a few seconds correctly', () => {
    expect(formatSecondsToHHMMSS(59)).toBe('00:00:59');
  });

  it('formats a few minutes and seconds correctly', () => {
    expect(formatSecondsToHHMMSS(125)).toBe('00:02:05'); // 2 minutes and 5 seconds
  });

  it('formats hours, minutes, and seconds correctly', () => {
    expect(formatSecondsToHHMMSS(3661)).toBe('01:01:01'); // 1 hour, 1 minute, 1 second
  });

  it('handles NaN and negative numbers by returning 00:00:00', () => {
    expect(formatSecondsToHHMMSS(NaN)).toBe('00:00:00');
    expect(formatSecondsToHHMMSS(-100)).toBe('00:00:00');
  });
});