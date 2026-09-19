import { daysSince, badgeColor, formateAgeBadge } from '../../screens/HomeScreen';

// TC36, TC43
describe('daysSince', () => {
  it('returns 0 for today', () => {
      const today = new Date().toISOString();
      expect(daysSince(today)).toBe(0);
  });

  it('returns 1 for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(daysSince(yesterday)).toBe(1);
  });
});

// TC36, TC43, TC54
describe('badgeColor', () => {
  it('returns green for <=180 days', () => {
    expect(badgeColor(100)).toBe('#4CAF50');
    expect(badgeColor(-1)).toBe('#4CAF50');
  });

  it('returns orange for 181–365 days', () => {
    expect(badgeColor(200)).toBe('#FF9800');
    expect(badgeColor(181)).toBe('#FF9800');
    expect(badgeColor(365)).toBe('#FF9800');
  });

  it('returns red for > 365 days', () => {
    expect(badgeColor(400)).toBe('#F44336');
    expect(badgeColor(366)).toBe('#F44336');
  });
});

// TC36, TC43, TC54
describe('formateAgeBadge', () => {
  it('returns "N/A" when days is 0', () => {
    expect(formateAgeBadge(0)).toBe('N/A');
  });

  it('returns "N/A" when days is undefined or null', () => {
    // @ts-ignore
    expect(formateAgeBadge(undefined)).toBe('N/A');
    // @ts-ignore
    expect(formateAgeBadge(null)).toBe('N/A');
  });

  it('returns "0d" when days is negative', () => {
    expect(formateAgeBadge(-5)).toBe('0d');
  });

  it('returns "<days> D" when days is less than 30', () => {
    expect(formateAgeBadge(1)).toBe('1 D');
    expect(formateAgeBadge(15)).toBe('15 D');
    expect(formateAgeBadge(29)).toBe('29 D');
  });

  it('returns "<months> M" when days is between 30 and 364', () => {
    expect(formateAgeBadge(30)).toBe('1 M');    // 30/30 = 1
    expect(formateAgeBadge(59)).toBe('1 M');    // 59/30 = 1.966 -> floor = 1
    expect(formateAgeBadge(60)).toBe('2 M');    // 60/30 = 2
    expect(formateAgeBadge(364)).toBe('12 M');  // 364/30 = 12.133 -> floor = 12
  });

  it('returns "<years> Y" when days is 365 or more', () => {
    expect(formateAgeBadge(365)).toBe('1 Y');   // 365/365 = 1
    expect(formateAgeBadge(730)).toBe('2 Y');   // 730/365 = 2
    expect(formateAgeBadge(800)).toBe('2 Y');   // 800/365 = 2.19 -> floor = 2
  });

  it('handles edge cases correctly', () => {
    expect(formateAgeBadge(0)).toBe('N/A');       // zero days
    expect(formateAgeBadge(-5)).toBe('0d');      // negative days
    expect(formateAgeBadge(1)).toBe('1 D');      // 1 day
    expect(formateAgeBadge(29)).toBe('29 D');    // just under 30 days
    expect(formateAgeBadge(30)).toBe('1 M');     // exact 30
    expect(formateAgeBadge(364)).toBe('12 M');   // just under a year
    expect(formateAgeBadge(365)).toBe('1 Y');    // exact year
    expect(formateAgeBadge(800)).toBe('2 Y');    // multiple years
  });
});