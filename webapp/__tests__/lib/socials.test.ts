import { normaliseSocials, socialHref, toSocials } from '@/lib/socials';

describe('socials', () => {
  it('keeps filled fields and turns blank ones into null', () => {
    expect(normaliseSocials({ email: ' ann@example.com ', phone: '', website: 'https://ann.ca' })).toEqual({
      email: 'ann@example.com',
      phone: null,
      website: 'https://ann.ca',
      instagram: null,
      facebook: null,
      x: null,
      linkedin: null,
    });
  });

  it('accepts an empty object because every field is optional', () => {
    expect(Object.values(normaliseSocials({})).every((v) => v === null)).toBe(true);
  });

  it('rejects a bad email', () => {
    expect(() => normaliseSocials({ email: 'not-an-email' })).toThrow('Enter a valid email address.');
  });

  it('rejects links that are not https, including javascript: links', () => {
    expect(() => normaliseSocials({ x: 'javascript:alert(1)' })).toThrow('X must be a link that starts with https://');
    expect(() => normaliseSocials({ website: 'http://ann.ca' })).toThrow('https://');
  });

  it('rejects values that are too long or not text', () => {
    expect(() => normaliseSocials({ phone: '1'.repeat(31) })).toThrow('Phone must be 30 characters or fewer.');
    expect(() => normaliseSocials({ phone: 123 })).toThrow('Phone must be text.');
    expect(() => normaliseSocials('nope')).toThrow('Contact details must be an object.');
  });

  it('reads a missing row as all null', () => {
    expect(toSocials(null).email).toBeNull();
    expect(toSocials({ linkedin: 'https://linkedin.com/in/ann' }).linkedin).toBe('https://linkedin.com/in/ann');
  });

  it('builds mailto, tel and plain links', () => {
    expect(socialHref('email', 'ann@example.com')).toBe('mailto:ann@example.com');
    expect(socialHref('phone', '+1 (780) 555-0100')).toBe('tel:+17805550100');
    expect(socialHref('link', 'https://ann.ca')).toBe('https://ann.ca');
  });
});
