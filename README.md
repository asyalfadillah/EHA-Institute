# EHA Institute website

Static site (HTML/CSS/JS) whose content comes from Supabase project `eha-institute'.

- Public pages read articles, team, partners, programs and site settings from Supabase (read-only via RLS). If the database is unreachable they fall back to the bundled content in `js/data.js`.
- Images uploaded in the admin go to the public Storage bucket `media`.
- `js/config.js` holds the project URL and publishable key (safe for browsers; RLS protects writes).
- Host on any static host (Vercel, Netlify, Cloudflare Pages). Add the site URL under Supabase > Authentication > URL Configuration so confirmation emails redirect.
