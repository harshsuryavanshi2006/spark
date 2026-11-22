import { z } from 'zod';

export const divisions = ['Comp', 'IT', 'Entc', 'Other'] as const;
export const batches = ['2024', '2025', '2026', '2027'] as const;
export const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'] as const;
export const departments = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecom (ENTC)',
  'AI & Data Science',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other',
] as const;

export function usernameFromEmail(email: string) {
  return (email.split('@')[0] ?? '').replace(/\d/g, '') || 'student';
}

export const eventCatalog = [
  { id: 'freshers-garba-session', title: 'Freshers Garba Session', tag: 'Cultural', date: '12 Oct 2025', time: '5:00 PM – 8:30 PM', place: 'College Ground', image: 'garba' },
  { id: 'open-mic-night', title: 'Open Mic Night', tag: 'Creative', date: '16 Oct 2025', time: '6:00 PM – 9:00 PM', place: 'Library Hall', image: 'hero' },
  { id: 'creative-challenge', title: 'Creative Challenge', tag: 'Design', date: '20 Oct 2025', time: '10:00 AM – 1:00 PM', place: 'Design Studio', image: '' },
  { id: 'football-tournament', title: 'Football Tournament', tag: 'Sports', date: '25 Oct 2025', time: '4:00 PM – 7:00 PM', place: 'Sports Ground', image: 'football' },
  { id: 'tech-talk-series', title: 'Tech Talk Series', tag: 'Technical', date: '10 Oct 2025', time: '4:00 PM – 6:00 PM', place: 'Seminar Hall', image: 'coding' },
  { id: 'dance-workshop', title: 'Dance Workshop', tag: 'Cultural', date: '11 Oct 2025', time: '3:00 PM – 5:00 PM', place: 'Dance Studio', image: 'dance' },
] as const;

export function eventId(title: string) {
  return eventCatalog.find((e) => e.title === title)?.id ?? '';
}

const text = (max: number) => z.string().trim().min(1).max(max);

export const studentSchema = z.object({
  full_name: text(100),
  division: z.enum(divisions),
  batch: z.enum(batches),
  year: z.enum(years),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(v);
      return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v && d < new Date();
    }, 'Enter a valid past date of birth'),
  college: text(150),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number'),
});

export const profileSchema = z.object({
  username: text(100),
  full_name: text(100),
  department: text(100),
  year: z.enum(years),
  avatar_url: z
    .string()
    .max(100000, 'Profile picture is too large after resizing')
    .refine(
      (v) => v === '' || /^https:\/\/.+/.test(v) || /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v),
      'Choose a valid image file',
    )
    .default(''),
  division: z.union([z.literal(''), z.enum(divisions)]).default(''),
  batch: z.union([z.literal(''), z.enum(batches)]).default(''),
  date_of_birth: z.union([z.literal(''), studentSchema.shape.date_of_birth]).default(''),
  college: z.string().trim().max(150).default(''),
  phone: z.union([z.literal(''), studentSchema.shape.phone]).default(''),
});

export const registrationSchema = studentSchema.extend({
  terms: z.literal(true),
  events: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Choose a valid event')
        .max(64)
        .regex(/^[a-zA-Z0-9_-]+$/, 'Choose a valid event'),
    )
    .min(1)
    .max(12),
});

export const authSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});

export type StudentDetails = z.infer<typeof studentSchema>;
