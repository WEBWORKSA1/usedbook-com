/* UsedBook.com — interactive tools (educational estimates, not appraisals) */
(function () {
  'use strict';
  var D = document, W = window;
  var B = (document.documentElement.getAttribute('data-base') || '').replace(/\/$/, '');
  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v, d) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : (d || 0); }
  function money(n) { var neg = n < 0; n = Math.abs(n); return (neg ? '−$' : '$') + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function moneyR(n) { return '$' + Math.round(n).toLocaleString(); }
  function val(f, name) { var el = f.elements[name]; if (!el) return ''; if (el.length && !el.tagName) { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ''; } return el.value; }
  function checked(f, name) { var el = f.elements[name]; return !!(el && el.checked); }
  var qp = new URLSearchParams(location.search);

  /* ---------------- Book Value Estimator ---------------- */
  var vf = $('#value-form');
  if (vf) {
    var CAT = {
      mass: [0, 'Mass-market or common paperback'], trade: [1, 'Recent trade paperback'], hc: [1, 'Recent, widely printed hardcover'],
      tbnew: [4, 'Current-edition textbook'], tbold: [0, 'Older textbook edition'], oop: [3, 'Out-of-print or specialist nonfiction'],
      kids: [2, 'Children’s or illustrated book'], modern: [3, '20th-century literature / modern first'], antiq: [4, 'Antiquarian (before 1900)'],
      bible: [1, 'Old Bible or religious book'], local: [3, 'Local history, maps or ephemera']
    };
    var TIERS = [
      { max: 2, band: 'Under $5', name: 'Low', route: 'Donate, swap, or sell in bulk. Individually listing it rarely pays after fees and postage.', link: B + '/guides/where-to-donate-used-books/', lt: 'Where to donate' },
      { max: 7, band: '$5 – $25', name: 'Modest', route: 'Check instant buyback quotes first, then a marketplace listing if the quote is low.', link: B + '/sell/', lt: 'Compare sell routes' },
      { max: 13, band: '$25 – $150', name: 'Promising', route: 'List individually (AbeBooks, eBay, Biblio) with clear photos and an honest condition grade.', link: B + '/guides/how-to-sell-used-books/', lt: 'Selling playbook' },
      { max: 19, band: '$150 – $1,000', name: 'Significant', route: 'Get a second opinion from a specialist dealer and compare sold prices before you accept any offer.', link: B + '/get-offers/#valuation', lt: 'Request a valuation' },
      { max: 999, band: '$1,000+ possible', name: 'High potential', route: 'Do not sell quickly. Seek a professional appraisal or an established rare-book dealer or auction house.', link: B + '/get-offers/#valuation', lt: 'Request a valuation' }
    ];
    var t0 = qp.get('t'), y0 = num(qp.get('y'), 0);
    if (t0 && vf.elements.title) vf.elements.title.value = t0;
    if (y0 > 1400) { var age = new Date().getFullYear() - y0, sel = vf.elements.age; if (sel) sel.value = age < 20 ? '0' : age < 50 ? '1' : age < 100 ? '2' : age < 200 ? '3' : '5'; }
    var calc = function () {
      var f = [], score = 0;
      function add(label, pts) { if (pts) { f.push([label, pts]); score += pts; } }
      var cat = CAT[val(vf, 'cat')] || CAT.mass;
      add(cat[1], cat[0]);
      var age = num(val(vf, 'age')); add('Age', age);
      var ed = val(vf, 'edition');
      var collectible = ['modern', 'antiq', 'kids', 'oop', 'local'].indexOf(val(vf, 'cat')) > -1;
      if (ed === 'first1') add('First edition, first printing', collectible ? 4 : 2);
      if (ed === 'firstlater') add('First edition, later printing', 0.5);
      if (ed === 'bce') add('Book club edition', -3);
      if (ed === 'reprint') add('Reprint / print-on-demand', -2);
      var dj = val(vf, 'jacket');
      if (dj === 'good') add('Original dust jacket, good', collectible ? 2.5 : 1);
      if (dj === 'worn') add('Dust jacket worn or price-clipped', 0.5);
      if (dj === 'missing') add('Dust jacket missing', ed === 'first1' ? -3 : -1);
      var cond = { fine: 2, vg: 1, good: 0, fair: -2, poor: -4 }[val(vf, 'cond')] || 0; add('Condition', cond);
      var sig = { author: 3, assoc: 4.5, plate: 1 }[val(vf, 'signed')] || 0; add('Signature / inscription', sig);
      if (checked(vf, 'exlib')) add('Ex-library copy', -3);
      if (checked(vf, 'marked')) add('Heavy highlighting or notes', val(vf, 'cat') === 'tbnew' ? -1 : -2);
      var sc = { rare: 4, few: 2, some: 0, many: -2 }[val(vf, 'scarcity')] || 0; add('Copies for sale online', sc);
      var dm = { high: 2, niche: 1 }[val(vf, 'demand')] || 0; add('Collector demand', dm);
      var tier = TIERS[0]; for (var i = 0; i < TIERS.length; i++) { if (score <= TIERS[i].max) { tier = TIERS[i]; break; } }
      if (val(vf, 'cat') === 'tbnew' && score < 14) tier = { band: tier.band, name: tier.name, route: 'Current textbooks sell fastest through buyback comparison sites. Sell before a new edition is announced.', link: B + '/sell/', lt: 'Compare buyback offers' };
      var pct = Math.max(4, Math.min(100, (score + 6) / 30 * 100));
      var r = $('#value-result');
      r.innerHTML = '<p class="eyebrow">Estimated value band</p><div class="big">' + tier.band + '</div><p><span class="badge' + (score >= 14 ? ' badge-accent' : '') + '">' + tier.name + '</span> &middot; score ' + (Math.round(score * 10) / 10) + '</p>' +
        '<div class="meter" aria-hidden="true"><i style="width:' + pct + '%"></i></div><p><strong>Best route:</strong> ' + tier.route + '</p>' +
        '<ul class="factors">' + f.map(function (x) { return '<li><span>' + esc(x[0]) + '</span><span class="' + (x[1] > 0 ? 'plus' : 'minus') + '">' + (x[1] > 0 ? '+' : '') + x[1] + '</span></li>'; }).join('') + '</ul>' +
        '<p><a class="btn btn-accent btn-block" href="' + tier.link + '">' + tier.lt + '</a></p>' +
        '<p class="fine">Educational estimate from general market patterns — not an appraisal or offer. Always check recently <em>sold</em> prices for your exact edition.</p>';
    };
    vf.addEventListener('input', calc); vf.addEventListener('change', calc);
    vf.addEventListener('submit', function (e) { e.preventDefault(); calc(); $('#value-result').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    calc();
  }

  /* ---------------- Condition Grader ---------------- */
  var gf = $('#grade-form');
  if (gf) {
    var GR = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Near Fine', 'Fine', 'As New'];
    var DESC = {
      7: 'Unread and flawless — as it left the publisher.', 6: 'Barely handled, no notable defects; may show the faintest sign of reading.',
      5: 'Close to Fine with one or two very small flaws.', 4: 'Shows some wear but no tears or major defects; flaws are noted.',
      3: 'An average used, complete copy with wear, possibly marks or a weak hinge; all defects noted.', 2: 'Worn but complete; may have stains, loose binding or heavy wear.',
      1: 'Heavily damaged or incomplete — sold as a reading or binding copy only.'
    };
    var gcalc = function () {
      var cap = 7, notes = [];
      $$('input[name=defect]', gf).forEach(function (c) { if (c.checked) { cap = Math.min(cap, +c.getAttribute('data-cap')); notes.push(c.getAttribute('data-note')); } });
      var dj = val(gf, 'dj'), djName = { none: '', na: '', fine: 'Fine', vg: 'Very Good', good: 'Good', poor: 'Fair' }[dj] || '';
      var line = GR[cap] + (djName ? ' / ' + djName + ' dust jacket' : (dj === 'none' ? ', no dust jacket' : ''));
      var extra = [];
      if (checked(gf, 'clipped')) extra.push('jacket price-clipped');
      if (checked(gf, 'bce')) extra.push('book club edition');
      var listing = line + '.' + (notes.length ? ' ' + notes.join('; ').replace(/^./, function (c) { return c.toUpperCase(); }) + '.' : ' No notable defects.') + (extra.length ? ' Note: ' + extra.join(', ') + '.' : '');
      $('#grade-result').innerHTML = '<p class="eyebrow">Suggested grade</p><div class="big">' + GR[cap] + '</div><p>' + DESC[cap] + '</p>' +
        '<p class="legend">Copy-ready condition note</p><div class="out" id="grade-out">' + esc(listing) + '</div>' +
        '<p class="mt-2"><button type="button" class="btn btn-primary btn-sm" data-copy="#grade-out">Copy note</button> <a class="btn btn-ghost btn-sm" href="' + B + '/guides/book-condition-grades/">Grading guide</a></p>' +
        '<p class="fine">Grades follow the widely used bookseller scale (As New → Poor). When in doubt, grade down and describe every flaw.</p>';
    };
    gf.addEventListener('change', gcalc); gcalc();
  }

  /* ---------------- First-Edition Checker ---------------- */
  var nf = $('#nl-form');
  if (nf) {
    var ncalc = function () {
      var raw = String(val(nf, 'line') || '').trim(), stmt = checked(nf, 'stmt'), out = $('#nl-result');
      var tokens = raw.split(/[^0-9]+/).filter(Boolean);
      var prints = [], years = [];
      tokens.forEach(function (t) {
        if (t.length === 4) years.push(+t);
        else if (t.length === 2 && (t.charAt(0) === '0' || +t > 20)) years.push(+t);
        else if (+t > 0 && +t <= 20) prints.push(+t);
      });
      var bce = $$('input[name=bce]', nf).filter(function (c) { return c.checked; }).length;
      var html = '';
      if (!tokens.length) html = '<p class="eyebrow">Waiting for input</p><p>Type the row of numbers from the copyright page, exactly as printed (for example <code>10 9 8 7 6 5 4 3 2 1</code>).</p>';
      else if (!prints.length) html = '<p class="eyebrow">Result</p><div class="big">Unclear</div><p>No printing digits found. Some lines only show year codes — enter the whole line including the single digits.</p>';
      else {
        var low = Math.min.apply(null, prints), verdict, note = '';
        if (low === 1) { verdict = 'First printing'; note = 'The lowest number is 1, which in a standard number line means this copy is from the first printing.' + (stmt ? ' The edition statement agrees.' : ''); }
        else if (low === 2 && stmt) { verdict = 'Possibly a first printing'; note = 'Some publishers (Random House is the classic example) used a line that starts at 2 together with a “First Edition” statement for true first printings, removing the statement in later printings. Check that publisher’s practice for the year in question.'; }
        else { verdict = 'Printing #' + low; note = 'The lowest number shows the printing. ' + (stmt ? 'Note: some publishers leave “First Edition” on later printings — the number line takes priority.' : 'This is a later printing, which usually carries a fraction of a first printing’s collector value.'); }
        var yr = '';
        if (years.length) {
          var yl = Math.min.apply(null, years), cy = new Date().getFullYear() % 100;
          if (yl < 100) yl = yl <= cy ? 2000 + yl : 1900 + yl;
          yr = '<p><strong>Year code:</strong> this printing appears to date from <strong>' + yl + '</strong> (lowest year in the line).</p>';
        }
        html = '<p class="eyebrow">Number-line reading</p><div class="big">' + verdict + '</div><p>' + note + '</p>' + yr;
      }
      if (bce >= 2) html += '<div class="note"><strong>Book club edition likely</strong> (' + bce + ' signs). Book club editions are usually worth far less than trade first editions, even when they look similar.</div>';
      else if (bce === 1) html += '<p class="fine">One book-club sign checked — look for a second before concluding.</p>';
      html += '<p class="fine">Number-line conventions vary by publisher and era; books before about 1970 often have no number line at all. Use this as a first check, then confirm with a publisher-specific reference.</p>';
      out.innerHTML = html;
    };
    nf.addEventListener('input', ncalc); nf.addEventListener('change', ncalc);
    nf.addEventListener('submit', function (e) { e.preventDefault(); ncalc(); });
    $$('[data-line]', nf).forEach(function (b) { b.addEventListener('click', function () { nf.elements.line.value = b.getAttribute('data-line'); ncalc(); }); });
    ncalc();
  }

  /* ---------------- ISBN Converter ---------------- */
  var isf = $('#isbn-form');
  if (isf && W.UBISBN) {
    var I = W.UBISBN;
    var icalc = function () {
      var raw = String(val(isf, 'isbn') || ''), c = I.clean(raw), out = $('#isbn-result'), h = '';
      if (!c) { out.innerHTML = '<p class="eyebrow">Waiting for input</p><p>Enter a 10- or 13-digit ISBN, or 9/12 digits to calculate the missing check digit.</p>'; return; }
      if (c.length === 9 && /^\d{9}$/.test(c)) { var full = c + I.check10(c); h = '<p class="eyebrow">Check digit</p><div class="big">' + I.check10(c) + '</div><p>Complete ISBN-10: <strong>' + full + '</strong> &middot; ISBN-13: <strong>' + I.to13(full) + '</strong></p>'; c = full; }
      else if (c.length === 12 && /^\d{12}$/.test(c)) { var f13 = c + I.check13(c); h = '<p class="eyebrow">Check digit</p><div class="big">' + I.check13(c) + '</div><p>Complete ISBN-13: <strong>' + f13 + '</strong>' + (I.to10(f13) ? ' &middot; ISBN-10: <strong>' + I.to10(f13) + '</strong>' : '') + '</p>'; c = f13; }
      else if (c.length === 10) {
        if (I.valid10(c)) h = '<p class="eyebrow">Valid ISBN-10</p><div class="big">' + I.to13(c) + '</div><p>That is the ISBN-13 for <strong>' + c + '</strong>.</p>';
        else h = '<p class="eyebrow">Invalid ISBN-10</p><div class="big">Check digit mismatch</div><p>For the first nine digits <strong>' + c.slice(0, 9) + '</strong> the check digit should be <strong>' + I.check10(c.slice(0, 9)) + '</strong>. Re-check for a typo.</p>';
      } else if (c.length === 13) {
        if (I.valid13(c)) h = '<p class="eyebrow">Valid ISBN-13</p><div class="big">' + (I.to10(c) || 'No ISBN-10') + '</div><p>' + (I.to10(c) ? 'That is the ISBN-10 for <strong>' + c + '</strong>.' : 'ISBNs starting with 979 have no ISBN-10 equivalent.') + '</p>';
        else h = '<p class="eyebrow">Invalid ISBN-13</p><div class="big">Check digit mismatch</div><p>For <strong>' + c.slice(0, 12) + '</strong> the check digit should be <strong>' + I.check13(c.slice(0, 12)) + '</strong>.</p>';
      } else h = '<p class="eyebrow">Not an ISBN</p><div class="big">' + c.length + ' digits</div><p>ISBNs have 10 or 13 characters (the last ISBN-10 character may be X).</p>';
      if (I.isISBN(c)) h += '<p class="mt-2"><a class="btn btn-primary btn-sm" href="' + B + '/book/?isbn=' + c + '">Look up this book</a> <a class="btn btn-accent btn-sm" href="' + B + '/sell/?q=' + c + '">Where to sell it</a> <button type="button" class="btn btn-ghost btn-sm" data-copy="' + c + '">Copy</button></p>';
      out.innerHTML = h;
    };
    isf.addEventListener('input', icalc); isf.addEventListener('submit', function (e) { e.preventDefault(); icalc(); }); icalc();
  }

  /* ---------------- Reseller Profit Calculator ---------------- */
  var pf = $('#profit-form');
  if (pf) {
    var pcalc = function () {
      var cost = num(val(pf, 'cost')), price = num(val(pf, 'price')), credit = num(val(pf, 'credit')), ship = num(val(pf, 'ship')),
        fee = num(val(pf, 'fee')) / 100, fixed = num(val(pf, 'fixed')), pack = num(val(pf, 'pack')), qty = Math.max(1, Math.round(num(val(pf, 'qty'), 1)));
      var revenue = price + credit, fees = revenue * fee + fixed, profit = revenue - fees - ship - pack - cost;
      var margin = revenue > 0 ? profit / revenue * 100 : 0, roi = cost > 0 ? profit / cost * 100 : null;
      var be = fee < 1 ? (fixed + ship + pack + cost) / (1 - fee) - credit : 0;
      var verdict = profit < 1 ? ['Skip it', 'badge-accent'] : profit < 3 ? ['Thin margin', 'badge-accent'] : (roi === null || roi >= 100) ? ['Strong buy', ''] : ['Worth it', ''];
      $('#profit-result').innerHTML = '<p class="eyebrow">Profit per book</p><div class="big">' + money(profit) + '</div><p><span class="badge ' + verdict[1] + '">' + verdict[0] + '</span></p>' +
        '<ul class="factors"><li><span>Revenue (price + shipping charged)</span><span>' + money(revenue) + '</span></li><li><span>Marketplace fees</span><span class="minus">' + money(-fees) + '</span></li><li><span>Postage</span><span class="minus">' + money(-ship) + '</span></li><li><span>Packaging</span><span class="minus">' + money(-pack) + '</span></li><li><span>Cost of book</span><span class="minus">' + money(-cost) + '</span></li><li><span>Margin</span><span>' + margin.toFixed(1) + '%</span></li><li><span>Return on cost</span><span>' + (roi === null ? '∞' : roi.toFixed(0) + '%') + '</span></li><li><span>Break-even list price</span><span>' + money(Math.max(0, be)) + '</span></li>' +
        (qty > 1 ? '<li><span><strong>Total for ' + qty + ' books</strong></span><span><strong>' + money(profit * qty) + '</strong></span></li>' : '') + '</ul>' +
        '<p class="fine">Defaults are placeholders — enter your marketplace’s current fee schedule and your real postage costs.</p>';
    };
    pf.addEventListener('input', pcalc); pf.addEventListener('submit', function (e) { e.preventDefault(); pcalc(); }); pcalc();
  }

  /* ---------------- Collection Estimator ---------------- */
  var cf = $('#coll-form');
  if (cf) {
    var ccalc = function () {
      var total = 0, books = 0, collect = 0, lines = [];
      $$('[data-row]', cf).forEach(function (r) {
        var n = Math.max(0, Math.round(num($('[data-n]', r).value))), each = Math.max(0, num($('[data-v]', r).value));
        books += n; total += n * each;
        if (r.hasAttribute('data-collectible')) collect += n;
        if (n) lines.push(n + ' × ' + r.getAttribute('data-row'));
      });
      var mult = num(val(cf, 'cond'), 1); total *= mult;
      var lo = total * 0.6, hi = total * 1.4;
      var advice = books === 0 ? 'Enter how many books you have in each group.' :
        (collect >= 20 || books >= 500) ? 'Worth a professional look: a collection this size or with this many older/collectible titles often contains a few books that carry most of the value.' :
        books < 40 ? 'For a small lot, instant buyback quotes or a local used bookstore are usually the fastest route.' : 'A bulk buyer or a local used bookstore is likely the most efficient route; pull out anything collectible first.';
      var sum = lines.join(', ');
      $('#coll-result').innerHTML = '<p class="eyebrow">Bulk-offer ballpark</p><div class="big">' + (books ? moneyR(lo) + ' – ' + moneyR(hi) : '—') + '</div><p><strong>' + books.toLocaleString() + '</strong> books &middot; ' + collect + ' older/collectible</p><p>' + advice + '</p>' +
        '<p><a class="btn btn-accent btn-block" href="' + B + '/get-offers/?books=' + books + '&summary=' + encodeURIComponent(sum) + '#collection">Get real offers for this collection</a></p>' +
        '<p class="fine">Uses the per-book figures you see on the left (editable starting assumptions for what bulk buyers often pay — a fraction of retail). Real offers depend on titles, condition, demand and location.</p>';
    };
    cf.addEventListener('input', ccalc); cf.addEventListener('change', ccalc); ccalc();
  }
})();
