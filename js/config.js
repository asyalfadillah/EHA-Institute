/* Supabase project for EHA Institute. The publishable key is safe to ship in the browser:
   Row Level Security decides what it can read, and only signed-in admins can write. */
window.EHA_CONFIG = {
  url: 'https://audkmlwqoiiosomhjwtg.supabase.co',
  key: 'sb_publishable_O5Eiru9wbt1E9HR0fGi0RQ_SYHo0SlX',
  // CAPTCHA untuk halaman login /admineha. Supabase Auth mendukung Cloudflare Turnstile ('turnstile') dan 'hcaptcha'.
  // Isi siteKey (kunci publik) dan aktifkan juga di Supabase: Authentication > Attack Protection (isi secret key).
  captcha: { provider: 'turnstile', siteKey: '' }
};
