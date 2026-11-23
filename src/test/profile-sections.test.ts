import { describe, expect, it } from 'vitest';
import { classifyRegistration, computeCategorySummary } from '@/lib/profile-helpers';
import type { CampusEvent } from '@/lib/events-data';

const baseEvent: CampusEvent = {
  id: 'freshers-garba-session',
  title: 'Freshers Garba Session',
  tag: 'Cultural',
  status: 'upcoming',
  date: '12 Oct 2025',
  time: '5:00 PM',
  place: 'College Ground',
  tags: 'Dance',
  image: 'garba',
  description: 'Welcome event',
  registration_open: true,
};

describe('profile sections helpers', () => {
  it('returns an empty summary when no clubs or ideas were submitted', () => {
    expect(computeCategorySummary([], [])).toEqual([]);
  });

  it('computes real category percentages totaling 100% from clubs and ideas', () => {
    const slices = computeCategorySummary(
      [{ category: 'Technical' }, { category: 'Cultural' }],
      [{ category: 'Technical' }],
    );

    expect(slices).toHaveLength(2);
    expect(slices[0]).toMatchObject({ category: 'Technical', count: 2, percentage: 67 });
    expect(slices[1]).toMatchObject({ category: 'Cultural', count: 1, percentage: 33 });
    expect(slices.reduce((sum, s) => sum + s.percentage, 0)).toBe(100);
  });

  it('classifies event registration statuses accurately', () => {
    expect(
      classifyRegistration(
        { id: '1', event_id: baseEvent.id, attendance_status: 'registered', created_at: '2025-10-01T00:00:00Z' },
        { ...baseEvent, status: 'upcoming' },
      ),
    ).toMatchObject({ bucket: 'upcoming', statusLabel: 'Registered' });

    expect(
      classifyRegistration(
        { id: '2', event_id: baseEvent.id, attendance_status: 'registered', created_at: '2025-10-01T00:00:00Z' },
        { ...baseEvent, status: 'ongoing' },
      ),
    ).toMatchObject({ bucket: 'ongoing', statusLabel: 'Ongoing' });

    expect(
      classifyRegistration(
        { id: '3', event_id: baseEvent.id, attendance_status: 'attended', created_at: '2025-10-01T00:00:00Z' },
        { ...baseEvent, status: 'past' },
      ),
    ).toMatchObject({ bucket: 'completed', statusLabel: 'Attended' });

    expect(
      classifyRegistration(
        { id: '4', event_id: baseEvent.id, attendance_status: 'cancelled', created_at: '2025-10-01T00:00:00Z' },
        { ...baseEvent, status: 'upcoming' },
      ),
    ).toMatchObject({ bucket: 'cancelled', statusLabel: 'Cancelled' });
  });
});
