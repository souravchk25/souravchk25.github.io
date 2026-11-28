/* Talks and Teaching panels: play a recording in a small in-page player.
   data-video is an .mp4 path or youtube:VIDEO_ID (set in _data/talks.yml). */
(function () {
  var dlg = document.getElementById('talk-player');
  if (!dlg || typeof dlg.showModal !== 'function') return; // old browsers just follow the link
  var body = dlg.querySelector('.tp-body'), title = dlg.querySelector('.tp-title');

  function open(src, poster, name) {
    body.textContent = '';
    if (src.indexOf('youtube:') === 0) {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(src.slice(8)) + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.title = name;
      body.appendChild(f);
    } else {
      var v = document.createElement('video');
      v.controls = true; v.autoplay = true; v.preload = 'metadata'; v.playsInline = true;
      if (poster) v.poster = poster;
      v.src = src;
      body.appendChild(v);
    }
    title.textContent = name;
    dlg.showModal();
  }
  function close() { dlg.close(); }
  dlg.addEventListener('close', function () { body.textContent = ''; }); // stops playback
  dlg.querySelector('.tp-close').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); }); // click on the backdrop

  // delegated, so it also covers panels after this script (Teaching's lectures)
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('.panel [data-video]');
    if (!el) return;
    e.preventDefault();
    open(el.getAttribute('data-video'), el.getAttribute('data-poster'), el.getAttribute('data-title'));
  });
})();
