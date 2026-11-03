/* First-visit gate: the home page sends visitors to login.html unless they are signed in
   or chose "Continue without an account". Only the home page is gated; every other page stays open. */
(function () {
  var KEY = 'bytepath-guest', path = location.pathname;

  function chosenGuest() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function signedIn() { // supabase-js keeps its session under sb-<ref>-auth-token
    try {
      for (var i = 0; i < localStorage.length; i++) if (/^sb-.+-auth-token$/.test(localStorage.key(i))) return true;
    } catch (e) { /* storage blocked */ }
    return false;
  }

  if (/(^|\/)(index\.html)?$/.test(path)) {
    // #go (set after login or guest choice) stops a redirect loop if storage is blocked.
    if (!chosenGuest() && !signedIn() && location.hash !== '#go') location.replace('login.html');
    return;
  }

  if (/login\.html$/.test(path)) {
    document.addEventListener('DOMContentLoaded', function () {
      var b = document.getElementById('guest');
      if (!b) return;
      b.addEventListener('click', function () {
        try { localStorage.setItem(KEY, '1'); } catch (e) { /* see #go above */ }
        location.replace('index.html#go');
      });
    });
  }
})();
