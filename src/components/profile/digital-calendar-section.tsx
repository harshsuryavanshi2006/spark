import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  Lightbulb,
  Megaphone,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import type { AdminAnnouncement } from '@/lib/announcements-data';
import {
  buildCalendarFeedItems,
  buildMonthGrid,
  formatDateKey,
  formatReadableDate,
  type CalendarFeedItem,
  type CalendarFilterCategory,
  type CalendarViewMode,
} from '@/lib/calendar-helpers';
import type { CampusEvent } from '@/lib/events-data';
import type { JoinedClubItem } from '@/lib/profile-helpers';
import type { StudentRegistrationRecord, StudentSuggestionRecord } from '@/lib/student-query';

type DigitalCalendarSectionProps = {
  announcements: AdminAnnouncement[];
  announcementsLoading: boolean;
  events: CampusEvent[];
  registrations: StudentRegistrationRecord[];
  joinedClubs: JoinedClubItem[];
  suggestions: StudentSuggestionRecord[];
  searchQuery: string;
  readIds: string[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: (ids: string[]) => void;
  onBackToProfile: () => void;
  onSwitchTab: (tab: 'interests' | 'events') => void;
};

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const quickFilters: {
  id: CalendarFilterCategory;
  label: string;
  icon: typeof LayoutGrid;
  iconColor: string;
}[] = [
  { id: 'all', label: 'All', icon: LayoutGrid, iconColor: 'text-white' },
  { id: 'events', label: 'Events', icon: Calendar, iconColor: 'text-indigo-600' },
  { id: 'communities', label: 'Communities', icon: Users, iconColor: 'text-emerald-600' },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb, iconColor: 'text-amber-500' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, iconColor: 'text-sky-600' },
];

const viewModes: { id: CalendarViewMode; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'agenda', label: 'Agenda' },
];

function ItemIcon({ item }: { item: CalendarFeedItem }) {
  if (item.filterGroup === 'events') return <Calendar className="size-5" />;
  if (item.filterGroup === 'communities') return <Users className="size-5" />;
  if (item.filterGroup === 'ideas') return <Lightbulb className="size-5" />;
  return <Megaphone className="size-5" />;
}

function DayCellIcon({ item }: { item: CalendarFeedItem }) {
  if (item.filterGroup === 'events') {
    return item.isRegisteredEvent ? (
      <Star className="size-3.5 text-amber-500 fill-amber-400" />
    ) : (
      <Calendar className="size-3.5 text-indigo-600" />
    );
  }
  if (item.filterGroup === 'communities') return <Users className="size-3.5 text-emerald-600" />;
  if (item.filterGroup === 'ideas') return <Lightbulb className="size-3.5 text-amber-500" />;
  return <Megaphone className="size-3.5 text-sky-600" />;
}

function CaughtUpIllustration() {
  return (
    <svg viewBox="0 0 120 84" aria-hidden="true" className="h-16 w-24 mx-auto select-none">
      <path d="M98 16 L104 10 M103 24 L111 22" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
      <g transform="translate(14,14) rotate(-8)">
        <rect x="0" y="10" width="66" height="44" rx="8" fill="#a78bfa" stroke="#1e293b" strokeWidth="2.5" />
        <path d="M2 13 L33 36 L64 13" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(56,12) rotate(12)">
        <path
          d="M18 4 C10 4 6 11 6 19 L6 28 L2 33 L34 33 L30 28 L30 19 C30 11 26 4 18 4 Z"
          fill="#fde047"
          stroke="#1e293b"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="36" r="3.5" fill="#1e293b" />
      </g>
    </svg>
  );
}

export function DigitalCalendarSection({
  announcements,
  announcementsLoading,
  events,
  registrations,
  joinedClubs,
  suggestions,
  searchQuery,
  readIds,
  onMarkRead,
  onMarkAllRead,
  onBackToProfile,
  onSwitchTab,
}: DigitalCalendarSectionProps) {
  // Default prototype calendar to December 2026 as requested.
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(11); // 0-indexed: 11 = December
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [quickFilter, setQuickFilter] = useState<CalendarFilterCategory>('all');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const allFeedItems = buildCalendarFeedItems({
    announcements,
    events,
    registrations,
    joinedClubs,
    suggestions,
  });

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filterMatchedItems = allFeedItems.filter((item) => {
    const matchesCategory = quickFilter === 'all' || item.filterGroup === quickFilter;
    const matchesSearch =
      !normalizedQuery ||
      `${item.title} ${item.description} ${item.badgeText} ${item.displayDate}`
        .toLowerCase()
        .includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`;
  const itemsInMonth = filterMatchedItems.filter((item) => item.dateKey.startsWith(monthPrefix));

  const itemsByDate = new Map<string, CalendarFeedItem[]>();
  for (const item of filterMatchedItems) {
    const existing = itemsByDate.get(item.dateKey) ?? [];
    existing.push(item);
    itemsByDate.set(item.dateKey, existing);
  }

  const visibleNotifications = selectedDateKey
    ? filterMatchedItems.filter((item) => item.dateKey === selectedDateKey)
    : filterMatchedItems;

  const readSet = new Set(readIds);
  const unreadCount = allFeedItems.filter((item) => !readSet.has(item.id)).length;
  const visibleUnreadCount = visibleNotifications.filter((item) => !readSet.has(item.id)).length;

  const monthCells = buildMonthGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Week view calculates the 7-day strip containing selectedDateKey (or first day of current month).
  const activeWeekAnchor = (() => {
    if (selectedDateKey && selectedDateKey.startsWith(monthPrefix)) {
      const day = Number(selectedDateKey.slice(8, 10));
      return new Date(viewYear, viewMonth, day);
    }
    return new Date(viewYear, viewMonth, 1);
  })();
  const weekStart = new Date(activeWeekAnchor);
  weekStart.setDate(activeWeekAnchor.getDate() - activeWeekAnchor.getDay());
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const dt = new Date(weekStart);
    dt.setDate(weekStart.getDate() + idx);
    const key = formatDateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
    return {
      dateKey: key,
      weekday: weekdayLabels[idx],
      dayNumber: dt.getDate(),
      monthShort: dt.toLocaleDateString('en-US', { month: 'short' }),
      inCurrentMonth: dt.getFullYear() === viewYear && dt.getMonth() === viewMonth,
    };
  });

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedDateKey(null);
  }

  function handleItemClick(item: CalendarFeedItem) {
    onMarkRead(item.id);
    setExpandedItemId((prev) => (prev === item.id ? null : item.id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <div className="flex items-start gap-3 pt-1">
            <span className="size-11 rounded-2xl bg-[#ebe6ff] border border-indigo-200/80 grid place-items-center shrink-0">
              <Bell className="size-5 fill-primary text-secondary" />
            </span>
            <div>
              <h1 className="font-hand text-4xl sm:text-[2.5rem] leading-none text-secondary flex items-center gap-2">
                Notifications &amp; Calendar
                <Sparkles className="size-5 text-primary fill-primary hidden sm:inline" />
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Stay updated with admin announcements, schedule-wise events, and campus activity!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar + Quick Filters */}
      <div className="grid gap-5 xl:grid-cols-[1fr_240px]">
        {/* Calendar Card */}
        <section
          aria-label="Schedule calendar"
          className="rounded-3xl border border-indigo-200/75 bg-[#f2effd] p-4 sm:p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                className="size-8 rounded-full grid place-items-center text-secondary hover:bg-white/80 transition"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                className="size-8 rounded-full grid place-items-center text-secondary hover:bg-white/80 transition"
              >
                <ChevronRight className="size-4" />
              </button>
              <span className="size-8 rounded-xl bg-indigo-100 text-indigo-700 grid place-items-center">
                <Calendar className="size-4" />
              </span>
              <h2 className="font-semibold text-base sm:text-lg text-secondary">{monthLabel}</h2>
            </div>

            <div
              role="tablist"
              aria-label="Calendar view mode"
              className="inline-flex items-center rounded-full border border-indigo-100 bg-white/90 p-1"
            >
              {viewModes.map((mode) => {
                const active = viewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setViewMode(mode.id)}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                      active
                        ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                        : 'text-secondary/75 hover:text-secondary'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          {viewMode === 'month' && (
            <div className="rounded-2xl border border-indigo-100 bg-white/95 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-indigo-100 bg-[#faf9ff]">
                {weekdayLabels.map((day) => (
                  <div
                    key={day}
                    className="py-2.5 text-center text-xs font-semibold text-secondary/75"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthCells.map((cell, index) => {
                  if (!cell.day || !cell.dateKey) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-16 sm:h-20 border-b border-r border-indigo-100/80 last:border-r-0 bg-indigo-50/20"
                      />
                    );
                  }

                  const dayItems = itemsByDate.get(cell.dateKey) ?? [];
                  const isSelected = selectedDateKey === cell.dateKey;
                  const primaryItem = dayItems[0];

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() =>
                        setSelectedDateKey((prev) =>
                          prev === cell.dateKey ? null : cell.dateKey,
                        )
                      }
                      aria-label={`${formatReadableDate(cell.dateKey)}${
                        dayItems.length ? `, ${dayItems.length} item(s)` : ''
                      }`}
                      aria-pressed={isSelected}
                      className={`h-16 sm:h-20 p-1.5 sm:p-2 border-b border-r border-indigo-100/80 text-left flex flex-col justify-between transition ${
                        isSelected
                          ? 'bg-[#e8e1ff] ring-2 ring-inset ring-indigo-400'
                          : 'hover:bg-[#f7f4ff]'
                      }`}
                    >
                      <span
                        className={`inline-grid size-6 place-items-center rounded-full text-xs sm:text-sm font-medium tabular-nums ${
                          isSelected
                            ? 'bg-secondary text-white font-semibold'
                            : 'text-secondary'
                        }`}
                      >
                        {cell.day}
                      </span>

                      {dayItems.length > 0 && primaryItem && (
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            {dayItems.slice(0, 3).map((item) => (
                              <span
                                key={item.id}
                                className="size-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.dotColor }}
                              />
                            ))}
                            {dayItems.length > 3 && (
                              <span className="text-[10px] font-semibold text-indigo-700 tabular-nums">
                                +{dayItems.length - 3}
                              </span>
                            )}
                          </div>
                          <DayCellIcon item={primaryItem} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="grid gap-2.5 sm:grid-cols-7">
              {weekDays.map((day) => {
                const dayItems = itemsByDate.get(day.dateKey) ?? [];
                const isSelected = selectedDateKey === day.dateKey;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() =>
                      setSelectedDateKey((prev) => (prev === day.dateKey ? null : day.dateKey))
                    }
                    className={`rounded-2xl border p-3 text-left transition flex flex-col gap-2 min-h-28 ${
                      isSelected
                        ? 'bg-[#e8e1ff] border-indigo-400'
                        : day.inCurrentMonth
                          ? 'bg-white border-indigo-100 hover:bg-[#f7f4ff]'
                          : 'bg-white/60 border-indigo-100/70 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {day.weekday}
                      </span>
                      <span
                        className={`size-6 rounded-full grid place-items-center text-xs font-semibold tabular-nums ${
                          isSelected ? 'bg-secondary text-white' : 'text-secondary'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                    </div>
                    {dayItems.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground mt-auto">No entries</p>
                    ) : (
                      <div className="space-y-1">
                        {dayItems.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg bg-[#f4f1fe] px-1.5 py-1 text-[10px] font-medium text-secondary truncate"
                          >
                            {item.title}
                          </div>
                        ))}
                        {dayItems.length > 2 && (
                          <p className="text-[10px] font-semibold text-indigo-700">
                            +{dayItems.length - 2} more
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === 'agenda' && (
            <div className="rounded-2xl border border-indigo-100 bg-white/95 p-4 space-y-3">
              {itemsInMonth.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No data submitted till now for {monthLabel}.
                </p>
              ) : (
                itemsInMonth.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100/80 bg-[#faf9ff] px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-secondary truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-indigo-700 tabular-nums shrink-0">
                      {item.displayDate} · {item.timeLabel}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Right Sidebar inside Digital Calendar: Quick Filters + Status Card */}
        <div className="space-y-4">
          <section
            aria-label="Quick filters"
            className="rounded-3xl border border-indigo-200/75 bg-[#f2effd] p-4 shadow-xs space-y-2.5"
          >
            <h2 className="font-hand text-xl text-secondary flex items-center gap-2 px-1">
              <Filter className="size-4 text-secondary" />
              Quick Filters
            </h2>
            <div className="space-y-2">
              {quickFilters.map((filter) => {
                const Icon = filter.icon;
                const active = quickFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setQuickFilter(filter.id)}
                    aria-pressed={active}
                    className={`w-full flex items-center gap-3 rounded-full px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
                      active
                        ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                        : 'bg-white/90 border border-indigo-100 text-secondary hover:bg-white'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${active ? 'text-primary' : filter.iconColor}`} />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            aria-label="Notification status"
            className="rounded-3xl border border-indigo-200/75 bg-[#ece7fc] p-4 text-center shadow-xs space-y-1.5"
          >
            <CaughtUpIllustration />
            {allFeedItems.length === 0 ? (
              <>
                <p className="font-hand text-xl text-secondary">No data submitted till now</p>
                <p className="text-xs text-muted-foreground">
                  Admin announcements &amp; schedules will appear here.
                </p>
              </>
            ) : unreadCount === 0 ? (
              <>
                <p className="font-hand text-xl text-secondary">You&apos;re all caught up!</p>
                <p className="text-xs text-muted-foreground">No new notifications for now.</p>
              </>
            ) : (
              <>
                <p className="font-hand text-xl text-secondary tabular-nums">
                  {unreadCount} Unread {unreadCount === 1 ? 'Update' : 'Updates'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Click any date or update below to review.
                </p>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Bottom: Notifications & Admin Announcements */}
      <section
        aria-labelledby="calendar-notifications-heading"
        className="rounded-3xl border border-indigo-200/75 bg-[#f2effd] p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2
              id="calendar-notifications-heading"
              className="font-hand text-2xl text-secondary flex items-center gap-2"
            >
              <Megaphone className="size-5 text-indigo-600" />
              Notifications
            </h2>
            {selectedDateKey && (
              <button
                type="button"
                onClick={() => setSelectedDateKey(null)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800 hover:bg-indigo-50 transition"
              >
                Date: {formatReadableDate(selectedDateKey)} ×
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={visibleUnreadCount === 0}
            onClick={() => onMarkAllRead(allFeedItems.map((i) => i.id))}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-secondary hover:bg-indigo-50 disabled:opacity-50 transition"
          >
            <Check className="size-3.5 text-emerald-600" />
            Mark all as read
          </button>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white overflow-hidden">
          {announcementsLoading && allFeedItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Loading announcements and schedule…
            </div>
          ) : allFeedItems.length === 0 ? (
            <div className="px-5 py-9 text-center">
              <p className="text-sm font-medium text-secondary">No data submitted till now</p>
              <p className="text-xs text-muted-foreground mt-1">
                Admin announcements, registered events, club joins, and idea reviews will appear date-wise here.
              </p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="px-5 py-8 text-center space-y-2">
              <p className="text-sm font-medium text-secondary">
                No notifications or announcements for{' '}
                {selectedDateKey ? formatReadableDate(selectedDateKey) : 'this filter'}.
              </p>
              {selectedDateKey && (
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(null)}
                  className="rounded-full border border-indigo-200 bg-[#f2effd] px-3.5 py-1 text-xs font-semibold text-secondary hover:bg-indigo-100 transition"
                >
                  Show all dates
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-indigo-100/80">
              {visibleNotifications.map((item) => {
                const isUnread = !readSet.has(item.id);
                const isExpanded = expandedItemId === item.id;
                return (
                  <li key={item.id} className="transition hover:bg-[#faf9ff]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 text-left"
                      >
                        <div
                          className={`size-10 rounded-xl grid place-items-center shrink-0 ${item.tileClass}`}
                        >
                          <ItemIcon item={item} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm text-secondary">{item.title}</p>
                            {item.filterGroup === 'announcements' && (
                              <span className="rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-[10px] font-semibold">
                                Admin · {item.badgeText}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs text-muted-foreground mt-0.5 ${
                              isExpanded ? '' : 'line-clamp-2'
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-13 sm:pl-0">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                          {isUnread && (
                            <span
                              aria-label="Unread"
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.dotColor }}
                            />
                          )}
                          {item.displayDate}
                          {item.timeLabel ? ` · ${item.timeLabel}` : ''}
                        </span>

                        {item.linkTo ? (
                          <Link
                            to={item.linkTo}
                            onClick={() => onMarkRead(item.id)}
                            aria-label={`Open ${item.title}`}
                            className="size-7 rounded-full grid place-items-center text-muted-foreground hover:bg-indigo-100 hover:text-secondary transition"
                          >
                            <ChevronRight className="size-4" />
                          </Link>
                        ) : item.switchTab ? (
                          <button
                            type="button"
                            onClick={() => {
                              onMarkRead(item.id);
                              onSwitchTab(item.switchTab!);
                            }}
                            aria-label={`View ${item.title}`}
                            className="size-7 rounded-full grid place-items-center text-muted-foreground hover:bg-indigo-100 hover:text-secondary transition"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleItemClick(item)}
                            aria-label={`Toggle details for ${item.title}`}
                            className="size-7 rounded-full grid place-items-center text-muted-foreground hover:bg-indigo-100 hover:text-secondary transition"
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
