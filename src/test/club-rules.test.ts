import { describe, expect, it } from 'vitest';
import { clubCatalog, clubIds, clubJoinSchema, clubSuggestionSchema } from '../lib/club-data';

describe('club rules', () => {
  it('offers the six reference clubs with stable join identifiers', () => {
    expect(clubCatalog.map((club) => club.id)).toEqual([
      'dance',
      'web-design',
      'game-design',
      'robotics',
      'arts-design',
      'sports',
    ]);
  });

  it('accepts only a listed club for membership', () => {
    expect(clubJoinSchema.safeParse({ club_id: 'dance' }).success).toBe(true);
    expect(clubJoinSchema.safeParse({ club_id: 'unlisted-club' }).success).toBe(false);
    expect(clubIds).toContain('sports');
  });

  it('requires a non-empty club name, supported category, and reason for suggestions', () => {
    const suggestion = { club_name: 'Photography Club', category: 'Cultural', reason: 'Share campus stories.' };
    expect(clubSuggestionSchema.safeParse(suggestion).success).toBe(true);
    expect(clubSuggestionSchema.safeParse({ ...suggestion, club_name: '  ' }).success).toBe(false);
    expect(clubSuggestionSchema.safeParse({ ...suggestion, category: 'Unknown' }).success).toBe(false);
  });
});