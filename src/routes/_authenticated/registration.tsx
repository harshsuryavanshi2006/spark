import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Calendar, MapPin, User, Star, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentFields } from '@/components/student-fields';
import { EventThumbnail } from '@/components/event-thumbnail';
import { defaultEventsCatalog, eventsQuery } from '@/lib/events-data';
import { registrationSchema } from '@/lib/student-rules';
import { registerStudentEvents, studentQuery } from '@/lib/student-query';
export const Route = createFileRoute('/_authenticated/registration')({ validateSearch: (s: Record<string, unknown>) => ({ event: typeof s['event'] === 'string' ? s['event'] : '' }), loader: ({ context }) => context.queryClient.ensureQueryData(studentQuery), head: () => ({ meta: [{ title: 'Spark — Event Registration' },{ name: 'description', content: 'Register for your chosen Spark campus events.' },{ property: 'og:title', content: 'Spark — Event Registration' },{ property: 'og:description', content: 'Register for your chosen Spark campus events.' },{ property: 'og:type', content: 'website' },{ name: 'twitter:card', content: 'summary_large_image' }] }), component: RegistrationPage });
function RegistrationPage() {
 const { profile, registrations } = useSuspenseQuery(studentQuery).data;
 const allEvents = useQuery(eventsQuery).data ?? defaultEventsCatalog;
 const selectableEvents = allEvents.filter((ev) => ev.status !== 'past' && ev.registration_open !== false);
 const catalogForRegistration = selectableEvents.length ? selectableEvents : allEvents;
 const { event } = Route.useSearch(); const initial = catalogForRegistration.find(e => e.id === event) ?? catalogForRegistration[1] ?? catalogForRegistration[0];
 const [chosen,setChosen] = useState<string[]>(() => (initial ? [initial.id] : [])); const [busy,setBusy] = useState(false); const [error,setError] = useState('');
 const client = useQueryClient(); const navigate = useNavigate();
 const current = catalogForRegistration.find(e => e.id === chosen[0]) ?? initial;
 async function submit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault(); setError(''); const form = new FormData(e.currentTarget);
 const parsed = registrationSchema.safeParse({ ...Object.fromEntries(form), events: chosen, terms: form.get('terms') === 'on' });
 if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Check your details.'); return; }
 setBusy(true); try { await registerStudentEvents(parsed.data); await client.invalidateQueries({ queryKey: ['student'] }); await navigate({ to: '/profile' }); } catch(err) { setError(err instanceof Error ? err.message : 'Unable to register.'); } finally { setBusy(false); }
 }
 return <main className="max-w-3xl mx-auto px-5 py-8 font-sans">
 <div className="flex justify-between gap-4"><Link to="/profile" className="text-sm font-medium inline-flex gap-2 items-center"><ArrowLeft className="size-4" />Back to Profile</Link><p className="font-hand text-2xl rotate-[-8deg] text-secondary">Let’s Do This <Smile className="inline size-6 text-primary" /></p></div>
 <h1 className="font-hand text-4xl sm:text-5xl text-secondary mt-5">Event Registration</h1><p className="mt-2 mb-7 text-muted-foreground">Fill in your details and be a part of something amazing!</p>
 <form onSubmit={submit} className="rounded-3xl border bg-card shadow-sm p-5 sm:p-8">
 {current && <div className="flex items-center gap-4 pb-6 border-b"><EventThumbnail image={current.image} className="size-24 sm:size-28 rounded-xl shrink-0" /><div className="min-w-0"><h2 className="text-xl font-semibold">{current.title}</h2><span className="text-xs rounded-full bg-accent/15 text-accent px-3 py-1 inline-block mt-2">{current.tag}</span><p className="text-xs sm:text-sm text-muted-foreground mt-3 flex gap-2"><Calendar className="size-4 shrink-0" />{current.date} · {current.time}</p><p className="text-sm text-muted-foreground mt-2 flex gap-2"><MapPin className="size-4 shrink-0" />{current.place}</p></div><Star className="size-8 text-primary ml-auto hidden sm:block" /></div>}
 <div className="flex justify-between items-center gap-3 my-6"><h2 className="font-hand text-2xl flex items-center gap-2"><User />Student Details</h2><span className="text-xs text-accent">* Mandatory fields</span></div>
 <StudentFields defaults={profile} />
 <div className="flex items-center justify-between mt-8 mb-4"><h2 className="text-lg font-semibold flex gap-2 items-center"><Calendar className="size-5" />Select Events</h2><Link to="/events" className="text-sm text-muted-foreground">View All →</Link></div>
 <div className="divide-y border rounded-xl">{catalogForRegistration.map(ev => { const already = registrations.some(r => r.event_id === ev.id); return <label key={ev.id} className="flex items-center gap-3 p-3 cursor-pointer"><input type="checkbox" checked={chosen.includes(ev.id)} onChange={e => setChosen(prev => e.target.checked ? [...prev,ev.id] : prev.filter(id => id !== ev.id))} className="size-4 accent-primary shrink-0" /><EventThumbnail image={ev.image} className="size-12 rounded-lg shrink-0" /><span className="min-w-0"><span className="text-sm font-medium block">{ev.title}{already && <span className="ml-2 text-xs text-accent">Registered</span>}</span><span className="block text-xs text-muted-foreground mt-1">{ev.date} · {ev.time} · {ev.place}</span></span></label>; })}</div>
 <label className="flex gap-3 items-start mt-6 text-sm"><input name="terms" type="checkbox" required className="size-4 mt-0.5 accent-primary shrink-0" /><span>I agree to the event guidelines and terms & conditions. *</span></label>
 {error && <p role="alert" className="text-sm text-destructive mt-4">{error}</p>}
 <Button disabled={busy} className="h-12 w-full sm:w-2/3 mt-6 rounded-full font-semibold">{busy ? 'Registering…' : 'Register Now'}<ArrowRight /></Button>
 </form></main>;
}
