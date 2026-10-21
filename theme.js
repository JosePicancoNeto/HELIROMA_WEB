/* theme.js — alternância claro/escuro (claro = padrão).
   Carregar no <head>, SEM defer/async, para aplicar o tema antes do primeiro paint.
   Escolha guardada em localStorage["heliroma_theme"] ("light" | "dark"), partilhada entre páginas. */
(function () {
  var KEY = 'heliroma_theme';
  var root = document.documentElement;

  function read() {
    try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; }
    catch (e) { return 'light'; }
  }
  function save(t) {
    try { localStorage.setItem(KEY, t); } catch (e) { /* modo privado / bloqueado */ }
  }

  function apply(t) {
    root.setAttribute('data-theme', t);
    var b = document.getElementById('themeToggle');
    if (!b) return;
    var dark = t === 'dark';
    var label = dark ? 'Ativar modo claro' : 'Ativar modo escuro';
    b.setAttribute('aria-pressed', dark ? 'true' : 'false');
    b.setAttribute('aria-label', label);
    b.title = label;
  }

  apply(read());

  var ICONS =
    '<svg class="ic-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
    '<svg class="ic-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  function mount() {
    if (document.getElementById('themeToggle')) return;
    // A etiqueta do canto superior direito existe em todas as páginas (nome de classe varia).
    var tag = document.querySelector('.nav-eyebrow, .eyebrow-tag');
    if (!tag || !tag.parentNode) return;

    var wrap = document.createElement('div');
    wrap.className = 'theme-right';

    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'themeToggle';
    b.className = 'theme-toggle';
    b.innerHTML = ICONS;
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      save(next);
      apply(next);
    });

    tag.parentNode.insertBefore(wrap, tag);
    wrap.appendChild(b);
    wrap.appendChild(tag);
    apply(read());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  // Mantém várias abas/páginas abertas em sincronia.
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(read()); });
})();
