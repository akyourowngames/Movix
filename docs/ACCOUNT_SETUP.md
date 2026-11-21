# Account system setup

This document covers everything required for CineHindi’s account features:
authentication, recovery, profile editing, avatars and self-serve deletion.

## What is implemented

| Flow | Route / mechanism |
| --- | --- |
| Sign up + email confirmation | `/signup` → Supabase email → `/auth/callback` |
| Sign in | `/login` |
| Forgot password | `/forgot-password` → Supabase recovery email → `/auth/callback?next=/reset-password` |
| Reset password | `/reset-password` |
| Resend confirmation | Login page (when email is unconfirmed) + Account settings |
| Account settings | `/account` |
| Display name | `profiles.display_name` |
| Avatar upload | Supabase Storage bucket `avatars`, resized to 320px WebP |
| Email change | Supabase confirmation email (secure change may require both inboxes) |
| Password change | `/account` |
| Sign out all devices | `supabase.auth.signOut({ scope: 'global' })` |
| Clear library | Deletes watch history, watchlist, likes, playback (cloud + local cache) |
| Delete account | `delete-account` Edge Function → hard-deletes auth user, cascades library, removes avatars |

---

## 1. Database + Storage

Run all migrations in order:

```text
supabase/migrations/20261115000000_user_library.sql
supabase/migrations/20261121000000_avatar_storage.sql
```

The second migration creates a public `avatars` bucket (2MB limit; JPG/PNG/WebP)
with owner-scoped insert/update/delete policies and public read.

## 2. Edge Function (delete account)

Function source: `supabase/functions/delete-account/index.ts`.

Deploy with the Supabase CLI:

```bash
supabase functions deploy delete-account
```

Or deploy it from the Supabase dashboard / MCP tooling.

- `verify_jwt` must stay **enabled**.
- The function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are
  available to Edge Functions by default.
- It deletes avatar objects first, then calls `auth.admin.deleteUser`.
- `profiles`, `watch_history`, `watchlist`, `likes` and `playback` cascade via
  foreign keys.

## 3. Auth URL configuration (required)

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://cine-hindi.vercel.app`
- **Redirect URLs:**
  - `https://cine-hindi.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

Password recovery, signup confirmation and email-change links all return through
`/auth/callback`, which exchanges the code and redirects to a safe local path.

If the redirect URL is not allowlisted, Supabase falls back to the Site URL and
the reset page may not receive a session.

## 4. Email delivery

The app uses Supabase Auth’s email sending (`resetPasswordForEmail`,
`signUp`, `resend`, `updateUser({ email })`).

- The **built-in email sender is rate-limited** and intended for development.
- For production, configure **custom SMTP** in Authentication → SMTP Settings
  (Resend, Postmark, SendGrid, etc.) and set the sender name/address.
- Update the confirmation, recovery and email-change templates with CineHindi
  branding and a clear sender.
- Consider enabling **leaked password protection** (Supabase advisor currently
  flags it as disabled).

## 5. Environment variables

```env
NEXT_PUBLIC_SITE_URL=https://cine-hindi.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

No service role key is exposed to the browser. The Edge Function gets it from
the Supabase runtime.

## 6. Verification checklist

- [ ] Sign up with a new address; confirm the email; land on `/account`.
- [ ] Log in, open `/account`.
- [ ] Upload an avatar; confirm it appears in the navbar and profile page.
- [ ] Change display name; refresh and confirm it persists.
- [ ] Change password; sign in with the new password.
- [ ] Request a reset link; open it on the same browser; set a new password.
- [ ] Resend confirmation for an unconfirmed account.
- [ ] Change email; confirm from both inboxes if secure change is on.
- [ ] Sign out all devices; confirm the session is revoked.
- [ ] Clear library; verify history/watchlist/likes/playback are empty.
- [ ] Delete account; verify auth user, profile, library and avatar files are gone.
- [ ] Confirm `/account`, `/login`, `/signup`, `/forgot-password`,
      `/reset-password` and `/profile` are `noindex` and disallowed in robots.txt.
