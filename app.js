const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const siteNav = document.querySelector('body > nav');

// Top navigation active state
const topNavLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');
if (topNavLinks.length) {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  topNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === currentPath);
  });
}

// Nav scroll behavior
if (siteNav) {
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    if (reduceMotion) return;

    const currentScroll = window.pageYOffset;
    if (currentScroll <= 120) {
      siteNav.classList.remove('scroll-up', 'scroll-down');
      return;
    }

    if (currentScroll > lastScroll && !siteNav.classList.contains('scroll-down') && !document.body.classList.contains('menu-open')) {
      siteNav.classList.remove('scroll-up');
      siteNav.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && siteNav.classList.contains('scroll-down')) {
      siteNav.classList.remove('scroll-down');
      siteNav.classList.add('scroll-up');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
let registerReveal = node => node.classList.add('on');

if ('IntersectionObserver' in window && reveals.length) {
  let delayStack = [];
  let delayTimer = null;

  const processStack = () => {
    delayStack.forEach((el, index) => {
      el.style.transitionDelay = `${index * 100}ms`;
      el.classList.add('on');

      setTimeout(() => {
        el.style.transitionDelay = '';
      }, 1000);
    });

    delayStack = [];
  };

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        delayStack.push(entry.target);
        observer.unobserve(entry.target);

        clearTimeout(delayTimer);
        delayTimer = setTimeout(processStack, 50);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  );

  registerReveal = node => observer.observe(node);
  reveals.forEach(node => registerReveal(node));
} else {
  reveals.forEach(node => registerReveal(node));
}

// Mobile navigation
const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
const globalSidebar = document.querySelector('.global-sidebar');

if (hamburger) {
  hamburger.setAttribute('aria-expanded', 'false');

  function closeAll() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    if (navLinks) navLinks.classList.remove('open');
    if (globalSidebar) globalSidebar.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  function openMenu() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    siteNav.classList.remove('scroll-down');
    siteNav.classList.add('scroll-up');

    if (globalSidebar) {
      globalSidebar.classList.add('open');
    } else if (navLinks) {
      navLinks.classList.add('open');
    }

    document.body.classList.add('menu-open');
  }

  hamburger.addEventListener('click', event => {
    event.stopPropagation();
    hamburger.classList.contains('open') ? closeAll() : openMenu();
  });

  document.addEventListener('click', event => {
    if (!hamburger.classList.contains('open')) return;

    const inside =
      (navLinks && navLinks.contains(event.target)) ||
      (globalSidebar && globalSidebar.contains(event.target));

    if (!inside) closeAll();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && hamburger.classList.contains('open')) closeAll();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && hamburger.classList.contains('open')) closeAll();
  });

  document.querySelectorAll('.nav-links a, .sidebar-nav a').forEach(link => {
    link.addEventListener('click', closeAll);
  });
}

// Back to top
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

// FAQ Accordion
document.querySelectorAll('.faq-item .faq-q').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.closest('.faq-item');
    if (!item) return;

    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(node => node.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});


function createArticleId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function setSubsectionState(card, open) {
  const body = card.querySelector('.article-subsection-body');
  const toggle = card.querySelector('.article-subsection-toggle');
  if (!body || !toggle) return;

  card.classList.toggle('is-collapsed', !open);
  body.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Hide detail' : 'Show detail';
}

function chunkDenseSections(article) {
  const sections = Array.from(article.querySelectorAll(':scope > .guide-section'));
  let subsectionCount = 0;

  sections.forEach(section => {
    const h3s = Array.from(section.children).filter(node =>
      node.nodeType === 1 && node.matches('.guide-h3')
    );

    if (!h3s.length) return;

    h3s.forEach((h3, index) => {
      if (h3.parentElement && h3.parentElement.classList.contains('article-subsection-header')) return;

      const card = document.createElement('div');
      card.className = 'article-subsection-card';
      card.dataset.defaultState = 'collapsed';

      const header = document.createElement('div');
      header.className = 'article-subsection-header';

      const body = document.createElement('div');
      body.className = 'article-subsection-body';
      body.id = `${h3.id || createArticleId('subsection')}-detail`;

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'article-subsection-toggle';
      toggle.setAttribute('aria-controls', body.id);

      let current = h3.nextSibling;

      section.insertBefore(card, h3);
      card.appendChild(header);
      header.appendChild(h3);
      header.appendChild(toggle);
      card.appendChild(body);

      while (current) {
        const next = current.nextSibling;
        if (current.nodeType === 1 && current.matches('.guide-h3')) break;
        body.appendChild(current);
        current = next;
      }

      if (!body.textContent.trim()) {
        card.classList.add('no-detail');
        toggle.remove();
      } else {
        setSubsectionState(card, false);
        toggle.addEventListener('click', () => {
          setSubsectionState(card, body.hidden);
        });
      }

      subsectionCount += 1;
    });
  });

  return subsectionCount;
}

function getSectionSummary(section) {
  const candidate = section.querySelector(
    '.guide-h2 + .guide-p, .sec-title + .sec-body, .guide-p, .sec-body'
  );
  if (!candidate) return '';

  const text = candidate.textContent.replace(/\s+/g, ' ').trim();
  if (text.length <= 130) return text;
  return `${text.slice(0, 127).trimEnd()}...`;
}

function getMetricHighlights(article) {
  const cards = [];

  article.querySelectorAll('.data-stat-card, .data-market-card, .data-callout-stat').forEach(node => {
    let value = '';
    let label = '';

    if (node.matches('.data-stat-card')) {
      value = node.querySelector('.data-stat-num')?.textContent.trim() || '';
      label = node.querySelector('.data-stat-label')?.textContent.trim() || '';
    } else if (node.matches('.data-market-card')) {
      value = node.querySelector('.data-market-num')?.textContent.trim() || '';
      label = node.querySelector('.data-market-title')?.textContent.trim() || '';
    } else if (node.matches('.data-callout-stat')) {
      value = node.querySelector('.data-callout-num')?.textContent.trim() || '';
      label = node.querySelector('.data-callout-label')?.textContent.trim() || '';
    }

    if (value && label) cards.push({ value, label });
  });

  return cards.slice(0, 3);
}

function createDigestStat(value, label) {
  const item = document.createElement('div');
  item.className = 'article-digest-stat';

  const valueEl = document.createElement('strong');
  valueEl.textContent = value;

  const labelEl = document.createElement('span');
  labelEl.textContent = label;

  item.append(valueEl, labelEl);
  return item;
}

function applyArticleView(article, mode) {
  const cards = Array.from(article.querySelectorAll('.article-subsection-card'));
  if (!cards.length) return;

  cards.forEach(card => {
    const shouldOpen = mode === 'full';
    if (card.querySelector('.article-subsection-body')) setSubsectionState(card, shouldOpen);
  });

  article.dataset.view = mode;
}

function createViewControls(initialMode, onChange) {
  const controls = document.createElement('div');
  controls.className = 'article-view-switch';

  const skim = document.createElement('button');
  skim.type = 'button';
  skim.className = 'article-digest-toggle';
  skim.dataset.viewMode = 'skim';
  skim.textContent = 'Skim mode';

  const full = document.createElement('button');
  full.type = 'button';
  full.className = 'article-digest-toggle';
  full.dataset.viewMode = 'full';
  full.textContent = 'Open all detail';

  const sync = mode => {
    skim.classList.toggle('is-active', mode === 'skim');
    full.classList.toggle('is-active', mode === 'full');
  };

  skim.addEventListener('click', () => onChange('skim'));
  full.addEventListener('click', () => onChange('full'));

  sync(initialMode);
  controls.append(skim, full);

  return { controls, sync };
}

function enhanceArticleExperience() {
  const article = document.querySelector('.article-content');
  if (!article || article.querySelector('.article-digest')) return;

  const header = article.querySelector('.article-header');
  if (!header) return;

  const localToc = document.querySelector('.local-toc');
  const headings = Array.from(
    article.querySelectorAll('.guide-h2[id], .sec-title[id], .art-cta-title[id]')
  ).filter(heading => heading.closest('section, .agentic-cta'));
  if (headings.length < 3) return;

  const subsectionCount = chunkDenseSections(article);
  const digest = document.createElement('section');
  digest.className = 'article-digest reveal';

  const top = document.createElement('div');
  top.className = 'article-digest-top';

  const intro = document.createElement('div');
  intro.className = 'article-digest-intro';

  const label = document.createElement('p');
  label.className = 'article-digest-label';
  label.textContent = 'Skim This Page';

  const title = document.createElement('h2');
  title.className = 'article-digest-title';
  title.textContent = 'Use skim mode first. Open the deeper argument only when you need it.';

  const introBody = document.createElement('p');
  introBody.className = 'article-digest-copy';
  introBody.textContent =
    'Jump into the core sections first, keep the TOC focused on the section you are reading, and expand subsection detail only when the page needs deeper context.';

  intro.append(label, title, introBody);

  const stats = document.createElement('div');
  stats.className = 'article-digest-stats';
  stats.appendChild(createDigestStat(String(headings.length), 'sections'));

  if (subsectionCount) {
    stats.appendChild(createDigestStat(String(subsectionCount), 'subtopics'));
  }

  const readMeta = Array.from(article.querySelectorAll('.article-meta span')).find(span =>
    /min read/i.test(span.textContent)
  );
  if (readMeta) {
    stats.appendChild(createDigestStat(readMeta.textContent.replace(/read/i, '').trim(), 'reading time'));
  }

  const updatedMeta = Array.from(article.querySelectorAll('.article-meta span')).find(span =>
    /updated/i.test(span.textContent)
  );
  if (updatedMeta) {
    stats.appendChild(createDigestStat(updatedMeta.textContent.replace(/updated/i, '').trim(), 'updated'));
  }

  top.append(intro, stats);
  digest.appendChild(top);

  const jumpGrid = document.createElement('div');
  jumpGrid.className = 'article-jump-grid';

  headings.slice(0, 4).forEach((heading, index) => {
    const section = heading.closest('section, .agentic-cta');
    const card = document.createElement('a');
    card.className = 'article-jump-card';
    card.href = `#${heading.id}`;

    const kicker = document.createElement('span');
    kicker.className = 'article-jump-kicker';
    kicker.textContent =
      section?.querySelector('.guide-section-num, .sec-label')?.textContent.trim() || `Section ${index + 1}`;

    const cardTitle = document.createElement('span');
    cardTitle.className = 'article-jump-title';
    cardTitle.textContent = heading.textContent.trim();

    const description = document.createElement('span');
    description.className = 'article-jump-desc';
    description.textContent = getSectionSummary(section || article);

    card.append(kicker, cardTitle, description);
    jumpGrid.appendChild(card);
  });

  digest.appendChild(jumpGrid);

  const metrics = getMetricHighlights(article);
  if (metrics.length) {
    const highlightRow = document.createElement('div');
    highlightRow.className = 'article-highlight-row';

    metrics.forEach(metric => {
      const metricCard = document.createElement('div');
      metricCard.className = 'article-highlight-card';

      const metricValue = document.createElement('strong');
      metricValue.textContent = metric.value;

      const metricLabel = document.createElement('span');
      metricLabel.textContent = metric.label;

      metricCard.append(metricValue, metricLabel);
      highlightRow.appendChild(metricCard);
    });

    digest.appendChild(highlightRow);
  }

  if (subsectionCount > 1) {
    const storageKey = 'persipica-article-view';
    const savedMode = window.localStorage.getItem(storageKey);
    const initialMode = savedMode === 'full' ? 'full' : 'skim';
    const syncers = [];

    const setMode = mode => {
      applyArticleView(article, mode);
      syncers.forEach(sync => sync(mode));
      window.localStorage.setItem(storageKey, mode);
    };

    const digestControls = createViewControls(initialMode, setMode);
    digest.appendChild(digestControls.controls);
    syncers.push(digestControls.sync);

    if (localToc) {
      const tocTools = document.createElement('div');
      tocTools.className = 'local-toc-tools';

      const tocToolsLabel = document.createElement('p');
      tocToolsLabel.className = 'toc-tools-label';
      tocToolsLabel.textContent = 'Reading view';

      const tocControls = createViewControls(initialMode, setMode);
      tocTools.append(tocToolsLabel, tocControls.controls);
      localToc.insertBefore(tocTools, localToc.querySelector('.toc-links'));
      syncers.push(tocControls.sync);
    }

    setMode(initialMode);
  }

  header.insertAdjacentElement('afterend', digest);
  registerReveal(digest);
}

function initTocTracking() {
  const tocEntries = Array.from(document.querySelectorAll('.toc-links a'))
    .map(link => ({
      link,
      target: document.querySelector(link.getAttribute('href')),
      isSub: link.classList.contains('toc-h3')
    }))
    .filter(entry => entry.target);

  if (!tocEntries.length) return;

  const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 64;
  let currentParentIndex = 0;

  tocEntries.forEach((entry, index) => {
    if (!entry.isSub) currentParentIndex = index;
    entry.parentIndex = currentParentIndex;
  });

  const computeTops = () => {
    tocEntries.forEach(entry => {
      entry.top = entry.target.getBoundingClientRect().top + window.scrollY;
    });
  };

  const onScroll = () => {
    const scrollLine = window.scrollY + navHeight + 40;
    let activeIndex = 0;

    for (let index = 0; index < tocEntries.length; index += 1) {
      if (tocEntries[index].top <= scrollLine) {
        activeIndex = index;
      } else {
        break;
      }
    }

    const activeParentIndex = tocEntries[activeIndex].isSub
      ? tocEntries[activeIndex].parentIndex
      : activeIndex;

    tocEntries.forEach((entry, index) => {
      entry.link.classList.toggle('active', index === activeIndex);
      entry.link.classList.toggle('is-visible', !entry.isSub || entry.parentIndex === activeParentIndex);
    });
  };

  computeTops();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { computeTops(); onScroll(); });
  onScroll();
}

enhanceArticleExperience();
initTocTracking();
