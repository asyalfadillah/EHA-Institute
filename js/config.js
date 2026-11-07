/* Supabase project for EHA Institute. The publishable key is safe to ship in the browser:
   Row Level Security decides what it can read, and only signed-in admins can write. */
window.EHA_CONFIG = {
  url: 'https://audkmlwqoiiosomhjwtg.supabase.co',
  key: 'sb_publishable_O5Eiru9wbt1E9HR0fGi0RQ_SYHo0SlX',
  // CAPTCHA di form login /admineha (Cloudflare Turnstile, diverifikasi server oleh Supabase Auth). provider: 'turnstile' atau 'hcaptcha'.
  // Isi siteKey (kunci publik). Catatan: hanya turnstile/hcaptcha yang diverifikasi server oleh Supabase Auth.
  captcha: { provider: 'turnstile', siteKey: '0x4AAAAAAF3dobiXOdIti3GT' }
};
