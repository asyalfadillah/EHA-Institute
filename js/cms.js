/* EHA Institute: content layer.
   Reads articles, team, partners, programs and site settings from Supabase (public read via RLS)
   and renders them into the page. If the database cannot be reached, the static HTML that shipped
   with the page, and window.EHA_FALLBACK, stay in place. main.js waits for window.EHA_READY. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement.dataset.root || '';
  const cfg = window.EHA_CONFIG || {};
  const CAT = { news: 'News', event: 'Event', publication: 'Publication' };
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fdate = d => { const [y, m, dd] = String(d).slice(0, 10).split('-'); return `${dd}.${m}.${y.slice(2)}`; };
  const short = (t, n = 92) => t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
  const safeUrl = u => /^(https?:|mailto:|tel:)/i.test(u || '') ? u : '';
  const img = a => {
    const c = a.cover || '';
    if (/^assets\/[\w./-]+$/.test(c)) return root + c;
    if (/^https:\/\//i.test(c)) return c;
    return root + 'assets/tile-01.jpg';
  };
  const hasPhoto = a => /^https:\/\//i.test(a.cover || '');
  // Local tiles ship as WebP in two widths; uploaded images are already WebP/JPEG from the admin.
  const SIZES = '(max-width: 700px) 92vw, (max-width: 1100px) 50vw, 33vw';
  const imgTag = src => { const m = /^assets\/tile-(\d+)\.jpg$/.exec(src || ''); return m ? `<img src="assets/tile-${m[1]}.webp" srcset="assets/tile-${m[1]}-640.webp 640w, assets/tile-${m[1]}.webp 1400w" sizes="${SIZES}" alt="" loading="lazy" decoding="async">` : `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`; };
  const cover = (a, extra = '') => {
    if (hasPhoto(a)) return `<figure class="media${extra}">${imgTag(a.cover)}</figure>`;
    const d = new Date((a.event_date || a.published_at) + 'T00:00:00');
    return `<figure class="media cover cover--${esc(a.category)}${extra}" aria-hidden="true"><span class="cover__in"><span class="cover__m">${MONTHS[d.getMonth()]} ${d.getFullYear()}</span><span class="cover__c">${esc(a.tag || CAT[a.category] || '')}</span></span></figure>`;
  };
  const aurl = slug => `${root}article.html?s=${encodeURIComponent(slug)}`;

  /* ---------- data ---------- */
  const rest = (table, query, ms = 2300) => {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    return fetch(`${cfg.url}/rest/v1/${table}?${query}`, { headers: { apikey: cfg.key, Authorization: 'Bearer ' + cfg.key }, signal: ctl.signal })
      .then(r => { if (!r.ok) throw new Error(table + ' ' + r.status); return r.json(); }).finally(() => clearTimeout(t));
  };
  async function load() {
    if (!cfg.url || !cfg.key) throw new Error('no config');
    const [articles, team, partners, programs, settings, publications] = await Promise.all([
      rest('articles', 'select=*&status=eq.published&order=published_at.desc,created_at.desc'),
      rest('team_members', 'select=*&published=eq.true&order=sort.asc,name.asc'),
      rest('partners', 'select=*&published=eq.true&order=sort.asc,name.asc'),
      rest('programs', 'select=*&published=eq.true&order=sort.asc,title.asc'),
      rest('site_settings', 'select=key,value'),
      rest('publications', 'select=*&published=eq.true&order=year.desc,sort.asc,title.asc')
    ]);
    return { articles, team, partners, programs, publications, settings: Object.fromEntries(settings.map(s => [s.key, s.value])), live: true };
  }

  /* ---------- templates (same markup as the static build) ---------- */
  const card = (a, d = 0, excerpt = false) => `<article class="card reveal" data-cat="${esc(a.category)}" style="--d:${d}s">
  <a href="${aurl(a.slug)}">${cover(a)}
  <div class="meta"><span>${CAT[a.category] || ''}</span><time datetime="${esc(a.published_at)}">${fdate(a.published_at)}</time></div>
  <h3 lang="${esc(a.lang)}"><span class="link-line">${esc(a.title)}</span></h3>${excerpt ? `<p class="card__ex" lang="${esc(a.lang)}">${esc(a.dek)}</p>` : ''}</a></article>`;

  const lead = a => `<article class="lead reveal reveal-left"><a href="${aurl(a.slug)}">
  ${cover(a)}
  <h3 lang="${esc(a.lang)}"><span class="link-line">${esc(a.title)}</span></h3><p lang="${esc(a.lang)}">${esc(a.dek)}</p>
  <div class="meta"><span>${CAT[a.category] || ''}</span><time datetime="${esc(a.published_at)}">${fdate(a.published_at)}</time></div></a></article>`;

  const briefSlide = (a, i) => `<article class="brief" data-slide ${i ? 'hidden' : ''}>
  ${cover(a)}
  <div><div class="meta"><span>${esc(a.tag || (a.category === 'news' ? 'News Brief' : CAT[a.category]))}</span><time datetime="${esc(a.published_at)}">${fdate(a.published_at)}</time></div>
  <h3 lang="${esc(a.lang)}">${esc(a.title)}</h3><p lang="${esc(a.lang)}">${esc(a.dek)}</p>
  <a class="btn" href="${aurl(a.slug)}">Read more <svg aria-hidden="true"><use href="#i-tri"/></svg></a></div></article>`;

  const eventSlide = (a, i) => {
    const d = new Date(a.event_date + 'T00:00:00');
    return `<article class="event" data-slide ${i ? 'hidden' : ''}>
  <div class="event__date" aria-hidden="true"><span>${MONTHS[d.getMonth()]}</span><b>${d.getDate()}</b></div>
  <div><div class="meta"><span>${esc(a.tag || 'Event')}</span></div>
  <h3 lang="${esc(a.lang)}"><a href="${aurl(a.slug)}">${esc(short(a.title, 90))}</a></h3><p lang="${esc(a.lang)}">${esc(short(a.dek, 190))}</p>
  <div class="meta meta--end"><time datetime="${esc(a.event_date)}">${fdate(a.event_date)}</time></div></div>
  <a href="${aurl(a.slug)}" tabindex="-1" aria-hidden="true">${cover(a)}</a></article>`;
  };

  const rows = (items, by) => `<ol class="rows">${items.map((p, i) => {
    const links = (p.related || []).filter(s => by[s]).map(s => `<li><a href="${aurl(s)}"><span class="link-line" lang="${esc(by[s].lang)}">${esc(short(by[s].title))}</span></a></li>`).join('');
    return `<li class="row reveal"><span class="row__n">${String(i + 1).padStart(2, '0')}</span><h3 class="row__t">${esc(p.title)}</h3>
  <div class="row__b"><p>${esc(p.body)}</p>${links ? `<p class="row__rel">Related</p><ul class="row__links">${links}</ul>` : ''}</div></li>`;
  }).join('')}</ol>`;

  const initials = n => { const w = n.split(',')[0].split(/\s+/).filter(x => /^[A-Za-z]/.test(x) && !/^(dr|drs|prof|ir)\.?$/i.test(x)); return (w.length > 1 ? [w[0], w[w.length - 1]] : w).map(x => x[0].toUpperCase()).join(''); };
  const person = (m, i) => `<li class="person reveal" tabindex="0" style="--d:${(i % 3) * 0.08}s"><div class="person__photo${m.photo ? ' has-photo' : ''}">${m.photo && /^https:\/\//.test(m.photo) ? `<img src="${esc(m.photo)}" alt="" loading="lazy">` : ''}</div>
<div class="person__cap"><h3>${esc(m.name)}</h3><p>${esc(m.role)}</p>${m.bio ? `<p class="person__bio">${esc(m.bio)}</p>` : ''}</div></li>`;

  const logoOf = p => (/^https:\/\//i.test(p.logo || '') ? p.logo : '');
  const partnerCard = (p, i) => `<li class="partner reveal" style="--d:${i * 0.06}s">${logoOf(p) ? `<img class="partner__logo" src="${esc(logoOf(p))}" alt="${esc(p.name)}" width="212" height="300" loading="lazy">` : ''}<h3>${esc(p.name)}</h3><p>${esc(p.country)}</p></li>`;

  const stats = D => {
    const countries = new Set(D.partners.map(p => p.country).filter(Boolean)).size;
    return [[D.team.length, 'Team members'], [D.partners.length, 'Partner institutions'], [countries, 'Countries'], [D.articles.length, 'Stories &amp; publications']]
      .map(([n, l]) => `<li class="stat reveal"><b data-count="${n}">${n}</b><span>${l}</span></li>`).join('');
  };

  /* lightweight article body: blank line = paragraph, "## " = subheading, "- " = list, **bold**, [text](https://…) */
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${u}" rel="noopener" target="_blank">${t}</a>`);
  const bodyHTML = text => String(text || '').split(/\n{2,}/).map(b => b.trim()).filter(Boolean).map(b => {
    if (/^## /.test(b)) return `<h3>${inline(b.slice(3))}</h3>`;
    if (/^- /m.test(b) && b.split('\n').every(l => /^- /.test(l))) return `<ul>${b.split('\n').map(l => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
  }).join('');

  /* ---------- page renderers ---------- */
  const setHTML = (el, html) => { if (el) el.innerHTML = html; };
  function render(D, again) {
    const by = Object.fromEntries(D.articles.map(a => [a.slug, a]));
    const arts = D.articles;

    // site settings
    const S = D.settings || {};
    $$('[data-set]').forEach(el => { const v = S[el.dataset.set]; if (!v) return; el.textContent = el.dataset.fmt === 'plus' ? '+' + v.replace(/\D/g, '') : v; });
    $$('[data-set-href]').forEach(el => {
      const v = S[el.dataset.setHref]; if (!v) return;
      const h = (el.dataset.hrefPrefix || '') + (el.dataset.setHref === 'phone' ? v.replace(/[^\d+]/g, '') : v);
      if (safeUrl(h)) el.setAttribute('href', h);
    });
    const f = $('form[data-set-action]'); if (f && S.email) f.setAttribute('action', 'mailto:' + S.email);
    window.EHA_SET = S;

    // latest (home + news)
    const lat = $('#latest .latest');
    if (lat && arts.length) {
      setHTML(lat, lead(arts[0]) + `<div class="latest__side">${arts.slice(1, 4).map((a, i) => card(a, (i + 1) * 0.08)).join('')}</div>`);
    }

    // news brief carousel (set up once; the carousel script owns it afterwards)
    const brief = $('[data-carousel="brief"]');
    if (brief && !again) {
      const b = arts.filter(a => a.in_brief);
      const ctr = $('.controls', brief);
      if (b.length) { $$('[data-slide]', brief).forEach(n => n.remove()); ctr.insertAdjacentHTML('beforebegin', b.map(briefSlide).join('')); }
      else $('#news-brief')?.remove();
    }

    // events
    const eb = again ? null : $('#events-slides');
    if (eb) {
      const ev = arts.filter(a => a.category === 'event' && a.event_date);
      const today = new Date().toISOString().slice(0, 10);
      const up = ev.filter(a => a.event_date >= today).sort((a, b) => a.event_date.localeCompare(b.event_date));
      const shown = (up.length ? up : ev.sort((a, b) => b.event_date.localeCompare(a.event_date))).slice(0, 6);
      if (!shown.length) $('#events')?.remove();
      else { eb.innerHTML = shown.map(eventSlide).join(''); $('#h-events').textContent = up.length ? 'Upcoming Events' : 'Recent Events'; }
    }

    // resources collage: covers of the newest stories (typographic unless a photo was uploaded)
    window.EHA_COVERS = arts.slice(0, 14).map(a => cover(a).replace('<figure class="media', '<figure class="cv').replace(' aria-hidden="true"', ''));

    // stats + partners
    $$('.stats').forEach(s => setHTML(s, stats(D)));
    const mq = $$('.marquee__track ul');
    if (mq.length && D.partners.length) {
      const li = D.partners.map(p => `<li><a href="${root}about.html#partners">${esc(p.name)}</a></li>`).join('');
      mq[0].innerHTML = li; if (mq[1]) mq[1].innerHTML = li.replace(/<a /g, '<a tabindex="-1" ');
    }
    const pg = $('.partners-grid'); if (pg && D.partners.length) setHTML(pg, D.partners.map(partnerCard).join(''));

    // people
    const pe = $('.people'); if (pe && D.team.length) setHTML(pe, D.team.map(person).join(''));
    const life = $('#life .newsgrid'); if (life) setHTML(life, arts.filter(a => a.category !== 'publication').slice(0, 3).map((a, i) => card(a, i * 0.06)).join(''));

    // research areas / services
    const areas = $('#areas'); if (areas) { const it = D.programs.filter(p => p.kind === 'research'); if (it.length) setHTML($('.rows', areas), rows(it, by).replace(/^<ol class="rows">|<\/ol>$/g, '')); }
    const sup = $('#support'); if (sup) { const it = D.programs.filter(p => p.kind === 'service'); if (it.length) setHTML($('.rows', sup), rows(it, by).replace(/^<ol class="rows">|<\/ol>$/g, '')); }

    // news grid
    const grid = $('#grid'); if (grid) setHTML(grid, arts.map(a => card(a, 0, true)).join(''));

    // article page
    if ($('#a-title')) renderArticle(arts);
    if ($('#pub-list')) pubs(D.publications || []);

    // search index
    const pages = [['Page', 'Home', 'index.html'], ['Page', 'Main Research Areas', 'research-areas.html'], ['Page', 'Consultation Services', 'consultation-services.html'],
      ['Page', 'Our People', 'our-people.html'], ['Page', 'Our Team', 'our-people.html#team'], ['Page', 'Life at EHA', 'our-people.html#life'], ['Page', 'News', 'news.html'],
      ['Page', 'About EHA Institute', 'about.html'], ['Page', 'Mission & Values', 'about.html#values'], ['Page', 'Partners & Collaborators', 'about.html#partners'],
      ['Page', 'Publications', 'publications.html'], ['Page', 'Webinar Series', 'news.html?cat=event']];
    window.EHA_INDEX = pages
      .concat(D.team.map(m => ['People', m.name + ', ' + m.role, 'our-people.html#team']))
      .concat(D.programs.map(p => [p.kind === 'research' ? 'Research' : 'Service', p.title, p.kind === 'research' ? 'research-areas.html' : 'consultation-services.html']))
      .concat(arts.map(a => [CAT[a.category], a.title, `article.html?s=${a.slug}`]))
      .concat((D.publications || []).map(x => ['Publication', x.title + (x.authors ? ' — ' + x.authors.split(';')[0].trim() + (x.authors.includes(';') ? ' et al.' : '') : ''), 'publications.html#pub-' + x.id]));
  }

  function renderArticle(arts) {
    const slug = new URLSearchParams(location.search).get('s');
    const a = arts.find(x => x.slug === slug);
    const h1 = $('#a-title');
    if (!a) {
      h1.textContent = 'Story not found';
      $('#a-body').innerHTML = '<p class="article__dek">This story may have been moved or unpublished. <a href="news.html">Browse all news</a>.</p>';
      $('#more')?.remove(); document.title = 'Story not found | EHA Institute'; return;
    }
    h1.textContent = a.title; h1.lang = a.lang;
    $('.crumbs [aria-current]').textContent = short(a.title, 48);
    $('#a-meta').innerHTML = `<span>${CAT[a.category]}</span><time datetime="${esc(a.published_at)}">${fdate(a.published_at)}</time>`;
    $('#a-body').lang = a.lang;
    $('#a-body').innerHTML = `<p class="article__dek">${esc(a.dek)}</p>${bodyHTML(a.body)}`;
    const facts = Array.isArray(a.facts) ? a.facts.filter(x => x && x.k) : [];
    const fa = $('#a-facts');
    if (facts.length) { $('dl', fa).innerHTML = facts.map(x => `<div><dt>${esc(x.k)}</dt><dd>${esc(x.v)}</dd></div>`).join(''); fa.hidden = false; }
    else $('#a-wrap').classList.add('article--solo');
    const others = arts.filter(x => x.slug !== a.slug);
    const same = others.filter(x => x.category === a.category).slice(0, 3);
    const more = same.concat(others.filter(x => !same.includes(x))).slice(0, 3);
    $('#a-more').innerHTML = more.map((x, i) => card(x, i * 0.06)).join('');
    document.title = `${short(a.title, 70)} | EHA Institute`;
    $('meta[name="description"]')?.setAttribute('content', a.dek.slice(0, 200));
  }

  window.EHA_READY = (async () => {
    let D;
    try { D = await Promise.race([load(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2500))]); }
    catch (err) {
      console.warn('EHA: Supabase unavailable, using bundled content.', err.message);
      D = window.EHA_FALLBACK ? { ...window.EHA_FALLBACK, live: false } : null;
    }
    if (D) { try { render(D); } catch (err) { console.error('EHA render', err); } }
    if (D && D.live) live(D);
  })();


  /* ---------- Publications page: list, filters, citations ---------- */
  const KIND = { journal: 'Journal article', conference: 'Conference paper', report: 'Report', book: 'Book', other: 'Other' };
  const PF = { q: '', kind: 'all', year: 'all', bound: false };
  const authorList = a => (a || '').split(';').map(x => x.trim()).filter(Boolean);
  const doiUrl = x => (x.doi ? 'https://doi.org/' + x.doi : '');
  const linkOf = x => doiUrl(x) || (/^https:\/\//i.test(x.url || '') ? x.url : '');
  const apa = x => {
    const a = authorList(x.authors), who = a.length > 1 ? a.slice(0, -1).join(', ') + ', & ' + a[a.length - 1] : a[0] || '';
    return `${who ? who + ' ' : ''}(${x.year}). ${x.title.replace(/[.?!]$/, '')}.${x.venue ? ' ' + x.venue + '.' : ''}${linkOf(x) ? ' ' + linkOf(x) : ''}`.replace(/\s+/g, ' ');
  };
  const bib = x => {
    const type = { journal: 'article', conference: 'inproceedings', report: 'techreport', book: 'book', other: 'misc' }[x.kind] || 'misc';
    const first = (authorList(x.authors)[0] || 'eha').split(',')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'eha';
    const key = first + x.year + (x.title.split(/\s+/).find(w => w.length > 3) || 'pub').toLowerCase().replace(/[^a-z0-9]/g, '');
    const f = [['title', x.title], ['author', authorList(x.authors).join(' and ')], ['year', x.year], [type === 'article' ? 'journal' : type === 'inproceedings' ? 'booktitle' : 'howpublished', x.venue], ['doi', x.doi], ['url', x.doi ? '' : /^https:\/\//i.test(x.url || '') ? x.url : '']].filter(r => r[1]);
    return `@${type}{${key},\n` + f.map(r => `  ${r[0]} = {${String(r[1]).replace(/[{}]/g, '')}}`).join(',\n') + '\n}';
  };
  function pubs(list) {
    const ul = $('#pub-list'); if (!ul) return;
    const sel = $('#pub-year'), have = [...new Set(list.map(x => x.year))].sort((a, b) => b - a);
    if (sel) { const cur = PF.year; sel.innerHTML = '<option value="all">All years</option>' + have.map(y => `<option value="${y}">${y}</option>`).join(''); sel.value = have.includes(+cur) ? cur : 'all'; PF.year = sel.value; }
    const draw = () => {
      const q = PF.q.trim().toLowerCase();
      const shown = list.filter(x => (PF.kind === 'all' || x.kind === PF.kind) && (PF.year === 'all' || String(x.year) === PF.year) && (!q || [x.title, x.authors, x.venue, x.year, x.doi].join(' ').toLowerCase().includes(q)));
      ul.innerHTML = shown.map((x, i) => {
        const link = linkOf(x);
        return `<li class="pub" id="pub-${esc(x.id)}" data-kind="${esc(x.kind)}">
  <div class="pub__meta"><span class="pub__kind">${esc(KIND[x.kind] || 'Other')}</span><span>${esc(x.year)}</span>${x.venue ? `<span class="pub__venue">${esc(x.venue)}</span>` : ''}</div>
  <h3 class="pub__title">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener"><span class="link-line">${esc(x.title)}</span></a>` : esc(x.title)}</h3>
  ${x.authors ? `<p class="pub__authors">${authorList(x.authors).map(esc).join('; ')}</p>` : ''}
  ${x.abstract ? `<details class="pub__abs"><summary>Abstract</summary><p>${esc(x.abstract)}</p></details>` : ''}
  <div class="pub__acts">
    ${x.doi ? `<a class="pub__btn" href="${esc(doiUrl(x))}" target="_blank" rel="noopener">DOI</a>` : ''}
    ${!x.doi && link ? `<a class="pub__btn" href="${esc(link)}" target="_blank" rel="noopener">Read</a>` : ''}
    <button type="button" class="pub__btn" data-cite="apa" data-i="${list.indexOf(x)}">Cite APA</button>
    <button type="button" class="pub__btn" data-cite="bib" data-i="${list.indexOf(x)}">BibTeX</button>
  </div></li>`;
      }).join('');
      const c = $('#pub-count'); if (c) c.textContent = list.length ? `${shown.length} of ${list.length} publication${list.length === 1 ? '' : 's'}` : '';
      const em = $('#pub-empty'); if (em) { em.hidden = shown.length > 0; em.textContent = list.length ? 'No publications match your search.' : 'Publications will be listed here soon.'; }
      if (location.hash.startsWith('#pub-')) { const t = document.getElementById(location.hash.slice(1)); if (t) t.classList.add('is-hit'); }
    };
    pubs.draw = draw;
    if (!PF.bound) {
      PF.bound = true;
      $('#pub-q').addEventListener('input', e => { PF.q = e.target.value; pubs.draw(); });
      sel && sel.addEventListener('change', () => { PF.year = sel.value; pubs.draw(); });
      $('#pub-kinds').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; PF.kind = b.dataset.kind; $$('#pub-kinds .chip').forEach(c => c.setAttribute('aria-pressed', String(c === b))); pubs.draw(); });
      ul.addEventListener('click', async e => {
        const b = e.target.closest('[data-cite]'); if (!b) return;
        const x = pubs.list[+b.dataset.i]; if (!x) return;
        const text = b.dataset.cite === 'bib' ? bib(x) : apa(x), old = b.dataset.l || b.textContent; b.dataset.l = old;
        try { await navigator.clipboard.writeText(text); } catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch {} t.remove(); }
        b.textContent = 'Copied \u2713'; clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = old; }, 1600);
      });
    }
    pubs.list = list; draw();
  }

  /* ---------- live updates: Supabase Realtime (websocket) + a light poll as a safety net ---------- */
  function live(first) {
    let sig = JSON.stringify(first), busy = false, timer = 0;
    const refresh = async () => {
      if (busy) return; busy = true;
      try {
        const D = await load(), n = JSON.stringify(D);
        if (n !== sig) { sig = n; render(D, true); $$('.reveal').forEach(el => el.classList.add('in')); }
      } catch (e) { /* keep what is on screen */ }
      busy = false;
    };
    const soon = () => { clearTimeout(timer); timer = setTimeout(refresh, 400); };
    // 1) Realtime: any insert / update / delete on the content tables
    const tables = ['articles', 'team_members', 'partners', 'programs', 'site_settings', 'publications'];
    let ws, beat, tries = 0;
    const open = () => {
      try { ws = new WebSocket(`${cfg.url.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${encodeURIComponent(cfg.key)}&vsn=1.0.0`); } catch { return; }
      ws.onopen = () => {
        tries = 0;
        ws.send(JSON.stringify({ topic: 'realtime:eha-live', event: 'phx_join', ref: '1', join_ref: '1', payload: { config: { broadcast: { ack: false, self: false }, presence: { key: '' }, postgres_changes: tables.map(table => ({ event: '*', schema: 'public', table })) }, access_token: cfg.key } }));
        beat = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(Date.now()) })), 25000);
      };
      ws.onmessage = ev => { try { const m = JSON.parse(ev.data); if (m.event === 'postgres_changes') soon(); } catch {} };
      ws.onclose = () => { clearInterval(beat); setTimeout(open, Math.min(30000, 1500 * 2 ** Math.min(tries++, 5))); };
      ws.onerror = () => { try { ws.close(); } catch {} };
    };
    open();
    // 2) Safety net: also catches rows that were just unpublished (Realtime cannot show those to visitors)
    setInterval(() => { if (!document.hidden) refresh(); }, 45000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }
})();
