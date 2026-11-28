/* Email menu under the name: close it on outside click or Escape, and copy an address on request. */
(function () {
  var menus = document.querySelectorAll('details.mail');
  if (!menus.length) return;
  document.addEventListener('click', function (e) {
    menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') menus.forEach(function (d) { if (d.open) { d.open = false; d.querySelector('summary').focus(); } });
  });
  document.querySelectorAll('.mail-copy').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy');
      function done(ok) { b.textContent = ok ? 'Copied' : 'Select'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      else {
        var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (err) {} t.remove(); done(ok);
      }
    });
  });
})();
