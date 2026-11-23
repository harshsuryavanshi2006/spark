import { queryOptions } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/integrations/firebase/client';

export type AnnouncementCategory = 'Announcement' | 'Event' | 'Community' | 'Reminder' | 'Urgent';

export type AdminAnnouncement = {
  id: string;
  title: string;
  message: string;
  category: AnnouncementCategory;
  scheduled_date: string;
  scheduled_time: string;
  author_name: string;
  created_at: string;
  updated_at: string;
};

function normalizeCategory(val: unknown): AnnouncementCategory {
  if (
    val === 'Announcement' ||
    val === 'Event' ||
    val === 'Community' ||
    val === 'Reminder' ||
    val === 'Urgent'
  ) {
    return val;
  }
  return 'Announcement';
}

function toIsoString(val: unknown): string {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export async function fetchAnnouncements(): Promise<AdminAnnouncement[]> {
  try {
    const snap = await getDocs(collection(db, 'announcements'));
    return snap.docs
      .map((docSnap) => {
        const d = docSnap.data();
        const createdAt = toIsoString(d['created_at']);
        const rawDate = typeof d['scheduled_date'] === 'string' ? d['scheduled_date'] : '';
        return {
          id: docSnap.id,
          title: typeof d['title'] === 'string' ? d['title'] : '',
          message: typeof d['message'] === 'string' ? d['message'] : '',
          category: normalizeCategory(d['category']),
          scheduled_date: /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : createdAt.slice(0, 10),
          scheduled_time: typeof d['scheduled_time'] === 'string' ? d['scheduled_time'] : '',
          author_name: typeof d['author_name'] === 'string' ? d['author_name'] : 'Admin',
          created_at: createdAt,
          updated_at: toIsoString(d['updated_at']),
        };
      })
      .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date) || b.created_at.localeCompare(a.created_at));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'announcements');
  }
}

export const announcementsQuery = queryOptions({
  queryKey: ['announcements'],
  queryFn: fetchAnnouncements,
  staleTime: 30_000,
});
