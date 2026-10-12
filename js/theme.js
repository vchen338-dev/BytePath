(function () {
  var KEY = 'bytepath-theme';
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function readSaved() {
    try {
      var value = localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* storage blocked: the choice lasts for this page only */ }
  }

  function systemTheme() {
    return media && media.matches ? 'dark' : 'light';
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var button = document.querySelector('.theme-toggle');
    if (button) button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  root.classList.add('js');
  apply(readSaved() || systemTheme());

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    apply(root.getAttribute('data-theme'));
    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      save(next);
    });
  });

  if (media && media.addEventListener) {
    media.addEventListener('change', function () {
      if (!readSaved()) apply(systemTheme());
    });
  }
})();
