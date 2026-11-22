# Spark — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Profiles (`/profiles/{userId}`)**: Contains student PII (`full_name`, `phone`, `date_of_birth`, `college`). Only the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) may read, create, or update their own profile. List queries across `/profiles` are forbidden. `id` and `created_at` are immutable; `updated_at` must equal `request.time`.
2. **Event Registrations (`/event_registrations/{registrationId}`)**: Belongs strictly to `user_id == request.auth.uid`, keyed deterministically as `{userId}_{eventId}` to prevent duplicates. `event_id` must belong to the fixed catalog of 6 events. `student_details` must match all student validation rules and `terms == true`.
3. **Clubs (`/clubs/{clubId}`)**: Public read-only directory of the 6 catalog clubs (`dance`, `web-design`, `game-design`, `robotics`, `arts-design`, `sports`). Initial creation is restricted to `member_count == 0` with the exact catalog name. `member_count` can ONLY increase by `+1` atomically alongside creation of a unique `/club_memberships/{uid}_{clubId}` document (`existsAfter` + `!exists` guard).
4. **Club Memberships (`/club_memberships/{membershipId}`)**: Owner-only (`user_id == request.auth.uid`), keyed as `{userId}_{clubId}`. Cannot be created without simultaneously incrementing `/clubs/{clubId}.member_count` by `+1` (`getAfter` guard).
5. **Club Suggestions (`/club_suggestions/{suggestionId}`)**: Owner-only (`user_id == request.auth.uid`). Requires verified email, bounded `club_name` (1–100 chars), allowlisted `category`, and bounded `reason` (1–1000 chars).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Profile Read**: Signed-out read on `/profiles/userA` -> `PERMISSION_DENIED`.
2. **Cross-User Profile Read (PII Leak)**: `userB` reads `/profiles/userA` -> `PERMISSION_DENIED`.
3. **Shadow Field on Profile Create**: `userA` creates `/profiles/userA` with `{ ..., isAdmin: true }` -> `PERMISSION_DENIED`.
4. **Profile `created_at` Tampering on Update**: `userA` updates `/profiles/userA` changing `created_at` -> `PERMISSION_DENIED`.
5. **Unverified Email Spoof**: Signed-in user with `email_verified: false` tries to create `/profiles/userA` -> `PERMISSION_DENIED`.
6. **Cross-User Event Registration**: `userB` creates `/event_registrations/userA_open-mic-night` with `user_id: "userA"` -> `PERMISSION_DENIED`.
7. **Invalid Event ID Registration**: `userA` creates registration with `event_id: "fake-event"` -> `PERMISSION_DENIED`.
8. **Terms Not Accepted**: `userA` creates registration with `student_details.terms: false` -> `PERMISSION_DENIED`.
9. **Club Count Inflation Without Membership**: `userA` updates `/clubs/dance` setting `member_count: 999` without creating `/club_memberships/userA_dance` -> `PERMISSION_DENIED`.
10. **Duplicate Club Join Count Inflation**: `userA` already has `/club_memberships/userA_dance` and attempts to increment `/clubs/dance` again -> `PERMISSION_DENIED`.
11. **Arbitrary Club Creation**: `userA` tries to create `/clubs/hacked-club` with `member_count: 500` -> `PERMISSION_DENIED`.
12. **Blanket List Query on Suggestions**: `userB` tries to list `/club_suggestions` without filtering `where('user_id', '==', 'userB')` -> `PERMISSION_DENIED`.
