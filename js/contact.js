(function () {
  var form = document.getElementById('contact-form');
  var statusEl = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');

  function show(text, type) {
    statusEl.textContent = text;
    statusEl.className = 'form-status ' + type;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending...';
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        show('Thank you! Your message has been sent. We will reply to your email soon.', 'ok');
        form.reset();
      })
      .catch(function () {
        show('Sorry, your message could not be sent. Please check your connection and try again.', 'error');
      })
      .then(function () {
        button.disabled = false;
        button.textContent = 'Send message';
      });
  });
})();
