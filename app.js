// Persipica home, "column" direction. Plain JavaScript, no dependencies.
// Everything that moves on its own pauses off-screen, on hover or focus, with its pause button,
// and does not run at all for prefers-reduced-motion.
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var later = function (fn, ms) { return window.setTimeout(fn, ms); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Runs fn(visible) whenever an element enters or leaves the viewport.
  function onVisible(node, fn, margin) {
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { fn(e.isIntersecting); });
    }, { rootMargin: margin || '0px' }).observe(node);
  }

  // A box whose height follows its content smoothly (the content is wrapped in an inner div).
  function autoHeight(box) {
    var inner = el('div');
    while (box.firstChild) inner.appendChild(box.firstChild);
    box.appendChild(inner);
    var fit = function () {
      var cs = getComputedStyle(box);
      var extra = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      box.style.height = (inner.offsetHeight + extra) + 'px';
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(inner);
    return inner;
  }

  // A pause button bound to a state object { paused }.
  function pauseButton(name, state, onChange) {
    var btn = $('[data-pause="' + name + '"]');
    if (!btn) return;
    if (RM) { btn.hidden = true; return; }
    btn.addEventListener('click', function () {
      state.paused = !state.paused;
      btn.setAttribute('aria-pressed', String(state.paused));
      btn.querySelector('span').textContent = state.paused ? 'Play' : 'Pause';
      btn.querySelector('path').setAttribute('d', state.paused ? 'M2 1l7 4-7 4z' : 'M2 1h2v8H2zM6 1h2v8H6z');
      if (onChange) onChange(state.paused);
    });
  }

  /* ---------------------------------------------------------------- the eye */

  var eyes = [];
  var eyeCount = 0;

  // The eye, drawn like a loose ink pen: an almond with pointed corners, an iris that touches both
  // lids, a solid pupil and five straight lashes. A light displacement filter roughens the ink edges.
  function eyeSvg(id) {
    var lid = 'M13 96.5 C 50 50, 189 49, 227 95.5';
    var lower = 'M14 95.5 C 52 143, 188 142, 226 96.5';
    return '' +
      '<svg class="eye" viewBox="-6 -4 252 160" aria-hidden="true" focusable="false">' +
      '<defs>' +
      '<clipPath id="eye-clip-' + id + '"><path d="M13 96.5 C 50 50, 189 49, 227 95.5 C 188 142, 52 143, 14 95.5 Z"/></clipPath>' +
      '<filter id="eye-ink-' + id + '" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7"/>' +
      '<feDisplacementMap in="SourceGraphic" scale="1.8"/>' +
      '</filter>' +
      '</defs>' +
      '<g filter="url(#eye-ink-' + id + ')">' +
      '<g class="rays">' +
      '<path class="stroke lash" d="M44 61 L26 44.5"/>' +
      '<path class="stroke lash" d="M85 52 L74.5 29"/>' +
      '<path class="stroke lash" d="M120 47 L120.5 13"/>' +
      '<path class="stroke lash" d="M155 52 L166 29"/>' +
      '<path class="stroke lash" d="M196 61 L214 44.5"/>' +
      '</g>' +
      '<g class="lid">' +
      '<g clip-path="url(#eye-clip-' + id + ')"><g class="look">' +
      '<circle class="iris stroke" cx="120" cy="96" r="34.5"/>' +
      '<circle class="pupil" cx="120" cy="96" r="11" fill="currentColor"/>' +
      '</g></g>' +
      '<path class="stroke" d="' + lid + '"/>' +
      '<path class="stroke" d="' + lower + '"/>' +
      '</g></g></svg>';
  }

  function Eye(slot, opts) {
    slot.innerHTML = eyeSvg(++eyeCount);
    this.svg = slot.firstChild;
    this.look = $('.look', this.svg);
    this.opts = opts || {};
    this.cur = { x: 0, y: 0 };
    this.to = { x: 0, y: 0 };
    this.reach = { x: 30, y: 4 };
    this.active = false;
    this.holdUntil = 0;
    this.nextWander = 0;
    this.nextBlink = performance.now() + rand(1500, 4000);
    eyes.push(this);
  }

  Eye.prototype.dir = function (x, y, hold) {
    this.to.x = clamp(x, -1, 1);
    this.to.y = clamp(y, -1, 1);
    if (hold) this.holdUntil = performance.now() + hold;
    if (RM) { this.cur.x = this.to.x; this.cur.y = this.to.y; this.apply(); }
    wakeEyes();
  };

  Eye.prototype.lookAtPoint = function (px, py, hold) {
    var r = this.svg.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height * 0.6;
    var dx = px - cx;
    var dy = py - cy;
    var spread = Math.max(140, r.width * 1.6);
    this.dir(dx / spread, dy / (spread * 0.7), hold);
  };

  Eye.prototype.lookAtEl = function (node, hold) {
    var r = node.getBoundingClientRect();
    this.lookAtPoint(r.left + r.width / 2, r.top + r.height / 2, hold);
  };

  Eye.prototype.blink = function () {
    var svg = this.svg;
    svg.classList.add('is-blinking');
    later(function () { svg.classList.remove('is-blinking'); }, 140);
  };

  Eye.prototype.found = function (on) {
    this.svg.classList.toggle('is-found', !!on);
  };

  Eye.prototype.apply = function () {
    this.look.setAttribute('transform', 'translate(' + (this.cur.x * this.reach.x).toFixed(2) + ' ' + (this.cur.y * this.reach.y).toFixed(2) + ')');
  };

  var eyeFrame = 0;
  function wakeEyes() {
    if (!eyeFrame && !RM) eyeFrame = requestAnimationFrame(tickEyes);
  }

  function tickEyes(now) {
    eyeFrame = 0;
    var moving = false;
    eyes.forEach(function (e) {
      if (!e.active) return;
      if (e.opts.wander && now > e.holdUntil && now > e.nextWander) {
        e.to.x = rand(-0.9, 0.9);
        e.to.y = rand(-0.7, 0.7);
        e.nextWander = now + rand(1100, 2600);
      }
      if (e.opts.blink && now > e.nextBlink) {
        e.blink();
        e.nextBlink = now + rand(2600, 6000);
      }
      var dx = e.to.x - e.cur.x;
      var dy = e.to.y - e.cur.y;
      if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) {
        e.cur.x += dx * 0.14;
        e.cur.y += dy * 0.14;
        e.apply();
        moving = true;
      }
      if (e.opts.wander || e.opts.blink) moving = true;
    });
    if (moving) eyeFrame = requestAnimationFrame(tickEyes);
  }

  function makeEye(slot, opts) {
    var eye = new Eye(slot, opts);
    onVisible(slot, function (v) { eye.active = v; if (v) wakeEyes(); });
    return eye;
  }

  var eyeBySlot = {};
  $$('[data-eye]').forEach(function (slot) {
    var kind = slot.getAttribute('data-eye');
    if (kind === 'static') {
      var e = new Eye(slot, {});
      var d = (slot.getAttribute('data-look') || '1,0').split(',').map(Number);
      e.cur.x = e.to.x = d[0];
      e.cur.y = e.to.y = d[1];
      e.apply();
      return;
    }
    if (kind === 'big') eyeBySlot.big = makeEye(slot, { wander: true, blink: true, follow: true });
    if (kind === 'hero') eyeBySlot.hero = makeEye(slot, { wander: true, blink: true });
    if (kind === 'cta') eyeBySlot.cta = makeEye(slot, { blink: true });
  });

  // Big eye follows the cursor; after the cursor stops, it goes back to scouting.
  if (FINE && !RM) {
    var lastMove = 0;
    window.addEventListener('pointermove', function (ev) {
      var now = performance.now();
      if (now - lastMove < 30) return;
      lastMove = now;
      var big = eyeBySlot.big;
      if (big && big.active) big.lookAtPoint(ev.clientX, ev.clientY, 1600);
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- header */

  var nav = $('.site-nav');
  if (nav) {
    var lastY = window.scrollY;
    var onScroll = function () {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 8);
      if (y > lastY + 6 && y > 240) nav.classList.add('is-tucked');
      else if (y < lastY - 6 || y < 240) nav.classList.remove('is-tucked');
      lastY = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = $('.nav-toggle', nav);
    toggle.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    // One panel for every dropdown: it slides and resizes to the menu that's open.
    var panel = $('.menu-panel', nav);
    var triggers = $$('.nav-trigger', nav);
    var current = null;
    var closeTimer = 0;
    var desktop = window.matchMedia('(min-width: 961px)');

    var openMenu = function (key, focusFirst) {
      window.clearTimeout(closeTimer);
      var menu = $('.menu[data-menu="' + key + '"]', panel);
      var trigger = $('.nav-trigger[data-menu="' + key + '"]', nav);
      if (!menu || !trigger) return;
      var wasOpen = panel.classList.contains('is-open');
      $$('.menu', panel).forEach(function (m) { m.classList.toggle('is-active', m === menu); });
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', String(t === trigger)); });
      var base = panel.parentElement.getBoundingClientRect();
      var tr = trigger.getBoundingClientRect();
      var w = menu.offsetWidth;
      var x = clamp(tr.left - base.left - 16, 0, base.width - w);
      if (!wasOpen) panel.classList.add('no-slide');
      panel.style.setProperty('--pw', w + 'px');
      panel.style.setProperty('--ph', menu.offsetHeight + 'px');
      panel.style.setProperty('--px', x + 'px');
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      nav.classList.add('menu-open');
      if (!wasOpen) requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.remove('no-slide'); }); });
      current = key;
      if (focusFirst) { var first = $('a', menu); if (first) first.focus(); }
    };

    var closeMenu = function (returnFocus) {
      if (!current) return;
      var trigger = $('.nav-trigger[data-menu="' + current + '"]', nav);
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      nav.classList.remove('menu-open');
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
      current = null;
      if (returnFocus && trigger) trigger.focus();
    };

    triggers.forEach(function (t) {
      var key = t.getAttribute('data-menu');
      t.addEventListener('click', function () {
        if (!desktop.matches) {
          var sub = t.nextElementSibling;
          var open = sub.hidden;
          sub.hidden = !open;
          t.setAttribute('aria-expanded', String(open));
          return;
        }
        if (current === key) closeMenu(); else openMenu(key, false);
      });
      t.addEventListener('keydown', function (ev) {
        if (desktop.matches && ev.key === 'ArrowDown') { ev.preventDefault(); openMenu(key, true); }
      });
      if (FINE) {
        t.addEventListener('pointerenter', function () { if (desktop.matches) openMenu(key, false); });
        t.addEventListener('pointerleave', function () { closeTimer = later(closeMenu, 180); });
      }
    });

    // Other top-level links close the panel when hovered.
    $$('.nav-main > li > a', nav).forEach(function (a) {
      a.addEventListener('pointerenter', function () { closeTimer = later(closeMenu, 120); });
    });

    panel.addEventListener('pointerenter', function () { window.clearTimeout(closeTimer); });
    panel.addEventListener('pointerleave', function () { closeTimer = later(closeMenu, 180); });
    panel.addEventListener('focusout', function (ev) {
      if (!panel.contains(ev.relatedTarget) && !nav.contains(ev.relatedTarget)) closeMenu();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (current) closeMenu(true);
      if (nav.classList.contains('open')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
    document.addEventListener('click', function (ev) {
      if (current && !nav.contains(ev.target)) closeMenu();
    });
  }

  /* ---------------------------------------------------------------- hero chat */

  var SCENARIOS = [
    {
      persona: 'a hiker with blisters',
      q: 'What are the best merino walking socks for blisters?',
      a: {
        gpt: { intro: 'Walkers who struggle with blisters tend to rate these three:', items: [['Ridgeway Trail Merino', '£16'], ['Fellside Peak Merino', '£18', 1], ['Tor Outdoor Hiker', '£14']], verdict: ['ChatGPT names Fellside second.', '47% of answers'] },
        gemini: { intro: 'Popular choices for blister-prone walkers include:', items: [['Ridgeway Trail Merino', '£16'], ['Tor Outdoor Hiker', '£14'], ['Pennine Mills Loop', '£15']], verdict: ['Gemini leaves Fellside out.', '21% of answers'] },
        pplx: { intro: 'Based on recent reviews, the top picks are:', items: [['Fellside Peak Merino', '£18', 1], ['Ridgeway Trail Merino', '£16'], ['Pennine Mills Loop', '£15']], verdict: ['Perplexity names Fellside first.', '56% of answers'] }
      }
    },
    {
      persona: 'a parent buying for growing kids',
      q: "Which kids' walking socks last the longest?",
      a: {
        gpt: { intro: 'Parents tend to recommend these for durability:', items: [['Pennine Mills Junior', '£10'], ['Ridgeway Little Trail', '£12'], ['Tor Outdoor Kids', '£8']], verdict: ['ChatGPT leaves Fellside out.', '9% of answers'] },
        gemini: { intro: "For hard-wearing kids' socks, consider:", items: [['Pennine Mills Junior', '£10'], ['Fellside Trail Junior', '£11', 1]], verdict: ['Gemini names Fellside second.', '14% of answers'] },
        pplx: { intro: 'Reviewers single out:', items: [['Pennine Mills Junior', '£10'], ['Tor Outdoor Kids', '£8'], ['Fellside Trail Junior', '£11', 1]], verdict: ['Perplexity names Fellside third.', '12% of answers'] }
      }
    },
    {
      persona: 'a student on a budget',
      q: 'Cheap but warm hiking socks for a student?',
      a: {
        gpt: { intro: 'Good value options that still keep your feet warm:', items: [['Fellside Everyday 3-pack', '£24', 1], ['Tor Outdoor Value 5-pack', '£20']], verdict: ['ChatGPT names Fellside first.', '72% of answers'] },
        gemini: { intro: 'Budget-friendly picks:', items: [['Tor Outdoor Value 5-pack', '£20'], ['Fellside Everyday 3-pack', '£24', 1], ['Ridgeway Basics', '£15']], verdict: ['Gemini names Fellside second.', '58% of answers'] },
        pplx: { intro: 'Students often choose:', items: [['Tor Outdoor Value 5-pack', '£20'], ['Ridgeway Basics', '£15']], verdict: ['Perplexity leaves Fellside out.', '31% of answers'] }
      }
    }
  ];
  var NAMES = { gpt: 'ChatGPT', gemini: 'Gemini', pplx: 'Perplexity' };
  var ORDER = ['gpt', 'gemini', 'pplx'];

  var chat = $('.chat');
  if (chat) {
    var morphBox = $('[data-morph]', chat);
    autoHeight(morphBox);
    var body = $('[data-chat-body]', chat);
    var tabs = $$('.tab', chat);
    var chips = $$('.persona-chip', chat);
    var bar = $('.cycle-bar', chat);
    var heroState = { paused: false, hover: false, visible: true, scenario: 0, assistant: 0, t0: 0, run: 0 };
    var SHOW_MS = 6500;

    var setPersona = function (si) {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(Number(c.getAttribute('data-s')) === si)); });
    };

    var render = function (si, ai) {
      var run = ++heroState.run;
      var sc = SCENARIOS[si];
      var key = ORDER[ai];
      var ans = sc.a[key];
      tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.getAttribute('data-a') === key)); });
      setPersona(si);
      body.textContent = '';
      body.appendChild(el('p', 'bubble-q', sc.q));
      var answer = el('div', 'answer');
      answer.setAttribute('aria-live', 'polite');
      var from = el('p', 'answer-from' + (RM ? '' : ' is-typing'), NAMES[key]);
      answer.appendChild(from);
      body.appendChild(answer);
      var hero = eyeBySlot.hero;

      var finish = function () {
        if (run !== heroState.run) return;
        var list = el('ol');
        answer.appendChild(list);
        var mark = null;
        ans.items.forEach(function (item, i) {
          later(function () {
            if (run !== heroState.run) return;
            var li = el('li');
            var name = el('span');
            if (item[2]) { mark = el('mark', RM ? '' : 'is-sweeping', item[0]); name.appendChild(mark); }
            else name.appendChild(document.createTextNode(item[0]));
            li.appendChild(name);
            li.appendChild(el('span', null, item[1]));
            list.appendChild(li);
          }, RM ? 0 : 160 * i);
        });
        later(function () {
          if (run !== heroState.run) return;
          var good = !!mark;
          var v = el('p', 'verdict' + (good ? ' is-good' : ''));
          v.appendChild(el('span', null, ans.verdict[0]));
          v.appendChild(el('b', null, ans.verdict[1]));
          answer.appendChild(v);
          if (hero) {
            hero.lookAtEl(good ? mark : v, 2600);
            hero.found(good);
            later(function () { hero.found(false); }, 2400);
          }
        }, RM ? 0 : 160 * ans.items.length + 200);
      };

      if (RM) {
        from.classList.remove('is-typing');
        answer.appendChild(el('p', 'answer-intro', ans.intro));
        finish();
        return;
      }

      // The intro streams in word by word, like a real assistant.
      later(function () {
        if (run !== heroState.run) return;
        from.classList.remove('is-typing');
        var intro = el('p', 'answer-intro', '');
        answer.appendChild(intro);
        var words = ans.intro.split(' ');
        var i = 0;
        var step = function () {
          if (run !== heroState.run) return;
          intro.textContent = words.slice(0, ++i).join(' ');
          if (i < words.length) later(step, 45);
          else later(finish, 120);
        };
        step();
      }, 520);
    };

    var go = function (si, ai) {
      heroState.scenario = si;
      heroState.assistant = ai;
      heroState.t0 = performance.now();
      heroState.elapsed = 0;
      render(si, ai);
    };

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { go(heroState.scenario, ORDER.indexOf(t.getAttribute('data-a'))); });
      t.addEventListener('keydown', function (ev) {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        var n = (i + (ev.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        tabs[n].focus();
        go(heroState.scenario, n);
      });
    });

    chips.forEach(function (c) {
      c.addEventListener('click', function () { go(Number(c.getAttribute('data-s')), heroState.assistant); });
    });

    pauseButton('hero', heroState);
    chat.addEventListener('pointerenter', function () { heroState.hover = true; });
    chat.addEventListener('pointerleave', function () { heroState.hover = false; });
    chat.addEventListener('focusin', function () { heroState.hover = true; });
    chat.addEventListener('focusout', function () { heroState.hover = false; });
    onVisible(chat, function (v) { heroState.visible = v; });

    go(0, 0);

    if (!RM) {
      var last = performance.now();
      var heroTick = function (now) {
        var dt = now - last;
        last = now;
        var held = heroState.paused || heroState.hover || !heroState.visible || document.hidden;
        if (!held) heroState.elapsed = (heroState.elapsed || 0) + dt;
        var p = clamp((heroState.elapsed || 0) / SHOW_MS, 0, 1);
        bar.style.setProperty('--cp', p.toFixed(3));
        if (p >= 1) {
          var ai = heroState.assistant + 1;
          var si = heroState.scenario;
          if (ai >= ORDER.length) { ai = 0; si = (si + 1) % SCENARIOS.length; }
          go(si, ai);
        }
        requestAnimationFrame(heroTick);
      };
      requestAnimationFrame(heroTick);
    } else {
      bar.hidden = true;
    }
  }

  /* ---------------------------------------------------------------- question strip */

  var QUESTIONS = [
    [['Best running shoes for flat feet', 'Sport'], ['Vitamin C serum for sensitive skin', 'Beauty'], ['Dog food for a puppy with allergies', 'Pets'], ['Waterproof jacket under £150', 'Outdoor'], ['Standing desk that fits a small flat', 'Home'], ['Gift for a dad who loves coffee', 'Gifts'], ['Merino socks that don\'t itch', 'Outdoor'], ['Quietest dishwasher for an open-plan kitchen', 'Home']],
    [['Trail shoes for wide feet', 'Sport'], ['Non-toxic paint for a nursery', 'Home'], ['Protein powder without sweeteners', 'Health'], ['Carry-on case that fits budget airlines', 'Travel'], ['Laptop for video editing under £1,500', 'Tech'], ['Reef-safe sunscreen for kids', 'Beauty'], ['Linen bedding that gets softer with washing', 'Home'], ['Most comfortable chair for working from home', 'Home']]
  ];
  $$('[data-strip]').forEach(function (row, r) {
    for (var copy = 0; copy < 2; copy++) {
      var set = el('div', 'strip-set');
      if (copy) set.setAttribute('aria-hidden', 'true');
      QUESTIONS[r].forEach(function (q) {
        var chip = el('span', 'q-chip', q[0]);
        chip.appendChild(el('small', null, q[1]));
        set.appendChild(chip);
      });
      row.appendChild(set);
    }
  });
  var stripState = { paused: false };
  pauseButton('strip', stripState, function (p) { $('.strip').classList.toggle('is-paused', p); });

  /* ---------------------------------------------------------------- visibility chart */

  var WEEKS = ['17 Aug', '24 Aug', '31 Aug', '7 Sep', '14 Sep', '21 Sep', '28 Sep', '5 Oct'];
  var SERIES = {
    all: { v: [31, 33, 32, 36, 39, 41, 44, 47], c: [44, 43, 45, 44, 42, 41, 40, 39], n: [96, 96, 104, 104, 112, 112, 120, 120] },
    gpt: { v: [35, 37, 36, 40, 43, 44, 46, 49], c: [47, 46, 47, 45, 44, 44, 42, 41], n: [24, 24, 26, 26, 28, 28, 30, 30] },
    gemini: { v: [18, 17, 19, 20, 19, 21, 22, 21], c: [38, 39, 40, 41, 40, 41, 40, 41], n: [24, 24, 26, 26, 28, 28, 30, 30] },
    pplx: { v: [40, 42, 44, 47, 50, 52, 55, 56], c: [42, 41, 41, 40, 38, 37, 35, 34], n: [24, 24, 26, 26, 28, 28, 30, 30] }
  };
  var QUOTES = [
    'Walkers often pick Fellside Peak Merino for long days.',
    'Fellside and Ridgeway both use a high merino blend.',
    'For blisters, a snug heel like Fellside\'s helps.',
    'Ridgeway remains a popular all-rounder.'
  ];

  var chartBox = $('[data-chart]');
  if (chartBox) (function () {
    var W = 560, H = 240, L = 34, R = 12, T = 12, B = 28, MAX = 80;
    var sx = function (i) { return L + i * (W - L - R) / (WEEKS.length - 1); };
    var sy = function (v) { return T + (1 - v / MAX) * (H - T - B); };
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Line chart: Fellside named in AI answers over eight weeks');
    var mk = function (tag, attrs, parent) {
      var n = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      (parent || svg).appendChild(n);
      return n;
    };
    var grid = mk('g', { 'class': 'grid' });
    var axis = mk('g', { 'class': 'axis' });
    [0, 20, 40, 60, 80].forEach(function (v) {
      mk('line', { x1: L, x2: W - R, y1: sy(v), y2: sy(v) }, grid);
      var t = mk('text', { x: L - 8, y: sy(v) + 4, 'text-anchor': 'end' }, axis);
      t.textContent = v + '%';
    });
    WEEKS.forEach(function (w, i) {
      if (i % 2) return;
      var t = mk('text', { x: sx(i), y: H - 6, 'text-anchor': 'middle' }, axis);
      t.textContent = w;
    });
    var band = mk('path', { 'class': 'band' });
    var comp = mk('path', { 'class': 'comp' });
    var line = mk('path', { 'class': 'line' });
    var dots = WEEKS.map(function () { return mk('circle', { 'class': 'dot', r: 3.5 }); });
    var rule = mk('line', { 'class': 'rule', y1: T, y2: H - B });
    var hot = mk('circle', { 'class': 'hot', r: 6 });
    chartBox.textContent = '';
    chartBox.appendChild(svg);
    chartBox.setAttribute('tabindex', '0');
    chartBox.setAttribute('aria-label', 'Chart. Use the arrow keys to read each week.');
    var tip = el('div', 'tip');
    chartBox.appendChild(tip);

    var shown = { v: SERIES.all.v.slice(), c: SERIES.all.c.slice() };
    var key = 'all';
    var range = function (i) { return Math.max(5, Math.round(40 / Math.sqrt(SERIES[key].n[i] / 6))); };

    var draw = function () {
      var p = function (arr) { return arr.map(function (v, i) { return (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(v).toFixed(1); }).join(' '); };
      line.setAttribute('d', p(shown.v));
      comp.setAttribute('d', p(shown.c));
      var up = shown.v.map(function (v, i) { return [sx(i), sy(Math.min(MAX, v + range(i)))]; });
      var dn = shown.v.map(function (v, i) { return [sx(i), sy(Math.max(0, v - range(i)))]; }).reverse();
      band.setAttribute('d', 'M' + up.concat(dn).map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + ' Z');
      dots.forEach(function (d, i) { d.setAttribute('cx', sx(i)); d.setAttribute('cy', sy(shown.v[i])); });
    };
    draw();

    var tween = function (toKey) {
      var from = { v: shown.v.slice(), c: shown.c.slice() };
      var to = SERIES[toKey];
      key = toKey;
      if (RM) { shown.v = to.v.slice(); shown.c = to.c.slice(); draw(); return; }
      var t0 = performance.now();
      var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
      var step = function (now) {
        var t = ease(clamp((now - t0) / 550, 0, 1));
        shown.v = from.v.map(function (a, i) { return a + (to.v[i] - a) * t; });
        shown.c = from.c.map(function (a, i) { return a + (to.c[i] - a) * t; });
        draw();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    $$('[data-series] .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('[data-series] .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        tween(chip.getAttribute('data-s'));
        partsState.manual = true;
      });
    });

    var showAt = function (i) {
      var v = SERIES[key].v[i];
      var r = range(i);
      chartBox.classList.add('is-hovering');
      rule.setAttribute('x1', sx(i));
      rule.setAttribute('x2', sx(i));
      hot.setAttribute('cx', sx(i));
      hot.setAttribute('cy', sy(v));
      tip.innerHTML = '';
      tip.appendChild(el('small', null, 'Week of ' + WEEKS[i]));
      tip.appendChild(el('b', null, v + '% of answers'));
      tip.appendChild(el('span', null, 'Likely ' + Math.max(0, v - r) + '% to ' + Math.min(100, v + r) + '%, from ' + SERIES[key].n[i] + ' answers. Ridgeway ' + SERIES[key].c[i] + '%.'));
      tip.appendChild(el('q', null, QUOTES[i % QUOTES.length]));
      var box = chartBox.getBoundingClientRect();
      var scale = box.width / W;
      var x = sx(i) * scale;
      var tx = x + 16 + 220 > box.width ? x - 236 : x + 16;
      chartBox.style.setProperty('--tx', tx + 'px');
      chartBox.style.setProperty('--ty', (sy(v) * scale - 40) + 'px');
    };
    var hide = function () { chartBox.classList.remove('is-hovering'); };
    var idx = 7;

    chartBox.addEventListener('pointermove', function (ev) {
      var box = chartBox.getBoundingClientRect();
      var x = (ev.clientX - box.left) / box.width * W;
      idx = clamp(Math.round((x - L) / ((W - L - R) / (WEEKS.length - 1))), 0, WEEKS.length - 1);
      showAt(idx);
    });
    chartBox.addEventListener('pointerleave', hide);
    chartBox.addEventListener('focus', function () { showAt(idx); });
    chartBox.addEventListener('blur', hide);
    chartBox.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight') idx = Math.min(WEEKS.length - 1, idx + 1);
      else if (ev.key === 'ArrowLeft') idx = Math.max(0, idx - 1);
      else return;
      ev.preventDefault();
      showAt(idx);
    });
  })();

  /* ---------------------------------------------------------------- parts switcher */

  var partsState = { paused: false, hover: false, visible: false, manual: false, elapsed: 0 };
  var partsRoot = $('#parts');
  if (partsRoot) (function () {
    var btns = $$('.part-btn', partsRoot);
    var viewsBox = $('.views', partsRoot);
    var views = $$('.view', viewsBox);
    var inner = autoHeight(viewsBox);
    var PART_MS = 8000;
    var active = 0;

    var replayBars = function (view) {
      if (RM) return;
      $$('.meter i, .stage-bar i', view).forEach(function (b) {
        b.style.width = '0';
        requestAnimationFrame(function () { requestAnimationFrame(function () { b.style.width = ''; }); });
      });
    };

    var select = function (i, user) {
      active = i;
      partsState.elapsed = 0;
      btns.forEach(function (b, j) {
        b.setAttribute('aria-selected', String(j === i));
        b.setAttribute('tabindex', j === i ? '0' : '-1');
        b.style.setProperty('--pp', 0);
      });
      views.forEach(function (v, j) {
        v.hidden = j !== i;
        v.classList.remove('is-entering');
        if (j === i) { void v.offsetWidth; v.classList.add('is-entering'); replayBars(v); }
      });
      if (user) partsState.manual = true;
    };

    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i, true); });
      b.addEventListener('keydown', function (ev) {
        if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
        ev.preventDefault();
        var n = (i + (ev.key === 'ArrowDown' ? 1 : btns.length - 1)) % btns.length;
        btns[n].focus();
        select(n, true);
      });
    });

    partsRoot.addEventListener('pointerenter', function () { partsState.hover = true; });
    partsRoot.addEventListener('pointerleave', function () { partsState.hover = false; });
    partsRoot.addEventListener('focusin', function () { partsState.hover = true; });
    partsRoot.addEventListener('focusout', function () { partsState.hover = false; });
    onVisible(viewsBox, function (v) { partsState.visible = v; });
    pauseButton('parts', partsState);
    select(0);

    if (RM) { var c = $('.part-controls', partsRoot); if (c) c.hidden = true; return; }
    var last = performance.now();
    var tick = function (now) {
      var dt = now - last;
      last = now;
      var held = partsState.paused || partsState.hover || !partsState.visible || partsState.manual || document.hidden;
      if (!held) partsState.elapsed += dt;
      var p = clamp(partsState.elapsed / PART_MS, 0, 1);
      btns[active].style.setProperty('--pp', p.toFixed(3));
      if (p >= 1) select((active + 1) % btns.length);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })();

  /* ---------------------------------------------------------------- rows and fixes, on any page */

  // Views outside the home switcher (the features page) fill their bars when they scroll into view.
  if (!RM) $$('.feature-block .view').forEach(function (view) {
    var bars = $$('.meter i, .stage-bar i', view);
    bars.forEach(function (b) { b.style.width = '0'; });
    var done = false;
    onVisible(view, function (v) {
      if (!v || done) return;
      done = true;
      bars.forEach(function (b) { b.style.width = ''; });
    }, '0px 0px -15% 0px');
  });

  // Rows open and close on click or tap.
  $$('button.row-main').forEach(function (rm) {
    rm.addEventListener('click', function () {
      rm.parentElement.classList.toggle('is-open');
    });
  });

  // A fix that moves through its states while it's on screen.
  var FIX = [['Drafted', ''], ['Published', 'is-live'], ['Checked on next scan', 'is-done']];
  $$('[data-fix-status]').forEach(function (status) {
    var row = status.closest('.row');
    var lift = row && $('[data-fix-lift]', row);
    var seen = false;
    var step = 0;
    onVisible(status, function (v) { seen = v; });
    if (RM) return;
    window.setInterval(function () {
      if (!seen || status.offsetParent === null || document.hidden) return;
      step = (step + 1) % FIX.length;
      status.textContent = FIX[step][0];
      status.className = 'fix-status ' + FIX[step][1];
      if (lift) lift.textContent = step === 2 ? '+18 pts' : '\u00a0';
    }, 2200);
  });

  /* ---------------------------------------------------------------- the big eye and its answers */

  var SNIPPETS = [
    { a: 'ChatGPT', html: 'For blisters, walkers often pick <mark>Fellside Peak Merino</mark>.', kind: 'hit', src: 'A walking magazine and two outdoor retailers', q: 'A hiker with blisters' },
    { a: 'Gemini', html: "Ridgeway's Trail Merino is a popular all-rounder.", kind: 'miss', src: 'A gear review site and Ridgeway\'s own page', q: 'A hiker with blisters' },
    { a: 'Perplexity', html: '<mark class="wrong">Fellside\'s Trail Junior costs about &pound;9</mark> and lasts well.', kind: 'wrong', src: 'An old retailer listing', q: 'A parent' },
    { a: 'Claude', html: 'Tor Outdoor offers the best value multipacks.', kind: 'miss', src: 'A student money blog', q: 'A student' },
    { a: 'Grok', html: '<mark>Fellside</mark> and Ridgeway both use a high merino blend.', kind: 'hit', src: 'Both brands\' product pages', q: 'A hiker with blisters' },
    { a: 'AI Mode', html: 'Top picks: Ridgeway, Pennine Mills, Tor Outdoor.', kind: 'miss', src: 'Three review sites', q: 'A gift-buyer' },
    { a: 'AI Overviews', html: 'Reviewers rate <mark>Fellside</mark>\'s cushioning highly.', kind: 'hit', src: 'A review roundup', q: 'A hiker with blisters' }
  ];
  var TAGS = { hit: 'Named', miss: 'Not named', wrong: 'Wrong price' };
  var SLOTS = [[0, 2], [56, 6], [58, 78], [2, 80]];
  var field = $('[data-field]');
  if (field) (function () {
    var big = eyeBySlot.big;
    var shown = [];
    var next = 0;
    var slotI = 0;
    var visible = false;
    var held = 0;
    onVisible(field, function (v) { visible = v; });

    var closeAll = function (except) {
      shown.forEach(function (c) {
        if (c === except || !c.classList.contains('is-open')) return;
        c.classList.remove('is-open');
        c.setAttribute('aria-expanded', 'false');
      });
    };

    var add = function (instant) {
      var s = SNIPPETS[next++ % SNIPPETS.length];
      var slot = SLOTS[slotI++ % SLOTS.length];
      var card = el('button', 'snippet is-' + s.kind);
      card.type = 'button';
      card.setAttribute('aria-expanded', 'false');
      card.style.left = 'min(' + slot[0] + '%, calc(100% - var(--sw)))';
      card.style.top = slot[1] + '%';
      var head = el('small');
      head.appendChild(el('span', null, s.a));
      head.appendChild(el('em', null, TAGS[s.kind]));
      card.appendChild(head);
      var p = el('p');
      p.innerHTML = s.html;
      card.appendChild(p);
      var more = el('span', 'snippet-more');
      more.appendChild(el('span', null, 'Asked as: ' + s.q));
      more.appendChild(el('span', null, 'Sources: ' + s.src));
      card.appendChild(more);
      card.addEventListener('click', function () {
        var open = !card.classList.contains('is-open');
        closeAll(card);
        card.classList.toggle('is-open', open);
        card.setAttribute('aria-expanded', String(open));
        if (big) big.lookAtEl(card, 2500);
      });
      card.addEventListener('pointerenter', function () { held++; });
      card.addEventListener('pointerleave', function () { held = Math.max(0, held - 1); });
      field.appendChild(card);
      shown.push(card);
      var show = function () {
        card.classList.add('is-in');
        if (big && !instant) big.lookAtEl(card, 1500);
        later(function () {
          card.classList.add('is-tagged');
          if (s.kind === 'hit' && big && !instant) { big.found(true); later(function () { big.found(false); }, 1100); }
        }, instant ? 0 : 650);
      };
      if (instant) show(); else requestAnimationFrame(function () { requestAnimationFrame(show); });
      if (shown.length > 3) {
        var old = shown.shift();
        old.classList.add('is-out');
        old.tabIndex = -1;
        later(function () { old.remove(); }, 650);
      }
    };

    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeAll(null); });

    if (RM) { add(true); add(true); add(true); return; }
    add(false);
    window.setInterval(function () {
      if (!visible || document.hidden || held) return;
      if (shown.some(function (c) { return c.classList.contains('is-open') || c === document.activeElement; })) return;
      add(false);
    }, 2400);
  })();

  /* ---------------------------------------------------------------- scroll story */

  var stepsRoot = $('[data-steps]');
  if (stepsRoot) (function () {
    var steps = $$('.step', stepsRoot);
    var stage = $('[data-stage]');
    var trace = $('.trace', stepsRoot);
    var active = -1;
    var counter = null;

    var setActive = function (i) {
      if (i === active) return;
      active = i;
      steps.forEach(function (s, j) {
        s.classList.toggle('is-active', j === i);
        s.classList.toggle('is-passed', j < i);
      });
      if (stage) {
        stage.innerHTML = '';
        var pane = $('.stage-pane', steps[i]).cloneNode(true);
        pane.classList.add('is-active');
        stage.appendChild(pane);
        counter = $('[data-counter]', pane);
      }
    };
    setActive(0);

    var frame = 0;
    var update = function () {
      frame = 0;
      var vh = window.innerHeight;
      var r = stepsRoot.getBoundingClientRect();
      var p = clamp((vh * 0.5 - r.top) / r.height, 0, 1);
      trace.style.setProperty('--sp', p.toFixed(3));
      var mid = vh * 0.5;
      var i = 0;
      steps.forEach(function (s, j) { if (s.getBoundingClientRect().top < mid) i = j; });
      setActive(i);
      // The answers counter climbs with the scroll while step 2 is on screen.
      if (counter && i === 1) {
        var sr = steps[1].getBoundingClientRect();
        var sp = clamp((mid - sr.top) / (sr.height * 0.8), 0, 1);
        counter.textContent = Math.round(sp * Number(counter.getAttribute('data-to')));
        $$('.mini-bar i', stage).forEach(function (b) {
          b.style.width = 'calc(' + (b.style.getPropertyValue('--v') || '0%') + ' * ' + sp.toFixed(3) + ')';
        });
      }
    };
    window.addEventListener('scroll', function () { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------------------------------------------------------------- plans and questions */

  $$('[data-faq] details').forEach(function (d) {
    var summary = $('summary', d);
    var content = $('.faq-body', d);
    summary.addEventListener('click', function (ev) {
      if (RM || !content.animate) return;
      ev.preventDefault();
      if (d.open) {
        var h = content.offsetHeight;
        var a = content.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
        a.onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var to = content.offsetHeight;
        content.animate([{ height: '0px', opacity: 0 }, { height: to + 'px', opacity: 1 }], { duration: 360, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    });
  });

  /* ---------------------------------------------------------------- closing eye */

  var cta = $('[data-cta]');
  if (cta && eyeBySlot.cta) {
    var aim = function () { eyeBySlot.cta.lookAtEl(cta, 1e9); };
    onVisible(cta, function (v) { if (v) aim(); });
    window.addEventListener('resize', aim);
  }

  /* ---------------------------------------------------------------- footer */

  var page = $('.page');
  var footer = $('.site-footer');
  if (page && footer) {
    var fit = function () {
      footer.classList.remove('is-revealed');
      page.classList.remove('has-reveal');
      var fh = footer.offsetHeight;
      if (window.innerWidth > 960 && fh < window.innerHeight - 80) {
        page.style.setProperty('--fh', fh + 'px');
        page.classList.add('has-reveal');
        footer.classList.add('is-revealed');
      }
    };
    fit();
    window.addEventListener('resize', fit);
  }

  // A real status check: shows only when the app answers.
  var status = $('[data-status]');
  if (status && window.fetch) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    if (ctrl) later(function () { ctrl.abort(); }, 4000);
    fetch('https://pulse.persipica.com/api/health', { signal: ctrl ? ctrl.signal : undefined, credentials: 'omit' })
      .then(function (res) { if (res.ok) status.hidden = false; })
      .catch(function () {});
  }
})();
