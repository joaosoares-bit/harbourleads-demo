/* Harbour Leads · landing concept */
(() => {
  const root = document.documentElement;
  const calm = root.classList.contains('calm');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const isTouch = matchMedia('(hover: none)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';

  /* ---------- things that work in every mode ---------- */

  // reduce-motion switch in the footer (kept between visits)
  const calmBtn = $('[data-calm]');
  calmBtn.setAttribute('aria-pressed', String(calm));
  calmBtn.textContent = calm ? 'Motion off · turn on' : 'Reduce motion';
  calmBtn.addEventListener('click', () => {
    try { localStorage.setItem('hl-calm', calm ? '0' : '1'); } catch (e) {}
    location.reload();
  });

  // full-screen menu
  const menu = $('[data-menu]'), menuBtn = $('[data-menu-btn]');
  let lenis = null;
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); lenis && lenis.stop(); }
    else { menu.classList.remove('is-open'); lenis && lenis.start(); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 900); }
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // fleet arrows
  const track = $('[data-fleet-track]');
  const step = () => (track.querySelector('.yacht')?.getBoundingClientRect().width || 300) + 24;
  $('[data-fleet-prev]').addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('[data-fleet-next]').addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));

  // hull colour: the whole section floods with the new colour
  const hull = $('[data-hull]');
  const HULLS = {
    navy: { bg: '#13294F', tone: 'dark', name: 'Abyss Navy' },
    white: { bg: '#ECE8DF', tone: 'light', name: 'Pearl White' },
    gunmetal: { bg: '#3B4048', tone: 'dark', name: 'Gunmetal' },
    sand: { bg: '#D6C6A4', tone: 'light', name: 'Riviera Sand' }
  };
  let hullNow = 'navy', hullBusy = false;
  $$('[data-hull-pick]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.hullPick;
    if (k === hullNow || hullBusy) return;
    hullBusy = true;
    $$('[data-hull-pick]').forEach(x => x.setAttribute('aria-checked', String(x === b)));
    $('[data-hull-name]').textContent = HULLS[k].name;
    const prev = $(`[data-hull-img="${hullNow}"]`), next = $(`[data-hull-img="${k}"]`);
    $$('.hull-img').forEach(i => i.classList.remove('was-on'));
    prev.classList.remove('is-on'); prev.classList.add('was-on');
    next.classList.add('is-on');
    const done = () => {
      hull.style.setProperty('--hull', HULLS[k].bg);
      hull.dataset.tone = HULLS[k].tone;
      hull.classList.remove('is-wiping');
      hullNow = k; hullBusy = false;
      tone();
    };
    if (calm) { done(); return; }
    hull.style.setProperty('--wipe', HULLS[k].bg);
    hull.classList.remove('is-wiping'); void hull.offsetWidth; hull.classList.add('is-wiping');
    setTimeout(done, 1100);
  }));

  // header turns navy over light sections
  const top = $('[data-top]');
  const sections = $$('main > section, .foot');
  const isLight = s => s.classList.contains('manifesto') || s.classList.contains('story') || s.classList.contains('inside') || (s === hull && hull.dataset.tone === 'light');
  const tone = () => {
    const y = 36;
    const s = sections.find(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    top.classList.toggle('on-light', !!s && isLight(s));
  };
  addEventListener('scroll', tone, { passive: true });
  tone();

  // CTAs: every click is measured and tells the form what the visitor was looking at
  const form = $('[data-form]');
  const send = (event, data) => { (window.dataLayer = window.dataLayer || []).push({ event, ...data }); };
  try {
    const q = new URLSearchParams(location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(k => q.get(k) && `${k}=${q.get(k)}`).filter(Boolean).join('&');
    $('[data-field-utm]').value = utm;
  } catch (e) {}
  $$('[data-cta]').forEach(a => a.addEventListener('click', () => {
    const about = a.hasAttribute('data-about-hull') ? `Hull in ${$('[data-hull-name]').textContent}` : (a.dataset.about || '');
    $('[data-field-cta]').value = a.dataset.cta;
    $('[data-field-about]').value = about;
    const note = $('[data-form-about]');
    note.textContent = about ? `About: ${about}` : '';
    note.hidden = !about;
    if (a.dataset.intent) form.intent.value = a.dataset.intent;
    send('cta_click', { cta: a.dataset.cta, about });
  }));

  // phone: a gold dock to the form, out of the way whenever a section's own CTA is on screen, and on the form
  const dock = $('[data-dock]');
  const dockSeen = new Set();
  const dio = new IntersectionObserver(entries => {
    entries.forEach(en => (en.isIntersecting ? dockSeen.add(en.target) : dockSeen.delete(en.target)));
    dock.classList.toggle('is-on', dockSeen.size === 0);
  });
  [$('[data-hero]'), $('[data-harbours]'), $('#enquire'), $('.foot'), ...$$('main .pill[data-cta], main .link-cta')].forEach(el => dio.observe(el));

  // form (concept demo: shows the thank-you; the CRM endpoint goes here)
  form.addEventListener('submit', e => {
    e.preventDefault();
    $('[data-form-ok]').hidden = false;
    e.target.querySelector('button[type=submit]').disabled = true;
    send('lead_submit', { cta: $('[data-field-cta]').value || 'direct', intent: form.intent.value });
  });

  // hero video: start on first gesture or 1.2 s after load, pause when away
  const heroVideo = $('[data-hero-video]');
  const playHero = () => { const p = heroVideo.play(); p && p.catch(() => {}); };
  if (!calm) {
    let started = false;
    const go = () => { if (started) return; started = true; playHero(); };
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(ev => addEventListener(ev, go, { once: true, passive: true }));
    addEventListener('load', () => setTimeout(go, 400));
    go();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) heroVideo.pause(); else if (!calm) playHero(); });

  // lazy background video for the window section
  const lazyVideos = $$('[data-lazy-video]');
  const big = window.innerWidth * (window.devicePixelRatio || 1) >= 1500;
  const vio = new IntersectionObserver(entries => entries.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) {
      if (!v.src) v.src = big ? v.dataset.srcBig : v.dataset.src;
      if (!calm) { const p = v.play(); p && p.catch(() => {}); }
    } else v.pause();
  }), { rootMargin: '400px 0px' });
  lazyVideos.forEach(v => vio.observe(v));

  if (calm || !hasGsap) {
    $$('[data-split-lines] .line').forEach(l => (l.style.transform = 'none'));
    return;
  }

  /* ---------- motion ---------- */
  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = id === '#top' ? 0 : $(id);
      if (el === null) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    }));
  }

  // custom cursor
  const cursor = $('.cursor');
  if (!isTouch) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cursor.style.opacity = 1; }, { passive: true });
    gsap.ticker.add(() => { cx += (tx - cx) * .2; cy += (ty - cy) * .2; cursor.style.transform = `translate(${cx}px, ${cy}px)`; });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { cursor.classList.add('is-big'); $('.cursor-label').textContent = el.dataset.cursor; });
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-big'));
    });
  }

  // split-line entrance: each line rises and sharpens, the next follows 0.16 s later
  const lineIn = (el, delay = 0) => gsap.fromTo($$('.line', el),
    { yPercent: 70, filter: 'blur(14px)' },
    { yPercent: 0, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', stagger: .16, delay });
  $$('[data-split-lines]').forEach(el => {
    if (el.classList.contains('hero-title')) return;
    gsap.set($$('.line', el), { yPercent: 70, filter: 'blur(14px)' });
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => lineIn(el) });
  });

  /* opening: a wake of light crosses the sea, draws the mark, then the sea parts */
  const intro = $('[data-intro]'), logo = $('[data-intro-logo]'), brand = $('.top-brand');
  const heroTitleLines = $$('.hero-title .line');
  const heroActions = $('.hero-actions');
  gsap.set(heroTitleLines, { yPercent: 70, filter: 'blur(14px)' });
  gsap.set(heroActions, { y: 30, autoAlpha: 0 });
  const dash = p => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); return L; };
  const wake = $('[data-wake]'); dash(wake);
  const arcs = $$('[data-arc]'); arcs.forEach(dash);
  const swoosh = $('[data-swoosh]'); dash(swoosh);
  const mark = $('.intro-mark'), word = $('.intro-word');
  gsap.set(mark, { clipPath: 'inset(0 100% 0 0)', filter: 'blur(10px)' });
  gsap.set(word, { clipPath: 'inset(0 50% 0 50%)', letterSpacing: '0' });
  lenis && lenis.stop();

  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { intro.remove(); lenis && lenis.start(); ScrollTrigger.refresh(); } });
  tl.to(wake, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
    .to(swoosh, { strokeDashoffset: 0, duration: .9 }, .45)
    .to(arcs, { strokeDashoffset: 0, duration: .9, stagger: .08 }, .6)
    .to(mark, { clipPath: 'inset(0 0% 0 0)', filter: 'blur(0px)', duration: 1.1, ease: 'expo.out' }, 1.15)
    .to([swoosh, ...arcs], { opacity: 0, duration: .6 }, 1.6)
    .to(word, { clipPath: 'inset(0 0% 0 0%)', duration: 1, ease: 'expo.out' }, 1.5)
    .to(wake, { opacity: 0, duration: .5 }, 2.1)
    // the sea parts along the waterline
    .to('.intro-sea-top', { yPercent: -101, duration: 1.3, ease: 'expo.inOut' }, 2.3)
    .to('.intro-sea-bottom', { yPercent: 101, duration: 1.3, ease: 'expo.inOut' }, 2.3)
    .fromTo('.hero-video', { scale: 1.25 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 2.3)
    // the mark flies home to the header without disappearing
    .add(() => {
      const from = logo.getBoundingClientRect();
      const to = brand.getBoundingClientRect();
      const s = to.width / from.width;
      gsap.to(logo, {
        x: (to.left + to.width / 2) - (from.left + from.width / 2),
        y: (to.top + to.height / 2) - (from.top + from.height / 2),
        scale: s, duration: 1.1, ease: 'expo.inOut',
        onComplete: () => { gsap.set(brand, { opacity: 1 }); gsap.set(logo, { opacity: 0 }); }
      });
    }, 2.6)
    .add(() => lineIn($('.hero-title')), 3.0)
    .to(heroActions, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out' }, 3.4);

  // hero leaves as a frame
  gsap.timeline({ scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true } })
    .to('[data-hero-frame]', { clipPath: 'inset(9% 6% 9% 6% round 28px)', ease: 'none' }, 0)
    .to('.hero-copy', { yPercent: -60, ease: 'none' }, 0);
  ScrollTrigger.create({ trigger: '[data-hero]', start: 'bottom top', onEnter: () => heroVideo.pause(), onLeaveBack: playHero });

  // manifesto: words light up as you read
  const mt = $('[data-fill]');
  mt.innerHTML = mt.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  const words = $$('.w', mt);
  ScrollTrigger.create({
    trigger: mt, start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: s => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n)); }
  });

  // harbours: each one opens like a porthole from the gold ring
  const hbgs = $$('[data-hbg]'), hnames = $$('[data-hname]'), ring = $('[data-hring]');
  let hIdx = 0;
  const showHarbour = (i) => {
    if (i === hIdx) return;
    const down = i > hIdx;
    hnames.forEach((n, k) => { n.classList.toggle('is-on', k === i); n.classList.toggle('is-off', down ? k < i : false); });
    hbgs.forEach((b, k) => { b.style.zIndex = k === i ? 3 : (k === hIdx ? 2 : 1); });
    const bg = hbgs[i];
    gsap.fromTo(bg, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(150% at 50% 50%)', duration: 1.4, ease: 'expo.inOut' });
    gsap.fromTo(bg.querySelector('img'), { scale: 1.35 }, { scale: 1.12, duration: 2, ease: 'expo.out' });
    gsap.fromTo(ring, { scale: .2, opacity: 1 }, { scale: 7, opacity: 0, duration: 1.4, ease: 'expo.out' });
    $('[data-hnum]').textContent = String(i + 1).padStart(2, '0');
    gsap.to('[data-hbar]', { scaleX: (i + 1) / hbgs.length, duration: .9, ease: 'expo.out' });
    hIdx = i;
  };
  ScrollTrigger.create({
    trigger: '[data-harbours]', start: 'top top', end: 'bottom bottom',
    onUpdate: s => showHarbour(Math.min(hbgs.length - 1, Math.floor(s.progress * hbgs.length * .999)))
  });
  gsap.to('[data-hbg] img', { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '[data-harbours]', start: 'top top', end: 'bottom bottom', scrub: true } });

  // story: the year fills with gold, frames open from below, the drawing is traced
  $$('[data-chapter]').forEach(ch => {
    gsap.to($('.chapter-year', ch), { backgroundPosition: '0% 0', ease: 'none', scrollTrigger: { trigger: ch, start: 'top 85%', end: 'center 40%', scrub: true } });
    gsap.fromTo($('.chapter-year', ch), { yPercent: 25 }, { yPercent: -25, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('[data-reveal]').forEach(f => {
    const img = $('img', f);
    ScrollTrigger.create({
      trigger: f, start: 'top 85%', once: true, onEnter: () => {
        gsap.to(f, { clipPath: 'inset(0% 0 0 0)', duration: 1.5, ease: 'expo.inOut' });
        gsap.to(img, { scale: 1, duration: 2.2, ease: 'expo.out' });
      }
    });
  });
  $$('[data-draw]').forEach(f => {
    gsap.to(f, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
  });

  // window: dive into the first stroke of the H until the sea fills the screen
  const maskSpan = $('[data-window-mask] span');
  const originOnStem = () => {
    const r = document.createRange();
    r.setStart(maskSpan.firstChild, 0); r.setEnd(maskSpan.firstChild, 1);
    const h = r.getBoundingClientRect(), s = maskSpan.getBoundingClientRect();
    if (!s.width) return;
    const x = (h.left - s.left) + h.width * .2, y = (h.top - s.top) + h.height * .55;
    maskSpan.style.transformOrigin = `${x}px ${y}px`;
  };
  document.fonts ? document.fonts.ready.then(originOnStem) : originOnStem();
  addEventListener('resize', originOnStem);
  gsap.timeline({ scrollTrigger: { trigger: '[data-window]', start: 'top top', end: 'bottom bottom', scrub: true, onRefresh: originOnStem } })
    .fromTo(maskSpan, { scale: 1 }, { scale: 60, ease: 'power3.in', duration: 1 })
    .to('[data-window-mask]', { opacity: 0, duration: .1 }, .92)
    .fromTo('[data-window-line]', { opacity: 0, y: 40, filter: 'blur(12px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .35 }, 1.0)
    .to({}, { duration: .3 });

  // fleet cards arrive in a wave; their pictures follow the pointer
  gsap.from('.yacht', { y: 80, rotate: 1.5, duration: 1.3, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: '[data-fleet-track]', start: 'top 85%' } });
  if (!isTouch) $$('[data-tilt]').forEach(card => {
    const img = $('img', card);
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      gsap.to(img, { xPercent: ((e.clientX - r.left) / r.width - .5) * -6, yPercent: ((e.clientY - r.top) / r.height - .5) * -6, duration: .8, ease: 'power3.out' });
    });
    card.addEventListener('pointerleave', () => gsap.to(img, { xPercent: 0, yPercent: 0, duration: 1, ease: 'expo.out' }));
  });

  // hull section: the render drifts with the scroll
  gsap.fromTo('.hull-stage', { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: hull, start: 'top bottom', end: 'bottom top', scrub: true } });

  // inside: parallax and counters
  $$('[data-parallax]').forEach(f => gsap.fromTo($('img', f), { yPercent: -10 }, { yPercent: +f.dataset.parallax - 10, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'expo.out', onUpdate: () => (el.textContent = Math.round(o.v)) }) });
  });

  // enquire: the harbour drifts behind the form
  gsap.fromTo('.enquire-bg', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.enquire', start: 'top bottom', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
