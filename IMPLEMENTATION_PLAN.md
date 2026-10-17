# Shared Spending Tracker — Implementation Plan

## 1. Product goal
Build a private, exceptionally fast, mobile-first shared spending tracker for two partners using one joint bank account. Logging a purchase should take 2–5 seconds, and the amount spent since payday should be immediately visible.

**Core principle:** This is a spending counter with transaction history, not a full budgeting suite.

## 2. MVP scope

### Must have
- Big, always-prominent **total spent** for the selected period.
- Optional recurring **budget** and amount remaining; never block logging if no budget is configured.
- Default period: configurable payday-to-payday (e.g., 25th to 24th), with a switch to calendar month.
- Add purchase: merchant, positive SEK amount, optional comment. Date defaults to today.
- Quick merchant suggestions from prior entries, sorted by frequency/recency; free-text stores allowed.
- Recent purchases with edit/delete and immediate undo after deletion.
- Two individually authenticated users accessing **only one explicitly shared household**.
- Google sign-in with persistent session; no app-specific password.
- Fast mobile PWA with home-screen icon, minimal assets, no unnecessary background processes.
- **QR store deep links:** scanning a printed QR code with the phone camera opens `/add?store=lidl`, preselects Lidl, and lets the user enter an amount immediately.
- Printable QR codes for known stores; no account tokens or sensitive information in QR URLs.
- Clear sync/error feedback; never silently lose an entry.

### Explicitly defer
- NFC tags (future option), voice entry, receipt scanning, bank integrations, push notifications, charts, automatic categories, advanced analytics, multiple currencies, recurring expenses.
- Full offline transaction submission. Initially cache only the app shell; require a connection for writes. Add an offline queue only after online reliability is proven.

## 3. Technology
- React + TypeScript + Vite
- Lightweight CSS (plain CSS/CSS modules; avoid large UI libraries)
- Supabase Postgres + Auth (Google OAuth) + Row Level Security (RLS)
- Cloudflare Pages static hosting
- PWA via `vite-plugin-pwa` (small app shell, conservative caching)
- Vitest + React Testing Library for unit/component tests; Playwright for key flows if practical
- `Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' })` for display

Do not use a custom backend server for MVP unless a concrete requirement demands it. Do not store a Supabase service-role key in the client.

## 4. UX / interaction design

### Main screen
1. Header: Shared spending + period selector/settings.
2. Hero: large `8 420 kr` total spent. Below: budget remaining (if configured) and period dates.
3. Add transaction: merchant suggestions or text field; amount numeric keypad; optional comment tucked behind an affordance; prominent Save button.
4. Recent purchases: merchant, date, amount, optional author initial; tap to edit.
5. Lightweight confirmation with Undo after deletion.

### QR-code purchase flow (MVP)
1. A printed QR code contains a normal HTTPS URL, e.g. `https://example.pages.dev/add?store=lidl` (replace example domain with deployment URL).
2. Scan using the phone's default camera; tapping the link opens the app directly in **Add purchase** mode, with the store preselected and the amount empty.
3. Use a canonical store identifier (slug) from an allowlisted store catalog; safely parse/decode and validate the URL parameter. Unknown or invalid values fall back to normal store selection. Never interpret the URL as permission to write.
4. On a valid existing session, do not show a login screen. If signed out, authenticate normally and return to the intended store after OAuth, preserving the destination safely (same-origin path only, no open redirects).
5. After saving, show a clear confirmation, updated total, and a simple way to add another purchase. Do not create a transaction merely by opening a QR URL.
6. Provide a lightweight **Print QR codes** screen for selected stores with readable store labels, print-friendly layout, and high-contrast scannable codes. Generate codes client-side with a small maintained QR library; no third-party QR generation service or user data sent externally.
7. QR codes identify **stores only**. No secrets, user IDs, household IDs, auth tokens, or purchase amounts in the QR URL. Both partners may use the same printed codes; authorization is always enforced through Google auth + Supabase RLS.
8. A QR scan may open the browser instead of an installed PWA, depending on Android/browser behavior. Test real-device behavior; do not promise guaranteed installed-app deep linking.
9. Keep the URL-based flow compatible with future NFC tags by reusing exactly the same URLs. **Do not implement NFC support or require NFC purchases in MVP.**

### Speed targets (engineering goals, not guarantees)
- Saved home-screen app opens directly to the main screen when session is valid.
- Cached app shell works quickly on repeat visits; avoid unnecessary network requests before showing UI.
- Add entry in 2–5 seconds of user interaction.
- No heavy graphics, remote fonts, trackers, large icon packs, or auto-refresh polling.
- Lazy-load rarely used settings/history views.
- Keep tap targets at least 44 × 44 CSS px; support small phones, dark mode, accessible labels, and visible focus states.

### Important behavior
- Auto-focus amount when a merchant chip is selected.
- Allow decimal comma and decimal point in entry; parse into **integer öre** (e.g., `249,50` → `24950`). Reject zero, negatives, invalid formats, and out-of-range values with useful feedback.
- Do not prefill a previous amount: accidental repeated amounts are more harmful than saving a tap.
- Prevent double submission while a request is in flight.
- Optimistic UI is optional; if used, reconcile failures explicitly and never present an unsaved purchase as permanently saved.
- All data changes must work correctly from either partner's phone.

## 5. Data model

### `households`
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `payday_day integer not null default 25 check (payday_day between 1 and 31)`
- `monthly_budget_ore bigint null check (monthly_budget_ore >= 0)`
- `created_at timestamptz not null default now()`

### `household_members`
- `household_id uuid not null references households(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `role text not null check (role in ('owner','member'))`
- `primary key (household_id, user_id)`
- For MVP, enforce **one household per user** via unique index on `user_id`.

### `transactions`
- `id uuid primary key default gen_random_uuid()`
- `household_id uuid not null references households(id) on delete cascade`
- `created_by uuid not null references auth.users(id)`
- `merchant text not null`
- `amount_ore bigint not null check (amount_ore > 0)`
- `comment text null`
- `purchased_on date not null` (interpret using household's `Europe/Stockholm` calendar date)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Index: `(household_id, purchased_on desc, created_at desc)`

### Design notes
- Do not store a mutable running total: derive totals from transactions within a date interval.
- Treat dates as **inclusive start, exclusive end**; e.g., `purchased_on >= start AND purchased_on < end`.
- For payday days 29–31, clamp to the last calendar day of shorter months. Write tests for February and leap years.
- Separate pure period calculation and currency parsing from UI and Supabase calls.
- Consider an RPC or server-side aggregate if transaction counts become large; MVP can query a bounded period and sum locally if pagination is accounted for.

## 6. Authentication, sharing, privacy (critical)
- Use Supabase Auth with Google OAuth; configure approved redirect URLs for local development and Cloudflare Pages production.
- Persistent sessions handled by Supabase client SDK; provide Sign out in settings.
- **No public household discovery or public invitation links.** For MVP, use an administrator-controlled, one-time setup to associate the two authenticated user IDs with the same household. Never rely on email strings supplied by the client as authorization.
- RLS enabled on **all** application tables; grant access only to authenticated members of the matching household.
- Transactions: members can read; members can create with `created_by = auth.uid()` and their own household; members can update/delete according to explicitly documented household policy (for MVP: both can edit/delete all household transactions).
- Membership and household creation/modification must not be open to arbitrary clients. Use a controlled provisioning process, with carefully restricted SQL or server-side administrative action.
- Avoid recursive RLS policy queries on `household_members`; implement membership checks via a carefully reviewed security-definer helper or another proven non-recursive design with restricted execution privileges and a safe `search_path`.
- Validate amount, merchant length, comment length, dates, and ownership **in the database**, not just UI.
- Never put service-role credentials or secret keys in frontend code. Supabase publishable/anon key is allowed in frontend **only with correct RLS**.
- Avoid storing transactions in browser localStorage; use it only for non-sensitive preferences. Be explicit about PWA caching and any offline data retention.
- Test unauthorized access using two allowed users and a third unrelated user. Verify cross-household read/write denial and attempts to spoof `created_by` or `household_id`.
- Offer account/data deletion or export path before treating the product as production-ready; document backups and retention.

## 7. Sync and reliability
- MVP: fetch current-period data on opening and after a successful write; use Supabase Realtime subscriptions for the household's transactions so the partner sees changes quickly.
- Scope subscriptions to the household; clean up subscriptions on unmount/sign-out.
- Reconcile state on app foreground/reconnect; Realtime is a convenience, not the sole source of truth.
- Show clear pending, saved, and failed states. Never silently discard failed writes.
- For retry safety, generate a transaction UUID client-side once per attempted purchase and reuse it on retries to avoid duplicate entries.
- Handle concurrent updates, delete/edit conflicts, and expired sessions gracefully.
- Do not promise offline submission until an actual durable offline queue and conflict strategy are implemented.

## 8. Suggested project structure
```text
src/
  app/                  # App composition, routes, providers
  features/
    transactions/       # Entry, list, editing, queries
    dashboard/          # Period totals, remaining budget
    settings/           # Payday, budget, sign out
    auth/               # Auth UI and session handling
  domain/
    money/              # Parse/format integer öre
    periods/            # Pure payday/month date calculations
  lib/
    supabase/           # Typed client, data access
  components/           # Small shared presentational components
  styles/
```
Keep components, data access, validation, and domain logic separate. Avoid god components/functions, hidden mutations, and boolean-flag APIs.

## 9. Implementation phases and acceptance criteria

### Phase 1 — UI foundation with local mock data
- Scaffold Vite + React + TypeScript.
- Create mobile-first main screen with hero total, optional budget remaining, entry form, recent list, and period selector.
- Build pure currency parsing/formatting and payday period utilities with unit tests.
- Use a small in-memory repository/mock data. No Supabase, auth, or PWA yet.
- Implement and test the `/add?store=<slug>` route/URL flow now, using mock data: known slug preselects store, amount starts blank, saving works; invalid slug falls back safely.
- Add a small printable QR-code page for sample stores using a lightweight client-side QR library; QR destinations derive from the current app origin (and can later use a configured production origin).
- Make entry/add/edit/delete functional in local app state.
- **Done when:** works at ~360 px phone width; entry is quick; calculations pass tests; build/lint/typecheck pass.

### Phase 2 — Supabase schema and privacy
- Write version-controlled SQL migrations for tables, constraints, indexes, RLS, membership helper/policies.
- Add typed Supabase client and environment variable documentation.
- Document safe two-user provisioning process.
- Add security test cases (especially unauthorized third user).
- **Done when:** access control tests pass and no credentials are embedded in the app.

### Phase 3 — Google sign-in + persistent shared data
- Google OAuth and session restoration, including safe preservation of `/add?store=...` intent through login and redirect.
- Replace mock repository with Supabase repository, maintaining UI/domain boundaries.
- Persist transactions; both accounts see the same records.
- Add error handling, retry-safe writes, and sign-out.
- **Done when:** refresh/reopen preserves data and an unrelated user sees nothing.

### Phase 4 — Sync and polished mobile workflow
- Add Realtime, reconnect refresh, optimistic UI only if safe.
- Merchant suggestions, input focus, Undo, loading/error states.
- Verify two-device editing and concurrency behavior.
- **Done when:** both devices converge after edits/deletes and no duplicate writes occur on retries.

### Phase 5 — PWA + deployment
- Installable PWA, app icons, minimal app-shell caching.
- Cloudflare Pages deployment, production OAuth redirects, HTTPS; ensure SPA deep-link fallback for `/add` and the QR-print page.
- Performance checks on Android, including cold/warm launches and data use.
- **Done when:** installed app launches quickly, session persists, and network failures are communicated accurately.

### Phase 6 — Optional enhancements after real use
- Voice input with explicit microphone permission and confirmation before saving.
- Budget pacing indicator and historical period comparison.
- CSV export and bank-statement reconciliation.
- Offline durable write queue, only if necessary.

## 10. Testing checklist
- Currency: `249`, `249,50`, `249.50`, spaces, invalid input, negatives, rounding, very large numbers.
- Periods: payday 25, payday 31, January/December, leap February, daylight-saving changes, local calendar boundaries.
- Transactions: add, edit, delete, Undo, rapid taps, retries, simultaneous updates, slow network.
- Auth: signed out, session restore, expired session, authorized partner, unrelated third party.
- RLS: spoofed `created_by`, wrong household, membership escalation, cross-household access.
- UI: small Android screen, keyboard opening, tap targets, screen reader labels, empty state, no budget.
- PWA: installed launch, no network, reconnect, cache updates, no unwanted background activity.
- QR: scan printed Lidl/Willys codes with Android camera, direct URL opening, prefilled store + blank amount, invalid slug, login redirect preserving store, no unauthorized writes, no QR secrets, scannability and print contrast, browser vs installed PWA behavior.

## 11. Working agreement for Cursor
1. Implement **one phase at a time**. Do not jump ahead.
2. Before changes, list files to add/change and explain the architecture briefly.
3. Keep functions/components small, single-purpose, typed, and testable.
4. Do not introduce extra dependencies without justification.
5. Use explicit interfaces and a repository abstraction so mock data can later be replaced by Supabase.
6. Never sacrifice authorization, correctness, or durability for perceived speed.
7. Run typecheck, tests, lint, and build where available; report results and remaining issues.
8. At the end of each phase, summarize completed work, manual verification steps, and next phase; **stop for review**.

## 12. Open decisions (safe defaults)
- Period: payday-based, default day 25, configurable; monthly toggle.
- Budget: optional recurring fixed amount, editable in settings.
- Editing policy: both household members may edit/delete any shared transaction.
- Membership: two preapproved accounts provisioned administratively for MVP.
- Transaction dates: Europe/Stockholm calendar dates.
- Default entry flow: merchant suggestion → amount → save; comment optional. QR entry: scan store code → amount → save.
- QR first; NFC is a potential future alternative using the same HTTPS links, not part of MVP.
- Online-only writes in MVP; clearly show when offline.
