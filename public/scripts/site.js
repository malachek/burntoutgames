/* Burnt Out Games — the only JavaScript on the site.
   Mobile nav, scroll reveal. Everything degrades to a working page without it. */
(function () {
  'use strict';

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    var setOpen = function (open) {
      nav.setAttribute('data-open', open ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    toggle.addEventListener('click', function () {
      setOpen(nav.getAttribute('data-open') !== 'true');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset state when the layout leaves the mobile breakpoint
    var mq = window.matchMedia('(min-width: 861px)');
    var sync = function () { if (mq.matches) setOpen(false); };
    mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync);
  }

  /* ---- Scroll reveal ---- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  Array.prototype.forEach.call(items, function (el, i) {
    el.style.transitionDelay = Math.min(i % 3, 2) * 60 + 'ms';
    io.observe(el);
  });
})();

/* Contact form: post it in the background so nobody loses what they typed. */
(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = document.getElementById('cf-status');
  var button = form.querySelector('button[type="submit"]');

  var say = function (text, state) {
    if (!status) return;
    status.textContent = text;
    if (state) status.setAttribute('data-state', state);
    else status.removeAttribute('data-state');
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    button.disabled = true;
    say('Sending…');

    fetch(form.action, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .then(function (data) {
        if (data && data.ok) {
          form.reset();
          say('Got it. We will get back to you.');
        } else {
          say((data && data.error) || 'That did not send. Email us directly and we will get it.', 'error');
        }
      })
      .catch(function () {
        say('That did not send. Email us directly and we will get it.', 'error');
      })
      .then(function () { button.disabled = false; });
  });
})();
