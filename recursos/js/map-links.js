(function () {
  var fallbackDelay = 1200;
  var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-geo-url]");
    if (!link || !isMobile || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    var geoUrl = link.dataset.geoUrl;
    var fallbackUrl = link.href;
    if (!geoUrl || !fallbackUrl) return;

    event.preventDefault();
    var appOpened = document.hidden;
    var timer;

    function cleanup() {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearTimeout(timer);
    }

    function onVisibilityChange() {
      if (document.hidden) {
        appOpened = true;
        cleanup();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    timer = window.setTimeout(function () {
      cleanup();
      if (!appOpened && !document.hidden) {
        window.location.assign(fallbackUrl);
      }
    }, fallbackDelay);
    window.location.assign(geoUrl);
  });
})();
