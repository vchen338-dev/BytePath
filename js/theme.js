/* BytePath theme switch.
   Without this file the site still follows the device's light or dark setting.
   With it, the header button lets a visitor pick a theme and remembers the choice. */
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

  // Runs in <head>, before the page paints, so there is no flash of the wrong theme.
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

  // If the visitor never chose a theme, follow the device when its setting changes.
  if (media && media.addEventListener) {
    media.addEventListener('change', function () {
      if (!readSaved()) apply(systemTheme());
    });
  }
})();
