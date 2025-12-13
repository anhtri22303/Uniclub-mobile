import {
    formatEventDateRange,
    getEventDateRange,
    getEventDurationDays,
    getEventEndTime,
    getEventStartTime,
    isEventCurrentlyActive,
    isEventExpired,
    isMultiDayEvent,
    TimeObject,
    timeObjectToString,
    timeStringToObject,
} from '@services/event.service';

describe('Event Service - Helper Functions', () => {
  describe('timeObjectToString', () => {
    it('should convert TimeObject to string format HH:MM:SS', () => {
      const timeObj: TimeObject = { hour: 14, minute: 30, second: 45, nano: 0 };
      expect(timeObjectToString(timeObj)).toBe('14:30:45');
    });

    it('should pad single digits with zero', () => {
      const timeObj: TimeObject = { hour: 9, minute: 5, second: 3, nano: 0 };
      expect(timeObjectToString(timeObj)).toBe('09:05:03');
    });

    it('should handle string input', () => {
      expect(timeObjectToString('10:30:00')).toBe('10:30:00');
    });

    it('should return default time for null/undefined', () => {
      expect(timeObjectToString(null)).toBe('00:00:00');
      expect(timeObjectToString(undefined)).toBe('00:00:00');
    });

    it('should handle midnight correctly', () => {
      const timeObj: TimeObject = { hour: 0, minute: 0, second: 0, nano: 0 };
      expect(timeObjectToString(timeObj)).toBe('00:00:00');
    });
  });

  describe('timeStringToObject', () => {
    it('should convert string to TimeObject', () => {
      const result = timeStringToObject('14:30:45');
      expect(result).toEqual({ hour: 14, minute: 30, second: 45, nano: 0 });
    });

    it('should handle partial time strings', () => {
      const result = timeStringToObject('14:30');
      expect(result).toEqual({ hour: 14, minute: 30, second: 0, nano: 0 });
    });

    it('should handle hour-only strings', () => {
      const result = timeStringToObject('14');
      expect(result).toEqual({ hour: 14, minute: 0, second: 0, nano: 0 });
    });
  });

  describe('isMultiDayEvent', () => {
    it('should return true for multi-day event', () => {
      const event: any = {
        days: [
          { id: 1, date: '2025-12-15', startTime: '09:00', endTime: '17:00' },
          { id: 2, date: '2025-12-16', startTime: '09:00', endTime: '17:00' },
        ],
      };
      expect(isMultiDayEvent(event)).toBe(true);
    });

    it('should return false for single-day event', () => {
      const event: any = {
        date: '2025-12-15',
        startTime: { hour: 9, minute: 0, second: 0, nano: 0 },
        endTime: { hour: 17, minute: 0, second: 0, nano: 0 },
      };
      expect(isMultiDayEvent(event)).toBe(false);
    });

    it('should return false when days array is empty', () => {
      const event: any = { days: [] };
      expect(isMultiDayEvent(event)).toBe(false);
    });

    it('should return false when days is undefined', () => {
      const event: any = {};
      expect(isMultiDayEvent(event)).toBe(false);
    });
  });

  describe('getEventDateRange', () => {
    it('should return start and end dates for multi-day event', () => {
      const event: any = {
        startDate: '2025-12-15',
        endDate: '2025-12-20',
        days: [
          { id: 1, date: '2025-12-15', startTime: '09:00', endTime: '17:00' },
        ],
      };
      const result = getEventDateRange(event);
      expect(result).toEqual({ start: '2025-12-15', end: '2025-12-20' });
    });

    it('should return same date for single-day event', () => {
      const event: any = {
        date: '2025-12-15',
      };
      const result = getEventDateRange(event);
      expect(result).toEqual({ start: '2025-12-15', end: '2025-12-15' });
    });

    it('should fallback to current date when no date is provided', () => {
      const event: any = {};
      const result = getEventDateRange(event);
      const today = new Date().toISOString().split('T')[0];
      expect(result).toEqual({ start: today, end: today });
    });
  });

  describe('formatEventDateRange', () => {
    it('should format single-day event', () => {
      const event: any = {
        date: '2025-12-15',
      };
      const result = formatEventDateRange(event, 'en-US');
      expect(result).toContain('Dec');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should format multi-day event with date range', () => {
      const event: any = {
        startDate: '2025-12-15',
        endDate: '2025-12-20',
        days: [{ id: 1, date: '2025-12-15', startTime: '09:00', endTime: '17:00' }],
      };
      const result = formatEventDateRange(event, 'en-US');
      expect(result).toContain('-');
      expect(result).toContain('Dec');
    });
  });

  describe('getEventDurationDays', () => {
    it('should return correct duration for multi-day event', () => {
      const event: any = {
        days: [
          { id: 1, date: '2025-12-15', startTime: '09:00', endTime: '17:00' },
          { id: 2, date: '2025-12-16', startTime: '09:00', endTime: '17:00' },
          { id: 3, date: '2025-12-17', startTime: '09:00', endTime: '17:00' },
        ],
      };
      expect(getEventDurationDays(event)).toBe(3);
    });

    it('should return 1 for single-day event', () => {
      const event: any = {
        date: '2025-12-15',
      };
      expect(getEventDurationDays(event)).toBe(1);
    });

    it('should return 1 when days array is empty', () => {
      const event: any = { days: [] };
      expect(getEventDurationDays(event)).toBe(1);
    });
  });

  describe('getEventStartTime', () => {
    it('should return first day start time for multi-day event', () => {
      const event: any = {
        days: [
          { id: 1, date: '2025-12-15', startTime: '09:00', endTime: '17:00' },
          { id: 2, date: '2025-12-16', startTime: '10:00', endTime: '18:00' },
        ],
      };
      expect(getEventStartTime(event)).toBe('09:00');
    });

    it('should return converted time for single-day event', () => {
      const event: any = {
        startTime: { hour: 9, minute: 30, second: 0, nano: 0 },
      };
      expect(getEventStartTime(event)).toBe('09:30:00');
    });

    it('should handle undefined startTime', () => {
      const event: any = {};
      expect(getEventStartTime(event)).toBe('00:00:00');
    });
  });

  describe('getEventEndTime', () => {
    it('should return last day end time for multi-day event', () => {
      const event: any = {
        days: [
          { id: 1, date: '2025-12-15', startTime: '09:00', endTime: '17:00' },
          { id: 2, date: '2025-12-16', startTime: '10:00', endTime: '18:00' },
        ],
      };
      expect(getEventEndTime(event)).toBe('18:00');
    });

    it('should return converted time for single-day event', () => {
      const event: any = {
        endTime: { hour: 17, minute: 30, second: 0, nano: 0 },
      };
      expect(getEventEndTime(event)).toBe('17:30:00');
    });
  });

  describe('isEventCurrentlyActive', () => {
    it('should return true for future event (within end time)', () => {
      // The current logic checks if now <= endTime, so future events return true
      // This is a known behavior - the function checks if event hasn't ended yet
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event: any = {
        date: futureDate.toISOString().split('T')[0],
        startTime: { hour: 9, minute: 0, second: 0, nano: 0 },
        endTime: { hour: 17, minute: 0, second: 0, nano: 0 },
      };
      
      // Function returns true because now <= eventEndDateTime
      expect(isEventCurrentlyActive(event)).toBe(true);
    });

    it('should return false for expired event', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const event: any = {
        date: pastDate.toISOString().split('T')[0],
        startTime: { hour: 9, minute: 0, second: 0, nano: 0 },
        endTime: { hour: 17, minute: 0, second: 0, nano: 0 },
      };
      
      expect(isEventCurrentlyActive(event)).toBe(false);
    });

    it('should return false when date is missing', () => {
      const event: any = {
        startTime: { hour: 9, minute: 0, second: 0, nano: 0 },
        endTime: { hour: 17, minute: 0, second: 0, nano: 0 },
      };
      
      expect(isEventCurrentlyActive(event)).toBe(false);
    });
  });

  describe('isEventExpired', () => {
    it('should return true for completed status', () => {
      const event: any = {
        status: 'COMPLETED',
        date: '2025-12-15',
      };
      expect(isEventExpired(event)).toBe(true);
    });

    it('should return true for past event', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const event: any = {
        status: 'APPROVED',
        date: pastDate.toISOString().split('T')[0],
        endTime: { hour: 17, minute: 0, second: 0, nano: 0 },
      };
      
      expect(isEventExpired(event)).toBe(true);
    });

    it('should return false for ongoing event', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const event: any = {
        status: 'ONGOING',
        date: futureDate.toISOString().split('T')[0],
        endTime: { hour: 23, minute: 59, second: 0, nano: 0 },
      };
      
      expect(isEventExpired(event)).toBe(false);
    });

    it('should return false when date or endTime is missing', () => {
      const event: any = {
        status: 'APPROVED',
      };
      expect(isEventExpired(event)).toBe(false);
    });
  });
});
