import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Gamepad2,
  Heart,
  Lightbulb,
  Palette,
  PersonStanding,
  Sparkles,
  Star,
  Trophy,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  computeCategorySummary,
  getCategoryTheme,
  type JoinedClubItem,
} from '@/lib/profile-helpers';
import type { StudentSuggestionRecord } from '@/lib/student-query';

type InterestsSectionProps = {
  joinedClubs: JoinedClubItem[];
  suggestions: StudentSuggestionRecord[];
  searchQuery: string;
  onBackToProfile: () => void;
};

function getCategoryIcon(category: string): LucideIcon {
  switch (category) {
    case 'Technical':
      return Code2;
    case 'Cultural':
      return Palette;
    case 'Sports':
      return Trophy;
    case 'Workshop':
      return Lightbulb;
    case 'Social':
      return Users;
    default:
      return Sparkles;
  }
}

function formatDateLabel(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function getSuggestionStatusBadge(status: StudentSuggestionRecord['status']) {
  if (status === 'approved') {
    return {
      label: 'Approved',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
    };
  }
  if (status === 'declined') {
    return {
      label: 'Declined',
      className: 'bg-rose-100 text-rose-800 border-rose-200',
      Icon: XCircle,
    };
  }
  return {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    Icon: Clock,
  };
}

function InterestsIllustration() {
  return (
    <svg
      viewBox="0 0 200 130"
      aria-hidden="true"
      className="h-28 w-44 shrink-0 hidden sm:block select-none"
    >
      <path
        d="M28,88 C12,56 38,20 82,22 C118,24 134,8 164,20 C190,30 194,76 174,102 C152,126 48,124 28,88 Z"
        fill="#ebe6ff"
      />
      <circle cx="24" cy="40" r="3" fill="#facc15" />
      <path d="M168 38 L175 30 M176 52 L185 50" stroke="#facc15" strokeWidth="2.5" strokeLinecap="round" />
      <g transform="translate(64,14) rotate(7)">
        <rect x="6" y="10" width="74" height="92" rx="12" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
        <rect x="26" y="4" width="34" height="14" rx="5" fill="#c7d2fe" stroke="#1e293b" strokeWidth="2.2" />
        <rect x="18" y="29" width="12" height="12" rx="3" fill="#fef08a" stroke="#1e293b" strokeWidth="1.8" />
        <path d="M21 35 L24 38 L28 32" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="36" y1="35" x2="68" y2="35" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <rect x="18" y="49" width="12" height="12" rx="3" fill="#bbf7d0" stroke="#1e293b" strokeWidth="1.8" />
        <path d="M21 55 L24 58 L28 52" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="36" y1="55" x2="66" y2="55" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <rect x="18" y="69" width="12" height="12" rx="3" fill="#e0e7ff" stroke="#1e293b" strokeWidth="1.8" />
        <path d="M21 75 L24 78 L28 72" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="36" y1="75" x2="62" y2="75" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
      </g>
      <path
        d="M150 78 L153.5 85 L161 86 L155.5 91.5 L157 99 L150 95.2 L143 99 L144.5 91.5 L139 86 L146.5 85 Z"
        fill="#fde047"
        stroke="#1e293b"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InterestsSection({
  joinedClubs,
  suggestions,
  searchQuery,
  onBackToProfile,
}: InterestsSectionProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredClubs = normalizedQuery
    ? joinedClubs.filter((club) =>
        `${club.name} ${club.category}`.toLowerCase().includes(normalizedQuery),
      )
    : joinedClubs;

  const filteredSuggestions = normalizedQuery
    ? suggestions.filter((item) =>
        `${item.club_name} ${item.category} ${item.reason} ${item.status}`.toLowerCase().includes(normalizedQuery),
      )
    : suggestions;

  const summarySlices = computeCategorySummary(joinedClubs, suggestions);
  const donutRadius = 46;
  const donutCircumference = 2 * Math.PI * donutRadius;

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
              <span className="inline-grid size-9 place-items-center rounded-xl bg-primary/35 text-secondary">
                <Star className="size-5 fill-primary text-secondary" />
              </span>
              My Interests
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your clubs, ideas and passions at Spark!
            </p>
          </div>
        </div>
        <InterestsIllustration />
      </div>

      {/* Clubs You Chose */}
      <section
        aria-labelledby="clubs-you-chose-heading"
        className="rounded-3xl border border-indigo-200/75 bg-[#f2effd] p-5 sm:p-6 shadow-xs"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2
            id="clubs-you-chose-heading"
            className="font-hand text-2xl text-secondary flex items-center gap-2"
          >
            <Users className="size-5 text-indigo-600" />
            Clubs You Chose
          </h2>
          <span className="tabular-nums text-xs font-semibold text-secondary/75">
            {joinedClubs.length} {joinedClubs.length === 1 ? 'Club' : 'Clubs'}
          </span>
        </div>

        {joinedClubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/80 px-5 py-8 text-center">
            <p className="text-sm font-medium text-secondary">No data submitted till now</p>
            <p className="text-xs text-muted-foreground mt-1">
              Join campus clubs that match your interests to see them here.
            </p>
            <Button asChild size="sm" className="mt-4 rounded-full">
              <Link to="/clubs">
                Explore Clubs <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="rounded-2xl border border-indigo-100 bg-white/80 px-5 py-6 text-center">
            <p className="text-sm text-muted-foreground">No joined clubs match &ldquo;{searchQuery.trim()}&rdquo;.</p>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => {
              const Icon = club.icon ?? PersonStanding ?? Bot ?? Gamepad2;
              const theme = getCategoryTheme(club.category);
              return (
                <div
                  key={club.id}
                  className={`rounded-2xl border ${theme.card} p-4 flex flex-col items-center text-center shadow-xs transition hover:-translate-y-0.5`}
                >
                  <div className={`size-12 rounded-2xl ${theme.iconBg} grid place-items-center shadow-xs`}>
                    <Icon className="size-6" />
                  </div>
                  <p className="mt-3 font-semibold text-sm text-secondary">{club.name}</p>
                  <span className={`mt-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold ${theme.badge}`}>
                    {club.category}
                  </span>
                  <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                    Joined {formatDateLabel(club.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Your Ideas */}
      <section
        aria-labelledby="your-ideas-heading"
        className="rounded-3xl border border-amber-200/80 bg-[#fef8e6] p-5 sm:p-6 shadow-xs"
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2
            id="your-ideas-heading"
            className="font-hand text-2xl text-secondary flex items-center gap-2"
          >
            <Lightbulb className="size-5 text-amber-600" />
            Your Ideas
          </h2>
          <span className="tabular-nums text-xs font-semibold text-secondary/75">
            {suggestions.length} {suggestions.length === 1 ? 'Submission' : 'Submissions'}
          </span>
        </div>

        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-amber-300/80 bg-white/80 px-5 py-8 text-center">
            <p className="text-sm font-medium text-secondary">No data submitted till now</p>
            <p className="text-xs text-muted-foreground mt-1">
              Have an idea for a new campus club? Submit a suggestion to track its review status here.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4 rounded-full bg-white">
              <Link to="/clubs">
                Suggest a Club <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="rounded-2xl border border-amber-200/60 bg-white/80 px-5 py-6 text-center">
            <p className="text-sm text-muted-foreground">No club ideas match &ldquo;{searchQuery.trim()}&rdquo;.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSuggestions.map((idea) => {
              const CategoryIcon = getCategoryIcon(idea.category);
              const theme = getCategoryTheme(idea.category);
              const statusBadge = getSuggestionStatusBadge(idea.status);
              const StatusIcon = statusBadge.Icon;
              return (
                <div
                  key={idea.id}
                  className="rounded-2xl border border-amber-200/70 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3.5"
                >
                  <div className={`size-12 rounded-xl ${theme.iconBg} grid place-items-center shrink-0`}>
                    <CategoryIcon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm sm:text-base text-secondary">{idea.club_name}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${theme.badge}`}>
                        {idea.category}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      {idea.reason}
                    </p>
                    {idea.admin_note && (
                      <p className="text-xs text-secondary bg-muted/60 rounded-lg px-2.5 py-1.5 mt-1.5">
                        <span className="font-semibold">Admin Note:</span> {idea.admin_note}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
                    >
                      <StatusIcon className="size-3.5" />
                      {statusBadge.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDateLabel(idea.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interest Summary */}
      <section
        aria-labelledby="interest-summary-heading"
        className="rounded-3xl border border-indigo-200/75 bg-[#f2effd] p-5 sm:p-6 shadow-xs"
      >
        <h2
          id="interest-summary-heading"
          className="font-hand text-2xl text-secondary flex items-center gap-2 mb-4"
        >
          <BarChart3 className="size-5 text-indigo-600" />
          Interest Summary
        </h2>

        {summarySlices.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-[1fr_240px] items-center">
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/80 px-5 py-7 text-center">
              <p className="text-sm font-medium text-secondary">No data submitted till now</p>
              <p className="text-xs text-muted-foreground mt-1">
                Join clubs or suggest ideas to see your category breakdown here.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-indigo-300/80 bg-white/60 p-4 text-center space-y-1.5">
              <Star className="size-5 text-amber-500 fill-amber-400 mx-auto" />
              <p className="font-hand text-xl text-secondary">Keep exploring!</p>
              <p className="text-xs text-muted-foreground">Join more clubs and share more ideas.</p>
              <Link to="/clubs" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline pt-1">
                Browse Clubs <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-[auto_1fr_220px] items-center">
            <div className="relative size-32 mx-auto">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
                {(() => {
                  let offset = 0;
                  return summarySlices.map((slice) => {
                    const length = (slice.percentage / 100) * donutCircumference;
                    const dashOffset = -offset;
                    offset += length;
                    return (
                      <circle
                        key={slice.category}
                        cx="60"
                        cy="60"
                        r={donutRadius}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="20"
                        strokeDasharray={`${length} ${donutCircumference}`}
                        strokeDashoffset={dashOffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="size-12 rounded-full bg-white shadow-xs grid place-items-center">
                  <Heart className="size-5 text-accent fill-accent" />
                </span>
              </div>
            </div>

            <div className="space-y-2.5 max-w-xs w-full mx-auto md:mx-0">
              {summarySlices.map((slice) => (
                <div key={slice.category} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="size-3 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="font-medium text-secondary truncate">{slice.category}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">({slice.count})</span>
                  </div>
                  <span className="font-semibold text-secondary tabular-nums">{slice.percentage}%</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border-2 border-dashed border-indigo-300/80 bg-white/60 p-4 text-center space-y-1.5">
              <Star className="size-5 text-amber-500 fill-amber-400 mx-auto" />
              <p className="font-hand text-xl text-secondary">Keep exploring!</p>
              <p className="text-xs text-muted-foreground">Join more clubs and share more ideas.</p>
              <Link to="/clubs" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline pt-1">
                Explore Clubs <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
