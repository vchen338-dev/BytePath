/* BytePath login: Supabase Auth (bcrypt passwords, PKCE, rotating refresh tokens) + optional TOTP 2FA.
   Used by login.html and account.html (body[data-page]). All user text goes in with textContent, never innerHTML. */
(function () {
  var cfg = window.BYTEPATH_AUTH || {};
  var page = document.body.getAttribute('data-page');
  var $ = function (id) { return document.getElementById(id); };

  // [title, where "Resume course" goes: the first resource listed for the track]. Ids must match the CHECK in supabase/schema.sql.
  var TRACKS = {
    support: ["IT support basics", "https://www.coursera.org/professional-certificates/google-it-support"],
    networking: ["Networking fundamentals", "https://www.netacad.com/"],
    linux: ["Linux and the command line", "https://linuxjourney.com/"],
    sql: ["Databases and SQL", "https://sqlbolt.com/"],
    web: ["Web development basics", "https://developer.mozilla.org/en-US/docs/Learn_web_development"],
    python: ["Python for IT automation", "https://docs.python.org/3/tutorial/"],
    security: ["Cybersecurity fundamentals", "https://tryhackme.com/"],
    cloud: ["Cloud essentials", "https://skillbuilder.aws/"],
    devops: ["DevOps and automation", "https://roadmap.sh/devops"],
    programming: ["Programming fundamentals", "https://cs50.harvard.edu/x/"],
    math: ["Discrete math and logic", "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/"],
    algorithms: ["Data structures and algorithms", "https://algs4.cs.princeton.edu/home/"],
    architecture: ["Computer architecture", "https://www.nand2tetris.org/"],
    os: ["Operating systems", "https://pages.cs.wisc.edu/~remzi/OSTEP/"],
    engineering: ["Software engineering", "https://missing.csail.mit.edu/"],
    theory: ["Theory of computation", "https://ocw.mit.edu/courses/6-045j-automata-computability-and-complexity-spring-2011/"],
    ai: ["AI and machine learning basics", "https://developers.google.com/machine-learning/crash-course"],
    ba: ["Business analysis basics", "https://www.iiba.org/"],
    sad: ["Systems analysis and design", "https://www.uml-diagrams.org/"],
    model: ["Data modeling and database design", "https://dbdiagram.io/"],
    erp: ["ERP and business processes", "https://learning.sap.com/"],
    analytics: ["Data analytics and dashboards", "https://www.coursera.org/professional-certificates/google-data-analytics"],
    itpm: ["IT project management and governance", "https://scrumguides.org/"]
  };

  function say(id, text, type) {
    var el = $(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'form-status' + (text ? ' ' + (type || 'error') : '');
  }

  // 12-72 chars (bcrypt ignores everything past 72 bytes), all four classes, not your email.
  function passwordProblem(pw, email) {
    if (pw.length < 12) return 'Use at least 12 characters.';
    if (new TextEncoder().encode(pw).length > 72) return 'Use at most 72 bytes (about 72 characters).';
    if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      return 'Mix lowercase, uppercase, a number and a symbol.';
    }
    var local = (email || '').split('@')[0].toLowerCase();
    if (local.length > 2 && pw.toLowerCase().indexOf(local) !== -1) return 'Do not include your email name in the password.';
    return '';
  }

  if (!window.supabase || !cfg.url || !cfg.anonKey || /YOUR-/.test(cfg.url + cfg.anonKey)) {
    say('msg', 'Login is not set up yet. Add your Supabase URL and anon key to js/config.js.', 'error');
    return;
  }

  var sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  var home = location.origin + location.pathname.replace(/[^/]*$/, '') + 'account.html';

  // Client-side brake for the UX only; the real rate limits are enforced by Supabase.
  var fails = 0, lockedUntil = 0;
  function locked() {
    if (Date.now() < lockedUntil) {
      say('msg', 'Too many attempts. Wait ' + Math.ceil((lockedUntil - Date.now()) / 1000) + ' seconds.', 'error');
      return true;
    }
    return false;
  }
  function failed() { if (++fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0; } }

  function aal() { return sb.auth.mfa.getAuthenticatorAssuranceLevel().then(function (r) { return r.data || {}; }); }

  function busy(form, on) {
    Array.prototype.forEach.call(form.querySelectorAll('button'), function (b) { b.disabled = on; });
  }

  /* ---------------- login.html ---------------- */
  function loginPage() {
    var forms = { login: $('login-form'), signup: $('signup-form'), forgot: $('forgot-form'), mfa: $('mfa-form') };
    function show(name) {
      Object.keys(forms).forEach(function (k) { forms[k].hidden = k !== name; });
      say('msg', '');
      var first = forms[name].querySelector('input');
      if (first) first.focus();
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-show]'), function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-show')); });
    });

    var factorId = null;
    function next() {
      return aal().then(function (a) {
        if (a.nextLevel === 'aal2' && a.currentLevel !== 'aal2') {
          return sb.auth.mfa.listFactors().then(function (r) {
            var f = r.data && r.data.totp && r.data.totp[0];
            if (!f) throw new Error('no factor');
            factorId = f.id;
            show('mfa');
          });
        }
        location.replace('account.html');
      });
    }

    forms.login.addEventListener('submit', function (e) {
      e.preventDefault();
      if (locked()) return;
      busy(forms.login, true);
      sb.auth.signInWithPassword({ email: $('login-email').value.trim(), password: $('login-pw').value })
        .then(function (r) {
          if (r.error) { failed(); say('msg', 'Wrong email or password, or the email is not confirmed yet.'); return; }
          return next();
        })
        .catch(function () { say('msg', 'Could not log in. Try again.'); })
        .then(function () { busy(forms.login, false); });
    });

    forms.mfa.addEventListener('submit', function (e) {
      e.preventDefault();
      if (locked()) return;
      busy(forms.mfa, true);
      sb.auth.mfa.challengeAndVerify({ factorId: factorId, code: $('mfa-code').value.trim() })
        .then(function (r) {
          if (r.error) { failed(); say('msg', 'That code is not valid. Codes change every 30 seconds.'); return; }
          location.replace('account.html');
        })
        .catch(function () { say('msg', 'Could not verify the code. Try again.'); })
        .then(function () { busy(forms.mfa, false); });
    });

    forms.signup.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('signup-email').value.trim(), pw = $('signup-pw').value;
      var problem = passwordProblem(pw, email) || (pw !== $('signup-pw2').value ? 'The two passwords do not match.' : '');
      if (problem) { say('msg', problem); return; }
      busy(forms.signup, true);
      sb.auth.signUp({ email: email, password: pw, options: { emailRedirectTo: home } })
        .then(function (r) {
          if (r.error && r.error.status !== 422) throw r.error;
          // Same answer whether or not the address is already registered, so it cannot be probed.
          if (r.data && r.data.session) { location.replace('account.html'); return; }
          forms.signup.reset();
          say('msg', 'Check your inbox. If this address can be registered, a confirmation link is on its way.', 'ok');
        })
        .catch(function () { say('msg', 'Could not create the account. Try again in a minute.'); })
        .then(function () { busy(forms.signup, false); });
    });

    forms.forgot.addEventListener('submit', function (e) {
      e.preventDefault();
      busy(forms.forgot, true);
      sb.auth.resetPasswordForEmail($('forgot-email').value.trim(), { redirectTo: home })
        .then(function () {
          say('msg', 'If an account exists for that address, a reset link is on its way.', 'ok');
        })
        .catch(function () { say('msg', 'Could not send the email. Try again in a minute.'); })
        .then(function () { busy(forms.forgot, false); });
    });

    // Already signed in (or half-way through 2FA)? Skip ahead.
    sb.auth.getSession().then(function (r) { if (r.data && r.data.session) return next(); }).catch(function () {});
  }

  /* ---------------- account.html ---------------- */
  function accountPage() {
    var userId, done = [], current = null;

    function toLogin() { location.replace('login.html'); }

    function save() {
      $('count').textContent = done.length;
      sb.from('progress').upsert({ user_id: userId, tracks: done, current: current, updated_at: new Date().toISOString() })
        .then(function (r) { say('progress-msg', r.error ? 'Could not save. Try again.' : 'Saved.', r.error ? 'error' : 'ok'); });
    }

    function renderRecent() {
      var has = current && TRACKS[current];
      $('recent-empty').hidden = !!has;
      $('recent').hidden = !has;
      if (!has) return;
      $('recent-title').textContent = TRACKS[current][0];
      $('resume').href = TRACKS[current][1];
    }

    function renderTracks() {
      var ul = $('tracks');
      ul.textContent = '';
      Object.keys(TRACKS).forEach(function (id) {
        var li = document.createElement('li');
        var label = document.createElement('label');
        var box = document.createElement('input');
        box.type = 'checkbox'; box.value = id; box.checked = done.indexOf(id) !== -1;
        label.appendChild(box);
        label.appendChild(document.createTextNode(' ' + TRACKS[id][0]));
        li.appendChild(label);
        if (!box.checked) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'btn-link'; b.setAttribute('data-current', id);
          b.textContent = current === id ? 'Current' : 'Make current';
          b.disabled = current === id;
          li.appendChild(b);
        }
        ul.appendChild(li);
      });
      $('count').textContent = done.length;
      $('total').textContent = Object.keys(TRACKS).length;
      renderRecent();
    }

    function markDone(id) {
      if (done.indexOf(id) === -1) done.push(id);
      if (current === id) current = null;
    }

    $('tracks').addEventListener('change', function (e) {
      var id = e.target.value;
      if (e.target.checked) markDone(id); else done = done.filter(function (x) { return x !== id; });
      save(); renderTracks();
    });
    $('tracks').addEventListener('click', function (e) {
      var id = e.target.getAttribute && e.target.getAttribute('data-current');
      if (!id) return;
      current = id; save(); renderTracks();
    });
    $('mark-done').addEventListener('click', function () { markDone(current); save(); renderTracks(); });

    function refreshMfa() {
      return sb.auth.mfa.listFactors().then(function (r) {
        var on = !!(r.data && r.data.totp && r.data.totp.length);
        $('mfa-on').hidden = !on; $('mfa-off').hidden = on; $('mfa-setup').hidden = true;
        $('mfa-disable').setAttribute('data-id', on ? r.data.totp[0].id : '');
      });
    }

    $('mfa-start').addEventListener('click', function () {
      this.disabled = true;
      var btn = this;
      // Remove abandoned, never-verified factors first or enroll() fails on the duplicate name.
      sb.auth.mfa.listFactors().then(function (r) {
        var stale = ((r.data && r.data.all) || []).filter(function (f) { return f.status !== 'verified'; });
        return Promise.all(stale.map(function (f) { return sb.auth.mfa.unenroll({ factorId: f.id }); }));
      }).then(function () {
        return sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'BytePath' });
      }).then(function (r) {
        if (r.error) throw r.error;
        $('qr').src = r.data.totp.qr_code;
        $('secret').textContent = r.data.totp.secret;
        $('mfa-setup').setAttribute('data-id', r.data.id);
        $('mfa-setup').hidden = false;
        $('mfa-code').focus();
      }).catch(function () { say('mfa-msg', 'Could not start 2FA setup. Try again.'); })
        .then(function () { btn.disabled = false; });
    });

    $('mfa-verify').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.auth.mfa.challengeAndVerify({ factorId: $('mfa-setup').getAttribute('data-id'), code: $('mfa-code').value.trim() })
        .then(function (r) {
          if (r.error) { say('mfa-msg', 'That code is not valid. Codes change every 30 seconds.'); return; }
          $('mfa-code').value = '';
          say('mfa-msg', 'Two-factor login is on.', 'ok');
          return refreshMfa();
        });
    });

    $('mfa-disable').addEventListener('click', function () {
      if (!confirm('Turn off two-factor login? Your account will be less safe.')) return;
      sb.auth.mfa.unenroll({ factorId: this.getAttribute('data-id') }).then(function (r) {
        if (r.error) { say('mfa-msg', 'Could not turn it off. Try again.'); return; }
        // The session was AAL2; refresh so it drops back to a plain session.
        say('mfa-msg', 'Two-factor login is off.', 'ok');
        return sb.auth.refreshSession().then(refreshMfa);
      });
    });

    $('pw-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = $('new-pw').value;
      var problem = passwordProblem(pw, $('who').textContent) || (pw !== $('new-pw2').value ? 'The two passwords do not match.' : '');
      if (problem) { say('pw-msg', problem); return; }
      sb.auth.updateUser({ password: pw }).then(function (r) {
        if (r.error) { say('pw-msg', 'Could not change the password. If it is the same as the old one, pick a new one.'); return; }
        $('pw-form').reset();
        say('pw-msg', 'Password changed.', 'ok');
      });
    });

    function signOut(scope) { sb.auth.signOut({ scope: scope }).then(toLogin, toLogin); }
    $('logout').addEventListener('click', function () { signOut('local'); });
    $('logout-all').addEventListener('click', function () { signOut('global'); });

    sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) return toLogin();
      return aal().then(function (a) {
        if (a.nextLevel === 'aal2' && a.currentLevel !== 'aal2') return toLogin(); // password only: finish 2FA first
        userId = s.user.id;
        $('who').textContent = s.user.email;
        $('app').hidden = false;
        return Promise.all([
          sb.from('progress').select('tracks,current').maybeSingle(),
          refreshMfa()
        ]).then(function (res) {
          done = (res[0].data && res[0].data.tracks) || [];
          current = (res[0].data && res[0].data.current) || null;
          renderTracks();
        });
      });
    }).catch(function () { say('msg', 'Could not load your account. Refresh the page.'); });
  }

  if (page === 'login') loginPage();
  if (page === 'account') accountPage();
})();
