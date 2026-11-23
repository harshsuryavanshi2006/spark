import { queryOptions } from '@tanstack/react-query';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '@/integrations/firebase/client';
import { clubCatalog, type ClubCountRecord } from './club-data';
import { profileSchema, registrationSchema, usernameFromEmail } from './student-rules';

export type StudentProfile = {
  id: string;
  username: string;
  full_name: string;
  department: string;
  division: string;
  batch: string;
  year: string;
  date_of_birth: string;
  college: string;
  phone: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};

export type AttendanceStatus = 'registered' | 'attended' | 'absent' | 'cancelled';
export type SuggestionStatus = 'pending' | 'approved' | 'declined';

export type StudentRegistrationRecord = {
  id: string;
  event_id: string;
  attendance_status: AttendanceStatus;
  created_at: string;
};

export type StudentMembershipRecord = {
  id: string;
  club_id: string;
  created_at: string;
};

export type StudentSuggestionRecord = {
  id: string;
  club_name: string;
  category: string;
  reason: string;
  status: SuggestionStatus;
  admin_note: string;
  created_at: string;
};

export type StudentDashboardData = {
  profile: StudentProfile;
  registrations: StudentRegistrationRecord[];
  memberships: StudentMembershipRecord[];
  suggestions: StudentSuggestionRecord[];
  clubs: ClubCountRecord[];
};

function normalizeAttendanceStatus(val: unknown): AttendanceStatus {
  if (val === 'attended' || val === 'absent' || val === 'cancelled' || val === 'registered') {
    return val;
  }
  return 'registered';
}

function normalizeSuggestionStatus(val: unknown): SuggestionStatus {
  if (val === 'approved' || val === 'declined' || val === 'pending') {
    return val;
  }
  return 'pending';
}

function toIsoString(val: unknown): string {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

async function ensureStudentProfile(): Promise<StudentProfile> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in to access your profile.');
  }

  const profilePath = `profiles/${user.uid}`;
  const profileRef = doc(db, 'profiles', user.uid);

  let snap;
  try {
    snap = await getDoc(profileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  if (!snap.exists()) {
    const initialUsername = usernameFromEmail(user.email ?? '').slice(0, 100);
    const initialFullName = (user.displayName ?? '').trim().slice(0, 100);
    const initialAvatar =
      user.photoURL && /^https:\/\/.+/.test(user.photoURL) && user.photoURL.length <= 1000
        ? user.photoURL
        : '';
    try {
      await setDoc(profileRef, {
        id: user.uid,
        username: initialUsername,
        full_name: initialFullName,
        department: '',
        division: '',
        batch: '',
        year: '',
        date_of_birth: '',
        college: '',
        phone: '',
        avatar_url: initialAvatar,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      snap = await getDoc(profileRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, profilePath);
    }
  }

  const data = snap.data() ?? {};
  return {
    id: user.uid,
    username: typeof data['username'] === 'string' ? data['username'] : usernameFromEmail(user.email ?? ''),
    full_name: typeof data['full_name'] === 'string' ? data['full_name'] : '',
    department: typeof data['department'] === 'string' ? data['department'] : '',
    division: typeof data['division'] === 'string' ? data['division'] : '',
    batch: typeof data['batch'] === 'string' ? data['batch'] : '',
    year: typeof data['year'] === 'string' ? data['year'] : '',
    date_of_birth: typeof data['date_of_birth'] === 'string' ? data['date_of_birth'] : '',
    college: typeof data['college'] === 'string' ? data['college'] : '',
    phone: typeof data['phone'] === 'string' ? data['phone'] : '',
    avatar_url: typeof data['avatar_url'] === 'string' ? data['avatar_url'] : '',
    created_at: toIsoString(data['created_at']),
    updated_at: toIsoString(data['updated_at']),
  };
}

export async function fetchStudentDashboard(): Promise<StudentDashboardData> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in to continue.');
  }

  const profile = await ensureStudentProfile();

  let registrations: StudentRegistrationRecord[] = [];
  try {
    const regSnap = await getDocs(query(collection(db, 'event_registrations'), where('user_id', '==', user.uid)));
    registrations = regSnap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          event_id: String(d['event_id'] ?? ''),
          attendance_status: normalizeAttendanceStatus(d['attendance_status']),
          created_at: toIsoString(d['created_at']),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'event_registrations');
  }

  let memberships: StudentMembershipRecord[] = [];
  try {
    const memSnap = await getDocs(query(collection(db, 'club_memberships'), where('user_id', '==', user.uid)));
    memberships = memSnap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          club_id: String(d['club_id'] ?? ''),
          created_at: toIsoString(d['created_at']),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'club_memberships');
  }

  let suggestions: StudentSuggestionRecord[] = [];
  try {
    const sugSnap = await getDocs(query(collection(db, 'club_suggestions'), where('user_id', '==', user.uid)));
    suggestions = sugSnap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          club_name: typeof d['club_name'] === 'string' ? d['club_name'] : '',
          category: typeof d['category'] === 'string' ? d['category'] : 'Other',
          reason: typeof d['reason'] === 'string' ? d['reason'] : '',
          status: normalizeSuggestionStatus(d['status']),
          admin_note: typeof d['admin_note'] === 'string' ? d['admin_note'] : '',
          created_at: toIsoString(d['created_at']),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'club_suggestions');
  }

  let clubs: ClubCountRecord[] = [];
  try {
    const clubsSnap = await getDocs(collection(db, 'clubs'));
    const countsById = new Map<string, number>();
    for (const docSnap of clubsSnap.docs) {
      const d = docSnap.data();
      countsById.set(docSnap.id, typeof d['member_count'] === 'number' ? d['member_count'] : 0);
    }
    clubs = clubCatalog.map((club) => ({
      id: club.id,
      name: club.name,
      member_count: countsById.get(club.id) ?? 0,
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'clubs');
  }

  return { profile, registrations, memberships, suggestions, clubs };
}

export async function saveStudentProfile(input: unknown) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to save your profile.');

  const parsed = profileSchema.parse(input);
  const profilePath = `profiles/${user.uid}`;
  try {
    await updateDoc(doc(db, 'profiles', user.uid), {
      ...parsed,
      updated_at: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, profilePath);
  }
}

export async function registerStudentEvents(input: unknown) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to register for events.');

  const parsed = registrationSchema.parse(input);
  const { events, ...details } = parsed;

  let existingIds = new Set<string>();
  try {
    const existingSnap = await getDocs(query(collection(db, 'event_registrations'), where('user_id', '==', user.uid)));
    existingIds = new Set(existingSnap.docs.map((docSnap) => String(docSnap.data()['event_id'] ?? '')));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'event_registrations');
  }

  const newEventIds = [...new Set(events)].filter((id) => !existingIds.has(id));
  for (const eventId of newEventIds) {
    const registrationId = `${user.uid}_${eventId}`;
    const regPath = `event_registrations/${registrationId}`;
    try {
      await setDoc(doc(db, 'event_registrations', registrationId), {
        id: registrationId,
        user_id: user.uid,
        event_id: eventId,
        student_details: details,
        created_at: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, regPath);
    }
  }

  return { success: true, count: newEventIds.length };
}

export async function cancelStudentRegistration(registrationId: string) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in to cancel your registration.');

  const regPath = `event_registrations/${registrationId}`;
  try {
    await updateDoc(doc(db, 'event_registrations', registrationId), {
      attendance_status: 'cancelled',
    });
    return { success: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, regPath);
  }
}

export const studentQuery = queryOptions({
  queryKey: ['student'],
  queryFn: fetchStudentDashboard,
  staleTime: 0,
});
