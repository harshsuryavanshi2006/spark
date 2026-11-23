import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calendar,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Star,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventThumbnail } from '@/components/event-thumbnail';
import type { CampusEvent } from '@/lib/events-data';
import {
  classifyRegistration,
  type EventFilterTab,
  type MyEventRow,
} from '@/lib/profile-helpers';
import type { StudentRegistrationRecord } from '@/lib/student-query';

type MyEventsSectionProps = {
  registrations: StudentRegistrationRecord[];
  allEvents: CampusEvent[];
  searchQuery: string;
  onBackToProfile: () => void;
  onCancelRegistration: (registrationId: string) => Promise<void>;
};

const filterTabs: { id: EventFilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function EventsIllustration() {
  return (
    <svg
      viewBox="0 0 210 130"
      aria-hidden="true"
      className="h-28 w-44 shrink-0 hidden sm:block select-none"
    >
      <path
        d="M26,90 C14,54 44,18 90,22 C122,25 142,10 174,24 C198,35 198,82 174,104 C148,128 42,126 26,90 Z"
        fill="#ebe6ff"
      />
      <circle cx="24" cy="46" r="3" fill="#facc15" />
      <path d="M174 36 L181 28 M182 50 L191 48" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
      <g transform="translate(52,18) rotate(-6)">
        <rect x="0" y="10" width="96" height="78" rx="12" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
        <path d="M0 24 C0 15 5 10 12 10 L84 10 C91 10 96 15 96 24 L96 30 L0 30 Z" fill="#c7d2fe" stroke="#1e293b" strokeWidth="2.2" />
        <rect x="20" y="2" width="6" height="14" rx="3" fill="#1e293b" />
        <rect x="70" y="2" width="6" height="14" rx="3" fill="#1e293b" />
        <rect x="14" y="40" width="14" height="11" rx="3" fill="#e0e7ff" />
        <rect x="34" y="40" width="14" height="11" rx="3" fill="#fbcfe8" />
        <rect x="54" y="40" width="14" height="11" rx="3" fill="#e0e7ff" />
        <rect x="74" y="40" width="12" height="11" rx="3" fill="#fde68a" />
        <rect x="14" y="57" width="14" height="11" rx="3" fill="#bbf7d0" />
        <rect x="34" y="57" width="14" height="11" rx="3" fill="#e0e7ff" />
        <rect x="54" y="57" width="14" height="11" rx="3" fill="#fbcfe8" />
        <rect x="74" y="57" width="12" height="11" rx="3" fill="#e0e7ff" />
      </g>
      <g transform="translate(132,68)">
        <circle cx="22" cy="22" r="20" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
        <circle cx="22" cy="22" r="14" fill="#fef3c7" />
        <path d="M22 13 L22 22 L28 26" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function MyEventsSection({
  registrations,
  allEvents,
  searchQuery,
  onBackToProfile,
  onCancelRegistration,
}: MyEventsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<EventFilterTab>('all');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const myEvents: MyEventRow[] = registrations.flatMap((reg) => {
    const matchedEvent = allEvents.find((ev) => ev.id === reg.event_id);
    return matchedEvent ? [classifyRegistration(reg, matchedEvent)] : [];
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredEvents = myEvents.filter((item) => {
    const matchesTab = activeFilter === 'all' || item.bucket === activeFilter;
    const matchesSearch =
      !normalizedQuery ||
      `${item.event.title} ${item.event.place} ${item.event.tag} ${item.statusLabel}`
        .toLowerCase()
        .includes(normalizedQuery);
    return matchesTab && matchesSearch;
  });

  const totalCount = myEvents.length;
  const attendedCount = myEvents.filter((item) => item.attendanceStatus === 'attended').length;
  const upcomingCount = myEvents.filter(
    (item) => item.bucket === 'upcoming' || item.bucket === 'ongoing',
  ).length;
  const completedCount = myEvents.filter((item) => item.bucket === 'completed').length;

  async function handleConfirmCancel(registrationId: string) {
    setActionError('');
    setCancellingId(registrationId);
    try {
      await onCancelRegistration(registrationId);
      setConfirmCancelId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to cancel registration.');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onBackToProfile}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-[#f2effd] px-3.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-indigo-100"
          >
            <ArrowLeft className="size-3.5" />
            Back to Profile
          </button>
          <div className="pt-1">
            <h1 className="font-hand text-4xl sm:text-[2.6rem] leading-tight text-secondary flex items-center gap-2.5">
              <span className="inline-grid size-9 place-items-center rounded-xl bg-indigo-100 text-secondary">
                <CalendarDays className="size-5 text-indigo-700" />
              </span>
              My Events
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your event journey on Spark!
            </p>
          </div>
        </div>
        <EventsIllustration />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter registered events">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveFilter(tab.id)}
              className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                isActive
                  ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                  : 'bg-[#f2effd] text-secondary/80 hover:bg-indigo-100 border border-indigo-100'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      )}

      {/* Event list */}
      {myEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-indigo-200 bg-[#f8f7fe] px-6 py-10 text-center">
          <p className="text-sm font-medium text-secondary">No data submitted till now</p>
          <p className="text-xs text-muted-foreground mt-1">
            Register for campus events to track your upcoming, completed, and cancelled participation here.
          </p>
          <Button asChild size="sm" className="mt-4 rounded-full">
            <Link to="/events">
              Explore Events <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-indigo-200 bg-[#f8f7fe] px-6 py-9 text-center">
          <p className="text-sm font-medium text-secondary">
            {normalizedQuery
              ? `No events match "${searchQuery.trim()}".`
              : 'No data submitted till now'}
          </p>
          {!normalizedQuery && (
            <p className="text-xs text-muted-foreground mt-1">
              You have no registrations under {filterTabs.find((t) => t.id === activeFilter)?.label} yet.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map(({ registration, event, bucket, statusLabel, statusClass }) => {
            const canCancel = bucket === 'upcoming' || bucket === 'ongoing';
            const isConfirming = confirmCancelId === registration.id;
            const isCancelling = cancellingId === registration.id;
            return (
              <div
                key={registration.id}
                className="rounded-2xl border border-indigo-100 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3.5 transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="h-16 w-full sm:w-28 rounded-xl overflow-hidden shrink-0">
                  <EventThumbnail image={event.image} className="size-full" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sm sm:text-base text-secondary truncate">
                      {event.title}
                    </h3>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {event.tag}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Calendar className="size-3.5 text-indigo-500" />
                      {event.date}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5 text-indigo-500" />
                      {event.place}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </span>

                  {canCancel && !isConfirming && (
                    <button
                      type="button"
                      onClick={() => setConfirmCancelId(registration.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 transition"
                    >
                      Cancel
                    </button>
                  )}

                  {canCancel && isConfirming && (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={() => void handleConfirmCancel(registration.id)}
                        className="rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60 transition"
                      >
                        {isCancelling ? 'Cancelling…' : 'Confirm Cancel'}
                      </button>
                      <button
                        type="button"
                        disabled={isCancelling}
                        onClick={() => setConfirmCancelId(null)}
                        className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition"
                      >
                        Keep
                      </button>
                    </div>
                  )}

                  <Link
                    to="/events"
                    aria-label={`View ${event.title}`}
                    className="size-8 rounded-full grid place-items-center text-muted-foreground hover:bg-muted hover:text-secondary transition"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Stats */}
      <section
        aria-labelledby="event-stats-heading"
        className="rounded-3xl border border-indigo-200/75 bg-[#f2effd] p-5 sm:p-6 shadow-xs"
      >
        <h2
          id="event-stats-heading"
          className="font-hand text-2xl text-secondary flex items-center gap-2 mb-4"
        >
          <BarChart3 className="size-5 text-indigo-600" />
          Event Stats
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-indigo-200/70">
          <div className="flex flex-col items-center text-center px-3">
            <span className="size-8 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center mb-1.5">
              <Calendar className="size-4" />
            </span>
            <p className="text-xl font-bold text-secondary tabular-nums">{totalCount}</p>
            <p className="text-xs font-medium text-muted-foreground">Total Events</p>
          </div>
          <div className="flex flex-col items-center text-center px-3">
            <span className="size-8 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center mb-1.5">
              <CheckCircle2 className="size-4" />
            </span>
            <p className="text-xl font-bold text-secondary tabular-nums">{attendedCount}</p>
            <p className="text-xs font-medium text-muted-foreground">Attended</p>
          </div>
          <div className="flex flex-col items-center text-center px-3">
            <span className="size-8 rounded-full bg-amber-100 text-amber-600 grid place-items-center mb-1.5">
              <Star className="size-4 fill-amber-400" />
            </span>
            <p className="text-xl font-bold text-secondary tabular-nums">{upcomingCount}</p>
            <p className="text-xs font-medium text-muted-foreground">Upcoming</p>
          </div>
          <div className="flex flex-col items-center text-center px-3">
            <span className="size-8 rounded-full bg-amber-100 text-amber-700 grid place-items-center mb-1.5">
              <Trophy className="size-4" />
            </span>
            <p className="text-xl font-bold text-secondary tabular-nums">{completedCount}</p>
            <p className="text-xs font-medium text-muted-foreground">Completed</p>
          </div>
        </div>
      </section>
    </div>
  );
}
