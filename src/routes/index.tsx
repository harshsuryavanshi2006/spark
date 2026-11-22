import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  ArrowRight, Bell, Search, CalendarPlus, Users, Lightbulb, Heart, Calendar, MapPin,
  Star, Sparkles, Rocket,
  Instagram, Youtube, Twitter, Linkedin, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/account-provider";
import { resolveEventImageSrc } from "@/components/event-thumbnail";
import { usernameFromEmail } from "@/lib/student-rules";
import { clubCatalog, clubCountsQuery } from "@/lib/club-data";
import { defaultEventsCatalog, eventsQuery } from "@/lib/events-data";
import hero from "@/assets/hero.jpg";
import campus from "@/assets/campus.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spark — More Than Just Classes" },
      { name: "description", content: "Discover events, join clubs and grow on campus with Spark." },
      { property: "og:title", content: "Spark — More Than Just Classes" },
      { property: "og:description", content: "Discover events, join clubs and grow on campus with Spark." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Heading({ title, sub, to }: { title: string; sub: string; to?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 reveal">
      <div>
        <h2 className="font-hand text-4xl text-secondary flex items-center gap-2">
          <Star className="size-6 text-accent animate-twinkle" /> {title}
        </h2>
        <p className="text-muted-foreground">{sub}</p>
      </div>
      {to ? (
        <Link to={to} className="rounded-full border bg-card px-4 py-2 text-sm font-medium flex items-center gap-1 hover:shadow-md transition">
          View All <ArrowRight className="size-4" />
        </Link>
      ) : (
        <button className="rounded-full border bg-card px-4 py-2 text-sm font-medium flex items-center gap-1 hover:shadow-md transition">
          View All <ArrowRight className="size-4" />
        </button>
      )}
    </div>
  );
}

function Index() {
  const account = useAccount();
  const clubCounts = useQuery(clubCountsQuery);
  const eventsResult = useQuery(eventsQuery);
  const allEvents = eventsResult.data ?? defaultEventsCatalog;
  const featuredEvents = allEvents.filter((event) => event.status !== "past").slice(0, 4);
  const clubCountById = new Map((clubCounts.data ?? []).map((club) => [club.id, club.member_count]));
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")), { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [featuredEvents.length]);

  const yellowBtn = "inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold transition hover:scale-105 hover:shadow-lg";

  return (
    <div className="font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
          <a className="font-hand text-3xl text-secondary flex items-center"><Zap className="size-6 text-primary fill-primary" />Spark</a>
          <nav className="hidden md:flex gap-8 text-sm">
            <Link to="/" className="pb-1 border-b-2 border-primary font-semibold transition hover:text-accent">Home</Link>
            <Link to="/events" className="pb-1 border-b-2 border-transparent transition hover:text-accent">Events</Link>
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

      {/* Hero */}
      <section className="relative bg-secondary text-secondary-foreground overflow-hidden">
        <img src={hero} alt="Campus fest crowd" width={1600} height={912} className="absolute inset-y-0 right-0 h-full w-full md:w-3/4 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/80 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-8">
          <div className="max-w-xl">
            <h1 className="font-hand text-6xl md:text-7xl leading-tight animate-fade-up">
              More Than Just <span className="block text-primary">Classes</span>
            </h1>
            <p className="mt-4 text-xl animate-fade-up [animation-delay:.2s]">Discover. Participate. Grow.<br />Your campus, your stage.</p>
            <div className="mt-8 flex gap-4 animate-fade-up [animation-delay:.4s]">
              <Link to="/events" className={`${yellowBtn} px-6 py-3`}>Explore Events <ArrowRight className="size-4" /></Link>
              <Button asChild variant="outline" className="h-auto rounded-full bg-transparent border-secondary-foreground/60 text-secondary-foreground px-6 py-3"><Link to={account ? "/profile" : "/auth"} search={account ? {} : { mode: "signup", next: "profile", event: "" }}>{account ? "My Profile" : "Join Now"}</Link></Button>
            </div>
          </div>
          <Star className="absolute top-12 left-[40%] size-10 text-primary animate-float" />
          <Sparkles className="absolute top-32 left-[45%] size-8 text-accent animate-float [animation-delay:1s]" />
          <p className="absolute top-8 right-8 font-hand text-3xl text-accent rotate-[-12deg] animate-float hidden md:block">Good Vibes Only</p>
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl bg-secondary/80 backdrop-blur border border-secondary-foreground/10 p-6 animate-fade-up [animation-delay:.6s]">
            {[[CalendarPlus, "Events", "Find what excites you", "text-accent"], [Users, "Clubs", "Meet your people", "text-cyan"], [Lightbulb, "Opportunities", "Build your skills", "text-primary"], [Heart, "Community", "Together we grow", "text-accent"]].map(([I, t, s, c]: any) => (
              <div key={t} className="flex items-center gap-3 group">
                <I className={`size-9 ${c} group-hover:scale-110 transition`} />
                <div><p className="font-semibold">{t}</p><p className="text-sm opacity-75">{s}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-16 space-y-20">
        <section id="events" className="space-y-8">
          <Heading title="Upcoming Events" sub="Don't miss out on what's happening around campus!" to="/events" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.map((e, i) => {
              const imgSrc = resolveEventImageSrc(e.image);
              return (
              <article key={e.id} className="reveal rounded-2xl bg-card p-3 shadow-sm border hover:-translate-y-2 hover:shadow-xl transition duration-300" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="relative h-36 rounded-xl overflow-hidden">
                  {imgSrc ? <img src={imgSrc} alt={e.title} loading="lazy" className="size-full object-cover hover:scale-110 transition duration-500" />
                    : <div className="size-full bg-gradient-to-br from-accent via-primary to-cyan" />}
                  <span className="absolute top-2 left-2 rounded-full bg-accent text-accent-foreground text-xs px-3 py-1">{e.tag}</span>
                </div>
                <div className="p-2 space-y-2">
                  <h3 className="font-semibold pt-2">{e.title}</h3>
                  <p className="text-xs text-muted-foreground flex gap-1 items-center"><Calendar className="size-3.5" />{e.date} | {e.time}</p>
                  <p className="text-xs text-muted-foreground flex gap-1 items-center"><MapPin className="size-3.5" />{e.place}</p>
                  <Button asChild className={`${yellowBtn} w-full justify-center py-2 text-sm mt-2`}><Link to="/registration" search={{ event: e.id }}>Register Now</Link></Button>
                </div>
              </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-8">
          <Heading title="Explore Clubs" sub="Find your people. Follow your passion." to="/clubs" />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
            {clubCatalog.map(({ icon: I, ...club }) => (
              <article key={club.id} className="reveal rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`grid size-11 place-items-center rounded-xl ${club.iconStyle}`}><I className="size-6" /></div>
                <h3 className="mt-2 font-semibold">{club.name}</h3>
                <p className="text-xs text-accent">{club.tagline}</p>
                <p className="mt-1 text-xs text-muted-foreground">{clubCounts.isError ? '—' : clubCounts.isLoading ? '…' : clubCountById.get(club.id) ?? '—'} members</p>
                <Button asChild variant="outline" size="sm" className="mt-3 w-full rounded-full"><Link to="/clubs">Join</Link></Button>
              </article>
            ))}
          </div>
        </section>

        <section className="reveal rounded-3xl bg-muted p-10 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h2 className="font-hand text-4xl text-secondary">Why Spark?</h2>
            <p className="font-semibold">Because college is more than just classes.</p>
            <p className="text-sm text-muted-foreground">Spark helps you discover events, join clubs, find new opportunities and connect with people who share your interests. It's your space to explore, participate and grow — beyond academics.</p>
            <button className={`${yellowBtn} px-5 py-2 text-sm`}>Learn More <ArrowRight className="size-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[[Star, "Discover", "Find events, clubs and opportunities in one place."], [Users, "Connect", "Meet like-minded students and build friendships."], [Rocket, "Grow", "Gain new skills, earn certificates and more."]].map(([I, t, s]: any) => (
              <div key={t} className="space-y-2">
                <I className="size-9 text-accent animate-float" />
                <p className="font-semibold">{t}</p><p className="text-xs text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="reveal relative rounded-3xl overflow-hidden bg-secondary text-secondary-foreground">
          <img src={campus} alt="Students on campus" loading="lazy" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/70 to-transparent" />
          <div className="relative p-10 md:p-14 max-w-md space-y-4">
            <h2 className="font-hand text-4xl">Be a Part of Something Bigger</h2>
            <p>Your campus. Your people. Your story.</p>
            <Link to="/events" className={`${yellowBtn} px-5 py-2 text-sm`}>Explore Events <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      </main>

      <footer className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-4 gap-8">
          <div><p className="font-hand text-3xl flex items-center"><Zap className="size-6 text-primary fill-primary" />Spark</p><p className="text-sm opacity-75 mt-2">Discover. Participate. Grow.<br />Your campus, your stage.</p></div>
          <div className="text-sm space-y-1"><p className="font-semibold mb-2">Quick Links</p>
            <Link to="/" className="block opacity-75 hover:opacity-100 hover:text-primary">Home</Link>
            <Link to="/events" className="block opacity-75 hover:opacity-100 hover:text-primary">Events</Link>
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
