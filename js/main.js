/* EHA Institute site: no dependencies */
(async () => {
  'use strict';
  /* a refresh always starts at the top (unless the URL has a #section) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) {
    const top = () => { if (!location.hash) scrollTo(0, 0); };
    top();
    addEventListener('load', top);
    addEventListener('pageshow', top);
    addEventListener('beforeunload', () => { if (!location.hash) scrollTo(0, 0); });
    setTimeout(top, 60); setTimeout(top, 300);
  }
  await (window.EHA_READY || Promise.resolve());
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement.dataset.root || '';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopHover = matchMedia('(hover: hover) and (min-width: 900px)');

  /* ---------- Header: solid after hero, hide on scroll down ---------- */
  const header = $('.site-header');
  const hero = $('.hero');
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const past = y > (hero ? hero.offsetHeight * 0.55 : 80);
    header.classList.toggle('is-solid', past);
    const menuOpen = $('.nav__item.is-open') || $('#nav.is-open');
    header.classList.toggle('is-hidden', past && y > lastY + 4 && !menuOpen);
    if (y < lastY - 4) header.classList.remove('is-hidden');
    lastY = y; ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Dropdown menus (desktop: hover or ONE click; mobile: tap toggles) ---------- */
  const items = $$('[data-menu]');
  const navItems = $$('.nav__item:not(.nav__item--search)');
  const ind = document.createElement('span'); ind.className = 'nav-ind'; ind.setAttribute('aria-hidden', 'true'); ($('.bar', header) || header).appendChild(ind);
  const wide = matchMedia('(min-width: 900px)');
  let hideT;
  const light = el => {
    clearTimeout(hideT);
    if (!wide.matches || !el) { header.classList.remove('is-light'); return; }
    const t = $('.nav__btn, .nav__link', el).getBoundingClientRect(), h = ($('.bar', header) || header).getBoundingClientRect();
    if (!header.classList.contains('is-light')) { ind.style.transition = 'none'; }
    ind.style.width = t.width + 'px'; ind.style.height = t.height + 'px';
    ind.style.setProperty('--x', (t.left - h.left) + 'px'); ind.style.setProperty('--y', (t.top - h.top) + 'px');
    header.classList.add('is-light');
    if (ind.style.transition === 'none') { ind.offsetWidth; ind.style.transition = ''; }
  };
  const sync = () => header.classList.toggle('has-menu', !!$('[data-menu].is-open') && wide.matches);
  const setOpen = (li, open) => {
    li.classList.toggle('is-open', open);
    $('.nav__btn', li).setAttribute('aria-expanded', String(open));
    sync();
  };
  const closeAll = (except) => items.forEach(li => li !== except && setOpen(li, false));
  const leaveAll = () => { closeAll(); header.classList.remove('is-light'); };
  items.forEach(li => {
    const btn = $('.nav__btn', li);
    btn.addEventListener('click', () => { const o = desktopHover.matches ? true : !li.classList.contains('is-open'); closeAll(li); setOpen(li, o); light(li); });
    li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget)) { setOpen(li, false); if (!header.matches(':hover')) header.classList.remove('is-light'); } });
  });
  navItems.forEach(li => li.addEventListener('mouseenter', () => {
    if (!desktopHover.matches) return;
    closeAll(li.hasAttribute('data-menu') ? li : null);
    if (li.hasAttribute('data-menu')) setOpen(li, true);
    light(li);
  }));
  header.addEventListener('mouseleave', () => { if (!desktopHover.matches) return; hideT = setTimeout(leaveAll, 140); });
  header.addEventListener('mouseenter', () => clearTimeout(hideT));
  $$('.brand, .util, .nav__item--search', header).forEach(el => el.addEventListener('mouseenter', () => { if (desktopHover.matches) leaveAll(); }));
  header.addEventListener('click', e => { if (e.target === header && desktopHover.matches) leaveAll(); });
  addEventListener('click', e => { if (!e.target.closest('[data-menu]')) { closeAll(); if (!e.target.closest('.site-header')) header.classList.remove('is-light'); } });
  addEventListener('scroll', () => { if (desktopHover.matches && $('[data-menu].is-open') && !header.matches(':hover')) leaveAll(); }, { passive: true });
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    leaveAll(); closeNav(); closeSearch();
  });

  /* ---------- Back to top: floating button, logo on the same page, footer link ---------- */
  const smoothTop = () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const toTop = document.createElement('button');
  toTop.className = 'to-top'; toTop.type = 'button'; toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M4 9.5L10 4l6 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  toTop.addEventListener('click', () => { smoothTop(); });
  document.body.appendChild(toTop);
  const showTop = () => toTop.classList.toggle('is-on', scrollY > 700);
  addEventListener('scroll', showTop, { passive: true }); showTop();
  const norm = p => p.replace(/index\.html$/, '').replace(/\/$/, '');
  const brand = $('.brand');
  if (brand) brand.addEventListener('click', e => {
    const u = new URL(brand.href, location.href);
    if (norm(u.pathname) === norm(location.pathname)) { e.preventDefault(); smoothTop(); closeNav(); }
  });
  $$('a[href="#top"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); smoothTop(); }));

  /* ---------- Mobile nav ---------- */
  const burger = $('#burger'), nav = $('#nav');
  function closeNav() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); document.body.style.overflow = ''; }
  burger.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    header.classList.toggle('is-solid', open || scrollY > 80);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', closeNav));
  /* resizing past the breakpoint with the mobile sheet open must not leave the page locked */
  addEventListener('resize', () => { if (wide.matches) { closeNav(); } else { leaveAll(); } });

  /* ---------- Hero video (home only) ---------- */
  const video = $('#hero-video');
  if (video) {
    if (reduceMotion) { video.removeAttribute('autoplay'); video.pause(); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { if (e.isIntersecting) video.play().catch(() => {}); else video.pause(); }, { threshold: 0.05 }).observe(hero);
    }
  }

  /* ---------- Story dialog (home only) ---------- */
  const dlg = $('#story'), sv = $('#story-video'), openStory = $('#open-story');
  if (dlg && sv && openStory) {
    openStory.addEventListener('click', () => { dlg.showModal(); sv.currentTime = 0; sv.play().catch(() => {}); });
    const closeStory = () => { sv.pause(); dlg.close(); };
    $('#close-story').addEventListener('click', closeStory);
    dlg.addEventListener('click', e => { if (e.target === dlg) closeStory(); });
    dlg.addEventListener('close', () => sv.pause());
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('in'));

  /* ---------- Carousels ---------- */
  $$('[data-carousel]').forEach(rootEl => {
    const slides = $$('[data-slide]', rootEl);
    let i = 0;
    const go = dir => {
      if (slides.length < 2) return;
      slides[i].hidden = true; slides[i].classList.remove('is-in', 'back');
      i = (i + dir + slides.length) % slides.length;
      const s = slides[i]; s.hidden = false;
      s.classList.remove('is-in', 'back'); void s.offsetWidth;
      s.classList.add('is-in'); if (dir < 0) s.classList.add('back');
    };
    $('[data-next]', rootEl).addEventListener('click', () => go(1));
    $('[data-prev]', rootEl).addEventListener('click', () => go(-1));
    rootEl.addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    if (slides.length < 2) $$('.arrow-btn', rootEl).forEach(b => b.disabled = true);
  });

  /* ---------- Resources collage (home) ---------- */
  const tiles = $$('#collage > span');
  const covers = window.EHA_COVERS || [];
  if (tiles.length && covers.length) {
    let off = 0;
    const paint = animate => tiles.forEach((t, k) => {
      const html = covers[((k + off) % covers.length + covers.length) % covers.length];
      if (!animate) { t.innerHTML = html; return; }
      setTimeout(() => { t.classList.add('swap'); setTimeout(() => { t.innerHTML = html; t.classList.remove('swap'); }, 260); }, k * 70);
    });
    paint(false);
    $('#collage-next').addEventListener('click', () => { off += 1; paint(true); });
    $('#collage-prev').addEventListener('click', () => { off -= 1; paint(true); });
  }

  /* ---------- News filter ---------- */
  const grid = $('#grid');
  if (grid) {
    const chips = $$('.chip'), cards = $$('.card', grid), empty = $('#grid-empty');
    const apply = (f, push) => {
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
      let n = 0;
      cards.forEach(c => { const show = f === 'all' || c.dataset.cat === f; c.hidden = !show; if (show) { n++; c.classList.add('in'); } });
      empty.hidden = n > 0;
      if (push) { const u = new URL(location.href); f === 'all' ? u.searchParams.delete('cat') : u.searchParams.set('cat', f); history.replaceState(null, '', u); }
    };
    chips.forEach(c => c.addEventListener('click', () => apply(c.dataset.filter, true)));
    const initial = new URLSearchParams(location.search).get('cat');
    if (initial && chips.some(c => c.dataset.filter === initial)) {
      apply(initial, false);
      if (hero && location.hash !== '#latest') setTimeout(() => $('#all').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }), 150);
    }
  }

  /* ---------- Contact form (opens the visitor's mail app until a form service is connected) ---------- */
  const cf = $('#contact-form');
  if (cf) cf.addEventListener('submit', e => {
    e.preventDefault();
    const note = $('#f-note');
    const name = $('#f-name').value.trim(), email = $('#f-email').value.trim(), msg = $('#f-msg').value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !msg) { note.textContent = 'Please fill in your name, a valid email and a message.'; return; }
    location.href = 'mailto:' + ((window.EHA_SET || {}).email || 'mail@ehainstitute.org') + '?subject=' + encodeURIComponent('Consultation request from ' + name) + '&body=' + encodeURIComponent(msg + '\n\n' + name + '\n' + email);
    note.textContent = 'Opening your email app to send the message…';
  });

  /* ---------- Search: command-palette style, recommendations when empty ---------- */
  const index = window.EHA_INDEX || [];
  const sBox = $('#search');
  const ICON = {
    search: '<path d="M15.5 15.5L21 21"/><circle cx="10.5" cy="10.5" r="6.5"/>',
    news: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 10h8M8 14h8M8 17h5"/>',
    event: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    publication: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
    people: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    research: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 15h9"/>',
    service: '<path d="M4 7h16v11H4zM9 7V5h6v2M4 12h16"/>',
    page: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  const svg = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ICON.page}</svg>`;
  const kind = c => ({ News: 'news', Event: 'event', Publication: 'publication', People: 'people', Research: 'research', Service: 'service' }[c] || 'page');
  const ORDER = ['Research', 'Service', 'People', 'News', 'Event', 'Publication', 'Page'];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hl = (text, words) => {
    if (!words.length) return esc(text);
    const re = new RegExp(words.map(reEsc).join('|'), 'gi'); let out = '', last = 0, m;
    while ((m = re.exec(text))) { if (!m[0]) { re.lastIndex++; continue; } out += esc(text.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>'; last = m.index + m[0].length; }
    return out + esc(text.slice(last));
  };
  const store = { get() { try { return JSON.parse(localStorage.getItem('eha_recent') || '[]'); } catch { return []; } }, set(v) { try { localStorage.setItem('eha_recent', JSON.stringify(v)); } catch { /* private mode */ } } };

  sBox.innerHTML = `
    <div class="search__scrim" data-close></div>
    <div class="search__panel">
      <div class="sx-field">
        <span class="sx-lead">${svg('search')}</span>
        <label class="sr-only" for="q">Search EHA Institute</label>
        <input id="q" type="text" role="combobox" aria-expanded="true" aria-controls="results" aria-autocomplete="list" placeholder="Search news, programs, people" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">
        <button type="button" class="sx-clear" id="sx-clear" aria-label="Clear search" hidden>${svg('x')}</button>
        <button type="button" class="search__close" id="close-search" aria-label="Close search"><span>Esc</span>${svg('x')}</button>
      </div>
      <div class="sx-body" id="results" role="listbox" aria-label="Search results"></div>
      <div class="sx-foot" aria-hidden="true"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> move</span><span><kbd>&crarr;</kbd> open</span><span><kbd>esc</kbd> close</span><span class="sx-count" id="sx-count"></span></div>
    </div>`;
  const q = $('#q'), out = $('#results'), count = $('#sx-count'), clearBtn = $('#sx-clear');
  let lastFocus, active = -1;

  const item = (r, words, i, id) => `<a class="sx-item" role="option" id="sx-${id}" aria-selected="false" style="--i:${i}" href="${root + r[2]}" data-q="${esc(words.join(' '))}"><span class="sx-ico">${svg(kind(r[0]))}</span><span class="sx-tx"><span class="sx-t">${hl(r[1], words)}</span><span class="sx-s">${esc(r[0])}</span></span><span class="sx-go">${svg('page')}</span></a>`;
  const score = (r, words) => {
    const t = r[1].toLowerCase(), hay = t + ' ' + r[0].toLowerCase(); let sc = 0;
    for (const w of words) { if (!hay.includes(w)) return -1; sc += t.startsWith(w) ? 4 : t.includes(' ' + w) ? 3 : t.includes(w) ? 2 : 1; }
    return sc;
  };
  const chip = (label, icon) => `<button type="button" class="sx-chip" data-fill="${esc(label)}">${icon ? svg(icon) : ''}${esc(label)}</button>`;

  function home() {
    const arts = index.filter(r => r[2].startsWith('article.html')).slice(0, 3);
    const quick = [['Main research areas', 'Where our research is active', 'research-areas.html', 'research'], ['Consultation services', 'Design, writing, data and AI support', 'consultation-services.html', 'service'], ['Our team', 'Researchers and practitioners', 'our-people.html#team', 'people'], ['Publications', 'Papers and open research', 'news.html?cat=publication', 'publication']];
    const recent = store.get();
    let n = 0, h = '';
    if (recent.length) h += `<p class="sx-h">Recent <button type="button" class="sx-clearall" data-clear-recent>Clear</button></p><div class="sx-chips">${recent.map(x => chip(x, 'clock')).join('')}</div>`;
    h += `<p class="sx-h">Try searching</p><div class="sx-chips">${['Research', 'Webinar', 'Team', 'Publication', 'Collaborators', 'Mercury'].map(x => chip(x)).join('')}</div>`;
    h += `<p class="sx-h">Quick links</p><div class="sx-tiles">${quick.map(x => `<a class="sx-item sx-tile" role="option" id="sx-${n}" aria-selected="false" style="--i:${n++}" href="${root + x[2]}"><span class="sx-ico">${svg(x[3])}</span><span class="sx-tx"><span class="sx-t">${x[0]}</span><span class="sx-s">${x[1]}</span></span></a>`).join('')}</div>`;
    if (arts.length) h += `<p class="sx-h">Latest stories</p>${arts.map(r => item(r, [], n, n++)).join('')}`;
    count.textContent = '';
    return h;
  }
  function results(v) {
    const words = v.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = index.map(r => [r, score(r, words)]).filter(x => x[1] >= 0).sort((a, b) => b[1] - a[1]).slice(0, 24).map(x => x[0]);
    count.textContent = hits.length ? hits.length + (hits.length === 1 ? ' result' : ' results') : '';
    if (!hits.length) return `<div class="sx-empty"><span class="sx-ico sx-ico--lg">${svg('search')}</span><p><b>Nothing found for &ldquo;${esc(v)}&rdquo;</b></p><p>Check the spelling or try one of these.</p><div class="sx-chips sx-chips--c">${['Research', 'Webinar', 'Team', 'Publication'].map(x => chip(x)).join('')}</div></div>`;
    let n = 0, h = '';
    ORDER.forEach(c => {
      const g = hits.filter(r => (['News', 'Event', 'Publication', 'People', 'Research', 'Service'].includes(r[0]) ? r[0] : 'Page') === c);
      if (g.length) h += `<p class="sx-h">${c === 'Page' ? 'Pages' : c === 'People' ? 'People' : c === 'Service' ? 'Services' : c}</p>` + g.map(r => item(r, words, n, n++)).join('');
    });
    return h;
  }
  const opts = () => $$('.sx-item', out);
  function setActive(i) {
    const list = opts(); if (!list.length) { active = -1; q.removeAttribute('aria-activedescendant'); return; }
    active = (i + list.length) % list.length;
    list.forEach((a, k) => a.setAttribute('aria-selected', String(k === active)));
    q.setAttribute('aria-activedescendant', list[active].id);
    list[active].scrollIntoView({ block: 'nearest' });
  }
  const render = () => {
    const v = q.value.trim();
    clearBtn.hidden = !q.value;
    out.innerHTML = v ? results(v) : home();
    active = -1; q.removeAttribute('aria-activedescendant');
    if (v) setActive(0);
  };
  function remember() { const v = q.value.trim(); if (v.length > 1) store.set([v, ...store.get().filter(x => x.toLowerCase() !== v.toLowerCase())].slice(0, 5)); }
  function openSearch() {
    if (sBox.classList.contains('is-open')) return;
    lastFocus = document.activeElement; closeNav(); leaveAll();
    sBox.classList.add('is-open'); document.body.style.overflow = 'hidden'; q.value = ''; render(); setTimeout(() => q.focus(), 60);
  }
  function closeSearch() { if (!sBox.classList.contains('is-open')) return; sBox.classList.remove('is-open'); document.body.style.overflow = ''; lastFocus && lastFocus.focus && lastFocus.focus(); }
  $('#open-search').addEventListener('click', openSearch);
  $('#close-search').addEventListener('click', closeSearch);
  sBox.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return closeSearch();
    const c = e.target.closest('[data-fill]'); if (c) { q.value = c.dataset.fill; render(); q.focus(); return; }
    if (e.target.closest('[data-clear-recent]')) { store.set([]); render(); return; }
    if (e.target.closest('a.sx-item')) { remember(); closeSearch(); }
  });
  clearBtn.addEventListener('click', () => { q.value = ''; render(); q.focus(); });
  q.addEventListener('input', render);
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { const a = opts()[active]; if (a) { e.preventDefault(); remember(); a.click(); } }
  });
  /* "/" or Ctrl/Cmd+K opens search from anywhere */
  addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); openSearch(); }
  });

  /* ---------- Newsletter (opens the visitor's mail app until a mailing list is connected) ---------- */
  const form = $('#sub'), note = $('#sub-note');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#sub-email').value.trim();
    if (!email) return;
    location.href = 'mailto:' + ((window.EHA_SET || {}).email || 'mail@ehainstitute.org') + '?subject=' + encodeURIComponent('Subscribe to EHA Institute news') + '&body=' + encodeURIComponent('Please add this address to the newsletter: ' + email);
    note.textContent = 'Opening your email app to send the request…';
  });

  /* ---------- Hero headline: words slide up out of a mask ---------- */
  const h1 = $('.hero h1');
  if (h1 && !reduceMotion) {
    const text = h1.textContent.trim();
    h1.setAttribute('aria-label', text);
    h1.innerHTML = text.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
    h1.classList.add('is-split');
  }

  /* ---------- Staggered entrance inside grids ---------- */
  $$('.newsgrid, .people, .values, .partners-grid, .pillars, .featured, .stats').forEach(g =>
    [...g.children].forEach((c, i) => c.style.setProperty('--d', (i % 4) * 0.09 + 's')));

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    const run = el => {
      const end = +el.dataset.count, t0 = performance.now(), dur = 1600;
      const tick = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } }), { threshold: 0.6 });
    counters.forEach(c => { c.textContent = '0'; cio.observe(c); });
  }
})();
