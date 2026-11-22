import { describe, it, expect } from 'vitest';
import { usernameFromEmail, divisions, batches, registrationSchema, eventId } from '../lib/student-rules';
describe('student account rules', () => {
 it('removes numbers and email domain from the initial username', () => { expect(usernameFromEmail('harsh123@gmail.com')).toBe('harsh'); });
 it('provides exactly the requested divisions', () => { expect([...divisions]).toEqual(['Comp','IT','Entc','Other']); });
 it('provides exactly batches 2024 through 2027', () => { expect([...batches]).toEqual(['2024','2025','2026','2027']); });
 it('resolves the chosen event', () => { expect(eventId('Open Mic Night')).toBe('open-mic-night'); });
 const details = { full_name: 'Student', division: 'Comp', batch: '2024', year: '2nd Year', date_of_birth: '2005-01-01', college: 'PIT', phone: '+91 9876543210', terms: true, events: ['open-mic-night'] };
 it('accepts concrete allowed details', () => { expect(registrationSchema.safeParse(details).success).toBe(true); });
 it('rejects an unlisted division', () => { expect(registrationSchema.safeParse({ ...details, division: 'CSE' }).success).toBe(false); });
 it('rejects a batch outside the requested range', () => { expect(registrationSchema.safeParse({ ...details, batch: '2023' }).success).toBe(false); });
 it('requires a selected event', () => { expect(registrationSchema.safeParse({ ...details, events: [] }).success).toBe(false); });
 it('requires agreement', () => { expect(registrationSchema.safeParse({ ...details, terms: false }).success).toBe(false); });
});
