import type { LucideIcon } from 'lucide-react';
import type { CampusEvent } from './events-data';
import type {
  AttendanceStatus,
  StudentRegistrationRecord,
  StudentSuggestionRecord,
} from './student-query';

export type JoinedClubItem = {
  id: string;
  name: string;
  category: string;
  created_at: string;
  icon: LucideIcon;
};

export type EventFilterTab = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type MyEventRow = {
  registration: StudentRegistrationRecord;
  event: CampusEvent;
  bucket: Exclude<EventFilterTab, 'all'>;
  statusLabel: string;
  statusClass: string;
  attendanceStatus: AttendanceStatus;
};

export type CategoryTheme = {
  card: string;
  iconBg: string;
  badge: string;
  chartColor: string;
};

const categoryThemes: Record<string, CategoryTheme> = {
  Technical: {
    card: 'bg-[#f4f6ff] border-indigo-200/80',
    iconBg: 'bg-secondary text-primary',
    badge: 'bg-indigo-100 text-indigo-800',
    chartColor: '#818cf8',
  },
  Cultural: {
    card: 'bg-[#fff2f5] border-rose-200/80',
    iconBg: 'bg-accent text-accent-foreground',
    badge: 'bg-rose-100 text-rose-800',
    chartColor: '#f472b6',
  },
  Sports: {
    card: 'bg-[#ecfdf5] border-emerald-200/80',
    iconBg: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-100 text-emerald-800',
    chartColor: '#34d399',
  },
  Workshop: {
    card: 'bg-[#fef9e7] border-amber-200/80',
    iconBg: 'bg-amber-500 text-white',
    badge: 'bg-amber-100 text-amber-800',
    chartColor: '#fbbf24',
  },
  Social: {
    card: 'bg-[#ecfeff] border-cyan-200/80',
    iconBg: 'bg-cyan text-secondary',
    badge: 'bg-cyan-100 text-cyan-900',
    chartColor: '#22d3ee',
  },
  Other: {
    card: 'bg-slate-50 border-slate-200/80',
    iconBg: 'bg-slate-700 text-white',
    badge: 'bg-slate-200 text-slate-800',
    chartColor: '#94a3b8',
  },
};

const fallbackTheme: CategoryTheme = {
  card: 'bg-slate-50 border-slate-200/80',
  iconBg: 'bg-slate-700 text-white',
  badge: 'bg-slate-200 text-slate-800',
  chartColor: '#94a3b8',
};

export function getCategoryTheme(category: string): CategoryTheme {
  return categoryThemes[category] ?? fallbackTheme;
}

export type CategorySummarySlice = {
  category: string;
  count: number;
  percentage: number;
  color: string;
};

export function computeCategorySummary(
  clubs: Pick<JoinedClubItem, 'category'>[],
  suggestions: Pick<StudentSuggestionRecord, 'category'>[],
): CategorySummarySlice[] {
  const counts = new Map<string, number>();
  for (const club of clubs) {
    counts.set(club.category, (counts.get(club.category) ?? 0) + 1);
  }
  for (const suggestion of suggestions) {
    counts.set(suggestion.category, (counts.get(suggestion.category) ?? 0) + 1);
  }

  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return [];

  const exact = entries.map(([category, count]) => {
    const raw = (count / total) * 100;
    const floor = Math.floor(raw);
    return { category, count, floor, remainder: raw - floor };
  });
  let remaining = 100 - exact.reduce((sum, item) => sum + item.floor, 0);
  const byRemainder = [...exact].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < byRemainder.length && remaining > 0; i += 1) {
    const target = byRemainder[i];
    if (target) {
      target.floor += 1;
      remaining -= 1;
    }
  }

  return exact.map((item) => ({
    category: item.category,
    count: item.count,
    percentage: item.floor,
    color: getCategoryTheme(item.category).chartColor,
  }));
}

export function classifyRegistration(
  registration: StudentRegistrationRecord,
  event: CampusEvent,
): MyEventRow {
  const attendance = registration.attendance_status;

  if (attendance === 'cancelled') {
    return {
      registration,
      event,
      bucket: 'cancelled',
      statusLabel: 'Cancelled',
      statusClass: 'bg-rose-100 text-rose-800 border-rose-200',
      attendanceStatus: attendance,
    };
  }

  if (attendance === 'attended') {
    return {
      registration,
      event,
      bucket: 'completed',
      statusLabel: 'Attended',
      statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      attendanceStatus: attendance,
    };
  }

  if (attendance === 'absent') {
    return {
      registration,
      event,
      bucket: 'completed',
      statusLabel: 'Missed',
      statusClass: 'bg-amber-100 text-amber-800 border-amber-200',
      attendanceStatus: attendance,
    };
  }

  if (event.status === 'past') {
    return {
      registration,
      event,
      bucket: 'completed',
      statusLabel: 'Completed',
      statusClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      attendanceStatus: attendance,
    };
  }

  if (event.status === 'ongoing') {
    return {
      registration,
      event,
      bucket: 'ongoing',
      statusLabel: 'Ongoing',
      statusClass: 'bg-sky-100 text-sky-800 border-sky-200',
      attendanceStatus: attendance,
    };
  }

  return {
    registration,
    event,
    bucket: 'upcoming',
    statusLabel: 'Registered',
    statusClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    attendanceStatus: attendance,
  };
}
