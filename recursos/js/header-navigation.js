function updateHeaderNavigation() {
  var path = window.location.pathname;
  var links = document.querySelectorAll(".header-nav a");

  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var linkPath = new URL(link.href, window.location.origin).pathname;
    var isCurrent = false;

    if (linkPath === "/") {
      isCurrent = path === "/";
    } else if (linkPath.indexOf("/calendarios/") === 0) {
      isCurrent = path.indexOf("/calendarios/") === 0;
    } else {
      isCurrent = path === linkPath;
    }

    if (isCurrent) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

document.addEventListener("DOMContentLoaded", updateHeaderNavigation);
document.addEventListener("htmx:afterSwap", function () {
  window.requestAnimationFrame(updateHeaderNavigation);
});
document.addEventListener("htmx:afterSettle", updateHeaderNavigation);
window.addEventListener("popstate", updateHeaderNavigation);
