/* EHA Institute admin panel. Talks to Supabase directly; Row Level Security only lets
   emails listed in public.admin_emails write anything. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const cfg = window.EHA_CONFIG;
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v; else if (k === 'style') el.style.cssText = v; else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => c != null && el.append(c.nodeType ? c : document.createTextNode(c)));
    return el;
  };
  const toast = (msg, err) => { const t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (err ? ' err' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = 'toast', err ? 5000 : 2600); };
  const fdate = d => { if (!d) return ''; const [y, m, dd] = d.slice(0, 10).split('-'); return `${dd}.${m}.${y}`; };
  const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  const ap = (el, ...k) => el.append(...k.filter(Boolean));
  const today = () => new Date().toISOString().slice(0, 10);

  if (!window.supabase || !cfg) { $('#boot').textContent = 'Tidak dapat memuat pustaka Supabase. Periksa koneksi internet.'; return; }
  // Session lives in sessionStorage: closing the tab (or the browser) signs the admin out.
  const sessStore = (() => { try { sessionStorage.setItem('_t', '1'); sessionStorage.removeItem('_t'); return sessionStorage; } catch { return undefined; } })();
  try { Object.keys(localStorage).filter(k => /^sb-.*-auth-token/.test(k)).forEach(k => localStorage.removeItem(k)); } catch {} // drop sessions saved by older versions
  const sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true, storage: sessStore } });
  const IDLE_MS = 5 * 60 * 1000, WARN_MS = 30 * 1000;

  /* ---------- entities ---------- */
  const F = {
    text: (key, label, o = {}) => ({ type: 'text', key, label, ...o }),
    area: (key, label, o = {}) => ({ type: 'area', key, label, wide: true, ...o }),
    date: (key, label, o = {}) => ({ type: 'date', key, label, ...o }),
    num: (key, label, o = {}) => ({ type: 'num', key, label, ...o }),
    sel: (key, label, options, o = {}) => ({ type: 'sel', key, label, options, ...o }),
    bool: (key, label, o = {}) => ({ type: 'bool', key, label, ...o }),
    img: (key, label, o = {}) => ({ type: 'img', key, label, wide: true, ...o }),
    facts: (key, label, o = {}) => ({ type: 'facts', key, label, wide: true, ...o }),
    rel: (key, label, o = {}) => ({ type: 'rel', key, label, wide: true, ...o })
  };
  const ENT = {
    articles: {
      label: 'Berita & Event', one: 'artikel', table: 'articles', order: 'published_at.desc,created_at.desc',
      hint: 'Berita, event/webinar, dan publikasi. Tampil di Beranda, halaman News, dan halaman artikel.',
      row: a => ({ t: a.title, m: `${{ news: 'News', event: 'Event', publication: 'Publication' }[a.category]} · ${fdate(a.published_at)}${a.in_brief ? ' · News Brief' : ''}`, img: a.cover, badge: a.status === 'draft' ? 'Draf' : '' }),
      search: a => a.title + ' ' + a.slug,
      blank: () => ({ category: 'news', lang: 'id', status: 'published', published_at: today(), facts: [], in_brief: false, body: '', dek: '' }),
      fields: [
        F.text('title', 'Judul', { wide: true, required: true }),
        F.text('slug', 'Slug (alamat URL)', { required: true, pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, help: 'Huruf kecil, angka, dan tanda hubung. Contoh: kuliah-umum-2026', auto: 'title' }),
        F.sel('category', 'Kategori', [['news', 'News'], ['event', 'Event / Webinar'], ['publication', 'Publication']]),
        F.date('published_at', 'Tanggal terbit', { required: true }),
        F.date('event_date', 'Tanggal acara', { help: 'Khusus event. Isi agar tampil di Upcoming Events beranda; kosongkan jika tidak perlu.', showIf: d => d.category === 'event' }),
        F.text('tag', 'Label', { help: 'Opsional, mis. Webinar Series #4 atau Public lecture.' }),
        F.sel('lang', 'Bahasa teks', [['id', 'Indonesia'], ['en', 'English']]),
        F.sel('status', 'Status', [['published', 'Terbit'], ['draft', 'Draf (tidak tampil di situs)']]),
        F.bool('in_brief', 'Tampilkan di carousel News Brief (beranda)'),
        F.img('cover', 'Gambar sampul', { ratio: '3:2', sizes: [[900, 600, 'Kecil'], [1500, 1000, 'Standar'], [2100, 1400, 'Besar']], sizeDefault: 1, spec: 'Disarankan 1500 × 1000 px (rasio 3:2).', help: 'Gambar otomatis dipotong ke rasio 3:2 dan dikecilkan. Asli maks. 15 MB.' }),
        F.area('dek', 'Ringkasan (1–2 kalimat)', { rows: 3 }),
        F.area('body', 'Isi artikel', { rows: 12, help: 'Pisahkan paragraf dengan baris kosong. "## Judul" untuk subjudul, "- " untuk daftar, **tebal**, [teks](https://tautan).' }),
        F.facts('facts', 'Detail (kotak samping)', { help: 'Pasangan label dan isi, mis. Tanggal / 18 Oktober 2025.' })
      ]
    },
    team_members: {
      label: 'Tim', one: 'anggota tim', table: 'team_members', order: 'sort.asc,name.asc',
      hint: 'Anggota tim yang tampil di halaman Our People.',
      row: m => ({ t: m.name, m: m.role + (m.published ? '' : ' · disembunyikan'), img: m.photo, ini: m.name[0], badge: m.published ? '' : 'Draf' }),
      search: m => m.name + ' ' + m.role,
      blank: () => ({ published: true, sort: 100, bio: '' }),
      fields: [F.text('name', 'Nama', { wide: true, required: true }), F.text('role', 'Jabatan', { required: true }), F.num('sort', 'Urutan', { help: 'Angka kecil tampil lebih dulu.' }),
        F.img('photo', 'Foto', { ratio: '4:5', sizes: [[480, 600, 'Kecil'], [800, 1000, 'Standar'], [1200, 1500, 'Besar']], sizeDefault: 1, spec: 'Disarankan 800 × 1000 px (rasio 4:5).', help: 'Foto otomatis dipotong ke rasio 4:5 dan dikecilkan ke ukuran yang dipilih. JPG/PNG/WebP, asli maks. 15 MB. Kosongkan untuk memakai inisial.' }), F.area('bio', 'Bio singkat (opsional)', { rows: 3 }), F.bool('published', 'Tampilkan di situs')]
    },
    partners: {
      label: 'Mitra', one: 'mitra', table: 'partners', order: 'sort.asc,name.asc',
      hint: 'Institusi mitra. Tampil di pita berjalan beranda dan halaman About.',
      row: p => ({ t: p.name, m: p.country + (p.published ? '' : ' · disembunyikan'), ini: p.name[0], badge: p.published ? '' : 'Draf' }),
      search: p => p.name + ' ' + p.country,
      blank: () => ({ published: true, sort: 100 }),
      fields: [F.text('name', 'Nama institusi', { wide: true, required: true }), F.text('country', 'Negara'), F.num('sort', 'Urutan'),
        F.img('logo', 'Logo mitra (opsional)', { ratio: '212:300', fit: 'contain', png: true, sizes: [[212, 300, 'Standar'], [424, 600, 'Tajam 2×']], sizeDefault: 0, spec: 'Ukuran logo 212 × 300 px (PNG transparan).', help: 'Logo otomatis dimuat utuh (tanpa terpotong) ke kanvas 212 × 30 px. Pilih "Tajam 2×" (424 × 60 px) agar tidak buram di layar retina. Pakai latar transparan atau putih. Nama instansi tampil di bawah logo.' }), F.text('url', 'Situs web (opsional)', { wide: true, help: 'Diawali https://' }), F.bool('published', 'Tampilkan di situs')]
    },
    programs: {
      label: 'Riset & Layanan', one: 'program', table: 'programs', order: 'kind.asc,sort.asc',
      hint: 'Isi halaman Main Research Areas dan Consultation Services.',
      row: p => ({ t: p.title, m: (p.kind === 'research' ? 'Research area' : 'Consultation service') + (p.published ? '' : ' · disembunyikan'), ini: String(p.sort), badge: p.published ? '' : 'Draf' }),
      search: p => p.title,
      blank: () => ({ kind: 'research', published: true, sort: 100, related: [] }),
      fields: [F.text('title', 'Judul', { wide: true, required: true }), F.sel('kind', 'Ditampilkan di', [['research', 'Main Research Areas'], ['service', 'Consultation Services']]), F.num('sort', 'Urutan'),
        F.area('body', 'Deskripsi', { rows: 4 }), F.rel('related', 'Artikel terkait', { help: 'Tautan "Related" di bawah deskripsi.' }), F.bool('published', 'Tampilkan di situs')]
    }
  };
  const TABS = [...Object.keys(ENT), 'settings', 'admins'];
  const TAB_LABEL = { ...Object.fromEntries(Object.entries(ENT).map(([k, v]) => [k, v.label])), settings: 'Info Situs', admins: 'Admin' };

  /* ---------- state ---------- */
  let user = null, tab = 'articles', rows = [], ARTS = [];
  const counts = {};

  /* ---------- auth flow ---------- */
  const show = id => ['boot', 'auth', 'claim', 'app'].forEach(k => $('#' + k).hidden = k !== id);
  let signup = false;
  $('#auth-toggle').addEventListener('click', () => {
    signup = !signup;
    $('#auth-go').textContent = signup ? 'Daftar' : 'Masuk';
    $('#auth-toggle').textContent = signup ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar';
    $('#a-pass').autocomplete = signup ? 'new-password' : 'current-password'; $('#auth-note').textContent = '';
  });
  /* ---------- CAPTCHA (Cloudflare Turnstile / hCaptcha; verified by Supabase Auth) ---------- */
  const captcha = (() => {
    const c = cfg.captcha || {}, on = !!(c.siteKey && /^(recaptcha|turnstile|hcaptcha)$/.test(c.provider));
    let id = null, tok = '';
    const box = $('#captcha');
    if (!on || !box) return { on: false, token: () => '', reset() {} };
    const api = { recaptcha: 'https://www.google.com/recaptcha/api.js?render=explicit', turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', hcaptcha: 'https://js.hcaptcha.com/1/api.js?render=explicit' }[c.provider];
    const lib = () => ({ recaptcha: window.grecaptcha, turnstile: window.turnstile, hcaptcha: window.hcaptcha })[c.provider];
    const mount = () => { id = lib().render(box, { sitekey: c.siteKey, theme: 'light', callback: t => { tok = t; }, 'expired-callback': () => { tok = ''; }, 'error-callback': () => { tok = ''; } }); };
    box.hidden = false;
    const sc = document.createElement('script'); sc.src = api; sc.async = true; sc.onload = () => { const w = setInterval(() => { if (lib() && lib().render) { clearInterval(w); mount(); } }, 50); };
    document.head.appendChild(sc);
    return { on: true, supabase: c.provider !== 'recaptcha', token: () => tok, reset() { tok = ''; try { id !== null && lib().reset(id); } catch {} } };
  })();
  $('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const note = $('#auth-note'), email = $('#a-email').value.trim(), password = $('#a-pass').value;
    note.className = 'note';
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) { note.textContent = 'Isi email yang valid dan kata sandi minimal 8 karakter.'; note.classList.add('err'); return; }
    const cap = captcha.token(); if (captcha.on && !cap) { note.textContent = 'Selesaikan verifikasi CAPTCHA terlebih dahulu.'; note.classList.add('err'); return; }
    $('#auth-go').disabled = true;
    const { data, error } = signup ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split('#')[0], captchaToken: captcha.supabase ? cap || undefined : undefined } }) : await sb.auth.signInWithPassword({ email, password, options: { captchaToken: captcha.supabase ? cap || undefined : undefined } });
    captcha.reset();
    $('#auth-go').disabled = false;
    if (error) { note.textContent = error.message === 'Invalid login credentials' ? 'Email atau kata sandi salah.' : error.message; note.classList.add('err'); return; }
    if (signup && !data.session) { note.textContent = 'Akun dibuat. Buka email Anda dan klik tautan konfirmasi, lalu masuk di sini.'; note.classList.add('ok'); return; }
    await afterLogin(data.user || data.session?.user);
  });
  const signOut = async (reason) => {
    idle.stop(); await sb.auth.signOut(); user = null; show('auth');
    const n = $('#auth-note'); if (n) { n.className = reason ? 'note err' : 'note'; n.textContent = typeof reason === 'string' ? reason : ''; }
  };
  /* ---------- auto sign-out after 5 minutes without activity ---------- */
  const idle = (() => {
    let last = Date.now(), tm = 0, warned = false;
    const bump = () => { last = Date.now(); warned = false; };
    const tick = () => {
      const gap = Date.now() - last; // Date.now() keeps counting while the laptop sleeps or the tab is in the background
      if (gap >= IDLE_MS) { signOut('Anda keluar otomatis karena tidak ada aktivitas selama 5 menit. Silakan masuk kembali.'); }
      else if (gap >= IDLE_MS - WARN_MS && !warned) { warned = true; toast('Tidak ada aktivitas. Anda akan keluar otomatis dalam 30 detik.', true); }
    };
    const evs = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'];
    return {
      start() { bump(); evs.forEach(e => addEventListener(e, bump, { passive: true, capture: true })); document.addEventListener('visibilitychange', tick); clearInterval(tm); tm = setInterval(tick, 5000); },
      stop() { evs.forEach(e => removeEventListener(e, bump, { capture: true })); document.removeEventListener('visibilitychange', tick); clearInterval(tm); }
    };
  })();
  $('#out').addEventListener('click', () => signOut()); $('#claim-out').addEventListener('click', () => signOut());

  async function afterLogin(u) {
    user = u;
    const { data: ok, error } = await sb.rpc('is_admin');
    if (error) { toast(error.message, true); show('auth'); return; }
    if (ok) { show('app'); idle.start(); $('#who').textContent = u.email; buildTabs(); await switchTab(tab); return; }
    // not an admin: offer to claim the very first admin slot (the database refuses if one exists)
    show('claim'); idle.start();
    $('#claim-text').textContent = `Anda masuk sebagai ${u.email}. Jika belum ada admin sama sekali, Anda bisa menjadi admin pertama. Jika sudah ada, minta admin yang ada untuk menambahkan email ini di menu Admin.`;
    $('#claim-go').hidden = false;
  }
  $('#claim-go').addEventListener('click', async () => {
    const note = $('#claim-note'); note.className = 'note';
    const { data, error } = await sb.rpc('claim_first_admin');
    if (error) { note.textContent = error.message; note.classList.add('err'); return; }
    if (!data) { note.textContent = 'Sudah ada admin. Minta admin yang ada menambahkan email Anda.'; note.classList.add('err'); return; }
    await afterLogin(user);
  });

  /* ---------- tabs + list ---------- */
  function buildTabs() {
    const nav = $('#tabs'); nav.replaceChildren(...TABS.map(k => h('button', { 'aria-current': String(k === tab), onclick: () => switchTab(k) }, TAB_LABEL[k], h('small', { id: 'n-' + k }, counts[k] ?? ''))));
  }
  async function switchTab(k) {
    tab = k; $('#filter').value = '';
    document.querySelectorAll('#tabs button').forEach((b, i) => b.setAttribute('aria-current', String(TABS[i] === k)));
    $('#title').textContent = TAB_LABEL[k];
    const isEnt = !!ENT[k];
    $('#hint').textContent = isEnt ? ENT[k].hint : k === 'settings' ? 'Teks dan kontak yang tampil di banyak halaman (judul hero, alamat, email, media sosial).' : 'Email yang boleh masuk ke panel ini.';
    $('#new').hidden = k === 'settings'; $('#new').textContent = k === 'admins' ? '+ Tambah admin' : '+ Tambah'; $('#filter').hidden = !isEnt;
    $('#list').replaceChildren(h('p', { class: 'empty' }, 'Memuat…'));
    if (isEnt) await loadRows(); else if (k === 'settings') await renderSettings(); else await renderAdmins();
  }
  async function loadArts() {
    const { data } = await sb.from('articles').select('slug,title').order('published_at', { ascending: false });
    ARTS = data || [];
  }
  async function loadRows() {
    const e = ENT[tab];
    let q = sb.from(e.table).select('*'); e.order.split(',').forEach(o => { const [c, d] = o.split('.'); q = q.order(c, { ascending: d === 'asc' }); });
    const { data, error } = await q;
    if (error) { $('#list').replaceChildren(h('p', { class: 'empty' }, error.message)); return; }
    rows = data; counts[tab] = rows.length; const n = $('#n-' + tab); if (n) n.textContent = rows.length;
    paintList();
  }
  function paintList() {
    const e = ENT[tab], f = $('#filter').value.trim().toLowerCase();
    const shown = rows.filter(r => !f || e.search(r).toLowerCase().includes(f));
    if (!shown.length) { $('#list').replaceChildren(h('p', { class: 'empty' }, rows.length ? 'Tidak ada yang cocok.' : `Belum ada ${e.one}. Klik “Tambah”.`)); return; }
    $('#list').replaceChildren(...shown.map(r => {
      const v = e.row(r);
      const thumb = h('span', { class: 'item__thumb', style: v.img && /^(https:|assets\/)/.test(v.img) ? `background-image:url("${v.img}")` : '' }, v.img ? '' : (v.ini || ''));
      return h('button', { class: 'item', type: 'button', onclick: () => openEditor(r) }, thumb, h('span', {}, h('span', { class: 'item__t' }, v.t), h('div', { class: 'item__m' }, v.m)), v.badge ? h('span', { class: 'badge badge--draft' }, v.badge) : h('span'));
    }));
  }
  $('#filter').addEventListener('input', () => ENT[tab] && paintList());
  $('#new').addEventListener('click', () => tab === 'admins' ? addAdmin() : openEditor(null));

  /* ---------- editor ---------- */
  const dlg = $('#editor'); let cur = null, readers = {}, isNew = false;
  async function openEditor(row) {
    const e = ENT[tab]; isNew = !row; cur = row ? structuredClone(row) : e.blank();
    if (e.fields.some(f => f.type === 'rel') && !ARTS.length) await loadArts();
    $('#editor-title').textContent = (isNew ? 'Tambah ' : 'Ubah ') + e.one;
    $('#del').hidden = isNew; readers = {};
    const box = $('#fields'); box.replaceChildren();
    const wraps = [];
    e.fields.forEach(f => {
      const wrap = h('div', { class: 'f' + (f.wide ? ' f--wide' : '') }); wraps.push([f, wrap]);
      const id = 'fld-' + f.key; const val = cur[f.key];
      const help = f.help ? h('small', {}, f.help) : null;
      if (f.type === 'bool') {
        const i = h('input', { type: 'checkbox', id, checked: !!val }); readers[f.key] = () => i.checked; ap(wrap, h('label', { class: 'chk', for: id }, i, f.label));
      } else if (f.type === 'text' || f.type === 'date' || f.type === 'num') {
        const i = h('input', { type: f.type === 'num' ? 'number' : f.type === 'date' ? 'date' : 'text', id, value: val ?? '', required: f.required, autocomplete: 'off' });
        readers[f.key] = () => f.type === 'num' ? (i.value === '' ? 0 : Number(i.value)) : (i.value.trim() || (f.type === 'date' ? null : (f.required ? '' : null)));
        ap(wrap, h('label', { for: id }, f.label), i, help);
        if (f.auto && isNew) { let touched = false; i.addEventListener('input', () => touched = true); wraps.autoTarget = { i, src: f.auto, touched: () => touched }; }
      } else if (f.type === 'area') {
        const i = h('textarea', { id, rows: f.rows || 4 }); i.value = val ?? ''; readers[f.key] = () => i.value.trim(); ap(wrap, h('label', { for: id }, f.label), i, help);
      } else if (f.type === 'sel') {
        const i = h('select', { id }, f.options.map(([v, l]) => h('option', { value: v, selected: v === val }, l)));
        readers[f.key] = () => i.value; ap(wrap, h('label', { for: id }, f.label), i);
        i.addEventListener('change', syncVisibility);
      } else if (f.type === 'img') ap(wrap, imageField(f, val, help));
      else if (f.type === 'facts') ap(wrap, factsField(f, val, help));
      else if (f.type === 'rel') ap(wrap, relField(f, val, help));
      box.append(wrap);
    });
    function syncVisibility() {
      const d = Object.fromEntries(Object.entries(readers).map(([k, r]) => [k, r()]));
      wraps.forEach(([f, w]) => { if (f.showIf) w.hidden = !f.showIf(d); });
    }
    if (wraps.autoTarget) { const { i, src } = wraps.autoTarget; $('#fld-' + src).addEventListener('input', ev => { if (!wraps.autoTarget.touched()) i.value = slugify(ev.target.value); }); }
    syncVisibility();
    dlg.showModal(); $('#fields').scrollTop = 0;
  }
  // Resize (and crop to ratio when given) in the browser, then upload to the "media" bucket.
  function fitImage(file, { w, h, max, fit, type = 'image/jpeg', q = 0.88 }) {
    return new Promise((ok, fail) => {
      const src = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(src);
        let sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight, tw, th;
        if (w && h && fit === 'contain') { // keep the whole picture inside w x h, centered
          tw = w; th = h;
        } else if (w && h) { // crop to the target ratio (center), then scale to w x h
          const r = w / h; if (sw / sh > r) { const nw = sh * r; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / r; sy = (sh - nh) / 2; sh = nh; }
          const k = Math.min(1, w / sw); tw = Math.round(sw * k); th = Math.round(sh * k);
        } else { const k = Math.min(1, (max || 1600) / Math.max(sw, sh)); tw = Math.round(sw * k); th = Math.round(sh * k); }
        const c = document.createElement('canvas'); c.width = tw; c.height = th;
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'high';
        if (fit === 'contain') { const k = Math.min(tw / sw, th / sh), dw = Math.round(sw * k), dh = Math.round(sh * k); g.drawImage(im, 0, 0, sw, sh, Math.round((tw - dw) / 2), Math.round((th - dh) / 2), dw, dh); }
        else { if (type !== 'image/png') { g.fillStyle = '#fff'; g.fillRect(0, 0, tw, th); } g.drawImage(im, sx, sy, sw, sh, 0, 0, tw, th); }
        c.toBlob(bl => bl ? ok({ blob: bl, w: tw, h: th, ow: im.naturalWidth, oh: im.naturalHeight }) : fail(new Error('Gagal memproses gambar')), type, q);
      };
      im.onerror = () => { URL.revokeObjectURL(src); fail(new Error('File bukan gambar yang valid')); };
      im.src = src;
    });
  }
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB';
  function imageField(f, val, help) {
    const pv = h('div', { class: 'img__pv' }), url = h('input', { type: 'text', value: val || '', placeholder: 'Unggah file atau tempel URL gambar (https://…)', autocomplete: 'off' });
    if (f.ratio) pv.style.aspectRatio = f.ratio.replace(':', ' / ');
    const info = h('p', { class: 'help', style: 'margin:0' }, f.spec || '');
    const paint = () => { const v = url.value.trim(); pv.style.backgroundImage = /^https:\/\//.test(v) ? `url("${v}")` : /^assets\//.test(v) ? `url("${v}")` : ''; };
    const file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif', hidden: true });
    const sizes = f.sizes || null, sel = sizes ? h('select', { 'aria-label': 'Ukuran foto' }, sizes.map(([w, hh, l], i) => h('option', { value: i, selected: i === (f.sizeDefault ?? 0) }, `${l} (${w} × ${hh} px)`))) : null;
    const up = h('button', { type: 'button', class: 'btn', onclick: () => file.click() }, 'Unggah gambar');
    const clr = h('button', { type: 'button', class: 'btn', onclick: () => { url.value = ''; paint(); info.textContent = f.spec || ''; } }, 'Hapus');
    file.addEventListener('change', async () => {
      const fl = file.files[0]; file.value = ''; if (!fl) return;
      if (fl.size > 15 * 1024 * 1024) { toast('Ukuran file asli maksimal 15 MB.', true); return; }
      up.disabled = true; up.textContent = 'Memproses…';
      try {
        let opt = { max: f.max || 1600 }; if (sizes) { const [w, hh] = sizes[+sel.value]; opt = { w, h: hh, fit: f.fit, type: f.png ? 'image/png' : 'image/jpeg' }; }
        const gif = fl.type === 'image/gif'; let blob = fl, w0 = '', ext = fl.name.split('.').pop();
        if (!gif) { const r = await fitImage(fl, opt); blob = r.blob; ext = opt.type === 'image/png' ? 'png' : 'jpg'; w0 = `${r.w} × ${r.h} px · ${kb(r.blob.size)} (asli ${r.ow} × ${r.oh} px, ${kb(fl.size)})`; }
        else w0 = kb(fl.size);
        if (blob.size > 5 * 1024 * 1024) throw new Error('Hasil masih lebih dari 5 MB, pilih ukuran lebih kecil.');
        up.textContent = 'Mengunggah…';
        const base = fl.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'foto';
        const name = `${Date.now()}-${base}.${ext}`;
        const { error } = await sb.storage.from('media').upload(name, blob, { cacheControl: '31536000', contentType: gif ? fl.type : blob.type || 'image/jpeg' });
        if (error) throw error;
        url.value = sb.storage.from('media').getPublicUrl(name).data.publicUrl; paint(); info.textContent = 'Terunggah: ' + w0; toast('Gambar terunggah.');
      } catch (e) { toast('Gagal: ' + (e.message || e), true); }
      up.disabled = false; up.textContent = 'Unggah gambar';
    });
    url.addEventListener('input', paint); paint();
    readers[f.key] = () => url.value.trim() || null;
    return h('div', { class: 'f' }, h('span', { class: 'lbl' }, f.label), h('div', { class: 'img' }, pv, h('div', { class: 'img__ctl' }, url, sel ? h('label', { class: 'help', style: 'display:grid;gap:4px' }, 'Ukuran hasil', sel) : '', h('div', { style: 'display:flex;gap:8px' }, up, clr), info, file)), help);
  }
  function factsField(f, val, help) {
    const list = h('div'); const add = (k = '', v = '') => {
      const row = h('div', { class: 'kv' }, h('input', { type: 'text', value: k, placeholder: 'Label', 'aria-label': 'Label' }), h('input', { type: 'text', value: v, placeholder: 'Isi', 'aria-label': 'Isi' }),
        h('button', { type: 'button', 'aria-label': 'Hapus baris', onclick: () => row.remove() }, '×')); list.append(row);
    };
    (Array.isArray(val) ? val : []).forEach(x => add(x.k, x.v));
    readers[f.key] = () => [...list.children].map(r => { const [a, b] = r.querySelectorAll('input'); return { k: a.value.trim(), v: b.value.trim() }; }).filter(x => x.k && x.v);
    return h('div', { class: 'f' }, h('span', { class: 'lbl' }, f.label), list, h('button', { type: 'button', class: 'btn', style: 'justify-self:start', onclick: () => add() }, '+ Tambah baris'), help);
  }
  function relField(f, val, help) {
    const sel = new Set(val || []);
    const box = h('div', { class: 'pick' }, ARTS.map(a => h('label', {}, h('input', { type: 'checkbox', value: a.slug, checked: sel.has(a.slug), onchange: ev => ev.target.checked ? sel.add(a.slug) : sel.delete(a.slug) }), a.title)));
    readers[f.key] = () => ARTS.filter(a => sel.has(a.slug)).map(a => a.slug);
    return h('div', { class: 'f' }, h('span', { class: 'lbl' }, f.label), box, help);
  }
  $('#editor-x').addEventListener('click', () => dlg.close()); $('#cancel').addEventListener('click', () => dlg.close());
  $('#form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const e = ENT[tab], payload = {};
    for (const f of e.fields) {
      const v = readers[f.key](); payload[f.key] = v;
      if (f.required && (v === '' || v == null)) { toast(`“${f.label}” wajib diisi.`, true); $('#fld-' + f.key)?.focus(); return; }
      if (f.pattern && v && !f.pattern.test(v)) { toast(`“${f.label}”: ${f.help}`, true); $('#fld-' + f.key)?.focus(); return; }
    }
    if (payload.category && payload.category !== 'event') payload.event_date = null;
    if (payload.url && !/^https?:\/\//.test(payload.url)) { toast('Situs web harus diawali https://', true); return; }
    $('#save').disabled = true;
    const { error } = isNew ? await sb.from(e.table).insert(payload) : await sb.from(e.table).update(payload).eq('id', cur.id);
    $('#save').disabled = false;
    if (error) { toast(error.code === '23505' ? 'Slug sudah dipakai artikel lain.' : error.message, true); return; }
    dlg.close(); toast('Tersimpan.'); await loadRows(); if (tab === 'articles') ARTS = [];
  });
  $('#del').addEventListener('click', async () => {
    const e = ENT[tab]; if (!confirm(`Hapus ${e.one} ini secara permanen?`)) return;
    const { error } = await sb.from(e.table).delete().eq('id', cur.id);
    if (error) { toast(error.message, true); return; }
    dlg.close(); toast('Dihapus.'); await loadRows(); ARTS = [];
  });

  /* ---------- settings + admins ---------- */
  async function renderSettings() {
    const { data, error } = await sb.from('site_settings').select('*').order('key');
    if (error) { $('#list').replaceChildren(h('p', { class: 'empty' }, error.message)); return; }
    $('#list').replaceChildren(...data.map(s => {
      const long = s.value.length > 70 || /intro|headline/.test(s.key);
      const input = long ? h('textarea', { 'aria-label': s.label || s.key }) : h('input', { type: 'text', 'aria-label': s.label || s.key });
      input.value = s.value;
      const btn = h('button', { class: 'btn btn--primary', type: 'button', onclick: async () => {
        btn.disabled = true; const { error: er } = await sb.from('site_settings').update({ value: input.value.trim() }).eq('key', s.key); btn.disabled = false;
        er ? toast(er.message, true) : toast('Tersimpan.');
      } }, 'Simpan');
      return h('div', { class: 'set' }, h('div', {}, h('b', {}, s.label || s.key), h('code', {}, s.key)), input, btn);
    }));
  }
  async function renderAdmins() {
    const { data, error } = await sb.from('admin_emails').select('*').order('created_at');
    if (error) { $('#list').replaceChildren(h('p', { class: 'empty' }, error.message)); return; }
    $('#list').replaceChildren(...data.map(a => h('div', { class: 'set', style: 'grid-template-columns:1fr auto' }, h('div', {}, h('b', {}, a.email), h('code', {}, a.email === user.email.toLowerCase() ? 'Anda' : 'Ditambahkan ' + fdate(a.created_at))),
      a.email === user.email.toLowerCase() ? h('span') : h('button', { class: 'btn btn--danger', onclick: async () => { if (!confirm(`Cabut akses ${a.email}?`)) return; const { error: er } = await sb.from('admin_emails').delete().eq('email', a.email); er ? toast(er.message, true) : renderAdmins(); } }, 'Cabut'))));
  }
  async function addAdmin() {
    const email = (prompt('Email admin baru (orang ini harus mendaftar dan mengonfirmasi email di halaman login ini):') || '').trim().toLowerCase();
    if (!email) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Email tidak valid.', true); return; }
    const { error } = await sb.from('admin_emails').insert({ email });
    error ? toast(error.code === '23505' ? 'Email sudah menjadi admin.' : error.message, true) : (toast('Admin ditambahkan.'), renderAdmins());
  }

  /* ---------- boot ---------- */
  (async () => {
    const { data } = await sb.auth.getSession();
    if (data.session) await afterLogin(data.session.user); else show('auth');
  })();
})();
