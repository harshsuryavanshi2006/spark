import { describe, expect, it } from 'vitest';
import {
  buildCalendarFeedItems,
  buildMonthGrid,
  parseFlexibleDateKey,
} from '@/lib/calendar-helpers';
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

  it('builds December 2026 calendar grid starting on Tuesday with 31 days', () => {
    const grid = buildMonthGrid(2026, 11); // December 2026
    expect(grid[0]).toEqual({ day: null, dateKey: null }); // Sun
    expect(grid[1]).toEqual({ day: null, dateKey: null }); // Mon
    expect(grid[2]).toEqual({ day: 1, dateKey: '2026-12-01' }); // Tue
    const validDays = grid.filter((c) => c.day !== null);
    expect(validDays).toHaveLength(31);
    expect(validDays[30]).toEqual({ day: 31, dateKey: '2026-12-31' });
  });

  it('parses flexible dates and aggregates real admin announcements & events date-wise', () => {
    expect(parseFlexibleDateKey('14 Dec 2026')).toBe('2026-12-14');
    expect(parseFlexibleDateKey('2026-12-20')).toBe('2026-12-20');

    const feed = buildCalendarFeedItems({
      announcements: [
        {
          id: 'ann-1',
          title: 'Holiday Notice',
          message: 'Campus closed for maintenance.',
          category: 'Announcement',
          scheduled_date: '2026-12-14',
          scheduled_time: '09:00 AM',
          author_name: 'Admin',
          created_at: '2026-12-01T08:00:00Z',
          updated_at: '2026-12-01T08:00:00Z',
        },
      ],
      events: [{ ...baseEvent, date: '20 Dec 2026' }],
      registrations: [
        { id: 'r1', event_id: baseEvent.id, attendance_status: 'registered', created_at: '2026-12-02T10:00:00Z' },
      ],
      joinedClubs: [],
      suggestions: [],
    });

    expect(feed).toHaveLength(2);
    expect(feed.find((i) => i.filterGroup === 'announcements')).toMatchObject({
      dateKey: '2026-12-14',
      title: 'Holiday Notice',
    });
    expect(feed.find((i) => i.filterGroup === 'events')).toMatchObject({
      dateKey: '2026-12-20',
      isRegisteredEvent: true,
    });
  });
});
