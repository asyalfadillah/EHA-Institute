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
  const cover = (a, extra = '') => {
    if (hasPhoto(a)) return `<figure class="media${extra}"><img src="${esc(a.cover)}" alt="" loading="lazy"></figure>`;
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
    const [articles, team, partners, programs, settings] = await Promise.all([
      rest('articles', 'select=*&status=eq.published&order=published_at.desc,created_at.desc'),
      rest('team_members', 'select=*&published=eq.true&order=sort.asc,name.asc'),
      rest('partners', 'select=*&published=eq.true&order=sort.asc,name.asc'),
      rest('programs', 'select=*&published=eq.true&order=sort.asc,title.asc'),
      rest('site_settings', 'select=key,value')
    ]);
    return { articles, team, partners, programs, settings: Object.fromEntries(settings.map(s => [s.key, s.value])), live: true };
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

  const partnerCard = (p, i) => `<li class="partner reveal" style="--d:${i * 0.06}s"><h3>${esc(p.name)}</h3><p>${esc(p.country)}</p></li>`;

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
  function render(D) {
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

    // news brief carousel
    const brief = $('[data-carousel="brief"]');
    if (brief) {
      const b = arts.filter(a => a.in_brief);
      const ctr = $('.controls', brief);
      if (b.length) { $$('[data-slide]', brief).forEach(n => n.remove()); ctr.insertAdjacentHTML('beforebegin', b.map(briefSlide).join('')); }
      else $('#news-brief')?.remove();
    }

    // events
    const eb = $('#events-slides');
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

    // search index
    const pages = [['Page', 'Home', 'index.html'], ['Page', 'Main Research Areas', 'research-areas.html'], ['Page', 'Consultation Services', 'consultation-services.html'],
      ['Page', 'Our People', 'our-people.html'], ['Page', 'Our Team', 'our-people.html#team'], ['Page', 'Life at EHA', 'our-people.html#life'], ['Page', 'News', 'news.html'],
      ['Page', 'About EHA Institute', 'about.html'], ['Page', 'Mission & Values', 'about.html#values'], ['Page', 'Partners & Collaborators', 'about.html#partners'],
      ['Page', 'Publications', 'news.html?cat=publication'], ['Page', 'Webinar Series', 'news.html?cat=event']];
    window.EHA_INDEX = pages
      .concat(D.team.map(m => ['People', m.name + ', ' + m.role, 'our-people.html#team']))
      .concat(D.programs.map(p => [p.kind === 'research' ? 'Research' : 'Service', p.title, p.kind === 'research' ? 'research-areas.html' : 'consultation-services.html']))
      .concat(arts.map(a => [CAT[a.category], a.title, `article.html?s=${a.slug}`]));
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
  })();
})();
