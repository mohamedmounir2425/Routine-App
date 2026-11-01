# Today dashboard and reliability changes

## Run locally

Use `npm run dev` and open the URL Vite prints. The landing route redirects to `/today`.

Run `npm run build` for the TypeScript and production/PWA build. Run `npm test` for the Today, work time, focus and reliability scenarios. The runner uses Vite's TypeScript loader and fake-indexeddb; it never edits browser data or connects to a configured Supabase project.

## Today workflow

- Space cards filter the agenda across Worship, Health, Work, Home and Plans. The All spaces button clears the space selection.
- Search and status filters narrow the agenda. The completed filter expands completed items.
- Add and edit tasks from Today, with date, time, duration, priority, recurrence and a plan link. Plan-space tasks require an active plan so they can appear in the feed.
- Selecting Health exposes an inline workout scheduler. A scheduled workout repeats on the current weekday; it is not a one-off appointment.
- Prayer completion, Quran page increments, project step completion and task completion are available in the feed. Workout and Azkar actions launch their existing players/views.
- The space tools panel links to the full domain tools for project, plan, worship and routine administration.
- Dexie mutations refresh the feed; the page also refreshes each minute and when returning to the tab. Visible save/load errors offer recovery instead of silent failure.
- Preferences can hide spaces or categories, and future-dated tasks will not appear until due. Search/status filters do not change the underlying records or the global daily progress totals.

## Data protection

Initialization now inserts missing built-in records transactionally instead of clearing custom data and schedules. Forced exercise refresh preserves favorites. Database loading failures show a retry view.

Backup format v2 contains all 11 portable database tables and supported local prayer, Quran, Tasbeeh, focus history and preference data. Authentication credentials, active focus runtime state and the account/device sync queue are excluded. Restore merges by record ID rather than deleting records absent from the file. It accepts legacy v1 exports, restores exercises, validates datasets before writes and rolls back Dexie writes on failure. LocalStorage writes are compensated if the transaction fails; IndexedDB and localStorage cannot provide a single native cross-store transaction.

## Verification and remaining work

The test suite includes preservation of custom seed data, full backup round trips, invalid import rejection, legacy exercises, storage-write failure rollback, task time windows and agenda section completeness/uniqueness.

Browser verification was attempted but the local preview could not be reached, and the browser automation tool later became unavailable. Desktop/mobile layout, focus behavior and the full UI interaction flows still need visual acceptance testing.

This does not certify the entire app as production-ready. The original source lint backlog, large main bundle, full cloud sync error/conflict handling, account-switch isolation, backend row-level security and closed-app reminder delivery remain separate hardening work. Most existing domain labels remain Arabic; the redesigned dashboard header, controls, space tools and workout scheduler support the selected language.
