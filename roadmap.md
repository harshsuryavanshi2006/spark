# Spark — College Events: Roadmap

## Done
- Home (`/`) — hero, upcoming events, clubs, "Why Spark?", campus banner, footer, scroll/hover animations
- Events (`/events`) — category filters, Upcoming / Ongoing / Past grids, sidebar, banner; linked from Home's Events tab, both "Explore Events" buttons, Upcoming Events "View All", footer
- Profile dashboard (`/profile`) — profile header, stats, progress, upcoming events, activity, skills, certificates, quick links, dark sidebar; "Back to Home" → `/`; linked from Profile tab on Home and Events

## Next
- [x] Build reference-matched signup/login with immediate profile access
- [x] Build event registration with Division and Batch choices and saved activity
- [x] Connect Join Now and every event Register action
- [x] Replace sample profile data with saved identity and Edit Profile
- [x] Verify signup, edit profile, register, and refreshed activity end-to-end
- [x] Build the Clubs page from the supplied reference and link it from Home, Events, and Profile
- [x] Require sign-in for club joins and suggestions; save successful joins to Profile activity
- [x] Start all club counts at zero and update totals only after unique successful joins
- [ ] Opportunities page (nav "Opportunities" is still a dead `#` link on Home)
- [ ] Replace placeholder event dates/times/venues with real data

## Notes
- Keep credit use minimal: reuse existing images in `src/assets` and CSS gradients before generating anything new.
- Nothing is published yet.

## Where we stopped (21 Nov)
- Sign up / log in, editable profile, event registration, and the Clubs page are in place. Unique club joins update live counts and appear in Profile activity; suggestions are saved for review.
- Next: build the Opportunities page and replace placeholder event dates, times, and venues.
