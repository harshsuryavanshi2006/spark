import { queryOptions } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/integrations/firebase/client';

export type EventStatus = 'upcoming' | 'ongoing' | 'past';

export type CampusEvent = {
  id: string;
  title: string;
  tag: string;
  status: EventStatus;
  date: string;
  time: string;
  place: string;
  tags: string;
  image: string;
  description: string;
  registration_open: boolean;
};

export const BOOTSTRAPPED_ADMIN_EMAIL = 'hrssuryavanshi135@gmail.com';

export function isBootstrappedAdminEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL;
}

export const defaultEventsCatalog: CampusEvent[] = [
  {
    id: 'freshers-garba-session',
    title: 'Freshers Garba Session',
    tag: 'Cultural',
    status: 'upcoming',
    date: '12 Oct 2025',
    time: '5:00 PM – 8:30 PM',
    place: 'College Ground',
    tags: 'Dance · Music · Fun',
    image: 'garba',
    description: 'Welcome freshers with an evening of traditional garba, dandiya, music, and campus celebrations.',
    registration_open: true,
  },
  {
    id: 'open-mic-night',
    title: 'Open Mic Night',
    tag: 'Creative',
    status: 'upcoming',
    date: '16 Oct 2025',
    time: '6:00 PM – 9:00 PM',
    place: 'Library Hall',
    tags: 'Poetry · Music · Expression',
    image: 'hero',
    description: 'Take the stage with poetry, acoustic music, stand-up, or storytelling in front of your campus crowd.',
    registration_open: true,
  },
  {
    id: 'creative-challenge',
    title: 'Creative Challenge',
    tag: 'Design',
    status: 'upcoming',
    date: '20 Oct 2025',
    time: '10:00 AM – 1:00 PM',
    place: 'Design Studio',
    tags: 'Design · Art · Innovation',
    image: '',
    description: 'Team up or go solo to solve live campus design briefs and showcase creative prototypes.',
    registration_open: true,
  },
  {
    id: 'tech-talk-series',
    title: 'Tech Talk Series',
    tag: 'Technical',
    status: 'ongoing',
    date: '10 Oct 2025',
    time: '4:00 PM – 6:00 PM',
    place: 'Seminar Hall',
    tags: 'Coding · AI · Innovation',
    image: 'coding',
    description: 'Hands-on developer talks covering AI workflows, full-stack engineering, and open-source projects.',
    registration_open: true,
  },
  {
    id: 'football-tournament',
    title: 'Football Tournament',
    tag: 'Sports',
    status: 'ongoing',
    date: '10 Oct 2025',
    time: '4:00 PM – 7:00 PM',
    place: 'Sports Ground',
    tags: 'Sports · Team · Fun',
    image: 'football',
    description: 'Inter-department 7-a-side campus football knockout tournament.',
    registration_open: true,
  },
  {
    id: 'dance-workshop',
    title: 'Dance Workshop',
    tag: 'Cultural',
    status: 'ongoing',
    date: '11 Oct 2025',
    time: '3:00 PM – 5:00 PM',
    place: 'Dance Studio',
    tags: 'Dance · Fitness · Learn',
    image: 'dance',
    description: 'High-energy choreography workshop open to beginners and seasoned campus performers.',
    registration_open: true,
  },
  {
    id: 'battle-of-bands',
    title: 'Battle of Bands',
    tag: 'Cultural',
    status: 'past',
    date: '5 Oct 2025',
    time: '5:00 PM – 9:00 PM',
    place: 'Main Auditorium',
    tags: 'Music · Performance · Fun',
    image: 'bands',
    description: 'Campus bands competing live on stage in the annual music showdown.',
    registration_open: false,
  },
  {
    id: 'web-development-workshop',
    title: 'Web Development Workshop',
    tag: 'Workshop',
    status: 'past',
    date: '2 Oct 2025',
    time: '10:00 AM – 1:00 PM',
    place: 'Computer Lab',
    tags: 'Coding · Web · Skills',
    image: '',
    description: 'Practical web building bootcamp covering responsive UI and modern JavaScript.',
    registration_open: false,
  },
  {
    id: 'campus-clean-up-drive',
    title: 'Campus Clean-up Drive',
    tag: 'Social',
    status: 'past',
    date: '28 Sep 2025',
    time: '9:00 AM – 12:00 PM',
    place: 'College Ground',
    tags: 'Volunteer · Community · Impact',
    image: 'campus',
    description: 'Student volunteer initiative to keep campus gardens and common grounds clean and green.',
    registration_open: false,
  },
];

const statusOrder: Record<EventStatus, number> = {
  upcoming: 0,
  ongoing: 1,
  past: 2,
};

const defaultOrder = new Map(defaultEventsCatalog.map((ev, index) => [ev.id, index]));

function normalizeStatus(val: unknown): EventStatus {
  if (val === 'upcoming' || val === 'ongoing' || val === 'past') return val;
  return 'upcoming';
}

let seedingPromise: Promise<void> | null = null;

export async function seedDefaultEventsIfEmpty(): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || !isBootstrappedAdminEmail(user.email)) {
    return;
  }
  if (seedingPromise) {
    return seedingPromise;
  }

  seedingPromise = (async () => {
    for (const event of defaultEventsCatalog) {
      const eventRef = doc(db, 'events', event.id);
      try {
        const existing = await getDoc(eventRef);
        if (!existing.exists()) {
          await setDoc(eventRef, {
            ...event,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `events/${event.id}`);
      }
    }
  })().finally(() => {
    seedingPromise = null;
  });

  return seedingPromise;
}

export async function fetchCampusEvents(): Promise<CampusEvent[]> {
  try {
    const snap = await getDocs(collection(db, 'events'));
    if (snap.empty) {
      if (auth.currentUser?.emailVerified && isBootstrappedAdminEmail(auth.currentUser.email)) {
        await seedDefaultEventsIfEmpty();
      }
      return defaultEventsCatalog;
    }

    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          title: typeof d['title'] === 'string' ? d['title'] : docSnap.id,
          tag: typeof d['tag'] === 'string' ? d['tag'] : 'Other',
          status: normalizeStatus(d['status']),
          date: typeof d['date'] === 'string' ? d['date'] : '',
          time: typeof d['time'] === 'string' ? d['time'] : '',
          place: typeof d['place'] === 'string' ? d['place'] : '',
          tags: typeof d['tags'] === 'string' ? d['tags'] : '',
          image: typeof d['image'] === 'string' ? d['image'] : '',
          description: typeof d['description'] === 'string' ? d['description'] : '',
          registration_open: typeof d['registration_open'] === 'boolean' ? d['registration_open'] : true,
        };
      })
      .sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        const aDefault = defaultOrder.get(a.id) ?? 999;
        const bDefault = defaultOrder.get(b.id) ?? 999;
        if (aDefault !== bDefault) return aDefault - bDefault;
        return a.title.localeCompare(b.title);
      });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'events');
  }
}

export const eventsQuery = queryOptions({
  queryKey: ['events'],
  queryFn: fetchCampusEvents,
  initialData: defaultEventsCatalog,
  initialDataUpdatedAt: 0,
});
