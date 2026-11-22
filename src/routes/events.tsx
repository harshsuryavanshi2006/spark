import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  ArrowRight, Bell, Search, Calendar, MapPin, Zap, Star, Sparkles, Lightbulb,
  PenLine, Users, Smile, Instagram, Youtube, Twitter, Linkedin, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/account-provider";
import { resolveEventImageSrc } from "@/components/event-thumbnail";
import { db, handleFirestoreError, OperationType } from "@/integrations/firebase/client";
import { defaultEventsCatalog, eventsQuery, type CampusEvent } from "@/lib/events-data";
import { usernameFromEmail } from "@/lib/student-rules";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Spark — Events & Activities" },
      { name: "description", content: "Discover exciting events, workshops, and activities happening around your campus." },
      { property: "og:title", content: "Spark — Events & Activities" },
      { property: "og:description", content: "Discover exciting events, workshops, and activities happening around your campus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

const filters = ["All", "Cultural", "Technical", "Creative", "Design", "Sports", "Social", "Workshop", "Other"];

const yellowBtn = "inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold transition hover:scale-105 hover:shadow-lg";

function EventCard({ e, past: isPast, registered }: { e: CampusEvent; past?: boolean; registered?: boolean }) {
  const imgSrc = resolveEventImageSrc(e.image);
  return (
    <article className="reveal rounded-2xl bg-card p-3 shadow-sm border hover:-translate-y-2 hover:shadow-xl transition duration-300">
      <div className="relative h-36 rounded-xl overflow-hidden">
        {imgSrc ? <img src={imgSrc} alt={e.title} loading="lazy" className="size-full object-cover hover:scale-110 transition duration-500" />
          : <div className="size-full bg-gradient-to-br from-accent via-primary to-cyan" />}
        <span className="absolute top-2 left-2 rounded-full bg-accent text-accent-foreground text-xs px-3 py-1">{e.tag}</span>
        {registered && !isPast && (
          <span className="absolute top-2 right-2 rounded-full bg-secondary/90 text-secondary-foreground text-xs px-3 py-1 font-medium inline-flex items-center gap-1">
            <Check className="size-3" /> Registered
          </span>
        )}
      </div>
      <div className="p-2 space-y-2">
        <h3 className="font-semibold pt-2">{e.title}</h3>
        <p className="text-xs text-muted-foreground flex gap-1 items-center"><Calendar className="size-3.5" />{e.date} | {e.time}</p>
        <p className="text-xs text-muted-foreground flex gap-1 items-center"><MapPin className="size-3.5" />{e.place}</p>
        <p className="text-xs text-accent">{e.tags}</p>
        {isPast ? (
          <button className="w-full rounded-full border py-2 text-sm font-medium mt-2 hover:bg-muted transition">View Highlights</button>
        ) : e.registration_open ? (
          <Button asChild className={`${yellowBtn} w-full py-2 text-sm mt-2`}>
            <Link to="/registration" search={{ event: e.id }}>
              {registered ? <>Registered <Check className="size-4" /></> : <>Register Now <ArrowRight className="size-4" /></>}
            </Link>
          </Button>
        ) : (
          <button disabled className="w-full rounded-full border py-2 text-sm font-medium mt-2 opacity-60 cursor-not-allowed">Registration Closed</button>
        )}
      </div>
    </article>
  );
}

function SectionHead({ icon: I, title, sub }: { icon: typeof Star; title: string; sub: string }) {
  return (
    <div className="flex items-end justify-between gap-4 reveal">
      <div>
        <h2 className="font-hand text-3xl text-secondary flex items-center gap-2">
          <I className="size-6 text-accent animate-twinkle" /> {title}
        </h2>
        <p className="text-sm text-muted-foreground">{sub}</p>
      </div>
      <button className="text-sm font-medium flex items-center gap-1 hover:text-accent transition">
        View All <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function EventsPage() {
  const account = useAccount();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const eventsResult = useQuery(eventsQuery);
  const allEvents = eventsResult.data ?? defaultEventsCatalog;
  const upcoming = allEvents.filter((e) => e.status === "upcoming");
  const ongoing = allEvents.filter((e) => e.status === "ongoing");
  const past = allEvents.filter((e) => e.status === "past");

  const registrationsQuery = useQuery({
    queryKey: ["event-registrations", account?.id],
    enabled: Boolean(account),
    queryFn: async () => {
      if (!account) return [];
      try {
        const snap = await getDocs(query(collection(db, "event_registrations"), where("user_id", "==", account.id)));
        return snap.docs.map((docSnap) => String(docSnap.data()["event_id"] ?? ""));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, "event_registrations");
      }
    },
  });

  const registeredIds = new Set(registrationsQuery.data ?? []);

  function matches(e: CampusEvent) {
    const matchesTag = activeFilter === "All" || e.tag === activeFilter;
    const text = `${e.title} ${e.tag} ${e.place} ${e.tags}`.toLowerCase();
    return matchesTag && text.includes(search.trim().toLowerCase());
  }

  const visibleUpcoming = upcoming.filter(matches);
  const visibleOngoing = ongoing.filter(matches);
  const visiblePast = past.filter(matches);

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [activeFilter, search, allEvents.length]);

  return (
    <div className="font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="font-hand text-3xl text-secondary flex items-center"><Zap className="size-6 text-primary fill-primary" />Spark</Link>
          <nav className="hidden md:flex gap-8 text-sm">
            <Link to="/" className="pb-1 border-b-2 border-transparent transition hover:text-accent">Home</Link>
            <Link to="/events" className="pb-1 border-b-2 border-primary font-semibold transition hover:text-accent">Events</Link>
            <Link to="/clubs" className="pb-1 border-b-2 border-transparent transition hover:text-accent">Clubs</Link>
            <a href="#" className="pb-1 border-b-2 border-transparent transition hover:text-accent">Opportunities</a>
            <Link to="/profile" className="pb-1 border-b-2 border-transparent transition hover:text-accent">Profile</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Search className="size-5" /><Bell className="size-5 text-primary fill-primary" />
            <Button asChild variant="outline" size="sm"><Link to={account ? "/profile" : "/auth"} search={account ? {} : { mode: "signup", next: "profile", event: "" }}>{account ? usernameFromEmail(account.email ?? "").slice(0,12) : "Join Now"}</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Page head */}
        <div className="flex flex-wrap items-start justify-between gap-6 animate-fade-up">
          <div className="max-w-lg relative">
            <Star className="absolute -left-8 -top-2 size-6 text-accent animate-twinkle" />
            <h1 className="font-hand text-5xl text-secondary">Events & Activities</h1>
            <p className="mt-2 text-muted-foreground">Discover exciting events, workshops, and activities happening around your campus. Be a part of something great!</p>
          </div>
          <div className="relative hidden md:block">
            <p className="font-hand text-2xl text-accent rotate-[-8deg] animate-float">Good Vibes Only</p>
            <Sparkles className="absolute -right-6 top-0 size-5 text-primary animate-twinkle" />
            <Smile className="absolute -right-2 top-8 size-6 text-primary animate-float [animation-delay:1s]" />
          </div>
          <div className="w-full lg:w-96">
            <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-sm">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, clubs, opportunities..."
                className="bg-transparent flex-1 text-sm outline-none min-w-0"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2 animate-fade-up [animation-delay:.15s]">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm border transition hover:shadow ${activeFilter === f ? "bg-secondary text-secondary-foreground border-secondary" : "bg-card hover:border-accent"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Left column */}
          <div className="space-y-14">
            <section className="space-y-6">
              <SectionHead icon={Star} title="Upcoming Events" sub="Don't miss out on what's happening around campus!" />
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleUpcoming.map((e) => <EventCard key={e.id} e={e} registered={registeredIds.has(e.id)} />)}
                {!visibleUpcoming.length && <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">No upcoming events match your filter.</p>}
              </div>
            </section>

            <section className="space-y-6">
              <SectionHead icon={Zap} title="Ongoing Events" sub="Happening right now. Don't miss the action!" />
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleOngoing.map((e) => <EventCard key={e.id} e={e} registered={registeredIds.has(e.id)} />)}
                {!visibleOngoing.length && <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">No ongoing events match your filter.</p>}
              </div>
            </section>

            <section className="space-y-6">
              <SectionHead icon={Check} title="Past Events" sub="Relive the moments. See what you've missed!" />
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {visiblePast.map((e) => <EventCard key={e.id} e={e} past />)}
                {!visiblePast.length && <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">No past events match your filter.</p>}
              </div>
            </section>

            {/* Banner */}
            <section className="reveal relative rounded-3xl overflow-hidden bg-secondary text-secondary-foreground">
              <img src={hero} alt="Event crowd" loading="lazy" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-secondary/60" />
              <div className="relative p-8 md:p-10 flex flex-wrap items-center justify-between gap-6">
                <p className="font-hand text-4xl rotate-[-2deg]">Every Event is a<br />New Beginning</p>
                <div className="space-y-3 max-w-xs">
                  <p className="font-hand text-2xl text-primary">Explore. Participate. Grow.</p>
                  <p className="text-sm opacity-90">Be part of a vibrant campus community where your interests, talents and ideas matter.</p>
                  <button onClick={() => { setActiveFilter("All"); setSearch(""); }} className={`${yellowBtn} px-5 py-2 text-sm`}>Explore More Events <ArrowRight className="size-4" /></button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="reveal rounded-2xl bg-card border shadow-sm p-5 space-y-4">
              <h3 className="font-hand text-2xl text-secondary flex items-center gap-2"><Calendar className="size-5 text-accent" /> Upcoming Events</h3>
              {upcoming.map((e) => {
                const imgSrc = resolveEventImageSrc(e.image);
                return (
                <div key={e.id} className="flex items-center gap-3">
                  <div className="rounded-xl border px-2.5 py-1.5 text-center leading-tight shrink-0">
                    <p className="font-bold text-sm">{e.date.split(" ")[0]}</p>
                    <p className="text-xs text-muted-foreground">{e.date.split(" ")[1]}</p>
                  </div>
                  <div className="size-12 rounded-lg overflow-hidden shrink-0">
                    {imgSrc ? <img src={imgSrc} alt="" loading="lazy" className="size-full object-cover" /> : <div className="size-full bg-gradient-to-br from-accent via-primary to-cyan" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.time}</p>
                    <p className="text-xs text-muted-foreground">{e.place}</p>
                  </div>
                </div>
                );
              })}
              <Button asChild variant="outline" className="w-full rounded-full"><Link to="/registration" search={{ event: "" }}>View All Upcoming →</Link></Button>
            </div>

            <div className="reveal rounded-2xl bg-card border shadow-sm p-5 space-y-4">
              <h3 className="font-hand text-2xl text-secondary flex items-center gap-2"><Zap className="size-5 text-primary fill-primary" /> Ongoing Events</h3>
              {ongoing.slice(0, 2).map((e) => (
                <div key={e.title} className="flex items-center gap-3">
                  <div className="rounded-xl border px-2.5 py-1.5 text-center leading-tight shrink-0">
                    <p className="font-bold text-sm">{e.date.split(" ")[0]}</p>
                    <p className="text-xs text-muted-foreground">{e.date.split(" ")[1]}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.time}</p>
                    <p className="text-xs text-muted-foreground">{e.place}</p>
                  </div>
                  <span className="rounded-full bg-cyan/20 text-xs px-2.5 py-1 font-medium shrink-0">Live</span>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full rounded-full"><Link to="/registration" search={{ event: "" }}>View All Ongoing →</Link></Button>
            </div>

            <div className="reveal rounded-2xl bg-muted border p-5 space-y-3 relative overflow-hidden">
              <h3 className="font-hand text-2xl text-secondary flex items-center gap-2"><Lightbulb className="size-5 text-accent" /> Share Your Idea</h3>
              <p className="text-sm text-muted-foreground">Got an idea for an event, workshop or club? Let's make it happen!</p>
              <Button asChild className={`${yellowBtn} px-5 py-2 text-sm`}><Link to="/clubs" hash="suggest-a-club">Share Your Idea <ArrowRight className="size-4" /></Link></Button>
              <p className="absolute right-4 bottom-4 font-hand text-lg text-accent rotate-[-10deg]">Big Ideas Start Here!</p>
            </div>

            <div className="reveal rounded-2xl bg-muted border p-5 space-y-3 relative overflow-hidden">
              <h3 className="font-hand text-2xl text-secondary flex items-center gap-2"><PenLine className="size-5 text-accent" /> Registration</h3>
              <p className="text-sm text-muted-foreground">Quickly register for events, clubs and more!</p>
              <Button asChild variant="secondary" className="rounded-full"><Link to="/registration" search={{ event: "" }}>Go to Registration <ArrowRight className="size-4" /></Link></Button>
              <p className="absolute right-4 bottom-4 font-hand text-lg text-accent rotate-[-10deg]">Be a Part of It!</p>
            </div>

            <div className="reveal rounded-2xl bg-card border shadow-sm p-5 space-y-3 relative overflow-hidden">
              <h3 className="font-hand text-2xl text-secondary flex items-center gap-2"><Users className="size-5 text-cyan" /> Find Your People</h3>
              <p className="text-sm text-muted-foreground">Connect with students who share your interests and passions.</p>
              <div className="flex -space-x-2">
                {["A", "R", "S", "M"].map((c, i) => (
                  <div key={c} className={`size-9 rounded-full border-2 border-card grid place-items-center text-xs font-bold text-accent-foreground ${["bg-accent", "bg-secondary", "bg-cyan", "bg-primary text-primary-foreground"][i]}`}>{c}</div>
                ))}
              </div>
              <Button asChild variant="outline" className="rounded-full"><Link to="/clubs">Join Community <ArrowRight className="size-4" /></Link></Button>
              <p className="absolute right-3 top-4 font-hand text-lg text-accent rotate-[8deg]">Same Minds<br />Bigger Dreams</p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-4 gap-8">
          <div><p className="font-hand text-3xl flex items-center"><Zap className="size-6 text-primary fill-primary" />Spark</p><p className="text-sm opacity-75 mt-2">Discover. Participate. Grow.<br />Your campus, your stage.</p></div>
          <div className="text-sm space-y-1"><p className="font-semibold mb-2">Quick Links</p>
            <Link to="/" className="block opacity-75 hover:opacity-100 hover:text-primary">Home</Link>
            <Link to="/events" className="block text-primary font-semibold">Events</Link>
            <Link to="/clubs" className="block opacity-75 hover:opacity-100 hover:text-primary">Clubs</Link>
            <a href="#" className="block opacity-75 hover:opacity-100 hover:text-primary">Opportunities</a>
            <Link to="/profile" className="block opacity-75 hover:opacity-100 hover:text-primary">Profile</Link>
          </div>
          <div><p className="font-semibold text-sm mb-3">Follow Us</p><div className="flex gap-3">{[Instagram, Youtube, Twitter, Linkedin].map((I, i) => <a key={i} href="#" className="size-9 rounded-lg border border-secondary-foreground/30 grid place-items-center hover:bg-primary hover:text-primary-foreground transition"><I className="size-4" /></a>)}</div></div>
          <div><p className="font-semibold text-sm">Join our Newsletter</p><p className="text-xs opacity-75 mb-3">Get the latest updates and events.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex rounded-full border border-secondary-foreground/30 p-1"><input placeholder="Your email address" className="bg-transparent flex-1 px-3 text-sm outline-none min-w-0" /><button className={`${yellowBtn} px-4 py-1.5 text-sm`}>Subscribe</button></form></div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-4 border-t border-secondary-foreground/10 text-xs opacity-75 flex justify-between"><span>© 2025 Spark. All rights reserved.</span><span>Privacy | Terms | Contact</span></div>
      </footer>
    </div>
  );
}
