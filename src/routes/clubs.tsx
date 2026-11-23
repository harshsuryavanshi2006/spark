import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  ArrowRight,
  Bell,
  Check,
  Megaphone,
  Search,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fieldClass } from '@/components/student-fields';
import { useAccount } from '@/components/account-provider';
import { db, handleFirestoreError, OperationType } from '@/integrations/firebase/client';
import { clubCatalog, clubCategories, clubCountsQuery, clubJoinSchema, clubSuggestionSchema } from '@/lib/club-data';
import { usernameFromEmail } from '@/lib/student-rules';
import campus from '@/assets/campus.jpg';
import cover from '@/assets/cover.jpg';

export const Route = createFileRoute('/clubs')({
  head: () => ({
    meta: [
      { title: 'Spark — Campus Clubs & Communities' },
      { name: 'description', content: 'Find your people, explore campus clubs, and join a community that shares your interests.' },
      { property: 'og:title', content: 'Spark — Campus Clubs & Communities' },
      { property: 'og:description', content: 'Find your people, explore campus clubs, and join a community that shares your interests.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: ClubsPage,
});

const filters = ['All', ...clubCategories];

function ClubsPage() {
  const account = useAccount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [joining, setJoining] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [suggestionBusy, setSuggestionBusy] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [error, setError] = useState('');
  const countsQuery = useQuery(clubCountsQuery);
  const membershipsQuery = useQuery({
    queryKey: ['club-memberships', account?.id],
    enabled: Boolean(account),
    queryFn: async () => {
      if (!account) return [];
      try {
        const snap = await getDocs(query(collection(db, 'club_memberships'), where('user_id', '==', account.id)));
        return snap.docs.map((docSnap) => ({
          club_id: String(docSnap.data()['club_id'] ?? ''),
        }));
      } catch (queryError) {
        handleFirestoreError(queryError, OperationType.LIST, 'club_memberships');
      }
    },
  });

  const countById = useMemo(
    () => new Map((countsQuery.data ?? []).map((club) => [club.id, club.member_count])),
    [countsQuery.data],
  );
  const joinedIds = new Set((membershipsQuery.data ?? []).map((membership) => membership.club_id));
  const visibleClubs = clubCatalog.filter((club) => {
    const matchesCategory = category === 'All' || club.category === category;
    const searchText = `${club.name} ${club.category} ${club.tagline} ${club.tags.join(' ')}`.toLowerCase();
    return matchesCategory && searchText.includes(search.trim().toLowerCase());
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in')),
      { threshold: 0.1 },
    );
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function goToSignIn() {
    void navigate({ to: '/auth', search: { mode: 'signup', next: 'clubs', event: '' } });
  }

  async function joinClub(clubId: string) {
    setJoinMessage('');
    setError('');
    if (!account) {
      goToSignIn();
      return;
    }
    const parsed = clubJoinSchema.safeParse({ club_id: clubId });
    if (!parsed.success) {
      setError('That club is not available to join.');
      return;
    }
    const clubMeta = clubCatalog.find((item) => item.id === parsed.data.club_id);
    if (!clubMeta) {
      setError('That club is not available to join.');
      return;
    }

    setJoining(clubId);
    try {
      const clubRef = doc(db, 'clubs', parsed.data.club_id);
      const membershipId = `${account.id}_${parsed.data.club_id}`;
      const membershipRef = doc(db, 'club_memberships', membershipId);

      // Ensure zero-based club counter document exists before atomic join transaction.
      try {
        const clubSnap = await getDoc(clubRef);
        if (!clubSnap.exists()) {
          await setDoc(clubRef, {
            id: clubMeta.id,
            name: clubMeta.name,
            member_count: 0,
          });
        }
      } catch (seedError) {
        handleFirestoreError(seedError, OperationType.WRITE, `clubs/${parsed.data.club_id}`);
      }

      let alreadyJoined = false;
      try {
        alreadyJoined = await runTransaction(db, async (tx) => {
          const existingMembership = await tx.get(membershipRef);
          if (existingMembership.exists()) {
            return true;
          }
          const latestClub = await tx.get(clubRef);
          const currentCount = typeof latestClub.data()?.['member_count'] === 'number'
            ? (latestClub.data()?.['member_count'] as number)
            : 0;
          tx.update(clubRef, { member_count: currentCount + 1 });
          tx.set(membershipRef, {
            id: membershipId,
            user_id: account.id,
            club_id: parsed.data.club_id,
            created_at: serverTimestamp(),
          });
          return false;
        });
      } catch (txError) {
        handleFirestoreError(txError, OperationType.WRITE, `club_memberships/${membershipId}`);
      }

      if (alreadyJoined) {
        setJoinMessage('You are already part of this club.');
      } else {
        setJoinMessage('You joined the club. It is now in your Profile activity.');
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['club-counts'] }),
        queryClient.invalidateQueries({ queryKey: ['club-memberships', account.id] }),
        queryClient.invalidateQueries({ queryKey: ['student'] }),
      ]);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Unable to join right now. Please try again.');
    } finally {
      setJoining(null);
    }
  }

  async function submitSuggestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuggestionMessage('');
    setError('');
    if (!account) {
      goToSignIn();
      return;
    }
    const form = event.currentTarget;
    const parsed = clubSuggestionSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your club suggestion.');
      return;
    }
    setSuggestionBusy(true);
    try {
      const suggestionRef = doc(collection(db, 'club_suggestions'));
      try {
        await setDoc(suggestionRef, {
          id: suggestionRef.id,
          user_id: account.id,
          ...parsed.data,
          created_at: serverTimestamp(),
        });
      } catch (insertError) {
        handleFirestoreError(insertError, OperationType.CREATE, `club_suggestions/${suggestionRef.id}`);
      }
      await queryClient.invalidateQueries({ queryKey: ['student'] });
      setSuggestionMessage('Your suggestion has been sent. Thanks for sharing it!');
      form.reset();
    } catch (suggestionError) {
      setError(suggestionError instanceof Error ? suggestionError.message : 'Unable to send your suggestion.');
    } finally {
      setSuggestionBusy(false);
    }
  }

  const profileLink = account ? (
    <Link to="/profile">{usernameFromEmail(account.email ?? '').slice(0, 12)}</Link>
  ) : (
    <Link to="/auth" search={{ mode: 'signup', next: 'profile', event: '' }}>Join Now</Link>
  );

  return (
    <div className="font-sans">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5 sm:px-6">
          <Link to="/" className="flex items-center font-hand text-3xl text-secondary">
            <Zap className="size-6 fill-primary text-primary" />Spark
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            <Link to="/" className="border-b-2 border-transparent pb-1 transition hover:text-accent">Home</Link>
            <Link to="/events" className="border-b-2 border-transparent pb-1 transition hover:text-accent">Events</Link>
            <Link to="/clubs" className="border-b-2 border-primary pb-1 font-semibold transition hover:text-accent">Clubs</Link>
            <a href="#" className="border-b-2 border-transparent pb-1 transition hover:text-accent">Opportunities</a>
            <Link to="/profile" className="border-b-2 border-transparent pb-1 transition hover:text-accent">Profile</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Search className="hidden size-5 sm:block" aria-hidden="true" />
            <Bell className="hidden size-5 fill-primary text-primary sm:block" aria-hidden="true" />
            <Button asChild variant="outline" size="sm" className="max-w-32 truncate">
              {profileLink}
            </Button>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl px-5 pt-5 sm:px-6">
          <section className="relative isolate flex min-h-64 items-center overflow-hidden rounded-3xl bg-secondary text-secondary-foreground sm:min-h-72">
            <img src={campus} alt="Students discovering a campus community" className="absolute inset-0 -z-20 size-full object-cover" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-secondary via-secondary/80 to-transparent" />
            <div className="max-w-xl px-6 py-10 sm:px-10">
              <p className="font-hand text-5xl leading-tight sm:text-6xl">Communities <span className="text-primary">✦</span></p>
              <p className="mt-2 font-hand text-2xl text-accent">Find your people. Follow your passion.</p>
              <p className="mt-3 max-w-md text-sm sm:text-base">Explore clubs and interest groups, join communities, and be a part of something bigger at campus.</p>
            </div>
            <p className="absolute bottom-6 right-7 hidden rotate-[-8deg] font-hand text-2xl sm:block">Together<br />we grow <span className="text-accent">♡</span></p>
          </section>

          <section className="space-y-6 py-10 sm:py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-3 font-hand text-4xl text-secondary sm:text-5xl"><Star className="size-7 text-accent" />Explore Categories</h1>
                <p className="mt-1 pl-10 text-sm text-muted-foreground">Find communities that match your interests.</p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <a href="#suggest-a-club">Suggest a Club <ArrowRight className="size-4" /></a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2" aria-label="Filter clubs by category">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  variant={category === filter ? 'default' : 'outline'}
                  className="h-9 rounded-full px-4"
                  aria-pressed={category === filter}
                  onClick={() => setCategory(filter)}
                >
                  {filter}
                </Button>
              ))}
              <label className="ml-auto flex h-10 min-w-52 flex-1 items-center gap-2 rounded-full border bg-card px-4 sm:max-w-xs">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  aria-label="Search clubs"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search clubs..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            {countsQuery.isError && <p role="alert" className="text-sm text-destructive">Club totals could not be loaded. Please refresh to see current counts.</p>}
            {membershipsQuery.isError && <p role="alert" className="text-sm text-destructive">Your memberships could not be checked. Please refresh the page.</p>}
            {(joinMessage || suggestionMessage) && <p role="status" className="text-sm text-accent">{joinMessage || suggestionMessage}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
              {visibleClubs.map((club) => {
                const Icon = club.icon;
                const joined = joinedIds.has(club.id);
                const count = countsQuery.isError ? '—' : countsQuery.isLoading ? '…' : String(countById.get(club.id) ?? '—');
                return (
                  <article key={club.id} className="reveal group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative h-40 overflow-hidden sm:h-48">
                      <img src={club.image} alt={club.name} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                      <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${club.categoryStyle}`}>{club.category}</span>
                      <span aria-label={`Members: ${count}`} className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-secondary/90 px-3 py-1 text-xs font-semibold text-secondary-foreground">
                        <Users className="size-3.5" />{count}
                      </span>
                    </div>
                    <div className="relative -mt-4 rounded-t-2xl bg-card px-4 pb-4 pt-4 sm:px-5">
                      <div className="flex items-start gap-3">
                        <div className={`grid size-12 shrink-0 place-items-center rounded-full ${club.iconStyle}`}><Icon className="size-6" /></div>
                        <div className="min-w-0 flex-1">
                          <h2 className="font-semibold text-secondary">{club.name}</h2>
                          <p className="text-sm text-muted-foreground">{club.tagline}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {club.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        disabled={joining === club.id || (Boolean(account) && membershipsQuery.isLoading) || joined}
                        onClick={() => void joinClub(club.id)}
                        className="mt-4 h-10 w-full rounded-full"
                      >
                        {joined ? <><Check className="size-4" />Joined</> : joining === club.id ? 'Joining…' : <>Join Club <ArrowRight className="size-4" /></>}
                      </Button>
                    </div>
                  </article>
                );
              })}
              {!visibleClubs.length && <p className="py-10 text-sm text-muted-foreground sm:col-span-2">No clubs match your search.</p>}
            </div>
          </section>
        </div>

        <section className="bg-muted py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <h2 className="font-hand text-4xl text-secondary"><Star className="mr-2 inline size-6 text-accent" />Why Join?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Being part of a community helps you:</p>
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [Users, 'Meet Like-Minded People'],
                [Star, 'Participate in Events & Workshops'],
                [Sparkles, 'Share Ideas & Start Initiatives'],
                [Zap, 'Grow Beyond Academics'],
              ].map(([Icon, label]) => {
                const ItemIcon = Icon as typeof Star;
                return <div key={label as string} className="flex items-center gap-3 border-border/70 lg:justify-center lg:border-r lg:last:border-r-0"><ItemIcon className="size-7 shrink-0 text-secondary" /><p className="text-sm font-medium">{label as string}</p></div>;
              })}
            </div>
          </div>
        </section>

        <section id="suggest-a-club" className="mx-auto grid max-w-7xl gap-7 px-5 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="flex items-center gap-3 font-hand text-3xl text-secondary sm:text-4xl"><Megaphone className="size-7 text-accent" />Can’t find what you’re looking for?</h2>
            <p className="mt-2 text-muted-foreground">Suggest a new club or interest group, and let’s make it happen.</p>
            <div className="relative mt-6 overflow-hidden rounded-2xl border">
              <img src={cover} alt="Students sharing ideas on campus" loading="lazy" className="h-52 w-full object-cover sm:h-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/70 via-transparent to-transparent" />
              <p className="absolute bottom-4 left-4 font-hand text-2xl text-secondary-foreground">Your interest.<br />Our platform. <span className="text-accent">♡</span></p>
            </div>
          </div>
          <form onSubmit={submitSuggestion} className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <h3 className="font-hand text-3xl text-secondary">Suggest a Club</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">Club Name *<input name="club_name" required maxLength={100} placeholder="e.g. Photography Club" className={fieldClass} /></label>
              <label className="grid gap-2 text-sm font-medium">Category *<select name="category" required defaultValue="" className={fieldClass}><option value="" disabled>Select a category</option>{clubCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            </div>
            <label className="grid gap-2 text-sm font-medium">Why do you want this club? *<textarea name="reason" required maxLength={1000} rows={4} placeholder="Tell us more about your idea..." className="w-full resize-y rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
            {suggestionMessage && <p role="status" className="text-sm text-accent">{suggestionMessage}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type={account ? 'submit' : 'button'} onClick={account ? undefined : goToSignIn} disabled={suggestionBusy} className="h-11 w-full rounded-full">
              <Megaphone className="size-4" />{suggestionBusy ? 'Sending…' : account ? 'Submit Suggestion' : 'Sign In to Suggest'}
            </Button>
            {!account && <p className="text-center text-xs text-muted-foreground">Sign in is required to suggest a club or join a community.</p>}
          </form>
        </section>
      </main>

      <footer className="bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="flex items-center font-hand text-3xl"><Zap className="size-6 fill-primary text-primary" />Spark</p><p className="mt-2 text-sm opacity-75">Discover. Participate. Grow.<br />Your campus, your stage.</p></div>
          <div className="space-y-1 text-sm"><p className="mb-2 font-semibold">Quick Links</p><Link to="/" className="block opacity-75 hover:opacity-100">Home</Link><Link to="/events" className="block opacity-75 hover:opacity-100">Events</Link><Link to="/clubs" className="block text-primary">Clubs</Link><Link to="/profile" className="block opacity-75 hover:opacity-100">Profile</Link></div>
          <div><p className="font-semibold text-sm">Find Your People</p><p className="mt-2 text-sm opacity-75">Explore campus communities, share ideas, and grow together.</p></div>
          <div><p className="font-semibold text-sm">Stay Updated</p><p className="mb-3 mt-2 text-xs opacity-75">Get the latest events, clubs and opportunities.</p><form onSubmit={(event) => event.preventDefault()} className="flex rounded-full border border-secondary-foreground/30 p-1"><input type="email" aria-label="Your email address" placeholder="Your email address" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /><Button type="submit" className="h-8 rounded-full px-4 text-xs">Subscribe</Button></form></div>
        </div>
        <div className="border-t border-secondary-foreground/10 px-6 py-4 text-xs opacity-75"><div className="mx-auto flex max-w-7xl justify-between gap-3"><span>© 2025 Spark. All rights reserved.</span><span>Privacy | Terms | Contact</span></div></div>
      </footer>
    </div>
  );
}