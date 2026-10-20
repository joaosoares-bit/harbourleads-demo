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

  // configurator: a photo sequence of a real configurator (turn, then four configured looks), no 3D model served
  const cfg = $('[data-cfg]'), cv = $('[data-cfg-canvas]'), cx = cv.getContext('2d'), wipe = $('[data-cfg-wipe]'), still = $('[data-cfg-still]');
  const LOOKS = [
    { hull: 'White', shade: 'Open', ed: 'Standard' },
    { hull: 'Ocean Blue', shade: 'Bimini', ed: 'Standard' },
    { hull: 'Signal Grey', shade: 'T-top', ed: 'Pilot' },
    { hull: 'Ocean Blue', shade: 'T-top', ed: 'Standard' }
  ];
  const N = 36, small = () => innerWidth <= 760;
  const turnSrc = (e, k) => `media/cfg/${e}/turn-${String(k).padStart(2, '0')}.webp`;
  const lookSrc = (e, k) => `media/cfg/${e}/look-${k + 1}${small() ? '-640' : ''}.webp`;
  const sets = {};
  let env = 'mar', cfgP = calm ? 1 : 0, lookNow = calm ? 3 : 0;
  const load = (e) => {
    if (sets[e]) return sets[e];
    const mk = (s) => { const im = new Image(); im.decoding = 'async'; im.onload = () => e === env && cfgDraw(); im.src = s; return im; };
    return (sets[e] = { turn: Array.from({ length: N }, (_, k) => mk(turnSrc(e, k))), looks: LOOKS.map((_, k) => mk(lookSrc(e, k))) });
  };
  const fit = () => { const d = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(cv.clientWidth * d); cv.height = Math.round(cv.clientHeight * d); };
  const paint = (im) => {
    if (!im || !im.complete || !im.naturalWidth) return false;
    const W = cv.width, H = cv.height, iw = im.naturalWidth, ih = im.naturalHeight;
    const s = small() ? (W / iw) * 1.12 : Math.max(W / iw, H / ih);
    const w = iw * s, h = ih * s;
    cx.clearRect(0, 0, W, H);
    cx.drawImage(im, (W - w) / 2, small() ? H * .41 - h * .45 : (H - h) / 2, w, h);
    return true;
  };
  const chips = (L) => {
    $$('.cfg-row i', cfg).forEach(i => { const [k, v] = i.dataset.o.split(':'); i.classList.toggle('on', ({ hull: L.hull, shade: L.shade, ed: L.ed })[k] === v); });
  };
  function cfgDraw() {
    const set = load(env), p = cfgP;
    if (p < .5) {
      const k = Math.round((p / .5) * N) % N;
      paint(set.turn[k]) || paint(set.turn[0]);
      wipe.style.clipPath = 'circle(0% at 78% 80%)';
      $('[data-cfg-deg]').textContent = `${Math.round((p / .5) * 360)}°`;
      lookNow = 0;
    } else {
      const q = Math.min(.9999, (p - .5) / .5), li = Math.floor(q * 4), local = q * 4 - li, r = Math.min(1, local / .4);
      paint(li ? set.looks[li - 1] : set.turn[0]);
      wipe.style.backgroundImage = `url("${lookSrc(env, li)}")`;
      wipe.style.clipPath = `circle(${(r * 150).toFixed(1)}% at ${small() ? '50% 86%' : '78% 80%'})`;
      $('[data-cfg-deg]').textContent = '360°';
      lookNow = r >= 1 ? li : Math.max(0, li - 1);
    }
    const L = LOOKS[lookNow];
    chips(L);
    $('[data-cfg-lead]').classList.toggle('on', p > .93);
    $('[data-cfg-lead-text]').textContent = `Quote request · ${L.hull} · ${L.shade}`;
  }
  $$('[data-cfg-env]').forEach(b => b.addEventListener('click', () => {
    env = b.dataset.cfgEnv;
    $$('[data-cfg-env]').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    cfg.classList.toggle('is-studio', env === 'estudio');
    still.srcset = `media/cfg/${env}/look-4-640.webp 640w, media/cfg/${env}/look-4.webp 1140w`; still.src = `media/cfg/${env}/look-4-640.webp`;
    load(env); cfgDraw(); tone();
  }));
  if (calm || !hasGsap) { chips(LOOKS[3]); $('[data-cfg-lead-text]').textContent = 'Quote request · Ocean Blue · T-top'; }
  else {
    new IntersectionObserver((en, ob) => { if (en[0].isIntersecting) { fit(); load(env); cfgDraw(); ob.disconnect(); } }, { rootMargin: '150% 0px' }).observe(cfg);
    addEventListener('resize', () => { fit(); cfgDraw(); });
  }

  // header turns navy over light sections
  const top = $('[data-top]');
  const sections = $$('main > section, .foot');
  const isLight = s => s.classList.contains('manifesto') || s.classList.contains('path') || (s === cfg && cfg.classList.contains('is-studio'));
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
    const about = a.hasAttribute('data-about-cfg') ? `Configurator · ${LOOKS[lookNow].hull} · ${LOOKS[lookNow].shade}` : (a.dataset.about || '');
    $('[data-field-cta]').value = a.dataset.cta;
    $('[data-field-about]').value = about;
    const note = $('[data-form-about]');
    note.textContent = about ? `About: ${about}` : '';
    note.hidden = !about;
    if (a.dataset.interest) form.interest.value = a.dataset.interest;
    send('cta_click', { cta: a.dataset.cta, about });
  }));

  // phone: a gold dock to the form, out of the way whenever a section's own CTA is on screen, and on the form
  const dock = $('[data-dock]');
  const dockSeen = new Set();
  const dio = new IntersectionObserver(entries => {
    entries.forEach(en => (en.isIntersecting ? dockSeen.add(en.target) : dockSeen.delete(en.target)));
    dock.classList.toggle('is-on', dockSeen.size === 0);
  });
  [$('[data-hero]'), $('#start'), $('.foot'), ...$$('main .pill[data-cta], main .link-cta')].forEach(el => dio.observe(el));

  // form (concept demo: shows the thank-you; the CRM endpoint goes here)
  form.addEventListener('submit', e => {
    e.preventDefault();
    $('[data-form-ok]').hidden = false;
    e.target.querySelector('button[type=submit]').disabled = true;
    send('lead_submit', { cta: $('[data-field-cta]').value || 'direct', interest: form.interest.value, type: form.type.value });
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

  const score = $('[data-score]');
  if (calm || !hasGsap) {
    $$('[data-split-lines] .line').forEach(l => (l.style.transform = 'none'));
    score.textContent = 'Hot'; score.classList.add('is-hot');
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
  // visible from the first paint (it is the LCP): it only comes into focus, never hides behind a clip
  gsap.set(mark, { filter: 'blur(16px)', scale: 1.06 });
  gsap.set(word, { clipPath: 'inset(0 50% 0 50%)', letterSpacing: '0' });
  lenis && lenis.stop();

  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, onComplete: () => { intro.remove(); lenis && lenis.start(); ScrollTrigger.refresh(); } });
  tl.to(wake, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
    .to(swoosh, { strokeDashoffset: 0, duration: .9 }, .45)
    .to(arcs, { strokeDashoffset: 0, duration: .9, stagger: .08 }, .6)
    .to(mark, { filter: 'blur(0px)', scale: 1, duration: 1.6, ease: 'expo.out' }, .3)
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

  // configurator: the scroll turns the yacht a full circle, then wipes through four configured looks
  ScrollTrigger.create({ trigger: cfg, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => { cfgP = s.progress; cfgDraw(); } });

  // products: each background drifts behind its section
  $$('[data-product]').forEach(s => gsap.fromTo($('.product-bg', s), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } }));

  // 01 websites: the desktop page rises into place and the phone slides in over it
  gsap.timeline({ scrollTrigger: { trigger: '.stage-web', start: 'top 90%', end: 'center 50%', scrub: .6 } })
    .fromTo('.screen-desk', { y: 120, rotate: -2, scale: .92 }, { y: 0, rotate: 0, scale: 1, ease: 'none' }, 0)
    .fromTo('.screen-phone', { y: 220, x: 60, rotate: 6 }, { y: 0, x: 0, rotate: 0, ease: 'none' }, .15);

  // 03 funnel: the three questions are answered one by one and the score warms up
  const qs = $$('[data-q]');
  gsap.set(qs, { x: 60, autoAlpha: 0 });
  gsap.set('.funnel-sources span', { y: 20, autoAlpha: 0 });
  ScrollTrigger.create({
    trigger: '[data-funnel]', start: 'top 75%', once: true, onEnter: () => {
      const temps = ['Cold', 'Warm', 'Warm', 'Hot'];
      gsap.timeline()
        .to('.funnel-sources span', { y: 0, autoAlpha: 1, duration: .6, stagger: .1, ease: 'expo.out' })
        .add(() => {}, '+=.1')
        .to(qs[0], { x: 0, autoAlpha: 1, duration: .8, ease: 'expo.out', onComplete: () => (score.textContent = temps[1]) })
        .to(qs[1], { x: 0, autoAlpha: 1, duration: .8, ease: 'expo.out', onComplete: () => (score.textContent = temps[2]) }, '+=.35')
        .to(qs[2], { x: 0, autoAlpha: 1, duration: .8, ease: 'expo.out', onComplete: () => { score.textContent = temps[3]; score.classList.add('is-hot'); } }, '+=.35')
        .fromTo(score, { scale: 1 }, { scale: 1.18, duration: .3, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  });

  // 04 CRM: the pipeline tilts up from the desk until it faces you, then today's call pops up
  gsap.timeline({ scrollTrigger: { trigger: '.stage-crm', start: 'top 90%', end: 'center 50%', scrub: .6 } })
    .fromTo('.screen-crm', { rotateX: 28, y: 80, scale: .9 }, { rotateX: 0, y: 0, scale: 1, ease: 'none' }, 0)
    .fromTo('.crm-chip', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'none' }, .55);

  // path: the wake draws itself under the four steps
  const pw = $('[data-path-wake]'); const pl = pw.getTotalLength();
  gsap.set(pw, { strokeDasharray: pl, strokeDashoffset: pl });
  gsap.to(pw, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.path-track', start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
  gsap.from('[data-step] b', { scale: .4, duration: 1, ease: 'back.out(2)', stagger: .15, scrollTrigger: { trigger: '.path-track', start: 'top 80%' } });

  // enquire: the harbour drifts behind the form
  gsap.fromTo('.enquire-bg', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.enquire', start: 'top bottom', end: 'bottom top', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
