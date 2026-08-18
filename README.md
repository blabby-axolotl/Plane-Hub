# Plane Hub — Prototype

This is a simple client-side prototype for Plane Hub.

Features included:
- Upload images/videos (stored in-browser) with a simple CAPTCHA.
- All uploads go to a pending queue and must be approved by an admin (admin email: finn.tattersall@gmail.com).
- Admin UI (admin.html) lets the admin approve or deny posts.
- Approved posts appear on the public feed, with likes, comments, and follow actions (all stored in localStorage).
- Placeholder variable in app.js for a Google Apps Script endpoint: set `GOOGLE_APPS_SCRIPT_URL` and uncomment the fetch in notifyAdmin() to integrate.

Notes:
- This is a local prototype — no server. When you are ready to add a real backend, wire the upload and approval actions to your Google Apps Script API.
