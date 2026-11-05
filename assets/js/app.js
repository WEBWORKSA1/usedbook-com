/* UsedBook.com — core site script (no dependencies) */
(function () {
  'use strict';
  var D = document, W = window, root = D.documentElement;
  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function sstore(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  var UB = W.UB = W.UB || {};

  /* Destination inbox is encoded and only assembled at send time. */
  var _k = [122, 120, 116, 57, 123, 126, 118, 122, 112, 87, 38, 118, 100, 124, 101, 120, 96, 117, 114, 96];
  function inbox() { return _k.map(function (c) { return String.fromCharCode(c ^ 23); }).join('').split('').reverse().join(''); }

  /* Toast */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }
  UB.toast = toast;

  /* Theme */
  var tb = $('#themeBtn');
  if (tb) tb.addEventListener('click', function () {
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t); store('ub-theme', t);
  });

  /* Navigation */
  var burger = $('#burger'), nav = $('#nav');
  function closeSubs() { $$('.has-sub.open').forEach(function (x) { x.classList.remove('open'); var b = $('.sub-toggle', x); if (b) b.setAttribute('aria-expanded', 'false'); }); }
  if (burger && nav) burger.addEventListener('click', function () {
    var o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
    burger.setAttribute('aria-label', o ? 'Close menu' : 'Open menu');
  });
  $$('.sub-toggle').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = b.parentNode, willOpen = !li.classList.contains('open');
      closeSubs();
      if (willOpen) { li.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    });
  });
  D.addEventListener('click', function (e) { if (!e.target.closest('.has-sub')) closeSubs(); });

  /* Modal (exit intent) */
  var modal = $('#exitModal'), lastFocus = null;
  function openModal() { if (!modal) return; lastFocus = D.activeElement; modal.hidden = false; var i = $('select,input', modal); if (i) i.focus(); }
  function closeModal() { if (modal && !modal.hidden) { modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); } }
  UB.closeModal = closeModal;
  D.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeSubs(); closeModal();
    if (nav && nav.classList.contains('open')) { nav.classList.remove('open'); if (burger) burger.setAttribute('aria-expanded', 'false'); }
  });
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.hasAttribute('data-close')) closeModal(); });
    var skipExit = /^\/(get-offers|contact|support|careers|advertise|contest)\//.test(location.pathname);
    if (!skipExit && !sstore('ub-exit') && W.matchMedia && W.matchMedia('(min-width:861px) and (pointer:fine)').matches) {
      var armed = false; setTimeout(function () { armed = true; }, 12000);
      D.addEventListener('mouseout', function (e) {
        if (armed && !e.relatedTarget && e.clientY < 8 && !sstore('ub-exit')) { sstore('ub-exit', '1'); openModal(); }
      });
    }
  }

  /* Mailto links — address is never present in the markup */
  $$('[data-mailto]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var s = a.getAttribute('data-mailto') || 'UsedBook.com inquiry';
      W.location.href = 'mailto:' + inbox() + '?subject=' + encodeURIComponent(s);
    });
  });

  /* Forms (FormSubmit AJAX) */
  function serialize(f) {
    var o = {};
    new FormData(f).forEach(function (v, k) {
      if (typeof v !== 'string') return; v = v.trim(); if (!v) return;
      o[k] = o[k] ? o[k] + ', ' + v : v;
    });
    return o;
  }
  function validateScope(scope) {
    var bad = null;
    $$('input,select,textarea', scope).forEach(function (el) {
      if (bad || el.disabled || el.type === 'hidden' || el.closest('[hidden]')) return;
      if (!el.checkValidity()) bad = el;
    });
    if (bad) { if (bad.reportValidity) bad.reportValidity(); bad.focus(); return false; }
    return true;
  }
  UB.validate = validateScope;
  function done(f) {
    var msg = f.getAttribute('data-success') || 'Thank you — your message has been sent.';
    var s = $('.success', f);
    if (!s) { s = D.createElement('div'); s.className = 'success'; s.setAttribute('role', 'status'); f.appendChild(s); }
    s.innerHTML = '<h3>Received — thank you.</h3><p></p>';
    $('p', s).textContent = msg;
    s.classList.add('show'); f.classList.add('sent');
    toast('Sent — thank you!');
    if (f.closest('.modal')) { sstore('ub-exit', '1'); setTimeout(closeModal, 2600); }
    try { if (W.dataLayer) W.dataLayer.push({ event: 'lead', form: f.getAttribute('data-form') }); } catch (e) {}
  }
  function fallback(label, data) {
    var lines = [];
    for (var k in data) if (k.charAt(0) !== '_') lines.push(k + ': ' + data[k]);
    toast('Opening your e-mail app as a backup…');
    W.location.href = 'mailto:' + inbox() + '?subject=' + encodeURIComponent('[UsedBook.com] ' + label) + '&body=' + encodeURIComponent(lines.join('\n').slice(0, 1800));
  }
  function sendForm(f) {
    if (!validateScope(f)) return;
    var data = serialize(f);
    if (data._honey) { f.classList.add('sent'); return; }
    delete data._honey;
    var label = f.getAttribute('data-form') || 'Website form';
    data._subject = '[UsedBook.com] ' + label + (data.name ? ' — ' + data.name : (data.email ? ' — ' + data.email : ''));
    data._template = 'table';
    if (data.email) data._replyto = data.email;
    data.form = label; data.page = location.href; data.submitted = new Date().toISOString();
    var btn = $('[type=submit]', f), txt = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    fetch('https://formsubmit.co/ajax/' + inbox(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok && r.status >= 500) throw new Error('server');
      return r.json().catch(function () { return {}; });
    }).then(function () { done(f); })
      .catch(function () { fallback(label, data); })
      .then(function () { if (btn) { btn.disabled = false; btn.textContent = txt; } });
  }
  $$('form[data-form]').forEach(function (f) {
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', function (e) { e.preventDefault(); sendForm(f); });
  });

  /* Prefill forms from URL (?books=120&summary=...) */
  var qp = new URLSearchParams(location.search);
  $$('form[data-prefill]').forEach(function (f) {
    qp.forEach(function (v, k) {
      var el = f.elements[k];
      if (el && el.tagName && el.type !== 'hidden' && el.type !== 'radio' && el.type !== 'checkbox' && !el.value) el.value = v;
    });
  });

  /* Multi-step forms */
  $$('[data-steps]').forEach(function (f) {
    var steps = $$('[data-step]', f), i = 0, bar = $('.progress i', f), lab = $('.step-label', f);
    function show(n) {
      steps.forEach(function (s, j) { s.hidden = j !== n; });
      i = n;
      if (bar) bar.style.width = ((n + 1) / steps.length * 100) + '%';
      if (lab) lab.textContent = 'Step ' + (n + 1) + ' of ' + steps.length + (steps[n].getAttribute('data-title') ? ' — ' + steps[n].getAttribute('data-title') : '');
    }
    $$('[data-next]', f).forEach(function (b) { b.addEventListener('click', function () { if (validateScope(steps[i])) { show(Math.min(i + 1, steps.length - 1)); var t = f.getBoundingClientRect().top + W.scrollY - 110; if (W.scrollY > t) W.scrollTo(0, t); } }); });
    $$('[data-prev]', f).forEach(function (b) { b.addEventListener('click', function () { show(Math.max(i - 1, 0)); }); });
    show(0);
  });

  /* Tabs */
  $$('[data-tabs]').forEach(function (w) {
    var tabs = $$('[role=tab]', w);
    function act(t, focus, push) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        var p = D.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) t.focus();
      if (push && w.hasAttribute('data-hash') && history.replaceState) history.replaceState(null, '', '#' + t.id.replace(/^tab-/, ''));
    }
    tabs.forEach(function (t, ix) {
      t.addEventListener('click', function () { act(t, false, true); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(ix + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(ix - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); act(n, true, true); }
      });
    });
    var h = location.hash.slice(1), start = h && D.getElementById('tab-' + h);
    act(start && tabs.indexOf(start) > -1 ? start : tabs[0]);
  });
  $$('[data-open-tab]').forEach(function (a) {
    a.addEventListener('click', function () { var t = D.getElementById('tab-' + a.getAttribute('data-open-tab')); if (t) t.click(); });
  });

  /* Book search forms */
  function isbnClean(s) { return String(s || '').replace(/[^0-9Xx]/g, '').toUpperCase(); }
  function looksISBN(s) {
    var raw = String(s || '').replace(/[\s-]/g, ''), c = isbnClean(s);
    return raw.length === c.length && (/^\d{9}[\dX]$/.test(c) || /^\d{13}$/.test(c));
  }
  UB.go = function (q, mode) {
    q = String(q || '').trim(); if (!q) return;
    var isI = looksISBN(q), v = isI ? isbnClean(q) : q, path;
    if (mode === 'sell') path = '/sell/?q=';
    else if (mode === 'value') path = '/tools/book-value/?t=';
    else path = isI ? '/book/?isbn=' : '/search/?q=';
    location.href = path + encodeURIComponent(mode === 'value' ? q : v);
  };
  $$('form[data-booksearch]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = $('input[name=q]', f); if (!inp) return;
      if (!inp.value.trim()) { inp.focus(); return; }
      UB.go(inp.value, f.getAttribute('data-mode') || 'buy');
    });
  });
  $$('.search-tabs').forEach(function (t) {
    var f = t.closest('form'); if (!f) return;
    $$('button', t).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', t).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        f.setAttribute('data-mode', b.getAttribute('data-mode'));
        var i = $('input[name=q]', f), s = $('[type=submit]', f);
        if (i) { i.placeholder = b.getAttribute('data-ph'); i.focus(); }
        if (s) s.textContent = b.getAttribute('data-btn');
      });
    });
  });
  $$('[data-example]').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.closest('form'), i = f && $('input[name=q]', f);
      if (i) { i.value = b.getAttribute('data-example'); i.focus(); }
    });
  });

  /* Click-to-load YouTube (privacy-enhanced) */
  D.addEventListener('click', function (e) {
    var b = e.target.closest('.yt'); if (!b) return;
    var id = b.getAttribute('data-yt'); if (!/^[\w-]{11}$/.test(id)) return;
    var f = D.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
    f.title = b.getAttribute('aria-label') || 'YouTube video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true; f.loading = 'lazy';
    b.parentNode.replaceChild(f, b);
  });

  /* Copy & share */
  UB.copy = function (t) {
    t = String(t || ''); if (!t) return;
    if (navigator.clipboard && W.isSecureContext) {
      navigator.clipboard.writeText(t).then(function () { toast('Copied: ' + (t.length > 42 ? t.slice(0, 42) + '…' : t)); });
    } else {
      var ta = D.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      D.body.appendChild(ta); ta.select();
      try { D.execCommand('copy'); toast('Copied'); } catch (e) {}
      D.body.removeChild(ta);
    }
  };
  D.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]');
    if (c) {
      e.preventDefault();
      var v = c.getAttribute('data-copy');
      if (v && v.charAt(0) === '#') { var el = $(v); v = el ? (el.value || el.textContent) : ''; }
      UB.copy(v);
    }
    var s = e.target.closest('[data-share]');
    if (s) {
      e.preventDefault();
      if (navigator.share) navigator.share({ title: D.title, url: location.href }).catch(function () {});
      else UB.copy(location.href);
    }
  });

  /* Guide enhancements: responsive tables, TOC with scroll-spy */
  var prose = $('#prose');
  if (prose) {
    $$('table', prose).forEach(function (t) {
      if (t.parentNode.classList.contains('table-wrap')) return;
      var w = D.createElement('div'); w.className = 'table-wrap';
      t.parentNode.insertBefore(w, t); w.appendChild(t);
    });
    var toc = $('#toc'), hs = $$('h2[id]', prose);
    if (toc && hs.length > 2) {
      var ol = $('ol', toc);
      hs.forEach(function (h) { var li = D.createElement('li'), a = D.createElement('a'); a.href = '#' + h.id; a.textContent = h.textContent; li.appendChild(a); ol.appendChild(li); });
      toc.hidden = false;
      if ('IntersectionObserver' in W) {
        var links = $$('a', toc);
        var io = new IntersectionObserver(function (en) {
          en.forEach(function (x) { if (x.isIntersecting) links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + x.target.id); }); });
        }, { rootMargin: '-20% 0px -70% 0px' });
        hs.forEach(function (h) { io.observe(h); });
      }
    }
  }

  /* Filters: chips and text search */
  $$('[data-filter-group]').forEach(function (g) {
    var tgt = $(g.getAttribute('data-filter-group')), chips = $$('[data-filter]', g);
    if (!tgt) return;
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var v = c.getAttribute('data-filter');
        chips.forEach(function (x) { x.classList.toggle('active', x === c); x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        $$('[data-cat]', tgt).forEach(function (it) { it.hidden = !(v === 'all' || it.getAttribute('data-cat') === v); });
      });
    });
  });
  $$('[data-search-target]').forEach(function (inp) {
    var tgt = $(inp.getAttribute('data-search-target')); if (!tgt) return;
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      $$('[data-item]', tgt).forEach(function (it) { it.hidden = !!q && it.textContent.toLowerCase().indexOf(q) < 0; });
    });
  });

  /* Cookie notice */
  var ck = $('#cookie');
  if (ck && !store('ub-cookie')) {
    ck.hidden = false;
    var ok = $('#cookieOk'); if (ok) ok.addEventListener('click', function () { store('ub-cookie', '1'); ck.hidden = true; });
  }

  /* Sticky mobile CTA + back to top */
  var sc = $('#stickyCta'), top = $('.to-top'), scShown = false;
  var scAllowed = sc && !sstore('ub-sticky') && !/^\/get-offers\//.test(location.pathname);
  if (sc) { var x = $('.sticky-x', sc); if (x) x.addEventListener('click', function () { sc.hidden = true; sstore('ub-sticky', '1'); scAllowed = false; }); }
  W.addEventListener('scroll', function () {
    var y = W.scrollY || W.pageYOffset;
    if (scAllowed && !scShown && y > 700) { sc.hidden = false; scShown = true; }
    if (top) top.classList.toggle('show', y > 900);
  }, { passive: true });
})();
