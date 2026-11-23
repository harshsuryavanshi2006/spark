import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  Calendar,
  CalendarDays,
  Camera,
  Clock,
  Crown,
  Flame,
  Heart,
  Home,
  Instagram,
  Linkedin,
  LogOut,
  MapPin,
  Search,
  Smile,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  Twitter,
  Upload,
  User,
  Users,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { fieldClass } from '@/components/student-fields';
import { EventThumbnail } from '@/components/event-thumbnail';
import { InterestsSection } from '@/components/profile/interests-section';
import { MyEventsSection } from '@/components/profile/my-events-section';
import { DigitalCalendarSection } from '@/components/profile/digital-calendar-section';
import { announcementsQuery } from '@/lib/announcements-data';
import { clubCatalog } from '@/lib/club-data';
import { defaultEventsCatalog, eventsQuery } from '@/lib/events-data';
import {
  cancelStudentRegistration,
  saveStudentProfile,
  studentQuery,
} from '@/lib/student-query';
import { batches, departments, divisions, profileSchema, years } from '@/lib/student-rules';
import { auth } from '@/integrations/firebase/client';
import cover from '@/assets/cover.jpg';

type ProfileTab = 'profile' | 'interests' | 'events' | 'calendar' | 'scores';

function normalizeProfileTab(raw: unknown): ProfileTab | undefined {
  if (
    raw === 'profile' ||
    raw === 'interests' ||
    raw === 'events' ||
    raw === 'calendar' ||
    raw === 'scores'
  ) {
    return raw;
  }
  return undefined;
}

export const Route = createFileRoute('/_authenticated/profile')({
  validateSearch: (search: Record<string, unknown>): { tab?: ProfileTab } => {
    const normalized = normalizeProfileTab(search['tab']);
    return normalized ? { tab: normalized } : {};
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(studentQuery),
  head: () => ({
    meta: [
      { title: 'Spark — My Profile' },
      { name: 'description', content: 'Your Spark dashboard: events, clubs, certificates and progress.' },
      { property: 'og:title', content: 'Spark — My Profile' },
      { property: 'og:description', content: 'Your Spark dashboard: events, clubs, certificates and progress.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: ProfilePage,
});

const sideMenu: Array<{
  icon: typeof User;
  label: string;
  tab?: ProfileTab;
  to?: '/' | '/events';
}> = [
  { icon: User, label: 'Profile', tab: 'profile' },
  { icon: Heart, label: 'Interests', tab: 'interests' },
  { icon: CalendarDays, label: 'My Events', tab: 'events' },
  { icon: Calendar, label: 'Digital Calendar', tab: 'calendar' },
  { icon: Home, label: 'Back to Home', to: '/' },
  { icon: Star, label: 'Upcoming Events', to: '/events' },
  { icon: Trophy, label: 'My Scores', tab: 'scores' },
];

const yellowBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold transition hover:scale-105 hover:shadow-lg';

function resizeAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, or WebP).'));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const size = 192;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to process this image in your browser.'));
          return;
        }
        const minSide = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const sx = ((img.naturalWidth || img.width) - minSide) / 2;
        const sy = ((img.naturalHeight || img.height) - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        let dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        if (dataUrl.length > 95000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.55);
        }
        if (dataUrl.length > 100000) {
          reject(new Error('Image is too complex after resizing. Please choose another photo.'));
          return;
        }
        resolve(dataUrl);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load that image. Please try another file.'));
    };
    img.src = objectUrl;
  });
}

function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`reveal rounded-2xl bg-card border shadow-sm p-5 ${className}`}>{children}</div>;
}

function CardHead({
  icon: Icon,
  title,
  sub,
  action = 'View All',
  onAction,
}: {
  icon: typeof Star;
  title: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-hand text-2xl text-secondary flex items-center gap-2">
          <Icon className="size-5 text-accent" /> {title}
        </h3>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {onAction ? (
        <Button type="button" variant="outline" size="sm" onClick={onAction}>
          {action} <ArrowRight className="size-3" />
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link to="/events">
            {action} <ArrowRight className="size-3" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function ProfilePage() {
  const { profile, registrations, memberships, suggestions, clubs } =
    useSuspenseQuery(studentQuery).data;
  const allEvents = useQuery(eventsQuery).data ?? defaultEventsCatalog;
  const announcementsState = useQuery(announcementsQuery);
  const announcements = announcementsState.data ?? [];
  const search = Route.useSearch();
  const activeTab: ProfileTab = search.tab ?? 'profile';

  const activeEvents = allEvents.filter((event) => event.status !== 'past');
  const activeEventTotal = Math.max(1, activeEvents.length);
  const name = profile.full_name || profile.username;
  const subtitle = [profile.year, profile.department || profile.division].filter(Boolean).join(' · ');

  const activeRegistrations = registrations.filter((r) => r.attendance_status !== 'cancelled');
  const myUpcoming = activeRegistrations.flatMap((r) => {
    const e = allEvents.find((ev) => ev.id === r.event_id);
    return e ? [e] : [];
  });

  const joinedClubs = memberships.flatMap((membership) => {
    const club = clubs.find((item) => item.id === membership.club_id);
    const catalogEntry = clubCatalog.find((item) => item.id === membership.club_id);
    return club && catalogEntry
      ? [
          {
            ...club,
            category: catalogEntry.category,
            icon: catalogEntry.icon,
            created_at: membership.created_at,
          },
        ]
      : [];
  });

  const eventActivity = registrations.flatMap((r) => {
    const e = allEvents.find((ev) => ev.id === r.event_id);
    if (!e) return [];
    const statusText =
      r.attendance_status === 'cancelled'
        ? 'Cancelled'
        : r.attendance_status === 'attended'
          ? 'Attended'
          : 'Registered';
    return [
      {
        title: e.title,
        image: e.image,
        sub: `${statusText} · ${new Date(r.created_at).toLocaleDateString('en-GB')}`,
        status: statusText,
        created_at: r.created_at,
      },
    ];
  });

  const clubActivity = joinedClubs.map((club) => ({
    title: club.name,
    image: '',
    sub: `Joined · ${new Date(club.created_at).toLocaleDateString('en-GB')}`,
    status: 'Joined',
    created_at: club.created_at,
  }));

  const suggestionActivity = suggestions.map((idea) => ({
    title: idea.club_name,
    image: '',
    sub: `Idea (${idea.status}) · ${new Date(idea.created_at).toLocaleDateString('en-GB')}`,
    status: idea.status === 'approved' ? 'Approved' : idea.status === 'declined' ? 'Declined' : 'Pending',
    created_at: idea.created_at,
  }));

  const announcementActivity = announcements.map((ann) => ({
    title: ann.title,
    image: '',
    sub: `${ann.category} · ${ann.scheduled_date}`,
    status: ann.category,
    created_at: ann.created_at,
  }));

  const activity = [...announcementActivity, ...eventActivity, ...clubActivity, ...suggestionActivity].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const attendedCount = registrations.filter((r) => r.attendance_status === 'attended').length;
  const progressPct = Math.min(100, Math.round((activeRegistrations.length / activeEventTotal) * 100));
  const stats = [
    {
      icon: CalendarDays,
      n: String(activeRegistrations.length),
      label: 'Events Registered',
      sub: 'Your next experiences',
      c: 'bg-accent',
    },
    { icon: Users, n: String(joinedClubs.length), label: 'Clubs Joined', sub: '', c: 'bg-cyan' },
    {
      icon: Award,
      n: String(attendedCount),
      label: 'Events Attended',
      sub: '',
      c: 'bg-primary text-primary-foreground',
    },
    {
      icon: Flame,
      n: String(suggestions.length),
      label: 'Ideas Shared',
      sub: '',
      c: 'bg-accent',
    },
  ];

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [avatarDraft, setAvatarDraft] = useState(profile.avatar_url);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const client = useQueryClient();
  const navigate = useNavigate();

  const readStorageKey = `spark_read_notifications_${profile.id}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(readStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setReadNotificationIds(parsed.filter((item): item is string => typeof item === 'string'));
        }
      }
    } catch {
      // Ignore storage read errors in restricted iframe environments.
    }
  }, [readStorageKey]);

  function persistReadIds(next: string[]) {
    setReadNotificationIds(next);
    try {
      window.localStorage.setItem(readStorageKey, JSON.stringify(next));
    } catch {
      // Ignore storage write errors in restricted iframe environments.
    }
  }

  function handleMarkRead(id: string) {
    if (readNotificationIds.includes(id)) return;
    persistReadIds([...readNotificationIds, id]);
  }

  function handleMarkAllRead(ids: string[]) {
    persistReadIds([...new Set([...readNotificationIds, ...ids])]);
  }

  function selectTab(tab: ProfileTab) {
    setShowNotifications(false);
    void navigate({
      to: '/profile',
      search: tab === 'profile' ? {} : { tab },
    });
  }

  function openEditModal() {
    setError('');
    setSaveMessage('');
    setAvatarDraft(profile.avatar_url);
    setEditing(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setPhotoBusy(true);
    try {
      const resized = await resizeAvatarImage(file);
      setAvatarDraft(resized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process image.');
    } finally {
      setPhotoBusy(false);
      e.target.value = '';
    }
  }

  async function edit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSaveMessage('');
    const formValues = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = profileSchema.safeParse({
      ...formValues,
      avatar_url: avatarDraft,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setBusy(true);
    try {
      await saveStudentProfile(parsed.data);
      await client.invalidateQueries({ queryKey: ['student'] });
      setEditing(false);
      setSaveMessage('Profile updated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelRegistration(registrationId: string) {
    await cancelStudentRegistration(registrationId);
    await client.invalidateQueries({ queryKey: ['student'] });
  }

  async function logout() {
    await client.cancelQueries();
    client.clear();
    await signOut(auth);
    await navigate({ to: '/auth', search: { mode: 'login', next: 'profile', event: '' }, replace: true });
  }

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in')),
      { threshold: 0.1 },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [activeTab]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleUpcoming = normalizedSearch
    ? myUpcoming.filter((e) => `${e.title} ${e.place} ${e.tag}`.toLowerCase().includes(normalizedSearch))
    : myUpcoming;
  const visibleActivity = normalizedSearch
    ? activity.filter((a) => `${a.title} ${a.sub} ${a.status}`.toLowerCase().includes(normalizedSearch))
    : activity;
  const visibleJoinedClubs = normalizedSearch
    ? joinedClubs.filter((c) => `${c.name} ${c.category}`.toLowerCase().includes(normalizedSearch))
    : joinedClubs;

  return (
    <div className="font-sans flex">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 h-16 gap-4">
            <Link to="/" className="font-hand text-2xl text-secondary flex items-center gap-2 whitespace-nowrap">
              <Zap className="size-5 text-primary fill-primary" />
              Spark
              <span className="hidden sm:inline text-sm font-sans text-muted-foreground">
                More Than Just Classes
              </span>
              <Crown className="size-4 text-primary" />
            </Link>

            <div className="hidden md:flex items-center gap-2 rounded-full border bg-card px-4 py-2 flex-1 max-w-md">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                aria-label="Search profile activity"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="bg-transparent flex-1 text-sm outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="text-muted-foreground hover:text-secondary"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative grid size-9 place-items-center rounded-full hover:bg-muted transition"
              >
                <Bell className="size-5 text-primary fill-primary" />
                {activity.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent" />
                )}
              </button>

              {showNotifications && (
                <div
                  role="region"
                  aria-label="Recent updates"
                  className="absolute right-0 mt-2 w-72 rounded-2xl border bg-card p-3.5 shadow-lg z-50"
                >
                  <div className="flex items-center justify-between pb-2 border-b">
                    <p className="text-xs font-semibold text-secondary">Recent Updates</p>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-muted-foreground hover:text-secondary"
                    >
                      Close
                    </button>
                  </div>
                  {activity.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No data submitted till now
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                      {activity.slice(0, 5).map((item, idx) => (
                        <li
                          key={`${item.status}-${item.title}-${idx}`}
                          className="rounded-xl bg-muted/50 px-3 py-2 text-xs"
                        >
                          <p className="font-semibold text-secondary truncate">{item.title}</p>
                          <p className="text-muted-foreground">{item.sub}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-8 space-y-6 max-w-5xl mx-auto">
          {/* Mobile navigation & quick switcher */}
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              onClick={() => selectTab('profile')}
              className="rounded-full"
            >
              Profile
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'interests' ? 'default' : 'outline'}
              onClick={() => selectTab('interests')}
              className="rounded-full"
            >
              Interests
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'events' ? 'default' : 'outline'}
              onClick={() => selectTab('events')}
              className="rounded-full"
            >
              My Events
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === 'calendar' ? 'default' : 'outline'}
              onClick={() => selectTab('calendar')}
              className="rounded-full"
            >
              Calendar
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/registration" search={{ event: '' }}>
                Register
              </Link>
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={logout} className="rounded-full">
              Log Out
            </Button>
          </div>

          {saveMessage && (
            <p role="status" className="text-sm font-medium text-accent">
              {saveMessage}
            </p>
          )}

          {activeTab === 'interests' ? (
            <InterestsSection
              joinedClubs={joinedClubs}
              suggestions={suggestions}
              searchQuery={searchQuery}
              onBackToProfile={() => selectTab('profile')}
            />
          ) : activeTab === 'events' ? (
            <MyEventsSection
              registrations={registrations}
              allEvents={allEvents}
              searchQuery={searchQuery}
              onBackToProfile={() => selectTab('profile')}
              onCancelRegistration={handleCancelRegistration}
            />
          ) : activeTab === 'calendar' ? (
            <DigitalCalendarSection
              announcements={announcements}
              announcementsLoading={announcementsState.isLoading}
              events={allEvents}
              registrations={registrations}
              joinedClubs={joinedClubs}
              suggestions={suggestions}
              searchQuery={searchQuery}
              readIds={readNotificationIds}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onBackToProfile={() => selectTab('profile')}
              onSwitchTab={(tab) => selectTab(tab)}
            />
          ) : activeTab === 'scores' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => selectTab('profile')}
                  className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-[#f2effd] px-3.5 py-1.5 text-xs font-semibold text-secondary transition hover:bg-indigo-100"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to Profile
                </button>
                <h1 className="font-hand text-4xl text-secondary flex items-center gap-2">
                  <Trophy className="size-7 text-amber-500" />
                  My Scores
                </h1>
                <p className="text-sm text-muted-foreground">
                  Verified campus event participation and certificates.
                </p>
              </div>
              <div className="rounded-3xl border border-indigo-200/75 bg-[#f2effd] p-6">
                <div className="grid sm:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-2xl bg-white p-4 border border-indigo-100">
                    <p className="text-xs text-muted-foreground">Events Attended</p>
                    <p className="text-2xl font-bold text-secondary tabular-nums mt-1">{attendedCount}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 border border-indigo-100">
                    <p className="text-xs text-muted-foreground">Approved Club Ideas</p>
                    <p className="text-2xl font-bold text-secondary tabular-nums mt-1">
                      {suggestions.filter((s) => s.status === 'approved').length}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/80 px-5 py-8 text-center">
                  <p className="text-sm font-medium text-secondary">No data submitted till now</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Competition scores and certificates will appear here once issued by coordinators.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Profile header */}
              <div className="reveal relative rounded-3xl overflow-hidden border shadow-sm">
                <img src={cover} alt="Campus cover" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
                <p className="absolute top-4 right-6 font-hand text-2xl text-secondary rotate-[-4deg] hidden md:block">
                  Same Campus
                  <br />
                  Different Stories
                </p>
                <div className="relative p-6 flex items-center gap-5">
                  <div className="relative shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={name}
                        className="size-24 rounded-full border-4 border-card object-cover"
                      />
                    ) : (
                      <div
                        aria-label="No profile photo"
                        className="size-24 rounded-full border-4 border-card bg-muted grid place-items-center"
                      >
                        <User className="size-12 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={openEditModal}
                      aria-label="Edit profile picture"
                      className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-primary-foreground border-2 border-card grid place-items-center shadow hover:scale-105 transition"
                    >
                      <Camera className="size-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-hand text-3xl text-secondary">
                      Hey, {name}! <span className="text-primary">☀</span>
                    </p>
                    <h1 className="text-xl font-bold break-all">{name}</h1>
                    <Button variant="link" onClick={openEditModal} className="px-0 h-8 text-accent">
                      Edit Profile
                    </Button>
                    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                    {profile.college && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3.5" /> {profile.college}
                      </p>
                    )}
                    <p className="font-hand text-lg text-accent mt-1">
                      &ldquo;Better days are coming, keep going!&rdquo;{' '}
                      <Smile className="inline size-4 text-primary" />
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ icon: StatIcon, ...s }) => (
                  <Card key={s.label} className="relative">
                    <Star className="absolute top-3 right-3 size-4 text-primary animate-twinkle" />
                    <div
                      className={`size-10 rounded-xl ${s.c} text-accent-foreground grid place-items-center mb-2`}
                    >
                      <StatIcon className="size-5" />
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{s.n}</p>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-accent">{s.sub}</p>
                  </Card>
                ))}
              </div>

              {/* Progress */}
              <Card className="relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-full bg-accent text-accent-foreground grid place-items-center">
                    <Target className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-hand text-2xl text-secondary">Your Progress</h3>
                    <p className="text-xs text-muted-foreground">Your campus journey starts here.</p>
                  </div>
                  <p className="ml-auto font-hand text-xl text-accent rotate-[-4deg] hidden sm:block">
                    You&apos;re doing amazing!
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold whitespace-nowrap tabular-nums">
                    {activeRegistrations.length} of {activeEventTotal} events registered
                  </p>
                </div>
              </Card>

              {/* Upcoming + Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHead
                    icon={CalendarDays}
                    title="Upcoming Events"
                    action="My Events"
                    onAction={() => selectTab('events')}
                  />
                  <div className="space-y-4">
                    {!visibleUpcoming.length && (
                      <p className="text-sm text-muted-foreground">No data submitted till now</p>
                    )}
                    {visibleUpcoming.map((e) => (
                      <Link
                        key={e.id}
                        to="/registration"
                        search={{ event: e.id }}
                        className="flex items-center gap-3 group"
                      >
                        <div className="size-14 rounded-xl overflow-hidden shrink-0">
                          <EventThumbnail image={e.image} className="size-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold flex flex-wrap items-center gap-2">
                            {e.title}
                            <span className="rounded-full bg-accent/15 text-accent text-[10px] px-2 py-0.5">
                              {e.tag}
                            </span>
                            <span className="rounded-full bg-cyan/20 text-[10px] px-2 py-0.5 font-medium">
                              Registered
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3" />
                            {e.date} | {e.time}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="size-3" />
                            {e.place}
                          </p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition shrink-0" />
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardHead icon={Clock} title="Recent Activity" />
                  <div className="space-y-4">
                    {!visibleActivity.length && (
                      <p className="text-sm text-muted-foreground">No data submitted till now</p>
                    )}
                    {visibleActivity.slice(0, 6).map((a, idx) => (
                      <div key={`${a.status}-${a.title}-${idx}`} className="flex items-center gap-3">
                        <div className="size-10 rounded-lg overflow-hidden shrink-0">
                          <EventThumbnail image={a.image} className="size-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.sub}</p>
                        </div>
                        <span
                          className={`rounded-full text-[10px] px-2.5 py-1 font-medium shrink-0 ${
                            a.status === 'Cancelled' || a.status === 'Declined'
                              ? 'bg-rose-100 text-rose-800'
                              : a.status === 'Approved' || a.status === 'Attended'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-cyan/25'
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h3 className="flex items-center gap-2 font-hand text-2xl text-secondary">
                      <Users className="size-5 text-accent" />
                      My Clubs
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => selectTab('interests')}
                    >
                      Interests <ArrowRight className="size-3" />
                    </Button>
                  </div>
                  {!visibleJoinedClubs.length ? (
                    <p className="text-sm text-muted-foreground">No data submitted till now</p>
                  ) : (
                    <div className="space-y-3">
                      {visibleJoinedClubs.map((club) => (
                        <div key={club.id} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{club.name}</p>
                            <p className="text-xs text-muted-foreground">{club.category}</p>
                          </div>
                          <span className="rounded-full bg-cyan/20 px-2.5 py-1 text-xs">Joined</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card>
                  <h2 className="font-hand text-2xl">My Certificates</h2>
                  <p className="text-sm text-muted-foreground mt-3">No data submitted till now</p>
                </Card>
              </div>

              <Card>
                <h2 className="font-hand text-2xl mb-3">Quick Links</h2>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/events">
                      Explore Events <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/clubs">Explore Clubs</Link>
                  </Button>
                  <Button type="button" variant="outline" onClick={() => selectTab('interests')}>
                    My Interests
                  </Button>
                  <Button type="button" variant="outline" onClick={() => selectTab('events')}>
                    My Events
                  </Button>
                  <Button variant="outline" onClick={openEditModal}>
                    Edit Profile
                  </Button>
                </div>
              </Card>

              {/* Banner */}
              <div className="reveal relative rounded-3xl overflow-hidden">
                <img
                  src={cover}
                  alt="Campus at sunset"
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-secondary/40" />
                <div className="relative p-8 flex items-center justify-between gap-4 text-secondary-foreground">
                  <p className="font-hand text-3xl rotate-[-2deg]">
                    Every experience
                    <br />
                    shapes a better you
                  </p>
                  <p className="font-hand text-2xl text-primary rotate-[3deg]">
                    Keep exploring {name}!
                  </p>
                </div>
              </div>
            </>
          )}

          {editing && (
            <div
              className="fixed inset-0 z-50 bg-secondary/60 grid place-items-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-title"
            >
              <form
                onSubmit={edit}
                className="bg-card rounded-2xl border shadow-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5"
              >
                <div className="flex justify-between items-center">
                  <h2 id="edit-title" className="font-hand text-3xl">
                    Edit Profile
                  </h2>
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>

                {/* Profile Picture Picker */}
                <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-muted/40 p-4">
                  {avatarDraft ? (
                    <img
                      src={avatarDraft}
                      alt="Profile preview"
                      className="size-20 rounded-full border-2 border-primary object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-20 rounded-full border-2 border-dashed border-border bg-card grid place-items-center shrink-0">
                      <User className="size-9 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-medium">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">Choose any picture from your device.</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-4 py-2 text-xs font-medium hover:bg-muted transition">
                        <Upload className="size-3.5" />
                        {photoBusy ? 'Processing…' : 'Choose Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="sr-only"
                          disabled={photoBusy}
                        />
                      </label>
                      {avatarDraft && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAvatarDraft('')}
                          className="rounded-full text-xs text-destructive"
                        >
                          <Trash2 className="size-3.5" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Primary Profile Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                    Full Name *
                    <input
                      name="full_name"
                      required
                      maxLength={100}
                      defaultValue={profile.full_name}
                      placeholder="Enter your full name"
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Year *
                    <select name="year" required defaultValue={profile.year} className={fieldClass}>
                      <option value="">Select your year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Department *
                    <input
                      name="department"
                      required
                      maxLength={100}
                      list="spark-departments"
                      defaultValue={profile.department}
                      placeholder="e.g. Computer Engineering"
                      className={fieldClass}
                    />
                    <datalist id="spark-departments">
                      {departments.map((dept) => (
                        <option key={dept} value={dept} />
                      ))}
                    </datalist>
                  </label>
                  <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                    Username *
                    <input
                      name="username"
                      required
                      maxLength={100}
                      defaultValue={profile.username}
                      className={fieldClass}
                    />
                  </label>
                </div>

                {/* Additional Student Details */}
                <div className="border-t pt-4 space-y-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Additional Details (optional — pre-fills event registration)
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium">
                      Division
                      <select
                        name="division"
                        defaultValue={profile.division}
                        className={fieldClass}
                      >
                        <option value="">Select division</option>
                        {divisions.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Batch
                      <select name="batch" defaultValue={profile.batch} className={fieldClass}>
                        <option value="">Select batch</option>
                        {batches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Date of Birth
                      <input
                        name="date_of_birth"
                        type="date"
                        defaultValue={profile.date_of_birth}
                        className={fieldClass}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Phone Number
                      <input
                        name="phone"
                        type="tel"
                        maxLength={20}
                        defaultValue={profile.phone}
                        placeholder="+91 98765 43210"
                        className={fieldClass}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                      College
                      <input
                        name="college"
                        maxLength={150}
                        defaultValue={profile.college}
                        placeholder="Enter your college name"
                        className={fieldClass}
                      />
                    </label>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button disabled={busy || photoBusy} className="w-full h-12 rounded-full">
                  {busy ? 'Saving…' : 'Save Profile'}
                </Button>
              </form>
            </div>
          )}
        </main>

        <footer className="border-t">
          <div className="max-w-5xl mx-auto px-6 py-10 grid sm:grid-cols-3 gap-8">
            <div>
              <p className="font-hand text-2xl flex items-center text-secondary">
                <Zap className="size-5 text-primary fill-primary" />
                Spark
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Discover. Participate. Grow.
                <br />
                Your campus, your stage.
              </p>
            </div>
            <div>
              <p className="font-semibold text-sm mb-3">Follow Us</p>
              <div className="flex gap-3">
                {[Instagram, Youtube, Twitter, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="size-9 rounded-lg border grid place-items-center hover:bg-primary transition"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm">Stay Updated</p>
              <p className="text-xs text-muted-foreground mb-3">
                Get the latest events, clubs and opportunities.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex rounded-full border p-1">
                <input
                  placeholder="Your email address"
                  className="bg-transparent flex-1 px-3 text-sm outline-none min-w-0"
                />
                <button className={`${yellowBtn} px-4 py-1.5 text-sm`}>Subscribe</button>
              </form>
            </div>
          </div>
          <div className="max-w-5xl mx-auto px-6 py-4 border-t text-xs text-muted-foreground flex justify-between">
            <span>© 2025 Spark. All rights reserved.</span>
            <span>Privacy | Terms | Contact</span>
          </div>
        </footer>
      </div>

      {/* Right sidebar (consistent across all Profile sections) */}
      <aside className="w-60 shrink-0 bg-secondary text-secondary-foreground min-h-screen sticky top-0 h-screen hidden lg:flex flex-col p-5 relative overflow-hidden">
        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="size-20 rounded-full border-2 border-primary object-cover"
              />
            ) : (
              <div
                aria-label="No profile photo"
                className="size-20 rounded-full bg-secondary-foreground/10 border-2 border-primary grid place-items-center"
              >
                <User className="size-9" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 size-4 rounded-full bg-cyan border-2 border-secondary" />
          </div>
          <p className="font-semibold mt-3 break-all">{name}</p>
          <Button variant="ghost" onClick={openEditModal} className="text-primary text-xs h-7">
            Edit Profile
          </Button>
          {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
          <p className="text-xs mt-1 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cyan inline-block" /> Online
          </p>
        </div>
        <nav className="mt-8 space-y-1 flex-1" aria-label="Profile navigation">
          {sideMenu.map(({ icon: Icon, ...m }) =>
            m.to ? (
              <Link
                key={m.label}
                to={m.to}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm opacity-80 hover:opacity-100 hover:bg-secondary-foreground/10 transition"
              >
                <Icon className="size-4" /> {m.label}
              </Link>
            ) : (
              <button
                key={m.label}
                type="button"
                onClick={() => m.tab && selectTab(m.tab)}
                aria-current={m.tab === activeTab ? 'page' : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                  m.tab === activeTab
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'opacity-80 hover:opacity-100 hover:bg-secondary-foreground/10'
                }`}
              >
                <Icon className="size-4" /> {m.label}
              </button>
            ),
          )}
        </nav>
        <Button
          variant="ghost"
          onClick={logout}
          className="flex items-center justify-start gap-3 rounded-xl px-4 py-2.5 text-sm opacity-80 hover:opacity-100 hover:bg-secondary-foreground/10 transition border-t border-secondary-foreground/10 pt-4"
        >
          <LogOut className="size-4" /> Log Out
        </Button>
        <p className="font-hand text-2xl text-primary rotate-[-6deg] text-center mt-6">
          Small steps make big dreams
        </p>
        <Smile className="size-6 text-primary mx-auto mt-2 animate-float" />
        <Sparkles className="absolute top-1/3 right-4 size-5 text-primary animate-twinkle" />
      </aside>
    </div>
  );
}
