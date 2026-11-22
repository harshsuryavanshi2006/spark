import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { ArrowLeft, ArrowRight, Mail, Star, Sparkles, Smile, Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, googleProvider } from '@/integrations/firebase/client';
import { authSchema } from '@/lib/student-rules';
import { useAccount } from '@/components/account-provider';
import campus from '@/assets/campus.jpg';
import { fieldClass } from '@/components/student-fields';

export const Route = createFileRoute('/auth')({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s['mode'] === 'signup' ? 'signup' : 'login',
    next: s['next'] === 'registration' ? 'registration' : s['next'] === 'clubs' ? 'clubs' : 'profile',
    event: typeof s['event'] === 'string' ? s['event'].slice(0, 100) : '',
  }),
  head: () => ({
    meta: [
      { title: 'Spark — Log In & Sign Up' },
      { name: 'description', content: 'Join Spark and take part in your campus events.' },
      { property: 'og:title', content: 'Spark — Log In & Sign Up' },
      { property: 'og:description', content: 'Join Spark and take part in your campus events.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
  component: AuthPage,
});

function formatAuthError(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code?: unknown }).code) : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in Firebase Console yet. Please use Google Sign-In below.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    default:
      return err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
  }
}

function AuthPage() {
  const search = Route.useSearch();
  const signup = search.mode === 'signup';
  const navigate = useNavigate();
  const user = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState('');

  function finish() {
    if (search.next === 'registration') {
      void navigate({ to: '/registration', search: { event: search.event } });
    } else if (search.next === 'clubs') {
      void navigate({ to: '/clubs' });
    } else {
      void navigate({ to: '/profile' });
    }
  }

  useEffect(() => {
    if (user) finish();
  }, [user]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setNotice('');
    const parsed = authSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your details.');
      return;
    }
    setBusy(true);
    try {
      if (signup) {
        await createUserWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      } else {
        await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      }
      finish();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      finish();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden font-sans">
      <img src={campus} alt="Students on campus" className="absolute inset-x-0 bottom-0 w-full h-80 object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-b from-background via-background/50 to-transparent" />
      <div className="relative mx-auto max-w-3xl px-6 pt-7 pb-72">
        <Link to="/" className="inline-flex font-hand text-4xl items-center text-secondary">
          <Zap className="size-8 text-primary" />Spark
        </Link>
        <p className="font-hand text-secondary ml-9">More Than Just Classes</p>
        <div className="relative mt-12 mb-8 sm:ml-12 animate-fade-up">
          <h1 className="font-hand text-5xl sm:text-6xl text-secondary leading-tight">
            {signup ? 'Your Story Starts' : 'Welcome Back'}
            <br />
            {signup ? 'with Spark!' : 'to Spark!'}
          </h1>
          <div className="h-2 w-48 bg-primary rounded-full mt-1" />
          <p className="text-lg mt-5 text-muted-foreground">
            Discover. Participate. Grow.
            <br />
            Your campus, your stage.
          </p>
          <Star className="absolute top-2 right-2 sm:right-12 size-10 text-accent animate-float" />
          <p className="hidden sm:block absolute right-1 top-24 font-hand text-2xl rotate-[-8deg]">
            Good
            <br />
            Vibes Only <Smile className="text-primary size-8" />
          </p>
        </div>
        <section className="relative rounded-3xl border bg-card/95 p-6 sm:p-10 shadow-sm max-w-xl mx-auto animate-fade-up">
          <div className="grid grid-cols-2 rounded-2xl bg-muted p-1 mb-6">
            {(['login', 'signup'] as const).map((mode) => (
              <Button
                key={mode}
                asChild
                variant="ghost"
                className={`rounded-xl h-12 ${search.mode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              >
                <Link to="/auth" search={{ ...search, mode }}>
                  {mode === 'login' ? 'Log In' : 'Sign Up'}
                </Link>
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {signup ? 'Join your campus community.' : 'Welcome back! Please log in to continue.'}
          </p>
          <form onSubmit={submit} className="space-y-4">
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input name="email" type="email" autoComplete="email" required maxLength={255} placeholder="Your email address" className={fieldClass} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <span className="relative block">
                <input
                  name="password"
                  type={show ? 'text' : 'password'}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  minLength={8}
                  maxLength={128}
                  required
                  placeholder="At least 8 characters"
                  className={`${fieldClass} pr-12`}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1.5"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </Button>
              </span>
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm">
                {notice}
              </p>
            )}
            <Button disabled={busy} className="w-full h-12 rounded-xl font-semibold">
              <Mail />
              {busy ? 'Please wait…' : signup ? 'Sign Up with Email' : 'Log In with Email'}
              <ArrowRight />
            </Button>
          </form>
          <div className="flex items-center gap-4 my-6 text-xs text-muted-foreground">
            <span className="h-px bg-border flex-1" />
            or
            <span className="h-px bg-border flex-1" />
          </div>
          <Button variant="outline" disabled={busy} onClick={google} className="h-12 w-full rounded-xl">
            <span className="font-bold text-lg text-accent">G</span>
            {signup ? 'Sign Up' : 'Log In'} with Google
            <ArrowRight className="ml-auto" />
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {signup ? 'Already have an account?' : "Don’t have an account?"}{' '}
            <Link to="/auth" search={{ ...search, mode: signup ? 'login' : 'signup' }} className="font-semibold text-secondary">
              {signup ? 'Log In' : 'Sign Up'} →
            </Link>
          </p>
        </section>
        <Link to="/" className="inline-flex items-center gap-2 mt-6 text-sm">
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
        <p className="font-hand text-2xl text-secondary text-right mt-5 rotate-[-5deg]">
          Big Dreams
          <br />
          Start Here <Sparkles className="inline text-primary" />
        </p>
      </div>
    </main>
  );
}
