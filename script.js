/* =====================================================
   QAFILAT ALTAWHID — Main Script v3
   Bilingual (AR/EN) + Seamless Gallery + Navbar
   ===================================================== */
(function () {
  'use strict';

  /* ── Gallery image list ───────────────────────────── */
  const GALLERY_IMAGES = [
    'صور قافلة 2.jpeg','صور قافلة 3.jpeg','صور قافلة 4.jpeg',
    'صور قافلة 5.jpeg','صور قافلة 6.jpeg','صور قافلة 7.jpeg',
    'صور قافلة 8.jpeg','صور قافلة 9.jpeg','صور قافلة 10.jpeg',
    'صور قافلة 11.jpeg','صور قافلة 12.jpeg',
  ];

  /* ── Language state ───────────────────────────────── */
  let currentLang = localStorage.getItem('qt-lang') || 'ar';

  const REDUCE_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Word-by-word reveal engine ───────────────────────
     Splits text on whitespace only — Arabic letterforms stay
     fully connected. Re-splits automatically on language switch. */
  const wordTargets = []; /* { el, base, step, shown } */

  function splitWords(target) {
    const el = target.el;
    el.classList.remove('words-in');
    el.classList.add('word-split');
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      s.style.transitionDelay = (target.base + i * target.step) + 'ms';
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  function showWords(target) {
    target.shown = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => target.el.classList.add('words-in'));
    });
  }

  function registerWordReveal(el, opts) {
    if (!el || REDUCE_MOTION) return;
    const target = Object.assign({ el, base: 0, step: 60, shown: false }, opts);
    wordTargets.push(target);
    splitWords(target);
    if (target.now) {
      showWords(target);
    } else if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { showWords(target); obs.disconnect(); }
        });
      }, { threshold: 0.35 });
      obs.observe(el);
    } else {
      showWords(target);
    }
  }

  /* Language switch rewrites .t textContent — re-split and re-play */
  function refreshWordReveals() {
    wordTargets.forEach(t => {
      const wasShown = t.shown;
      const base = t.base; t.base = 40; /* quicker replay after a switch */
      splitWords(t);
      t.base = base;
      if (wasShown) showWords(t);
    });
  }

  /* ── Apply language across the page ──────────────── */
  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('qt-lang', lang);

    const html = document.documentElement;
    const body = document.body;

    if (lang === 'en') {
      html.lang = 'en';
      html.dir  = 'ltr';
      body.classList.add('lang-en');
    } else {
      html.lang = 'ar';
      html.dir  = 'rtl';
      body.classList.remove('lang-en');
    }

    /* Swap .t elements */
    document.querySelectorAll('.t').forEach(el => {
      const val = lang === 'en' ? el.dataset.en : el.dataset.ar;
      if (val !== undefined) el.textContent = val;
    });

    /* Toggle language-specific block content */
    document.querySelectorAll('.lang-ar-content').forEach(el => {
      el.style.display = lang === 'ar' ? '' : 'none';
    });
    document.querySelectorAll('.lang-en-content').forEach(el => {
      el.style.display = lang === 'en' ? '' : 'none';
    });

    /* Update lang-switch active states on ALL instances */
    document.querySelectorAll('.lang-switch').forEach(sw => {
      sw.querySelectorAll('.lang-opt').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
      });
    });

    /* Gallery direction is always LTR — no reversal needed */

    /* Re-split word-reveal targets after the text swap */
    refreshWordReveals();
  }

  /* ── Navbar ───────────────────────────────────────── */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const burger = document.getElementById('navBurger');
    const mobile = document.getElementById('navMobile');
    if (!navbar) return;

    /* Scrolled state.
     * Over the hero video (nav-overlay) the bar stays transparent/white
     * until the visitor leaves the hero — then it becomes light glass. */
    const hero = document.getElementById('hero');
    const isOverlay = navbar.classList.contains('nav-overlay') && hero;
    function navThreshold() {
      return isOverlay ? Math.max(hero.offsetHeight - 120, 200) : 50;
    }
    let ticking = false;
    function onNavScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('scrolled', window.scrollY > navThreshold());
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener('scroll', onNavScroll, { passive: true });
    window.addEventListener('resize', onNavScroll, { passive: true });
    onNavScroll();

    /* Hamburger */
    if (burger && mobile) {
      const closeMenu = () => {
        mobile.classList.remove('open');
        burger.classList.remove('open');
        navbar.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
      };
      burger.addEventListener('click', e => {
        e.stopPropagation();
        const open = mobile.classList.toggle('open');
        burger.classList.toggle('open', open);
        navbar.classList.toggle('menu-open', open); /* bar goes solid while the sheet is open */
        burger.setAttribute('aria-expanded', open);
      });
      document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) closeMenu();
      });
      mobile.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMenu);
      });
      /* Escape closes the menu */
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && mobile.classList.contains('open')) closeMenu();
      });
    }

    /* Wire up ALL lang-switch instances (desktop + mobile) */
    document.querySelectorAll('.lang-switch').forEach(sw => {
      sw.querySelectorAll('.lang-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.lang;
          /* Brief tap flash — restart animation on all matching buttons */
          document.querySelectorAll(`.lang-opt[data-lang="${target}"]`).forEach(b => {
            b.classList.remove('lang-flash');
            void b.offsetWidth; /* force reflow to restart animation */
            b.classList.add('lang-flash');
          });
          /* Clean up flash class once animation completes */
          setTimeout(() => {
            document.querySelectorAll('.lang-opt').forEach(b => b.classList.remove('lang-flash'));
          }, 700);
          if (target && target !== currentLang) applyLang(target);
        });
      });
    });
  }

  /* ── TRUE Seamless JS gallery ─────────────────────── */
  function initGallery() {
    const track = document.getElementById('galleryTrack');
    if (!track) return;

    const GAP   = 14;    // px — matches CSS gap
    const SPEED = 0.55;  // px per frame

    /* Build first set of images — stagger stroke animation per card */
    const STROKE_CYCLE = 10; // must match CSS animation duration (10s)
    GALLERY_IMAGES.forEach((src, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      /* Each card starts at a different phase of the shimmer cycle */
      item.style.animationDelay = `-${((i * STROKE_CYCLE) / GALLERY_IMAGES.length).toFixed(2)}s`;
      const img = document.createElement('img');
      img.src      = src;
      img.alt      = 'معرض قافلة التوحيد';
      img.loading  = 'lazy';
      img.decoding = 'async';
      item.appendChild(img);
      track.appendChild(item);
    });

    /* After layout settles, measure and clone for true infinite loop.
     * Double-rAF + a forced layout read ensures items have their
     * CSS-computed widths (270 px / 320 px) regardless of image load state. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const originals = [...track.children];

        /* Force a layout read so offsetWidth is the CSS-computed size */
        void track.offsetWidth;

        /* Width of exactly one set: N items each contributing (width + gap).
         * The gap between set1's last item and set2's first item is also GAP,
         * so this formula correctly represents the "period" of the loop. */
        let singleW = originals.reduce((sum, el) => sum + el.offsetWidth + GAP, 0);

        /* Clone the full set — track now has set1 + set2 */
        originals.forEach(el => track.appendChild(el.cloneNode(true)));

        track.style.animation  = 'none';
        track.style.willChange = 'transform';

        let pos    = 0;
        let paused = false;

        function step() {
          if (!paused) {
            pos += SPEED;
            /*
             * When pos reaches singleW we've advanced one full set-width.
             * Silently reset — set2 is identical to set1 so there's no
             * visible jump or white gap. Always scrolls left-to-right.
             */
            if (pos >= singleW) pos -= singleW;
            track.style.transform = `translateX(${-pos}px)`;
          }
          requestAnimationFrame(step);
        }

        requestAnimationFrame(step);

        /* Pause on hover / touch */
        track.addEventListener('mouseenter', () => { paused = true;  });
        track.addEventListener('mouseleave', () => { paused = false; });
        track.addEventListener('touchstart', () => { paused = true;  }, { passive: true });
        track.addEventListener('touchend',   () => { paused = false; }, { passive: true });
      });
    });
  }

  /* ── Hero video — parallax drift, fade-out, off-screen pause ── */
  function initHero() {
    const hero    = document.getElementById('hero');
    const video   = document.getElementById('heroVideo');
    const content = hero ? hero.querySelector('.hero-content') : null;
    const cue     = hero ? hero.querySelector('.hero-scroll-cue') : null;
    if (!hero || !video) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Pause the loop when the hero leaves the viewport — saves battery/CPU */
    if ('IntersectionObserver' in window) {
      const vObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const p = video.play(); if (p && p.catch) p.catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.05 });
      vObs.observe(hero);
    }
    /* Resume after tab switches */
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && window.scrollY < hero.offsetHeight) {
        const p = video.play(); if (p && p.catch) p.catch(() => {});
      }
    });

    if (reduceMotion) return;

    /* Gentle parallax: video drifts slower than the page,
       content eases away and softens as you leave the hero */
    let raf = null;
    function frame() {
      raf = null;
      const y = window.scrollY;
      const h = hero.offsetHeight || 1;
      if (y > h) return;
      const t = Math.min(y / h, 1);
      video.style.transform = `scale(1.04) translateY(${y * 0.22}px)`;
      if (content) {
        content.style.transform = `translateY(${y * 0.14}px)`;
        content.style.opacity   = String(1 - t * 1.15);
      }
      if (cue) cue.style.opacity = String(Math.max(1 - t * 3, 0));
    }
    window.addEventListener('scroll', () => {
      if (raf === null) raf = requestAnimationFrame(frame);
    }, { passive: true });
  }

  /* ── Awards — continuous premium showcase ─────────────
     Slow infinite drift, pause on hover and touch. */
  function initAwardsMarquee() {
    const outer = document.getElementById('awardsMarquee');
    const track = document.getElementById('awardsTrack');
    if (!outer || !track) return;

    /* Desktop shows a calm static composition — CSS handles the layout */
    if (window.matchMedia('(min-width: 1024px)').matches) return;

    if (REDUCE_MOTION) { outer.classList.add('static'); return; }

    const GAP = 24, SPEED = 0.4; /* px per frame — very slow, very calm */

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const originals = [...track.children];
        void track.offsetWidth;
        const singleW = originals.reduce((s, el) => s + el.offsetWidth + GAP, 0);
        if (singleW <= 0) return;

        /* Clone whole sets until the track comfortably overfills the viewport */
        const sets = Math.max(2, Math.ceil((outer.offsetWidth * 2) / singleW) + 1);
        for (let k = 0; k < sets; k++) {
          originals.forEach(el => {
            const c = el.cloneNode(true);
            c.classList.remove('reveal', 'reveal-d1', 'reveal-d2', 'reveal-d3', 'visible');
            c.classList.add('aw-clone');
            c.setAttribute('aria-hidden', 'true');
            track.appendChild(c);
          });
        }

        let pos = 0, paused = false;
        function step() {
          if (!paused) {
            pos += SPEED;
            if (pos >= singleW) pos -= singleW;
            track.style.transform = `translateX(${-pos}px)`;
          }
          requestAnimationFrame(step);
        }
        requestAnimationFrame(step);

        outer.addEventListener('mouseenter', () => { paused = true;  });
        outer.addEventListener('mouseleave', () => { paused = false; });
        outer.addEventListener('touchstart', () => { paused = true;  }, { passive: true });
        outer.addEventListener('touchend',   () => { paused = false; }, { passive: true });
      });
    });
  }

  /* ── Scroll progress hairline ─────────────────────── */
  function initProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let raf = null;
    function frame() {
      raf = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    }
    window.addEventListener('scroll', () => {
      if (raf === null) raf = requestAnimationFrame(frame);
    }, { passive: true });
    frame();
  }

  /* ── Scroll reveal ────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
  }

  /* ── Smooth scroll for same-page anchors ──────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.scrollY - 90,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /* ── Active nav link on scroll ────────────────────── */
  function initActiveLinks() {
    const sections = document.querySelectorAll('section[id],footer[id]');
    const links    = document.querySelectorAll('.nav-links a,.nav-mobile a');
    if (!sections.length || !links.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = '#' + e.target.id;
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === id));
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => obs.observe(s));
  }

  /* ── Bootstrap ────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    /* applyLang on load sets active states and correct direction */
    applyLang(currentLang);

    /* Hero headline — word-by-word entrance (after applyLang set the text) */
    const headline = document.getElementById('heroHeadline');
    if (headline && !REDUCE_MOTION) {
      headline.classList.remove('hero-rise', 'hero-rd1'); /* words carry the entrance */
      registerWordReveal(headline, { base: 300, step: 90, now: true });
    }
    /* Statement texts — scroll-triggered word reveals */
    document.querySelectorAll('.word-reveal').forEach(el => {
      registerWordReveal(el, { base: 0, step: 45 });
    });

    initNavbar();
    initHero();
    initProgress();
    initAwardsMarquee();
    initGallery();
    initReveal();
    initSmoothScroll();
    initActiveLinks();
  });

})();
