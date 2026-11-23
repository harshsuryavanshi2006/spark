import type { AdminAnnouncement } from './announcements-data';
import type { CampusEvent } from './events-data';
import type { JoinedClubItem } from './profile-helpers';
import type { StudentRegistrationRecord, StudentSuggestionRecord } from './student-query';

export type CalendarFilterCategory = 'all' | 'events' | 'communities' | 'ideas' | 'announcements';
export type CalendarViewMode = 'month' | 'week' | 'agenda';

export type CalendarFeedItem = {
  id: string;
  filterGroup: Exclude<CalendarFilterCategory, 'all'>;
  dateKey: string;
  displayDate: string;
  timeLabel: string;
  title: string;
  description: string;
  badgeText: string;
  dotColor: string;
  tileClass: string;
  isRegisteredEvent?: boolean;
  linkTo?: '/events' | '/clubs';
  switchTab?: 'interests' | 'events';
};

const monthIndexByName: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

export function formatDateKey(year: number, monthZeroIndexed: number, day: number): string {
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function parseFlexibleDateKey(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. YYYY-MM-DD (or ISO string starting with YYYY-MM-DD)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const dt = new Date(year, month, day);
    if (dt.getFullYear() === year && dt.getMonth() === month && dt.getDate() === day) {
      return formatDateKey(year, month, day);
    }
  }

  // 2. "12 Oct 2025" or "5 Dec 2026"
  const dmyMatch = /^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const monthIdx = monthIndexByName[(dmyMatch[2] ?? '').toLowerCase()];
    const year = Number(dmyMatch[3]);
    if (monthIdx !== undefined) {
      const dt = new Date(year, monthIdx, day);
      if (dt.getFullYear() === year && dt.getMonth() === monthIdx && dt.getDate() === day) {
        return formatDateKey(year, monthIdx, day);
      }
    }
  }

  // 3. "Oct 12, 2025" or "December 12 2026"
  const mdyMatch = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(trimmed);
  if (mdyMatch) {
    const monthIdx = monthIndexByName[(mdyMatch[1] ?? '').toLowerCase()];
    const day = Number(mdyMatch[2]);
    const year = Number(mdyMatch[3]);
    if (monthIdx !== undefined) {
      const dt = new Date(year, monthIdx, day);
      if (dt.getFullYear() === year && dt.getMonth() === monthIdx && dt.getDate() === day) {
        return formatDateKey(year, monthIdx, day);
      }
    }
  }

  return null;
}

export function formatReadableDate(dateKey: string): string {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!parts) return dateKey;
  const year = Number(parts[1]);
  const month = Number(parts[2]) - 1;
  const day = Number(parts[3]);
  const dt = new Date(year, month, day);
  return dt.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function buildCalendarFeedItems(params: {
  announcements: AdminAnnouncement[];
  events: CampusEvent[];
  registrations: StudentRegistrationRecord[];
  joinedClubs: JoinedClubItem[];
  suggestions: StudentSuggestionRecord[];
}): CalendarFeedItem[] {
  const { announcements, events, registrations, joinedClubs, suggestions } = params;
  const items: CalendarFeedItem[] = [];
  const activeRegEventIds = new Set(
    registrations.filter((r) => r.attendance_status !== 'cancelled').map((r) => r.event_id),
  );

  // 1. Admin Announcements (date-wise)
  for (const ann of announcements) {
    const dateKey = parseFlexibleDateKey(ann.scheduled_date) ?? ann.created_at.slice(0, 10);
    items.push({
      id: `ann-${ann.id}`,
      filterGroup: 'announcements',
      dateKey,
      displayDate: formatReadableDate(dateKey),
      timeLabel: ann.scheduled_time || ann.category,
      title: ann.title,
      description: ann.message,
      badgeText: ann.category,
      dotColor: ann.category === 'Urgent' ? '#f43f5e' : '#3b82f6',
      tileClass: ann.category === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700',
    });
  }

  // 2. Schedule-wise Campus Events (registered & upcoming/ongoing scheduled events)
  for (const ev of events) {
    const isRegistered = activeRegEventIds.has(ev.id);
    if (!isRegistered && ev.status === 'past') {
      continue;
    }
    const dateKey = parseFlexibleDateKey(ev.date);
    if (!dateKey) continue;
    items.push({
      id: `ev-${ev.id}`,
      filterGroup: 'events',
      dateKey,
      displayDate: formatReadableDate(dateKey),
      timeLabel: ev.time || ev.place,
      title: isRegistered ? `${ev.title} (Registered)` : ev.title,
      description: `${ev.place}${ev.description ? ` · ${ev.description}` : ''}`,
      badgeText: isRegistered ? 'Registered' : ev.status === 'ongoing' ? 'Ongoing' : 'Upcoming',
      dotColor: isRegistered ? '#10b981' : '#8b5cf6',
      tileClass: isRegistered ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700',
      isRegisteredEvent: isRegistered,
      linkTo: '/events',
    });
  }

  // 3. Joined Communities
  for (const club of joinedClubs) {
    const dateKey = parseFlexibleDateKey(club.created_at) ?? club.created_at.slice(0, 10);
    items.push({
      id: `club-${club.id}`,
      filterGroup: 'communities',
      dateKey,
      displayDate: formatReadableDate(dateKey),
      timeLabel: club.category,
      title: `Joined ${club.name}`,
      description: `Active member of ${club.name} (${club.category}).`,
      badgeText: 'Community',
      dotColor: '#ec4899',
      tileClass: 'bg-emerald-100 text-emerald-700',
      linkTo: '/clubs',
    });
  }

  // 4. Club Ideas & Coordinator Status Updates
  for (const idea of suggestions) {
    const dateKey = parseFlexibleDateKey(idea.created_at) ?? idea.created_at.slice(0, 10);
    const statusLabel =
      idea.status === 'approved' ? 'Approved' : idea.status === 'declined' ? 'Declined' : 'Pending';
    items.push({
      id: `idea-${idea.id}`,
      filterGroup: 'ideas',
      dateKey,
      displayDate: formatReadableDate(dateKey),
      timeLabel: statusLabel,
      title: `Idea: ${idea.club_name}`,
      description: idea.admin_note
        ? `${statusLabel} — ${idea.admin_note}`
        : `${idea.category} · Status: ${statusLabel}. ${idea.reason}`,
      badgeText: statusLabel,
      dotColor:
        idea.status === 'approved'
          ? '#10b981'
          : idea.status === 'declined'
            ? '#f43f5e'
            : '#f59e0b',
      tileClass: 'bg-amber-100 text-amber-700',
      switchTab: 'interests',
    });
  }

  return items.sort((a, b) => b.dateKey.localeCompare(a.dateKey) || a.title.localeCompare(b.title));
}

export type MonthCell = {
  day: number | null;
  dateKey: string | null;
};

export function buildMonthGrid(year: number, monthZeroIndexed: number): MonthCell[] {
  const firstWeekday = new Date(year, monthZeroIndexed, 1).getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const cells: MonthCell[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ day: null, dateKey: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, dateKey: formatDateKey(year, monthZeroIndexed, day) });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i += 1) {
      cells.push({ day: null, dateKey: null });
    }
  }
  return cells;
}
