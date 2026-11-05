/* UsedBook.com — book engine: Open Library search, book detail, marketplace deep links */
(function () {
  'use strict';
  var D = document, W = window, OL = 'https://openlibrary.org';
  var FIELDS = 'key,title,author_name,first_publish_year,cover_i,isbn,edition_count,subject,publisher,number_of_pages_median';
  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function json(id) { try { return JSON.parse(D.getElementById(id).textContent); } catch (e) { return null; } }
  var MK = json('mk-data') || { buy: [], sell: [] };
  var CFG = json('ub-config') || {};

  /* ISBN utilities */
  function clean(s) { return String(s || '').replace(/[^0-9Xx]/g, '').toUpperCase(); }
  function valid10(c) { if (!/^\d{9}[\dX]$/.test(c)) return false; var s = 0; for (var i = 0; i < 10; i++) s += (c[i] === 'X' ? 10 : +c[i]) * (10 - i); return s % 11 === 0; }
  function valid13(c) { if (!/^\d{13}$/.test(c)) return false; var s = 0; for (var i = 0; i < 13; i++) s += (+c[i]) * (i % 2 ? 3 : 1); return s % 10 === 0; }
  function isISBN(s) { var c = clean(s); return (c.length === 10 && valid10(c)) || (c.length === 13 && valid13(c)); }
  function check13(b) { var s = 0; for (var i = 0; i < 12; i++) s += (+b[i]) * (i % 2 ? 3 : 1); return String((10 - s % 10) % 10); }
  function check10(b) { var s = 0; for (var i = 0; i < 9; i++) s += (+b[i]) * (10 - i); var k = (11 - s % 11) % 11; return k === 10 ? 'X' : String(k); }
  function to13(c) { c = clean(c); if (c.length === 13) return c; if (c.length !== 10) return ''; var b = '978' + c.slice(0, 9); return b + check13(b); }
  function to10(c) { c = clean(c); if (c.length === 10) return c; if (c.length !== 13 || c.slice(0, 3) !== '978') return ''; var b = c.slice(3, 12); return b + check10(b); }
  W.UBISBN = { clean: clean, valid10: valid10, valid13: valid13, isISBN: isISBN, to13: to13, to10: to10, check10: check10, check13: check13 };

  /* Marketplace links */
  function fill(t, v) { return t.replace('{q}', encodeURIComponent(v.q || '')).replace('{isbn}', encodeURIComponent(v.isbn || '')); }
  function affiliate(u) {
    if (CFG.amazon_tag && /amazon\./.test(u)) u += (u.indexOf('?') > -1 ? '&' : '?') + 'tag=' + encodeURIComponent(CFG.amazon_tag);
    if (CFG.ebay_campid && /ebay\./.test(u)) u += (u.indexOf('?') > -1 ? '&' : '?') + 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=' + encodeURIComponent(CFG.ebay_campid) + '&toolid=10001&mkevt=1';
    return u;
  }
  function linkFor(m, v) {
    var u = (v.isbn && m.isbn) ? fill(m.isbn, v) : ((v.q && m.q) ? fill(m.q, v) : m.home);
    return affiliate(u);
  }
  function renderList(el, list, v, kind) {
    if (!el || !list) return;
    el.innerHTML = list.map(function (m) {
      var deep = (v.isbn && m.isbn) || (v.q && m.q);
      var label = kind === 'sell' ? (deep ? 'Check offer' : 'Open site') : 'Search';
      return '<li><span><span class="mk-name">' + esc(m.name) + '</span><span class="mk-note">' + esc(m.note) + (kind === 'sell' && !deep ? ' — paste your ISBN there' : '') + '</span></span>' +
        '<a class="btn btn-sm ' + (kind === 'sell' ? 'btn-accent' : 'btn-primary') + '" href="' + esc(linkFor(m, v)) + '" target="_blank" rel="noopener nofollow">' + label + ' &#8599;</a></li>';
    }).join('');
  }
  W.UBLinks = { render: renderList };

  /* Open Library helpers */
  function getJSON(u) { return fetch(u, { headers: { 'Accept': 'application/json' } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function olSearch(q, limit) {
    var u = isISBN(q) ? OL + '/search.json?isbn=' + clean(q) : OL + '/search.json?q=' + encodeURIComponent(q);
    return getJSON(u + '&limit=' + (limit || 24) + '&fields=' + FIELDS);
  }
  function coverURL(d, size) {
    if (d.cover_i) return 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-' + (size || 'M') + '.jpg';
    if (d.isbn13) return 'https://covers.openlibrary.org/b/isbn/' + d.isbn13 + '-' + (size || 'M') + '.jpg?default=false';
    return '';
  }
  function bookHref(d) {
    var p = [], w = String(d.key || '').replace('/works/', '');
    if (w) p.push('work=' + encodeURIComponent(w));
    if (d.title) p.push('t=' + encodeURIComponent(d.title));
    if (d.author_name && d.author_name[0]) p.push('a=' + encodeURIComponent(d.author_name[0]));
    if (d.first_publish_year) p.push('y=' + d.first_publish_year);
    if (d.cover_i) p.push('c=' + d.cover_i);
    return '/book/?' + p.join('&');
  }
  function card(d) {
    var c = coverURL(d, 'M'), a = (d.author_name || []).slice(0, 2).join(', ');
    return '<a class="book-card" href="' + esc(bookHref(d)) + '"><div class="cover"><div class="cover-ph">' + esc(d.title) + '</div>' +
      (c ? '<img src="' + esc(c) + '" alt="Cover of ' + esc(d.title) + '" loading="lazy" onerror="this.remove()">' : '') +
      '</div><div class="bc-body"><h3>' + esc(d.title) + '</h3><p>' + esc(a || 'Unknown author') + (d.first_publish_year ? ' &middot; ' + d.first_publish_year : '') + '</p></div></a>';
  }
  function skeletons(n) { var s = ''; for (var i = 0; i < n; i++) s += '<div class="skeleton"></div>'; return s; }
  W.UBBooks = { card: card, search: olSearch };

  /* ---------- Search results page ---------- */
  var res = $('#results');
  if (res) {
    var sp = new URLSearchParams(location.search), q = (sp.get('q') || '').trim(), qi = $('#q');
    if (qi) qi.value = q;
    if (!q) res.innerHTML = '<div class="empty">Type a title, author or ISBN above to search millions of books.</div>';
    else {
      var h = $('#res-h'); if (h) h.textContent = 'Results for “' + q + '”';
      D.title = '“' + q + '” — used book search | UsedBook.com';
      res.innerHTML = skeletons(8);
      renderList($('#quick-buy'), MK.buy.slice(0, 6), { q: q, isbn: isISBN(q) ? clean(q) : '' }, 'buy');
      olSearch(q, 24).then(function (j) {
        var docs = j.docs || [], cnt = $('#res-count');
        if (cnt) cnt.textContent = (j.numFound || docs.length).toLocaleString() + ' matching works';
        res.innerHTML = docs.length ? docs.map(card).join('') : '<div class="empty">No matches. Try fewer words, check the spelling, or search by ISBN.</div>';
      }).catch(function () {
        res.innerHTML = '<div class="empty">Book data is temporarily unavailable. You can still <a href="/compare/?q=' + encodeURIComponent(q) + '">compare prices for “' + esc(q) + '”</a> directly.</div>';
      });
    }
  }

  /* ---------- Book detail page ---------- */
  var bk = $('#book');
  if (bk) {
    var p = new URLSearchParams(location.search);
    var st = {
      isbn: clean(p.get('isbn') || ''), work: (p.get('work') || '').replace(/[^A-Za-z0-9]/g, ''),
      title: (p.get('t') || p.get('q') || '').trim(), author: (p.get('a') || '').trim(),
      year: (p.get('y') || '').replace(/\D/g, ''), cover: (p.get('c') || '').replace(/\D/g, ''), match: 'any'
    };
    if (st.isbn && !isISBN(st.isbn)) st.isbn = '';
    if (st.isbn) st.match = 'isbn';

    var vals = function () {
      var tq = (st.title + ' ' + st.author).trim();
      return (st.match === 'isbn' && st.isbn) ? { q: st.isbn, isbn: st.isbn } : { q: tq || st.isbn, isbn: '' };
    };
    var paint = function () {
      renderList($('#buy-list'), MK.buy, vals(), 'buy');
      renderList($('#sell-list'), MK.sell, { q: st.isbn || (st.title + ' ' + st.author).trim(), isbn: st.isbn }, 'sell');
      var t = $('#bk-title'); if (t) t.textContent = st.title || (st.isbn ? 'ISBN ' + st.isbn : 'Book details');
      var a = $('#bk-author'); if (a) a.textContent = st.author ? 'by ' + st.author : '';
      var cv = $('#bk-cover');
      if (cv) {
        var src = st.cover ? 'https://covers.openlibrary.org/b/id/' + st.cover + '-L.jpg' : (st.isbn ? 'https://covers.openlibrary.org/b/isbn/' + st.isbn + '-L.jpg?default=false' : '');
        cv.innerHTML = '<div class="cover-ph">' + esc(st.title || 'No cover') + '</div>' + (src ? '<img src="' + esc(src) + '" alt="Cover of ' + esc(st.title) + '" onerror="this.remove()">' : '');
      }
      var vl = $('#value-link'); if (vl) vl.href = '/tools/book-value/?t=' + encodeURIComponent(st.title || st.isbn) + (st.year ? '&y=' + st.year : '');
      var ol = $('#ol-link'); if (ol) ol.href = st.work ? OL + '/works/' + st.work : OL + '/search?q=' + encodeURIComponent(st.isbn || st.title);
      var ci = $('#copy-isbn'); if (ci) { ci.hidden = !st.isbn; ci.setAttribute('data-copy', st.isbn); ci.textContent = 'Copy ISBN ' + st.isbn; }
      var mi = $('#match-isbn'); if (mi) { mi.disabled = !st.isbn; mi.checked = st.match === 'isbn'; }
      var ma = $('#match-any'); if (ma) ma.checked = st.match !== 'isbn';
      if (st.title) {
        D.title = st.title + (st.author ? ' by ' + st.author : '') + ' — used prices, value & where to sell | UsedBook.com';
        var md = $('meta[name=description]'); if (md) md.setAttribute('content', 'Compare used prices for ' + st.title + (st.author ? ' by ' + st.author : '') + ' across 13 marketplaces, see where to sell it and estimate what it is worth.');
      }
    };
    $$('input[name=match]').forEach(function (r) { r.addEventListener('change', function () { st.match = r.value; paint(); }); });
    var kv = function (k, v) { return v ? '<dt>' + esc(k) + '</dt><dd>' + v + '</dd>' : ''; };
    var facts = function (d) {
      var el = $('#bk-facts'); if (!el) return;
      el.innerHTML = kv('First published', esc(d.first_publish_year || st.year)) + kv('Editions', d.edition_count ? esc(d.edition_count) : '') +
        kv('Typical length', d.number_of_pages_median ? esc(d.number_of_pages_median) + ' pages' : '') +
        kv('Publishers', esc((d.publisher || []).slice(0, 3).join(', '))) + kv('ISBN', st.isbn ? esc(st.isbn) + (to10(st.isbn) && st.isbn.length === 13 ? ' &middot; ISBN-10 ' + esc(to10(st.isbn)) : '') : '');
      var sb = $('#bk-subjects');
      if (sb && d.subject && d.subject.length) sb.innerHTML = d.subject.slice(0, 10).map(function (s) { return '<a class="chip" href="/search/?q=' + encodeURIComponent(s) + '">' + esc(s) + '</a>'; }).join('');
    };
    var describe = function () {
      if (!st.work) return;
      getJSON(OL + '/works/' + st.work + '.json').then(function (w) {
        var d = w.description ? (typeof w.description === 'string' ? w.description : w.description.value) : '';
        d = String(d || '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\r/g, '').split(/\n-{3,}|\n\n\(/)[0];
        var el = $('#bk-desc'); if (el && d) { el.textContent = d.length > 900 ? d.slice(0, 900).replace(/\s+\S*$/, '') + '…' : d; el.hidden = false; }
        if (!st.title && w.title) { st.title = w.title; paint(); }
        if (!st.cover && w.covers && w.covers[0] > 0) { st.cover = String(w.covers[0]); paint(); }
      }).catch(function () {});
      getJSON(OL + '/works/' + st.work + '/editions.json?limit=40').then(function (j) {
        var rows = (j.entries || []).filter(function (e) { return (e.isbn_13 && e.isbn_13[0]) || (e.isbn_10 && e.isbn_10[0]); }).slice(0, 10);
        var tb = $('#bk-editions'); if (!tb || !rows.length) return;
        tb.innerHTML = rows.map(function (e) {
          var i = clean((e.isbn_13 && e.isbn_13[0]) || to13((e.isbn_10 || [])[0]) || (e.isbn_10 || [])[0]);
          return '<tr><td>' + esc(e.publish_date || '—') + '</td><td>' + esc((e.publishers || []).join(', ') || '—') + '</td><td>' + esc(e.physical_format || '—') + '</td><td><button type="button" class="chip" data-use-isbn="' + esc(i) + '">' + esc(i) + '</button></td></tr>';
        }).join('');
        $('#editions-wrap').hidden = false;
      }).catch(function () {});
    };
    D.addEventListener('click', function (e) {
      var b = e.target.closest('[data-use-isbn]'); if (!b) return;
      st.isbn = b.getAttribute('data-use-isbn'); st.match = 'isbn'; paint();
      var t = $('#where'); if (t) t.scrollIntoView({ behavior: 'smooth' });
      if (W.UB && UB.toast) UB.toast('Now matching ISBN ' + st.isbn);
    });
    paint();
    var lookup = st.isbn ? olSearch(st.isbn, 1) : (st.work ? getJSON(OL + '/search.json?q=' + encodeURIComponent(st.title || '') + (st.author ? '&author=' + encodeURIComponent(st.author) : '') + '&limit=5&fields=' + FIELDS) : (st.title ? olSearch(st.title, 1) : Promise.resolve({ docs: [] })));
    lookup.then(function (j) {
      var docs = j.docs || [], d = docs[0] || {};
      if (st.work) { for (var i = 0; i < docs.length; i++) if (String(docs[i].key).indexOf(st.work) > -1) { d = docs[i]; break; } }
      if (d.key && !st.work) st.work = String(d.key).replace('/works/', '');
      if (d.title && !st.title) st.title = d.title;
      if (d.author_name && !st.author) st.author = d.author_name[0];
      if (d.first_publish_year && !st.year) st.year = String(d.first_publish_year);
      if (d.cover_i && !st.cover) st.cover = String(d.cover_i);
      paint(); facts(d); describe();
      if (!d.title && !st.title) { var n = $('#bk-note'); if (n) n.hidden = false; }
    }).catch(function () { facts({}); describe(); });
  }

  /* ---------- Compare & Sell tools ---------- */
  function quickTool(form, buyEl, sellEl, matchEl) {
    if (!form) return;
    var inp = $('input[name=q]', form);
    function run(q) {
      q = String(q || '').trim(); if (!q) return;
      var isb = isISBN(q) ? clean(q) : '';
      var v = { q: isb || q, isbn: isb };
      renderList(buyEl, MK.buy, v, 'buy');
      renderList(sellEl, MK.sell, v, 'sell');
      var out = $('#tool-out'); if (out) out.hidden = false;
      if (matchEl) {
        matchEl.innerHTML = '<div class="skeleton" style="min-height:90px"></div>';
        olSearch(q, 1).then(function (j) {
          var d = (j.docs || [])[0];
          if (!d) { matchEl.innerHTML = '<p class="muted">No catalogue match found — the marketplace links below still search for “' + esc(q) + '”.</p>'; return; }
          var c = coverURL(d, 'S');
          matchEl.innerHTML = '<a class="match" href="' + esc(bookHref(d)) + (isb ? '&isbn=' + isb : '') + '">' + (c ? '<img src="' + esc(c) + '" alt="" width="44" height="66" loading="lazy" onerror="this.remove()">' : '') +
            '<span><strong>' + esc(d.title) + '</strong><br><span class="muted">' + esc((d.author_name || []).join(', ')) + (d.first_publish_year ? ' &middot; first published ' + d.first_publish_year : '') + (d.edition_count ? ' &middot; ' + d.edition_count + ' editions' : '') + '</span><br><span class="go">Full book details &rarr;</span></span></a>';
        }).catch(function () { matchEl.innerHTML = ''; });
      }
      if (history.replaceState) history.replaceState(null, '', location.pathname + '?q=' + encodeURIComponent(q));
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); });
    var q0 = new URLSearchParams(location.search).get('q');
    if (q0) { inp.value = q0; run(q0); }
  }
  quickTool($('#compare-form'), $('#c-buy'), $('#c-sell'), $('#c-match'));
  quickTool($('#sell-form'), null, $('#s-sell'), $('#s-match'));

  /* ---------- Home: trending (auto-updated) + daily subject shelf ---------- */
  var tr = $('#trending');
  if (tr && !tr.children.length) {
    tr.innerHTML = skeletons(6);
    getJSON(OL + '/trending/weekly.json?limit=12').then(function (j) {
      var w = (j.works || []).slice(0, 12);
      tr.innerHTML = w.length ? w.map(card).join('') : '';
    }).catch(function () { tr.innerHTML = ''; });
  }
  var sh = $('#shelf');
  if (sh) {
    var subs = (sh.getAttribute('data-subjects') || 'classics').split(','), now = new Date();
    var day = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5), s = subs[day % subs.length].trim();
    var lab = $('#shelf-name'); if (lab) lab.textContent = s.replace(/_/g, ' ');
    sh.innerHTML = skeletons(6);
    getJSON(OL + '/subjects/' + encodeURIComponent(s) + '.json?limit=12').then(function (j) {
      sh.innerHTML = (j.works || []).map(function (w) {
        return card({ key: w.key, title: w.title, author_name: (w.authors || []).map(function (a) { return a.name; }), cover_i: w.cover_id, first_publish_year: w.first_publish_year });
      }).join('');
    }).catch(function () { sh.innerHTML = ''; });
  }
})();
