/* nav.js — menu mobile da navbar única (substitui o initMobileNav copiado em cada página).
   Carregar com `defer` no <head>. */
(function () {
  function init() {
    var nav = document.querySelector('.hx-nav');
    if (!nav) return;
    var burger = nav.querySelector('.hx-burger');
    var tabs = nav.querySelector('.hx-tabs');
    var close = nav.querySelector('.hx-close');
    if (!burger || !tabs) return;
    var mq = window.matchMedia('(max-width:1139.98px)');

    function setOpen(open) {
      tabs.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('hx-nav-open', open);
    }

    burger.addEventListener('click', function () { setOpen(!tabs.classList.contains('is-open')); });
    if (close) close.addEventListener('click', function () { setOpen(false); });
    tabs.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target === tabs) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && tabs.classList.contains('is-open')) { setOpen(false); burger.focus(); }
    });
    var onChange = function () { if (!mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
