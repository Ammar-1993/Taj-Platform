import { formatToArabic12Hour, roundToSlot } from '../formatters';

describe('formatters', () => {
  describe('formatToArabic12Hour', () => {
    it('should format PM times correctly', () => {
      expect(formatToArabic12Hour('14:30')).toBe('02:30 م');
      expect(formatToArabic12Hour('23:59')).toBe('11:59 م');
      expect(formatToArabic12Hour('12:00')).toBe('12:00 م');
    });

    it('should format AM times correctly', () => {
      expect(formatToArabic12Hour('08:00')).toBe('08:00 ص');
      expect(formatToArabic12Hour('00:00')).toBe('12:00 ص');
      expect(formatToArabic12Hour('11:59')).toBe('11:59 ص');
    });

    it('should handle times with seconds', () => {
      expect(formatToArabic12Hour('14:30:00')).toBe('02:30 م');
    });

    it('should return empty string for null/undefined', () => {
      expect(formatToArabic12Hour(null)).toBe('');
      expect(formatToArabic12Hour(undefined)).toBe('');
    });
  });

  describe('roundToSlot', () => {
    it('should round to nearest 30 minutes', () => {
      expect(roundToSlot('07:18')).toBe('07:30');
      expect(roundToSlot('07:02')).toBe('07:00');
      expect(roundToSlot('13:45')).toBe('14:00');
    });
  });
});
