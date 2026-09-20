# NFC Connect Frontend — updated

## Run locally
```bash
npm install
cp .env.example .env
npm run dev
```
Set `VITE_API_BASE_URL` to the backend `/api` URL.

## Production / Vercel
Set `VITE_API_BASE_URL` in Vercel Project Settings → Environment Variables.
The included `vercel.json` rewrites SPA routes such as `/c/:token`, `/dashboard`, and `/admin` to `index.html` so direct links work after deployment.

The public card URL is built from `window.location.origin`, so after deployment it becomes the deployed domain, e.g. `https://your-domain.vercel.app/c/19DA73AEA06E5F08`, not localhost.

The backend must allow the Vercel origin in CORS and the production frontend must point to the deployed backend.

## Important backend contract
The UI now separates the workflow:
- User owns and edits only their own profile/card request.
- User can submit one card request and cannot repeatedly create cards from the UI.
- Administrator generates/provisions the public NFC URL.
- The URL is shown to the user only after the card is provisioned.
- Main/super administrators get an Admin Management screen for admin CRUD/enable/disable actions.

For the main-admin management screen, the frontend expects these REST routes in addition to the existing admin routes:
- `PUT /admin/users/:id`
- `PATCH /admin/users/:id/disable`
- `PATCH /admin/users/:id/enable`
- `DELETE /admin/users/:id`

If the backend uses different route names, update the four methods in `src/services/api.js`.

Photo and cover photo fields are sent as `profile.photo` / `profile.coverPhoto` through the existing profile update payload. If the backend uses different field names or a dedicated upload endpoint, map them in `src/pages/user/Profile.jsx` and `src/pages/public/PublicCard.jsx`.

## UX/API notes for the updated frontend

- User workspace no longer has a Dashboard page; `/dashboard` redirects to `/profile` for backwards compatibility.
- User cards are limited to one Personal and one Company card. The frontend sends `cardType: PERSONAL|COMPANY` when creating a card.
- Admin card provisioning displays the generated public URL and labels the backend token as **Unique card ID** in the UI.
- User profile includes password-change and resume/document controls. The supplied backend should expose `PUT /api/profile/password` and persist the resume fields sent through `PUT /api/profile`.
- User enable/disable actions use `PATCH /api/admin/users/:id/enable` and `/disable`. The backend must enforce disabled-user login and public-card blocking.
- Deleted cards remain visible to admins only when the admin cards endpoint returns deletion history (`deletedAt` / `deleted: true`); this preserves the audit trail without restoring the card to the user.
- For two simultaneous accounts in separate Chrome tabs, the backend must support tab-isolated authentication (for example a bearer/session token that the frontend can store in `sessionStorage`). A cookie-only session is shared by all tabs of the same origin, so the frontend alone cannot make two independent cookie sessions.

## Admin user detail + card control update
The admin UI now includes `/admin/users/:id`, where an administrator can inspect the selected user's account/profile fields and all NFC cards owned by that user, then edit/delete user data and edit/delete/deactivate/reactivate cards.

For the new administrator card controls, the backend should expose:
- `GET /admin/users/:id`
- `PUT /admin/cards/:id`
- `PATCH /admin/cards/:id/disable`
- `PATCH /admin/cards/:id/enable`

The backend must persist an administrator-controlled card lock (for example `adminDisabled: true` or an equivalent status). A normal user `enable` request must reject cards locked by an administrator, and public-card access should also be rejected while an administrator lock is active. The frontend treats `status: ADMIN_DISABLED` or `adminDisabled: true` as administrator-controlled deactivation.
