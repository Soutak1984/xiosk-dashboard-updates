let xiosk = {
  // ... all your original methods unchanged ...

  // Add these new methods
  async login(password) {
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('xiosk_logged_in', 'true');
        localStorage.setItem('xiosk_login_time', Date.now().toString());
        $('#login-screen').addClass('d-none');
        $('#main-app').removeClass('d-none');
        xiosk.checkStatus();
      } else {
        $('#login-error').text(data.error || "Login failed").removeClass('d-none');
      }
    } catch (err) {
      $('#login-error').text("Connection error").removeClass('d-none');
    }
  },

  async changePassword(current, newPass, confirm) {
    if (newPass !== confirm) {
      $('#change-password-error').text("New passwords do not match").removeClass('d-none');
      return;
    }
    if (newPass.length < 6) {
      $('#change-password-error').text("New password must be at least 6 characters").removeClass('d-none');
      return;
    }

    try {
      const res = await fetch('/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current, newPassword: newPass })
      });
      const data = await res.json();
      if (data.success) {
        $('#change-password-success').text("Password updated successfully").removeClass('d-none');
        $('#change-password-error').addClass('d-none');
        setTimeout(() => bootstrap.Modal.getInstance($('#changePasswordModal')[0]).hide(), 1800);
      } else {
        $('#change-password-error').text(data.error || "Failed to update password").removeClass('d-none');
      }
    } catch (err) {
      $('#change-password-error').text("Connection error").removeClass('d-none');
    }
  }
};

$(document).ready(() => {
  // Check if already logged in (simple client-side check)
  const loggedIn = localStorage.getItem('xiosk_logged_in') === 'true';
  const loginTime = parseInt(localStorage.getItem('xiosk_login_time') || '0');
  const oneDay = 24 * 60 * 60 * 1000;

  if (loggedIn && Date.now() - loginTime < oneDay) {
    $('#login-screen').addClass('d-none');
    $('#main-app').removeClass('d-none');
    $.getJSON('/config').done(xiosk.renderPage).fail(xiosk.showStatus);
    xiosk.checkStatus();
  } else {
    // Show login – clear old session
    localStorage.removeItem('xiosk_logged_in');
    localStorage.removeItem('xiosk_login_time');
  }

  // Login form submit
  $('#login-form').on('submit', function(e) {
    e.preventDefault();
    const password = $('#password').val().trim();
    if (password) xiosk.login(password);
  });

  // Change password modal
  $('#btn-change-password').on('click', () => {
    $('#change-password-form')[0].reset();
    $('#change-password-error, #change-password-success').addClass('d-none');
    new bootstrap.Modal($('#changePasswordModal')[0]).show();
  });

  $('#change-password-form').on('submit', function(e) {
    e.preventDefault();
    const current = $('#current-password').val().trim();
    const newPass = $('#new-password').val().trim();
    const confirm = $('#new-password-confirm').val().trim();
    xiosk.changePassword(current, newPass, confirm);
  });

  // ── Your original ready code ─────────────────────────────────────
  $('#add-url').on('click', xiosk.addNewUrl);
  $('#new-url').on('keyup', (e) => { if (e.key === 'Enter') xiosk.addNewUrl(); });

  $('#urls').on('click', 'button.btn-close', (e) => {
    $(e.target).closest('li.list-group-item').remove();
  });

  $('#execute').on('click', function(e) {
    // ... your original execute handler (unchanged) ...
    const $btn = $(this);
    xiosk.toggleLoading($btn, true, "Applying...");

    let config = {};
    config.urls = [];
    $('li.list-group-item').each((index, item) => {
      const url = $(item).find('a').attr('href');
      const duration = parseInt($(item).find('.duration-input').val()) || 10;
      const cycles = parseInt($(item).find('.cycles-input').val()) ?? 10;

      config.urls.push({ url, duration, cycles });
    });

    $.ajax({
      url: '/config',
      type: 'POST',
      data: JSON.stringify(config),
      contentType: "application/json; charset=utf-8",
      success: (data) => xiosk.showStatus({ status: 200, responseText: data }),
      error: xiosk.showStatus,
      complete: () => xiosk.toggleLoading($btn, false)
    });
  });

  $('#toggle-kiosk').on('click', function() {
    // ... your original toggle-kiosk handler (unchanged) ...
  });
});